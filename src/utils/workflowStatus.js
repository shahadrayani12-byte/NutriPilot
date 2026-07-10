import { calculateBmi } from "../data/patientData";

export const workflowStepDefinitions = [
  { id: "summary", label: "Patient Summary", tabId: "summary" },
  { id: "assessment", label: "Assessment", tabId: "anthropometric" },
  { id: "labs", label: "Laboratory Review", tabId: "laboratory" },
  { id: "dietary", label: "Dietary Assessment", tabId: "dietary" },
  { id: "medical", label: "Medical History", tabId: "medical" },
  { id: "ai", label: "AI Review", tabId: "ai" },
  { id: "pes", label: "PES Diagnosis", tabId: "pes" },
  { id: "intervention", label: "Nutrition Intervention", tabId: "intervention" },
  { id: "monitoring", label: "Monitoring & Follow-up", tabId: "monitoring" },
  { id: "reports", label: "Report Generation", tabId: "reports" },
];

export function enrichPatientForIntegration(patient, index = 0) {
  const diagnosis = cleanText(patient.diagnosis || "");
  const bmi = calculateBmi(patient.height, patient.weight);
  const riskLevel = getRiskLevel(diagnosis, bmi);

  return {
    ...patient,
    bmi,
    diagnosis,
    lastUpdated: ["Today", "Yesterday", "2 days ago"][index % 3],
    nutritionStatus: getNutritionStatus(diagnosis, bmi),
    riskLevel,
  };
}

export function getWorkflowStatus(patient) {
  const statusById = {
    ...buildStatusById(patient),
    ...(patient?.workflowOverrides || {}),
  };
  const steps = workflowStepDefinitions.map((step) => ({
    ...step,
    complete: statusById[step.id] === "Completed",
    status: statusById[step.id],
  }));
  const completed = steps.filter((step) => step.status === "Completed").length;
  const actionableSteps = steps.filter((step) =>
    ["Missing", "Needs Review", "In Progress"].includes(step.status),
  );
  const nextStep = actionableSteps[0] || steps[steps.length - 1];

  return {
    alerts: generateWorkflowAlerts(patient, steps),
    completed,
    missing: steps.filter((step) => step.status === "Missing"),
    needsReview: steps.filter((step) => step.status === "Needs Review"),
    nextStep,
    percent: Math.round((completed / steps.length) * 100),
    steps,
    total: steps.length,
  };
}

export function getWorkflowNextAction(patient) {
  const workflow = getWorkflowStatus(patient);
  const nextStep = workflow.nextStep;

  return {
    ...nextStep,
    actionLabel: nextActionLabel(nextStep.id),
    reason: nextStepReason(nextStep.id, nextStep.status),
  };
}

function buildStatusById(patient) {
  const diagnosis = patient?.diagnosis?.toLowerCase?.() || "";
  const notes = patient?.notes?.toLowerCase?.() || "";
  const riskLevel = patient?.riskLevel || getRiskLevel(patient?.diagnosis || "", patient?.bmi);
  const hasAnthropometrics = Boolean(patient?.height && patient?.weight);
  const hasLabSignal = diagnosis.includes("deficiency") || diagnosis.includes("iron") || diagnosis.includes("ckd");
  const hasDietarySignal = Boolean(patient?.notes);
  const hasPes = !diagnosis.includes("vitamin d") && !diagnosis.includes("obesity");
  const hasIntervention = riskLevel !== "High Risk" || notes.includes("plan");
  const hasMonitoring = notes.includes("follow") || notes.includes("monitor");
  const aiReady = riskLevel !== "Low Risk";
  const reportReady = hasPes && hasIntervention && hasMonitoring;

  return {
    ai: aiReady ? "Needs Review" : "Missing",
    assessment: hasAnthropometrics ? "Completed" : "In Progress",
    dietary: hasDietarySignal ? "Completed" : "Missing",
    intervention: hasIntervention ? "Completed" : "Missing",
    labs: hasLabSignal ? "Needs Review" : "Missing",
    medical: diagnosis ? "Completed" : "Missing",
    monitoring: hasMonitoring ? "Completed" : "Missing",
    pes: hasPes ? "Completed" : "Missing",
    reports: reportReady ? "Needs Review" : "Missing",
    summary: patient?.fullName ? "Completed" : "In Progress",
  };
}

export function generateWorkflowTasks(patient) {
  const workflow = getWorkflowStatus(patient);

  return [...workflow.missing, ...workflow.needsReview].slice(0, 5).map((step, index) => ({
    id: `workflow-${patient.id}-${step.id}`,
    title: workflowTaskTitle(step.id, patient.fullName, step.status),
    description: `${step.label} is ${step.status.toLowerCase()} for the active patient workflow.`,
    category: taskCategory(step.id),
    priority: index < 2 || patient.riskLevel === "High Risk" ? "High" : "Medium",
    status: "Not Started",
    dueDate: index < 2 ? "Today" : "This week",
    assignedTo: "Clinical Dietitian",
    relatedPatient: patient.fullName,
    relatedProject: "None",
    relatedModule: `Clinical Hub / ${step.label}`,
    progress: 0,
    notes: "Generated locally from placeholder workflow status.",
    reason: `${step.label} is ${step.status.toLowerCase()} in the active patient journey.`,
    nextAction: "Open Clinical Hub",
  }));
}

export function generatePatientNotifications(patient) {
  const workflowAlerts = getWorkflowStatus(patient).alerts.map((alert) => ({
    category: alert.category,
    title: alert.title,
    description: alert.description,
    priority: alert.priority,
  }));

  return [
    ...workflowAlerts,
    patient.riskLevel === "High Risk"
      ? {
          category: "AI Notifications",
          title: `High nutrition risk detected for ${patient.fullName}`,
          description: "Active patient workflow indicates high-risk follow-up is needed.",
          priority: "High",
        }
      : null,
    {
      category: "AI Notifications",
      title: `AI review ready for ${patient.fullName}`,
      description: "Rule-based AI review is available from active patient data.",
      priority: "Medium",
    },
    {
      category: "Reports Notifications",
      title: `Report ready for ${patient.fullName}`,
      description: "Clinical nutrition report preview can be generated from current workflow data.",
      priority: "Low",
    },
    {
      category: "Patient Messages",
      title: `Upcoming follow-up for ${patient.fullName}`,
      description: "Follow-up timing should be reviewed in Schedule Center.",
      priority: patient.riskLevel === "Low Risk" ? "Medium" : "High",
    },
  ].filter(Boolean);
}

export function generateWorkflowAlerts(patient, steps = null) {
  const workflowStepsForAlerts = steps || workflowStepDefinitions.map((step) => ({
    ...step,
    status: { ...buildStatusById(patient), ...(patient?.workflowOverrides || {}) }[step.id],
  }));
  const stepById = Object.fromEntries(workflowStepsForAlerts.map((step) => [step.id, step]));
  const patientName = patient?.fullName || "Active patient";

  return [
    stepById.labs?.status === "Missing"
      ? {
          category: "AI Notifications",
          description: "Laboratory review is incomplete for the active patient workflow.",
          priority: "Medium",
          title: `Laboratory pending for ${patientName}`,
        }
      : null,
    stepById.labs?.status === "Needs Review"
      ? {
          category: "AI Notifications",
          description: "Laboratory values require clinician review before final documentation.",
          priority: "Medium",
          title: `Laboratory review needed for ${patientName}`,
        }
      : null,
    stepById.pes?.status === "Missing"
      ? {
          category: "AI Notifications",
          description: "PES diagnosis is required before finalizing the care plan.",
          priority: "High",
          title: `Missing PES for ${patientName}`,
        }
      : null,
    stepById.intervention?.status === "Missing"
      ? {
          category: "Patient Messages",
          description: "Nutrition intervention plan is not yet complete.",
          priority: "High",
          title: `Missing intervention for ${patientName}`,
        }
      : null,
    stepById.monitoring?.status === "Missing"
      ? {
          category: "Patient Messages",
          description: "No follow-up monitoring signal is available yet.",
          priority: "Medium",
          title: `Follow-up overdue for ${patientName}`,
        }
      : null,
    stepById.reports?.status === "Missing"
      ? {
          category: "Reports Notifications",
          description: "Clinical report has not been generated from the workflow.",
          priority: "Medium",
          title: `Report not generated for ${patientName}`,
        }
      : null,
    stepById.ai?.status === "Needs Review"
      ? {
          category: "AI Notifications",
          description: "AI review is available and requires clinician confirmation.",
          priority: "Medium",
          title: `AI review needed for ${patientName}`,
        }
      : null,
  ].filter(Boolean);
}

export function cleanText(value) {
  const fromCodes = (codes) => codes.map((code) => String.fromCharCode(code)).join("");
  const badBullet = fromCodes([0x00e2, 0x20ac, 0x00a2]);
  const oldBullet = fromCodes([0x0623, 0x00a2, 0x00e2, 0x201a, 0x00ac, 0x0622, 0x00a2]);
  const oldDoubleEncodedBullet = fromCodes([0x0637, 0x00a3, 0x0622, 0x00a2, 0x0623, 0x00a2, 0x00e2, 0x20ac, 0x0691, 0x0622, 0x00ac, 0x0637, 0x00a2, 0x0622, 0x00a2]);
  const bullet = fromCodes([0x2022]);

  return String(value)
    .replaceAll(badBullet, bullet)
    .replaceAll(oldBullet, bullet)
    .replaceAll(oldDoubleEncodedBullet, bullet);
}

function getRiskLevel(diagnosis, bmi) {
  const normalizedDiagnosis = diagnosis.toLowerCase();
  const numericBmi = Number(bmi);

  if (
    normalizedDiagnosis.includes("deficiency") ||
    normalizedDiagnosis.includes("iron") ||
    normalizedDiagnosis.includes("ckd") ||
    (numericBmi && (numericBmi < 18.5 || numericBmi >= 30))
  ) {
    return "High Risk";
  }

  if (normalizedDiagnosis.includes("ibs") || normalizedDiagnosis.includes("obesity") || (numericBmi && numericBmi >= 25)) {
    return "Moderate Risk";
  }

  return "Low Risk";
}

function getNutritionStatus(diagnosis, bmi) {
  const normalizedDiagnosis = diagnosis.toLowerCase();
  const numericBmi = Number(bmi);

  if (normalizedDiagnosis.includes("deficiency") || normalizedDiagnosis.includes("iron")) return "Micronutrient review";
  if (numericBmi >= 30) return "Weight management";
  if (numericBmi && numericBmi < 18.5) return "Undernutrition risk";
  return "Stable nutrition";
}

function workflowTaskTitle(stepId, patientName, status) {
  if (status === "Needs Review") {
    return reviewTaskTitle(stepId, patientName);
  }

  const titles = {
    ai: `Review AI summary for ${patientName}`,
    dietary: `Review missing dietary recall for ${patientName}`,
    intervention: `Create intervention plan for ${patientName}`,
    labs: `Review missing lab data for ${patientName}`,
    monitoring: `Schedule follow-up for ${patientName}`,
    pes: `Complete PES diagnosis for ${patientName}`,
    reports: `Generate clinical report for ${patientName}`,
  };

  return titles[stepId] || `Complete ${stepId} for ${patientName}`;
}

function reviewTaskTitle(stepId, patientName) {
  const titles = {
    ai: `Review AI output for ${patientName}`,
    labs: `Review laboratory findings for ${patientName}`,
    reports: `Generate report for ${patientName}`,
  };

  return titles[stepId] || `Review ${stepId} for ${patientName}`;
}

function nextActionLabel(stepId) {
  const labels = {
    ai: "Review AI insights",
    assessment: "Open assessment",
    dietary: "Complete dietary assessment",
    intervention: "Create nutrition intervention",
    labs: "Complete laboratory review",
    medical: "Complete medical history",
    monitoring: "Schedule follow-up",
    pes: "Create PES diagnosis",
    reports: "Generate report",
    summary: "Review patient summary",
  };

  return labels[stepId] || "Open next workflow step";
}

function nextStepReason(stepId, status) {
  const reasons = {
    ai: "AI review should be confirmed before relying on generated insights.",
    intervention: "A care plan needs an intervention before monitoring can be meaningful.",
    labs: "Laboratory data needs review before strong clinical interpretation.",
    monitoring: "Follow-up keeps the care plan accountable over time.",
    pes: "PES diagnosis links assessment findings to intervention planning.",
    reports: "A report closes the workflow for communication and documentation.",
  };

  return reasons[stepId] || `This step is currently ${status.toLowerCase()} and should be addressed next.`;
}

function taskCategory(stepId) {
  const categories = {
    ai: "AI Review",
    dietary: "Follow-up",
    intervention: "Clinical",
    labs: "Laboratory",
    monitoring: "Follow-up",
    pes: "Clinical",
    reports: "Reports",
  };

  return categories[stepId] || "Clinical";
}





