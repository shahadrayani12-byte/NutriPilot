import { NUTRIMAP_SYSTEMS } from "../data/nutrimapSystems.js";
import { cleanText, getWorkflowStatus } from "./workflowStatus.js";

export const globalSearchAliases = [
  ["iron", "حديد", "ferritin", "فيريتين", "blood", "دم"],
  ["patient", "مريض", "patients", "مرضى"],
  ["report", "تقرير", "reports", "تقارير"],
  ["laboratory", "مختبر", "تحاليل", "lab", "labs"],
  ["appointment", "موعد", "schedule", "جدول"],
  ["research", "بحث", "دراسة"],
  ["nutrition", "تغذية", "dietary", "غذائي"],
  ["education", "تثقيف", "guide", "دليل", "nutriguide"],
  ["assessment", "تقييم", "anthropometric", "قياسات"],
  ["diagnosis", "تشخيص", "pes"],
  ["intervention", "تدخل", "plan", "خطة"],
  ["monitoring", "متابعة", "follow-up", "مراجعة"],
  ["ai", "ذكاء", "مساعد"],
  ["vitamin d", "فيتامين د"],
  ["bmi", "مؤشر كتلة الجسم"],
  ["kidney", "كلى", "renal"],
  ["heart", "قلب"],
  ["liver", "كبد"],
  ["brain", "دماغ", "مخ"],
  ["bone", "عظام"],
  ["muscle", "عضلات"],
];

const clinicalModules = [
  ["summary", "Patient Summary", "Clinical Hub patient overview and notes."],
  ["anthropometric", "Anthropometric Assessment", "Height, weight, BMI, activity factors, and assessment results."],
  ["laboratory", "Laboratory Results", "Nutrition-related lab values including ferritin, Hb, vitamin D, glucose, and lipids."],
  ["dietary", "Dietary Assessment", "24-hour recall, meal pattern, appetite, hydration, and barriers."],
  ["medical", "Medical History", "Diagnosis, medication, allergies, GI symptoms, and lifestyle notes."],
  ["pes", "Nutrition Diagnosis (PES)", "Problem, etiology, signs, symptoms, priority, and diagnosis history."],
  ["intervention", "Nutrition Intervention", "Nutrition goals, prescriptions, education, counseling, and follow-up plan."],
  ["monitoring", "Monitoring & Evaluation", "Follow-up visits, trends, compliance, symptoms, and monitoring notes."],
  ["ai", "AI Insights", "Rule-based clinical summary, red flags, and review priorities."],
];

const aiSections = [
  "AI Clinical Brief",
  "Clinical Priorities",
  "Missing Information",
  "Suggested Actions",
  "Evidence placeholder",
  "AI Audit Trail",
];

const researchSections = [
  "Research Command Center",
  "Research Canvas",
  "Literature Intelligence",
  "Dataset Control Room",
  "Publication Readiness",
];

const reportTypes = [
  "Full Clinical Nutrition Report",
  "Anthropometric Assessment",
  "Laboratory Results",
  "Dietary Assessment",
  "Medical History",
  "Nutrition Diagnosis (PES)",
  "Nutrition Intervention",
  "Monitoring & Evaluation",
  "Follow-up Report",
  "AI Clinical Summary",
  "Research Summary",
  "Discharge Nutrition Summary",
];

export function buildGlobalSearchResults(query, { activePatient, patients = [], reports = [], schedule = [], tasks = [] }) {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return [];

  const expandedQuery = expandQuery(normalizedQuery);
  const results = [
    ...buildPatientResults(expandedQuery, patients),
    ...buildClinicalResults(expandedQuery, activePatient),
    ...buildLaboratoryResults(expandedQuery, patients),
    ...buildReportResults(expandedQuery, reports),
    ...buildTaskResults(expandedQuery, tasks, patients),
    ...buildScheduleResults(expandedQuery, schedule, patients),
    ...buildResearchResults(expandedQuery),
    ...buildNutriGuideResults(expandedQuery),
    ...buildNutriMapResults(expandedQuery),
    ...buildAiResults(expandedQuery, activePatient),
  ];

  return results
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 36);
}

export function groupGlobalSearchResults(results) {
  return results.reduce((groups, result) => {
    const nextGroups = { ...groups };
    nextGroups[result.group] = [...(nextGroups[result.group] || []), result];
    return nextGroups;
  }, {});
}

export function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[إأآا]/g, "ا")
    .replace(/[ى]/g, "ي")
    .replace(/[ة]/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function expandQuery(query) {
  const aliases = globalSearchAliases
    .filter((group) => group.some((alias) => normalizeSearchText(alias).includes(query) || query.includes(normalizeSearchText(alias))))
    .flat()
    .map(normalizeSearchText);

  return [query, ...aliases];
}

function buildPatientResults(query, patients) {
  return patients.map((patient) => {
    const diagnosis = cleanText(patient.diagnosis || "");
    const text = [
      patient.fullName,
      patient.name,
      patient.id,
      patient.mrn,
      diagnosis,
      patient.riskLevel,
      patient.nutritionStatus,
      patient.bmi,
      patient.notes,
    ].join(" ");

    return createResult({
      category: "Patient",
      description: `${diagnosis || "No diagnosis recorded"} - ${patient.riskLevel || "Risk not classified"}`,
      group: "Patients",
      page: "workspace",
      patient,
      patientName: patient.fullName || patient.name,
      tabId: "summary",
      text,
      title: patient.fullName || patient.name,
    }, query);
  });
}

function buildClinicalResults(query, activePatient) {
  return clinicalModules.map(([tabId, title, description]) =>
    createResult({
      category: "Clinical Module",
      description,
      group: "Clinical",
      page: "workspace",
      patient: activePatient,
      patientName: activePatient?.fullName,
      tabId,
      text: `${title} ${description} ${activePatient?.fullName || ""} ${activePatient?.diagnosis || ""}`,
      title,
    }, query),
  );
}

function buildLaboratoryResults(query, patients) {
  const labLabels = [
    ["Ferritin", "iron حديد فيريتين"],
    ["Hemoglobin", "hb anemia iron دم"],
    ["Vitamin D", "فيتامين د bone bones"],
    ["Albumin", "protein inflammation"],
    ["BMI", "body mass index مؤشر كتلة الجسم"],
  ];

  return patients.flatMap((patient) =>
    labLabels.map(([label, aliases]) =>
      createResult({
        category: "Laboratory",
        description: `${label} result or placeholder linked to ${patient.fullName || patient.name}.`,
        group: "Laboratory",
        page: "workspace",
        patient,
        patientName: patient.fullName || patient.name,
        tabId: label === "BMI" ? "anthropometric" : "laboratory",
        text: `${label} ${aliases} ${patient.fullName || patient.name} ${patient.diagnosis || ""} ${patient.bmi || ""}`,
        title: `${label} - ${patient.fullName || patient.name}`,
      }, query),
    ),
  );
}

function buildReportResults(query, reports) {
  const reportStateResults = reports.map((report) =>
    createResult({
      category: "Report",
      description: `${report.status || "Draft"} - last generated: ${report.lastGenerated || "Not generated"}`,
      group: "Reports",
      page: "reports",
      text: `${report.name} ${report.status} ${report.lastGenerated} report تقرير`,
      title: report.name,
    }, query),
  );

  const typeResults = reportTypes.map((title) =>
    createResult({
      category: "Report Type",
      description: "Open Clinical Report Studio and prepare this report type.",
      group: "Reports",
      page: "reports",
      text: `${title} report تقرير clinical nutrition`,
      title,
    }, query),
  );

  return [...reportStateResults, ...typeResults];
}

function buildTaskResults(query, tasks, patients) {
  return tasks.map((task) => {
    const patient = findPatientByName(patients, task.relatedPatient);

    return createResult({
      category: task.category || "Task",
      description: `${task.priority || "Priority not set"} - ${task.status || "Status not set"}`,
      group: "Daily Work",
      page: task.category === "AI Review" ? "ai" : "tasks",
      patient,
      patientName: task.relatedPatient,
      text: `${task.title} ${task.description} ${task.category} ${task.relatedPatient} ${task.relatedModule} task مهمة`,
      title: task.title,
    }, query);
  });
}

function buildScheduleResults(query, schedule, patients) {
  return schedule.map((appointment) => {
    const patient = findPatientByName(patients, appointment.patientName);

    return createResult({
      category: "Appointment",
      description: `${appointment.time || "Time pending"} - ${appointment.type || "Appointment"} - ${appointment.status || "Scheduled"}`,
      group: "Daily Work",
      page: "appointments",
      patient,
      patientName: appointment.patientName,
      text: `${appointment.patientName} ${appointment.time} ${appointment.type} ${appointment.status} appointment موعد schedule`,
      title: appointment.patientName || appointment.type,
    }, query);
  });
}

function buildResearchResults(query) {
  return researchSections.map((section) =>
    createResult({
      category: "Research",
      description: "Open the Research Center workspace.",
      group: "Research",
      page: "research",
      text: `${section} research بحث study protocol dataset publication`,
      title: section,
    }, query),
  );
}

function buildNutriGuideResults(query) {
  return [
    ["For You", "Personalized educational materials from documented patient context."],
    ["Sent by Your Dietitian", "Educational materials assigned by the dietitian."],
    ["All Topics", "Browse nutrition education topics, guides, recipes, and checklists."],
    ["Recipes & Meal Ideas", "General educational recipes and meal ideas."],
    ["Saved", "Saved patient education materials."],
  ].map(([title, description]) =>
    createResult({
      category: "NutriGuide",
      description,
      group: "Clinical",
      page: "nutriguide",
      text: `${title} nutriguide nutrition education تثقيف تغذية دليل وصفات recipes patient portal`,
      title,
    }, query),
  );
}

function buildNutriMapResults(query) {
  return NUTRIMAP_SYSTEMS.map((system) =>
    createResult({
      category: "NutriMap",
      description: `${system.status} status - ${system.labs.slice(0, 2).join(", ")}`,
      group: "NutriMap",
      organId: system.id,
      page: "nutrimap",
      text: `${system.label} ${system.shortLabel || ""} ${system.labs.join(" ")} ${system.risks.join(" ")} nutrimap organ`,
      title: system.label,
    }, query),
  );
}

function buildAiResults(query, activePatient) {
  const workflow = activePatient ? getWorkflowStatus(activePatient) : null;

  return aiSections.map((section) =>
    createResult({
      category: "AI Center",
      description: workflow
        ? `${workflow.percent}% workflow complete for ${activePatient.fullName}.`
        : "Open rule-based AI Center.",
      group: "Clinical",
      page: "ai",
      patient: activePatient,
      patientName: activePatient?.fullName,
      text: `${section} ai ذكاء missing data clinical brief evidence recommendations ${activePatient?.fullName || ""}`,
      title: section,
    }, query),
  );
}

function createResult(result, query) {
  const searchableText = normalizeSearchText(result.text);
  const score = query.reduce((total, token) => {
    if (!token) return total;
    if (searchableText === token) return total + 100;
    if (searchableText.includes(token)) return total + (searchableText.startsWith(token) ? 25 : 12);
    return total;
  }, 0);

  return {
    ...result,
    id: `${result.group}-${result.category}-${result.title}-${result.patientName || "global"}`,
    score,
  };
}

function findPatientByName(patients, patientName) {
  if (!patientName || patientName === "None") return null;

  return patients.find((patient) => patient.fullName === patientName || patient.name === patientName) || null;
}
