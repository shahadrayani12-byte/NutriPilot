import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Apple,
  Bell,
  Brain,
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  FlaskConical,
  HelpCircle,
  Menu,
  Plus,
  Stethoscope,
  Sun,
  Users,
} from "lucide-react";

import { GlobalSearch } from "../common/GlobalSearch";
import { useTranslation } from "../../i18n";

function normalizeDashboardPatient(patient) {
  if (!patient) return null;
  if (patient.name && patient.labs) return patient;

  return {
    ...patient,
    condition: patient.diagnosis || patient.condition || "Not recorded",
    labs: buildPatientLabMap(patient),
    name: patient.fullName || patient.name || "Unnamed patient",
    nutrition: patient.nutrition || { fiber: "Not recorded" },
    risk: patient.riskLevel?.includes("High") ? "High" : patient.riskLevel?.includes("Moderate") ? "Medium" : "Low",
  };
}

export default function ClinicalCommandCenter({ activePatient, globalSearchProps, intelligence, onNavigate, openClinicalHub, openNutriMap, openResearch, patients: sharedPatients = [], reports = [], schedule = [], setActivePatient, updateAppointment, updatePatient, workflow }) {
  const { isRtl, t } = useTranslation();
  const [activeOrgan, setActiveOrgan] = useState("gastrointestinal");
  const dashboardPatients = useMemo(() => sharedPatients.map(normalizeDashboardPatient).filter(Boolean), [sharedPatients]);
  const selectedPatient =
    dashboardPatients.find(
      (patient) =>
        patient.id === activePatient?.id ||
        patient.fullName === activePatient?.fullName ||
        patient.name === activePatient?.name ||
        patient.name === activePatient?.fullName,
    ) || normalizeDashboardPatient(activePatient);
  const livePatient = selectedPatient || EMPTY_DASHBOARD_PATIENT;
  const filteredPatients = dashboardPatients;
  const highRiskCount = dashboardPatients.filter((patient) => patient.risk === "High").length;
  const lowFerritinCount = dashboardPatients.filter((patient) => isLowLab(patient, "ferritin", 15)).length;
  const vitaminDDeficiencyCount = dashboardPatients.filter((patient) => isLowLab(patient, "vitaminD", 20)).length;
  const labReviewCount = dashboardPatients.filter((patient) => abnormalLabCount(patient) > 0).length;

  return (
    <div className="np-dashboard-shell min-h-screen bg-[var(--np-color-surface-page)] font-[var(--np-font-family-sans)] text-[var(--np-color-text)]">
      <TopBar globalSearchProps={globalSearchProps} />

      <main className="px-7 pb-8 pt-6">
        <WelcomeBand
          highRiskCount={highRiskCount}
          intelligence={intelligence}
          labReviewCount={labReviewCount}
          selectedPatient={livePatient}
        />

        <SmartDashboardSignals intelligence={intelligence} openClinicalHub={openClinicalHub} patient={livePatient} workflow={workflow} />
        <DashboardQuickEdit key={livePatient.id || livePatient.name} patient={livePatient} updatePatient={updatePatient} />

        <section className="np-dashboard-metrics mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title={t("dashboard.activePatients")}
            value={dashboardPatients.length}
            note={t("dashboard.clinicalQueue")}
            icon={Users}
            tone="secondary"
            trend="up"
            onClick={() => onNavigate?.("patients")}
          />
          <MetricCard
            title={t("dashboard.lowFerritinCases")}
            value={lowFerritinCount}
            note={t("dashboard.needsReview")}
            icon={DropletIcon}
            tone="brand"
            trend="up"
            onClick={() => onNavigate?.("patients")}
          />
          <MetricCard
            title={t("dashboard.vitaminDDeficiency")}
            value={vitaminDDeficiencyCount}
            note={t("dashboard.micronutrientRisk")}
            icon={Sun}
            tone="accent"
            trend="up"
            onClick={() => onNavigate?.("patients")}
          />
          <MetricCard
            title={t("dashboard.nutritionRiskMust")}
            value={highRiskCount}
            note={t("dashboard.highPriority")}
            icon={ClipboardList}
            tone="info"
            trend="steady"
            onClick={() => onNavigate?.("patients")}
          />
          <MetricCard
            title={t("dashboard.criticalAlerts")}
            value={labReviewCount}
            note={t("dashboard.requiresAttention")}
            icon={AlertTriangle}
            tone="danger"
            trend="up"
            onClick={() => onNavigate?.("patients")}
          />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_340px] xl:items-stretch">
          <SchedulePanel
            isRtl={isRtl}
            onNavigate={onNavigate}
            openClinicalHub={openClinicalHub}
            patients={filteredPatients}
            schedule={schedule}
            selectedPatient={livePatient}
            setSelectedPatient={(patient) => {
              setActivePatient(patient);
            }}
            updateAppointment={updateAppointment}
          />
          <NutriMapPanel
            activeOrgan={activeOrgan}
            openNutriMap={openNutriMap}
            onNavigate={onNavigate}
            patient={livePatient}
            patientWorkflow={workflow}
            setActiveOrgan={setActiveOrgan}
            updatePatient={updatePatient}
          />
          <AIInsightsPanel intelligence={intelligence} onNavigate={onNavigate} openClinicalHub={openClinicalHub} patient={livePatient} />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr] 2xl:grid-cols-[1.05fr_0.95fr_0.95fr_0.95fr]">
          <LaboratorySummary onOpenLaboratory={() => openClinicalHub(livePatient, "laboratory")} patient={livePatient} />
          <ResearchActivity openResearch={openResearch} />
          <QuickActions
            activePatient={livePatient}
            onNavigate={onNavigate}
            patients={dashboardPatients}
            openClinicalHub={openClinicalHub}
            setSelectedPatient={(patient) => {
              setActivePatient(patient);
            }}
          />
          <RecentDocuments onNavigate={onNavigate} patient={livePatient} patients={dashboardPatients} reports={reports} />
        </section>
      </main>
    </div>
  );
}

function TopBar({ globalSearchProps }) {
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
          placeholder={t("search.placeholder.dashboard")}
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          className="hidden h-11 items-center gap-2 rounded-[var(--np-radius-lg)] border border-[var(--np-color-border-soft)] bg-white/70 px-4 text-sm font-extrabold text-[var(--np-color-brand)] transition hover:border-[var(--np-color-brand)] hover:bg-white lg:flex"
          type="button"
        >
          <CalendarDays className="h-4 w-4" />
          {t("dashboard.todaysAppointments")}
          <span className="np-badge np-badge-brand">18</span>
        </button>
        <IconButton badge="7" icon={Bell} />
        <IconButton icon={HelpCircle} />
        <div className="h-9 w-px bg-[var(--np-color-border-soft)]" />
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--np-color-brand-soft)] text-sm font-extrabold text-[var(--np-color-brand)]">
            S
          </span>
          <div className="hidden sm:block">
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{t("profile.name")}</p>
            <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{t("profile.role")}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function WelcomeBand({ highRiskCount, intelligence, labReviewCount, selectedPatient }) {
  const { t } = useTranslation();

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.95fr)]">
      <div className="rounded-[28px] bg-[var(--np-color-surface-page)] px-2 py-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--np-color-brand)]">
          {t("app.tagline")}
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-[var(--np-color-text)]">
          {t("dashboard.goodMorning")}
        </h1>
        <p className="mt-2 text-base font-bold text-[var(--np-color-text-muted)]">
          {t("dashboard.todayOverviewSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-[24px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-card)] md:grid-cols-3">
        <ContextItem icon={CalendarDays} label={t("dashboard.date")} value={t("dashboard.dashboardDate")} />
        <ContextItem icon={Stethoscope} label={t("dashboard.hospital")} value={t("dashboard.hospitalName")} />
        <ContextItem icon={Users} label={t("dashboard.department")} value={t("dashboard.clinicalNutrition")} />
        <div className="md:col-span-3">
          <p className="text-xs font-bold text-[var(--np-color-text-muted)]">
            {t("dashboard.focusLine", {
              highRiskCount,
              labReviewCount,
              focus: displayText(intelligence?.smartSummary?.nextRecommendedStep || selectedPatient.diagnosis),
            })}
          </p>
        </div>
      </div>
    </section>
  );
}

function SmartDashboardSignals({ intelligence, openClinicalHub, patient, workflow }) {
  const { t } = useTranslation();
  if (!intelligence) return null;

  const abnormalExamples = getAbnormalLabExamples(patient).slice(0, 2);
  const missingSteps = workflow?.missing || [];
  const followUpText = describeFollowUp(patient);
  const activePlan = patient?.dietPlans?.find?.((plan) => plan.status === "Active");
  const reportStep = workflow?.steps?.find((step) => step.id === "reports");
  const nextStep = workflow?.nextStep || { id: "summary", label: intelligence.dashboard.nextStep };
  const signals = [
    {
      detail: `${workflow?.percent ?? intelligence.dashboard.workflowPercent}% ${t("dashboard.workflowComplete", { defaultValue: "workflow complete" })}`,
      label: t("dashboard.workflowCompletion", { defaultValue: "Workflow completion" }),
      module: "summary",
      value: `${workflow?.percent ?? intelligence.nutritionStatusScore.score}%`,
    },
    {
      detail: abnormalExamples.length ? abnormalExamples.map((lab) => lab.label).join(", ") : t("dashboard.noAlerts", { defaultValue: "No alerts" }),
      label: t("dashboard.abnormalLabs", { defaultValue: "Abnormal labs" }),
      module: "laboratory",
      value: abnormalExamples.length ? `${abnormalExamples.length} ${t("dashboard.valuesNeedReview", { defaultValue: "values need review" })}` : t("dashboard.noneRecorded", { defaultValue: "None recorded" }),
    },
    {
      detail: missingSteps.slice(0, 2).map((step) => step.label).join(", ") || t("dashboard.ready", { defaultValue: "Ready" }),
      label: t("dashboard.missingDocumentation", { defaultValue: "Missing documentation" }),
      module: missingSteps[0]?.tabId || missingSteps[0]?.id || "summary",
      value: `${missingSteps.length} ${t("dashboard.items", { defaultValue: "item(s)" })}`,
    },
    {
      detail: followUpText,
      label: t("dashboard.followUpStatus", { defaultValue: "Follow-up status" }),
      module: "monitoring",
      value: patient?.nextFollowUpDate || t("dashboard.notRecorded"),
    },
    {
      detail: activePlan?.title || patient?.dietPlanStatusNote || t("dashboard.noActiveDietPlan", { defaultValue: "No active diet plan" }),
      label: t("dashboard.dietPlanStatus", { defaultValue: "Diet plan status" }),
      module: "intervention",
      value: activePlan?.status || t("dashboard.notRecorded"),
    },
    {
      detail: reportStep?.status || t("dashboard.notRecorded"),
      label: t("dashboard.reportReadiness", { defaultValue: "Report readiness" }),
      module: "reports",
      value: reportStep?.status || t("dashboard.notRecorded"),
    },
    {
      detail: t("dashboard.patientJourney", { defaultValue: "Patient journey" }),
      label: t("dashboard.nextRequiredAction", { defaultValue: "Next required action" }),
      module: nextStep.tabId || nextStep.id || "summary",
      value: nextStep.label || intelligence.dashboard.nextStep,
    },
    {
      detail: `${intelligence.riskEngine.triggers.length} ${t("dashboard.triggerCount", { defaultValue: "trigger(s)" })}`,
      label: t("dashboard.riskLevel", { defaultValue: "Risk level" }),
      module: "summary",
      value: patient?.riskLevel || intelligence.riskEngine.level,
    },
  ];

  return (
    <section className="mt-6 rounded-[24px] border border-[var(--np-color-border-soft)] bg-white/80 p-4 shadow-[var(--np-shadow-sm)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--np-color-brand)]">
            {t("dashboard.dynamicClinicalSignals", { defaultValue: "Dynamic clinical signals" })}
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--np-color-text)]">
            {intelligence.smartSummary.headline}
          </h2>
        </div>
        <button className="np-button np-button-secondary min-h-10 px-4 text-xs" onClick={() => openClinicalHub(patient, nextStep.tabId || nextStep.id || "summary")} type="button">
          {t("dashboard.openDecisionWorkflow", { defaultValue: "Open decision workflow" })}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {signals.map((signal) => (
          <button className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3 text-left transition hover:border-[var(--np-color-brand)] hover:bg-white" key={signal.label} onClick={() => openClinicalHub(patient, signal.module)} type="button">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{signal.label}</p>
            <p className="mt-2 line-clamp-1 text-lg font-extrabold text-[var(--np-color-text)]" dir="auto">{signal.value}</p>
            <p className="mt-1 line-clamp-2 text-xs font-bold text-[var(--np-color-text-muted)]" dir="auto">{signal.detail}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function DashboardQuickEdit({ patient, updatePatient }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [draft, setDraft] = useState(() => buildDashboardDraft(patient));
  const [lastSavedAt, setLastSavedAt] = useState("");

  useEffect(() => {
    if (!isEditing || !updatePatient) return undefined;
    if (!hasDashboardDraftChanged(patient, draft)) return undefined;
    if (!isValidDashboardDraft(draft)) return undefined;
    const timer = setTimeout(() => {
      setSaveStatus("saving");
      updatePatient({ ...patient, ...draft });
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setSaveStatus("saved");
    }, 1700);

    return () => clearTimeout(timer);
  }, [draft, isEditing, patient, updatePatient]);

  function updateDraftField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveStatus(isValidDashboardDraft({ ...draft, [field]: value }) ? "unsaved" : "failed");
  }

  function saveDraft() {
    if (!updatePatient || !isValidDashboardDraft(draft)) {
      setSaveStatus("failed");
      return;
    }
    setSaveStatus("saving");
    updatePatient({ ...patient, ...draft });
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setSaveStatus("saved");
    setIsEditing(false);
  }

  function cancelDraft() {
    setDraft(buildDashboardDraft(patient));
    setSaveStatus("saved");
    setIsEditing(false);
  }

  return (
    <section className="mt-4 rounded-[22px] border border-[var(--np-color-border-soft)] bg-white/70 p-4 shadow-[var(--np-shadow-sm)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
            {t("dashboard.quickEdit", { defaultValue: "Quick Edit" })}
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
            {t("dashboard.quickEditSubtitle", { defaultValue: "Safe dashboard fields only. Labs and care plans open in their full modules." })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-extrabold text-[var(--np-color-text-muted)]">{quickEditStatusLabel(saveStatus, lastSavedAt, t)}</span>
          {!isEditing ? (
            <button className="np-button np-button-secondary min-h-10 px-4 text-xs" onClick={() => setIsEditing(true)} type="button">{t("common.edit", { defaultValue: "Edit" })}</button>
          ) : (
            <>
              <button className="np-button np-button-primary min-h-10 px-4 text-xs" onClick={saveDraft} type="button">{t("common.save", { defaultValue: "Save" })}</button>
              <button className="np-button np-button-ghost min-h-10 px-4 text-xs" onClick={cancelDraft} type="button">{t("common.cancel", { defaultValue: "Cancel" })}</button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-xs font-extrabold text-[var(--np-color-text-muted)]">
            {t("dashboard.nextFollowUp", { defaultValue: "Next follow-up" })}
            <input className="np-input min-h-11 w-full" onChange={(event) => updateDraftField("nextFollowUpDate", event.target.value)} type="date" value={draft.nextFollowUpDate || ""} />
          </label>
          <label className="space-y-1 text-xs font-extrabold text-[var(--np-color-text-muted)]">
            {t("dashboard.patientRisk", { defaultValue: "Patient risk" })}
            <select className="np-input min-h-11 w-full" onChange={(event) => {
              updateDraftField("riskLevel", event.target.value);
              setDraft((current) => ({ ...current, risk: event.target.value }));
            }} value={draft.riskLevel || "Low"}>
              {["Low", "Moderate", "High"].map((risk) => <option key={risk} value={risk}>{t(`dashboard.riskOptions.${risk}`, { defaultValue: risk })}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-extrabold text-[var(--np-color-text-muted)] md:col-span-2">
            {t("dashboard.workflowNote", { defaultValue: "Workflow note" })}
            <input className="np-input min-h-11 w-full" dir="auto" onChange={(event) => updateDraftField("currentWorkflowNote", event.target.value)} value={draft.currentWorkflowNote || ""} />
          </label>
          <label className="space-y-1 text-xs font-extrabold text-[var(--np-color-text-muted)] md:col-span-2">
            {t("dashboard.dashboardClinicalNote", { defaultValue: "Dashboard clinical note" })}
            <textarea className="np-input min-h-20 w-full resize-none" dir="auto" onChange={(event) => updateDraftField("dashboardClinicalNote", event.target.value)} value={draft.dashboardClinicalNote || ""} />
          </label>
          <label className="space-y-1 text-xs font-extrabold text-[var(--np-color-text-muted)]">
            {t("dashboard.followUpReminder", { defaultValue: "Follow-up reminder" })}
            <input className="np-input min-h-11 w-full" dir="auto" onChange={(event) => updateDraftField("followUpReminder", event.target.value)} value={draft.followUpReminder || ""} />
          </label>
          <label className="space-y-1 text-xs font-extrabold text-[var(--np-color-text-muted)]">
            {t("dashboard.dietPlanStatusNote", { defaultValue: "Diet plan note" })}
            <input className="np-input min-h-11 w-full" dir="auto" onChange={(event) => updateDraftField("dietPlanStatusNote", event.target.value)} value={draft.dietPlanStatusNote || ""} />
          </label>
        </div>
      ) : null}
    </section>
  );
}

function MetricCard({ title, value, note, icon: Icon, onClick, tone, trend }) {
  const { t } = useTranslation();

  return (
    <button className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-white p-5 text-left shadow-[var(--np-shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-elevated)]" onClick={onClick} type="button">
      <div className="flex items-start justify-between gap-4">
        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${metricToneClass(tone)}`}>
          <Icon className="h-6 w-6" />
        </span>
        <span className="text-lg font-extrabold text-[var(--np-color-text)]">...</span>
      </div>
      <p className="mt-4 text-sm font-bold text-[var(--np-color-text)]">{title}</p>
      <div className="mt-2 flex items-end gap-3">
        <h2 className="text-3xl font-extrabold text-[var(--np-color-text)]">{value}</h2>
        <span className="mb-1 text-xs font-extrabold text-emerald-700">
          {trend === "steady" ? t("dashboard.stable") : t("dashboard.upToday")}
        </span>
      </div>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{note}</p>
      <Sparkline tone={tone} />
    </button>
  );
}

function SchedulePanel({ isRtl, onNavigate, openClinicalHub, patients, schedule = [], selectedPatient, setSelectedPatient, updateAppointment }) {
  const { t } = useTranslation();
  const [editingAppointmentId, setEditingAppointmentId] = useState("");
  const [appointmentDraft, setAppointmentDraft] = useState({});
  const appointments = schedule.map((appointment) => ({
    ...appointment,
    patient: patients.find((patient) => patient.name === appointment.patientName || patient.fullName === appointment.patientName) || selectedPatient,
  }));

  function startAppointmentEdit(appointment) {
    setEditingAppointmentId(appointment.id);
    setAppointmentDraft({
      followUpType: appointment.followUpType || appointment.type || "",
      status: appointment.status || "Scheduled",
      time: appointment.time || "",
      type: appointment.type || "",
    });
  }

  function saveAppointmentEdit(appointment) {
    updateAppointment?.(appointment.id, appointmentDraft);
    setEditingAppointmentId("");
    setAppointmentDraft({});
  }

  return (
    <Panel action={t("dashboard.viewAll")} className="h-full" icon={CalendarDays} onAction={() => onNavigate?.("appointments")} title={t("dashboard.todaysSchedule")}>
      <div className="space-y-3">
        {appointments.map((appointment) => {
          const patient = appointment.patient;
          return (
            <div
              className={`rounded-[16px] bg-white transition hover:bg-[var(--np-color-surface-muted)] ${isRtl ? "border-r-2 text-right" : "border-l-2"} ${
                selectedPatient.name === patient.name
                  ? `${isRtl ? "border-r-[var(--np-color-brand)]" : "border-l-[var(--np-color-brand)]"} shadow-[var(--np-shadow-sm)]`
                  : isRtl ? "border-r-[var(--np-color-secondary)]" : "border-l-[var(--np-color-secondary)]"
              }`}
              key={appointment.id}
            >
              <button
                onClick={() => {
                  setSelectedPatient(patient);
                  openClinicalHub(patient);
                }}
                className="grid w-full grid-cols-[56px_40px_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-2.5 text-left max-sm:grid-cols-[44px_38px_minmax(0,1fr)] max-sm:items-start"
                title={`${appointment.status || "Scheduled"} - ${patient.age || "Age not recorded"} - ${patient.gender || "Gender not recorded"}`}
                type="button"
              >
                <div>
                  <p className="text-sm font-extrabold text-[var(--np-color-text)]" dir="ltr">{appointment.time || "Not set"}</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--np-color-secondary-soft)] text-xs font-extrabold text-[var(--np-color-text)]">
                  {patient.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{patient.name}</p>
                  <p className="line-clamp-1 text-xs font-bold text-[var(--np-color-text-muted)]" dir="auto">
                    {appointment.type || appointment.status || "Scheduled"}
                  </p>
                </div>
                <span className={`${tagClass(patient.risk)} max-sm:hidden`}>{patient.risk || "Workflow"}</span>
                <span className="text-lg font-extrabold text-[var(--np-color-text-muted)] max-sm:hidden">{isRtl ? "‹" : "›"}</span>
              </button>
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-2">
                <button className="text-xs font-extrabold text-[var(--np-color-brand)]" onClick={() => startAppointmentEdit(appointment)} type="button">
                  {t("dashboard.quickEdit", { defaultValue: "Quick Edit" })}
                </button>
                <button className="text-xs font-extrabold text-[var(--np-color-text-muted)] hover:text-[var(--np-color-brand)]" onClick={() => onNavigate?.("appointments")} type="button">
                  {t("navigation.scheduleCenter", { defaultValue: "Schedule Center" })}
                </button>
              </div>
              {editingAppointmentId === appointment.id ? (
                <div className="grid grid-cols-1 gap-2 border-t border-[var(--np-color-border-soft)] px-3 py-3 md:grid-cols-2">
                  <input className="np-input min-h-11" onChange={(event) => setAppointmentDraft((current) => ({ ...current, time: event.target.value }))} type="time" value={appointmentDraft.time || ""} />
                  <input className="np-input min-h-11" dir="auto" onChange={(event) => setAppointmentDraft((current) => ({ ...current, type: event.target.value }))} placeholder={t("dashboard.appointmentPurpose", { defaultValue: "Purpose" })} value={appointmentDraft.type || ""} />
                  <select className="np-input min-h-11" onChange={(event) => setAppointmentDraft((current) => ({ ...current, status: event.target.value }))} value={appointmentDraft.status || "Scheduled"}>
                    {["Scheduled", "Completed", "Missed", "Cancelled", "Needs Review"].map((status) => <option key={status} value={status}>{t(`dashboard.appointmentStatus.${status}`, { defaultValue: status })}</option>)}
                  </select>
                  <input className="np-input min-h-11" dir="auto" onChange={(event) => setAppointmentDraft((current) => ({ ...current, followUpType: event.target.value }))} placeholder={t("dashboard.followUpType", { defaultValue: "Follow-up type" })} value={appointmentDraft.followUpType || ""} />
                  <div className="flex gap-2 md:col-span-2">
                    <button className="np-button np-button-primary min-h-10 px-3 text-xs" onClick={() => saveAppointmentEdit(appointment)} type="button">{t("common.save", { defaultValue: "Save" })}</button>
                    <button className="np-button np-button-ghost min-h-10 px-3 text-xs" onClick={() => setEditingAppointmentId("")} type="button">{t("common.cancel", { defaultValue: "Cancel" })}</button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {appointments.length === 0 && (
        <p className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
          {t("dashboard.noAppointments")}
        </p>
      )}

      <button className="np-button np-button-secondary mx-auto mt-5 w-full max-w-[220px]" onClick={() => onNavigate?.("appointments")} type="button">
        <Plus className="h-4 w-4" />
        {t("dashboard.newAppointment")}
      </button>
    </Panel>
  );
}

function NutriMapPanel({ activeOrgan, openNutriMap, patient, patientWorkflow, setActiveOrgan, updatePatient }) {
  const { language, t } = useTranslation();
  const selectedSystem = DASHBOARD_ORGAN_SYSTEMS.find((system) => system.id === activeOrgan) || DASHBOARD_ORGAN_SYSTEMS[0];
  const indicators = buildNutriMapPreviewIndicators(selectedSystem, patient, patientWorkflow, t);
  const selectedStatus = resolveOrganStatus(selectedSystem.id, patient, patientWorkflow);
  const currentNote = patient?.organClinicalNotes?.[selectedSystem.id] || "";

  return (
    <Panel action={t("dashboard.openNutriMap")} icon={Activity} onAction={() => openNutriMap(selectedSystem.workspaceId)} title={<>{t("dashboard.nutrimapPreviewPrefix")} <bdi dir="ltr">NutriMap™</bdi></>}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
        <DashboardBodyMap activeOrgan={activeOrgan} patient={patient} patientWorkflow={patientWorkflow} setActiveOrgan={setActiveOrgan} />

        <div className="space-y-3">
          <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-sm)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
              {t("dashboard.selectedOrgan")}
            </p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--np-color-text)]" dir="auto">{language === "ar" ? selectedSystem.nameAr : selectedSystem.nameEn}</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
                  {t("dashboard.clinicalVisualizationReview")}
                </p>
              </div>
              <span className={nutriMapPreviewStatusClass(selectedStatus)}>{t(`dashboard.markerStatus.${selectedStatus}`, { defaultValue: selectedStatus })}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {indicators.map((indicator) => (
              <div className="flex items-start justify-between gap-3 rounded-[14px] border border-[var(--np-color-border-soft)] bg-white p-2.5" key={indicator.label}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">
                  {indicator.label}
                </p>
                <p className="text-right text-xs font-extrabold leading-5 text-[var(--np-color-text)]" dir="auto">
                  {indicator.value}
                </p>
              </div>
            ))}
          </div>

          <OrganClinicalNote
            currentNote={currentNote}
            key={`${patient?.id || patient?.name}-${selectedSystem.id}`}
            patient={patient}
            selectedSystem={selectedSystem}
            updatePatient={updatePatient}
          />

          <button className="np-button np-button-secondary w-full" onClick={() => openNutriMap(selectedSystem.workspaceId)} type="button">
            {t("dashboard.openNutriMap")}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function DashboardBodyMap({ activeOrgan, patient, patientWorkflow, setActiveOrgan }) {
  const { language, t } = useTranslation();
  return (
    <div className="relative min-h-[414px] overflow-hidden rounded-[26px] border border-[var(--np-color-border-soft)] bg-[radial-gradient(circle_at_center,var(--np-color-secondary-soft),var(--np-color-surface-muted)_58%,white)] p-4 max-sm:min-h-[390px]">
      <div className="absolute left-1/2 top-1/2 h-[362px] w-[205px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(95_168_163_/_0.22)]" />
      <svg className="absolute left-1/2 top-1/2 h-[368px] w-[196px] -translate-x-1/2 -translate-y-1/2" viewBox="0 0 220 420" aria-label="Clinical body preview" role="img">
        <circle cx="110" cy="45" r="34" fill="none" stroke="var(--np-color-brand)" strokeOpacity="0.22" strokeWidth="6" />
        <path d="M76 98 C88 78 132 78 144 98 C164 140 160 212 140 258 C130 282 90 282 80 258 C60 212 56 140 76 98Z" fill="var(--np-color-brand)" opacity="0.12" stroke="var(--np-color-brand)" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M78 118 C38 162 40 226 58 288" stroke="var(--np-color-brand)" strokeWidth="16" strokeLinecap="round" opacity="0.16" />
        <path d="M142 118 C182 162 180 226 162 288" stroke="var(--np-color-brand)" strokeWidth="16" strokeLinecap="round" opacity="0.16" />
        <path d="M92 262 C80 318 72 366 68 405" stroke="var(--np-color-brand)" strokeWidth="18" strokeLinecap="round" opacity="0.16" />
        <path d="M128 262 C140 318 148 366 152 405" stroke="var(--np-color-brand)" strokeWidth="18" strokeLinecap="round" opacity="0.16" />
      </svg>
      {DASHBOARD_ORGAN_SYSTEMS.map((system) => {
        const status = resolveOrganStatus(system.id, patient, patientWorkflow);
        const isActive = activeOrgan === system.id;
        const dataCount = system.fields.filter((field) => isRecordedValue(fieldRawValue(patient, field))).length;
        const labCount = system.labs.filter((lab) => isRecordedValue(patient?.labs?.[lab])).length;
        const organName = language === "ar" ? system.nameAr : system.nameEn;
        return (
          <button
            aria-label={`${t("dashboard.selectOrgan", { defaultValue: "Select organ" })}: ${system.nameEn}`}
            aria-pressed={isActive}
            className={`absolute z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-sm font-extrabold shadow-[var(--np-shadow-sm)] transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[rgb(122_31_43_/_0.16)] ${markerStatusClass(status)} ${isActive ? "scale-110 ring-4 ring-[rgb(122_31_43_/_0.22)]" : "opacity-70 hover:opacity-100"}`}
            key={system.id}
            onClick={() => setActiveOrgan(system.id)}
            style={{ left: system.position.x, top: system.position.y }}
            title={`${organName} | ${t(`dashboard.markerStatus.${status}`, { defaultValue: status })} | ${dataCount} ${t("dashboard.dataItems", { defaultValue: "data item(s)" })} | ${labCount} ${t("dashboard.labValues", { defaultValue: "lab value(s)" })}`}
            type="button"
          >
            <system.icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}

function buildNutriMapPreviewIndicators(system, patient, patientWorkflow, t) {
  const mapping = system;
  const stepStatus = (stepId, fallback) =>
    patientWorkflow?.steps?.find((step) => step.id === stepId)?.status || fallback;
  const dataItems = mapping.fields.map((item) => ({ label: fieldLabel(item, t), value: formatOrganValue(fieldRawValue(patient, item), t) })).slice(0, 4);
  const labItems = mapping.labs.map((labKey) => ({ label: labLabel(labKey), value: formatOrganValue(patient?.labs?.[labKey], t) })).slice(0, 3);

  return [
    ...dataItems,
    ...labItems,
    { label: t("dashboard.assessment"), value: translateDashboardStatus(stepStatus(mapping.workflowStep || "assessment", "Missing"), t) },
    { label: t("dashboard.aiReview"), value: translateDashboardStatus(stepStatus("ai", "Missing"), t) },
    { label: t("dashboard.reportReadiness"), value: translateDashboardStatus(stepStatus("reports", "Missing"), t) },
  ];
}

function nutriMapPreviewStatusClass(status) {
  if (status === "Red") return "np-badge np-badge-danger";
  if (status === "Amber") return "np-badge np-badge-warning";
  if (status === "Gray") return "np-badge np-badge-secondary";
  return "np-badge np-badge-success";
}

function OrganClinicalNote({ currentNote, patient, selectedSystem, updatePatient }) {
  const { t } = useTranslation();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(currentNote);

  function saveOrganNote() {
    updatePatient?.({
      ...patient,
      organClinicalNotes: {
        ...(patient?.organClinicalNotes || {}),
        [selectedSystem.id]: noteDraft,
      },
    });
    setIsEditingNote(false);
  }

  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">
          {t("dashboard.quickClinicalNote", { defaultValue: "Quick clinical note" })}
        </p>
        <button className="text-xs font-extrabold text-[var(--np-color-brand)]" onClick={() => setIsEditingNote(true)} type="button">
          {t("common.edit", { defaultValue: "Edit" })}
        </button>
      </div>
      {isEditingNote ? (
        <div className="mt-2 space-y-2">
          <textarea className="np-input min-h-20 w-full resize-none" dir="auto" onChange={(event) => setNoteDraft(event.target.value)} value={noteDraft} />
          <div className="flex gap-2">
            <button className="np-button np-button-primary min-h-10 px-3 text-xs" onClick={saveOrganNote} type="button">{t("common.save", { defaultValue: "Save" })}</button>
            <button className="np-button np-button-ghost min-h-10 px-3 text-xs" onClick={() => { setNoteDraft(currentNote); setIsEditingNote(false); }} type="button">{t("common.cancel", { defaultValue: "Cancel" })}</button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]" dir="auto">
          {currentNote || t("dashboard.noOrganNote", { defaultValue: "No organ note recorded." })}
        </p>
      )}
    </div>
  );
}

function AIInsightsPanel({ intelligence, onNavigate, openClinicalHub, patient }) {
  const { isRtl, t } = useTranslation();
  const insights = buildDashboardAiCards(intelligence, patient);

  return (
    <Panel action={t("dashboard.seeAll")} className="h-full" icon={Brain} title={t("dashboard.aiClinicalInsights")}>
      <div className="overflow-hidden rounded-[20px] border border-[var(--np-color-border-soft)]">
        {insights.map((insight) => {
          const Icon = insight.icon;

          return (
            <button
              key={insight.title}
              onClick={() => {
                if (insight.action === "laboratory") openClinicalHub(patient, "laboratory");
                if (insight.action === "diet-plans") onNavigate?.("diet-plans");
                if (insight.action === "monitoring") openClinicalHub(patient, "monitoring");
                if (insight.action === "ai") onNavigate?.("ai");
              }}
              className="flex w-full items-center gap-4 border-b border-[var(--np-color-border-soft)] bg-white p-4 text-left last:border-b-0 hover:bg-[var(--np-color-surface-muted)]"
              type="button"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${metricToneClass(insight.tone)}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{insight.title}</span>
                <span className="mt-1 block text-xs font-bold text-[var(--np-color-text-muted)]">{insight.bullets.slice(0, 3).join(" • ")}</span>
              </span>
              <span className="text-lg text-[var(--np-color-text-muted)]">{isRtl ? "‹" : "›"}</span>
            </button>
          );
        })}
      </div>
      <button className="np-button np-button-ghost mt-5 w-full text-[var(--np-color-brand)]" onClick={() => onNavigate?.("ai")} type="button">
        <Brain className="h-4 w-4" />
        {t("dashboard.openAiAssistant")}
      </button>
    </Panel>
  );
}

function LaboratorySummary({ onOpenLaboratory, patient }) {
  const { t } = useTranslation();
  const labs = [
    labSummaryItem(patient, "ferritin", t("dashboard.labFerritin"), "ug/L"),
    labSummaryItem(patient, "vitaminD", t("dashboard.labVitaminD"), "ng/mL"),
    labSummaryItem(patient, "hemoglobin", t("dashboard.labHemoglobin"), "g/dL"),
    labSummaryItem(patient, "albumin", t("dashboard.labAlbumin"), "g/dL"),
  ];

  return (
    <Panel action={t("dashboard.viewAllLabs")} className="h-full" icon={FlaskConical} onAction={onOpenLaboratory} title={t("dashboard.laboratorySummary")}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
        {labs.map((lab, index) => (
          <button key={lab.label} className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-left" onClick={onOpenLaboratory} type="button">
              <p className="text-xs font-extrabold text-[var(--np-color-brand)]">
              {lab.label} <bdi className="text-[var(--np-color-text-muted)]" dir="ltr">({lab.unit})</bdi>
            </p>
            <h3 className="mt-4 text-2xl font-extrabold text-[var(--np-color-text)]">{lab.value || "Not recorded"}</h3>
            <p className={`mt-1 text-xs font-bold ${lab.status === "Normal" ? "text-emerald-700" : lab.value ? "text-[var(--np-color-danger)]" : "text-[var(--np-color-text-muted)]"}`}>{lab.status}</p>
            <p className="mt-1 text-[10px] font-bold text-[var(--np-color-text-muted)]">{lab.date || "Date not recorded"}</p>
            <MiniBars index={index} />
          </button>
        ))}
      </div>
    </Panel>
  );
}

function ResearchActivity({ openResearch }) {
  const { t } = useTranslation();

  return (
    <Panel action={t("dashboard.openResearch")} className="h-full" icon={Stethoscope} onAction={openResearch} title={t("dashboard.researchActivity")}>
      <h3 className="text-lg font-extrabold text-[var(--np-color-text)]" dir="ltr">IBS Study: Oral-Gut Axis</h3>
      <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">{t("dashboard.crossSectionalStudy")}</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ResearchMetric label={t("dashboard.participants")} value="73" />
        <ResearchMetric label={t("dashboard.plaqueSamples")} value="18" />
        <ResearchMetric label={t("dashboard.dietaryRecords")} value="56" />
        <ResearchMetric label={t("dashboard.labResults")} value="32" />
      </div>
      <div className="mt-5 flex items-center justify-between text-xs font-extrabold text-[var(--np-color-text-muted)]">
        <span>{t("dashboard.progress")}</span>
        <span>68%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[var(--np-color-border-soft)]">
        <div className="h-full w-[68%] rounded-full bg-[var(--np-color-brand)]" />
      </div>
    </Panel>
  );
}

function QuickActions({ activePatient, onNavigate, openClinicalHub, patients, setSelectedPatient }) {
  const { t } = useTranslation();
  const actions = [
    ["newPatient", t("dashboard.newPatient"), Users, null],
    ["nutritionAssessment", t("dashboard.nutritionAssessment"), ClipboardList, activePatient],
    ["dietPlan", t("dashboard.dietPlan"), Apple, activePatient],
    ["aiAnalysis", t("dashboard.aiAnalysis"), Brain, activePatient],
    ["dietAnalysis", t("dashboard.dietAnalysis"), Activity, activePatient],
    ["generateReport", t("dashboard.generateReport"), FileText, activePatient],
  ];

  return (
    <Panel className="h-full" icon={Plus} title={t("dashboard.quickActions")}>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(([id, label, Icon, patient]) => (
          <button
            key={id}
            onClick={() => {
              if (patient) setSelectedPatient(patient);
              if (id === "newPatient") onNavigate?.("patients");
              if (id === "nutritionAssessment") openClinicalHub(patient || patients[0], "anthropometric");
              if (id === "dietPlan") onNavigate?.("diet-plans");
              if (id === "aiAnalysis") onNavigate?.("ai");
              if (id === "dietAnalysis") openClinicalHub(patient || patients[0], "dietary");
              if (id === "generateReport") onNavigate?.("reports");
            }}
            className="flex min-h-[92px] items-center gap-3 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white/80 p-4 text-left text-sm font-extrabold text-[var(--np-color-text)] transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]"
            type="button"
          >
            <Icon className="h-5 w-5 shrink-0 text-[var(--np-color-brand)]" />
            {label}
          </button>
        ))}
      </div>
    </Panel>
  );
}

function RecentDocuments({ onNavigate, patient, reports }) {
  const { t } = useTranslation();
  const docs = reports.length ? reports.map((report) => ({
    date: report.lastGenerated || "Not generated",
    name: report.name,
    patient: patient?.name || "Active patient",
    status: report.status || "Draft",
    type: report.id || "Report",
  })) : [];

  return (
    <Panel action={t("dashboard.viewAll")} className="h-full" icon={FileText} title={t("dashboard.recentDocuments")}>
      <div className="space-y-3">
        {docs.map((doc) => (
          <button
            key={doc.name}
            onClick={() => onNavigate?.("reports")}
            className="flex min-h-[74px] items-center gap-3 rounded-[18px] bg-[var(--np-color-surface-muted)] p-4"
            type="button"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white text-[var(--np-color-brand)]">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-[var(--np-color-text)]" dir="auto">{doc.name}</p>
              <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                <span dir="auto">{doc.patient}</span> <span aria-hidden="true">•</span> {doc.type} <span aria-hidden="true">•</span> {doc.status} <span aria-hidden="true">•</span> {doc.date}
              </p>
            </div>
            <Download className="h-4 w-4 text-[var(--np-color-text-muted)]" />
          </button>
        ))}
        {!docs.length ? (
          <p className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
            No reports generated yet.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

function Panel({ title, icon: Icon, children, action, onAction, className = "" }) {
  return (
    <section className={`rounded-[24px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-card)] ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[var(--np-color-brand)]" />
          <h2 className="text-lg font-extrabold text-[var(--np-color-text)]">{renderDisplayText(title)}</h2>
        </div>
        {action ? (
          <button
            className="rounded-[10px] px-2 py-1.5 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:bg-[var(--np-color-brand-soft)] hover:text-[var(--np-color-brand)]"
            onClick={onAction}
            type="button"
          >
            {renderDisplayText(action)}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ContextItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-xs font-bold text-[var(--np-color-text-muted)]">{label}</span>
        <span className="mt-1 block text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{value}</span>
      </span>
    </div>
  );
}

function Sparkline({ tone }) {
  const stroke = {
    accent: "var(--np-color-accent)",
    brand: "var(--np-color-brand)",
    danger: "var(--np-color-danger)",
    info: "#6750d8",
    secondary: "var(--np-color-secondary)",
  }[tone] || "var(--np-color-brand)";

  return (
    <svg className="mt-5 h-10 w-full" viewBox="0 0 220 42" preserveAspectRatio="none">
      <path
        d="M2 30 C20 34 24 18 42 24 C58 30 64 12 82 19 C98 26 106 21 122 16 C140 10 151 22 166 14 C184 6 198 12 218 8"
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth="2.3"
      />
    </svg>
  );
}

function MiniBars({ index }) {
  const bars = [
    [20, 34, 24, 42, 51, 39, 62],
    [26, 22, 45, 36, 58, 51, 68],
    [18, 28, 36, 50, 44, 60, 72],
    [24, 32, 28, 46, 56, 40, 64],
  ][index];

  return (
    <div className="mt-5 flex h-12 items-end gap-1">
      {bars.map((height, barIndex) => (
        <span
          key={`${height}-${barIndex}`}
          className="w-2 rounded-t bg-[var(--np-color-brand)] opacity-80"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function buildDashboardDraft(patient) {
  return {
    currentWorkflowNote: patient?.currentWorkflowNote || "",
    dashboardClinicalNote: patient?.dashboardClinicalNote || "",
    dietPlanStatusNote: patient?.dietPlanStatusNote || "",
    followUpReminder: patient?.followUpReminder || "",
    nextFollowUpDate: patient?.nextFollowUpDate || "",
    risk: patient?.risk || patient?.riskLevel || "Low",
    riskLevel: patient?.riskLevel || patient?.risk || "Low",
  };
}

function hasDashboardDraftChanged(patient, draft) {
  const saved = buildDashboardDraft(patient);
  return Object.keys(draft).some((key) => String(draft[key] || "") !== String(saved[key] || ""));
}

function isValidDashboardDraft(draft) {
  return !draft.nextFollowUpDate || /^\d{4}-\d{2}-\d{2}$/.test(draft.nextFollowUpDate);
}

function quickEditStatusLabel(status, lastSavedAt, t) {
  if (status === "saving") return t("dashboard.saving", { defaultValue: "Saving..." });
  if (status === "unsaved") return t("dashboard.unsavedChanges", { defaultValue: "Unsaved changes" });
  if (status === "failed") return t("dashboard.saveFailed", { defaultValue: "Save failed" });
  if (lastSavedAt) return t("dashboard.savedAt", { defaultValue: `Saved just now ${lastSavedAt}`, time: lastSavedAt });
  return t("dashboard.savedJustNow", { defaultValue: "Saved just now" });
}

function getAbnormalLabExamples(patient) {
  return ["ferritin", "albumin", "hemoglobin", "vitaminD", "hba1c", "fastingGlucose"]
    .map((key) => ({
      key,
      label: labLabel(key),
      status: inferLabStatus(key, patient?.labs?.[key]),
      value: patient?.labs?.[key],
    }))
    .filter((lab) => lab.value && lab.status !== "Normal" && lab.status !== "Not recorded");
}

function describeFollowUp(patient) {
  if (!patient?.nextFollowUpDate) return "Follow-up not recorded";
  const dueDate = new Date(patient.nextFollowUpDate);
  if (Number.isNaN(dueDate.getTime())) return patient.nextFollowUpDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDate - today) / 86400000);
  if (diffDays < 0) return `Follow-up overdue by ${Math.abs(diffDays)} day(s)`;
  if (diffDays === 0) return "Follow-up due today";
  return `Follow-up in ${diffDays} day(s)`;
}

function ResearchMetric({ label, value }) {
  return (
    <div className="min-h-[82px] rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-center">
      <p className="text-2xl font-extrabold text-[var(--np-color-text)]">{value}</p>
      <p className="mt-1 text-xs font-bold leading-4 text-[var(--np-color-text-muted)]">{label}</p>
    </div>
  );
}

function IconButton({ badge, icon: Icon }) {
  return (
    <button className="relative flex h-10 w-10 items-center justify-center rounded-full text-[var(--np-color-brand)] transition hover:bg-[var(--np-color-brand-soft)]" type="button">
      <Icon className="h-5 w-5" />
      {badge ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--np-color-brand)] px-1 text-[10px] font-extrabold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function DropletIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3S6 10 6 15a6 6 0 0 0 12 0c0-5-6-12-6-12Z" />
    </svg>
  );
}

function buildPatientLabMap(patient) {
  const fromRows = Array.isArray(patient?.labValues)
    ? Object.fromEntries(patient.labValues.map((lab) => [labKey(lab.label), lab]))
    : {};

  return {
    alt: fromRows.alt?.value || patient?.alt || "",
    albumin: fromRows.albumin?.value || patient?.albumin || "",
    ast: fromRows.ast?.value || patient?.ast || "",
    bilirubin: fromRows.bilirubin?.value || patient?.bilirubin || "",
    calcium: fromRows.calcium?.value || patient?.calcium || "",
    crp: fromRows.crp?.value || patient?.crp || "",
    ferritin: fromRows.ferritin?.value || patient?.ferritin || "",
    hemoglobin: fromRows.hemoglobin?.value || fromRows.hb?.value || patient?.hemoglobin || patient?.hb || "",
    vitaminD: fromRows.vitaminD?.value || patient?.vitaminD || "",
    vitaminB12: fromRows.vitaminB12?.value || patient?.vitaminB12 || "",
    folate: fromRows.folate?.value || patient?.folate || "",
    hba1c: fromRows.hba1c?.value || patient?.hba1c || "",
    fastingGlucose: fromRows.fastingGlucose?.value || patient?.fastingGlucose || "",
    creatinine: fromRows.creatinine?.value || patient?.creatinine || "",
    egfr: fromRows.egfr?.value || patient?.egfr || "",
    magnesium: fromRows.magnesium?.value || patient?.magnesium || "",
    phosphorus: fromRows.phosphorus?.value || patient?.phosphorus || "",
    sodium: fromRows.sodium?.value || patient?.sodium || "",
    potassium: fromRows.potassium?.value || patient?.potassium || "",
    lipidProfile: fromRows.lipidProfile?.value || patient?.lipidProfile || "",
    rows: fromRows,
  };
}

function labKey(label) {
  const key = String(label || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const aliases = {
    fastingglucose: "fastingGlucose",
    vitaminb12: "vitaminB12",
    hemoglobin: "hemoglobin",
    hba1c: "hba1c",
    lipidprofile: "lipidProfile",
    vitamind: "vitaminD",
  };
  return aliases[key] || key;
}

function isLowLab(patient, key, threshold) {
  const value = Number(patient?.labs?.[key]);
  return Number.isFinite(value) && value < threshold;
}

function abnormalLabCount(patient) {
  const checks = [
    isLowLab(patient, "ferritin", 15),
    isLowLab(patient, "vitaminD", 20),
    isLowLab(patient, "hemoglobin", 12),
    isLowLab(patient, "albumin", 3.5),
    Number(patient?.labs?.hba1c) >= 5.7,
  ];
  return checks.filter(Boolean).length;
}

function labSummaryItem(patient, key, label, unit) {
  const rows = patient?.labs?.rows || {};
  const row = rows[key] || {};
  const value = patient?.labs?.[key] || row.value || "";
  const status = row.status || inferLabStatus(key, value);
  return {
    date: row.date || "",
    label,
    status,
    unit: row.unit || unit,
    value,
  };
}

function inferLabStatus(key, value) {
  if (value === "" || value === undefined || value === null) return "Not recorded";
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return "Needs Review";
  if (key === "ferritin" && numericValue < 15) return "Low";
  if (key === "vitaminD" && numericValue < 20) return "Low";
  if (key === "hemoglobin" && numericValue < 12) return "Low";
  if (key === "albumin" && numericValue < 3.5) return "Low";
  return "Normal";
}

function labLabel(key) {
  return {
    alt: "ALT",
    albumin: "Albumin",
    ast: "AST",
    bilirubin: "Bilirubin",
    calcium: "Calcium",
    creatinine: "Creatinine",
    crp: "CRP",
    egfr: "eGFR",
    fastingGlucose: "Fasting glucose",
    ferritin: "Ferritin",
    folate: "Folate",
    hemoglobin: "Hemoglobin",
    hba1c: "HbA1c",
    lipidProfile: "Lipid profile",
    magnesium: "Magnesium",
    potassium: "Potassium",
    phosphorus: "Phosphorus",
    sodium: "Sodium",
    vitaminB12: "Vitamin B12",
    vitaminD: "Vitamin D",
  }[key] || key;
}

function fieldRawValue(patient, field) {
  const activePlan = patient?.dietPlans?.find?.((plan) => plan.status === "Active");
  const values = {
    appetite: patient?.appetite || patient?.appetiteStatus || patient?.nutritionAssessment?.appetite || "Not recorded",
    bmi: patient?.bmi || "Not recorded",
    bloodPressure: patient?.bloodPressure || patient?.vitals?.bloodPressure || "Not recorded",
    cognitionNotes: patient?.cognitionNotes || patient?.medicalHistory?.cognition || "Not recorded",
    diagnosis: patient?.diagnosis || patient?.condition || "Not recorded",
    dietPlanStatus: activePlan?.status || "Not recorded",
    dietaryRecall: patient?.dietaryRecall || patient?.nutritionAssessment?.dietaryRecall || "Not recorded",
    fiber: patient?.nutrition?.fiber || activePlan?.summary?.fiber || "Not recorded",
    fluidTarget: activePlan?.targets?.fluid || patient?.fluidTarget || "Not recorded",
    giSymptoms: patient?.giSymptoms || patient?.symptoms?.gi || "Not recorded",
    hydration: patient?.fluidIntake || "Not recorded",
    ibsStatus: String(patient?.diagnosis || patient?.condition || "").toLowerCase().includes("ibs") ? "IBS recorded" : "Not recorded",
    neurologicalHistory: patient?.neurologicalHistory || patient?.medicalHistory?.neurological || "Not recorded",
    nutritionSupportStatus: patient?.nutritionSupportStatus || patient?.nutritionSupport || "Not recorded",
    oxygenSupport: patient?.oxygenSupport || patient?.respiratorySupport || "Not recorded",
    physicalActivity: patient?.physicalActivity || patient?.activityLevel || "Not recorded",
    proteinTarget: activePlan?.targets?.protein || patient?.proteinTarget || "Not recorded",
    respiratoryHistory: patient?.respiratoryHistory || patient?.medicalHistory?.respiratory || "Not recorded",
    weightLossRisk: patient?.recentWeightChange || patient?.weightChange || "Not recorded",
    weightStatus: patient?.weight ? `${patient.weight} kg` : "Not recorded",
    weightTrend: patient?.weightTrend || patient?.recentWeightChange || "Not recorded",
    nextFollowUp: patient?.nextFollowUpDate || "Not recorded",
    waistCircumference: patient?.waistCircumference || "Not recorded",
    weight: patient?.weight ? `${patient.weight} kg` : "Not recorded",
  };
  return values[field] || "Not recorded";
}

function fieldLabel(field, t) {
  const labels = {
    appetite: "Appetite",
    bmi: "BMI",
    bloodPressure: "Blood pressure",
    cognitionNotes: "Cognition notes",
    diagnosis: "Diagnosis",
    dietPlanStatus: "Diet plan",
    dietaryRecall: "Dietary recall",
    fiber: "Fiber intake",
    fluidTarget: "Fluid target",
    giSymptoms: "GI symptoms",
    hydration: "Hydration",
    ibsStatus: "IBS status",
    neurologicalHistory: "Neurological history",
    nutritionSupportStatus: "Nutrition support",
    oxygenSupport: "Oxygen/support",
    physicalActivity: "Physical activity",
    proteinTarget: "Protein target",
    respiratoryHistory: "Respiratory history",
    waistCircumference: "Waist circumference",
    weightLossRisk: "Weight loss risk",
    weightStatus: "Weight status",
    weightTrend: "Weight trend",
  };
  return t(`dashboard.fieldLabels.${field}`, { defaultValue: labels[field] || field });
}

function formatOrganValue(value, t) {
  if (!isRecordedValue(value)) return t("dashboard.notRecorded");
  return value;
}

function resolveOrganStatus(systemId, patient, workflow) {
  const mapping = DASHBOARD_ORGAN_SYSTEMS.find((system) => system.id === systemId) || DASHBOARD_ORGAN_SYSTEMS[0];
  const hasFieldData = mapping.fields.some((field) => isRecordedValue(fieldRawValue(patient, field)));
  const hasLabData = mapping.labs.some((lab) => isRecordedValue(patient?.labs?.[lab]));
  const hasAbnormal = mapping.labs.some((lab) => {
    const status = inferLabStatus(lab, patient?.labs?.[lab]);
    return status !== "Normal" && status !== "Not recorded";
  });
  const needsReview = mapping.workflowStep && workflow?.steps?.find((step) => step.id === mapping.workflowStep)?.status === "Needs Review";
  if (hasAbnormal) return "Red";
  if (needsReview) return "Amber";
  if (!hasFieldData && !hasLabData) return "Gray";
  if (mapping.fields.every((field) => isRecordedValue(fieldRawValue(patient, field))) && mapping.labs.every((lab) => isRecordedValue(patient?.labs?.[lab]))) return "Green";
  return "Amber";
}

function isRecordedValue(value) {
  return value !== undefined && value !== null && value !== "" && value !== "Not recorded";
}

function markerStatusClass(status) {
  if (status === "Red") return "border-[var(--np-color-danger)] bg-[var(--np-color-danger-bg)] text-[var(--np-color-danger)]";
  if (status === "Amber") return "border-[var(--np-color-warning)] bg-[var(--np-color-warning-bg)] text-[var(--np-color-warning)]";
  if (status === "Gray") return "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)]";
  return "border-emerald-500 bg-emerald-50 text-emerald-700";
}

const DASHBOARD_ORGAN_SYSTEMS = [
  {
    fields: ["cognitionNotes", "appetite", "neurologicalHistory"],
    icon: Brain,
    id: "brain",
    labs: ["vitaminB12", "folate", "vitaminD"],
    nameAr: "الدماغ",
    nameEn: "Brain",
    position: { x: "50%", y: "16%" },
    reportStep: "reports",
    workflowStep: "ai",
    workspaceId: "brain",
  },
  {
    fields: ["weightStatus", "bloodPressure"],
    icon: Activity,
    id: "cardiovascular",
    labs: ["lipidProfile", "sodium"],
    nameAr: "القلب والأوعية",
    nameEn: "Cardiovascular",
    position: { x: "47%", y: "36%" },
    reportStep: "reports",
    workflowStep: "assessment",
    workspaceId: "heart",
  },
  {
    fields: ["respiratoryHistory", "oxygenSupport", "weightLossRisk", "nutritionSupportStatus"],
    icon: Stethoscope,
    id: "respiratory",
    labs: ["albumin"],
    nameAr: "الجهاز التنفسي",
    nameEn: "Respiratory",
    position: { x: "59%", y: "34%" },
    reportStep: "reports",
    workflowStep: "medical",
    workspaceId: "heart",
  },
  {
    fields: ["giSymptoms", "appetite", "dietaryRecall", "fiber", "hydration", "ibsStatus"],
    icon: Apple,
    id: "gastrointestinal",
    labs: ["albumin", "ferritin"],
    nameAr: "الجهاز الهضمي",
    nameEn: "Gastrointestinal",
    position: { x: "50%", y: "52%" },
    reportStep: "reports",
    workflowStep: "dietary",
    workspaceId: "gastrointestinal",
  },
  {
    fields: ["dietPlanStatus"],
    icon: FlaskConical,
    id: "liver",
    labs: ["alt", "ast", "albumin", "bilirubin", "lipidProfile"],
    nameAr: "الكبد",
    nameEn: "Liver",
    position: { x: "58%", y: "47%" },
    reportStep: "reports",
    workflowStep: "intervention",
    workspaceId: "liver",
  },
  {
    fields: ["fluidTarget"],
    icon: DropletIcon,
    id: "kidneys",
    labs: ["creatinine", "egfr", "sodium", "potassium", "phosphorus"],
    nameAr: "الكلى",
    nameEn: "Kidneys",
    position: { x: "42%", y: "57%" },
    reportStep: "reports",
    workflowStep: "labs",
    workspaceId: "kidneys",
  },
  {
    fields: ["weightTrend", "bmi", "physicalActivity", "proteinTarget"],
    icon: Activity,
    id: "musculoskeletal",
    labs: ["vitaminD", "calcium", "albumin"],
    nameAr: "الجهاز العضلي الهيكلي",
    nameEn: "Musculoskeletal",
    position: { x: "50%", y: "72%" },
    reportStep: "reports",
    workflowStep: "assessment",
    workspaceId: "muscles",
  },
  {
    fields: ["bmi", "waistCircumference"],
    icon: Sun,
    id: "endocrine-metabolic",
    labs: ["hba1c", "fastingGlucose", "lipidProfile"],
    nameAr: "الغدد والاستقلاب",
    nameEn: "Endocrine / Metabolic",
    position: { x: "61%", y: "55%" },
    reportStep: "reports",
    workflowStep: "assessment",
    workspaceId: "pancreas",
  },
];

function buildDashboardAiCards(intelligence, patient) {
  const abnormalLabs = intelligence?.dashboard?.abnormalLabCount || abnormalLabCount(patient);
  const missing = intelligence?.smartSummary?.missingDocumentation || [];
  const nextStep = intelligence?.smartSummary?.nextRecommendedStep || "Review active patient workflow";
  return [
    {
      action: abnormalLabs ? "laboratory" : "ai",
      bullets: abnormalLabs ? [`${abnormalLabs} abnormal lab marker(s)`, "Based only on available patient data", "Clinician review required"] : ["No abnormal lab values recorded", "Review data completeness", "Clinician review required"],
      icon: abnormalLabs ? AlertTriangle : Brain,
      title: abnormalLabs ? "Laboratory review needed" : "AI review ready",
      tone: abnormalLabs ? "warning" : "info",
    },
    {
      action: "diet-plans",
      bullets: [patient?.dietPlans?.some?.((plan) => plan.status === "Active") ? "Active diet plan available" : "No active diet plan recorded", "Connect intervention to meal plan", "Clinician review required"],
      icon: Apple,
      title: "Diet plan status",
      tone: "brand",
    },
    {
      action: "monitoring",
      bullets: [nextStep, `${missing.length} missing workflow item(s)`, patient?.nextFollowUpDate ? `Next follow-up: ${patient.nextFollowUpDate}` : "Follow-up not recorded"],
      icon: Activity,
      title: "Next clinical action",
      tone: "accent",
    },
  ];
}

const EMPTY_DASHBOARD_PATIENT = {
  condition: "No active patient",
  diagnosis: "No active patient",
  labs: {},
  name: "No active patient",
  nutrition: { fiber: "Not recorded" },
  risk: "Low",
};

function displayText(value) {
  const fromCodes = (codes) => codes.map((code) => String.fromCharCode(code)).join("");
  const badBullet = fromCodes([0x00e2, 0x20ac, 0x00a2]);
  const badTrademark = fromCodes([0x00e2, 0x201e, 0x00a2]);
  const oldBullet = fromCodes([0x0623, 0x00a2, 0x00e2, 0x201a, 0x00ac, 0x0622, 0x00a2]);
  const oldTrademark = fromCodes([0x0623, 0x00a2, 0x00e2, 0x20ac, 0x200d, 0x0622, 0x00a2]);
  const bullet = fromCodes([0x2022]);
  const trademark = fromCodes([0x2122]);

  return String(value)
    .replaceAll(badBullet, bullet)
    .replaceAll(badTrademark, trademark)
    .replaceAll(oldBullet, bullet)
    .replaceAll(oldTrademark, trademark);
}

function renderDisplayText(value) {
  return typeof value === "string" ? displayText(value) : value;
}

function translateDashboardStatus(value, t) {
  return t(`dashboard.statusText.${value}`, { defaultValue: value });
}

function metricToneClass(tone) {
  if (tone === "secondary") return "bg-[var(--np-color-secondary-soft)] text-[var(--np-color-secondary)]";
  if (tone === "accent") return "bg-[var(--np-color-accent-soft)] text-[var(--np-color-accent)]";
  if (tone === "danger") return "bg-[var(--np-color-danger-bg)] text-[var(--np-color-danger)]";
  if (tone === "info") return "bg-[#f0edff] text-[#6750d8]";
  return "bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]";
}

function tagClass(risk) {
  if (risk === "High") return "np-badge np-badge-danger";
  if (risk === "Moderate") return "np-badge np-badge-warning";
  return "np-badge np-badge-secondary";
}













