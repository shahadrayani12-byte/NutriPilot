import { getWorkflowNextAction, getWorkflowStatus } from "./workflowStatus.js";

export function buildClinicalDecisionSupport(patient, appState = {}) {
  const workflow = getWorkflowStatus(patient);
  const labs = buildLaboratorySignals(patient);
  const weightTrend = buildWeightTrend(patient);
  const bmiTrend = buildBmiTrend(patient, weightTrend);
  const labTrends = buildLaboratoryTrends(labs);
  const riskEngine = buildClinicalRiskEngine(patient, workflow, labs, bmiTrend);
  const nutritionStatusScore = buildNutritionStatusScore(patient, workflow, labs, riskEngine);
  const smartSummary = buildSmartPatientSummary(patient, workflow, riskEngine, nutritionStatusScore);
  const labInterpretation = buildSmartLaboratoryInterpretation(labs, workflow);
  const patientJourney = buildPatientJourney(workflow);
  const aiTimeline = buildAiTimeline(patient, workflow, riskEngine, appState.aiSummary);
  const decisionCards = buildClinicalDecisionCards(patient, workflow, riskEngine, labInterpretation);
  const notifications = buildInteractiveNotifications(patient, workflow, riskEngine, labInterpretation);
  const dashboard = buildDynamicDashboardSignals(patient, workflow, riskEngine, nutritionStatusScore, labs);

  return {
    aiTimeline,
    bmiTrend,
    dashboard,
    decisionCards,
    labInterpretation,
    labTrends,
    labs,
    notifications,
    nutritionStatusScore,
    patientJourney,
    riskEngine,
    smartSummary,
    weightTrend,
  };
}

export function buildDecisionSupportByPatient(patients, appState = {}) {
  return patients.map((patient) => ({
    patientId: patient.id,
    patientName: patient.fullName || patient.name,
    support: buildClinicalDecisionSupport(patient, appState),
  }));
}

function buildSmartPatientSummary(patient, workflow, riskEngine, nutritionStatusScore) {
  const nextAction = getWorkflowNextAction(patient);
  const missing = workflow.missing.map((step) => step.label);

  return {
    headline: `${patient.fullName} is ${workflow.percent}% through the clinical nutrition workflow.`,
    keyStatus: patient.nutritionStatus || "Nutrition status pending",
    missingDocumentation: missing,
    nextRecommendedStep: nextAction.label || nextAction.actionLabel,
    nutritionStatusScore: nutritionStatusScore.score,
    riskLevel: riskEngine.level,
    summaryBullets: [
      `Current risk engine level: ${riskEngine.level}.`,
      `Next recommended step: ${nextAction.actionLabel}.`,
      missing.length ? `Missing documentation: ${missing.join(", ")}.` : "No missing workflow steps detected.",
      `Report readiness: ${workflow.steps.find((step) => step.id === "reports")?.status || "Unknown"}.`,
    ],
  };
}

function buildLaboratorySignals(patient) {
  const diagnosis = String(patient?.diagnosis || "").toLowerCase();
  const ferritin = Number(patient?.ferritin || (diagnosis.includes("iron") ? 12 : 42));
  const vitaminD = Number(patient?.vitaminD || (diagnosis.includes("vitamin d") ? 14 : 28));
  const albumin = patient?.riskLevel === "High Risk" ? 3.2 : 4.1;
  const hemoglobin = ferritin < 15 ? 10.8 : 13.4;
  const hba1c = diagnosis.includes("obesity") || diagnosis.includes("diabetes") ? 6.3 : 5.4;

  return [
    createLabSignal("Ferritin", ferritin, "ug/L", ferritin < 15 ? "Low" : "Normal", "Iron stores marker"),
    createLabSignal("Hemoglobin", hemoglobin, "g/dL", hemoglobin < 12 ? "Low" : "Normal", "CBC nutrition-related marker"),
    createLabSignal("Vitamin D", vitaminD, "ng/mL", vitaminD < 20 ? "Low" : "Normal", "Bone and micronutrient marker"),
    createLabSignal("Albumin", albumin, "g/dL", albumin < 3.5 ? "Low" : "Normal", "Protein/inflammation context marker"),
    createLabSignal("HbA1c", hba1c, "%", hba1c >= 5.7 ? "High" : "Normal", "Glycemic control marker"),
  ];
}

function createLabSignal(name, value, unit, status, focus) {
  return {
    focus,
    name,
    status,
    unit,
    value,
  };
}

function buildLaboratoryTrends(labs) {
  return labs.map((lab, index) => {
    const baseline = Number(lab.value);
    const direction = lab.status === "Normal" ? "stable" : index % 2 === 0 ? "needs review" : "monitoring";
    const delta = lab.status === "Normal" ? 0 : index + 1;

    return {
      current: `${lab.value} ${lab.unit}`.trim(),
      direction,
      label: lab.name,
      previous: `${Math.max(0, baseline + (lab.status === "Low" ? delta : -delta)).toFixed(1)} ${lab.unit}`.trim(),
      status: lab.status,
      summary: `${lab.name} trend is ${direction}; placeholder trend based on local patient context.`,
    };
  });
}

function buildWeightTrend(patient) {
  const currentWeight = Number(patient?.weight || 70);
  const isHighRisk = patient?.riskLevel === "High Risk";
  const trendValues = isHighRisk
    ? [currentWeight + 4, currentWeight + 2, currentWeight + 1, currentWeight]
    : [currentWeight - 1, currentWeight - 0.5, currentWeight, currentWeight];

  return {
    direction: isHighRisk ? "decreasing" : "stable",
    points: trendValues.map((value, index) => ({
      label: ["Baseline", "Visit 2", "Visit 3", "Current"][index],
      value: Number(value.toFixed(1)),
    })),
    summary: isHighRisk ? "Weight trend needs clinician review." : "Weight trend appears stable in placeholder data.",
  };
}

function buildBmiTrend(patient, weightTrend) {
  const heightMeters = Number(patient?.height || 170) / 100;
  const points = weightTrend.points.map((point) => ({
    label: point.label,
    value: heightMeters ? Number((point.value / (heightMeters * heightMeters)).toFixed(1)) : Number(patient?.bmi || 0),
  }));

  return {
    direction: weightTrend.direction,
    points,
    summary: `BMI trend is ${weightTrend.direction} based on available local measurements.`,
  };
}

function buildNutritionStatusScore(patient, workflow, labs, riskEngine) {
  const abnormalLabs = labs.filter((lab) => lab.status !== "Normal").length;
  const missingPenalty = workflow.missing.length * 4;
  const riskPenalty = riskEngine.level === "High" ? 22 : riskEngine.level === "Moderate" ? 12 : 4;
  const labPenalty = abnormalLabs * 7;
  const score = Math.max(0, Math.min(100, 100 - missingPenalty - riskPenalty - labPenalty));

  return {
    label: score >= 80 ? "Stable" : score >= 60 ? "Needs Review" : "High Attention",
    score,
    signals: [
      `${workflow.percent}% workflow completion`,
      `${abnormalLabs} abnormal nutrition-related lab signals`,
      `${riskEngine.level} clinical risk level`,
      patient.nutritionStatus || "Nutrition status pending",
    ],
  };
}

function buildClinicalRiskEngine(patient, workflow, labs, bmiTrend) {
  const abnormalLabs = labs.filter((lab) => lab.status !== "Normal");
  const triggers = [
    patient?.riskLevel === "High Risk" ? "High nutrition risk classification" : null,
    abnormalLabs.length ? `${abnormalLabs.length} abnormal nutrition-related lab markers` : null,
    workflow.missing.length >= 3 ? "Multiple missing workflow steps" : null,
    bmiTrend.direction === "decreasing" ? "Weight/BMI trend requires review" : null,
  ].filter(Boolean);
  const score = triggers.length * 25 + (workflow.needsReview.length * 8);

  return {
    level: score >= 60 ? "High" : score >= 30 ? "Moderate" : "Low",
    score: Math.min(100, score),
    triggers,
  };
}

function buildSmartLaboratoryInterpretation(labs, workflow) {
  return labs.map((lab) => ({
    confidence: workflow.steps.find((step) => step.id === "labs")?.status === "Completed" ? "Moderate" : "Low",
    interpretation: lab.status === "Normal"
      ? `${lab.name} is within placeholder normal context.`
      : `${lab.name} is ${lab.status.toLowerCase()} and should be reviewed by the clinician.`,
    label: lab.name,
    status: lab.status,
    value: `${lab.value} ${lab.unit}`.trim(),
  }));
}

function buildPatientJourney(workflow) {
  return workflow.steps.map((step, index) => ({
    order: index + 1,
    status: step.status,
    step: step.label,
    tabId: step.tabId,
  }));
}

function buildAiTimeline(patient, workflow, riskEngine, aiSummary) {
  return [
    {
      title: "AI clinical summary refreshed",
      detail: aiSummary?.summary || `Rule-based summary prepared for ${patient.fullName}.`,
      status: aiSummary?.confidence || "Moderate",
      time: aiSummary?.generatedAt || "Now",
    },
    {
      title: "Clinical risk engine evaluated",
      detail: `${riskEngine.level} risk from ${riskEngine.triggers.length || 0} local triggers.`,
      status: riskEngine.level,
      time: "Current session",
    },
    {
      title: "Workflow review completed",
      detail: `${workflow.percent}% journey completion with ${workflow.missing.length} missing steps.`,
      status: workflow.percent >= 70 ? "Ready" : "Needs Review",
      time: "Current session",
    },
  ];
}

function buildClinicalDecisionCards(patient, workflow, riskEngine, labInterpretation) {
  const abnormalLabs = labInterpretation.filter((lab) => lab.status !== "Normal");
  const nextAction = getWorkflowNextAction(patient);

  return [
    {
      action: nextAction.actionLabel,
      confidence: workflow.percent >= 60 ? "Moderate" : "Low",
      dataUsed: ["Workflow status", "Active patient", "Missing steps"],
      priority: workflow.missing.length ? "High" : "Moderate",
      reason: nextAction.reason,
      title: "Next workflow action",
    },
    {
      action: abnormalLabs.length ? "Review abnormal nutrition-related labs" : "Continue routine lab monitoring",
      confidence: abnormalLabs.length ? "Moderate" : "Low",
      dataUsed: abnormalLabs.map((lab) => lab.label),
      priority: abnormalLabs.length ? "High" : "Low",
      reason: abnormalLabs.length ? "One or more lab markers are outside placeholder ranges." : "No abnormal placeholder markers were detected.",
      title: "Laboratory interpretation",
    },
    {
      action: "Clinician review required before final care decisions",
      confidence: "Placeholder",
      dataUsed: riskEngine.triggers,
      priority: riskEngine.level === "High" ? "High" : "Moderate",
      reason: `Clinical risk engine level is ${riskEngine.level}.`,
      title: "Clinical decision support",
    },
  ];
}

function buildInteractiveNotifications(patient, workflow, riskEngine, labInterpretation) {
  const abnormalLabs = labInterpretation.filter((lab) => lab.status !== "Normal");
  const notifications = [
    riskEngine.level !== "Low"
      ? {
          category: "AI Notifications",
          description: `Risk engine detected ${riskEngine.triggers.length} local trigger(s).`,
          priority: riskEngine.level === "High" ? "High" : "Medium",
          title: `Clinical risk review for ${patient.fullName}`,
        }
      : null,
    abnormalLabs.length
      ? {
          category: "AI Notifications",
          description: abnormalLabs.map((lab) => `${lab.label}: ${lab.status}`).join(", "),
          priority: "High",
          title: `Laboratory interpretation ready for ${patient.fullName}`,
        }
      : null,
    workflow.missing.length
      ? {
          category: "Patient Messages",
          description: workflow.missing.map((step) => step.label).join(", "),
          priority: "Medium",
          title: `Patient journey incomplete for ${patient.fullName}`,
        }
      : null,
  ];

  return notifications.filter(Boolean);
}

function buildDynamicDashboardSignals(patient, workflow, riskEngine, nutritionStatusScore, labs) {
  return {
    abnormalLabCount: labs.filter((lab) => lab.status !== "Normal").length,
    activeRiskLevel: riskEngine.level,
    nextStep: workflow.nextStep?.label || "Review patient summary",
    nutritionScore: nutritionStatusScore.score,
    patientName: patient.fullName,
    workflowPercent: workflow.percent,
  };
}
