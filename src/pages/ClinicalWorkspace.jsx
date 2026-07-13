import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  FlaskConical,
  HelpCircle,
  Menu,
  MoreHorizontal,
  Plus,
  Save,
  Target,
  Trash2,
  Utensils,
  User,
} from "lucide-react";

import { ClinicalWorkspaceTabs } from "../components/clinical/ClinicalWorkspaceTabs";
import { ClinicalWorkflowEngine } from "../components/clinical/ClinicalWorkflowEngine";
import { workspaceTabs } from "../components/clinical/clinicalData";
import {
  NutriBadge,
  NutriButton,
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
  NutriPanel,
  NutriSectionHeader,
} from "../components/common/NutriPilotPrimitives";
import { ActivePatientBanner } from "../components/common/ActivePatientBanner";
import { GlobalSearch } from "../components/common/GlobalSearch";
import { normalizePatient } from "../utils/clinicalWorkspaceUtils";
import { buildClinicalDecisionSupport } from "../utils/clinicalDecisionSupport";
import { getWorkflowNextAction, getWorkflowStatus } from "../utils/workflowStatus";
import { useTranslation } from "../i18n";

export default function ClinicalWorkspace({ globalSearchProps, initialTab = "summary", intelligence, onCompleteWorkflowStep, onNavigate, patient, updatePatient }) {
  const [activeTab, setActiveTab] = useState(initialTab === "dietPlan" ? "summary" : initialTab);
  const workspacePatientRecord = normalizePatient(patient);
  const patientSignature = JSON.stringify(workspacePatientRecord);
  const [draftPatient, setDraftPatient] = useState(() => createClinicalDraft(workspacePatientRecord));
  const [savedSnapshot, setSavedSnapshot] = useState(() => createClinicalDraft(workspacePatientRecord));
  const [recoveryDraft, setRecoveryDraft] = useState(() => loadClinicalDraft(workspacePatientRecord.id));
  const [autosaveStatus, setAutosaveStatus] = useState("Saved");
  const [savedAt, setSavedAt] = useState(null);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isCompletionOpen, setIsCompletionOpen] = useState(false);
  const [highlightedTab, setHighlightedTab] = useState("");
  const moduleSectionRef = useRef(null);
  const highlightTimerRef = useRef(null);
  const activeTabConfig = useMemo(() => workspaceTabs.find((tab) => tab.id === activeTab), [activeTab]);
  const ActiveIcon = activeTabConfig?.icon || User;
  const activeWorkflowStepId = clinicalTabToWorkflowStep(activeTab);
  const hasChanges = useMemo(() => JSON.stringify(draftPatient) !== JSON.stringify(savedSnapshot), [draftPatient, savedSnapshot]);
  const tabStatuses = useMemo(() => getClinicalTabStatuses(draftPatient), [draftPatient]);
  const clinicalDraftPatient = useMemo(
    () => normalizePatient(mergeClinicalDraft(workspacePatientRecord, draftPatient)),
    [draftPatient, workspacePatientRecord],
  );
  const handleSetActiveTab = useCallback((tabId) => {
    if (tabId === "dietPlan") {
      onNavigate?.("diet-plans");
      return;
    }

    setActiveTab(tabId);
    setHighlightedTab(tabId);
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = window.setTimeout(() => setHighlightedTab(""), 1200);
    window.requestAnimationFrame(() => {
      moduleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [onNavigate]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextDraft = createClinicalDraft(JSON.parse(patientSignature));
      setDraftPatient(nextDraft);
      setSavedSnapshot(nextDraft);
      setRecoveryDraft(loadClinicalDraft(workspacePatientRecord.id));
      setAutosaveStatus("Saved");
      setSavedAt(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [patientSignature, workspacePatientRecord.id]);

  useEffect(() => {
    localStorage.setItem(clinicalTabStorageKey(workspacePatientRecord.id), activeTab);
  }, [activeTab, workspacePatientRecord.id]);

  useEffect(() => {
    if (!hasChanges) {
      return undefined;
    }

    saveClinicalDraft(workspacePatientRecord.id, draftPatient);
    const timer = window.setTimeout(() => {
      try {
        setAutosaveStatus("Saving...");
        const updatedPatient = mergeClinicalDraft(workspacePatientRecord, draftPatient);
        updatePatient?.(updatedPatient);
        setSavedSnapshot(createClinicalDraft(updatedPatient));
        clearClinicalDraft(workspacePatientRecord.id);
        setRecoveryDraft(null);
        setAutosaveStatus("Saved");
        setSavedAt(Date.now());
      } catch {
        setAutosaveStatus("Save failed");
      }
    }, 1700);

    return () => window.clearTimeout(timer);
  }, [draftPatient, hasChanges, updatePatient, workspacePatientRecord]);

  function updateDraftField(field, value) {
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((current) => ({ ...current, [field]: value }));
  }

  function updateDraftRow(collectionName, itemId, field, value) {
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((current) => ({
      ...current,
      [collectionName]: current[collectionName].map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addDraftRow(collectionName, template) {
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((current) => ({
      ...current,
      [collectionName]: [{ ...template, id: `${collectionName}-${Date.now()}` }, ...current[collectionName]],
    }));
  }

  function deleteDraftRow(collectionName, itemId) {
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((current) => ({
      ...current,
      [collectionName]: current[collectionName].filter((item) => item.id !== itemId),
    }));
  }

  function saveChanges() {
    try {
      setAutosaveStatus("Saving...");
      const updatedPatient = mergeClinicalDraft(workspacePatientRecord, draftPatient);
      updatePatient?.(updatedPatient);
      setSavedSnapshot(createClinicalDraft(updatedPatient));
      clearClinicalDraft(workspacePatientRecord.id);
      setRecoveryDraft(null);
      setAutosaveStatus("Saved");
      setSavedAt(Date.now());
    } catch {
      setAutosaveStatus("Save failed");
    }
  }

  function cancelChanges() {
    setDraftPatient(savedSnapshot);
    clearClinicalDraft(workspacePatientRecord.id);
    setRecoveryDraft(null);
    setAutosaveStatus("Saved");
  }

  function restoreDraft() {
    if (!recoveryDraft) return;
    setDraftPatient(recoveryDraft);
    setRecoveryDraft(null);
    setAutosaveStatus("Unsaved changes");
  }

  function discardDraft() {
    clearClinicalDraft(workspacePatientRecord.id);
    setRecoveryDraft(null);
  }

  function handleMoreAction(actionId) {
    setIsMoreOpen(false);
    if (actionId === "reports") onNavigate?.("reports");
    if (actionId === "monitoring") handleSetActiveTab("monitoring");
    if (actionId === "nutrimap") onNavigate?.("nutrimap");
    if (actionId === "ai") handleSetActiveTab("ai");
  }

  return (
    <NutriPage>
      <ClinicalWorkspaceTopBar
        globalSearchProps={globalSearchProps}
      />

      <NutriPageMain>
        <NutriPageHeader
          kicker="Clinical Hub"
          title="Clinical Hub"
          subtitle="Review assessment data, document nutrition care decisions, and monitor clinical progress in one focused hub."
          actions={
            <>
              <NutriBadge tone="brand">NCP workflow</NutriBadge>
              <NutriBadge tone="secondary">Clinical record</NutriBadge>
              <NutriBadge tone="accent">Active hub</NutriBadge>
            </>
          }
        />

        <ActivePatientBanner
          patient={clinicalDraftPatient}
          quickActions={[
            ["Open NutriMap", () => onNavigate?.("nutrimap")],
            ["AI Review", () => handleSetActiveTab("ai")],
            ["Generate Report", () => onNavigate?.("reports")],
            ["Open Diet Plan", () => onNavigate?.("diet-plans")],
            ["Schedule Follow-up", () => handleSetActiveTab("monitoring")],
          ]}
        />

        <ClinicalStatusHeader
          onOpenCompletion={() => setIsCompletionOpen(true)}
          patient={clinicalDraftPatient}
          setActiveTab={handleSetActiveTab}
        />

        <ClinicalCommandCenter
          activeTab={activeTab}
          intelligence={intelligence}
          onNavigate={onNavigate}
          onOpenCompletion={() => setIsCompletionOpen(true)}
          patient={clinicalDraftPatient}
          setActiveTab={handleSetActiveTab}
        />

        {recoveryDraft ? (
          <NutriPanel className="mb-4 border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">
                Unsaved Clinical Hub draft found for this patient.
              </p>
              <div className="flex flex-wrap gap-2">
                <NutriButton className="min-h-10 px-3 text-xs" onClick={restoreDraft} variant="secondary">Restore Draft</NutriButton>
                <NutriButton className="min-h-10 px-3 text-xs" onClick={discardDraft} variant="secondary">Discard Draft</NutriButton>
              </div>
            </div>
          </NutriPanel>
        ) : null}

        <section ref={moduleSectionRef} className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <ClinicalWorkspaceTabs
            activeTab={activeTab}
            hasUnsavedChanges={hasChanges}
            setActiveTab={handleSetActiveTab}
          />

          <div className="space-y-4">
            <NutriPanel className={`transition-shadow duration-500 lg:p-5 ${highlightedTab === activeTab ? "ring-4 ring-[rgb(122_31_43_/_0.10)]" : ""}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--np-color-border-soft)] pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-[18px] bg-[var(--np-color-brand-soft)] p-3 text-[var(--np-color-brand)]">
                    <ActiveIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--np-color-text-muted)]">
                      Clinical Module
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-[var(--np-color-text)]">
                      {activeTabConfig?.label}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="np-badge np-badge-brand">
                    {tabStatuses[activeTab] || "Missing"}
                  </span>
                  <span className={`np-badge ${autosaveStatus === "Save failed" ? "np-badge-danger" : autosaveStatus === "Saving..." ? "np-badge-warning" : autosaveStatus === "Unsaved changes" ? "np-badge-accent" : "np-badge-success"}`}>
                    {formatClinicalSaveStatus(autosaveStatus, savedAt)}
                  </span>
                  <NutriButton
                    className="min-h-9 px-3 text-xs"
                    disabled={!hasChanges}
                    onClick={saveChanges}
                    type="button"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </NutriButton>
                  <NutriButton
                    className="min-h-9 px-3 text-xs"
                    disabled={!hasChanges}
                    onClick={cancelChanges}
                    type="button"
                    variant="secondary"
                  >
                    Cancel
                  </NutriButton>
                  <div className="relative">
                    <NutriButton
                      aria-expanded={isMoreOpen}
                      className="min-h-9 px-3 text-xs"
                      onClick={() => setIsMoreOpen((current) => !current)}
                      type="button"
                      variant="secondary"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      More
                    </NutriButton>
                    {isMoreOpen ? (
                      <div className="absolute right-0 z-40 mt-2 w-56 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-2 shadow-[var(--np-shadow-elevated)]">
                        {[
                          ["reports", "Generate Report", FileText],
                          ["monitoring", "Schedule Follow-up", CalendarDays],
                          ["nutrimap", "Open NutriMap", Activity],
                          ["ai", "AI Review", Brain],
                        ].map(([actionId, label, Icon]) => (
                          <button
                            className="flex min-h-10 w-full items-center gap-2 rounded-[12px] px-3 text-left text-xs font-extrabold text-[var(--np-color-text)] transition hover:bg-[var(--np-color-surface-muted)]"
                            key={label}
                            onClick={() => handleMoreAction(actionId)}
                            type="button"
                          >
                            <Icon className="h-4 w-4 text-[var(--np-color-brand)]" />
                            {label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {activeWorkflowStepId ? (
                    <NutriButton
                      className="min-h-9 px-3 text-xs"
                      onClick={() => onCompleteWorkflowStep?.(activeWorkflowStepId, clinicalDraftPatient)}
                      type="button"
                      variant="secondary"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Mark complete
                    </NutriButton>
                  ) : null}
                </div>
              </div>

              <TabContent
                activeTab={activeTab}
                addRow={addDraftRow}
                deleteRow={deleteDraftRow}
                draft={draftPatient}
                onNavigate={onNavigate}
                patient={clinicalDraftPatient}
                setActiveTab={handleSetActiveTab}
                statuses={tabStatuses}
                updateField={updateDraftField}
                updateRow={updateDraftRow}
              />
            </NutriPanel>
          </div>
        </section>
        <div className="h-24" aria-hidden="true" />
      </NutriPageMain>
      <StickyClinicalActions
        activeWorkflowStepId={activeWorkflowStepId}
        hasChanges={hasChanges}
        onComplete={() => activeWorkflowStepId && onCompleteWorkflowStep?.(activeWorkflowStepId, clinicalDraftPatient)}
        onLab={() => handleSetActiveTab("laboratory")}
        onReport={() => onNavigate?.("reports")}
        onReview={() => handleSetActiveTab("ai")}
        onSave={saveChanges}
      />
      {isCompletionOpen ? (
        <CompletionDetailsModal
          onClose={() => setIsCompletionOpen(false)}
          patient={clinicalDraftPatient}
        />
      ) : null}
    </NutriPage>
  );
}

function clinicalTabToWorkflowStep(tabId) {
  const stepByTab = {
    ai: "ai",
    anthropometric: "assessment",
    dietary: "dietary",
    dietPlan: "dietPlan",
    laboratory: "labs",
    medical: "medical",
    monitoring: "monitoring",
    pes: "pes",
    intervention: "intervention",
    summary: "summary",
  };

  return stepByTab[tabId];
}

function ClinicalCommandCenter({ activeTab, intelligence, onNavigate, onOpenCompletion, patient, setActiveTab }) {
  const [expandedSections, setExpandedSections] = useState(loadClinicalHubSections);
  const workflow = getWorkflowStatus(patient);

  function toggleSection(sectionId) {
    setExpandedSections((current) => {
      const nextSections = { ...current, [sectionId]: !current[sectionId] };
      saveClinicalHubSections(nextSections);
      return nextSections;
    });
  }

  return (
    <section className="mb-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <CollapsibleClinicalSection
          expanded={expandedSections.workflow}
          onToggle={() => toggleSection("workflow")}
          title="Guided Clinical Workflow"
        >
          <ClinicalWorkflowEngine
            activeTab={activeTab}
            compact
            onNavigate={onNavigate}
            onOpenCompletion={onOpenCompletion}
            patient={patient}
            setActiveTab={setActiveTab}
          />
          <WorkflowIntelligence workflow={workflow} />
        </CollapsibleClinicalSection>
        <CollapsibleClinicalSection
          expanded={expandedSections.quickActions}
          onToggle={() => toggleSection("quickActions")}
          title="Quick Actions"
        >
          <ClinicalQuickActions onNavigate={onNavigate} setActiveTab={setActiveTab} />
        </CollapsibleClinicalSection>
        <CollapsibleClinicalSection
          expanded={expandedSections.timeline}
          onToggle={() => toggleSection("timeline")}
          title="Patient Timeline"
        >
          <PatientTimeline patient={patient} />
        </CollapsibleClinicalSection>
        <CollapsibleClinicalSection
          expanded={expandedSections.summary}
          onToggle={() => toggleSection("summary")}
          title="Summary"
        >
          <CommandCenterSummary patient={patient} workflow={workflow} />
        </CollapsibleClinicalSection>
      </div>
      <CollapsibleClinicalSection
        expanded={expandedSections.recommendations}
        onToggle={() => toggleSection("recommendations")}
        title="Recommendation Review"
      >
        <ClinicalIntelligencePanel intelligence={intelligence} onNavigate={onNavigate} patient={patient} setActiveTab={setActiveTab} />
      </CollapsibleClinicalSection>
    </section>
  );
}

function ClinicalStatusHeader({ onOpenCompletion, patient, setActiveTab }) {
  const workflow = getWorkflowStatus(patient);
  const statusItems = [
    ["Nutrition Assessment", "assessment", "anthropometric"],
    ["Laboratory Review", "labs", "laboratory"],
    ["Medical History", "medical", "medical"],
    ["PES Diagnosis", "pes", "pes"],
    ["Nutrition Intervention", "intervention", "intervention"],
    ["Monitoring & Evaluation", "monitoring", "monitoring"],
    ["AI Review", "ai", "ai"],
  ].map(([label, stepId, tabId]) => ({
    label,
    status: normalizeWorkflowDisplayStatus(workflow.steps.find((step) => step.id === stepId)?.status),
    tabId,
  }));

  return (
    <NutriPanel className="mb-4 p-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          className="min-w-[150px] shrink-0 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3 text-left transition hover:border-[var(--np-color-brand)]"
          onClick={onOpenCompletion}
          type="button"
        >
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
            Workflow
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[var(--np-color-brand)]">{workflow.percent}%</p>
        </button>
        {statusItems.map((item) => (
          <button
            className="min-w-[178px] shrink-0 rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3 text-left transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]"
            key={item.label}
            onClick={() => setActiveTab(item.tabId)}
            type="button"
          >
            <p className="truncate text-xs font-extrabold text-[var(--np-color-text)]">{item.label}</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${clinicalStatusClass(item.status)}`}>
              {item.status}
            </span>
          </button>
        ))}
      </div>
    </NutriPanel>
  );
}

function CollapsibleClinicalSection({ children, expanded, onToggle, title }) {
  return (
    <section className="rounded-[24px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-card)]">
      <button
        aria-expanded={expanded}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</span>
        <span className="rounded-full bg-[var(--np-color-surface-muted)] px-3 py-1 text-xs font-extrabold text-[var(--np-color-text-muted)]">
          {expanded ? "Collapse" : "Expand"}
        </span>
      </button>
      {expanded ? <div className="border-t border-[var(--np-color-border-soft)] p-3">{children}</div> : null}
    </section>
  );
}

function WorkflowIntelligence({ workflow }) {
  const remainingSteps = workflow.steps.filter((step) => step.status !== "Completed");
  const nextAction = remainingSteps[0] || workflow.steps[0];
  const readiness = workflow.percent >= 85 ? "Ready for report review" : workflow.percent >= 55 ? "Needs focused completion" : "Core documentation missing";
  const estimatedMinutes = Math.max(5, remainingSteps.length * 6);

  return (
    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
      <WorkflowIntelCard label="Remaining steps" value={remainingSteps.length} />
      <WorkflowIntelCard label="Estimated completion time" value={`${estimatedMinutes} min`} />
      <WorkflowIntelCard label="Workflow readiness" value={readiness} />
      <WorkflowIntelCard label="Next required action" value={nextAction?.label || "Continue review"} />
    </div>
  );
}

function WorkflowIntelCard({ label, value }) {
  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function CommandCenterSummary({ patient, workflow }) {
  return (
    <NutriPanel className="p-4 shadow-none">
      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        <ClinicalSignal label="Active Patient" value={patient.fullName || "No active patient"} />
        <ClinicalSignal label="Risk" value={patient.riskLevel || "Not classified"} />
        <ClinicalSignal label="Completion" value={`${workflow.percent}%`} />
      </div>
    </NutriPanel>
  );
}

function ClinicalQuickActions({ onNavigate, setActiveTab }) {
  const actions = [
    { icon: FlaskConical, label: "Laboratory Results", onClick: () => setActiveTab("laboratory") },
    { icon: FileText, label: "PES Diagnosis", onClick: () => setActiveTab("pes") },
    { icon: Target, label: "Intervention", onClick: () => setActiveTab("intervention") },
    { icon: Utensils, label: "Open Diet Plan", onClick: () => onNavigate?.("diet-plans") },
    { icon: CalendarDays, label: "Monitoring", onClick: () => setActiveTab("monitoring") },
    { icon: FileText, label: "Reports", onClick: () => onNavigate?.("reports") },
    { icon: Activity, label: "NutriMap", onClick: () => onNavigate?.("nutrimap") },
    { icon: Brain, label: "AI Center", onClick: () => onNavigate?.("ai") },
  ];

  return (
    <NutriPanel className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
            Quick Actions
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--np-color-text)]">
            One-click clinical navigation
          </h3>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:w-auto xl:grid-cols-7">
          {actions.map((action) => (
            <NutriButton
              className="min-h-10 justify-center px-3 text-xs"
              key={action.label}
              onClick={action.onClick}
              variant="secondary"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </NutriButton>
          ))}
        </div>
      </div>
    </NutriPanel>
  );
}

function PatientTimeline({ patient }) {
  const workflow = getWorkflowStatus(patient);
  const statusById = Object.fromEntries(workflow.steps.map((step) => [step.id, step.status]));
  const timeline = [
    { label: "Report generated", status: statusById.reports, time: "Latest" },
    { label: "Follow-up scheduled", status: statusById.monitoring, time: "After intervention" },
    { label: "Intervention added", status: statusById.intervention, time: "Care planning" },
    { label: "PES created", status: statusById.pes, time: "Diagnosis phase" },
    { label: "Laboratory review", status: statusById.labs, time: "Assessment phase" },
    { label: "Assessment completed", status: statusById.assessment, time: "Initial step" },
  ];

  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader
        icon={Clock3}
        kicker="Patient Timeline"
        title="Chronological activity log"
      />
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {timeline.map((item) => (
          <div
            className="flex items-center gap-3 rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3"
            key={item.label}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${timelineIconClass(item.status)}`}>
              {item.status === "Completed" ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[var(--np-color-text)]">{item.label}</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{item.time} - {item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function ClinicalIntelligencePanel({ intelligence, onNavigate, patient, setActiveTab }) {
  const workflow = getWorkflowStatus(patient);
  const support = intelligence || buildClinicalDecisionSupport(patient);
  const nextAction = getWorkflowNextAction(patient);
  const aiStep = workflow.steps.find((step) => step.id === "ai");
  const reportStep = workflow.steps.find((step) => step.id === "reports");
  const missingData = workflow.missing;
  const alerts = workflow.alerts;
  const highPriorityAlerts = alerts.filter((alert) => alert.priority === "High");

  function openStep(step) {
    if (!step?.tabId) {
      return;
    }

    if (step.tabId === "reports") {
      onNavigate?.("reports");
      return;
    }

    setActiveTab(step.tabId);
  }

  function openFirstMissing() {
    openStep(missingData[0] || workflow.needsReview[0] || nextAction);
  }

  const recommendations = [
    {
      actionLabel: missingData[0] ? `Open ${missingData[0].label}` : "Continue clinical review",
      evidence: ["Workflow rules only", "Clinician review required"],
      icon: ClipboardList,
      label: "Missing Data",
      onClick: openFirstMissing,
      priority: missingData.length ? "Clinical priority: Needs Review" : "Clinical priority: Ready",
      reason: missingData.length ? missingData.map((step) => `${step.label} missing`) : ["No missing core workflow step detected"],
      status: missingData.length ? "Missing" : "Ready",
    },
    {
      actionLabel: alerts[0]?.title || "Review risk context",
      evidence: ["Risk flags from available workflow data", "No diagnosis generated"],
      icon: Bell,
      label: "Risk Alerts",
      onClick: openFirstMissing,
      priority: patient.riskLevel === "High Risk" || highPriorityAlerts.length ? "Clinical priority: High Risk" : "Clinical priority: Needs Review",
      reason: alerts.length ? alerts.slice(0, 3).map((alert) => alert.title) : ["No active placeholder workflow alerts are present"],
      status: patient.riskLevel === "High Risk" || highPriorityAlerts.length ? "High Risk" : alerts.length ? "Needs Review" : "Ready",
    },
    {
      actionLabel: "Open AI Insights",
      evidence: ["Rule-based placeholder", "External AI not connected"],
      icon: Brain,
      label: "AI Review",
      onClick: () => setActiveTab("ai"),
      priority: aiStep?.status === "Needs Review" ? "Clinical priority: Needs Review" : "Clinical priority: Routine",
      reason: [`AI workflow status: ${aiStep?.status || "Missing"}`, "Clinician approval required"],
      status: normalizeStatus(aiStep?.status),
    },
    {
      actionLabel: "Open Reports",
      evidence: ["Report readiness follows workflow completion", "Template export remains placeholder"],
      icon: FileText,
      label: "Report Readiness",
      onClick: () => onNavigate?.("reports"),
      priority: reportStep?.status === "Missing" ? "Clinical priority: Missing" : "Clinical priority: Needs Review",
      reason: [`Report workflow status: ${reportStep?.status || "Missing"}`, "Core sections should be reviewed before export"],
      status: normalizeStatus(reportStep?.status),
    },
    {
      actionLabel: nextAction.actionLabel,
      evidence: ["Workflow rule placeholder", "Citations postponed"],
      icon: Target,
      label: "Next Step",
      onClick: () => openStep(nextAction),
      priority: nextAction.status === "Missing" ? "Clinical priority: Missing" : "Clinical priority: Needs Review",
      reason: [`${nextAction.label}: ${nextAction.status}`, nextAction.reason],
      status: normalizeStatus(nextAction.status),
    },
  ];

  return (
    <NutriPanel className="p-4 2xl:sticky 2xl:top-24 2xl:self-start">
      <NutriSectionHeader
        icon={Brain}
        kicker="Clinical Intelligence"
        title="Recommendation review"
        action={<NutriBadge tone={support.riskEngine.level === "High" ? "danger" : support.riskEngine.level === "Moderate" ? "warning" : "secondary"}>{support.riskEngine.level} risk</NutriBadge>}
      />

      <div className="mb-3 grid grid-cols-2 gap-2">
        <ClinicalSignal label="Nutrition Score" value={`${support.nutritionStatusScore.score}%`} />
        <ClinicalSignal label="Abnormal Labs" value={support.dashboard.abnormalLabCount} />
        <ClinicalSignal label="Weight Trend" value={support.weightTrend.direction} />
        <ClinicalSignal label="BMI Trend" value={support.bmiTrend.direction} />
      </div>

      <div className="space-y-3">
        {recommendations.map((recommendation) => (
          <RecommendationCard key={recommendation.label} recommendation={recommendation} />
        ))}
      </div>
    </NutriPanel>
  );
}
function RecommendationCard({ recommendation }) {
  const Icon = recommendation.icon;

  return (
    <article className="w-full rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3 text-left transition hover:border-[var(--np-color-brand)] hover:shadow-[var(--np-shadow-sm)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="np-icon-tile h-9 w-9 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <NutriBadge tone={statusTone(recommendation.status)}>{recommendation.status}</NutriBadge>
      </div>
      <p className="text-sm font-extrabold text-[var(--np-color-text)]">{recommendation.label}</p>
      <p className="mt-2 text-xs font-extrabold text-[var(--np-color-brand)]">{recommendation.priority}</p>
      <RecommendationBulletList label="Reason" items={recommendation.reason} />
      <RecommendationBulletList label="Evidence" items={recommendation.evidence} />
      <div className="mt-3 rounded-[14px] bg-[var(--np-color-surface-muted)] p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">Suggested Action</p>
        <NutriButton className="mt-2 min-h-10 px-3 text-xs" onClick={recommendation.onClick} type="button">
          {recommendation.actionLabel}
        </NutriButton>
      </div>
    </article>
  );
}

function RecommendationBulletList({ items, label }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">{label}</p>
      <ul className="mt-1 space-y-1">
        {(Array.isArray(items) ? items : [items]).slice(0, 3).map((item) => (
          <li className="text-xs font-bold leading-5 text-[var(--np-color-text-muted)]" key={item}>
            • <BoldClinicalTerms text={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BoldClinicalTerms({ text }) {
  const terms = ["Ferritin", "Vitamin D", "Hemoglobin", "Albumin", "HbA1c", "CRP"];
  const pattern = new RegExp(`(${terms.join("|")})`, "gi");
  return String(text).split(pattern).map((part, index) =>
    terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
      <strong className="text-[var(--np-color-text)]" key={`${part}-${index}`}>{part}</strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

function ClinicalSignal({ label, value }) {
  return (
    <div className="rounded-[14px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
      <p className="mt-1 truncate text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function StickyClinicalActions({ activeWorkflowStepId, hasChanges, onComplete, onLab, onReport, onReview, onSave }) {
  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)] rounded-[24px] border border-[var(--np-color-border-soft)] bg-white/95 p-2 shadow-[var(--np-shadow-elevated)] backdrop-blur-xl md:left-1/2 md:right-auto md:-translate-x-1/2 xl:left-auto xl:right-6 xl:translate-x-0">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <NutriButton className="min-h-10 px-3 text-xs" disabled={!hasChanges} onClick={onSave} type="button">
          <Save className="h-4 w-4" />
          Save
        </NutriButton>
        <NutriButton className="min-h-10 px-3 text-xs" onClick={onReport} type="button" variant="secondary">
          <FileText className="h-4 w-4" />
          Generate Report
        </NutriButton>
        <NutriButton className="min-h-10 px-3 text-xs" onClick={onLab} type="button" variant="secondary">
          <FlaskConical className="h-4 w-4" />
          Open Laboratory
        </NutriButton>
        <NutriButton className="min-h-10 px-3 text-xs" onClick={onReview} type="button" variant="secondary">
          <Brain className="h-4 w-4" />
          AI Review
        </NutriButton>
        {activeWorkflowStepId ? (
          <NutriButton className="min-h-10 px-3 text-xs" onClick={onComplete} type="button" variant="secondary">
            <CheckCircle2 className="h-4 w-4" />
            Complete Step
          </NutriButton>
        ) : null}
      </div>
    </div>
  );
}

function CompletionDetailsModal({ onClose, patient }) {
  const workflow = getWorkflowStatus(patient);
  const completedModules = workflow.steps.filter((step) => step.status === "Completed");
  const remainingModules = workflow.steps.filter((step) => step.status !== "Completed");
  const estimatedMinutes = Math.max(remainingModules.length * 6, remainingModules.length ? 6 : 0);
  const readiness = workflow.percent >= 85 ? "Ready for report review" : workflow.percent >= 55 ? "Needs focused completion" : "Core documentation missing";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgb(31_41_55_/_0.36)] p-4 backdrop-blur-sm">
      <section className="w-full max-w-2xl rounded-[28px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-elevated)]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">Completion Details</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[var(--np-color-text)]">{workflow.percent}% workflow completion</h2>
          </div>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={onClose} type="button" variant="secondary">
            Close
          </NutriButton>
        </div>

        <div className="mb-4 h-2 overflow-hidden rounded-full bg-[var(--np-color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--np-color-brand)] transition-[width] duration-500 ease-out" style={{ width: `${workflow.percent}%` }} />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CompletionDetailList title="Completed modules" items={completedModules.map((step) => step.label)} emptyText="No completed module yet" />
          <CompletionDetailList title="Remaining modules" items={remainingModules.map((step) => `${step.label}: ${step.status}`)} emptyText="No remaining modules" />
          <CompletionDetailList title="Missing documentation" items={workflow.missing.map((step) => step.label)} emptyText="No missing documentation flagged" />
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">Estimated completion time</p>
            <p className="mt-2 text-lg font-extrabold text-[var(--np-color-text)]">{estimatedMinutes ? `${estimatedMinutes} min` : "Ready"}</p>
            <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">Overall readiness</p>
            <p className="mt-2 text-lg font-extrabold text-[var(--np-color-text)]">{readiness}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function CompletionDetailList({ emptyText, items, title }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">{title}</p>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : [emptyText]).map((item) => (
          <li className="text-sm font-bold text-[var(--np-color-text-muted)]" key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function normalizeStatus(status) {
  if (status === "Completed") return "Ready";
  if (status === "Needs Review") return "Needs Review";
  if (status === "In Progress") return "Needs Review";
  return "Missing";
}

function normalizeWorkflowDisplayStatus(status) {
  if (status === "Completed") return "Completed";
  if (status === "In Progress") return "In Progress";
  if (status === "Needs Review") return "Needs Review";
  return "Missing";
}

function clinicalStatusClass(status) {
  if (status === "Completed") return "bg-[var(--np-color-success-bg)] text-[var(--np-color-success)]";
  if (status === "In Progress") return "bg-[var(--np-color-warning-bg)] text-[var(--np-color-warning)]";
  if (status === "Needs Review") return "bg-[var(--np-color-accent-soft)] text-[var(--np-color-accent)]";
  return "bg-[var(--np-color-danger-bg)] text-[var(--np-color-danger)]";
}

function loadClinicalHubSections() {
  const defaults = {
    quickActions: false,
    recommendations: true,
    summary: false,
    timeline: false,
    workflow: true,
  };

  try {
    const storedSections = JSON.parse(localStorage.getItem("nutripilot.clinicalHub.sections"));
    return { ...defaults, ...(storedSections || {}) };
  } catch {
    return defaults;
  }
}

function saveClinicalHubSections(sections) {
  localStorage.setItem("nutripilot.clinicalHub.sections", JSON.stringify(sections));
}

function statusTone(status) {
  if (status === "Ready") return "success";
  if (status === "Needs Review") return "warning";
  if (status === "High Risk") return "danger";
  return "danger";
}

function timelineIconClass(status) {
  if (status === "Completed") {
    return "bg-[var(--np-color-success-soft)] text-[var(--np-color-success)]";
  }

  if (status === "Needs Review") {
    return "bg-[var(--np-color-warning-soft)] text-[var(--np-color-warning)]";
  }

  if (status === "In Progress") {
    return "bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]";
  }

  return "bg-[var(--np-color-danger-soft)] text-[var(--np-color-danger)]";
}

function ClinicalWorkspaceTopBar({ globalSearchProps }) {
  const { t } = useTranslation();

  return (
    <header className="np-topbar">
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-[var(--np-radius-lg)] text-[var(--np-color-brand)] transition hover:bg-[var(--np-color-brand-soft)]"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>

        <GlobalSearch
          {...globalSearchProps}
          placeholder={t("search.placeholder.clinical")}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          className="hidden h-12 items-center gap-2 rounded-[var(--np-radius-lg)] border border-[var(--np-color-border)] bg-white px-4 text-sm font-extrabold text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)] transition hover:border-[var(--np-color-brand)] lg:flex"
          type="button"
        >
          <CalendarDays className="h-4 w-4" />
          Next Follow-up
          <span className="np-badge np-badge-brand">Today</span>
        </button>
        <IconButton badge="7" icon={Bell} />
        <IconButton icon={HelpCircle} />
        <div className="h-9 w-px bg-[var(--np-color-border-soft)]" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--np-color-brand-soft)] text-sm font-extrabold text-[var(--np-color-brand)]">
            S
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">
              Dr. Shahad
            </p>
            <p className="text-xs font-bold text-[var(--np-color-text-muted)]">
              Clinical Nutritionist
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

function IconButton({ badge, icon: Icon }) {
  return (
    <button
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--np-color-brand)] transition hover:bg-[var(--np-color-brand-soft)]"
      type="button"
    >
      <Icon className="h-5 w-5" />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--np-color-brand)] px-1 text-[10px] font-extrabold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function TabContent({ activeTab, addRow, deleteRow, draft, onNavigate, patient, setActiveTab, statuses, updateField, updateRow }) {
  if (activeTab === "summary") {
    return <InteractiveSummaryTab draft={draft} patient={patient} setActiveTab={setActiveTab} statuses={statuses} />;
  }

  if (activeTab === "anthropometric") {
    return <AnthropometricEditor draft={draft} updateField={updateField} />;
  }

  if (activeTab === "laboratory") {
    return (
      <EditableRows
        addLabel="Add laboratory result"
        collectionName="labValues"
        columns={[
          ["label", "Test", "text"],
          ["value", "Value", "number"],
          ["unit", "Unit", "text"],
          ["range", "Reference range", "text"],
          ["date", "Date", "date"],
          ["status", "Status", "select", ["Low", "Normal", "High", "Needs Review", "Not Recorded"]],
          ["notes", "Notes", "textarea"],
        ]}
        items={draft.labValues}
        onAdd={() => addRow("labValues", { label: "Hemoglobin", value: "", unit: "", range: "", date: "", status: "Not Recorded", notes: "" })}
        onDelete={(itemId) => deleteRow("labValues", itemId)}
        onUpdate={(itemId, field, value) => updateRow("labValues", itemId, field, value)}
        title="Editable Laboratory Results"
      />
    );
  }

  if (activeTab === "dietary") {
    return <DietaryEditor draft={draft} updateField={updateField} />;
  }

  if (activeTab === "medical") {
    return <MedicalEditor addRow={addRow} deleteRow={deleteRow} draft={draft} updateField={updateField} updateRow={updateRow} />;
  }

  if (activeTab === "pes") {
    return (
      <EditableRows
        addLabel="Add PES diagnosis"
        collectionName="diagnoses"
        columns={[
          ["problem", "Problem", "text"],
          ["etiology", "Etiology", "text"],
          ["signs", "Signs and Symptoms", "textarea"],
          ["priority", "Priority", "select", ["High", "Moderate", "Low"]],
          ["status", "Status", "select", ["Active", "Monitoring", "Resolved", "Draft"]],
          ["reviewDate", "Review date", "date"],
        ]}
        items={draft.diagnoses}
        onAdd={() => addRow("diagnoses", { problem: "", etiology: "", signs: "", priority: "Moderate", status: "Draft", reviewDate: "" })}
        onDelete={(itemId) => deleteRow("diagnoses", itemId)}
        onUpdate={(itemId, field, value) => updateRow("diagnoses", itemId, field, value)}
        title="Nutrition Diagnosis (PES)"
      />
    );
  }

  if (activeTab === "intervention") {
    return (
      <EditableRows
        addLabel="Add intervention"
        collectionName="interventions"
        columns={[
          ["goal", "Goals", "text"],
          ["dietPrescription", "Diet prescription", "text"],
          ["education", "Education", "textarea"],
          ["counseling", "Counseling", "textarea"],
          ["supplements", "Supplements", "text"],
          ["referrals", "Referrals", "text"],
          ["followUpPlan", "Follow-up plan", "textarea"],
          ["monitoringIndicators", "Monitoring indicators", "textarea"],
          ["status", "Status", "select", ["Draft", "Active", "Completed", "Needs Review"]],
        ]}
        items={draft.interventions}
        onAdd={() => addRow("interventions", { goal: "", dietPrescription: "", education: "", counseling: "", supplements: "", referrals: "", followUpPlan: "", monitoringIndicators: "", status: "Draft" })}
        onDelete={(itemId) => deleteRow("interventions", itemId)}
        onUpdate={(itemId, field, value) => updateRow("interventions", itemId, field, value)}
        title="Nutrition Interventions"
      />
    );
  }

  if (activeTab === "dietPlan") {
    return (
      <DietPlanBuilder
        addRow={addRow}
        deleteRow={deleteRow}
        draft={draft}
        updateField={updateField}
        updateRow={updateRow}
      />
    );
  }

  if (activeTab === "monitoring") {
    return (
      <EditableRows
        addLabel="Add follow-up"
        collectionName="followUps"
        columns={[
          ["date", "Follow-up date", "date"],
          ["weightTrend", "Weight trend", "text"],
          ["labTrend", "Lab trend", "text"],
          ["symptomTrend", "Symptom trend", "text"],
          ["dietaryAdherence", "Dietary adherence", "select", ["High", "Moderate", "Low", "Not Recorded"]],
          ["goalProgress", "Goal progress", "text"],
          ["outcome", "Outcome", "textarea"],
          ["nextAction", "Next action", "textarea"],
          ["status", "Status", "select", ["Scheduled", "Completed", "Needs Review", "Missed"]],
        ]}
        items={draft.followUps}
        onAdd={() => addRow("followUps", { date: "", weightTrend: "", labTrend: "", symptomTrend: "", dietaryAdherence: "Not Recorded", goalProgress: "", outcome: "", nextAction: "", status: "Scheduled" })}
        onDelete={(itemId) => deleteRow("followUps", itemId)}
        onUpdate={(itemId, field, value) => updateRow("followUps", itemId, field, value)}
        title="Monitoring & Evaluation"
      />
    );
  }

  return <AiInsightsEditor draft={draft} onNavigate={onNavigate} setActiveTab={setActiveTab} statuses={statuses} />;
}

function InteractiveSummaryTab({ draft, patient, setActiveTab, statuses }) {
  const labs = labMap(draft.labValues);
  const completion = completionPercent(statuses);
  const missing = Object.entries(statuses)
    .filter(([, status]) => status === "Missing")
    .map(([tabId]) => workspaceTabs.find((tab) => tab.id === tabId)?.label)
    .filter(Boolean);
  const latestDiagnosis = draft.diagnoses.find((diagnosis) => diagnosis.problem)?.problem || "No PES diagnosis recorded";
  const latestIntervention = draft.interventions.find((intervention) => intervention.goal || intervention.dietPrescription);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Name", patient.fullName],
          ["MRN", patient.mrn],
          ["Age / Gender", `${patient.age || "Age pending"} / ${patient.gender || "Not specified"}`],
          ["Diagnosis", patient.diagnosis || "No diagnosis recorded"],
          ["Risk", patient.riskLevel || "Not classified"],
          ["Current status", patient.status || "Not recorded"],
          ["BMI", draft.bmi || "Not recorded"],
          ["Weight", draft.weight ? `${draft.weight} kg` : "Not recorded"],
          ["Height", draft.height ? `${draft.height} cm` : "Not recorded"],
          ["Ferritin", labValue(labs, "Ferritin")],
          ["Hemoglobin", labValue(labs, "Hemoglobin")],
          ["Vitamin D", labValue(labs, "Vitamin D")],
          ["Albumin", labValue(labs, "Albumin")],
          ["Latest nutrition diagnosis", latestDiagnosis],
          ["Latest intervention", latestIntervention?.goal || latestIntervention?.dietPrescription || "No intervention recorded"],
          ["Last visit", patient.lastVisit || patient.lastVisitDate || "Not recorded"],
          ["Next follow-up", draft.nextFollowUpDate || "Not scheduled"],
          ["Record completion", `${completion}%`],
          ["Missing documentation", missing.length ? missing.join(", ") : "No missing core tabs"],
          ["Clinician review status", draft.reviewStatus || "Needs Review"],
        ].map(([label, value]) => (
          <SummaryMetric key={label} label={label} value={value} />
        ))}
      </div>

      <NutriPanel className="p-4">
        <NutriSectionHeader icon={Clock3} kicker="Clinical Timeline" title="Newest patient activity first" />
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {buildClinicalActivityLog(draft, statuses).map((event) => (
            <button
              className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3 text-left transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]"
              key={event.title}
              onClick={() => setActiveTab(event.tabId)}
              type="button"
            >
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">{event.title}</p>
              <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{event.status}</p>
            </button>
          ))}
        </div>
      </NutriPanel>
    </div>
  );
}

function AnthropometricEditor({ draft, updateField }) {
  return (
    <EditablePanel title="Anthropometric Assessment" icon={Activity}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <ClinicalInput label="Height (cm)" type="number" value={draft.height} onChange={(value) => updateField("height", value)} />
        <ClinicalInput label="Weight (kg)" type="number" value={draft.weight} onChange={(value) => updateField("weight", value)} />
        <ReadOnlyField label="BMI auto-calculation" value={calculateDraftBmi(draft.height, draft.weight) || "Enter height and weight"} />
        <ClinicalInput label="Recent weight change" value={draft.weightChange} onChange={(value) => updateField("weightChange", value)} />
        <ClinicalTextarea label="Weight history" value={draft.weightHistory} onChange={(value) => updateField("weightHistory", value)} />
        <ClinicalInput label="Ideal body weight placeholder" value={draft.idealBodyWeight} onChange={(value) => updateField("idealBodyWeight", value)} />
        <ClinicalInput label="MUAC" value={draft.muac} onChange={(value) => updateField("muac", value)} />
        <ClinicalInput label="Waist circumference" value={draft.waistCircumference} onChange={(value) => updateField("waistCircumference", value)} />
        <ClinicalTextarea label="Body composition" value={draft.bodyComposition} onChange={(value) => updateField("bodyComposition", value)} />
        <ClinicalSelect label="Physical activity" options={["Sedentary", "Light", "Moderate", "Active", "Not Recorded"]} value={draft.physicalActivity} onChange={(value) => updateField("physicalActivity", value)} />
      </div>
    </EditablePanel>
  );
}

function DietaryEditor({ draft, updateField }) {
  return (
    <EditablePanel title="Dietary Assessment" icon={ClipboardList}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ClinicalTextarea label="24-hour recall" value={draft.dietaryRecall} onChange={(value) => updateField("dietaryRecall", value)} />
        <ClinicalTextarea label="Food frequency" value={draft.foodFrequency} onChange={(value) => updateField("foodFrequency", value)} />
        <ClinicalSelect label="Appetite" options={["Good", "Fair", "Poor", "Reduced", "Not Recorded"]} value={draft.appetite} onChange={(value) => updateField("appetite", value)} />
        <ClinicalInput label="Meal pattern" value={draft.mealPattern} onChange={(value) => updateField("mealPattern", value)} />
        <ClinicalInput label="Fluid intake" value={draft.fluidIntake} onChange={(value) => updateField("fluidIntake", value)} />
        <ClinicalInput label="Supplements" value={draft.supplements} onChange={(value) => updateField("supplements", value)} />
        <ClinicalTextarea label="GI symptoms" value={draft.giSymptoms} onChange={(value) => updateField("giSymptoms", value)} />
        <ClinicalInput label="Food intolerance" value={draft.foodIntolerance} onChange={(value) => updateField("foodIntolerance", value)} />
        <ClinicalInput label="Food allergy" value={draft.foodAllergy} onChange={(value) => updateField("foodAllergy", value)} />
        <ClinicalSelect label="Dietary adherence" options={["High", "Moderate", "Low", "Not Recorded"]} value={draft.dietaryAdherence} onChange={(value) => updateField("dietaryAdherence", value)} />
        <ClinicalTextarea label="Estimated requirements" value={draft.estimatedRequirements} onChange={(value) => updateField("estimatedRequirements", value)} />
        <ClinicalTextarea label="Clinical notes" value={draft.dietaryNotes} onChange={(value) => updateField("dietaryNotes", value)} />
      </div>
    </EditablePanel>
  );
}

function MedicalEditor({ addRow, deleteRow, draft, updateField, updateRow }) {
  return (
    <div className="space-y-4">
      <EditablePanel title="Medical History" icon={ClipboardList}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ClinicalTextarea label="Diagnoses" value={draft.medicalHistory} onChange={(value) => updateField("medicalHistory", value)} />
          <ClinicalInput label="Comorbidities" value={(draft.comorbidities || []).join(", ")} onChange={(value) => updateField("comorbidities", splitList(value))} />
          <ClinicalInput label="Intolerances" value={draft.intolerances} onChange={(value) => updateField("intolerances", value)} />
          <ClinicalSelect label="Smoking" options={["No", "Yes", "Not Recorded"]} value={draft.smoking ? "Yes" : "No"} onChange={(value) => updateField("smoking", value === "Yes")} />
          <ClinicalSelect label="Physical activity" options={["Sedentary", "Light", "Moderate", "Active", "Not Recorded"]} value={draft.physicalActivity} onChange={(value) => updateField("physicalActivity", value)} />
          <ClinicalTextarea label="Family history" value={draft.familyHistory} onChange={(value) => updateField("familyHistory", value)} />
          <ClinicalTextarea label="Surgery history" value={draft.surgeryHistory} onChange={(value) => updateField("surgeryHistory", value)} />
          <ClinicalInput label="Referring department" value={draft.referringDepartment} onChange={(value) => updateField("referringDepartment", value)} />
          <ClinicalInput label="Referring physician" value={draft.referringPhysician} onChange={(value) => updateField("referringPhysician", value)} />
        </div>
      </EditablePanel>
      <EditableRows
        addLabel="Add medication"
        collectionName="medications"
        columns={[["name", "Medication", "text"], ["dose", "Dose", "text"], ["notes", "Notes", "textarea"]]}
        items={draft.medications}
        onAdd={() => addRow("medications", { name: "", dose: "", notes: "" })}
        onDelete={(itemId) => deleteRow("medications", itemId)}
        onUpdate={(itemId, field, value) => updateRow("medications", itemId, field, value)}
        title="Medications"
      />
      <EditableRows
        addLabel="Add allergy"
        collectionName="allergies"
        columns={[["name", "Allergy", "text"], ["reaction", "Reaction", "text"], ["severity", "Severity", "select", ["Low", "Moderate", "High"]]]}
        items={draft.allergies}
        onAdd={() => addRow("allergies", { name: "", reaction: "", severity: "Low" })}
        onDelete={(itemId) => deleteRow("allergies", itemId)}
        onUpdate={(itemId, field, value) => updateRow("allergies", itemId, field, value)}
        title="Allergies"
      />
    </div>
  );
}

function DietPlanBuilder({ draft, updateField }) {
  const activePlan = getActiveDietPlan(draft);
  const activePlanId = activePlan.id;
  const totals = calculateDietPlanTotals(activePlan);
  const weeklySummary = calculateWeeklyDietPlanSummary(activePlan);
  const safetyAlerts = buildDietPlanSafetyAlerts(draft, activePlan);
  const context = buildDietPlanContext(draft);

  function updatePlanField(field, value) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId ? { ...plan, [field]: value } : plan,
    ));
  }

  function addMealItem(dayId, mealId) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    meals: day.meals.map((meal) =>
                      meal.id === mealId
                        ? { ...meal, items: [...meal.items, createMealItem(meal.items.length)] }
                        : meal,
                    ),
                  }
                : day,
            ),
          }
        : plan,
    ));
  }

  function updateMealItem(dayId, mealId, itemId, field, value) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    meals: day.meals.map((meal) =>
                      meal.id === mealId
                        ? {
                            ...meal,
                            items: meal.items.map((item) => item.id === itemId ? { ...item, [field]: value } : item),
                          }
                        : meal,
                    ),
                  }
                : day,
            ),
          }
        : plan,
    ));
  }

  function deleteMealItem(dayId, mealId, itemId) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    meals: day.meals.map((meal) =>
                      meal.id === mealId ? { ...meal, items: meal.items.filter((item) => item.id !== itemId) } : meal,
                    ),
                  }
                : day,
            ),
          }
        : plan,
    ));
  }

  function duplicateMealItem(dayId, mealId, item) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    meals: day.meals.map((meal) =>
                      meal.id === mealId ? { ...meal, items: [{ ...item, id: `${meal.id}-duplicate-${meal.items.length}` }, ...meal.items] } : meal,
                    ),
                  }
                : day,
            ),
          }
        : plan,
    ));
  }

  function moveMealItem(dayId, mealId, itemId, direction) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === dayId
                ? {
                    ...day,
                    meals: day.meals.map((meal) =>
                      meal.id === mealId ? { ...meal, items: reorderItems(meal.items, itemId, direction) } : meal,
                    ),
                  }
                : day,
            ),
          }
        : plan,
    ));
  }

  function copyDayToNext(dayId) {
    const sourceDay = activePlan.days.find((day) => day.id === dayId);
    const sourceIndex = activePlan.days.findIndex((day) => day.id === dayId);
    const targetDay = activePlan.days[sourceIndex + 1];
    if (!sourceDay || !targetDay) return;
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === targetDay.id
                ? { ...day, meals: cloneMeals(sourceDay.meals) }
                : day,
            ),
          }
        : plan,
    ));
  }

  function copyMealToNextDay(dayId, mealId) {
    const sourceDay = activePlan.days.find((day) => day.id === dayId);
    const sourceIndex = activePlan.days.findIndex((day) => day.id === dayId);
    const targetDay = activePlan.days[sourceIndex + 1];
    const sourceMeal = sourceDay?.meals.find((meal) => meal.id === mealId);
    if (!sourceMeal || !targetDay) return;
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === targetDay.id
                ? {
                    ...day,
                    meals: day.meals.map((meal) =>
                      meal.id === mealId ? { ...meal, items: cloneMealItems(sourceMeal.items) } : meal,
                    ),
                  }
                : day,
            ),
          }
        : plan,
    ));
  }

  function updateDayActivity(dayId, field, value) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) =>
              day.id === dayId ? { ...day, activity: { ...day.activity, [field]: value } } : day,
            ),
          }
        : plan,
    ));
  }

  function updateDayNotes(dayId, value) {
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            days: plan.days.map((day) => day.id === dayId ? { ...day, notes: value } : day),
          }
        : plan,
    ));
  }

  function applyTemplate(templateId) {
    const template = DIET_PLAN_TEMPLATES.find((item) => item.id === templateId);
    if (!template) return;
    updateDietPlans(updateField, draft, draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? {
            ...plan,
            clinicalGoal: template.goal,
            dietType: template.dietType,
            title: `${template.label} starting point`,
            status: "Draft",
            templateLabel: `${template.label} — clinician review required`,
          }
        : plan,
    ));
  }

  function setPlanStatus(status) {
    const nextPlans = draft.dietPlans.map((plan) =>
      plan.id === activePlanId
        ? { ...plan, status, versionHistory: [{ date: "Current session", status, title: plan.title }, ...plan.versionHistory] }
        : status === "Active"
          ? { ...plan, status: plan.status === "Active" ? "Archived" : plan.status }
          : plan,
    );
    updateDietPlans(updateField, draft, nextPlans);

    if (status === "Active") {
      const planIntervention = {
        dietPrescription: activePlan.dietType || "Diet plan activated",
        education: activePlan.guidance.preparationNotes || "",
        goal: activePlan.clinicalGoal || "Diet plan activated for patient-specific nutrition care.",
        id: `intervention-diet-plan-${activePlan.id}`,
        monitoringIndicators: "Monitor intake adherence, symptoms, weight, and relevant labs.",
        status: "Active",
        supplements: "",
      };
      updateField("interventions", [planIntervention, ...draft.interventions]);
      updateField("nextFollowUpDate", activePlan.reviewDate || draft.nextFollowUpDate);
      updateField("followUps", [{
        date: activePlan.reviewDate || "",
        dietaryAdherence: activePlan.activityGoals.adherenceStatus || "Not Recorded",
        goalProgress: "Diet and activity plan activated",
        id: `follow-up-diet-plan-${activePlan.id}`,
        labTrend: "",
        nextAction: "Review meal adherence, activity tolerance, symptoms, and nutrition goals.",
        outcome: "Pending follow-up",
        status: "Scheduled",
        symptomTrend: "",
        weightTrend: "",
      }, ...draft.followUps]);
    }
  }

  function duplicatePlan() {
    const copy = {
      ...activePlan,
      id: `diet-plan-copy-${draft.dietPlans.length + 1}`,
      status: "Draft",
      title: `${activePlan.title || "Diet plan"} copy`,
      versionHistory: [{ date: "Current session", status: "Draft", title: "Duplicated plan" }],
    };
    updateDietPlans(updateField, draft, [copy, ...draft.dietPlans]);
  }

  return (
    <div className="space-y-4">
      <EditablePanel title="Diet Plan Builder" icon={Utensils}>
        <div className="mb-4 flex flex-wrap gap-2">
          {DIET_PLAN_TEMPLATES.map((template) => (
            <button
              className="rounded-full border border-[var(--np-color-border-soft)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
              key={template.id}
              onClick={() => applyTemplate(template.id)}
              type="button"
            >
              {template.label}
            </button>
          ))}
        </div>
        <p className="mb-4 rounded-[16px] bg-[var(--np-color-warning-bg)] p-3 text-xs font-bold text-[var(--np-color-text-muted)]">
          Templates are starting points only and require clinician review.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ClinicalInput label="Plan title" value={activePlan.title} onChange={(value) => updatePlanField("title", value)} />
          <ClinicalInput label="Clinical goal" value={activePlan.clinicalGoal} onChange={(value) => updatePlanField("clinicalGoal", value)} />
          <ClinicalInput label="Start date" type="date" value={activePlan.startDate} onChange={(value) => updatePlanField("startDate", value)} />
          <ClinicalInput label="Review date" type="date" value={activePlan.reviewDate} onChange={(value) => updatePlanField("reviewDate", value)} />
          <ClinicalSelect label="Diet type" options={["General balanced diet", "Weight management", "Diabetes", "Renal", "IBS", "Iron deficiency", "High-protein", "Low-sodium"]} value={activePlan.dietType} onChange={(value) => updatePlanField("dietType", value)} />
          <ClinicalInput label="Energy target" type="number" value={activePlan.targets.energy} onChange={(value) => updatePlanField("targets", { ...activePlan.targets, energy: value })} />
          <ClinicalInput label="Protein target" type="number" value={activePlan.targets.protein} onChange={(value) => updatePlanField("targets", { ...activePlan.targets, protein: value })} />
          <ClinicalInput label="Carbohydrate target" type="number" value={activePlan.targets.carbohydrate} onChange={(value) => updatePlanField("targets", { ...activePlan.targets, carbohydrate: value })} />
          <ClinicalInput label="Fat target" type="number" value={activePlan.targets.fat} onChange={(value) => updatePlanField("targets", { ...activePlan.targets, fat: value })} />
          <ClinicalInput label="Fluid target" type="number" value={activePlan.targets.fluid} onChange={(value) => updatePlanField("targets", { ...activePlan.targets, fluid: value })} />
          <ClinicalInput label="Sodium target" type="number" value={activePlan.targets.sodium} onChange={(value) => updatePlanField("targets", { ...activePlan.targets, sodium: value })} />
          <ClinicalInput label="Fiber target" type="number" value={activePlan.targets.fiber} onChange={(value) => updatePlanField("targets", { ...activePlan.targets, fiber: value })} />
          <ClinicalInput label="Primary activity goal" value={activePlan.activityGoals.primaryGoal} onChange={(value) => updatePlanField("activityGoals", { ...activePlan.activityGoals, primaryGoal: value })} />
          <ClinicalInput label="Weekly minutes target" type="number" value={activePlan.activityGoals.weeklyMinutesTarget} onChange={(value) => updatePlanField("activityGoals", { ...activePlan.activityGoals, weeklyMinutesTarget: value })} />
          <ClinicalInput label="Steps target" type="number" value={activePlan.activityGoals.stepsTarget} onChange={(value) => updatePlanField("activityGoals", { ...activePlan.activityGoals, stepsTarget: value })} />
          <ClinicalInput label="Resistance sessions target" type="number" value={activePlan.activityGoals.resistanceSessionsTarget} onChange={(value) => updatePlanField("activityGoals", { ...activePlan.activityGoals, resistanceSessionsTarget: value })} />
          <ClinicalInput label="Sedentary-time reduction goal" value={activePlan.activityGoals.sedentaryReductionGoal} onChange={(value) => updatePlanField("activityGoals", { ...activePlan.activityGoals, sedentaryReductionGoal: value })} />
          <ClinicalInput label="Activity review date" type="date" value={activePlan.activityGoals.reviewDate} onChange={(value) => updatePlanField("activityGoals", { ...activePlan.activityGoals, reviewDate: value })} />
          <ClinicalSelect label="Adherence status" options={["Draft", "In Progress", "Complete", "Needs Review", "Active", "Archived"]} value={activePlan.activityGoals.adherenceStatus} onChange={(value) => updatePlanField("activityGoals", { ...activePlan.activityGoals, adherenceStatus: value })} />
        </div>
      </EditablePanel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <EditablePanel title="Patient Context" icon={ClipboardList}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {context.map(([label, value]) => <SummaryMetric key={label} label={label} value={value} />)}
          </div>
        </EditablePanel>
        <EditablePanel title="Daily Totals" icon={Target}>
          <div className="grid grid-cols-1 gap-2">
            {[
              ["Calories", totals.calories, activePlan.targets.energy, "kcal"],
              ["Protein", totals.protein, activePlan.targets.protein, "g"],
              ["Carbohydrate", totals.carbohydrate, activePlan.targets.carbohydrate, "g"],
              ["Fat", totals.fat, activePlan.targets.fat, "g"],
              ["Fiber", totals.fiber, activePlan.targets.fiber, "g"],
              ["Fluids", totals.fluid, activePlan.targets.fluid, "mL"],
              ["Activity", totals.activityMinutes, activePlan.activityGoals.weeklyMinutesTarget ? Math.round(Number(activePlan.activityGoals.weeklyMinutesTarget) / durationDayCount(activePlan.duration)) : "", "min"],
            ].map(([label, value, target, unit]) => <MacroProgress key={label} label={label} target={target} unit={unit} value={value} />)}
          </div>
        </EditablePanel>
      </div>

      <EditablePanel title="Weekly Meal & Activity Table" icon={Utensils}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["one", "three", "seven"].map((mode) => (
            <button
              className={`rounded-full border px-3 py-2 text-xs font-extrabold ${activePlan.duration === mode ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white" : "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)]"}`}
              key={mode}
              onClick={() => updatePlanField("duration", mode)}
              type="button"
            >
              {mode === "one" ? "One-day" : mode === "three" ? "Three-day" : "Seven-day"}
            </button>
          ))}
        </div>
        <WeeklyPlanTable
          activePlan={activePlan}
          copyDayToNext={copyDayToNext}
          copyMealToNextDay={copyMealToNextDay}
          onAddItem={addMealItem}
          onDeleteItem={deleteMealItem}
          onDuplicateItem={duplicateMealItem}
          onMoveItem={moveMealItem}
          onUpdateActivity={updateDayActivity}
          onUpdateItem={updateMealItem}
          onUpdateNotes={updateDayNotes}
        />
      </EditablePanel>

      <EditablePanel title="Weekly Summary" icon={Activity}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["Average daily calories", `${weeklySummary.averageCalories} kcal`],
            ["Average protein", `${weeklySummary.averageProtein} g`],
            ["Average carbohydrate", `${weeklySummary.averageCarbohydrate} g`],
            ["Average fat", `${weeklySummary.averageFat} g`],
            ["Total weekly fiber", `${weeklySummary.totalFiber} g`],
            ["Total weekly fluid", `${weeklySummary.totalFluid} mL`],
            ["Total activity minutes", `${weeklySummary.totalActivityMinutes} min`],
            ["Resistance sessions", weeklySummary.resistanceSessions],
            ["Average daily steps", weeklySummary.averageSteps],
            ["Plan adherence", activePlan.activityGoals.adherenceStatus || "Placeholder"],
          ].map(([label, value]) => <SummaryMetric key={label} label={label} value={value} />)}
        </div>
      </EditablePanel>

      <EditablePanel title="Food Guidance" icon={FileText}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            ["recommendedFoods", "Recommended foods"],
            ["foodsToLimit", "Foods to limit"],
            ["foodsToAvoid", "Foods to avoid"],
            ["culturalPreferences", "Cultural preferences"],
            ["budgetConsiderations", "Budget considerations"],
            ["preparationNotes", "Preparation notes"],
            ["eatingOutGuidance", "Eating-out guidance"],
          ].map(([field, label]) => (
            <ClinicalTextarea
              key={field}
              label={label}
              value={activePlan.guidance[field]}
              onChange={(value) => updatePlanField("guidance", { ...activePlan.guidance, [field]: value })}
            />
          ))}
        </div>
      </EditablePanel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EditablePanel title="Plan Safety" icon={Bell}>
          <div className="space-y-2">
            {safetyAlerts.map((alert) => (
              <p className="rounded-[14px] bg-[var(--np-color-warning-bg)] p-3 text-sm font-bold text-[var(--np-color-text-muted)]" key={alert}>{alert}</p>
            ))}
          </div>
        </EditablePanel>
        <EditablePanel title="Patient-facing Preview" icon={User}>
          <div className="space-y-3">
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{activePlan.title || "Diet plan draft"}</p>
            {activePlan.days.slice(0, durationDayCount(activePlan.duration)).map((day) => <PatientDayPreview day={day} key={day.id} />)}
            <p className="text-xs font-bold text-[var(--np-color-text-muted)]">Follow-up date: {activePlan.reviewDate || draft.nextFollowUpDate || "Not scheduled"}</p>
          </div>
        </EditablePanel>
      </div>

      <EditablePanel title="Save & History" icon={Clock3}>
        <div className="mb-4 flex flex-wrap gap-2">
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => setPlanStatus("Draft")} type="button" variant="secondary">Save draft</NutriButton>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => setPlanStatus("Active")} type="button">Activate plan</NutriButton>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={duplicatePlan} type="button" variant="secondary">Duplicate plan</NutriButton>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => setPlanStatus("Archived")} type="button" variant="secondary">Archive plan</NutriButton>
        </div>
        <div className="space-y-2">
          {activePlan.versionHistory.map((item) => (
            <div className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3" key={`${item.date}-${item.status}`}>
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">{item.title}</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{item.date} - {item.status}</p>
            </div>
          ))}
        </div>
      </EditablePanel>
    </div>
  );
}

function AiInsightsEditor({ draft, onNavigate, setActiveTab, statuses }) {
  const missing = Object.entries(statuses).filter(([, status]) => status === "Missing");
  const needsReview = Object.entries(statuses).filter(([, status]) => status === "Needs Review" || status === "Draft");
  const abnormalLabs = draft.labValues.filter((lab) => ["Low", "High", "Needs Review"].includes(lab.status));

  return (
    <div className="space-y-4">
      <NutriPanel className="border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-4">
        <p className="text-sm font-extrabold text-[var(--np-color-text)]">
          Clinical consideration — clinician review required.
        </p>
        <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
          Rule-based summary from available patient data only. No diagnoses or prescriptions are generated.
        </p>
      </NutriPanel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InsightCard title="Missing documentation" items={missing.map(([tabId]) => tabLabel(tabId))} onClick={() => missing[0] && setActiveTab(missing[0][0])} />
        <InsightCard title="Workflow gaps" items={needsReview.map(([tabId, status]) => `${tabLabel(tabId)}: ${status}`)} onClick={() => needsReview[0] && setActiveTab(needsReview[0][0])} />
        <InsightCard title="Available risk flags" items={abnormalLabs.map((lab) => `${lab.label}: ${lab.status}`)} onClick={() => setActiveTab("laboratory")} />
        <InsightCard title="Follow-up reminders" items={[draft.nextFollowUpDate ? `Next follow-up: ${draft.nextFollowUpDate}` : "No follow-up date recorded"]} onClick={() => setActiveTab("monitoring")} />
        <InsightCard title="Data used" items={["Anthropometrics", "Laboratory rows", "Dietary fields", "PES records", "Interventions", "Monitoring entries"]} />
        <InsightCard title="Data not available" items={missing.length ? missing.map(([tabId]) => tabLabel(tabId)) : ["No missing core tab detected"]} />
      </div>
      <div className="flex flex-wrap gap-2">
        <NutriButton onClick={() => setActiveTab("laboratory")} variant="secondary">Open Laboratory</NutriButton>
        <NutriButton onClick={() => onNavigate?.("reports")} variant="secondary">Generate Report</NutriButton>
      </div>
    </div>
  );
}

function EditablePanel({ children, icon: Icon, title }) {
  return (
    <NutriPanel className="p-4">
      <NutriSectionHeader icon={Icon} kicker="Editable clinical record" title={title} />
      {children}
    </NutriPanel>
  );
}

function EditableRows({ addLabel, columns, items, onAdd, onDelete, onUpdate, title }) {
  return (
    <NutriPanel className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <NutriSectionHeader icon={ClipboardList} kicker="Editable rows" title={title} />
        <NutriButton className="min-h-10 px-3 text-xs" onClick={onAdd} variant="secondary">
          <Plus className="h-4 w-4" />
          {addLabel}
        </NutriButton>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={item.id}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {columns.map(([field, label, type, options]) => (
                <ClinicalField
                  key={field}
                  label={label}
                  onChange={(value) => onUpdate(item.id, field, value)}
                  options={options}
                  type={type}
                  value={item[field]}
                />
              ))}
            </div>
            <NutriButton className="mt-3 min-h-10 px-3 text-xs" onClick={() => onDelete(item.id)} type="button" variant="secondary">
              <Trash2 className="h-4 w-4" />
              Delete
            </NutriButton>
          </div>
        ))}
        {!items.length ? (
          <p className="rounded-[16px] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
            No record added yet.
          </p>
        ) : null}
      </div>
    </NutriPanel>
  );
}

function ClinicalField({ label, onChange, options, type, value }) {
  if (type === "textarea") return <ClinicalTextarea label={label} onChange={onChange} value={value} />;
  if (type === "select") return <ClinicalSelect label={label} onChange={onChange} options={options} value={value} />;
  return <ClinicalInput label={label} onChange={onChange} type={type} value={value} />;
}

function ClinicalInput({ label, onChange, type = "text", value }) {
  return (
    <label className="block rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <span className="np-form-label">{label}</span>
      <input className="np-form-control min-h-11" onChange={(event) => onChange(event.target.value)} type={type} value={value || ""} />
    </label>
  );
}

function ClinicalTextarea({ label, onChange, value }) {
  return (
    <label className="block rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <span className="np-form-label">{label}</span>
      <textarea className="np-form-control min-h-24 resize-y" onChange={(event) => onChange(event.target.value)} value={value || ""} />
    </label>
  );
}

function ClinicalSelect({ label, onChange, options = [], value }) {
  return (
    <label className="block rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <span className="np-form-label">{label}</span>
      <select className="np-form-control min-h-11" onChange={(event) => onChange(event.target.value)} value={value || ""}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="np-form-label">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
      <p className="mt-2 break-words text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function InsightCard({ items, onClick, title }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4 text-left transition hover:border-[var(--np-color-brand)]"
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <p className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</p>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : ["No item recorded"]).map((item) => (
          <li className="text-xs font-bold leading-5 text-[var(--np-color-text-muted)]" key={item}>{item}</li>
        ))}
      </ul>
    </Component>
  );
}

function WeeklyPlanTable({ activePlan, copyDayToNext, copyMealToNextDay, onAddItem, onDeleteItem, onDuplicateItem, onMoveItem, onUpdateActivity, onUpdateItem, onUpdateNotes }) {
  const days = activePlan.days.slice(0, durationDayCount(activePlan.duration));

  return (
    <>
      <div className="hidden overflow-x-auto xl:block">
        <table className="min-w-[1500px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              {["Day", ...MEAL_TYPES.map((meal) => meal.label), "Physical Activity", "Daily Notes"].map((header) => (
                <th className="border-b border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3 text-xs font-extrabold text-[var(--np-color-text-muted)] first:rounded-l-[16px] last:rounded-r-[16px]" key={header}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.id}>
                <td className="w-36 align-top border-b border-[var(--np-color-border-soft)] p-3">
                  <p className="text-sm font-extrabold text-[var(--np-color-text)]">{day.label}</p>
                  <NutriButton className="mt-2 min-h-9 px-3 text-xs" onClick={() => copyDayToNext(day.id)} type="button" variant="secondary">
                    Copy full day
                  </NutriButton>
                  <DayTotalsMini day={day} />
                </td>
                {day.meals.map((meal) => (
                  <td className="w-48 align-top border-b border-[var(--np-color-border-soft)] p-2" key={meal.id}>
                    <MealCell
                      dayId={day.id}
                      meal={meal}
                      onAddItem={onAddItem}
                      onCopyMeal={copyMealToNextDay}
                      onDeleteItem={onDeleteItem}
                      onDuplicateItem={onDuplicateItem}
                      onMoveItem={onMoveItem}
                      onUpdateItem={onUpdateItem}
                    />
                  </td>
                ))}
                <td className="w-64 align-top border-b border-[var(--np-color-border-soft)] p-2">
                  <ActivityCell activity={day.activity} dayId={day.id} onUpdateActivity={onUpdateActivity} />
                </td>
                <td className="w-56 align-top border-b border-[var(--np-color-border-soft)] p-2">
                  <ClinicalTextarea label="Daily notes" value={day.notes} onChange={(value) => onUpdateNotes(day.id, value)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 xl:hidden">
        {days.map((day) => (
          <details className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={day.id} open={day.id === "saturday"}>
            <summary className="cursor-pointer text-sm font-extrabold text-[var(--np-color-text)]">
              {day.label}
            </summary>
            <div className="mt-3 space-y-3">
              <div className="flex flex-wrap gap-2">
                <NutriButton className="min-h-10 px-3 text-xs" onClick={() => copyDayToNext(day.id)} type="button" variant="secondary">
                  Copy full day
                </NutriButton>
              </div>
              <DayTotalsMini day={day} />
              {day.meals.map((meal) => (
                <MealCell
                  dayId={day.id}
                  key={meal.id}
                  meal={meal}
                  onAddItem={onAddItem}
                  onCopyMeal={copyMealToNextDay}
                  onDeleteItem={onDeleteItem}
                  onDuplicateItem={onDuplicateItem}
                  onMoveItem={onMoveItem}
                  onUpdateItem={onUpdateItem}
                />
              ))}
              <ActivityCell activity={day.activity} dayId={day.id} onUpdateActivity={onUpdateActivity} />
              <ClinicalTextarea label="Daily notes" value={day.notes} onChange={(value) => onUpdateNotes(day.id, value)} />
            </div>
          </details>
        ))}
      </div>
    </>
  );
}

function MealCell({ dayId, meal, onAddItem, onCopyMeal, onDeleteItem, onDuplicateItem, onMoveItem, onUpdateItem }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-[var(--np-color-text)]">{meal.label}</p>
        <div className="flex flex-wrap gap-1">
          <NutriButton className="min-h-9 px-2 text-xs" onClick={() => onAddItem(dayId, meal.id)} type="button" variant="secondary">
            <Plus className="h-4 w-4" />
            Add
          </NutriButton>
          <NutriButton className="min-h-9 px-2 text-xs" onClick={() => onCopyMeal(dayId, meal.id)} type="button" variant="secondary">
            Copy
          </NutriButton>
        </div>
      </div>
      <div className="space-y-3">
        {meal.items.map((item) => (
          <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={item.id}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-4">
              {[
                ["food", "Food item", "text"],
                ["portion", "Portion", "text"],
                ["unit", "Unit", "text"],
                ["calories", "Calories", "number"],
                ["protein", "Protein", "number"],
                ["carbohydrate", "Carbohydrate", "number"],
                ["fat", "Fat", "number"],
                ["fiber", "Fiber", "number"],
                ["fluid", "Fluid", "number"],
                ["notes", "Notes", "text"],
                ["alternatives", "Alternatives", "text"],
              ].map(([field, label, type]) => (
                <ClinicalInput
                  key={field}
                  label={label}
                  type={type}
                  value={item[field]}
                  onChange={(value) => onUpdateItem(dayId, meal.id, item.id, field, value)}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <NutriButton className="min-h-9 px-2 text-xs" onClick={() => onDuplicateItem(dayId, meal.id, item)} type="button" variant="secondary">Duplicate</NutriButton>
              <NutriButton className="min-h-9 px-2 text-xs" onClick={() => onMoveItem(dayId, meal.id, item.id, -1)} type="button" variant="secondary">Up</NutriButton>
              <NutriButton className="min-h-9 px-2 text-xs" onClick={() => onMoveItem(dayId, meal.id, item.id, 1)} type="button" variant="secondary">Down</NutriButton>
              <NutriButton className="min-h-9 px-2 text-xs" onClick={() => onDeleteItem(dayId, meal.id, item.id)} type="button" variant="secondary">
                <Trash2 className="h-4 w-4" />
                Delete
              </NutriButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityCell({ activity, dayId, onUpdateActivity }) {
  return (
    <div className="space-y-2 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <ClinicalInput label="Activity type" value={activity.type} onChange={(value) => onUpdateActivity(dayId, "type", value)} />
      <ClinicalSelect label="Category" options={["Aerobic", "Resistance", "Flexibility", "Balance", "Daily movement"]} value={activity.category} onChange={(value) => onUpdateActivity(dayId, "category", value)} />
      <ClinicalInput label="Duration in minutes" type="number" value={activity.duration} onChange={(value) => onUpdateActivity(dayId, "duration", value)} />
      <ClinicalInput label="Frequency" value={activity.frequency} onChange={(value) => onUpdateActivity(dayId, "frequency", value)} />
      <ClinicalSelect label="Intensity" options={["Light", "Moderate", "Vigorous"]} value={activity.intensity} onChange={(value) => onUpdateActivity(dayId, "intensity", value)} />
      <ClinicalInput label="Steps target" type="number" value={activity.stepsTarget} onChange={(value) => onUpdateActivity(dayId, "stepsTarget", value)} />
      <ClinicalInput label="Sessions per week" type="number" value={activity.sessionsPerWeek} onChange={(value) => onUpdateActivity(dayId, "sessionsPerWeek", value)} />
      <ClinicalInput label="Preferred time" value={activity.preferredTime} onChange={(value) => onUpdateActivity(dayId, "preferredTime", value)} />
      <ClinicalInput label="Equipment" value={activity.equipment} onChange={(value) => onUpdateActivity(dayId, "equipment", value)} />
      <ClinicalInput label="Location" value={activity.location} onChange={(value) => onUpdateActivity(dayId, "location", value)} />
      <ClinicalTextarea label="Clinical restrictions" value={activity.clinicalRestrictions} onChange={(value) => onUpdateActivity(dayId, "clinicalRestrictions", value)} />
      <ClinicalTextarea label="Patient preference" value={activity.patientPreference} onChange={(value) => onUpdateActivity(dayId, "patientPreference", value)} />
      <ClinicalTextarea label="Notes" value={activity.notes} onChange={(value) => onUpdateActivity(dayId, "notes", value)} />
    </div>
  );
}

function DayTotalsMini({ day }) {
  const totals = calculateDayTotals(day);

  return (
    <div className="mt-2 rounded-[14px] bg-[var(--np-color-surface-muted)] p-2 text-[11px] font-bold leading-5 text-[var(--np-color-text-muted)]">
      <p>{totals.calories} kcal • {totals.protein}g protein • {totals.carbohydrate}g carb</p>
      <p>{totals.fat}g fat • {totals.fiber}g fiber • {totals.fluid}mL fluids</p>
      <p>{totals.activityMinutes} min activity</p>
    </div>
  );
}

function PatientDayPreview({ day }) {
  return (
    <div className="rounded-[16px] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-xs font-extrabold text-[var(--np-color-brand)]">{day.label}</p>
      <div className="mt-2 space-y-2">
        {day.meals.map((meal) => (
          <p className="text-sm font-bold text-[var(--np-color-text-muted)]" key={meal.id}>
            <span className="font-extrabold text-[var(--np-color-text)]">{meal.label}: </span>
            {meal.items.map((item) => [item.food, item.portion, item.unit].filter(Boolean).join(" ")).filter(Boolean).join(", ") || "No food item added"}
            {meal.items.some((item) => item.alternatives) ? ` Alternatives: ${meal.items.map((item) => item.alternatives).filter(Boolean).join(", ")}` : ""}
          </p>
        ))}
        <p className="text-sm font-bold text-[var(--np-color-text-muted)]">
          <span className="font-extrabold text-[var(--np-color-text)]">Activity: </span>
          {[day.activity.type, day.activity.duration ? `${day.activity.duration} min` : "", day.activity.intensity].filter(Boolean).join(" • ") || "No activity added"}
        </p>
        <p className="text-sm font-bold text-[var(--np-color-text-muted)]">
          <span className="font-extrabold text-[var(--np-color-text)]">Notes: </span>
          {day.notes || "No daily notes"}
        </p>
      </div>
    </div>
  );
}

function MacroProgress({ label, target, unit, value }) {
  const numericTarget = Number(target);
  const percent = numericTarget ? Math.min(100, Math.round((Number(value) / numericTarget) * 100)) : 0;

  return (
    <div className="rounded-[14px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-[var(--np-color-text)]">{label}</p>
        <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{value} / {target || "Target"} {unit}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--np-color-surface-muted)]">
        <div className="h-full rounded-full bg-[var(--np-color-brand)] transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function createClinicalDraft(patient) {
  const labValues = normalizeLabRows(patient.labValues, patient);
  return {
    allergies: normalizeRows(patient.allergies, { name: "", reaction: "", severity: "Low" }),
    appetite: patient.appetite || "Not Recorded",
    bmi: calculateDraftBmi(patient.height, patient.weight),
    bodyComposition: patient.bodyComposition || "",
    comorbidities: Array.isArray(patient.comorbidities) ? patient.comorbidities : [],
    diagnoses: normalizeRows(patient.diagnoses, { problem: "", etiology: "", signs: "", priority: "Moderate", status: "Draft", reviewDate: "" }),
    dietaryAdherence: patient.dietaryAdherence || "Not Recorded",
    dietaryNotes: patient.dietaryNotes || "",
    dietaryRecall: patient.dietaryRecall || "",
    dietPlans: normalizeDietPlans(patient.dietPlans),
    estimatedRequirements: patient.estimatedRequirements || "",
    familyHistory: patient.familyHistory || "",
    fluidIntake: patient.fluidIntake || "",
    foodAllergy: patient.foodAllergy || "",
    foodFrequency: patient.foodFrequency || "",
    foodIntolerance: patient.foodIntolerance || "",
    followUps: normalizeRows(patient.followUps, { date: patient.nextFollowUpDate || "", weightTrend: "", labTrend: "", symptomTrend: "", dietaryAdherence: "Not Recorded", goalProgress: "", outcome: "", nextAction: "", status: "Scheduled" }),
    giSymptoms: patient.giSymptoms || "",
    height: patient.height || "",
    idealBodyWeight: patient.idealBodyWeight || "",
    interventions: normalizeRows(patient.interventions, { goal: "", dietPrescription: "", education: "", counseling: "", supplements: "", referrals: "", followUpPlan: "", monitoringIndicators: "", status: "Draft" }),
    intolerances: patient.intolerances || "",
    labValues,
    mealPattern: patient.mealPattern || "",
    medicalHistory: patient.medicalHistory || "",
    medications: normalizeRows(patient.medications, { name: "", dose: "", notes: "" }),
    muac: patient.muac || "",
    nextFollowUpDate: patient.nextFollowUpDate || "",
    physicalActivity: patient.physicalActivity || "Not Recorded",
    referringDepartment: patient.referringDepartment || "",
    referringPhysician: patient.referringPhysician || "",
    reviewStatus: patient.reviewStatus || "Needs Review",
    smoking: Boolean(patient.smoking),
    supplements: patient.supplements || "",
    surgeryHistory: patient.surgeryHistory || "",
    waistCircumference: patient.waistCircumference || "",
    weight: patient.weight || "",
    weightChange: patient.weightChange || "",
    weightHistory: patient.weightHistory || "",
  };
}

function mergeClinicalDraft(patient, draft) {
  return {
    ...patient,
    ...draft,
    bmi: calculateDraftBmi(draft.height, draft.weight),
    diagnosis: draft.diagnoses.find((diagnosis) => diagnosis.status === "Active")?.problem || draft.diagnoses.find((diagnosis) => diagnosis.problem)?.problem || patient.diagnosis,
    height: Number(draft.height) || "",
    labValues: draft.labValues,
    nextFollowUpDate: draft.nextFollowUpDate || draft.followUps.find((followUp) => followUp.date)?.date || patient.nextFollowUpDate,
    weight: Number(draft.weight) || "",
  };
}

function normalizeRows(rows, fallback) {
  const sourceRows = Array.isArray(rows) && rows.length ? rows : [fallback];
  return sourceRows.map((row, index) => ({ ...fallback, ...row, id: row.id || `row-${index}` }));
}

function normalizeDietPlans(plans) {
  return Array.isArray(plans) && plans.length ? plans.map(normalizeDietPlan) : [createDefaultDietPlan()];
}

function normalizeDietPlan(plan) {
  const defaultPlan = createDefaultDietPlan();
  return {
    ...defaultPlan,
    ...plan,
    days: Array.isArray(plan.days) && plan.days.length ? plan.days.map((day, index) => ({
      ...defaultPlan.days[index],
      ...day,
      activity: { ...createDefaultActivity(), ...(day.activity || {}) },
      meals: normalizeMeals(day.meals || defaultPlan.days[index]?.meals || defaultPlan.days[0].meals),
      notes: day.notes || "",
    })) : defaultPlan.days,
    activityGoals: { ...defaultPlan.activityGoals, ...(plan.activityGoals || {}) },
    guidance: { ...defaultPlan.guidance, ...(plan.guidance || {}) },
    targets: { ...defaultPlan.targets, ...(plan.targets || {}) },
    versionHistory: Array.isArray(plan.versionHistory) ? plan.versionHistory : defaultPlan.versionHistory,
  };
}

function createDefaultDietPlan() {
  return {
    activityGoals: {
      adherenceStatus: "Draft",
      primaryGoal: "",
      resistanceSessionsTarget: "",
      reviewDate: "",
      sedentaryReductionGoal: "",
      stepsTarget: "",
      weeklyMinutesTarget: "",
    },
    clinicalGoal: "",
    days: WEEK_DAYS.map((day) => ({
      activity: createDefaultActivity(),
      id: day.id,
      label: day.label,
      meals: normalizeMeals(),
      notes: "",
    })),
    dietType: "General balanced diet",
    duration: "one",
    guidance: {
      budgetConsiderations: "",
      culturalPreferences: "",
      eatingOutGuidance: "",
      foodsToAvoid: "",
      foodsToLimit: "",
      preparationNotes: "",
      recommendedFoods: "",
    },
    id: "diet-plan-default",
    reviewDate: "",
    startDate: "",
    status: "Draft",
    targets: {
      carbohydrate: "",
      energy: "",
      fat: "",
      fiber: "",
      fluid: "",
      protein: "",
      sodium: "",
    },
    templateLabel: "Custom plan — clinician review required",
    title: "Nutrition plan draft",
    versionHistory: [{ date: "Current session", status: "Draft", title: "Plan draft created" }],
  };
}

function normalizeMeals(meals = null) {
  const sourceMeals = meals || MEAL_TYPES.map((meal) => ({ ...meal, items: [createMealItem()] }));
  return sourceMeals.map((meal) => ({
    ...meal,
    items: Array.isArray(meal.items) ? meal.items.map((item, index) => ({ ...createMealItem(index), ...item, id: item.id || `${meal.id}-food-${index}` })) : [createMealItem()],
  }));
}

function createMealItem(index = 0) {
  return {
    alternatives: "",
    calories: "",
    carbohydrate: "",
    fat: "",
    fiber: "",
    fluid: "",
    food: "",
    id: `food-item-${index}`,
    notes: "",
    portion: "",
    protein: "",
    unit: "",
  };
}

function createDefaultActivity() {
  return {
    category: "Daily movement",
    clinicalRestrictions: "",
    duration: "",
    equipment: "",
    frequency: "",
    intensity: "Light",
    location: "",
    notes: "",
    patientPreference: "",
    preferredTime: "",
    sessionsPerWeek: "",
    stepsTarget: "",
    type: "",
  };
}

function getActiveDietPlan(draft) {
  return draft.dietPlans.find((plan) => plan.status === "Active") || draft.dietPlans[0] || createDefaultDietPlan();
}

function updateDietPlans(updateField, draft, plans) {
  updateField("dietPlans", plans.map(normalizeDietPlan));
}

function calculateDietPlanTotals(plan) {
  const activeDays = plan.days.slice(0, durationDayCount(plan.duration));
  const totals = activeDays.reduce((dayTotals, day) => {
    day.meals.forEach((meal) => {
      meal.items.forEach((item) => {
        dayTotals.calories += Number(item.calories) || 0;
        dayTotals.protein += Number(item.protein) || 0;
        dayTotals.carbohydrate += Number(item.carbohydrate) || 0;
        dayTotals.fat += Number(item.fat) || 0;
        dayTotals.fiber += Number(item.fiber) || 0;
        dayTotals.fluid += Number(item.fluid) || 0;
      });
    });
    dayTotals.activityMinutes += Number(day.activity?.duration) || 0;
    return dayTotals;
  }, { activityMinutes: 0, calories: 0, carbohydrate: 0, fat: 0, fiber: 0, fluid: 0, protein: 0 });

  const divisor = activeDays.length || 1;
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value / divisor)]));
}

function calculateDayTotals(day) {
  return day.meals.reduce((totals, meal) => {
    meal.items.forEach((item) => {
      totals.calories += Number(item.calories) || 0;
      totals.protein += Number(item.protein) || 0;
      totals.carbohydrate += Number(item.carbohydrate) || 0;
      totals.fat += Number(item.fat) || 0;
      totals.fiber += Number(item.fiber) || 0;
      totals.fluid += Number(item.fluid) || 0;
    });
    totals.activityMinutes = Number(day.activity?.duration) || 0;
    return totals;
  }, { activityMinutes: 0, calories: 0, carbohydrate: 0, fat: 0, fiber: 0, fluid: 0, protein: 0 });
}

function calculateWeeklyDietPlanSummary(plan) {
  const activeDays = plan.days.slice(0, durationDayCount(plan.duration));
  const dayTotals = activeDays.map(calculateDayTotals);
  const dayCount = dayTotals.length || 1;
  const totals = dayTotals.reduce((sum, day) => ({
    activityMinutes: sum.activityMinutes + day.activityMinutes,
    calories: sum.calories + day.calories,
    carbohydrate: sum.carbohydrate + day.carbohydrate,
    fat: sum.fat + day.fat,
    fiber: sum.fiber + day.fiber,
    fluid: sum.fluid + day.fluid,
    protein: sum.protein + day.protein,
  }), { activityMinutes: 0, calories: 0, carbohydrate: 0, fat: 0, fiber: 0, fluid: 0, protein: 0 });
  const resistanceSessions = activeDays.filter((day) => day.activity?.category === "Resistance" && Number(day.activity?.duration)).length;
  const stepsTotal = activeDays.reduce((sum, day) => sum + (Number(day.activity?.stepsTarget) || 0), 0);

  return {
    averageCalories: Math.round(totals.calories / dayCount),
    averageCarbohydrate: Math.round(totals.carbohydrate / dayCount),
    averageFat: Math.round(totals.fat / dayCount),
    averageProtein: Math.round(totals.protein / dayCount),
    averageSteps: Math.round(stepsTotal / dayCount),
    resistanceSessions,
    totalActivityMinutes: totals.activityMinutes,
    totalFiber: Math.round(totals.fiber),
    totalFluid: Math.round(totals.fluid),
  };
}

function durationDayCount(duration) {
  if (duration === "seven") return 7;
  if (duration === "three") return 3;
  return 1;
}

function buildDietPlanContext(draft) {
  const activeDiagnosis = draft.diagnoses.find((diagnosis) => diagnosis.problem)?.problem || "No PES diagnosis recorded";
  const activeIntervention = draft.interventions.find((intervention) => intervention.goal || intervention.dietPrescription);
  const labAlerts = draft.labValues.filter((lab) => ["Low", "High", "Needs Review"].includes(lab.status)).map((lab) => lab.label).join(", ");
  const medicalHistory = [
    ...draft.comorbidities.map((item) => item.name).filter(Boolean),
    ...draft.diagnoses.map((item) => item.problem).filter(Boolean),
  ].join(", ");
  const symptoms = [draft.giSymptoms, draft.nutritionRelatedSymptoms].filter(Boolean).join(", ");

  return [
    ["Diagnosis", activeDiagnosis],
    ["Age", draft.age || "Not recorded"],
    ["Allergies", draft.allergies.map((item) => item.name).filter(Boolean).join(", ") || "No allergy recorded"],
    ["Intolerances", draft.intolerances || "No intolerance recorded"],
    ["Medications", draft.medications.map((item) => item.name).filter(Boolean).join(", ") || "No medication added"],
    ["Laboratory alerts", labAlerts || "No available lab alert"],
    ["BMI", draft.bmi || calculateDraftBmi(draft.height, draft.weight) || "Not recorded"],
    ["Weight", draft.weight ? `${draft.weight} kg` : "Not recorded"],
    ["Physical activity", draft.physicalActivity || "Not recorded"],
    ["Medical history", medicalHistory || "No medical history recorded"],
    ["Symptoms", symptoms || "No symptoms recorded"],
    ["Nutrition diagnosis", activeDiagnosis],
    ["Current intervention", activeIntervention?.goal || activeIntervention?.dietPrescription || "No intervention recorded"],
  ];
}

function buildDietPlanSafetyAlerts(draft, plan) {
  const alerts = [];
  const foodText = JSON.stringify(plan.days).toLowerCase();
  const allergies = draft.allergies.map((item) => item.name).filter(Boolean);
  const intoleranceText = String(draft.intolerances || "").toLowerCase();
  const dailyRestrictions = plan.days
    .map((day) => day.activity?.clinicalRestrictions)
    .filter(Boolean);

  alerts.push("Activity plan requires clinician review.");

  allergies.forEach((allergy) => {
    if (allergy && foodText.includes(allergy.toLowerCase())) {
      alerts.push(`Possible allergy conflict: ${allergy}`);
    }
  });

  if (intoleranceText && foodText.includes(intoleranceText)) {
    alerts.push("Possible intolerance conflict from recorded intolerance field.");
  }

  if (!draft.weight || !draft.height) alerts.push("Missing anthropometric data may limit target review.");
  if (!draft.age) alerts.push("Age is not recorded; activity and energy targets require review.");
  if (!draft.physicalActivity) alerts.push("Physical activity level is not recorded.");
  if (draft.giSymptoms || draft.nutritionRelatedSymptoms) alerts.push("Recorded symptoms should be reviewed against meals and activity tolerance.");
  if (dailyRestrictions.length) alerts.push("Clinician-entered activity restrictions are present in the weekly plan.");
  if (!draft.labValues.some((lab) => lab.value)) alerts.push("Missing laboratory data may limit safety review.");
  if (alerts.length === 1) alerts.push("No safety conflict detected from available local data.");
  return alerts;
}

function reorderItems(items, itemId, direction) {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) return items;
  const nextItems = [...items];
  const [item] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, item);
  return nextItems;
}

function cloneMeals(meals) {
  return meals.map((meal, mealIndex) => ({
    ...meal,
    items: meal.items.map((item, itemIndex) => ({ ...item, id: `${meal.id}-copy-${mealIndex}-${itemIndex}` })),
  }));
}

function cloneMealItems(items) {
  return items.map((item, index) => ({ ...item, id: `copied-food-${index}` }));
}

function normalizeLabRows(rows, patient) {
  const defaults = CLINICAL_LABS.map((lab) => ({
    date: "",
    id: `lab-${lab.label.toLowerCase().replaceAll(" ", "-")}`,
    label: lab.label,
    notes: "",
    range: "",
    status: "Not Recorded",
    unit: lab.unit,
    value: lab.fallback ? patient[lab.fallback] || "" : "",
  }));

  if (!Array.isArray(rows) || !rows.length) return defaults;
  const byLabel = new Map(rows.map((row) => [row.label, row]));
  return defaults.map((lab) => ({ ...lab, ...(byLabel.get(lab.label) || {}) }));
}

function getClinicalTabStatuses(draft) {
  return {
    ai: "Needs Review",
    anthropometric: statusFromFields(draft, ["height", "weight"], ["weightChange", "muac", "waistCircumference"]),
    dietPlan: dietPlanStatus(draft.dietPlans),
    dietary: statusFromFields(draft, ["dietaryRecall"], ["foodFrequency", "mealPattern", "fluidIntake", "giSymptoms", "estimatedRequirements"]),
    intervention: collectionStatus(draft.interventions, ["goal", "dietPrescription"]),
    laboratory: labStatus(draft.labValues),
    medical: statusFromFields(draft, ["medicalHistory"], ["referringDepartment", "referringPhysician", "familyHistory"]),
    monitoring: collectionStatus(draft.followUps, ["date", "status"]),
    pes: collectionStatus(draft.diagnoses, ["problem", "etiology", "signs"]),
    summary: "Complete",
  };
}

function statusFromFields(draft, requiredFields, optionalFields = []) {
  const hasRequired = requiredFields.every((field) => hasValue(draft[field]));
  const hasAny = [...requiredFields, ...optionalFields].some((field) => hasValue(draft[field]));
  if (!hasAny) return "Missing";
  return hasRequired ? "Complete" : "In Progress";
}

function collectionStatus(items, requiredFields) {
  if (!items?.some((item) => Object.values(item).some(hasValue))) return "Missing";
  if (items.some((item) => item.status === "Needs Review" || item.status === "Draft")) return "Needs Review";
  return items.some((item) => requiredFields.every((field) => hasValue(item[field]))) ? "Complete" : "In Progress";
}

function labStatus(labs) {
  const recordedLabs = labs.filter((lab) => hasValue(lab.value));
  if (!recordedLabs.length) return "Missing";
  if (recordedLabs.some((lab) => ["Low", "High", "Needs Review"].includes(lab.status))) return "Needs Review";
  return recordedLabs.length >= 3 ? "Complete" : "In Progress";
}

function dietPlanStatus(plans = []) {
  if (!plans.length) return "Missing";
  if (plans.some((plan) => plan.status === "Active")) return "Complete";
  const plan = plans[0];
  const hasOverview = hasValue(plan.title) && hasValue(plan.clinicalGoal);
  const hasMeals = plan.days.some((day) => day.meals.some((meal) => meal.items.some((item) => hasValue(item.food))));
  if (hasOverview || hasMeals) return "In Progress";
  return "Missing";
}

function buildClinicalActivityLog(draft, statuses) {
  return [
    { status: statuses.summary, tabId: "summary", title: "Report generated" },
    { status: statuses.ai, tabId: "ai", title: "AI reviewed" },
    { status: statuses.monitoring, tabId: "monitoring", title: "Follow-up added" },
    { status: statuses.dietPlan, tabId: "dietPlan", title: "Diet plan updated" },
    { status: statuses.intervention, tabId: "intervention", title: "Intervention updated" },
    { status: statuses.pes, tabId: "pes", title: "PES created" },
    { status: statuses.laboratory, tabId: "laboratory", title: "Laboratory updated" },
    { status: statuses.anthropometric, tabId: "anthropometric", title: "Assessment updated" },
  ];
}

function completionPercent(statuses) {
  const values = Object.entries(statuses).filter(([tabId]) => tabId !== "summary").map(([, status]) => status);
  const score = values.reduce((total, status) => total + ({ Complete: 1, "In Progress": 0.5, "Needs Review": 0.6, Draft: 0.25, Missing: 0 }[status] || 0), 0);
  return Math.round((score / values.length) * 100);
}

function calculateDraftBmi(height, weight) {
  const numericHeight = Number(height);
  const numericWeight = Number(weight);
  if (!numericHeight || !numericWeight) return "";
  return (numericWeight / ((numericHeight / 100) ** 2)).toFixed(1);
}

function labMap(labs) {
  return new Map(labs.map((lab) => [lab.label, lab]));
}

function labValue(labs, label) {
  const lab = labs.get(label);
  if (!lab?.value) return "Not recorded";
  return `${lab.value}${lab.unit ? ` ${lab.unit}` : ""}`;
}

function tabLabel(tabId) {
  return workspaceTabs.find((tab) => tab.id === tabId)?.label || tabId;
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(String(value || "").trim());
}

function splitList(value) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function clinicalDraftStorageKey(patientId) {
  return `nutripilot.clinicalHub.draft.${patientId}`;
}

function clinicalTabStorageKey(patientId) {
  return `nutripilot.clinicalHub.tab.${patientId}`;
}

function loadClinicalDraft(patientId) {
  try {
    const storedDraft = localStorage.getItem(clinicalDraftStorageKey(patientId));
    return storedDraft ? JSON.parse(storedDraft) : null;
  } catch {
    return null;
  }
}

function saveClinicalDraft(patientId, draft) {
  localStorage.setItem(clinicalDraftStorageKey(patientId), JSON.stringify(draft));
}

function clearClinicalDraft(patientId) {
  localStorage.removeItem(clinicalDraftStorageKey(patientId));
}

function formatClinicalSaveStatus(status, savedAt) {
  if (status === "Saving...") return "Saving...";
  if (status === "Unsaved changes") return "Unsaved changes";
  if (status === "Save failed") return "Save failed";
  if (!savedAt) return "Saved";
  return "Saved just now";
}

const CLINICAL_LABS = [
  { label: "Hemoglobin", unit: "g/dL" },
  { label: "Ferritin", unit: "ng/mL", fallback: "ferritin" },
  { label: "Serum Iron", unit: "ug/dL" },
  { label: "TIBC", unit: "ug/dL" },
  { label: "Transferrin Saturation", unit: "%" },
  { label: "Vitamin D", unit: "ng/mL", fallback: "vitaminD" },
  { label: "Vitamin B12", unit: "pg/mL" },
  { label: "Folate", unit: "ng/mL" },
  { label: "Albumin", unit: "g/dL" },
  { label: "CRP", unit: "mg/L" },
  { label: "HbA1c", unit: "%" },
  { label: "Fasting glucose", unit: "mg/dL" },
  { label: "Lipid profile", unit: "" },
  { label: "Creatinine", unit: "mg/dL" },
  { label: "eGFR", unit: "mL/min" },
  { label: "Sodium", unit: "mmol/L" },
  { label: "Potassium", unit: "mmol/L" },
  { label: "Calcium", unit: "mg/dL" },
  { label: "Magnesium", unit: "mg/dL" },
  { label: "Phosphorus", unit: "mg/dL" },
];

const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "morning-snack", label: "Morning snack" },
  { id: "lunch", label: "Lunch" },
  { id: "afternoon-snack", label: "Afternoon snack" },
  { id: "dinner", label: "Dinner" },
  { id: "evening-snack", label: "Evening snack" },
];

const WEEK_DAYS = [
  { id: "saturday", label: "Saturday" },
  { id: "sunday", label: "Sunday" },
  { id: "monday", label: "Monday" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "friday", label: "Friday" },
];

const DIET_PLAN_TEMPLATES = [
  { dietType: "Weight management", goal: "Create a structured calorie-aware plan for clinician review.", id: "weight", label: "Weight management" },
  { dietType: "Diabetes", goal: "Create a carbohydrate-consistent plan for clinician review.", id: "diabetes", label: "Diabetes" },
  { dietType: "Renal", goal: "Create a renal-aware meal structure for clinician review.", id: "renal", label: "Renal" },
  { dietType: "IBS", goal: "Create a symptom-aware GI tolerance plan for clinician review.", id: "ibs", label: "IBS" },
  { dietType: "Iron deficiency", goal: "Create an iron-focused meal structure for clinician review.", id: "iron", label: "Iron deficiency" },
  { dietType: "High-protein", goal: "Create a protein-supportive meal structure for clinician review.", id: "protein", label: "High-protein" },
  { dietType: "Low-sodium", goal: "Create a sodium-aware meal structure for clinician review.", id: "sodium", label: "Low-sodium" },
  { dietType: "General balanced diet", goal: "Create a balanced meal pattern for clinician review.", id: "balanced", label: "General balanced diet" },
];
















