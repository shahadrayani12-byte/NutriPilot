import { getWorkflowNextAction, getWorkflowStatus } from "./workflowStatus.js";

export const NUTRITION_CARE_STATUSES = {
  completed: "Completed",
  escalated: "Escalated",
  inProgress: "In Progress",
  needsReview: "Needs Review",
  notStarted: "Not Started",
  overdue: "Overdue",
};

export const NUTRITION_CARE_JOURNEY_STAGES = [
  {
    id: "screening",
    label: "Screening",
    tabId: "summary",
    requirements: ["Nutrition risk level", "Primary diagnosis", "Initial patient context"],
    workflowStepIds: ["summary"],
  },
  {
    id: "assessment",
    label: "Assessment",
    tabId: "anthropometric",
    requirements: ["Anthropometrics", "Laboratory review", "Dietary assessment", "Medical history"],
    workflowStepIds: ["assessment", "labs", "dietary", "medical"],
  },
  {
    id: "nutrition-diagnosis",
    label: "Nutrition Diagnosis",
    tabId: "pes",
    requirements: ["PES diagnosis", "Signs and symptoms", "Clinical priority"],
    workflowStepIds: ["pes"],
  },
  {
    id: "goals-care-plan",
    label: "Goals & Care Plan",
    tabId: "intervention",
    requirements: ["Nutrition goals", "Care plan", "Diet plan draft or active plan"],
    workflowStepIds: ["intervention", "dietPlan"],
  },
  {
    id: "intervention",
    label: "Intervention",
    tabId: "intervention",
    requirements: ["Diet prescription", "Education", "Supplements or referrals where recorded"],
    workflowStepIds: ["intervention", "dietPlan"],
  },
  {
    id: "monitoring-outcomes",
    label: "Monitoring & Outcomes",
    tabId: "monitoring",
    requirements: ["Follow-up date", "Outcome measures", "Treatment response"],
    workflowStepIds: ["monitoring"],
  },
  {
    id: "review-discharge",
    label: "Review / Discharge",
    tabId: "reports",
    requirements: ["Clinician review", "Report readiness", "Discharge or review note"],
    workflowStepIds: ["ai", "reports"],
  },
];

export const NUTRITION_REFERRAL_DESTINATIONS = [
  "Physician",
  "Nurse",
  "Speech Therapy",
  "Pharmacy",
  "Social Work",
  "Psychology",
  "Diabetes Educator",
  "Research Coordinator",
];

export const NUTRITION_REFERRAL_STATUSES = [
  "Draft",
  "Pending",
  "Sent",
  "Acknowledged",
  "In Review",
  "Completed",
  "Closed",
];

export const NUTRITION_PATHWAY_DEFINITIONS = [
  {
    id: "iron-deficiency",
    label: "Iron Deficiency Nutrition Pathway",
    stages: [
      "Screening",
      "Lab Review",
      "Intake Assessment",
      "Contributing-factor Review",
      "PES Diagnosis",
      "Intervention",
      "Adherence Monitoring",
      "Lab Reassessment",
      "Outcome Review",
    ],
  },
  { id: "diabetes", label: "Diabetes Nutrition Pathway", stages: [] },
  { id: "renal", label: "Renal Nutrition Pathway", stages: [] },
  { id: "ibs", label: "GI Symptom Nutrition Pathway", stages: [] },
  { id: "malnutrition", label: "Malnutrition Risk Pathway", stages: [] },
  { id: "weight-management", label: "Weight Management Pathway", stages: [] },
];

const PLACEHOLDER_VALUES = new Set(["", "n/a", "na", "none", "not recorded", "unavailable", "missing", "placeholder", "pending placeholder"]);

export function buildNutritionCareCore(patient, sharedWorkflow = null) {
  const normalizedPatient = patient || {};
  const workflow = sharedWorkflow || getWorkflowStatus(normalizedPatient);
  const outcomes = buildOutcomeTracking(normalizedPatient);
  const journey = buildNutritionCareJourney(normalizedPatient, workflow, outcomes);
  const profile = buildNutritionDigitalProfile(normalizedPatient);
  const alerts = detectNutritionNonResponse(normalizedPatient, outcomes, journey);
  const intelligenceSummary = buildNutritionIntelligenceSummary(normalizedPatient, journey, profile, outcomes, alerts);
  const referrals = buildNutritionReferrals(normalizedPatient);
  const previousNoteDraft = createPreviousNoteDraft(normalizedPatient);
  const ironPathway = buildIronDeficiencyPathway(normalizedPatient, journey, profile);

  return {
    alerts,
    audit: buildAuditMetadata(normalizedPatient),
    intelligenceSummary,
    ironPathway,
    journey,
    outcomes,
    previousNoteDraft,
    profile,
    referrals,
    workflow,
  };
}

export function buildNutritionCareJourney(patient, workflow = getWorkflowStatus(patient), outcomes = null) {
  const nextAction = getWorkflowNextAction(patient);
  const stageRows = NUTRITION_CARE_JOURNEY_STAGES.map((stage) => {
    const linkedSteps = stage.workflowStepIds
      .map((stepId) => workflow.steps.find((step) => step.id === stepId))
      .filter(Boolean);
    const missingRequirements = stage.requirements.filter((requirement) => isRequirementMissing(patient, requirement, workflow));
    const overdueItems = buildOverdueItems(patient, stage, outcomes);
    const status = deriveStageStatus(linkedSteps, missingRequirements, overdueItems);

    return {
      ...stage,
      completed: status === NUTRITION_CARE_STATUSES.completed,
      lastUpdate: resolveLastUpdated(patient),
      missingRequirements,
      overdueItems,
      responsibleClinician: patient?.responsibleClinician || patient?.preparedBy || "Clinical Dietitian",
      reviewStatus: patient?.reviewStatus || (status === NUTRITION_CARE_STATUSES.needsReview ? "Needs Review" : "Pending review"),
      status,
    };
  });
  const currentStage = stageRows.find((stage) => stage.status !== NUTRITION_CARE_STATUSES.completed) || stageRows[stageRows.length - 1];
  const completedStages = stageRows.filter((stage) => stage.status === NUTRITION_CARE_STATUSES.completed);

  return {
    completedStages,
    currentStage,
    lastUpdate: resolveLastUpdated(patient),
    missingRequirements: stageRows.flatMap((stage) => stage.missingRequirements.map((item) => ({ stage: stage.label, item }))),
    nextExpectedAction: {
      actionLabel: nextAction.actionLabel || "Open next workflow step",
      label: nextAction.label || currentStage?.label || "Review nutrition care workflow",
      reason: nextAction.reason || "Derived from the current shared workflow state.",
      tabId: nextAction.tabId || currentStage?.tabId || "summary",
    },
    overdueItems: stageRows.flatMap((stage) => stage.overdueItems.map((item) => ({ stage: stage.label, item }))),
    percent: Math.round((completedStages.length / stageRows.length) * 100),
    reviewStatus: patient?.reviewStatus || "Needs Review",
    stages: stageRows,
  };
}

export function buildNutritionDigitalProfile(patient) {
  const domains = [
    createProfileDomain("Demographics", [
      ["Full name", patient?.fullName || patient?.name, "Patient Record"],
      ["MRN", patient?.mrn, "Patient Record"],
      ["Age", patient?.age, "Patient Record"],
      ["Gender", patient?.gender || patient?.sex, "Patient Record"],
    ]),
    createProfileDomain("Clinical Context", [
      ["Diagnosis", patient?.diagnosis, "Clinical Hub"],
      ["Medical history", patient?.medicalHistory, "Medical History"],
      ["Medications", collectionSummary(patient?.medications, ["name", "dose"]), "Medical History"],
      ["Allergies", collectionSummary(patient?.allergies, ["name", "reaction"]), "Medical History"],
    ]),
    createProfileDomain("Anthropometrics", [
      ["Height", patient?.height, "Anthropometric Assessment"],
      ["Weight", patient?.weight, "Anthropometric Assessment"],
      ["BMI", patient?.bmi, "Anthropometric Assessment"],
      ["Weight history", patient?.weightHistory, "Anthropometric Assessment"],
    ]),
    createProfileDomain("Laboratory", [
      ["Ferritin", readLab(patient, "Ferritin")?.displayValue, "Laboratory Results"],
      ["Hemoglobin", readLab(patient, "Hemoglobin")?.displayValue, "Laboratory Results"],
      ["Vitamin D", readLab(patient, "Vitamin D")?.displayValue, "Laboratory Results"],
      ["Albumin", readLab(patient, "Albumin")?.displayValue, "Laboratory Results"],
    ]),
    createProfileDomain("Dietary & Function", [
      ["Dietary intake", patient?.dietaryRecall || patient?.dietaryNotes, "Dietary Assessment"],
      ["Appetite", patient?.appetite, "Dietary Assessment"],
      ["GI symptoms", patient?.giSymptoms || patient?.symptoms?.gi, "Dietary Assessment"],
      ["Chewing / swallowing", patient?.chewingSwallowing || patient?.oralSymptoms, "Dietary Assessment"],
      ["Food access", patient?.foodAccess, "Dietary Assessment"],
      ["Physical activity", patient?.physicalActivity, "Nutrition Assessment"],
      ["Supplements", patient?.supplements, "Dietary Assessment"],
    ]),
    createProfileDomain("Nutrition Care Plan", [
      ["PES diagnosis", collectionSummary(patient?.diagnoses, ["problem", "etiology", "signs"]) || patient?.diagnosis, "Nutrition Diagnosis (PES)"],
      ["Intervention", collectionSummary(patient?.interventions, ["goal", "dietPrescription", "education"]), "Nutrition Intervention"],
      ["Monitoring", collectionSummary(patient?.followUps, ["date", "outcome", "nextAction"]), "Monitoring & Evaluation"],
      ["Goals", patient?.nutritionGoals || activeDietPlan(patient)?.clinicalGoal, "Diet Plan"],
      ["Notes", patient?.notes || patient?.clinicalNotes, "Clinical Notes"],
    ]),
  ];

  return {
    domains,
    recordedCount: domains.flatMap((domain) => domain.fields).filter((field) => field.status === "Recorded").length,
    totalCount: domains.flatMap((domain) => domain.fields).length,
  };
}

export function buildOutcomeTracking(patient) {
  const weight = makeOutcome("Weight", patient?.baselineWeight, patient?.weight, activeDietPlan(patient)?.targetWeight, "kg", "Anthropometric Assessment");
  const bmi = makeOutcome("BMI", patient?.baselineBmi, patient?.bmi, patient?.targetBmi, "", "Anthropometric Assessment");
  const intake = makeOutcome("Oral intake", patient?.baselineOralIntake, patient?.oralIntake || patient?.dietaryRecall, patient?.oralIntakeTarget, "", "Dietary Assessment");
  const protein = makeOutcome("Protein target achievement", patient?.baselineProteinAchievement, patient?.proteinAchievement || activeDietPlan(patient)?.targets?.protein, activeDietPlan(patient)?.targets?.protein, "g", "Diet Plan");

  return [
    weight,
    bmi,
    makeOutcome("Weight change %", patient?.baselineWeightChangePercent, patient?.weightChange, patient?.targetWeightChange, "%", "Anthropometric Assessment"),
    intake,
    makeOutcome("Energy target achievement", patient?.baselineEnergyAchievement, patient?.energyAchievement || activeDietPlan(patient)?.targets?.energy, activeDietPlan(patient)?.targets?.energy, "kcal", "Diet Plan"),
    protein,
    makeOutcome("Hydration", patient?.baselineHydration, patient?.fluidIntake || activeDietPlan(patient)?.targets?.fluid, activeDietPlan(patient)?.targets?.fluid, "mL", "Dietary Assessment"),
    makeOutcome("GI symptoms", patient?.baselineGiSymptoms, patient?.giSymptoms || patient?.symptoms?.gi, patient?.targetGiSymptoms, "", "Dietary Assessment"),
    makeOutcome("Appetite", patient?.baselineAppetite, patient?.appetite, patient?.targetAppetite, "", "Dietary Assessment"),
    labOutcome(patient, "Ferritin", "Ferritin"),
    labOutcome(patient, "Hemoglobin", "Hemoglobin"),
    labOutcome(patient, "Vitamin D", "Vitamin D"),
    labOutcome(patient, "Glucose / HbA1c", "HbA1c"),
    labOutcome(patient, "Renal markers", "Creatinine"),
    makeOutcome("Functional measures", patient?.baselineFunctionalMeasures, patient?.functionalMeasures || patient?.physicalActivity, patient?.targetFunctionalMeasures, "", "Monitoring & Evaluation"),
    makeOutcome("Patient goals", patient?.baselinePatientGoals, patient?.patientGoals || activeDietPlan(patient)?.clinicalGoal, patient?.targetPatientGoals, "", "Diet Plan"),
    makeOutcome("Adherence", patient?.baselineAdherence, patient?.dietaryAdherence || activeDietPlan(patient)?.activityGoals?.adherenceStatus, patient?.targetAdherence, "", "Monitoring & Evaluation"),
  ];
}

export function detectNutritionNonResponse(patient, outcomes, journey) {
  const alerts = [];
  const monitoringRecords = sortClinicalRecords([...asArray(patient?.monitoringEntries), ...asArray(patient?.followUps)]);
  const recentComparableRecords = monitoringRecords.filter(hasComparableResponse).slice(0, 3);
  const symptomScores = monitoringRecords
    .map((record) => record.symptomScore || record.symptomTrend || record.symptoms)
    .filter(hasValue)
    .slice(0, 3);

  if (recentComparableRecords.length === 3 && noRecordedFollowUpImprovement(recentComparableRecords)) {
    alerts.push(createReviewAlert("No documented improvement across 3 consecutive follow-ups", "The latest comparable follow-up records explicitly describe unchanged or non-improving response.", recentComparableRecords));
  }
  if (symptomScores.length === 3 && symptomScores.every((score) => String(score) === String(symptomScores[0]))) {
    alerts.push(createReviewAlert("Repeated identical symptom score", "The latest three comparable symptom entries are unchanged and require clinician review.", symptomScores));
  }
  if (journey.overdueItems.length) {
    alerts.push(createReviewAlert("Overdue workflow review", "One or more expected review dates are overdue.", journey.overdueItems));
  }
  if (!monitoringRecords.length) {
    alerts.push(createReviewAlert("Missed monitoring", "No monitoring records are available for this active patient.", []));
  }
  if (isLabReassessmentDue(patient)) {
    alerts.push(createReviewAlert("Laboratory reassessment missing", "A lab-dependent workflow needs review, but no recent reassessment date is recorded.", ["Laboratory Results"]));
  }

  return alerts;
}

export function createPreviousNoteDraft(patient) {
  const sourceNote = latestNote(patient);
  if (!sourceNote) {
    return {
      available: false,
      label: "Use Previous Note as Draft",
      reviewRequired: ["Symptoms", "Intake", "Weight", "Adherence", "Intervention response", "Next plan"],
    };
  }

  return {
    available: true,
    copiedFields: Object.keys(sourceNote).filter((key) => hasValue(sourceNote[key])),
    label: "Use Previous Note as Draft",
    reviewRequired: ["Symptoms", "Intake", "Weight", "Adherence", "Intervention response", "Next plan"],
    safeguards: [
      "Previous note remains unchanged.",
      "Copied fields are marked for clinician review.",
      "Final note cannot be identical to the source note.",
    ],
    sourceDate: sourceNote.date || sourceNote.visitDate || sourceNote.updatedAt || "Date not recorded",
    sourceNote,
  };
}

export function buildNutritionReferrals(patient) {
  return asArray(patient?.nutritionReferrals).map((referral, index) => ({
    attachments: referral.attachments || [],
    concern: referral.concern || referral.reason || "Concern not recorded",
    destination: referral.destination || referral.recipient || "Recipient not recorded",
    id: referral.id || `nutrition-referral-${index}`,
    outcome: referral.outcome || "",
    reason: referral.reason || "",
    recipient: referral.recipient || "",
    requestedAction: referral.requestedAction || "",
    response: referral.response || "",
    sender: referral.sender || "Clinical Dietitian",
    status: NUTRITION_REFERRAL_STATUSES.includes(referral.status) ? referral.status : "Draft",
    summary: referral.summary || "",
    urgency: referral.urgency || "Routine",
  }));
}

export function createNutritionReferralDraft(destination = "Physician") {
  return {
    attachments: [],
    concern: "",
    destination,
    outcome: "",
    reason: "",
    recipient: "",
    requestedAction: "",
    response: "",
    sender: "Clinical Dietitian",
    status: "Draft",
    summary: "",
    urgency: "Routine",
  };
}

export function buildIronDeficiencyPathway(patient, journey, profile) {
  const labs = ["Ferritin", "Hemoglobin", "Serum Iron", "TIBC", "Transferrin Saturation"].map((label) => readLab(patient, label));
  const hasIronDiagnosis = String(patient?.diagnosis || "").toLowerCase().includes("iron");
  const stages = NUTRITION_PATHWAY_DEFINITIONS[0].stages.map((stage) => {
    const status = deriveIronStageStatus(stage, { hasIronDiagnosis, journey, labs, patient, profile });
    return {
      label: stage,
      status,
    };
  });

  return {
    applicable: hasIronDiagnosis || labs.some((lab) => hasValue(lab?.value)),
    id: "iron-deficiency",
    label: "Iron Deficiency Nutrition Pathway",
    safety: "Demo pathway structure only - clinician review required.",
    stages,
  };
}

function buildNutritionIntelligenceSummary(patient, journey, profile, outcomes, alerts) {
  const nextAction = journey.nextExpectedAction;
  const primaryConcern = patient?.diagnosis || firstRecorded(profile, "Diagnosis") || "Primary concern not recorded";
  const labContext = outcomes
    .filter((outcome) => ["Ferritin", "Hemoglobin", "Vitamin D", "Glucose / HbA1c", "Renal markers"].includes(outcome.label))
    .filter((outcome) => outcome.status !== "Missing")
    .slice(0, 3);

  return {
    disclaimer: "Clinical decision support only - clinician review and approval required.",
    intervention: collectionSummary(patient?.interventions, ["goal", "dietPrescription"]) || activeDietPlan(patient)?.title || "Intervention not recorded",
    intakeConcern: patient?.dietaryRecall || patient?.dietaryNotes || "Intake concern not recorded",
    labContext,
    missingCriticalInformation: journey.missingRequirements.slice(0, 5),
    nextWorkflowAction: nextAction,
    nutritionDiagnosis: collectionSummary(patient?.diagnoses, ["problem"]) || "Nutrition diagnosis not recorded",
    primaryNutritionConcern: primaryConcern,
    risk: patient?.riskLevel || patient?.risk || "Risk not classified",
    treatmentResponse: alerts.length ? alerts[0].title : "Treatment response requires documented follow-up data",
    weightTrend: patient?.weightChange || patient?.weightHistory || "Weight trend not recorded",
  };
}

function buildAuditMetadata(patient) {
  return {
    activePatientId: patient?.id || "unavailable",
    generatedAt: new Date().toISOString(),
    source: "Shared local patient state",
    version: "nutrition-care-core-v1",
  };
}

function createProfileDomain(title, entries) {
  return {
    title,
    fields: entries.map(([label, value, source]) => createProfileField(label, value, source)),
  };
}

function createProfileField(label, value, source) {
  return {
    conflicts: [],
    label,
    lastUpdated: "Current local record",
    source,
    status: hasValue(value) ? "Recorded" : "Missing",
    value: hasValue(value) ? String(value) : "Not recorded",
  };
}

function deriveStageStatus(linkedSteps, missingRequirements, overdueItems) {
  if (overdueItems.length) return NUTRITION_CARE_STATUSES.overdue;
  if (linkedSteps.some((step) => step.status === "Needs Review")) return NUTRITION_CARE_STATUSES.needsReview;
  if (linkedSteps.length && linkedSteps.every((step) => step.status === "Completed") && !missingRequirements.length) {
    return NUTRITION_CARE_STATUSES.completed;
  }
  if (linkedSteps.some((step) => step.status === "In Progress" || step.status === "Completed") || missingRequirements.length < 2) {
    return NUTRITION_CARE_STATUSES.inProgress;
  }
  return NUTRITION_CARE_STATUSES.notStarted;
}

function isRequirementMissing(patient, requirement, workflow) {
  const requirementMap = {
    "Anthropometrics": !hasValue(patient?.height) || !hasValue(patient?.weight),
    "Care plan": workflow.steps.find((step) => step.id === "intervention")?.status === "Missing",
    "Clinical priority": !hasValue(patient?.riskLevel || patient?.risk),
    "Diet plan draft or active plan": !asArray(patient?.dietPlans).some((plan) => ["Active", "Draft"].includes(plan.status)),
    "Diet prescription": !collectionSummary(patient?.interventions, ["dietPrescription"]),
    "Dietary assessment": workflow.steps.find((step) => step.id === "dietary")?.status === "Missing",
    "Discharge or review note": !hasValue(patient?.reviewNote || patient?.dischargeSummary),
    "Education": !collectionSummary(patient?.interventions, ["education"]),
    "Follow-up date": !hasValue(patient?.nextFollowUpDate) && !asArray(patient?.followUps).some((item) => hasValue(item.date)),
    "Initial patient context": !hasValue(patient?.fullName || patient?.name),
    "Laboratory review": workflow.steps.find((step) => step.id === "labs")?.status === "Missing",
    "Medical history": workflow.steps.find((step) => step.id === "medical")?.status === "Missing",
    "Nutrition goals": !hasValue(patient?.nutritionGoals || activeDietPlan(patient)?.clinicalGoal),
    "Nutrition risk level": !hasValue(patient?.riskLevel || patient?.risk),
    "Outcome measures": !hasValue(patient?.weightChange) && !asArray(patient?.followUps).length,
    "PES diagnosis": workflow.steps.find((step) => step.id === "pes")?.status === "Missing",
    "Primary diagnosis": !hasValue(patient?.diagnosis),
    "Report readiness": workflow.steps.find((step) => step.id === "reports")?.status === "Missing",
    "Signs and symptoms": !hasValue(patient?.giSymptoms || patient?.notes || patient?.symptoms?.gi),
    "Supplements or referrals where recorded": false,
    "Treatment response": !asArray(patient?.followUps).some((item) => hasValue(item.outcome || item.goalProgress)),
  };

  return Boolean(requirementMap[requirement]);
}

function buildOverdueItems(patient, stage) {
  const reviewDate = patient?.nextFollowUpDate || activeDietPlan(patient)?.reviewDate;
  if (!reviewDate || !["monitoring-outcomes", "review-discharge"].includes(stage.id)) return [];
  const date = new Date(reviewDate);
  if (Number.isNaN(date.getTime())) return [];
  return date < startOfToday() ? [`${stage.label} review date is overdue`] : [];
}

function makeOutcome(label, baseline, current, target, unit, source) {
  const numericBaseline = Number(baseline);
  const numericCurrent = Number(current);
  const change = Number.isFinite(numericBaseline) && Number.isFinite(numericCurrent)
    ? Number((numericCurrent - numericBaseline).toFixed(1))
    : "";

  return {
    baseline: hasValue(baseline) ? String(baseline) : "Not recorded",
    change: hasValue(change) ? `${change > 0 ? "+" : ""}${change}${unit ? ` ${unit}` : ""}` : "Not enough data",
    current: hasValue(current) ? `${current}${unit ? ` ${unit}` : ""}` : "Not recorded",
    date: "Current local record",
    label,
    source,
    status: hasValue(current) ? "Recorded" : "Missing",
    target: hasValue(target) ? `${target}${unit ? ` ${unit}` : ""}` : "Not recorded",
    trend: deriveTrend(change),
  };
}

function labOutcome(patient, label, labName) {
  const lab = readLab(patient, labName);
  return {
    baseline: lab?.baseline || "Not recorded",
    change: "Not enough data",
    current: lab?.displayValue || "Not recorded",
    date: lab?.date || "Not recorded",
    label,
    source: "Laboratory Results",
    status: lab?.status || (lab?.value ? "Recorded" : "Missing"),
    target: "Clinician-defined target not recorded",
    trend: lab?.trend || "Not enough data",
  };
}

function deriveTrend(change) {
  if (!hasValue(change)) return "Not enough data";
  if (Number(change) > 0) return "Increasing";
  if (Number(change) < 0) return "Decreasing";
  return "Stable";
}

function createReviewAlert(title, reason, records) {
  return {
    action: "Review nutrition care plan before continuing.",
    records,
    reason,
    severity: title.includes("Overdue") || title.includes("missing") ? "High" : "Moderate",
    title,
  };
}

function noRecordedFollowUpImprovement(records) {
  return records.every((record) => {
    const text = [
      record.outcome,
      record.goalProgress,
      record.response,
      record.symptomTrend,
      record.labTrend,
      record.weightTrend,
    ].filter(hasValue).join(" ").toLowerCase();

    return /unchanged|no improvement|not improved|same|worse|declin|persistent|ongoing/.test(text);
  });
}

function isLabReassessmentDue(patient) {
  const hasLabDependentDiagnosis = String(patient?.diagnosis || "").toLowerCase().match(/iron|vitamin|renal|ckd|diabetes|glucose/);
  if (!hasLabDependentDiagnosis) return false;
  const labRows = [...asArray(patient?.labValues), ...asArray(patient?.laboratoryResults)];
  const hasRecordedLab = labRows.some((lab) => hasValue(lab.value));
  const hasExpectedReassessmentContext = hasValue(patient?.labReassessmentDue)
    || hasValue(patient?.labReviewDueDate)
    || hasValue(patient?.labReviewedAt)
    || asArray(patient?.followUps).some((followUp) => hasValue(followUp.labTrend || followUp.nextAction));

  return hasRecordedLab && hasExpectedReassessmentContext && !labRows.some((lab) => hasValue(lab.date));
}

function hasComparableResponse(record) {
  return hasValue(record?.outcome || record?.goalProgress || record?.response || record?.symptomTrend || record?.labTrend || record?.weightTrend);
}

function sortClinicalRecords(records) {
  return records
    .map((record, index) => ({ ...record, __order: index }))
    .sort((first, second) => {
      const firstDate = new Date(first.date || first.visitDate || first.updatedAt || 0).getTime();
      const secondDate = new Date(second.date || second.visitDate || second.updatedAt || 0).getTime();
      if (Number.isFinite(firstDate) && Number.isFinite(secondDate) && firstDate !== secondDate) {
        return secondDate - firstDate;
      }
      return first.__order - second.__order;
    });
}

function latestNote(patient) {
  const notes = [
    ...asArray(patient?.clinicalNotes),
    ...asArray(patient?.notesHistory),
    ...asArray(patient?.monitoringEntries),
    ...asArray(patient?.followUps),
  ];
  if (!notes.length && hasValue(patient?.notes)) {
    return { date: patient?.lastVisit || "Current local record", text: patient.notes };
  }
  return notes.find((note) => hasValue(note.text || note.notes || note.clinicalNotes || note.outcome)) || null;
}

function deriveIronStageStatus(stage, context) {
  const { hasIronDiagnosis, journey, labs, patient } = context;
  const recordedLabs = labs.filter((lab) => hasValue(lab?.value)).length;
  const stageRules = {
    "Adherence Monitoring": hasValue(patient?.dietaryAdherence),
    "Contributing-factor Review": hasValue(patient?.giSymptoms || patient?.medicalHistory),
    "Intervention": journey.stages.find((item) => item.id === "intervention")?.status === NUTRITION_CARE_STATUSES.completed,
    "Intake Assessment": hasValue(patient?.dietaryRecall || patient?.dietaryNotes),
    "Lab Reassessment": labs.some((lab) => hasValue(lab?.date)),
    "Lab Review": recordedLabs >= 2,
    "Outcome Review": journey.stages.find((item) => item.id === "monitoring-outcomes")?.status === NUTRITION_CARE_STATUSES.completed,
    "PES Diagnosis": journey.stages.find((item) => item.id === "nutrition-diagnosis")?.status === NUTRITION_CARE_STATUSES.completed,
    "Screening": hasIronDiagnosis || recordedLabs > 0,
  };
  const ruleResult = stageRules[stage];
  if (ruleResult === true) return "Completed";
  if (ruleResult === false && (hasIronDiagnosis || recordedLabs)) return "In Progress";
  return "Not Started";
}

function readLab(patient, labName) {
  const normalizedName = normalize(labName);
  const labRows = [
    ...asArray(patient?.labValues),
    ...asArray(patient?.labs),
    ...asArray(patient?.laboratoryResults),
  ];
  const match = labRows.find((lab) => {
    const label = normalize(lab.label || lab.name || lab.test);
    return label === normalizedName || label.includes(normalizedName) || normalizedName.includes(label);
  });
  const directValue = readDirectLabValue(patient, labName);
  const value = match?.value ?? directValue?.value;
  const unit = match?.unit ?? directValue?.unit ?? "";
  const status = match?.status ?? directValue?.status ?? (hasValue(value) ? "Recorded" : "Missing");

  return {
    baseline: match?.baseline,
    date: match?.date || patient?.labDate || "",
    displayValue: hasValue(value) ? `${value}${unit ? ` ${unit}` : ""}` : "",
    label: labName,
    status,
    trend: match?.trend,
    unit,
    value,
  };
}

function readDirectLabValue(patient, labName) {
  const keysByLab = {
    "Albumin": ["albumin"],
    "Creatinine": ["creatinine"],
    "Ferritin": ["ferritin"],
    "HbA1c": ["hba1c", "hbA1c"],
    "Hemoglobin": ["hemoglobin", "hb"],
    "Vitamin D": ["vitaminD", "vitamin_d"],
  };
  const directLabs = patient?.labs && !Array.isArray(patient.labs) ? patient.labs : {};
  const keys = keysByLab[labName] || [camelize(labName)];
  const key = keys.find((candidate) => hasValue(patient?.[candidate]) || hasValue(directLabs?.[candidate]));
  if (!key) return null;
  return { value: patient?.[key] ?? directLabs?.[key] };
}

function activeDietPlan(patient) {
  return asArray(patient?.dietPlans).find((plan) => plan.status === "Active") || asArray(patient?.dietPlans)[0] || null;
}

function collectionSummary(collection, keys) {
  const rows = asArray(collection).filter((item) => keys.some((key) => hasValue(item?.[key])));
  if (!rows.length) return "";
  return rows
    .slice(0, 2)
    .map((item) => keys.map((key) => item?.[key]).filter(hasValue).join(" / "))
    .join("; ");
}

function firstRecorded(profile, fieldLabel) {
  return profile.domains
    .flatMap((domain) => domain.fields)
    .find((field) => field.label === fieldLabel && field.status === "Recorded")?.value;
}

function resolveLastUpdated(patient) {
  return patient?.updatedAt || patient?.lastUpdated || patient?.lastVisit || "Current local record";
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasValue);
  const normalized = String(value).trim().toLowerCase();
  return !PLACEHOLDER_VALUES.has(normalized);
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function camelize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, character) => character.toUpperCase());
}
