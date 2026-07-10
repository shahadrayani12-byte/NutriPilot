import { calculateBmi, workspacePatient } from "../data/patientData";
import {
  dietaryMealFields,
  labReferenceRanges,
  sampleWorkspaceData,
} from "../components/clinical/clinicalData";

export function toNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

export function formatNumber(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : "Pending";
}

export function hasResult(value) {
  return Number.isFinite(value);
}

export function getLabStatus(value, range) {
  const numericValue = toNumber(value);

  if (!numericValue) {
    return {
      status: "Needs follow-up",
      interpretation: "Result not recorded. Add value when available.",
    };
  }

  if (
    numericValue <= range.criticalLow ||
    numericValue >= range.criticalHigh
  ) {
    return {
      status: "Critical",
      interpretation:
        numericValue < range.normalLow ? range.lowText : range.highText,
    };
  }

  if (numericValue < range.normalLow) {
    return {
      status: "Low",
      interpretation: range.lowText,
    };
  }

  if (numericValue > range.normalHigh) {
    return {
      status: "High",
      interpretation: range.highText,
    };
  }

  return {
    status: "Normal",
    interpretation: "Within placeholder reference range.",
  };
}

export function evaluateLabResults(values) {
  return labReferenceRanges.map((range) => {
    const value = values[range.key];
    const status = getLabStatus(value, range);

    return {
      ...range,
      value,
      ...status,
    };
  });
}

export function buildLabClinicalSummary(results) {
  const byKey = Object.fromEntries(results.map((result) => [result.key, result]));
  const anemiaRisk =
    ["hemoglobin", "ferritin", "serumIron", "transferrinSaturation"].some(
      (key) => ["Low", "Critical"].includes(byKey[key]?.status)
    );
  const vitaminDRisk = ["Low", "Critical"].includes(byKey.vitaminD?.status);
  const inflammationRisk = ["High", "Critical"].includes(byKey.crp?.status);
  const dyslipidemiaRisk =
    ["totalCholesterol", "ldl", "triglycerides"].some((key) =>
      ["High", "Critical"].includes(byKey[key]?.status)
    ) || ["Low", "Critical"].includes(byKey.hdl?.status);
  const glucoseRisk =
    ["High", "Critical"].includes(byKey.fastingGlucose?.status) ||
    ["High", "Critical"].includes(byKey.hba1c?.status);

  return [
    {
      label: "Possible anemia risk",
      active: anemiaRisk,
      text: anemiaRisk
        ? "Iron-related markers suggest anemia risk and require follow-up."
        : "No anemia signal from entered iron markers.",
    },
    {
      label: "Vitamin D deficiency risk",
      active: vitaminDRisk,
      text: vitaminDRisk
        ? "Vitamin D appears below target range and needs review."
        : "Vitamin D risk not flagged from entered value.",
    },
    {
      label: "Inflammation marker",
      active: inflammationRisk,
      text: inflammationRisk
        ? "CRP is elevated; interpret visceral protein markers carefully."
        : "CRP is not flagged from entered value.",
    },
    {
      label: "Dyslipidemia risk",
      active: dyslipidemiaRisk,
      text: dyslipidemiaRisk
        ? "Lipid markers suggest dyslipidemia risk."
        : "Lipid risk not flagged from entered values.",
    },
    {
      label: "Glucose control risk",
      active: glucoseRisk,
      text: glucoseRisk
        ? "Glucose markers suggest elevated glycemic risk."
        : "Glucose control risk not flagged from entered values.",
    },
  ];
}

export function buildDietarySummary(values) {
  const reportedMeals = dietaryMealFields.filter((meal) => {
    const value = values[meal.key]?.trim().toLowerCase();
    return value && value !== "none" && value !== "none reported";
  }).length;

  const waterAdequacy =
    values.waterIntake === "1.5-2 L/day" || values.waterIntake === "More than 2 L/day"
      ? "Likely adequate"
      : "Requires follow-up";

  const appetiteStatus =
    values.appetiteLevel === "Good"
      ? "Normal"
      : values.appetiteLevel === "Poor"
        ? "Low"
        : "Requires follow-up";

  const risks = [];

  if (reportedMeals < 3 || values.mealPattern !== "Regular") {
    risks.push("irregular meal frequency");
  }

  if (waterAdequacy === "Requires follow-up") {
    risks.push("low fluid intake risk");
  }

  if (values.bowelHabits !== "Regular") {
    risks.push("GI tolerance concerns");
  }

  if (values.foodIntolerances && values.foodIntolerances !== "None") {
    risks.push("possible food intolerance");
  }

  if (values.nutritionBarriers?.trim()) {
    risks.push("reported nutrition barriers");
  }

  return [
    {
      label: "Estimated meal frequency",
      value: `${reportedMeals} eating occasions/day`,
      status: reportedMeals >= 3 ? "normal" : "requires follow-up",
    },
    {
      label: "Water adequacy status",
      value: waterAdequacy,
      status: waterAdequacy === "Likely adequate" ? "normal" : "requires follow-up",
    },
    {
      label: "Appetite status",
      value: appetiteStatus,
      status: appetiteStatus === "Normal" ? "normal" : "requires follow-up",
    },
    {
      label: "Possible dietary risks",
      value: risks.length ? risks.join(", ") : "No major risk flagged from entered data",
      status: risks.length ? "requires follow-up" : "normal",
    },
  ];
}

export function buildMedicalSummary(values) {
  const hasNutritionMedicationNotes =
    values.medicationNutrientNotes?.trim() ||
    values.currentMedications?.toLowerCase().includes("iron");
  const hasGiConcerns =
    values.giSymptoms?.trim() ||
    values.giComplaints?.trim() ||
    values.bowelMovementPattern !== "Regular";
  const lifestyleRisks = [
    values.physicalActivityLevel === "Sedentary" ? "low activity" : "",
    values.smokingStatus === "Current smoker" ? "smoking" : "",
    values.sleepQuality === "Poor" ? "poor sleep" : "",
    values.recentWeightChanges ? "recent weight change" : "",
  ].filter(Boolean);

  return [
    {
      label: "Key diagnoses",
      value: [values.primaryDiagnosis, values.secondaryDiagnoses]
        .filter(Boolean)
        .join("; "),
      active: true,
    },
    {
      label: "Medications needing nutrition review",
      value: hasNutritionMedicationNotes
        ? values.medicationNutrientNotes || values.currentMedications
        : "No nutrition-related medication concern flagged.",
      active: Boolean(hasNutritionMedicationNotes),
    },
    {
      label: "GI concerns",
      value: hasGiConcerns
        ? `${values.giComplaints || values.giSymptoms}; bowel pattern: ${values.bowelMovementPattern}`
        : "No active GI concern flagged.",
      active: Boolean(hasGiConcerns),
    },
    {
      label: "Lifestyle risk factors",
      value: lifestyleRisks.length ? lifestyleRisks.join(", ") : "No major lifestyle risk flagged.",
      active: lifestyleRisks.length > 0,
    },
    {
      label: "Follow-up priorities",
      value:
        "Review medication timing, GI tolerance, weight trend, and nutrition-related symptoms.",
      active: true,
    },
  ];
}

export function buildPesStatement(values) {
  const problem = values.problem?.trim();
  const etiology = values.etiology?.trim();
  const signsSymptoms = values.signsSymptoms?.trim();

  if (!problem && !etiology && !signsSymptoms) {
    return "";
  }

  const generatedStatement = [problem, etiology, signsSymptoms].filter(Boolean).join(" ");

  return generatedStatement.endsWith(".") ? generatedStatement : `${generatedStatement}.`;
}

export function getPesStorageKey(patient) {
  return `nutripilot-pes-${patient.id ?? patient.fullName}`;
}

export function classifyBmi(bmi) {
  if (!Number.isFinite(bmi)) return "Requires follow-up";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obesity";
}

export function interpretationFor(type, value, context = {}) {
  if (!Number.isFinite(value)) return "requires follow-up";

  if (type === "bmi") {
    if (value < 18.5) return "low";
    if (value < 25) return "normal";
    if (value < 30) return "high";
    return "requires follow-up";
  }

  if (type === "percentIbw") {
    if (value < 90) return "low";
    if (value <= 110) return "normal";
    if (value > 120) return "high";
    return "requires follow-up";
  }

  if (type === "weightChange") {
    const absoluteChange = Math.abs(value);
    if (absoluteChange < 5) return "normal";
    if (absoluteChange <= 10) return "requires follow-up";
    return "high";
  }

  if (type === "waistHipRatio") {
    const threshold = context.gender === "Male" ? 0.9 : 0.85;
    return value <= threshold ? "normal" : "high";
  }

  return "requires follow-up";
}

export function calculateAnthropometricResults(values) {
  const height = toNumber(values.height);
  const weight = toNumber(values.weight);
  const age = toNumber(values.age);
  const usualBodyWeight = toNumber(values.usualBodyWeight);
  const idealBodyWeight = toNumber(values.idealBodyWeight);
  const activityFactor = toNumber(values.activityFactor);
  const stressFactor = toNumber(values.stressFactor);
  const waistCircumference = toNumber(values.waistCircumference);
  const hipCircumference = toNumber(values.hipCircumference);
  const heightInMeters = height ? height / 100 : null;

  const bmi = heightInMeters && weight ? weight / heightInMeters ** 2 : null;
  const percentIbw =
    idealBodyWeight && weight ? (weight / idealBodyWeight) * 100 : null;
  const adjustedBodyWeight =
    idealBodyWeight && weight
      ? idealBodyWeight + 0.25 * (weight - idealBodyWeight)
      : null;
  const weightChangePercent =
    usualBodyWeight && weight
      ? ((usualBodyWeight - weight) / usualBodyWeight) * 100
      : null;
  const waistHipRatio =
    waistCircumference && hipCircumference
      ? waistCircumference / hipCircumference
      : null;

  const mifflinOffset = values.gender === "Male" ? 5 : -161;
  const bee =
    weight && height && age ? 10 * weight + 6.25 * height - 5 * age + mifflinOffset : null;
  const tee = bee && activityFactor && stressFactor ? bee * activityFactor * stressFactor : null;
  const proteinLow = weight ? weight * 1 : null;
  const proteinHigh = weight ? weight * 1.5 : null;
  const fluidLow = weight ? weight * 30 : null;
  const fluidHigh = weight ? weight * 35 : null;

  return [
    {
      label: "BMI",
      value: formatNumber(bmi),
      detail: classifyBmi(bmi),
      interpretation: interpretationFor("bmi", bmi),
    },
    {
      label: "BMI Classification",
      value: classifyBmi(bmi),
      detail: "WHO adult classification",
      interpretation: interpretationFor("bmi", bmi),
    },
    {
      label: "% Ideal Body Weight",
      value: hasResult(percentIbw) ? `${formatNumber(percentIbw)}%` : "Pending",
      detail: "Current weight compared with IBW",
      interpretation: interpretationFor("percentIbw", percentIbw),
    },
    {
      label: "Adjusted Body Weight",
      value: hasResult(adjustedBodyWeight)
        ? `${formatNumber(adjustedBodyWeight)} kg`
        : "Pending",
      detail: "IBW + 25% of excess weight",
      interpretation: "requires follow-up",
    },
    {
      label: "Weight Change %",
      value: hasResult(weightChangePercent)
        ? `${formatNumber(weightChangePercent)}%`
        : "Pending",
      detail: "Positive value indicates weight loss from usual weight",
      interpretation: interpretationFor("weightChange", weightChangePercent),
    },
    {
      label: "Waist/Hip Ratio",
      value: hasResult(waistHipRatio) ? formatNumber(waistHipRatio, 2) : "Pending",
      detail: "Central adiposity screening indicator",
      interpretation: interpretationFor("waistHipRatio", waistHipRatio, {
        gender: values.gender,
      }),
    },
    {
      label: "BEE",
      value: hasResult(bee) ? `${Math.round(bee)} kcal/day` : "Pending",
      detail: "Mifflin-St Jeor equation",
      interpretation: "requires follow-up",
    },
    {
      label: "TEE",
      value: hasResult(tee) ? `${Math.round(tee)} kcal/day` : "Pending",
      detail: "BEE x activity factor x stress factor",
      interpretation: "requires follow-up",
    },
    {
      label: "Protein Requirement",
      value:
        hasResult(proteinLow) && hasResult(proteinHigh)
          ? `${formatNumber(proteinLow)}-${formatNumber(proteinHigh)} g/day`
          : "Pending",
      detail: "Estimated range using current body weight",
      interpretation: "requires follow-up",
    },
    {
      label: "Fluid Requirement",
      value:
        hasResult(fluidLow) && hasResult(fluidHigh)
          ? `${Math.round(fluidLow)}-${Math.round(fluidHigh)} mL/day`
          : "Pending",
      detail: "Estimated range using 30-35 mL/kg",
      interpretation: "requires follow-up",
    },
  ];
}

export function normalizePatient(patient) {
  if (patient) {
    return {
      ...patient,
      fullName: patient.fullName || patient.name || "Selected Patient",
      age: patient.age || "Not set",
      gender: patient.gender || "Not specified",
      height: patient.height || "",
      weight: patient.weight || "",
      diagnosis: patient.diagnosis || "No diagnosis recorded",
      notes: patient.notes || "No clinical notes recorded yet.",
    };
  }

  return {
    fullName: workspacePatient.name,
    age: workspacePatient.age,
    gender: workspacePatient.gender,
    height: "165",
    weight: "84",
    diagnosis: workspacePatient.diagnosis,
    notes: "Review dietary iron intake, GI tolerance, and follow-up labs.",
  };
}

export function generateInterventionDraft(selectedGoals, patient) {
  const hasGoal = (goal) => selectedGoals.includes(goal);
  const goals = selectedGoals.length
    ? selectedGoals.join(", ")
    : "Improve nutrition status and reduce clinical nutrition risk";

  return {
    nutritionGoals: `Primary goals: ${goals}. Align intervention with ${patient.fullName}'s diagnosis and tolerance.`,
    energyPrescription: hasGoal("Support weight gain")
      ? "Provide a gradual energy surplus using nutrient-dense meals and snacks as tolerated."
      : hasGoal("Support weight loss")
        ? "Create a modest energy deficit while preserving meal quality and satiety."
        : "Meet estimated energy needs and adjust based on weight trend, appetite, and clinical response.",
    proteinPrescription: hasGoal("Preserve lean body mass")
      ? "Prioritize high-quality protein at each meal and distribute intake evenly across the day."
      : "Provide adequate protein with each meal and reassess after anthropometric review.",
    fluidPrescription: "Target consistent daily hydration and adjust for medical restrictions, GI losses, or activity level.",
    dietType: hasGoal("Reduce GI symptoms")
      ? "Symptom-guided balanced diet with trigger review and gradual tolerance-based adjustments."
      : hasGoal("Improve glycemic control")
        ? "Consistent carbohydrate, high-fiber meal pattern with balanced protein and fat."
        : "Balanced oral diet individualized to diagnosis, preferences, and tolerance.",
    mealPattern: hasGoal("Improve oral intake") || hasGoal("Support weight gain")
      ? "Small frequent meals with planned nourishing snacks between meals."
      : "Structured meals with consistent timing and planned snacks when clinically indicated.",
    supplements: [
      hasGoal("Correct iron deficiency") ? "Review iron supplementation, timing, tolerance, and absorption support." : "",
      hasGoal("Improve vitamin D status") ? "Review vitamin D supplementation dose and follow-up labs." : "",
      hasGoal("Preserve lean body mass") ? "Consider protein supplement if food intake is insufficient." : "",
    ].filter(Boolean).join(" ") || "Review supplement need based on labs, intake, and medication profile.",
    foodRestrictions: hasGoal("Reduce GI symptoms")
      ? "Limit confirmed trigger foods only; avoid broad restrictions without clinical indication."
      : "Apply only medically necessary restrictions and protect dietary variety.",
    nutritionEducation: [
      hasGoal("Correct iron deficiency") ? "Teach iron-rich foods, vitamin C pairing, and inhibitors of absorption." : "",
      hasGoal("Improve glycemic control") ? "Teach carbohydrate consistency, plate balance, and label reading." : "",
      hasGoal("Improve vitamin D status") ? "Discuss vitamin D food sources, supplement adherence, and monitoring." : "",
      "Provide practical meal examples matched to patient preferences.",
    ].filter(Boolean).join(" "),
    counselingNotes: "Use motivational interviewing, identify barriers, set one to two achievable behavior targets, and document patient readiness.",
    followUpPlan: "Follow up in 2-4 weeks to review intake adherence, symptoms, weight trend, and relevant labs.",
  };
}

export function getInterventionStorageKey(patient) {
  return `nutripilot-interventions-${patient.id ?? patient.fullName}`;
}

export function getMonitoringStorageKey(patient) {
  return `nutripilot-monitoring-${patient.id ?? patient.fullName}`;
}

export function interpretMonitoringVisit(visit) {
  const notes = [];
  const weight = toNumber(visit.weight);
  const bmi = toNumber(visit.bmi);
  const labText = visit.labChanges.toLowerCase();
  const symptomsText = visit.symptoms.toLowerCase();

  if (weight) {
    notes.push("weight improved or documented for follow-up comparison");
  }

  if (bmi && bmi >= 18.5 && bmi < 30) {
    notes.push("BMI stable within a non-urgent monitoring range");
  } else if (bmi) {
    notes.push("BMI requires continued clinical monitoring");
  }

  if (
    labText.includes("low") ||
    labText.includes("high") ||
    labText.includes("abnormal") ||
    labText.includes("worse")
  ) {
    notes.push("labs need follow-up");
  }

  if (visit.dietaryCompliance === "Low") {
    notes.push("compliance low");
  }

  if (
    symptomsText.includes("worse") ||
    symptomsText.includes("vomit") ||
    symptomsText.includes("severe") ||
    symptomsText.includes("pain")
  ) {
    notes.push("symptoms worsening");
  }

  return notes.length ? notes : ["stable follow-up with routine monitoring recommended"];
}

export function getAiAssessmentStorageKey(patient) {
  return `nutripilot-ai-assessments-${patient.id ?? patient.fullName}`;
}

export function readJsonStorage(key, fallback = []) {
  const savedValue = localStorage.getItem(key);
  return savedValue ? JSON.parse(savedValue) : fallback;
}

export function collectClinicalData(patient) {
  const bmi = patient.bmi || calculateBmi(patient.height, patient.weight);
  const pesDiagnoses = readJsonStorage(getPesStorageKey(patient));
  const interventions = readJsonStorage(getInterventionStorageKey(patient));
  const monitoringVisits = readJsonStorage(getMonitoringStorageKey(patient));

  return {
    patient,
    anthropometric: {
      age: patient.age,
      gender: patient.gender,
      height: patient.height,
      weight: patient.weight,
      bmi,
      bmiClass: classifyBmi(Number(bmi)),
    },
    laboratory: sampleWorkspaceData.laboratory,
    dietary: sampleWorkspaceData.dietary,
    medical: {
      diagnosis: patient.diagnosis,
      notes: patient.notes,
      fields: sampleWorkspaceData.medical,
    },
    pesDiagnoses,
    interventions,
    monitoringVisits,
  };
}

export function buildAiAssessment(patient) {
  const data = collectClinicalData(patient);
  const bmi = Number(data.anthropometric.bmi);
  const latestPes = data.pesDiagnoses[0];
  const latestIntervention = data.interventions[0];
  const latestMonitoring = data.monitoringVisits[0];
  const diagnosisText = `${patient.diagnosis} ${patient.notes}`.toLowerCase();
  const latestMonitoringText = latestMonitoring
    ? `${latestMonitoring.symptoms} ${latestMonitoring.labChanges} ${latestMonitoring.dietaryCompliance}`.toLowerCase()
    : "";

  const problems = [];
  const diagnoses = [];
  const interventionPriorities = [];
  const monitoringPriorities = [];
  const redFlags = [];
  let riskScore = 0;

  if (Number.isFinite(bmi) && bmi < 18.5) {
    riskScore += 2;
    problems.push("Low BMI / undernutrition risk");
    diagnoses.push("Inadequate energy intake related to reduced intake as evidenced by low BMI.");
    interventionPriorities.push("Prioritize energy-dense meals and small frequent snacks.");
  } else if (Number.isFinite(bmi) && bmi >= 30) {
    riskScore += 1;
    problems.push("Elevated BMI / obesity-related nutrition risk");
    diagnoses.push("Excessive energy intake related to poor dietary habits as evidenced by high BMI.");
    interventionPriorities.push("Support gradual weight management with structured meals.");
  }

  if (diagnosisText.includes("iron") || diagnosisText.includes("ferritin")) {
    riskScore += 1;
    problems.push("Iron deficiency pattern requiring nutrition follow-up");
    diagnoses.push("Altered nutrition-related laboratory values related to chronic disease condition as evidenced by low ferritin.");
    interventionPriorities.push("Reinforce iron-rich foods, vitamin C pairing, and supplement timing review.");
    monitoringPriorities.push("Monitor ferritin, hemoglobin, tolerance, and adherence.");
  }

  if (diagnosisText.includes("ibs") || diagnosisText.includes("gi")) {
    riskScore += 1;
    problems.push("GI symptoms may limit intake tolerance");
    interventionPriorities.push("Use symptom-guided meal planning and review trigger patterns.");
    monitoringPriorities.push("Track bloating, bowel pattern, nausea, and food tolerance.");
  }

  if (latestPes) {
    problems.push(latestPes.problem);
    diagnoses.push(latestPes.statement);
    if (latestPes.priority === "High") {
      riskScore += 2;
    }
  }

  if (latestIntervention) {
    interventionPriorities.push(latestIntervention.plan.nutritionGoals);
  }

  if (latestMonitoring) {
    monitoringPriorities.push(`Review latest follow-up from ${latestMonitoring.visitDate || "recorded visit"}.`);
    monitoringPriorities.push(latestMonitoring.clinicalNotes);

    if (latestMonitoring.progressStatus === "Worsening") {
      riskScore += 2;
      redFlags.push("Progress status is worsening.");
    }

    if (latestMonitoring.progressStatus === "Needs urgent review") {
      riskScore += 3;
      redFlags.push("Follow-up marked as needing urgent review.");
    }

    if (latestMonitoring.dietaryCompliance === "Low") {
      riskScore += 1;
      problems.push("Low dietary compliance may delay progress.");
    }

    if (latestMonitoringText.includes("worse") || latestMonitoringText.includes("severe")) {
      riskScore += 2;
      redFlags.push("Symptoms appear to be worsening.");
    }
  }

  if (!monitoringPriorities.length) {
    monitoringPriorities.push("Complete follow-up visit documentation and monitor weight, BMI, labs, symptoms, and adherence.");
  }

  if (!interventionPriorities.length) {
    interventionPriorities.push("Complete intervention plan and align goals with diagnosis, intake, labs, and symptoms.");
  }

  if (!problems.length) {
    problems.push("Nutrition risk requires more complete clinical documentation.");
  }

  if (!diagnoses.length) {
    diagnoses.push("Food and nutrition-related knowledge deficit related to incomplete assessment data as evidenced by pending documentation.");
  }

  if (!redFlags.length) {
    redFlags.push("No urgent red flags identified from available data.");
  }

  const sourcesUsed = [
    data.anthropometric.bmi ? "Anthropometric Assessment" : "",
    data.laboratory.length ? "Laboratory Results" : "",
    data.dietary.length ? "Dietary Assessment" : "",
    data.medical.diagnosis ? "Medical History" : "",
    data.pesDiagnoses.length ? "Nutrition Diagnosis (PES)" : "",
    data.interventions.length ? "Nutrition Intervention" : "",
    data.monitoringVisits.length ? "Monitoring & Evaluation" : "",
  ].filter(Boolean);

  const riskLevel = riskScore >= 4 ? "High" : riskScore >= 2 ? "Moderate" : "Low";
  const confidence = sourcesUsed.length >= 6
    ? "High confidence"
    : sourcesUsed.length >= 4
      ? "Moderate confidence"
      : "Low confidence";

  return {
    id: `ai-assessment-${Date.now()}`,
    patientName: patient.fullName,
    savedAt: new Date().toLocaleString(),
    summary:
      `${patient.fullName} has ${riskLevel.toLowerCase()} nutrition risk based on available anthropometric, clinical, dietary, diagnosis, intervention, and monitoring data. The rule-based review highlights ${problems.slice(0, 2).join(" and ")}.`,
    riskLevel,
    confidence,
    problems: [...new Set(problems)],
    diagnoses: [...new Set(diagnoses)],
    interventionPriorities: [...new Set(interventionPriorities)],
    monitoringPriorities: [...new Set(monitoringPriorities)],
    redFlags: [...new Set(redFlags)],
    sourcesUsed,
  };
}

