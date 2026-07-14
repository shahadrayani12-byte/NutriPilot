import { useEffect, useMemo, useReducer } from "react";

import { managedPatients } from "../data/patientData";
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
  { id: "appt-1", patientName: "Sarah Ahmed", time: "08:00", type: "Lab Review", status: "Scheduled" },
  { id: "appt-2", patientName: "Mohammed Ali", time: "09:00", type: "Follow-up", status: "Completed" },
  { id: "appt-3", patientName: "Reem Hassan", time: "11:00", type: "Initial Assessment", status: "Scheduled" },
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
    reports: defaultReports,
    schedule: defaultSchedule,
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
        appointment.id === action.appointmentId ? { ...appointment, ...action.updates } : appointment,
      ),
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
        reports: state.reports,
        schedule: state.schedule,
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
      notifications: state.notifications,
      patients: patientsWithWorkflow,
      reports: state.reports,
      schedule: state.schedule,
      intelligence,
      setActivePatient: (patient) => dispatch({ type: "SET_ACTIVE_PATIENT", patient }),
      tasks: state.tasks,
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
