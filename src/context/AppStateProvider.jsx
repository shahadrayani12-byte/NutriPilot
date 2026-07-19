import { useEffect, useMemo, useReducer } from "react";

import { managedPatients } from "../data/patientData";
import { defaultNutriGuideAssignments } from "../data/nutriGuideContent";
import { buildClinicalDecisionSupport } from "../utils/clinicalDecisionSupport";
import {
  enrichPatientForIntegration,
  generatePatientNotifications,
  generateWorkflowTasks,
  getWorkflowStatus,
  workflowStepDefinitions,
} from "../utils/workflowStatus";
import { AppStateContext } from "./AppStateContextValue";

const STORAGE_KEY = "nutripilot.appState.v1";

const defaultReports = [
  { id: "full-clinical", name: "Full Clinical Nutrition Report", status: "Ready", lastGenerated: "Today, 09:30 AM" },
  { id: "labs", name: "Laboratory Results Report", status: "Ready", lastGenerated: "Today, 09:30 AM" },
  { id: "ai-summary", name: "AI Clinical Summary Report", status: "Clinician review", lastGenerated: "Not generated" },
];

const defaultSchedule = [
  {
    id: "appt-1",
    patientName: "Sarah Ahmed",
    patientId: "patient-sarah-ahmed",
    clinician: "Dr. Shahad",
    organization: "NutriPilot Demo Hospital",
    branch: "Main Clinic",
    department: "Clinical Nutrition",
    type: "Lab Review",
    date: "2026-07-19",
    time: "08:00",
    endTime: "08:45",
    duration: 45,
    location: "Room 2",
    visitMode: "In-person",
    purpose: "Iron-related laboratory review",
    notes: "Review ferritin, hemoglobin, intake, and follow-up timing.",
    status: "Scheduled",
    linkedCareStage: "Assessment",
    createdBy: "Dr. Shahad",
    createdAt: "2026-07-19T08:00:00.000Z",
    updatedBy: "Dr. Shahad",
    updatedAt: "2026-07-19T08:00:00.000Z",
  },
  {
    id: "appt-2",
    patientName: "Mohammed Ali",
    patientId: "patient-mohammed-ali",
    clinician: "Dr. Shahad",
    organization: "NutriPilot Demo Hospital",
    branch: "Main Clinic",
    department: "Clinical Nutrition",
    type: "Follow-up",
    date: "2026-07-19",
    time: "09:00",
    endTime: "09:30",
    duration: 30,
    location: "Telehealth",
    visitMode: "Virtual",
    purpose: "Weight management follow-up",
    notes: "Review adherence and monitoring notes.",
    status: "Completed",
    linkedCareStage: "Monitoring & Outcomes",
    createdBy: "Dr. Shahad",
    createdAt: "2026-07-19T09:00:00.000Z",
    updatedBy: "Dr. Shahad",
    updatedAt: "2026-07-19T09:30:00.000Z",
  },
  {
    id: "appt-3",
    patientName: "Reem Hassan",
    patientId: "patient-reem-hassan",
    clinician: "Dr. Shahad",
    organization: "NutriPilot Demo Hospital",
    branch: "Pediatric Clinic",
    department: "Clinical Nutrition",
    type: "Initial Assessment",
    date: "2026-07-19",
    time: "11:00",
    endTime: "11:40",
    duration: 40,
    location: "Room 4",
    visitMode: "In-person",
    purpose: "Nutrition assessment and growth monitoring",
    notes: "Review vitamin D context and dietary intake.",
    status: "Scheduled",
    linkedCareStage: "Screening",
    createdBy: "Dr. Shahad",
    createdAt: "2026-07-19T11:00:00.000Z",
    updatedBy: "Dr. Shahad",
    updatedAt: "2026-07-19T11:00:00.000Z",
  },
];

function createInitialState() {
  const patients = managedPatients.map((patient, index) => enrichPatientForIntegration(patient, index));
  const activePatientId = patients[0]?.id || "";
  const activePatient = patients[0];

  const intelligence = activePatient ? buildClinicalDecisionSupport(activePatient) : null;

  return {
    activePatientId,
    activePatientOverride: null,
    aiSummary: {
      confidence: "Moderate",
      generatedAt: "Not generated",
      riskLevel: activePatient?.riskLevel || "Not classified",
      summary: "Rule-based AI summary will use the active patient workflow.",
    },
    notifications: activePatient ? mergeByTitle(generatePatientNotifications(activePatient), intelligence?.notifications || []) : [],
    patients,
    educationAssignments: defaultNutriGuideAssignments,
    reports: defaultReports,
    schedule: defaultSchedule,
    savedEducationContentIds: [],
    tasks: activePatient ? generateWorkflowTasks(activePatient) : [],
    workflowByPatientId: {},
  };
}

function loadInitialState() {
  const baseState = createInitialState();

  try {
    const storedState = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (!storedState) {
      return baseState;
    }

    return {
      ...baseState,
      ...storedState,
      patients: storedState.patients?.length ? storedState.patients : baseState.patients,
      workflowByPatientId: storedState.workflowByPatientId || {},
    };
  } catch {
    return baseState;
  }
}

function appStateReducer(state, action) {
  if (action.type === "SET_ACTIVE_PATIENT") {
    const activePatient = resolveStatePatient(state, action.patient);
    const activePatientId = activePatient.id;
    const patientWithWorkflow = attachWorkflowOverrides(state, activePatient);

    const intelligence = buildClinicalDecisionSupport(patientWithWorkflow, state);

    return {
      ...state,
      activePatientId,
      activePatientOverride: state.patients.some((patient) => patient.id === activePatientId) ? null : activePatient,
      aiSummary: buildAiSummary(patientWithWorkflow, intelligence),
      notifications: mergeByTitle(
        mergeByTitle(state.notifications, generatePatientNotifications(patientWithWorkflow)),
        intelligence.notifications,
      ),
      tasks: mergeById(state.tasks, generateWorkflowTasks(patientWithWorkflow)),
    };
  }

  if (action.type === "COMPLETE_WORKFLOW_STEP") {
    const patientId = action.patientId || state.activePatientId;
    const stepId = action.stepId;
    const completedAt = action.completedAt || new Date().toLocaleString();
    const workflowByPatientId = {
      ...state.workflowByPatientId,
      [patientId]: {
        ...(state.workflowByPatientId?.[patientId] || {}),
        [stepId]: "Completed",
      },
    };
    const nextState = { ...state, workflowByPatientId };
    const patient = attachWorkflowOverrides(nextState, resolveStatePatient(nextState, { id: patientId }));
    const intelligence = buildClinicalDecisionSupport(patient, nextState);
    const refreshedTasks = generateWorkflowTasks(patient);
    const reportUpdates = stepId === "reports"
      ? state.reports.map((report) => ({ ...report, lastGenerated: completedAt, status: "Ready" }))
      : state.reports;

    return {
      ...nextState,
      aiSummary: buildAiSummary(patient, intelligence),
      notifications: mergeByTitle(
        mergeByTitle(removeStepNotifications(state.notifications, patient, stepId), generatePatientNotifications(patient)),
        intelligence.notifications,
      ),
      reports: reportUpdates,
      tasks: mergeById(removeWorkflowStepTasks(state.tasks, patientId, stepId), refreshedTasks),
    };
  }

  if (action.type === "UPDATE_PATIENT") {
    const incomingPatient = normalizeIncomingPatient(action.patient);
    const patients = state.patients.map((patient) =>
      patient.id === incomingPatient.id ? enrichPatientForIntegration({ ...patient, ...incomingPatient }) : patient,
    );
    const nextState = {
      ...state,
      activePatientId: incomingPatient.id,
      activePatientOverride: patients.some((patient) => patient.id === incomingPatient.id) ? null : incomingPatient,
      patients: patients.some((patient) => patient.id === incomingPatient.id)
        ? patients
        : [enrichPatientForIntegration(incomingPatient), ...patients],
    };
    const patient = attachWorkflowOverrides(nextState, resolveStatePatient(nextState, incomingPatient));
    const intelligence = buildClinicalDecisionSupport(patient, nextState);

    return {
      ...nextState,
      aiSummary: buildAiSummary(patient, intelligence),
      notifications: mergeByTitle(
        mergeByTitle(state.notifications, generatePatientNotifications(patient)),
        intelligence.notifications,
      ),
      tasks: mergeById(state.tasks, generateWorkflowTasks(patient)),
    };
  }

  if (action.type === "ADD_TASK") {
    return { ...state, tasks: [action.task, ...state.tasks] };
  }

  if (action.type === "UPDATE_TASK") {
    return {
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === action.taskId ? { ...task, ...action.updates } : task,
      ),
    };
  }

  if (action.type === "DELETE_TASK") {
    return {
      ...state,
      tasks: state.tasks.filter((task) => task.id !== action.taskId),
    };
  }

  if (action.type === "ADD_EDUCATION_ASSIGNMENTS") {
    return {
      ...state,
      educationAssignments: mergeById(action.assignments, state.educationAssignments || []),
    };
  }

  if (action.type === "UPDATE_EDUCATION_ASSIGNMENT") {
    return {
      ...state,
      educationAssignments: (state.educationAssignments || []).map((assignment) =>
        assignment.id === action.assignmentId ? { ...assignment, ...action.updates } : assignment,
      ),
    };
  }

  if (action.type === "TOGGLE_SAVED_EDUCATION") {
    const currentIds = state.savedEducationContentIds || [];
    const isSaved = currentIds.includes(action.contentId);

    return {
      ...state,
      educationAssignments: (state.educationAssignments || []).map((assignment) =>
        assignment.contentId === action.contentId && assignment.patientId === state.activePatientId
          ? { ...assignment, saved: !isSaved }
          : assignment,
      ),
      savedEducationContentIds: isSaved
        ? currentIds.filter((contentId) => contentId !== action.contentId)
        : [action.contentId, ...currentIds],
    };
  }

  if (action.type === "ARCHIVE_NOTIFICATION") {
    return {
      ...state,
      notifications: state.notifications.filter((notification) => notification.id !== action.notificationId),
    };
  }

  if (action.type === "UPDATE_REPORT") {
    return {
      ...state,
      reports: state.reports.map((report) =>
        report.id === action.reportId ? { ...report, ...action.updates } : report,
      ),
    };
  }

  if (action.type === "UPDATE_APPOINTMENT") {
    return {
      ...state,
      schedule: state.schedule.map((appointment) =>
        appointment.id === action.appointmentId
          ? { ...appointment, ...action.updates, updatedAt: action.updatedAt || new Date().toISOString(), updatedBy: action.updatedBy || "Dr. Shahad" }
          : appointment,
      ),
    };
  }

  if (action.type === "ADD_APPOINTMENT") {
    return {
      ...state,
      schedule: [action.appointment, ...state.schedule],
    };
  }

  if (action.type === "DELETE_APPOINTMENT") {
    return {
      ...state,
      schedule: state.schedule.filter((appointment) => appointment.id !== action.appointmentId),
    };
  }

  if (action.type === "UPDATE_AI_SUMMARY") {
    return { ...state, aiSummary: { ...state.aiSummary, ...action.summary } };
  }

  return state;
}

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(appStateReducer, null, loadInitialState);

  const patientsWithWorkflow = useMemo(
    () => state.patients.map((patient) => attachWorkflowOverrides(state, patient)),
    [state],
  );

  const activePatient = useMemo(
    () =>
      patientsWithWorkflow.find((patient) => patient.id === state.activePatientId) ||
      attachWorkflowOverrides(state, state.activePatientOverride) ||
      patientsWithWorkflow[0],
    [patientsWithWorkflow, state],
  );

  const workflow = useMemo(() => getWorkflowStatus(activePatient), [activePatient]);
  const intelligence = useMemo(
    () => buildClinicalDecisionSupport(activePatient, state),
    [activePatient, state],
  );

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activePatientId: state.activePatientId,
        activePatientOverride: state.activePatientOverride,
        aiSummary: state.aiSummary,
        notifications: state.notifications,
        educationAssignments: state.educationAssignments,
        reports: state.reports,
        schedule: state.schedule,
        savedEducationContentIds: state.savedEducationContentIds,
        tasks: state.tasks,
        patients: state.patients,
        workflowByPatientId: state.workflowByPatientId,
      }),
    );
  }, [state]);

  const value = useMemo(
    () => ({
      activePatient,
      aiSummary: state.aiSummary,
      appState: state,
      completeWorkflowStep: (stepId, patient = activePatient) =>
        dispatch({ type: "COMPLETE_WORKFLOW_STEP", patientId: patient?.id || activePatient?.id, stepId }),
      dispatch,
      educationAssignments: state.educationAssignments || [],
      notifications: state.notifications,
      patients: patientsWithWorkflow,
      reports: state.reports,
      schedule: state.schedule,
      intelligence,
      addAppointment: (appointment) => dispatch({ type: "ADD_APPOINTMENT", appointment }),
      deleteAppointment: (appointmentId) => dispatch({ type: "DELETE_APPOINTMENT", appointmentId }),
      setActivePatient: (patient) => dispatch({ type: "SET_ACTIVE_PATIENT", patient }),
      tasks: state.tasks,
      deleteTask: (taskId) => dispatch({ type: "DELETE_TASK", taskId }),
      savedEducationContentIds: state.savedEducationContentIds || [],
      addEducationAssignments: (assignments) => dispatch({ type: "ADD_EDUCATION_ASSIGNMENTS", assignments }),
      toggleSavedEducation: (contentId) => dispatch({ type: "TOGGLE_SAVED_EDUCATION", contentId }),
      updateEducationAssignment: (assignmentId, updates) => dispatch({ type: "UPDATE_EDUCATION_ASSIGNMENT", assignmentId, updates }),
      updateAppointment: (appointmentId, updates) => dispatch({ type: "UPDATE_APPOINTMENT", appointmentId, updates }),
      updatePatient: (patient) => dispatch({ type: "UPDATE_PATIENT", patient }),
      workflow,
    }),
    [activePatient, intelligence, patientsWithWorkflow, state, workflow],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

function resolveStatePatient(state, patient) {
  const matchedPatient = state.patients.find(
    (item) =>
      item.id === patient?.id ||
      item.fullName === patient?.fullName ||
      item.fullName === patient?.name,
  );

  return matchedPatient || enrichPatientForIntegration(normalizeIncomingPatient(patient || state.patients[0]));
}

function normalizeIncomingPatient(patient) {
  const fullName = patient.fullName || patient.name || "Unknown Patient";
  const slug = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    ...patient,
    diagnosis: patient.diagnosis || patient.condition || "",
    fullName,
    id: patient.id || `patient-${slug || Date.now()}`,
  };
}

function attachWorkflowOverrides(state, patient) {
  if (!patient) return patient;

  return {
    ...patient,
    workflowOverrides: state.workflowByPatientId?.[patient.id] || {},
  };
}

function buildAiSummary(patient, intelligence = null) {
  const workflow = getWorkflowStatus(patient);
  const missingLabels = workflow.missing.map((step) => step.label).join(", ") || "No missing workflow steps";
  const riskLevel = intelligence?.riskEngine?.level || patient.riskLevel;

  return {
    confidence: workflow.percent >= 70 ? "High" : workflow.percent >= 40 ? "Moderate" : "Low",
    generatedAt: new Date().toLocaleString(),
    riskLevel,
    summary: `${patient.fullName} workflow is ${workflow.percent}% complete. Risk engine: ${riskLevel}. Missing or pending documentation: ${missingLabels}.`,
  };
}

function removeWorkflowStepTasks(tasks, patientId, stepId) {
  return tasks.filter((task) => task.id !== `workflow-${patientId}-${stepId}`);
}

function removeStepNotifications(notifications, patient, stepId) {
  const step = workflowStepDefinitions.find((item) => item.id === stepId);
  const patientName = patient?.fullName || "";
  const stepKeywords = [stepId, step?.label, notificationKeyword(stepId)].filter(Boolean).map((value) => value.toLowerCase());

  return notifications.filter((notification) => {
    const text = `${notification.title} ${notification.description}`.toLowerCase();
    const belongsToPatient = patientName ? text.includes(patientName.toLowerCase()) : true;
    const belongsToStep = stepKeywords.some((keyword) => text.includes(keyword));
    return !(belongsToPatient && belongsToStep);
  });
}

function notificationKeyword(stepId) {
  const keywords = {
    assessment: "assessment",
    labs: "laboratory",
    monitoring: "follow-up",
    pes: "pes",
    reports: "report",
  };

  return keywords[stepId];
}

function mergeById(currentItems, incomingItems) {
  const itemMap = new Map(currentItems.map((item) => [item.id, item]));
  incomingItems.forEach((item) => itemMap.set(item.id, itemMap.get(item.id) || item));
  return Array.from(itemMap.values());
}

function mergeByTitle(currentItems, incomingItems) {
  const itemMap = new Map(currentItems.map((item) => [item.title, item]));
  incomingItems.forEach((item, index) =>
    itemMap.set(item.title, itemMap.get(item.title) || { ...item, id: `state-notification-${Date.now()}-${index}` }),
  );
  return Array.from(itemMap.values());
}
