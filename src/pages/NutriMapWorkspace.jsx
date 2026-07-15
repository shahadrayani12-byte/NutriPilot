import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, ClipboardList, Network } from "lucide-react";

import { NutriMapClinicalPanel, NutriMapStage } from "../components/NutriMap/NutriMapShared";
import { getAnatomyLayerForOrgan } from "../data/anatomyLayers";
import { NUTRIMAP_SYSTEMS, NUTRITION_IMPACTS, getNutritionImpact } from "../data/nutrimapSystems";
import { NUTRIMAP_ORGAN_CONFIG, buildOrganDataSummary } from "../data/nutrimapOrganConfig";
import { ActivePatientBanner } from "../components/common/ActivePatientBanner";
import { useTranslation } from "../i18n";

const SELECTED_ORGAN_KEY = "nutripilot.nutrimap.selectedOrgan.v1";
const DRAWER_STATE_KEY = "nutripilot.nutrimap.drawerState.v1";

export default function NutriMapWorkspace({ activePatient, initialSystemId = "brain", onNavigate, onOpenClinicalHub, updatePatient, workflow }) {
  const { language } = useTranslation();
  const [selectedOrganId, setSelectedOrganId] = useState(() => {
    const savedOrganId = localStorage.getItem(SELECTED_ORGAN_KEY);
    if (NUTRIMAP_ORGAN_CONFIG[savedOrganId]) return savedOrganId;
    if (NUTRIMAP_ORGAN_CONFIG[initialSystemId]) return initialSystemId;
    return "brain";
  });
  const [activeImpactId, setActiveImpactId] = useState("");
  const [drawerState, setDrawerState] = useState(() => localStorage.getItem(DRAWER_STATE_KEY) || "open");
  const panelRef = useRef(null);
  const selectedOrgan = useMemo(() => NUTRIMAP_SYSTEMS.find((system) => system.id === selectedOrganId), [selectedOrganId]);
  const activeLayer = useMemo(() => getAnatomyLayerForOrgan(selectedOrganId), [selectedOrganId]);
  const activeLayerId = activeLayer.id;
  const activeImpact = getNutritionImpact(activeImpactId);
  const organSummary = useMemo(
    () => buildOrganDataSummary(activePatient, selectedOrganId, workflow),
    [activePatient, selectedOrganId, workflow],
  );
  const organSummaries = useMemo(
    () => Object.fromEntries(NUTRIMAP_SYSTEMS.map((system) => [system.id, buildOrganDataSummary(activePatient, system.id, workflow)])),
    [activePatient, workflow],
  );
  const liveSystems = useMemo(
    () => NUTRIMAP_SYSTEMS.map((system) => ({ ...system, status: organSummaries[system.id]?.statusColor || system.status })),
    [organSummaries],
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
    if (!NUTRIMAP_ORGAN_CONFIG[organId]) return;
    if (import.meta.env.DEV) {
      console.debug("SELECT_ORGAN", organId);
    }
    setSelectedOrganId(organId);
    setDrawerState("open");
    window.setTimeout(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
  }, []);

  useEffect(() => {
    localStorage.setItem(SELECTED_ORGAN_KEY, selectedOrganId);
  }, [selectedOrganId]);

  useEffect(() => {
    localStorage.setItem(DRAWER_STATE_KEY, drawerState);
  }, [drawerState]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("NutriMap selected organ sync", {
      activePatientId: activePatient?.id,
      panelDataOrganId: selectedOrganId,
      selectedOrganId,
      selectedOrganName: selectedOrgan?.label,
    });
    console.debug("SELECTED_ORGAN_STATE", selectedOrganId);
  }, [activePatient?.id, selectedOrgan?.label, selectedOrganId]);

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
    if (impact?.primarySystems?.length) {
      selectOrgan(impact.primarySystems[0]);
    }
  }

  return (
    <div className="np-page" data-language={language}>
      <main className="np-page-main">
        <header className="np-page-header xl:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="np-page-kicker">NutriMap 3.0</p>
            <h1 className="np-page-title">Clinical Nutrition Navigation System</h1>
            <p className="np-page-subtitle">
              An interactive organ navigation system for clinical nutrition review. Each body region updates the information panel without leaving the workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="np-badge np-badge-brand">Interactive foundation</span>
            <span className="np-badge np-badge-accent">Clinical navigation</span>
          </div>
        </header>

        <ActivePatientBanner
          patient={activePatient}
          onOpenClinicalHub={() => onOpenClinicalHub(activePatient)}
        />

        <section className="grid grid-cols-1 gap-4">
          <section className="np-panel relative p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="np-icon-tile">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                    Center Stage
                  </p>
                  <h2 className="np-heading-section">Interactive Body Map</h2>
                </div>
              </div>
              <span className="np-badge np-badge-secondary">{selectedOrgan?.label}</span>
            </div>

            {import.meta.env.DEV ? (
              <div className="mb-4 rounded-[16px] border border-[var(--np-color-border-soft)] bg-white/85 px-3 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)]">
                Selected organ: {selectedOrganId} / Active layer: {activeLayerId} / Panel organ: {selectedOrgan?.id} / Model path: {activeLayer.modelPath}
              </div>
            ) : null}

            <OrganNavigationGrid
              selectedOrganId={selectedOrganId}
              impactEmphasis={impactEmphasis}
              selectOrgan={selectOrgan}
              organSummaries={organSummaries}
              systems={liveSystems}
            />

            <NutritionImpactSelector
              activeImpact={activeImpact}
              activeImpactId={activeImpactId}
              systems={liveSystems}
              setActiveImpactId={selectImpact}
            />

            <div className="grid grid-cols-1 gap-4 transition-all duration-300">
              <NutriMapStage
                selectedOrganId={selectedOrganId}
                activeLayer={activeLayer}
                activeLayerId={activeLayerId}
                drawerOpen={false}
                impactEmphasis={impactEmphasis}
                selectOrgan={selectOrgan}
                systems={liveSystems}
              />

              <OrganDrawer
              activePatient={activePatient}
              drawerState={drawerState}
              panelRef={panelRef}
                onCollapse={() => setDrawerState("collapsed")}
                onClose={() => setDrawerState("closed")}
                onCreateTask={() => openPlaceholderWorkflow("monitoring")}
                onExpand={() => setDrawerState("open")}
                onGenerateReport={() => onNavigate?.("reports")}
                onOpenAiCenter={() => onNavigate?.("ai")}
                onOpenClinicalHub={() => openPlaceholderWorkflow(organSummary.clinicalHubTab)}
                onOpenDietPlan={() => onNavigate?.("diet-plans")}
                onOpenLabs={() => openPlaceholderWorkflow("laboratory")}
                selectOrgan={selectOrgan}
                organSummary={organSummary}
                patientWorkflow={workflow}
                system={liveSystems.find((system) => system.id === selectedOrganId)}
                systems={liveSystems}
                updatePatient={updatePatient}
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
  selectOrgan,
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
        activePatient={activePatient}
        onCollapse={onCollapse}
        onClose={onClose}
        onCreateTask={onCreateTask}
        onGenerateReport={onGenerateReport}
        onOpenAiCenter={onOpenAiCenter}
        onOpenClinicalHub={onOpenClinicalHub}
        onOpenDietPlan={onOpenDietPlan}
        onOpenLabs={onOpenLabs}
        selectOrgan={selectOrgan}
        organSummary={organSummary}
        patientWorkflow={patientWorkflow}
        system={system}
        systems={systems}
        updatePatient={updatePatient}
      />
    </aside>
  );
}

function OrganNavigationGrid({ selectedOrganId, impactEmphasis, selectOrgan, organSummaries, systems }) {
  return (
    <section className="mb-4 rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="mb-3 flex items-center gap-3">
        <span className="np-icon-tile h-9 w-9">
          <ClipboardList className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
            Systems
          </p>
          <h2 className="text-sm font-extrabold text-[var(--np-color-text)]">Organ Navigation</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        {systems.map((system) => {
          const isActive = selectedOrganId === system.id;
          const emphasis = impactEmphasis[system.id] || "none";
          const summary = organSummaries?.[system.id];

          return (
            <button
              className={`min-h-[76px] rounded-[16px] border p-2.5 text-left transition ${
                isActive
                  ? "border-[var(--np-color-brand)] bg-white text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)]"
                  : emphasis === "primary"
                    ? "border-[var(--np-color-secondary)] bg-[var(--np-color-secondary-soft)] text-[var(--np-color-secondary)]"
                    : emphasis === "secondary"
                      ? "border-[var(--np-color-accent)] bg-[var(--np-color-accent-soft)] text-[#8a6a25]"
                      : "border-[var(--np-color-border-soft)] bg-white/82 text-[var(--np-color-text)] hover:border-[var(--np-color-brand)]"
              }`}
              key={system.id}
              onClick={() => selectOrgan(system.id)}
              type="button"
            >
              <span className="flex items-center justify-between gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(system.status)}`} />
                <span className="text-[10px] font-bold text-[var(--np-color-text-muted)]">
                  {statusText(system.status)}
                </span>
              </span>
              <span className="mt-2 block text-xs font-extrabold leading-4">{system.shortLabel || system.label}</span>
              <span className="mt-1 block text-[10px] font-bold text-[var(--np-color-text-muted)]">
                {summary ? `${summary.completeness}% complete / ${summary.missingCount} missing` : "No data"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
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

function statusDotClass(status) {
  if (status === "Red") return "bg-[var(--np-color-danger)]";
  if (status === "Orange") return "bg-[var(--np-color-warning)]";
  if (status === "Yellow") return "bg-[var(--np-color-accent)]";
  if (status === "Gray") return "bg-[var(--np-color-text-muted)]";
  return "bg-[var(--np-color-success)]";
}

function statusText(status) {
  if (status === "Red") return "High";
  if (status === "Orange") return "Monitor";
  if (status === "Yellow") return "Review";
  if (status === "Gray") return "No data";
  return "Stable";
}





