export const NUTRIMAP_ORGAN_CONFIG = {
  brain: {
    fields: ["appetite", "cognitionNotes", "neurologicalHistory"],
    labs: ["Vitamin B12", "Folate", "Vitamin D"],
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
    fields: ["bmi", "weightStatus", "bloodPressure"],
    labs: ["Total Cholesterol", "LDL", "HDL", "Triglycerides", "Sodium"],
    assessments: ["anthropometricAssessment", "medicalHistory"],
    clinicalHubTab: "assessment",
  },
  "blood-iron": {
    fields: ["diagnosis", "dietaryRecall"],
    labs: ["Ferritin", "Hemoglobin", "Serum Iron", "TIBC", "Transferrin Saturation", "RBC", "Hematocrit", "MCV", "MCH", "MCHC", "RDW", "Vitamin B12", "Folate", "CRP"],
    assessments: ["laboratoryResults", "dietaryAssessment"],
    clinicalHubTab: "laboratory",
  },
  liver: {
    fields: ["lipidProfile", "diagnosis"],
    labs: ["ALT", "AST", "Albumin", "Bilirubin", "Total Cholesterol", "Triglycerides"],
    assessments: ["laboratoryResults", "medicalHistory"],
    clinicalHubTab: "laboratory",
  },
  gastrointestinal: {
    fields: ["giSymptoms", "ibsStatus", "appetite", "dietaryRecall", "fiber", "hydration"],
    labs: ["Albumin", "Ferritin"],
    assessments: ["dietaryAssessment", "medicalHistory"],
    clinicalHubTab: "dietary",
  },
  pancreas: {
    fields: ["carbohydrateDistribution", "diabetesStatus"],
    labs: ["Fasting Glucose", "HbA1c", "Triglycerides"],
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
    fields: ["weightTrend", "proteinTarget", "physicalActivity", "muscleAssessment"],
    labs: ["Vitamin D", "Albumin"],
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

  return {
    assessments: config.assessments,
    clinicalHubTab: config.clinicalHubTab,
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
    dietaryRecall: ["recall24h", "dietaryNotes", "dietaryRecall"],
    fiber: ["fiberIntake", "fiberTarget"],
    fluidTarget: ["fluidTarget", "waterGoal"],
    giSymptoms: ["giComplaints", "nutritionSymptoms"],
    hydration: ["waterIntake", "fluidIntake"],
    physicalActivity: ["activityLevel", "physicalActivityLevel"],
    proteinTarget: ["proteinRequirement", "proteinTarget"],
    weightStatus: ["weight", "weightTrend"],
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
  const match = labRows.find((lab) => normalize(lab.label || lab.name || lab.test) === normalizedName);
  const directValue = patient?.[camelize(labName)] || patient?.[normalizedName];

  return {
    date: match?.date || patient?.labDate || "",
    label: labName,
    status: match?.status || (hasValue(match?.value || directValue) ? "Recorded" : "Not recorded"),
    trend: match?.trend || "",
    unit: match?.unit || "",
    value: match?.value ?? directValue ?? "Not recorded",
  };
}

function buildOrganTimeline(patient, workflow) {
  const steps = [
    ["assessment", "Assessment completed", "Clinical Hub"],
    ["labs", "Laboratory review", "Laboratory Results"],
    ["pes", "PES diagnosis added", "Clinical Hub"],
    ["intervention", "Intervention added", "Clinical Hub"],
    ["dietPlan", "Diet plan activated", "Diet Plan"],
    ["monitoring", "Monitoring entry added", "Monitoring"],
    ["ai", "AI review completed", "AI Center"],
    ["reports", "Report generated", "Reports"],
  ];

  return steps
    .map(([id, title, source]) => {
      const step = workflow?.steps?.find((item) => item.id === id);
      if (!step || !["Completed", "Needs Review"].includes(step.status)) return null;
      return {
        date: patient?.lastUpdated || patient?.lastVisit || "",
        description: step.status === "Completed" ? "Recorded in shared workflow." : "Needs clinician review.",
        source,
        status: step.status,
        title,
      };
    })
    .filter(Boolean)
    .reverse();
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
  return Boolean(value && String(value).trim() && String(value).trim() !== "Not recorded");
}
