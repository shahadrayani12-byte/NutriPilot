import { useCallback, useMemo, useRef, useState } from "react";
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
  Search,
  Target,
  User,
} from "lucide-react";

import { AiInsightsTab } from "../components/clinical/AIInsightsTab";
import { AnthropometricTab } from "../components/clinical/AnthropometricAssessmentTab";
import { ClinicalWorkspaceTabs } from "../components/clinical/ClinicalWorkspaceTabs";
import { DietaryTab } from "../components/clinical/DietaryAssessmentTab";
import { LaboratoryTab } from "../components/clinical/LaboratoryResultsTab";
import { MedicalHistoryTab } from "../components/clinical/MedicalHistoryTab";
import { MonitoringTab } from "../components/clinical/MonitoringEvaluationTab";
import { PesTab } from "../components/clinical/NutritionDiagnosisPESTab";
import { InterventionTab } from "../components/clinical/NutritionInterventionTab";
import { SummaryTab } from "../components/clinical/ClinicalSummaryTab";
import { ClinicalWorkflowEngine } from "../components/clinical/ClinicalWorkflowEngine";
import { sampleWorkspaceData, workspaceTabs } from "../components/clinical/clinicalData";
import { FieldGrid } from "../components/clinical/ClinicalShared";
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
import { normalizePatient } from "../utils/clinicalWorkspaceUtils";
import { getWorkflowNextAction, getWorkflowStatus } from "../utils/workflowStatus";

export default function ClinicalWorkspace({ onCompleteWorkflowStep, onNavigate, patient }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [searchTerm, setSearchTerm] = useState("");
  const workspacePatientRecord = normalizePatient(patient);
  const moduleSectionRef = useRef(null);
  const activeTabConfig = useMemo(() => workspaceTabs.find((tab) => tab.id === activeTab), [activeTab]);
  const ActiveIcon = activeTabConfig?.icon || User;
  const activeWorkflowStepId = clinicalTabToWorkflowStep(activeTab);
  const handleSetActiveTab = useCallback((tabId) => {
    setActiveTab(tabId);
    window.requestAnimationFrame(() => {
      moduleSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  return (
    <NutriPage>
      <ClinicalWorkspaceTopBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
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
          patient={workspacePatientRecord}
          quickActions={[
            ["Open NutriMap", () => onNavigate?.("nutrimap")],
            ["AI Review", () => handleSetActiveTab("ai")],
            ["Generate Report", () => onNavigate?.("reports")],
            ["Schedule Follow-up", () => handleSetActiveTab("monitoring")],
          ]}
        />

        <ClinicalCommandCenter
          activeTab={activeTab}
          onNavigate={onNavigate}
          patient={workspacePatientRecord}
          setActiveTab={handleSetActiveTab}
        />

        <section ref={moduleSectionRef} className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <ClinicalWorkspaceTabs
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
          />

          <div className="space-y-4">
            <NutriPanel className="lg:p-5">
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
                    Guided workspace
                  </span>
                  {activeWorkflowStepId ? (
                    <NutriButton
                      className="min-h-9 px-3 text-xs"
                      onClick={() => onCompleteWorkflowStep?.(activeWorkflowStepId, workspacePatientRecord)}
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
                patient={workspacePatientRecord}
              />
            </NutriPanel>
          </div>
        </section>
      </NutriPageMain>
    </NutriPage>
  );
}

function clinicalTabToWorkflowStep(tabId) {
  const stepByTab = {
    ai: "ai",
    anthropometric: "assessment",
    dietary: "dietary",
    laboratory: "labs",
    medical: "medical",
    monitoring: "monitoring",
    pes: "pes",
    intervention: "intervention",
    summary: "summary",
  };

  return stepByTab[tabId];
}

function ClinicalCommandCenter({ activeTab, onNavigate, patient, setActiveTab }) {
  return (
    <section className="mb-4 grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <ClinicalWorkflowEngine
          activeTab={activeTab}
          compact
          onNavigate={onNavigate}
          patient={patient}
          setActiveTab={setActiveTab}
        />
        <ClinicalQuickActions onNavigate={onNavigate} setActiveTab={setActiveTab} />
        <PatientTimeline patient={patient} />
      </div>
      <ClinicalIntelligencePanel onNavigate={onNavigate} patient={patient} setActiveTab={setActiveTab} />
    </section>
  );
}

function ClinicalQuickActions({ onNavigate, setActiveTab }) {
  const actions = [
    { icon: FlaskConical, label: "Laboratory Results", onClick: () => setActiveTab("laboratory") },
    { icon: FileText, label: "PES Diagnosis", onClick: () => setActiveTab("pes") },
    { icon: Target, label: "Intervention", onClick: () => setActiveTab("intervention") },
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

function ClinicalIntelligencePanel({ onNavigate, patient, setActiveTab }) {
  const workflow = getWorkflowStatus(patient);
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
      confidence: "Moderate confidence placeholder",
      evidence: "Evidence citation placeholder for Version 2.0",
      icon: ClipboardList,
      label: "Missing Data",
      onClick: openFirstMissing,
      patientData: missingData.length ? missingData.map((step) => step.label).join(", ") : "No missing core workflow step detected",
      priority: missingData.length ? "Clinical priority: Needs Review" : "Clinical priority: Ready",
      reason: missingData.length ? "The workflow has incomplete documentation areas." : "The core workflow has no missing placeholder items.",
      status: missingData.length ? "Missing" : "Ready",
    },
    {
      actionLabel: alerts[0]?.title || "Review risk context",
      confidence: "Low confidence placeholder",
      evidence: "Evidence citation placeholder for Version 2.0",
      icon: Bell,
      label: "Risk Alerts",
      onClick: openFirstMissing,
      patientData: `${patient.riskLevel || "Risk pending"}; ${alerts.length} workflow alerts`,
      priority: patient.riskLevel === "High Risk" || highPriorityAlerts.length ? "Clinical priority: High Risk" : "Clinical priority: Needs Review",
      reason: alerts.length ? "Workflow alerts require clinician review before closure." : "No active placeholder workflow alerts are present.",
      status: patient.riskLevel === "High Risk" || highPriorityAlerts.length ? "High Risk" : alerts.length ? "Needs Review" : "Ready",
    },
    {
      actionLabel: "Open AI Insights",
      confidence: "Moderate confidence placeholder",
      evidence: "Rule-based placeholder only; external AI evidence not connected yet",
      icon: Brain,
      label: "AI Review",
      onClick: () => setActiveTab("ai"),
      patientData: `AI workflow status: ${aiStep?.status || "Missing"}`,
      priority: aiStep?.status === "Needs Review" ? "Clinical priority: Needs Review" : "Clinical priority: Routine",
      reason: "AI outputs must be reviewed by the clinician before being used in care documentation.",
      status: normalizeStatus(aiStep?.status),
    },
    {
      actionLabel: "Open Reports",
      confidence: "Moderate confidence placeholder",
      evidence: "Report template readiness placeholder for Version 2.0",
      icon: FileText,
      label: "Report Readiness",
      onClick: () => onNavigate?.("reports"),
      patientData: `Report workflow status: ${reportStep?.status || "Missing"}`,
      priority: reportStep?.status === "Missing" ? "Clinical priority: Missing" : "Clinical priority: Needs Review",
      reason: "Report readiness depends on completion of core clinical workflow sections.",
      status: normalizeStatus(reportStep?.status),
    },
    {
      actionLabel: nextAction.actionLabel,
      confidence: "Moderate confidence placeholder",
      evidence: "Workflow rule placeholder; citations postponed",
      icon: Target,
      label: "Next Step",
      onClick: () => openStep(nextAction),
      patientData: `${nextAction.label}: ${nextAction.status}`,
      priority: nextAction.status === "Missing" ? "Clinical priority: Missing" : "Clinical priority: Needs Review",
      reason: nextAction.reason,
      status: normalizeStatus(nextAction.status),
    },
  ];

  return (
    <NutriPanel className="p-4 2xl:sticky 2xl:top-24 2xl:self-start">
      <NutriSectionHeader
        icon={Brain}
        kicker="Clinical Intelligence"
        title="Recommendation review"
        action={<NutriBadge tone={patient.riskLevel === "High Risk" ? "danger" : "secondary"}>{patient.riskLevel || "Risk pending"}</NutriBadge>}
      />

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
    <button
      className="w-full rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3 text-left transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)] hover:shadow-[var(--np-shadow-sm)]"
      onClick={recommendation.onClick}
      type="button"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="np-icon-tile h-9 w-9 shrink-0">
          <Icon className="h-4 w-4" />
        </span>
        <NutriBadge tone={statusTone(recommendation.status)}>{recommendation.status}</NutriBadge>
      </div>
      <p className="text-sm font-extrabold text-[var(--np-color-text)]">{recommendation.label}</p>
      <dl className="mt-3 space-y-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
        <ClinicalIntelligenceRow label="Reason" value={recommendation.reason} />
        <ClinicalIntelligenceRow label="Related data" value={recommendation.patientData} />
        <ClinicalIntelligenceRow label="Suggested action" value={recommendation.actionLabel} />
        <ClinicalIntelligenceRow label="Priority" value={recommendation.priority} />
        <ClinicalIntelligenceRow label="Confidence" value={recommendation.confidence} />
        <ClinicalIntelligenceRow label="Evidence" value={recommendation.evidence} />
      </dl>
    </button>
  );
}

function ClinicalIntelligenceRow({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
function normalizeStatus(status) {
  if (status === "Completed") return "Ready";
  if (status === "Needs Review") return "Needs Review";
  if (status === "In Progress") return "Needs Review";
  return "Missing";
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

function ClinicalWorkspaceTopBar({ searchTerm, setSearchTerm }) {
  return (
    <header className="np-topbar">
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-[var(--np-radius-lg)] text-[var(--np-color-brand)] transition hover:bg-[var(--np-color-brand-soft)]"
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-[520px]">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--np-color-text-soft)]" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="np-search-field px-12 pr-20"
            placeholder="Search clinical notes, labs, diagnoses..."
          />
          <span className="absolute right-3 top-3 rounded-md border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-2 py-1 text-[10px] font-extrabold text-[var(--np-color-text-muted)]">
            Ctrl K
          </span>
        </div>
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

function TabContent({ activeTab, patient }) {
  if (activeTab === "summary") {
    return <SummaryTab patient={patient} />;
  }

  if (activeTab === "anthropometric") {
    return <AnthropometricTab patient={patient} />;
  }

  if (activeTab === "laboratory") {
    return <LaboratoryTab />;
  }

  if (activeTab === "dietary") {
    return <DietaryTab />;
  }

  if (activeTab === "medical") {
    return <MedicalHistoryTab />;
  }

  if (activeTab === "pes") {
    return <PesTab patient={patient} />;
  }

  if (activeTab === "intervention") {
    return <InterventionTab patient={patient} />;
  }

  if (activeTab === "monitoring") {
    return <MonitoringTab patient={patient} />;
  }

  if (activeTab === "ai") {
    return <AiInsightsTab patient={patient} />;
  }

  return (
    <FieldGrid
      fields={sampleWorkspaceData[activeTab]}
    />
  );
}









