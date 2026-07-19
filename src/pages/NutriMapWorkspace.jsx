import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, Brain, CircleDot, Droplets, HeartPulse, Leaf, LucideBone, Network, Search, Smile, Soup, StretchHorizontal, Waves } from "lucide-react";

import { NutriMapClinicalPanel, NutriMapStage } from "../components/NutriMap/NutriMapShared";
import { getAnatomyLayerForOrgan } from "../data/anatomyLayers";
import { MUSCLE_REGION_DEFAULT_ID, getMuscleRegion } from "../data/nutrimapMuscleRegions";
import { NUTRIMAP_SYSTEMS, NUTRITION_IMPACTS, getNutritionImpact } from "../data/nutrimapSystems";
import { NUTRIMAP_ORGAN_CONFIG, buildOrganDataSummary } from "../data/nutrimapOrganConfig";
import { ActivePatientBanner } from "../components/common/ActivePatientBanner";
import { useTranslation } from "../i18n";

const SELECTED_ORGAN_KEY = "nutripilot.nutrimap.selectedOrgan.v1";
const DRAWER_STATE_KEY = "nutripilot.nutrimap.drawerState.v1";
const BODY_NAVIGATOR_SYSTEM = {
  connections: [],
  focus: "Select a body region or system to view its clinical nutrition context.",
  id: "body-navigator",
  label: "Body Navigator",
  shortLabel: "Body Navigator",
  status: "Gray",
  statusSummary: {
    aiReviewStatus: "Select a system to review",
    monitoringStatus: "Select a system to review",
    relatedAssessments: [],
    relatedDiagnosis: "Select a body region or system",
    relatedIntervention: "Select a body region or system",
    relatedLabs: [],
    reportReadiness: "Select a system to review",
  },
};

const BODY_NAVIGATOR_SUMMARY = {
  assessments: [],
  clinicalHubTab: "summary",
  completeness: 0,
  completedCount: 0,
  fields: [],
  labs: [],
  lastUpdated: "Not recorded",
  missingCount: 0,
  relatedLabsCount: 0,
  status: "Body Navigator",
  statusColor: "Gray",
  timeline: [],
  totalCount: 0,
};

export default function NutriMapWorkspace({ activePatient, aiSummary, initialSystemId = null, intelligence, onNavigate, onOpenClinicalHub, reports = [], schedule = [], tasks = [], updatePatient, workflow }) {
  const { language } = useTranslation();
  const [selectedOrganId, setSelectedOrganId] = useState(() => {
    if (initialSystemId && NUTRIMAP_ORGAN_CONFIG[initialSystemId]) return initialSystemId;
    return null;
  });
  const [selectedMuscleRegionId, setSelectedMuscleRegionId] = useState(MUSCLE_REGION_DEFAULT_ID);
  const [activeImpactId, setActiveImpactId] = useState("");
  const [drawerState, setDrawerState] = useState(() => localStorage.getItem(DRAWER_STATE_KEY) || "open");
  const [landingMode, setLandingMode] = useState("systems");
  const [systemQuery, setSystemQuery] = useState("");
  const panelRef = useRef(null);
  const selectedSystemId = selectedOrganId && NUTRIMAP_ORGAN_CONFIG[selectedOrganId] ? selectedOrganId : null;
  const viewerMode = selectedSystemId ? "organ" : landingMode === "anatomy" ? "anatomy" : "systems";
  const selectedOrgan = NUTRIMAP_SYSTEMS.find((system) => system.id === selectedSystemId) || BODY_NAVIGATOR_SYSTEM;
  const activeLayer = getAnatomyLayerForOrgan(selectedSystemId);
  const activeLayerId = activeLayer.id;
  const activeImpact = getNutritionImpact(activeImpactId);
  const organSummary = useMemo(
    () => selectedSystemId ? buildOrganDataSummary(activePatient, selectedSystemId, workflow) : BODY_NAVIGATOR_SUMMARY,
    [activePatient, selectedSystemId, workflow],
  );
  const organSummaries = useMemo(
    () => Object.fromEntries(NUTRIMAP_SYSTEMS.map((system) => [system.id, buildOrganDataSummary(activePatient, system.id, workflow)])),
    [activePatient, workflow],
  );
  const liveSystems = useMemo(
    () => NUTRIMAP_SYSTEMS.map((system) => ({ ...system, status: organSummaries[system.id]?.statusColor || system.status })),
    [organSummaries],
  );
  const bodyNavigatorOverview = useMemo(
    () => buildBodyNavigatorOverview(activePatient, organSummaries, { aiSummary, intelligence, reports, schedule, tasks }),
    [activePatient, aiSummary, intelligence, organSummaries, reports, schedule, tasks],
  );
  const impactEmphasis = useMemo(() => {
    if (!activeImpact) return {};
    return Object.fromEntries([
      ...activeImpact.primarySystems.map((systemId) => [systemId, "primary"]),
      ...activeImpact.secondarySystems.map((systemId) => [systemId, "secondary"]),
    ]);
  }, [activeImpact]);

  function openPlaceholderWorkflow(tabId = "summary") {
    onOpenClinicalHub(activePatient, tabId);
  }

  const selectOrgan = useCallback((organId) => {
    const normalizedOrganId = normalizeOrganId(organId);
    if (!NUTRIMAP_ORGAN_CONFIG[normalizedOrganId]) return;
    if (import.meta.env.DEV) {
      console.debug("SELECT_ORGAN", normalizedOrganId);
    }
    setSelectedOrganId(normalizedOrganId);
    setLandingMode("systems");
    if (normalizedOrganId !== "muscles") {
      setSelectedMuscleRegionId(MUSCLE_REGION_DEFAULT_ID);
    }
    setDrawerState("open");
  }, []);

  const returnToBodyNavigator = useCallback(() => {
    setSelectedOrganId(null);
    setSelectedMuscleRegionId(MUSCLE_REGION_DEFAULT_ID);
    setActiveImpactId("");
    setLandingMode("systems");
    setDrawerState("open");
  }, []);

  const openAnatomyExplorer = useCallback(() => {
    setSelectedOrganId(null);
    setSelectedMuscleRegionId(MUSCLE_REGION_DEFAULT_ID);
    setLandingMode("anatomy");
    setDrawerState("open");
  }, []);

  const selectMuscleRegion = useCallback((regionId) => {
    const region = getMuscleRegion(regionId);
    setSelectedMuscleRegionId(region.id);
    setDrawerState("open");
    if (import.meta.env.DEV) {
      console.debug("SELECT_MUSCLE_REGION", region.id);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SELECTED_ORGAN_KEY, selectedOrganId || "body-navigator");
  }, [selectedOrganId]);

  useEffect(() => {
    localStorage.setItem(DRAWER_STATE_KEY, drawerState);
  }, [drawerState]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("NutriMap selected organ sync", {
      activePatientId: activePatient?.id,
      panelDataOrganId: selectedSystemId,
      selectedOrganId: selectedSystemId,
      selectedOrganName: selectedOrgan?.label,
    });
    console.debug("SELECTED_ORGAN_STATE", selectedSystemId);
  }, [activePatient?.id, selectedOrgan?.label, selectedSystemId]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && drawerState === "open") setDrawerState("collapsed");
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [drawerState]);

  function selectImpact(impactId) {
    setActiveImpactId(impactId);
    const impact = getNutritionImpact(impactId);
    if (selectedSystemId === "muscles" && ["protein", "vitamin-d", "omega-3"].includes(impactId)) return;
    if (impact?.affectedSystems?.includes(selectedSystemId)) return;
    if (impact?.primarySystems?.length) {
      selectOrgan(impact.primarySystems[0]);
    }
  }

  return (
    <div className="np-page" data-language={language}>
      <main className="np-page-main">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="np-page-kicker">NutriMap™</p>
            <h1 className="text-3xl font-black leading-tight text-[var(--np-color-text)] md:text-4xl">Clinical Systems Navigator</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
              {language === "ar" ? "تنقل بين أنظمة الجسم من خلال بيانات التغذية السريرية للمريض النشط." : "Navigate body systems through the active patient's clinical nutrition data."}
            </p>
          </div>
          <button className="np-button np-button-secondary min-h-10 px-4 py-2 text-xs" onClick={viewerMode === "anatomy" ? returnToBodyNavigator : openAnatomyExplorer} type="button">
            {viewerMode === "anatomy"
              ? language === "ar" ? "العودة إلى الأنظمة" : "Back to Systems"
              : language === "ar" ? "استكشاف التشريح" : "Explore Anatomy"}
          </button>
        </header>

        <ActivePatientBanner
          patient={activePatient}
          onOpenClinicalHub={() => onOpenClinicalHub(activePatient)}
        />

        <section className="grid grid-cols-1 gap-4">
          <section className="np-panel relative p-4">
            <div className="grid grid-cols-1 gap-4 transition-all duration-300">
              {viewerMode === "systems" ? (
                <ClinicalSystemsNavigator
                  activePatient={activePatient}
                  bodyNavigatorOverview={bodyNavigatorOverview}
                  language={language}
                  onOpenPatients={() => onNavigate?.("patients")}
                  organSummaries={organSummaries}
                  query={systemQuery}
                  selectOrgan={selectOrgan}
                  setQuery={setSystemQuery}
                  systems={liveSystems}
                />
              ) : viewerMode === "anatomy" ? (
                <BodyNavigatorDashboard
                  bodyNavigatorOverview={bodyNavigatorOverview}
                  impactEmphasis={impactEmphasis}
                  selectOrgan={selectOrgan}
                  organSummaries={organSummaries}
                  systems={liveSystems}
                />
              ) : (
                <OrganDetailStage
                  activeLayer={activeLayer}
                  activeLayerId={activeLayerId}
                  backLabel={language === "ar" ? "العودة إلى NutriMap" : "Back to NutriMap"}
                  impactEmphasis={impactEmphasis}
                  onBack={returnToBodyNavigator}
                  organSummary={organSummary}
                  selectedMuscleRegionId={selectedMuscleRegionId}
                  selectedOrgan={selectedOrgan}
                  selectedOrganId={selectedSystemId}
                  selectMuscleRegion={selectMuscleRegion}
                  selectOrgan={selectOrgan}
                  systems={liveSystems}
                />
              )}

              <NutritionImpactSelector
                activeImpact={activeImpact}
                activeImpactId={activeImpactId}
                systems={liveSystems}
                setActiveImpactId={selectImpact}
              />

              <OrganDrawer
              activePatient={activePatient}
              drawerState={drawerState}
              panelRef={panelRef}
                onCollapse={() => setDrawerState("collapsed")}
                onClose={() => setDrawerState("closed")}
                onCreateTask={() => onNavigate?.("tasks")}
                onExpand={() => setDrawerState("open")}
                onGenerateReport={() => onNavigate?.("reports")}
                onOpenAiCenter={() => onNavigate?.("ai")}
                onOpenClinicalHub={() => openPlaceholderWorkflow(organSummary.clinicalHubTab)}
                onOpenDietPlan={() => onNavigate?.("diet-plans")}
                onOpenLabs={() => openPlaceholderWorkflow("laboratory")}
                selectOrgan={selectOrgan}
                selectMuscleRegion={selectMuscleRegion}
                selectedMuscleRegionId={selectedMuscleRegionId}
                activeImpactId={activeImpactId}
                bodyNavigatorOverview={bodyNavigatorOverview}
                organSummary={organSummary}
                patientWorkflow={workflow}
                system={liveSystems.find((system) => system.id === selectedSystemId) || BODY_NAVIGATOR_SYSTEM}
                systems={liveSystems}
                updatePatient={updatePatient}
                onBackToBodyNavigator={selectedSystemId ? returnToBodyNavigator : null}
              />
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}

function OrganDrawer({
  activePatient,
  drawerState,
  onCollapse,
  onClose,
  onCreateTask,
  onExpand,
  onGenerateReport,
  onOpenAiCenter,
  onOpenClinicalHub,
  onOpenDietPlan,
  onOpenLabs,
  onBackToBodyNavigator,
  selectOrgan,
  selectMuscleRegion,
  selectedMuscleRegionId,
  activeImpactId,
  bodyNavigatorOverview,
  organSummary,
  panelRef,
  patientWorkflow,
  system,
  systems,
  updatePatient,
}) {
  if (drawerState === "closed") {
    return (
      <button
        className="justify-self-start rounded-full border border-[var(--np-color-border-soft)] bg-white px-4 py-3 text-xs font-extrabold text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)]"
        onClick={onExpand}
        type="button"
      >
        {system.shortLabel || system.label} details
      </button>
    );
  }

  if (drawerState === "collapsed") {
    return (
      <aside className="rounded-[24px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-sm)]" aria-expanded="false" ref={panelRef}>
        <button className="flex w-full flex-wrap items-center justify-between gap-3 text-left" onClick={onExpand} type="button">
          <span>
            <span className="block text-xs font-extrabold text-[var(--np-color-brand)]">{system.shortLabel || system.label}</span>
            <span className="mt-1 block text-[11px] font-bold text-[var(--np-color-text-muted)]">{organSummary.status}</span>
          </span>
          <span className="text-[11px] font-bold text-[var(--np-color-text-muted)]">{organSummary.completeness}% complete / {organSummary.relatedLabsCount} labs / {organSummary.missingCount} missing / View details</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="min-w-0 overflow-hidden rounded-[28px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-card)]" aria-expanded="true" ref={panelRef}>
      <NutriMapClinicalPanel
        key={system.id}
        activePatient={activePatient}
        onCollapse={onCollapse}
        onClose={onClose}
        onCreateTask={onCreateTask}
        onGenerateReport={onGenerateReport}
        onOpenAiCenter={onOpenAiCenter}
        onOpenClinicalHub={onOpenClinicalHub}
        onOpenDietPlan={onOpenDietPlan}
        onOpenLabs={onOpenLabs}
        onBackToBodyNavigator={onBackToBodyNavigator}
        selectOrgan={selectOrgan}
        selectMuscleRegion={selectMuscleRegion}
        selectedMuscleRegionId={selectedMuscleRegionId}
        activeImpactId={activeImpactId}
        bodyNavigatorOverview={bodyNavigatorOverview}
        organSummary={organSummary}
        patientWorkflow={patientWorkflow}
        system={system}
        systems={systems}
        updatePatient={updatePatient}
      />
    </aside>
  );
}

function buildBodyNavigatorOverview(activePatient, organSummaries, sharedState) {
  const summaries = Object.values(organSummaries || {});
  const needsReviewCount = summaries.filter((summary) => ["Needs Review", "Monitor Closely", "High Priority"].includes(summary.status)).length;
  const missingDataCount = summaries.filter((summary) => summary.missingCount > 0).length;
  const highestPriority = summaries.find((summary) => summary.status === "High Priority")?.status
    || summaries.find((summary) => summary.status === "Monitor Closely")?.status
    || summaries.find((summary) => summary.status === "Needs Review")?.status
    || summaries.find((summary) => summary.status === "Stable / OK")?.status
    || "No Data";
  const relatedReports = (sharedState.reports || []).filter((report) =>
    !report.patientId || report.patientId === activePatient?.id || report.patient === activePatient?.fullName,
  );
  const relatedSchedule = (sharedState.schedule || []).filter((appointment) =>
    appointment.patientId === activePatient?.id || appointment.patientName === activePatient?.fullName,
  );

  return {
    activeAiState: sharedState.aiSummary?.generatedAt || sharedState.intelligence?.riskEngine?.level || "Not recorded",
    mappedSystemsCount: summaries.length,
    missingDataCount,
    needsReviewCount,
    highestPriority,
    recentUpdate: activePatient?.updatedAt || activePatient?.lastUpdated || activePatient?.lastVisit || "Not recorded",
    relatedReportsCount: relatedReports.length,
    relatedScheduleCount: relatedSchedule.length,
    relatedTasksCount: (sharedState.tasks || []).filter((task) => task.relatedPatient === activePatient?.fullName || task.patientId === activePatient?.id).length,
  };
}

const SYSTEM_NAVIGATOR_LAYOUT = {
  brain: { card: "left-[4%] top-[4%]", curve: "M 28 16 C 38 14, 43 10, 49 9", icon: Brain, hotspot: { x: 50, y: 9 } },
  "oral-cavity": { card: "right-[4%] top-[8%]", curve: "M 72 19 C 62 18, 56 16, 50 15", icon: Smile, hotspot: { x: 50, y: 15 } },
  heart: { card: "right-[1%] top-[28%]", curve: "M 70 35 C 63 33, 59 30, 54 29", icon: HeartPulse, hotspot: { x: 54, y: 29 } },
  "blood-iron": { card: "left-[1%] top-[27%]", curve: "M 30 35 C 37 35, 41 34, 45 34", icon: Droplets, hotspot: { x: 45, y: 34 } },
  liver: { card: "left-[3%] top-[48%]", curve: "M 31 55 C 38 51, 42 45, 47 42", icon: Leaf, hotspot: { x: 47, y: 42 } },
  gastrointestinal: { card: "right-[3%] top-[50%]", curve: "M 70 57 C 62 55, 56 51, 50 50", icon: Soup, hotspot: { x: 50, y: 50 } },
  pancreas: { card: "right-[5%] top-[68%]", curve: "M 70 73 C 62 63, 58 53, 56 46", icon: Waves, hotspot: { x: 56, y: 46 } },
  kidneys: { card: "left-[5%] top-[68%]", curve: "M 31 73 C 38 65, 41 58, 44 55", icon: CircleDot, hotspot: { x: 44, y: 55 } },
  muscles: { card: "left-[22%] bottom-[2%]", curve: "M 40 82 C 39 75, 37 71, 37 67", icon: StretchHorizontal, hotspot: { x: 37, y: 67 } },
  bones: { card: "right-[22%] bottom-[2%]", curve: "M 60 82 C 61 79, 61 75, 62 73", icon: LucideBone, hotspot: { x: 62, y: 73 } },
};

function normalizeOrganId(organId) {
  if (organId === "gi-system") return "gastrointestinal";
  return organId;
}

function normalizeSearchTerm(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function systemMatchesQuery(system, normalizedQuery) {
  const searchableText = [
    system.label,
    system.shortLabel,
    system.id,
    ...(SYSTEM_SEARCH_ALIASES[system.id] || []),
  ].map(normalizeSearchTerm).join(" ");

  return searchableText.includes(normalizedQuery);
}

const SYSTEM_SEARCH_ALIASES = {
  "blood-iron": ["blood", "iron", "hematology", "ferritin", "hemoglobin", "b12", "folate", "حديد", "دم", "فيريتين"],
  bones: ["bone", "bones", "vitamin d", "calcium", "phosphorus", "عظام", "فيتامين د", "كالسيوم"],
  brain: ["brain", "cognition", "appetite", "omega", "omega-3", "دماغ", "شهية"],
  gastrointestinal: ["gi", "gut", "gastro", "fiber", "hydration", "ibs", "bowel", "جهاز هضمي", "ألياف", "قولون"],
  heart: ["heart", "cardio", "sodium", "lipid", "cholesterol", "قلب", "صوديوم", "دهون"],
  kidneys: ["kidney", "kidneys", "renal", "egfr", "creatinine", "fluid", "كلية", "كلى", "كرياتينين"],
  liver: ["liver", "albumin", "alt", "ast", "fatty", "كبد", "ألبومين"],
  muscles: ["muscle", "muscles", "protein", "activity", "strength", "عضلات", "بروتين"],
  "oral-cavity": ["oral", "mouth", "teeth", "swallow", "chew", "فم", "أسنان", "بلع", "مضغ"],
  pancreas: ["pancreas", "glucose", "hba1c", "diabetes", "carbohydrate", "بنكرياس", "سكر", "كربوهيدرات"],
};

function ClinicalSystemsNavigator({ activePatient, bodyNavigatorOverview, language, onOpenPatients, organSummaries, query, selectOrgan, setQuery, systems }) {
  const filteredSystems = useMemo(() => {
    const normalizedQuery = normalizeSearchTerm(query);
    if (!normalizedQuery) return systems;
    return systems.filter((system) => systemMatchesQuery(system, normalizedQuery));
  }, [query, systems]);
  const navigatorKpis = useMemo(
    () => buildNavigatorKpis(bodyNavigatorOverview, organSummaries, systems),
    [bodyNavigatorOverview, organSummaries, systems],
  );

  return (
    <section className="rounded-[28px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-card)] md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
            {language === "ar" ? "أنظمة سريرية" : "Clinical systems"}
          </p>
          <h2 className="mt-1 text-xl font-black text-[var(--np-color-text)]">
            {language === "ar" ? "اختر نظامًا للمراجعة" : "Select a system to review"}
          </h2>
        </div>
        <label className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--np-color-text-muted)]" />
          <input
            className="np-form-control min-h-11 w-full rounded-full border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] py-2 pl-10 pr-4 text-sm font-bold"
            dir="auto"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={language === "ar" ? "ابحث عن قلب، حديد، GI، فيتامين D..." : "Search Heart, Iron, GI, Vitamin D..."}
            type="search"
            value={query}
          />
        </label>
      </div>

      {!activePatient ? (
        <div className="mb-4 rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
          <p className="text-sm font-extrabold text-[var(--np-color-text)]">{language === "ar" ? "لا يوجد مريض نشط" : "No active patient selected"}</p>
          <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
            {language === "ar" ? "اختر مريضًا لعرض حالة الأنظمة السريرية المرتبطة به." : "Select a patient to view connected clinical system status."}
          </p>
          <button className="np-button np-button-secondary mt-3 min-h-10 px-4 py-2 text-xs" onClick={onOpenPatients} type="button">
            {language === "ar" ? "فتح المرضى" : "Open Patients"}
          </button>
        </div>
      ) : null}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {navigatorKpis.map((kpi, index) => (
          <NavigatorKpiCard compact index={index} key={kpi.label} kpi={kpi} />
        ))}
      </div>

      {filteredSystems.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5">
          {filteredSystems.map((system) => (
            <ClinicalSystemCard
              key={system.id}
              organSummary={organSummaries?.[system.id]}
              selectOrgan={selectOrgan}
              system={system}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 text-center">
          <p className="text-sm font-extrabold text-[var(--np-color-text)]">{language === "ar" ? "لا توجد أنظمة مطابقة" : "No matching systems"}</p>
          <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{language === "ar" ? "جرّب البحث باسم نظام أو مؤشر غذائي مختلف." : "Try another system name or nutrition marker."}</p>
        </div>
      )}
    </section>
  );
}

function ClinicalSystemCard({ organSummary, selectOrgan, system }) {
  const Icon = SYSTEM_NAVIGATOR_LAYOUT[system.id]?.icon || CircleDot;
  const statusLabelText = organSummary?.status || statusText(system.status);

  return (
    <article className="group flex min-h-[188px] flex-col rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface)] p-4 shadow-[var(--np-shadow-sm)] transition duration-150 hover:-translate-y-0.5 hover:border-[rgb(122_31_43_/_0.24)] hover:shadow-[var(--np-shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]">
          <Icon className="h-5 w-5" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${statusPillClass(system.status)}`}>
          {statusLabelText}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-black leading-5 text-[var(--np-color-text)]">{system.shortLabel || system.label}</h3>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-bold">
        <div>
          <dt className="text-[var(--np-color-text-muted)]">Completion</dt>
          <dd className="mt-1 text-sm font-black text-[var(--np-color-text)]">{organSummary?.completeness ?? 0}%</dd>
        </div>
        <div>
          <dt className="text-[var(--np-color-text-muted)]">Missing</dt>
          <dd className="mt-1 text-sm font-black text-[var(--np-color-text)]">{organSummary?.missingCount ?? 0}</dd>
        </div>
      </dl>
      <p className="mt-2 truncate text-[11px] font-bold text-[var(--np-color-text-muted)]">
        Last update: {organSummary?.lastUpdated || "Not recorded"}
      </p>
      <button
        className="mt-auto inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--np-color-border)] bg-white px-4 py-2 text-xs font-extrabold text-[var(--np-color-brand)] transition duration-150 hover:border-[var(--np-color-brand)]"
        onClick={() => selectOrgan(system.id)}
        type="button"
      >
        Open
      </button>
    </article>
  );
}

function BodyNavigatorDashboard({ bodyNavigatorOverview, impactEmphasis, selectOrgan, organSummaries, systems }) {
  const [hoveredSystemId, setHoveredSystemId] = useState("");
  const previewSystemId = hoveredSystemId || "";
  const navigatorKpis = useMemo(
    () => buildNavigatorKpis(bodyNavigatorOverview, organSummaries, systems),
    [bodyNavigatorOverview, organSummaries, systems],
  );

  return (
    <section className="np-nutrimap-premium-shell relative overflow-hidden rounded-[32px] border border-white/70 bg-[radial-gradient(circle_at_center,rgba(95,168,163,0.10),rgba(255,255,255,0.92)_54%,rgba(247,243,237,0.94))] p-3 shadow-[var(--np-shadow-card)] backdrop-blur-xl md:p-4">
      <div className="np-body-navigator-stage relative flex min-h-[740px] items-center justify-center overflow-visible rounded-[28px] border border-[var(--np-color-border-soft)] bg-white/44 p-4 pt-[150px] md:min-h-[760px] md:pt-[118px] xl:min-h-[820px]">
        <div className="np-navigator-kpi-row absolute inset-x-4 top-4 z-20 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {navigatorKpis.map((kpi, index) => (
            <NavigatorKpiCard index={index} key={kpi.label} kpi={kpi} />
          ))}
        </div>
        <div className="np-body-navigator-mannequin relative z-10 w-[290px] sm:w-[340px] md:w-[390px] xl:w-[440px]">
          <NeutralMannequin />
          {systems.map((system, index) => {
            const layout = SYSTEM_NAVIGATOR_LAYOUT[system.id];
            if (!layout) return null;
            const active = previewSystemId === system.id;
            const summary = organSummaries?.[system.id];
            const emphasis = impactEmphasis?.[system.id] || statusEmphasis(system.status);
            return (
              <button
                aria-label={`Open ${system.label}`}
                aria-pressed={active}
                className={`np-navigator-hotspot np-navigator-hotspot-${emphasis} absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full transition duration-200 focus:outline-none focus:ring-4 focus:ring-[rgb(122_31_43_/_0.16)] md:h-12 md:w-12 ${active ? "np-navigator-hotspot-active" : ""}`}
                key={system.id}
                onClick={() => selectOrgan(system.id)}
                onBlur={() => setHoveredSystemId("")}
                onFocus={() => setHoveredSystemId(system.id)}
                onMouseEnter={() => setHoveredSystemId(system.id)}
                onMouseLeave={() => setHoveredSystemId("")}
                style={{ "--np-hotspot-delay": `${index * 70}ms`, left: `${layout.hotspot.x}%`, top: `${layout.hotspot.y}%` }}
                type="button"
              >
                <span className="np-navigator-hotspot-ring" />
                <span className={`np-navigator-hotspot-core ${statusDotClass(system.status)}`} />
                {active ? <NavigatorTooltip summary={summary} system={system} /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NavigatorKpiCard({ compact = false, index, kpi }) {
  const displayValue = useCountUp(kpi.value);
  return (
    <div
      className={`${compact ? "rounded-2xl border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] shadow-none" : "rounded-[20px] border-white/75 bg-white/78 shadow-[var(--np-shadow-sm)] backdrop-blur-xl"} np-navigator-kpi border p-3`}
      style={{ animationDelay: `${120 + index * 90}ms` }}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">{kpi.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-2xl font-black tabular-nums text-[var(--np-color-text)]">
          {kpi.format === "percent" ? `${displayValue}%` : displayValue}
        </p>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${kpi.badgeClass}`}>{kpi.badge}</span>
      </div>
      <p className="mt-2 text-[11px] font-bold leading-4 text-[var(--np-color-text-muted)]">{kpi.caption}</p>
    </div>
  );
}

function NavigatorTooltip({ summary, system }) {
  const Icon = SYSTEM_NAVIGATOR_LAYOUT[system.id]?.icon || CircleDot;

  return (
    <span className="np-navigator-tooltip pointer-events-none absolute left-1/2 top-full z-40 mt-2 w-56 -translate-x-1/2 rounded-[18px] border border-white/80 bg-white/95 p-3 text-left shadow-[var(--np-shadow-card)] backdrop-blur-xl">
      <span className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="block text-xs font-extrabold text-[var(--np-color-text)]">{system.shortLabel || system.label}</span>
      </span>
      <span className="mt-1 block text-[11px] font-bold text-[var(--np-color-brand)]">{summary?.status || statusText(system.status)}</span>
      <span className="mt-1 block text-[11px] font-bold text-[var(--np-color-text-muted)]">
        {summary ? `${summary.completeness}% complete / ${summary.lastUpdated || "No update"}` : "No connected data yet"}
      </span>
      <span className="mt-2 block border-t border-[var(--np-color-border-soft)] pt-2 text-[11px] font-bold leading-4 text-[var(--np-color-text-muted)]">
        {summary?.missingCount ? `${summary.missingCount} mapped item(s) need review.` : "No mapped gap detected from available data."}
      </span>
    </span>
  );
}

function OrganDetailStage({
  activeLayer,
  activeLayerId,
  backLabel,
  impactEmphasis,
  onBack,
  organSummary,
  selectedMuscleRegionId,
  selectedOrgan,
  selectedOrganId,
  selectMuscleRegion,
  selectOrgan,
  systems,
}) {
  return (
    <section className="np-nutrimap-organ-detail-enter overflow-hidden rounded-[32px] border border-white/70 bg-white/78 p-4 shadow-[var(--np-shadow-card)] backdrop-blur-xl md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="np-icon-tile">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[var(--np-color-brand)]">
              Organ Detail Mode
            </p>
            <h2 className="text-2xl font-extrabold text-[var(--np-color-text)]">{selectedOrgan.shortLabel || selectedOrgan.label}</h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${statusPillClass(selectedOrgan.status)}`}>
            {organSummary.status}
          </span>
          <span className="np-badge np-badge-secondary">{activeLayer.caption}</span>
          <button className="np-button np-button-secondary min-h-10 px-4 py-2 text-xs" onClick={onBack} type="button">
            {backLabel}
          </button>
        </div>
      </div>

      <NutriMapStage
        key={`${selectedOrganId}-${activeLayerId}`}
        activeLayer={activeLayer}
        activeLayerId={activeLayerId}
        drawerOpen={false}
        impactEmphasis={impactEmphasis}
        selectMuscleRegion={selectMuscleRegion}
        selectOrgan={selectOrgan}
        selectedMuscleRegionId={selectedMuscleRegionId}
        selectedOrganId={selectedOrganId}
        showFallbackModel={false}
        size="large"
        systems={systems}
      />
    </section>
  );
}

function NeutralMannequin() {
  return (
    <svg className="drop-shadow-[0_22px_40px_rgb(31_41_55_/_0.14)]" viewBox="0 0 220 520" role="img" aria-label="Neutral clinical body navigator">
      <defs>
        <linearGradient id="mannequinSurface" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f7f4ee" />
          <stop offset="100%" stopColor="#ebe4d8" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="503" rx="58" ry="11" fill="rgb(31 41 55 / 0.10)" />
      <circle cx="110" cy="55" r="39" fill="url(#mannequinSurface)" stroke="white" strokeWidth="4" />
      <path d="M72 116 C84 94 136 94 148 116 C168 158 166 241 148 305 C140 334 80 334 72 305 C54 241 52 158 72 116Z" fill="url(#mannequinSurface)" stroke="white" strokeWidth="5" />
      <path d="M73 136 C36 180 33 260 55 337" fill="none" stroke="url(#mannequinSurface)" strokeLinecap="round" strokeWidth="28" />
      <path d="M147 136 C184 180 187 260 165 337" fill="none" stroke="url(#mannequinSurface)" strokeLinecap="round" strokeWidth="28" />
      <path d="M89 322 C78 383 68 437 64 485" fill="none" stroke="url(#mannequinSurface)" strokeLinecap="round" strokeWidth="31" />
      <path d="M131 322 C142 383 152 437 156 485" fill="none" stroke="url(#mannequinSurface)" strokeLinecap="round" strokeWidth="31" />
      <path d="M80 120 C98 132 122 132 140 120" fill="none" stroke="rgb(122 31 43 / 0.06)" strokeLinecap="round" strokeWidth="3" />
      <path d="M84 210 C100 222 120 222 136 210" fill="none" stroke="rgb(95 168 163 / 0.08)" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

function NutritionImpactSelector({ activeImpact, activeImpactId, setActiveImpactId, systems }) {
  return (
    <section className="mb-4 rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-[var(--np-color-brand)]" />
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
            Nutrition Impact
          </p>
        </div>
        {activeImpact ? (
          <span className="text-xs font-bold text-[var(--np-color-text-muted)]">{activeImpact.note}</span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
            !activeImpactId
              ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white"
              : "border-[var(--np-color-border)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
          }`}
          onClick={() => setActiveImpactId("")}
          type="button"
        >
          None
        </button>
        {NUTRITION_IMPACTS.map((impact) => (
          <button
            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
              activeImpactId === impact.id
                ? "border-[var(--np-color-secondary)] bg-[var(--np-color-secondary)] text-white"
                : "border-[var(--np-color-border)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-secondary)] hover:text-[var(--np-color-secondary)]"
            }`}
            key={impact.id}
            onClick={() => setActiveImpactId(impact.id)}
            type="button"
          >
            {impact.label}
          </button>
        ))}
      </div>
      {activeImpact ? (
        <div className="mt-3 rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">
            Related clinical context
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeImpact.affectedSystems.map((systemId) => {
              const system = systems.find((item) => item.id === systemId);
              return system ? (
                <span className="rounded-full bg-[var(--np-color-surface-muted)] px-3 py-1 text-xs font-extrabold text-[var(--np-color-text)]" key={system.id}>
                  {system.shortLabel || system.label}
                </span>
              ) : null;
            })}
          </div>
          <p className="mt-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
            Related organ highlighting is contextual only and requires clinician review.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function buildNavigatorKpis(bodyNavigatorOverview, organSummaries, systems) {
  const summaries = Object.values(organSummaries || {});
  const reviewedCount = summaries.filter((summary) => (summary?.completeness || 0) > 0).length;
  const workflowCompletion = summaries.length
    ? Math.round(summaries.reduce((total, summary) => total + (summary?.completeness || 0), 0) / summaries.length)
    : 0;

  return [
    {
      badge: `${systems.length || 0} total`,
      badgeClass: "bg-[var(--np-color-secondary-soft)] text-[var(--np-color-secondary)]",
      caption: "Systems with at least one mapped patient data point.",
      label: "Systems Reviewed",
      value: reviewedCount,
    },
    {
      badge: "Review",
      badgeClass: "bg-[var(--np-color-accent-soft)] text-[#8a6a25]",
      caption: "Systems currently marked for clinical review.",
      label: "Needs Review",
      value: bodyNavigatorOverview?.needsReviewCount ?? 0,
    },
    {
      badge: "Mapped",
      badgeClass: "bg-[var(--np-color-surface-muted)] text-[var(--np-color-brand)]",
      caption: "Systems where applicable mapped data is still missing.",
      label: "Missing Data",
      value: bodyNavigatorOverview?.missingDataCount ?? 0,
    },
    {
      badge: "Live",
      badgeClass: "bg-[var(--np-color-surface-muted)] text-[var(--np-color-brand)]",
      caption: "Average mapped completeness across all systems.",
      format: "percent",
      label: "Workflow Completion",
      value: workflowCompletion,
    },
  ];
}

function useCountUp(value) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 650;
    const startedAt = performance.now();
    let frameId = 0;

    function update(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(target * eased));
      if (progress < 1) {
        frameId = window.requestAnimationFrame(update);
      }
    }

    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return displayValue;
}

function statusEmphasis(status) {
  if (status === "Red") return "red";
  if (status === "Orange" || status === "Yellow") return "amber";
  if (status === "Gray") return "gray";
  return "green";
}

function statusDotClass(status) {
  if (status === "Red") return "bg-[var(--np-color-danger)]";
  if (status === "Orange") return "bg-[var(--np-color-warning)]";
  if (status === "Yellow") return "bg-[var(--np-color-accent)]";
  if (status === "Gray") return "bg-[var(--np-color-text-muted)]";
  return "bg-[var(--np-color-success)]";
}

function statusPillClass(status) {
  if (status === "Red") return "bg-[rgb(190_18_60_/_0.10)] text-[var(--np-color-danger)]";
  if (status === "Orange") return "bg-[rgb(245_158_11_/_0.14)] text-[var(--np-color-warning)]";
  if (status === "Yellow") return "bg-[var(--np-color-accent-soft)] text-[#8a6a25]";
  if (status === "Gray") return "bg-[var(--np-color-surface-muted)] text-[var(--np-color-text-muted)]";
  return "bg-[rgb(22_163_74_/_0.10)] text-[var(--np-color-success)]";
}

function statusText(status) {
  if (status === "Red") return "High";
  if (status === "Orange") return "Monitor";
  if (status === "Yellow") return "Review";
  if (status === "Gray") return "No data";
  return "Stable";
}





