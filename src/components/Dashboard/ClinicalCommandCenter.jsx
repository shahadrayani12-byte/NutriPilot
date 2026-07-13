import { useState } from "react";
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

import { commandCenterPatients as commandCenterPatients } from "../../data/patientData";
import { NutriMapStage } from "../NutriMap/NutriMapShared";
import { NUTRIMAP_SYSTEMS, getNutriMapSystem } from "../../data/nutrimapSystems";
import { GlobalSearch } from "../common/GlobalSearch";
import { useTranslation } from "../../i18n";

const scheduleTimes = ["08:00 AM", "09:00 AM", "10:30 AM"];
const scheduleEndTimes = ["09:00 AM", "10:00 AM", "11:30 AM"];
const appointmentTags = ["lowFerritin", "proteinAssessment", "growthMonitoring"];

function normalizeDashboardPatient(patient, index = 0) {
  const fallbackPatient = commandCenterPatients[index % commandCenterPatients.length] || commandCenterPatients[0];
  if (!patient) return fallbackPatient;
  if (patient.name && patient.labs) return patient;

  return {
    ...fallbackPatient,
    ...patient,
    condition: patient.diagnosis || patient.condition || fallbackPatient.condition,
    labs: patient.labs || fallbackPatient.labs,
    name: patient.fullName || patient.name || fallbackPatient.name,
    nutrition: patient.nutrition || fallbackPatient.nutrition,
    risk: patient.riskLevel?.includes("High") ? "High" : patient.riskLevel?.includes("Moderate") ? "Medium" : "Low",
  };
}

export default function ClinicalCommandCenter({ activePatient, globalSearchProps, intelligence, openClinicalHub, openNutriMap, openResearch, patients: sharedPatients = [], setActivePatient, workflow }) {
  const { isRtl, t } = useTranslation();
  const [activeOrgan, setActiveOrgan] = useState("gastrointestinal");
  const dashboardPatients = (sharedPatients.length ? sharedPatients : commandCenterPatients).map(normalizeDashboardPatient);
  const selectedPatient =
    dashboardPatients.find(
      (patient) =>
        patient.id === activePatient?.id ||
        patient.fullName === activePatient?.fullName ||
        patient.name === activePatient?.name ||
        patient.name === activePatient?.fullName,
    ) || normalizeDashboardPatient(activePatient);
  const filteredPatients = dashboardPatients;
  const highRiskCount = dashboardPatients.filter((patient) => patient.risk === "High").length;
  const lowFerritinCount = dashboardPatients.filter((patient) => Number(patient.labs.ferritin) < 15).length;
  const vitaminDDeficiencyCount = dashboardPatients.filter((patient) => Number(patient.labs.vitaminD) < 20).length;
  const labReviewCount = dashboardPatients.filter((patient) => {
    const ferritin = Number(patient.labs.ferritin);
    const hb = Number(patient.labs.hb);
    const vitaminD = Number(patient.labs.vitaminD);

    return ferritin < 15 || hb < 12 || vitaminD < 20;
  }).length;

  return (
    <div className="np-dashboard-shell min-h-screen bg-[var(--np-color-surface-page)] font-[var(--np-font-family-sans)] text-[var(--np-color-text)]">
      <TopBar globalSearchProps={globalSearchProps} />

      <main className="px-7 pb-8 pt-6">
        <WelcomeBand
          highRiskCount={highRiskCount}
          intelligence={intelligence}
          labReviewCount={labReviewCount}
          selectedPatient={selectedPatient}
        />

        <SmartDashboardSignals intelligence={intelligence} openClinicalHub={() => openClinicalHub(selectedPatient)} />

        <section className="np-dashboard-metrics mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title={t("dashboard.activePatients")}
            value={dashboardPatients.length}
            note={t("dashboard.clinicalQueue")}
            icon={Users}
            tone="secondary"
            trend="up"
          />
          <MetricCard
            title={t("dashboard.lowFerritinCases")}
            value={lowFerritinCount}
            note={t("dashboard.needsReview")}
            icon={DropletIcon}
            tone="brand"
            trend="up"
          />
          <MetricCard
            title={t("dashboard.vitaminDDeficiency")}
            value={vitaminDDeficiencyCount}
            note={t("dashboard.micronutrientRisk")}
            icon={Sun}
            tone="accent"
            trend="up"
          />
          <MetricCard
            title={t("dashboard.nutritionRiskMust")}
            value={highRiskCount}
            note={t("dashboard.highPriority")}
            icon={ClipboardList}
            tone="info"
            trend="steady"
          />
          <MetricCard
            title={t("dashboard.criticalAlerts")}
            value={labReviewCount}
            note={t("dashboard.requiresAttention")}
            icon={AlertTriangle}
            tone="danger"
            trend="up"
          />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[340px_minmax(0,1fr)_340px] xl:items-stretch">
          <SchedulePanel
            isRtl={isRtl}
            openClinicalHub={openClinicalHub}
            patients={filteredPatients}
            selectedPatient={selectedPatient}
            setSelectedPatient={(patient) => {
              setActivePatient(patient);
            }}
          />
          <NutriMapPanel
            activeOrgan={activeOrgan}
            openNutriMap={openNutriMap}
            patient={selectedPatient}
            patientWorkflow={workflow}
            setActiveOrgan={setActiveOrgan}
          />
          <AIInsightsPanel patient={selectedPatient} labReviewCount={labReviewCount} />
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr] 2xl:grid-cols-[1.05fr_0.95fr_0.95fr_0.95fr]">
          <LaboratorySummary patient={selectedPatient} />
          <ResearchActivity openResearch={openResearch} />
          <QuickActions
            patients={dashboardPatients}
            openClinicalHub={openClinicalHub}
            setSelectedPatient={(patient) => {
              setActivePatient(patient);
            }}
          />
          <RecentDocuments patient={selectedPatient} patients={dashboardPatients} />
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

function SmartDashboardSignals({ intelligence, openClinicalHub }) {
  if (!intelligence) return null;

  const signals = [
    ["Nutrition Status Score", `${intelligence.nutritionStatusScore.score}%`, intelligence.nutritionStatusScore.label],
    ["Risk Engine", intelligence.riskEngine.level, `${intelligence.riskEngine.triggers.length} trigger(s)`],
    ["Next Step", intelligence.dashboard.nextStep, "Patient journey"],
    ["Abnormal Labs", intelligence.dashboard.abnormalLabCount, "Lab interpretation"],
  ];

  return (
    <section className="mt-6 rounded-[24px] border border-[var(--np-color-border-soft)] bg-white/80 p-4 shadow-[var(--np-shadow-sm)]">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--np-color-brand)]">
            Dynamic clinical signals
          </p>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--np-color-text)]">
            {intelligence.smartSummary.headline}
          </h2>
        </div>
        <button className="np-button np-button-secondary min-h-10 px-4 text-xs" onClick={openClinicalHub} type="button">
          Open decision workflow
        </button>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {signals.map(([label, value, detail]) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={label}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
            <p className="mt-2 truncate text-lg font-extrabold text-[var(--np-color-text)]">{value}</p>
            <p className="mt-1 truncate text-xs font-bold text-[var(--np-color-text-muted)]">{detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone, trend }) {
  const { t } = useTranslation();

  return (
    <article className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-elevated)]">
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
    </article>
  );
}

function SchedulePanel({ isRtl, openClinicalHub, patients, selectedPatient, setSelectedPatient }) {
  const { t } = useTranslation();

  return (
    <Panel action={t("dashboard.viewAll")} className="h-full" icon={CalendarDays} title={t("dashboard.todaysSchedule")}>
      <div className="space-y-3">
        {patients.map((patient, index) => (
          <button
            key={patient.name}
            onClick={() => setSelectedPatient(patient)}
            className={`grid w-full grid-cols-[74px_42px_minmax(0,1fr)_auto] items-center gap-4 rounded-[18px] bg-white p-3 text-left transition hover:bg-[var(--np-color-surface-muted)] ${isRtl ? "border-r-2 text-right" : "border-l-2"} ${
              selectedPatient.name === patient.name
                ? `${isRtl ? "border-r-[var(--np-color-brand)]" : "border-l-[var(--np-color-brand)]"} shadow-[var(--np-shadow-sm)]`
                : isRtl ? "border-r-[var(--np-color-secondary)]" : "border-l-[var(--np-color-secondary)]"
            }`}
            type="button"
          >
            <div>
              <p className="text-sm font-extrabold text-[var(--np-color-text)]" dir="ltr">{scheduleTimes[index] || "01:30 PM"}</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]" dir="ltr">{scheduleEndTimes[index] || "02:30 PM"}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--np-color-secondary-soft)] text-sm font-extrabold text-[var(--np-color-text)]">
              {patient.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{patient.name}</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]">
                {t("dashboard.patientAgeGender", { age: patient.age, gender: patient.gender })}
              </p>
            </div>
            <span className={tagClass(patient.risk)}>{t(`dashboard.tags.${appointmentTags[index] || patient.risk}`, { risk: patient.risk })}</span>
          </button>
        ))}
      </div>

      <button
        className="np-button np-button-primary mt-4 w-full"
        onClick={() => openClinicalHub(selectedPatient)}
        type="button"
      >
        {t("dashboard.openClinicalHub")}
      </button>

      {patients.length === 0 && (
        <p className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
          {t("dashboard.noPatientsFound")}
        </p>
      )}

      <button className="np-button np-button-secondary mx-auto mt-5 w-full max-w-[220px]" type="button">
        <Plus className="h-4 w-4" />
        {t("dashboard.newAppointment")}
      </button>
    </Panel>
  );
}

function NutriMapPanel({ activeOrgan, openNutriMap, patientWorkflow, setActiveOrgan }) {
  const { t } = useTranslation();
  const selectedSystem = getNutriMapSystem(activeOrgan);
  const indicators = buildNutriMapPreviewIndicators(selectedSystem, patientWorkflow, t);

  return (
    <Panel action={t("dashboard.openNutriMap")} icon={Activity} onAction={openNutriMap} title={<>{t("dashboard.nutrimapPreviewPrefix")} <bdi dir="ltr">NutriMap™</bdi></>}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div className="overflow-hidden rounded-[26px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)]">
          <NutriMapStage
            activeSystemId={selectedSystem.id}
            onSelectSystem={setActiveOrgan}
            size="preview"
            systems={NUTRIMAP_SYSTEMS}
          />
        </div>

        <div className="space-y-3">
          <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-sm)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
              {t("dashboard.selectedOrgan")}
            </p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--np-color-text)]" dir="auto">{translateOrganLabel(selectedSystem, t)}</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
                  {t("dashboard.nutrimapCompactPreview")}
                </p>
              </div>
              <span className={nutriMapPreviewStatusClass(selectedSystem.status)}>{t(`dashboard.status.${selectedSystem.status}`)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {indicators.map((indicator) => (
              <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3" key={indicator.label}>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">
                  {indicator.label}
                </p>
                <p className="mt-1 text-xs font-extrabold leading-5 text-[var(--np-color-text)]">
                  {indicator.value}
                </p>
              </div>
            ))}
          </div>

          <button className="np-button np-button-secondary w-full" onClick={openNutriMap} type="button">
            {t("dashboard.openNutriMap")}
          </button>
        </div>
      </div>
    </Panel>
  );
}

function buildNutriMapPreviewIndicators(system, patientWorkflow, t) {
  const summary = system.statusSummary;
  const stepStatus = (stepId, fallback) =>
    patientWorkflow?.steps?.find((step) => step.id === stepId)?.status || fallback;

  return [
    { label: t("dashboard.relatedLabs"), value: translatePlaceholderList(summary.relatedLabs.slice(0, 2), t) || t("dashboard.placeholderLabs") },
    { label: t("dashboard.assessment"), value: translateDashboardStatus(stepStatus("assessment", t("dashboard.placeholder")), t) },
    { label: t("dashboard.aiReview"), value: translateDashboardStatus(stepStatus("ai", summary.aiReviewStatus), t) },
    { label: t("dashboard.reportReadiness"), value: translateDashboardStatus(stepStatus("reports", summary.reportReadiness), t) },
  ];
}

function nutriMapPreviewStatusClass(status) {
  if (status === "Red") return "np-badge np-badge-danger";
  if (status === "Orange") return "np-badge np-badge-warning";
  if (status === "Yellow") return "np-badge np-badge-accent";
  return "np-badge np-badge-success";
}
function AIInsightsPanel({ patient, labReviewCount }) {
  const { isRtl, t } = useTranslation();
  const insights = [
    {
      icon: DropletIcon,
      title: t("dashboard.aiFerritinReview", { count: labReviewCount }),
      detail: t("dashboard.basedOnLatestLabs"),
      tone: "brand",
    },
    {
      icon: AlertTriangle,
      title: t("dashboard.aiHighNutritionRisk", { count: patient.risk === "High" ? 2 : 1 }),
      detail: t("dashboard.recommendMustScreening"),
      tone: "warning",
    },
    {
      icon: Activity,
      title: t("dashboard.aiPoorDietaryAdherence", { count: patient.nutrition.fiber === "Low" ? 1 : 0 }),
      detail: t("dashboard.aiSuggestedIntervention"),
      tone: "info",
    },
    {
      icon: Sun,
      title: t("dashboard.aiVitaminDTrend"),
      detail: t("dashboard.considerGroupEducation"),
      tone: "accent",
    },
  ];

  return (
    <Panel action={t("dashboard.seeAll")} className="h-full" icon={Brain} title={t("dashboard.aiClinicalInsights")}>
      <div className="overflow-hidden rounded-[20px] border border-[var(--np-color-border-soft)]">
        {insights.map((insight) => {
          const Icon = insight.icon;

          return (
            <button
              key={insight.title}
              className="flex w-full items-center gap-4 border-b border-[var(--np-color-border-soft)] bg-white p-4 text-left last:border-b-0 hover:bg-[var(--np-color-surface-muted)]"
              type="button"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${metricToneClass(insight.tone)}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-[var(--np-color-text)]" dir="auto">{insight.title}</span>
                <span className="mt-1 block text-xs font-bold text-[var(--np-color-text-muted)]">{insight.detail}</span>
              </span>
              <span className="text-lg text-[var(--np-color-text-muted)]">{isRtl ? "‹" : "›"}</span>
            </button>
          );
        })}
      </div>
      <button className="np-button np-button-ghost mt-5 w-full text-[var(--np-color-brand)]" type="button">
        <Brain className="h-4 w-4" />
        {t("dashboard.openAiAssistant")}
      </button>
    </Panel>
  );
}

function LaboratorySummary({ patient }) {
  const { t } = useTranslation();
  const labs = [
    [t("dashboard.labFerritin"), patient.labs.ferritin, "ug/L"],
    [t("dashboard.labVitaminD"), patient.labs.vitaminD, "ng/L"],
    [t("dashboard.labHemoglobin"), patient.labs.hb, "g/dL"],
    [t("dashboard.labAlbumin"), patient.labs.albumin, "g/dL"],
  ];

  return (
    <Panel action={t("dashboard.viewAllLabs")} className="h-full" icon={FlaskConical} title={t("dashboard.laboratorySummary")}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
        {labs.map(([label, value, unit], index) => (
          <div key={label} className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4">
              <p className="text-xs font-extrabold text-[var(--np-color-brand)]">
              {label} <bdi className="text-[var(--np-color-text-muted)]" dir="ltr">({unit})</bdi>
            </p>
            <h3 className="mt-4 text-3xl font-extrabold text-[var(--np-color-text)]">{value}</h3>
            <p className="mt-1 text-xs font-bold text-emerald-700">{t("dashboard.upToday")}</p>
            <MiniBars index={index} />
          </div>
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

function QuickActions({ openClinicalHub, patients, setSelectedPatient }) {
  const { t } = useTranslation();
  const actions = [
    ["newPatient", t("dashboard.newPatient"), Users, patients[0]],
    ["nutritionAssessment", t("dashboard.nutritionAssessment"), ClipboardList, patients[0]],
    ["dietPlan", t("dashboard.dietPlan"), Apple, patients[1] || patients[0]],
    ["aiAnalysis", t("dashboard.aiAnalysis"), Brain, patients[2] || patients[0]],
    ["dietAnalysis", t("dashboard.dietAnalysis"), Activity, patients[0]],
    ["generateReport", t("dashboard.generateReport"), FileText, patients[2] || patients[0]],
  ];

  return (
    <Panel className="h-full" icon={Plus} title={t("dashboard.quickActions")}>
      <div className="grid grid-cols-2 gap-3">
        {actions.map(([id, label, Icon, patient]) => (
          <button
            key={id}
            onClick={() => {
              setSelectedPatient(patient);
              if (["nutritionAssessment", "dietPlan", "aiAnalysis", "generateReport"].includes(id)) {
                openClinicalHub(patient);
              }
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

function RecentDocuments({ patient, patients }) {
  const { t } = useTranslation();
  const docs = [
    `${patient.name} - ${t("dashboard.assessmentReport")}`,
    `IBS Study - ${t("dashboard.weeklyReport")}`,
    `${t("dashboard.nutritionPlan")} - ${patients[2]?.name || patient.name}`,
  ];

  return (
    <Panel action={t("dashboard.viewAll")} className="h-full" icon={FileText} title={t("dashboard.recentDocuments")}>
      <div className="space-y-3">
        {docs.map((doc, index) => (
          <div
            key={doc}
            className="flex min-h-[74px] items-center gap-3 rounded-[18px] bg-[var(--np-color-surface-muted)] p-4"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-white text-[var(--np-color-brand)]">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-extrabold text-[var(--np-color-text)]" dir="auto">{doc}</p>
              <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                <bdi dir="ltr">{t("dashboard.pdf")}</bdi> <span aria-hidden="true">•</span> {t("dashboard.hoursAgo", { count: index + 1 })}
              </p>
            </div>
            <Download className="h-4 w-4 text-[var(--np-color-text-muted)]" />
          </div>
        ))}
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

function translateOrganLabel(system, t) {
  return t(`dashboard.organs.${system.id}`);
}

function translatePlaceholderList(items, t) {
  return items.map((item) => t(`dashboard.placeholders.${item}`, { defaultValue: item })).join(", ");
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












