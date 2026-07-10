import { useMemo, useState } from "react";
import { Activity, ClipboardList, Network } from "lucide-react";

import { NutriMapClinicalPanel, NutriMapStage } from "../components/NutriMap/NutriMapShared";
import { NUTRIMAP_SYSTEMS, NUTRITION_IMPACTS, getNutriMapSystem, getNutritionImpact } from "../data/nutrimapSystems";
import { ActivePatientBanner } from "../components/common/ActivePatientBanner";

export default function NutriMapWorkspace({ activePatient, onNavigate, onOpenClinicalHub, workflow }) {
  const [activeSystemId, setActiveSystemId] = useState("brain");
  const [activeImpactId, setActiveImpactId] = useState("");
  const activeSystem = getNutriMapSystem(activeSystemId);
  const activeImpact = getNutritionImpact(activeImpactId);
  const impactEmphasis = useMemo(() => {
    if (!activeImpact) return {};
    return Object.fromEntries([
      ...activeImpact.primarySystems.map((systemId) => [systemId, "primary"]),
      ...activeImpact.secondarySystems.map((systemId) => [systemId, "secondary"]),
    ]);
  }, [activeImpact]);

  function openPlaceholderWorkflow() {
    onOpenClinicalHub(activePatient);
  }

  function selectSystem(systemId) {
    setActiveSystemId(systemId);
  }

  return (
    <div className="np-page">
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

        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[300px_minmax(0,1fr)_440px]">
          <aside className="np-panel h-fit 2xl:sticky 2xl:top-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="np-icon-tile">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                  Systems
                </p>
                <h2 className="np-heading-section">Organ Navigation</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-1">
              {NUTRIMAP_SYSTEMS.map((system) => {
                const isActive = activeSystemId === system.id;
                const emphasis = impactEmphasis[system.id] || "none";

                return (
                  <button
                    className={`rounded-[18px] border p-3 text-left transition ${
                      isActive
                        ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)]"
                        : emphasis === "primary"
                          ? "border-[var(--np-color-secondary)] bg-[var(--np-color-secondary-soft)] text-[var(--np-color-secondary)]"
                          : emphasis === "secondary"
                            ? "border-[var(--np-color-accent)] bg-[var(--np-color-accent-soft)] text-[#8a6a25]"
                            : "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text)] hover:border-[var(--np-color-brand)]"
                    }`}
                    key={system.id}
                    onClick={() => selectSystem(system.id)}
                    type="button"
                  >
                    <span className="block text-sm font-extrabold">{system.label}</span>
                    <span className="mt-1 block text-xs font-bold text-[var(--np-color-text-muted)]">
                      {system.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="np-panel p-4">
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
              <span className="np-badge np-badge-secondary">{activeSystem.label}</span>
            </div>

            <NutritionImpactSelector
              activeImpact={activeImpact}
              activeImpactId={activeImpactId}
              setActiveImpactId={setActiveImpactId}
            />

            <NutriMapStage
              activeSystemId={activeSystemId}
              impactEmphasis={impactEmphasis}
              onSelectSystem={selectSystem}
              systems={NUTRIMAP_SYSTEMS}
            />
          </section>

          <div className="2xl:sticky 2xl:top-6 2xl:self-start">
            <NutriMapClinicalPanel
              onCreateTask={openPlaceholderWorkflow}
              onGenerateReport={() => onNavigate?.("reports")}
              onOpenAiCenter={() => onNavigate?.("ai")}
              onOpenClinicalHub={openPlaceholderWorkflow}
              onOpenLabs={openPlaceholderWorkflow}
              onSelectSystem={selectSystem}
              patientWorkflow={workflow}
              system={activeSystem}
              systems={NUTRIMAP_SYSTEMS}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function NutritionImpactSelector({ activeImpact, activeImpactId, setActiveImpactId }) {
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
    </section>
  );
}


