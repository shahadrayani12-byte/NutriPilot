export const NUTRIMAP_ORGAN_CONFIG = {
  brain: {
    fields: ["appetite", "cognitionNotes", "neurologicalHistory", "omega3Context"],
    labs: ["Vitamin B12", "Folate", "Vitamin D", "Glucose"],
    assessments: ["dietaryAssessment", "medicalHistory"],
    clinicalHubTab: "ai",
  },
  "oral-cavity": {
    fields: ["oralSymptoms", "chewingDifficulty", "swallowingDifficulty", "oralIntakeBarriers", "oralHealthNotes"],
    labs: [],
    assessments: ["dietaryAssessment", "medicalHistory"],
    clinicalHubTab: "dietary",
  },
  heart: {
    fields: ["lipidProfile", "sodiumContext", "bmi", "weightStatus", "bloodPressure"],
    labs: ["Total Cholesterol", "LDL", "HDL", "Triglycerides", "Sodium", "BMI", "Blood Pressure"],
    assessments: ["anthropometricAssessment", "medicalHistory"],
    clinicalHubTab: "assessment",
  },
  "blood-iron": {
    fields: ["diagnosis", "dietaryRecall"],
    labs: ["Ferritin", "Hemoglobin", "Serum Iron", "TIBC", "Transferrin Saturation", "RBC", "Hematocrit", "MCV", "MCH", "MCHC", "RDW", "Vitamin B12", "Folate"],
    assessments: ["laboratoryResults", "dietaryAssessment"],
    clinicalHubTab: "laboratory",
  },
  liver: {
    fields: ["lipidProfile", "diagnosis"],
    labs: ["ALT", "AST", "Albumin", "Bilirubin", "Lipid Profile"],
    assessments: ["laboratoryResults", "medicalHistory"],
    clinicalHubTab: "laboratory",
  },
  gastrointestinal: {
    fields: ["giSymptoms", "ibsStatus", "appetite", "dietaryRecall", "fiber", "hydration"],
    labs: [],
    assessments: ["dietaryAssessment", "medicalHistory"],
    clinicalHubTab: "dietary",
  },
  pancreas: {
    fields: ["carbohydrateDistribution", "diabetesStatus"],
    labs: ["Fasting Glucose", "HbA1c"],
    assessments: ["laboratoryResults", "dietaryAssessment"],
    clinicalHubTab: "laboratory",
  },
  kidneys: {
    fields: ["fluidTarget", "diagnosis"],
    labs: ["Creatinine", "eGFR", "Sodium", "Potassium", "Phosphorus"],
    assessments: ["laboratoryResults", "medicalHistory"],
    clinicalHubTab: "laboratory",
  },
  muscles: {
    fields: ["weightTrend", "proteinIntake", "proteinTarget", "physicalActivity", "calfCircumference", "muac", "handgripStrength"],
    labs: ["Vitamin D", "CRP"],
    assessments: ["anthropometricAssessment", "dietPlan"],
    clinicalHubTab: "assessment",
  },
  bones: {
    fields: ["weightBearingActivity", "boneHistory"],
    labs: ["Vitamin D", "Calcium", "Phosphorus"],
    assessments: ["medicalHistory", "dietPlan"],
    clinicalHubTab: "laboratory",
  },
};

export function getNutriMapOrganConfig(organId) {
  return NUTRIMAP_ORGAN_CONFIG[organId] || NUTRIMAP_ORGAN_CONFIG.brain;
}

export function buildOrganDataSummary(patient, organId, workflow) {
  const config = getNutriMapOrganConfig(organId);
  const fields = config.fields.map((field) => ({
    key: field,
    label: humanizeField(field),
    value: readPatientValue(patient, field),
  }));
  const labs = config.labs.map((lab) => readLabValue(patient, lab));
  const recordedFields = fields.filter((item) => hasValue(item.value)).length;
  const recordedLabs = labs.filter((item) => hasValue(item.value)).length;
  const totalItems = fields.length + labs.length;
  const recordedItems = recordedFields + recordedLabs;
  const completeness = totalItems ? Math.round((recordedItems / totalItems) * 100) : 0;
  const status = calculateOrganStatus({ completeness, fields, labs, totalItems });
  const clinicalRows = buildOrganClinicalRows(patient, workflow);

  return {
    assessments: config.assessments,
    clinicalHubTab: config.clinicalHubTab,
    clinicalRows,
    completeness,
    completedCount: recordedItems,
    fields,
    labs,
    lastUpdated: patient?.lastUpdated || patient?.updatedAt || patient?.lastVisit || "Not recorded",
    missingCount: Math.max(totalItems - recordedItems, 0),
    relatedLabsCount: config.labs.length,
    status,
    statusColor: statusToColor(status),
    timeline: buildOrganTimeline(patient, workflow),
    totalCount: totalItems,
  };
}

export function calculateOrganStatus({ completeness, labs, totalItems }) {
  if (!totalItems || completeness === 0) return "No Data";
  const hasHighPriority = labs.some((lab) => {
    const status = String(lab.status || "").toLowerCase();
    return status.includes("critical") || status.includes("high priority") || status.includes("urgent");
  });
  if (hasHighPriority) return "High Priority";
  const hasAbnormal = labs.some((lab) => {
    const status = String(lab.status || "").toLowerCase();
    return ["low", "high", "abnormal", "needs review"].some((keyword) => status.includes(keyword));
  });
  if (hasAbnormal) return "Monitor Closely";
  if (completeness < 75) return "Needs Review";
  return "Stable / OK";
}

export function statusToColor(status) {
  if (status === "High Priority") return "Red";
  if (status === "Monitor Closely") return "Orange";
  if (status === "Needs Review") return "Yellow";
  if (status === "No Data") return "Gray";
  return "Green";
}

function readPatientValue(patient, field) {
  const directValue = patient?.[field];
  if (hasValue(directValue)) return directValue;

  const aliases = {
    appetite: ["appetiteLevel", "appetiteStatus"],
    bmi: ["BMI", "bodyMassIndex"],
    boneHistory: ["boneRelatedHistory", "boneHealthHistory"],
    carbohydrateDistribution: ["carbDistribution", "carbohydratePattern"],
    cognitionNotes: ["cognitiveNotes", "cognition"],
    diabetesStatus: ["diabetes", "glucoseStatus"],
    dietaryRecall: ["recall24h", "dietaryNotes", "dietaryRecall"],
    fiber: ["fiberIntake", "fiberTarget"],
    fluidTarget: ["fluidTarget", "waterGoal"],
    giSymptoms: ["giComplaints", "nutritionSymptoms"],
    handgripStrength: ["handGripStrength", "gripStrength"],
    hydration: ["waterIntake", "fluidIntake"],
    ibsStatus: ["ibsDiagnosis", "IBS", "diagnosis"],
    lipidProfile: ["lipids", "cholesterolProfile", "lipidStatus"],
    muac: ["MUAC", "midUpperArmCircumference"],
    omega3Context: ["omega3Intake", "omega3Context", "fishIntake"],
    oralHealthNotes: ["oralHealth", "mouthNotes", "dentalNotes"],
    oralIntakeBarriers: ["oralBarriers", "intakeBarriers"],
    oralSymptoms: ["mouthSymptoms", "oralSymptoms"],
    physicalActivity: ["activityLevel", "physicalActivityLevel"],
    proteinIntake: ["proteinIntake", "proteinAdequacy"],
    proteinTarget: ["proteinRequirement", "proteinTarget"],
    sodiumContext: ["sodium", "sodiumIntake", "sodiumTarget"],
    swallowingDifficulty: ["dysphagia", "swallowingProblems"],
    weightStatus: ["weight", "weightTrend"],
    weightBearingActivity: ["weightBearingExercise", "resistanceActivity"],
  }[field] || [];

  for (const alias of aliases) {
    if (hasValue(patient?.[alias])) return patient[alias];
  }

  return "Not recorded";
}

function readLabValue(patient, labName) {
  const normalizedName = normalize(labName);
  const labRows = [
    ...(Array.isArray(patient?.labValues) ? patient.labValues : []),
    ...(Array.isArray(patient?.labs) ? patient.labs : []),
    ...(Array.isArray(patient?.laboratoryResults) ? patient.laboratoryResults : []),
  ];
  const aliases = labAliases(labName).map(normalize);
  const match = labRows.find((lab) => {
    const key = normalize(lab.label || lab.name || lab.test);
    return key === normalizedName || aliases.includes(key);
  });
  const directKeys = [camelize(labName), normalizedName, ...labAliases(labName).map(camelize)];
  const directValue = directKeys.map((key) => patient?.[key]).find(hasValue);

  return {
    date: match?.date || patient?.labDate || "",
    label: labName,
    status: match?.status || (hasValue(match?.value || directValue) ? "Recorded" : "Not recorded"),
    trend: match?.trend || "",
    unit: match?.unit || "",
    value: match?.value ?? directValue ?? "Not recorded",
  };
}

function labAliases(labName) {
  return {
    "Blood Pressure": ["bloodPressure", "BP"],
    "Fasting Glucose": ["Glucose", "Fasting Blood Glucose", "FBG"],
    Glucose: ["Fasting Glucose", "Fasting Blood Glucose", "FBG"],
    "Lipid Profile": ["Lipids", "Cholesterol Profile", "Total Cholesterol", "LDL", "HDL", "Triglycerides"],
    MCHC: ["Mean Corpuscular Hemoglobin Concentration"],
    "Total Cholesterol": ["Cholesterol", "TC"],
    "Transferrin Saturation": ["TSAT", "Transferrin Sat"],
    "Vitamin B12": ["B12"],
    "Vitamin D": ["25-OH Vitamin D", "25 Hydroxy Vitamin D", "Vit D"],
  }[labName] || [];
}

function buildOrganTimeline(patient, workflow) {
  const entries = [
    ...timelineFromCollection(patient?.labValues || patient?.labs || patient?.laboratoryResults, "Lab added", "Laboratory Results", "date"),
    ...timelineFromCollection(patient?.diagnoses, "PES added", "Clinical Hub", "reviewDate"),
    ...timelineFromCollection(patient?.interventions, "Intervention added", "Clinical Hub", "date"),
    ...timelineFromCollection(patient?.dietPlans, "Diet plan activated", "Diet Plan", "activatedAt"),
    ...timelineFromCollection(patient?.followUps, "Follow-up scheduled", "Monitoring", "date"),
    ...timelineFromCollection(patient?.monitoringEntries, "Monitoring added", "Monitoring", "date"),
    ...timelineFromCollection(patient?.aiAssessments, "AI review completed", "AI Center", "generatedAt"),
    ...timelineFromCollection(patient?.reportHistory || patient?.reports, "Report generated", "Reports", "date"),
  ];

  if (hasValue(patient?.lastAssessmentDate)) {
    entries.push({ date: patient.lastAssessmentDate, description: "Assessment date recorded in patient record.", source: "Clinical Hub", status: workflow?.steps?.find((step) => step.id === "assessment")?.status || "Recorded", title: "Assessment completed" });
  }
  if (hasValue(patient?.labReviewedAt)) {
    entries.push({ date: patient.labReviewedAt, description: "Laboratory review date recorded in patient record.", source: "Laboratory Results", status: workflow?.steps?.find((step) => step.id === "labs")?.status || "Recorded", title: "Lab reviewed" });
  }

  return entries
    .filter((entry) => hasValue(entry.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function buildOrganClinicalRows(patient, workflow) {
  const stepStatus = (stepId, fallback = "Not recorded") => workflow?.steps?.find((step) => step.id === stepId)?.status || fallback;
  const latestDiagnosis = latestCollectionValue(patient?.diagnoses, ["statement", "problem", "diagnosis"]) || patient?.nutritionDiagnosis || "Not recorded";
  const latestIntervention = latestCollectionValue(patient?.interventions, ["goal", "dietPrescription", "summary"]) || "Not recorded";
  const activeDietPlan = (patient?.dietPlans || []).find((plan) => ["Active", "Draft"].includes(plan.status)) || {};
  const latestFollowUp = latestCollectionValue(patient?.followUps, ["summary", "type", "nextAction"]) || patient?.nextFollowUpDate || "Not recorded";
  const aiReview = latestCollectionValue(patient?.aiAssessments, ["summary", "riskLevel", "status"]) || stepStatus("ai");
  const reportStatus = latestCollectionValue(patient?.reportHistory || patient?.reports, ["status", "title", "name"]) || stepStatus("reports");

  return [
    { label: "PES diagnosis", status: stepStatus("pes"), value: latestDiagnosis },
    { label: "Nutrition intervention", status: stepStatus("intervention"), value: latestIntervention },
    { label: "Diet plan", status: stepStatus("dietPlan"), value: activeDietPlan.title || activeDietPlan.status || "Not recorded" },
    { label: "Monitoring", status: stepStatus("monitoring"), value: latestFollowUp },
    { label: "Follow-up", status: hasValue(patient?.nextFollowUpDate) ? "Recorded" : "Not recorded", value: patient?.nextFollowUpDate || latestFollowUp },
    { label: "AI review", status: stepStatus("ai"), value: aiReview },
    { label: "Reports", status: stepStatus("reports"), value: reportStatus },
  ];
}

function timelineFromCollection(collection, title, source, preferredDateKey) {
  if (!Array.isArray(collection)) return [];
  return collection.map((item) => {
    const date = item?.[preferredDateKey] || item?.date || item?.createdAt || item?.updatedAt || item?.generatedAt || item?.reviewDate || "";
    const status = item?.status || "Recorded";
    const description = item?.summary || item?.label || item?.name || item?.title || item?.problem || "Recorded in shared patient state.";
    return { date, description, source, status, title };
  });
}

function latestCollectionValue(collection, keys) {
  if (!Array.isArray(collection) || !collection.length) return "";
  const [latest] = [...collection].reverse();
  for (const key of keys) {
    if (hasValue(latest?.[key])) return latest[key];
  }
  return "";
}

function humanizeField(field) {
  return field.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function camelize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0) return true;
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  return !["not recorded", "n/a", "na", "none", "unavailable"].includes(normalized)
    && !normalized.includes("placeholder")
    && !normalized.includes("pending");
}
