import { useCallback, useEffect, useState } from "react";
import { Activity, Brain, ChevronDown, ClipboardList, FlaskConical, Network, StickyNote, Target, X } from "lucide-react";
import { useTranslation } from "../../i18n";
import { MUSCLE_REGION_DEFAULT_ID, getMuscleRegion } from "../../data/nutrimapMuscleRegions";
import { NutriMapModelStage } from "./NutriMapModelStage";

export function HumanBodyPlaceholder({ size = "large" }) {
  const { t } = useTranslation();
  const sizeClass = size === "preview" ? "h-[340px] w-[195px]" : "h-[640px] w-[360px]";

  return (
    <div className="relative flex items-center justify-center">
      <svg className={`relative ${sizeClass}`} viewBox="0 0 220 420" aria-label="Human body placeholder" role="img">
        <circle cx="110" cy="45" r="34" fill="none" stroke="var(--np-color-brand)" strokeOpacity="0.22" strokeWidth="6" />
        <path d="M76 98 C88 78 132 78 144 98 C164 140 160 212 140 258 C130 282 90 282 80 258 C60 212 56 140 76 98Z" fill="var(--np-color-brand)" opacity="0.12" stroke="var(--np-color-brand)" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M78 118 C38 162 40 226 58 288" stroke="var(--np-color-brand)" strokeWidth="16" strokeLinecap="round" opacity="0.16" />
        <path d="M142 118 C182 162 180 226 162 288" stroke="var(--np-color-brand)" strokeWidth="16" strokeLinecap="round" opacity="0.16" />
        <path d="M92 262 C80 318 72 366 68 405" stroke="var(--np-color-brand)" strokeWidth="18" strokeLinecap="round" opacity="0.16" />
        <path d="M128 262 C140 318 148 366 152 405" stroke="var(--np-color-brand)" strokeWidth="18" strokeLinecap="round" opacity="0.16" />
        <circle cx="110" cy="135" r="15" fill="var(--np-color-secondary)" opacity="0.38" />
        <path d="M92 165 C104 150 128 153 136 170 C126 184 101 184 92 165Z" fill="var(--np-color-brand)" opacity="0.32" />
        <path d="M93 205 C104 188 132 192 140 212 C132 238 100 238 90 214Z" fill="var(--np-color-accent)" opacity="0.45" />
      </svg>
      <div className={`${size === "preview" ? "bottom-1 px-3 py-1.5" : "bottom-8 px-4 py-2"} absolute rounded-full border border-[var(--np-color-border-soft)] bg-white/85 text-xs font-extrabold text-[var(--np-color-text-muted)] shadow-[var(--np-shadow-sm)]`}>
        {t("nutrimap.futureBody")}
      </div>
    </div>
  );
}

export function NutriMapChip({ active, emphasis = "none", relationship = false, className = "", label, status, onClick }) {
  return (
    <button
      className={`${className} ${className ? "absolute" : ""} rounded-[18px] border px-3 py-2 text-left shadow-[var(--np-shadow-sm)] transition ${chipClass(active, emphasis, relationship)}`}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${nutriMapStatusDot(status)}`} />
        <span className="text-xs font-extrabold">{label}</span>
      </span>
      <span className={`ml-4 mt-1 block text-[10px] font-bold ${active ? "text-white/80" : "text-[var(--np-color-text-muted)]"}`}>
        {status}{emphasis !== "none" ? ` - ${emphasis}` : ""}
      </span>
    </button>
  );
}

export function NutriMapBodyRegion({ active, emphasis = "none", label, position, relationship = false, status, onClick }) {
  const markerClass = active ? "nutrimap-marker-active" : emphasis !== "none" ? `nutrimap-marker-impact-${emphasis}` : relationship ? "nutrimap-marker-relationship" : "";

  return (
    <button
      aria-pressed={active}
      className={`${position} ${markerClass} absolute z-30 flex items-center justify-center rounded-full border-2 shadow-[var(--np-shadow-sm)] transition ${markerButtonClass(active, emphasis, relationship)}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className={`h-3.5 w-3.5 rounded-full ${active ? "bg-white" : nutriMapStatusDot(status)}`} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export function NutriMapClinicalPanel({ activeImpactId = "", activePatient, bodyNavigatorOverview, compact = false, onBackToBodyNavigator, onCollapse, onClose, onOpenAiCenter, onOpenClinicalHub, onOpenDietPlan, onOpenLabs, onCreateTask, onGenerateReport, selectOrgan, selectMuscleRegion, selectedMuscleRegionId = MUSCLE_REGION_DEFAULT_ID, organSummary, patientWorkflow, system, systems = [], updatePatient }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const isBodyNavigator = system.id === "body-navigator";
  const tabs = [
    { id: "overview", label: "Overview", icon: ClipboardList },
    { id: "labs", label: "Labs", icon: FlaskConical },
    { id: "assessment", label: "Assessment", icon: Activity },
    { id: "intervention", label: "Intervention", icon: Target },
    { id: "ai", label: "AI", icon: Brain },
    { id: "research", label: "Research", icon: Network },
    { id: "notes", label: "Notes", icon: StickyNote },
  ];
  const isMusclePanel = system.id === "muscles";
  const muscleRegion = getMuscleRegion(selectedMuscleRegionId);
  const panelTitle = isMusclePanel ? muscleRegion.panelTitle : system.label;
  const relatedSystems = system.connections.map((systemId) => systems.find((item) => item.id === systemId)).filter(Boolean);
  const activeSections = isMusclePanel
    ? buildMuscleTabSections(activeTab, activePatient, activeImpactId, muscleRegion, organSummary, patientWorkflow)
    : buildLiveTabSections(activeTab, system, organSummary);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("PANEL_ORGAN", system?.id);
  }, [system?.id]);

  if (isBodyNavigator) {
    return (
      <aside className="flex flex-col bg-white">
        <div className="sticky top-0 z-10 border-b border-[var(--np-color-border-soft)] bg-white/95 p-4 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">{t("nutrimap.organIntelligencePanel")}</p>
              <h3 className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-extrabold text-[var(--np-color-text)]`}>Body Navigator</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="np-badge np-badge-secondary">Explore</span>
              <button aria-label="Collapse organ drawer" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--np-color-border-soft)] text-[var(--np-color-text-muted)] hover:text-[var(--np-color-brand)]" onClick={onCollapse} type="button">
                <ChevronDown className="h-4 w-4" />
              </button>
              <button aria-label="Close organ drawer" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--np-color-border-soft)] text-[var(--np-color-text-muted)] hover:text-[var(--np-color-brand)]" onClick={onClose} type="button">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-4">
          <section className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">Body Navigator</p>
            <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text)]">
              Select a body region or system to view its clinical nutrition context.
            </p>
            <p className="mt-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
              This is the neutral landing state. Patient data remains available, but no organ-specific interpretation is shown until a system is selected.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <DrawerMetric label="Mapped systems" value={bodyNavigatorOverview?.mappedSystemsCount ?? systems.length} />
              <DrawerMetric label="Needs review" value={bodyNavigatorOverview?.needsReviewCount ?? 0} />
              <DrawerMetric label="Missing data" value={bodyNavigatorOverview?.missingDataCount ?? 0} />
              <DrawerMetric label="Highest priority" value={bodyNavigatorOverview?.highestPriority || "No Data"} />
            </div>
            <p className="mt-3 text-xs font-bold text-[var(--np-color-text-muted)]">
              Recent patient update: {bodyNavigatorOverview?.recentUpdate || "Not recorded"}
            </p>
          </section>
          <section className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
            {systems.map((item) => (
              <button className="min-h-10 rounded-[14px] border border-[var(--np-color-border)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]" key={item.id} onClick={() => selectOrgan(item.id)} type="button">
                {item.shortLabel || item.label}
              </button>
            ))}
          </section>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-[var(--np-color-border-soft)] bg-white/95 p-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">{t("nutrimap.organIntelligencePanel")}</p>
            <h3 className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-extrabold text-[var(--np-color-text)]`}>{panelTitle}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={nutriMapStatusBadge(organSummary?.statusColor || system.status)}>{organSummary?.status || statusLabel(system.status)}</span>
            <button aria-label="Collapse organ drawer" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--np-color-border-soft)] text-[var(--np-color-text-muted)] hover:text-[var(--np-color-brand)]" onClick={onCollapse} type="button">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button aria-label="Close organ drawer" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--np-color-border-soft)] text-[var(--np-color-text-muted)] hover:text-[var(--np-color-brand)]" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <DrawerMetric label="Data completeness" value={`${organSummary?.completeness ?? 0}%`} />
          <DrawerMetric label="Related labs" value={organSummary?.relatedLabsCount ?? 0} />
          <DrawerMetric label="Missing items" value={organSummary?.missingCount ?? 0} />
          <DrawerMetric label="Last updated" value={organSummary?.lastUpdated || "Not recorded"} />
        </div>
        {onBackToBodyNavigator ? (
          <button className="mt-3 min-h-10 rounded-full border border-[var(--np-color-border)] bg-white px-4 py-2 text-xs font-extrabold text-[var(--np-color-brand)] transition hover:border-[var(--np-color-brand)]" onClick={onBackToBodyNavigator} type="button">
            Back to Body Map
          </button>
        ) : null}
      </div>

      <div className="p-4">
        <OrganStatusSummary organSummary={organSummary} patientWorkflow={patientWorkflow} system={system} />
        {isMusclePanel ? (
          <MuscleRegionControls
            muscleRegion={muscleRegion}
            selectMuscleRegion={selectMuscleRegion}
          />
        ) : null}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button aria-label={`Open ${tab.label} tab`} className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-extrabold transition ${isActive ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white" : "border-[var(--np-color-border)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
                <Icon className="h-3.5 w-3.5" />
                {t(`nutrimap.tabs.${tab.id}`)}
              </button>
            );
          })}
        </div>

        <div className={`mt-4 grid grid-cols-1 gap-3 ${activeTab === "overview" ? "xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]" : ""}`} key={`${system.id}-${activeTab}`}>
          {activeTab === "notes" ? (
            <OrganNotesEditor activePatient={activePatient} key={`${activePatient?.id || "patient"}-${system.id}`} organId={system.id} updatePatient={updatePatient} />
          ) : (
            <div className="space-y-3">
              {activeSections.slice(0, 3).map((section) => <NutriMapPanelSection key={section.title} section={section} />)}
            </div>
          )}
          {activeTab === "overview" ? (
            <div className="grid grid-cols-1 gap-3">
              <NutritionConnections relatedSystems={relatedSystems} selectOrgan={selectOrgan} />
              <OrganTimeline organSummary={organSummary} />
            </div>
          ) : null}
        </div>

        <OrganQuickActions onCreateTask={onCreateTask} onGenerateReport={onGenerateReport} onOpenAiCenter={onOpenAiCenter} onOpenClinicalHub={onOpenClinicalHub} onOpenDietPlan={onOpenDietPlan} onOpenLabs={onOpenLabs} />
      </div>
    </aside>
  );
}

function DrawerMetric({ label, value }) {
  return (
    <div className="rounded-[14px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-2">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-muted)]">{label}</p>
      <p className="mt-1 truncate text-xs font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}
export function NutriMapStage({ activeLayer, activeLayerId, selectedOrganId, selectedMuscleRegionId = MUSCLE_REGION_DEFAULT_ID, drawerOpen = false, impactEmphasis = {}, systems, selectOrgan, selectMuscleRegion, size = "large" }) {
  return (
    <NutriMapModelStage
      activeLayer={activeLayer}
      activeLayerId={activeLayerId}
      drawerOpen={drawerOpen}
      impactEmphasis={impactEmphasis}
      selectOrgan={selectOrgan}
      selectMuscleRegion={selectMuscleRegion}
      selectedOrganId={selectedOrganId}
      selectedMuscleRegionId={selectedMuscleRegionId}
      size={size}
      systems={systems}
    />
  );
}

function MuscleRegionControls({ muscleRegion, selectMuscleRegion }) {
  const isOverview = muscleRegion.id === MUSCLE_REGION_DEFAULT_ID;
  return (
    <section className="mt-4 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">
            Related clinical context — clinician review required.
          </p>
          <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
            {isOverview ? "Global muscle assessment view." : `Focused region: ${muscleRegion.label}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className={`min-h-9 rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${isOverview ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white" : "border-[var(--np-color-border)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"}`}
            onClick={() => selectMuscleRegion?.(MUSCLE_REGION_DEFAULT_ID)}
            type="button"
          >
            Muscle Overview
          </button>
          <button
            className="min-h-9 rounded-full border border-[var(--np-color-border)] bg-white px-3 py-1.5 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
            onClick={() => selectMuscleRegion?.(muscleRegion.id)}
            type="button"
          >
            Focus Region
          </button>
        </div>
      </div>
    </section>
  );
}

function OrganStatusSummary({ organSummary, patientWorkflow, system }) {
  const { t } = useTranslation();
  const summary = system.statusSummary;
  const stepStatus = (stepId, fallback) => patientWorkflow?.steps?.find((step) => step.id === stepId)?.status || fallback;
  const labSummary = organSummary?.labs?.filter((lab) => lab.value !== "Not recorded").slice(0, 2).map((lab) => `${lab.label}: ${lab.value}${lab.unit ? ` ${lab.unit}` : ""}`).join(" · ");
  const assessmentSummary = organSummary?.fields?.filter((field) => field.value !== "Not recorded").slice(0, 2).map((field) => field.label).join(" · ");
  const clinicalRows = Object.fromEntries((organSummary?.clinicalRows || []).map((row) => [row.label, row]));
  const items = [
    [t("nutrimap.summary.currentStatus"), organSummary?.status || statusLabel(system.status)],
    [t("nutrimap.summary.laboratoryMarkers"), labSummary || summaryList(summary.relatedLabs, "No related laboratory result"), stepStatus("labs", "Not recorded")],
    [t("nutrimap.summary.assessments"), assessmentSummary || summaryList(summary.relatedAssessments, "No assessment recorded"), stepStatus("assessment", "Not recorded")],
    [t("nutrimap.summary.nutritionDiagnosis"), clinicalRows["PES diagnosis"]?.value || summaryValue(summary.relatedDiagnosis, "No nutrition diagnosis linked"), clinicalRows["PES diagnosis"]?.status || stepStatus("pes", "Not recorded")],
    [t("nutrimap.summary.intervention"), clinicalRows["Nutrition intervention"]?.value || summaryValue(summary.relatedIntervention, "No intervention linked"), clinicalRows["Nutrition intervention"]?.status || stepStatus("intervention", "Not recorded")],
    [t("nutrimap.summary.monitoring"), clinicalRows.Monitoring?.value || summaryValue(summary.monitoringStatus, "No monitoring entry"), clinicalRows.Monitoring?.status || stepStatus("monitoring", "Not recorded")],
    [t("nutrimap.summary.aiReview"), clinicalRows["AI review"]?.value || summaryValue(summary.aiReviewStatus, "No AI review recorded"), clinicalRows["AI review"]?.status || stepStatus("ai", "Not recorded")],
    [t("nutrimap.summary.reportReadiness"), clinicalRows.Reports?.value || summaryValue(summary.reportReadiness, "Report not ready"), clinicalRows.Reports?.status || stepStatus("reports", "Not recorded")],
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map(([label, value, status]) => (
        <div className="rounded-[14px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={label}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{label}</p>
          <p className="mt-1 text-xs font-extrabold leading-5 text-[var(--np-color-text)]">{value}</p>
          {status ? <p className="mt-1 text-[10px] font-bold text-[var(--np-color-text-muted)]">{cleanClinicalText(status)}</p> : null}
        </div>
      ))}
    </div>
  );
}

function NutritionConnections({ relatedSystems, selectOrgan }) {
  const { t } = useTranslation();
  if (!relatedSystems.length) return null;
  return (
    <section className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]"><Network className="h-4 w-4" />{t("nutrimap.organRelationships")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {relatedSystems.map((system) => (
          <button className="rounded-full border border-[var(--np-color-border)] bg-white px-3 py-1.5 text-xs font-extrabold text-[var(--np-color-text)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]" key={system.id} onClick={() => selectOrgan(system.id)} type="button">
            {system.shortLabel || system.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function OrganTimeline({ organSummary }) {
  const { t } = useTranslation();
  const entries = organSummary?.timeline || [];

  return (
    <section className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">{t("nutrimap.organTimeline")}</p>
      <div className="mt-3 space-y-2">
        {entries.length ? entries.map((item) => (
          <div className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3" key={`${item.source}-${item.title}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-[var(--np-color-text)]">{item.title}</p>
                <p className="text-[11px] font-bold text-[var(--np-color-text-muted)]">{item.date || item.source}</p>
              </div>
              <span className="np-badge np-badge-secondary">{item.status}</span>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">{item.description}</p>
          </div>
        )) : (
          <p className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3 text-xs font-bold text-[var(--np-color-text-muted)]">
            No timeline entry recorded.
          </p>
        )}
      </div>
    </section>
  );
}

function OrganQuickActions({ onCreateTask, onGenerateReport, onOpenAiCenter, onOpenClinicalHub, onOpenDietPlan, onOpenLabs }) {
  const actions = [
    ["Clinical Hub", onOpenClinicalHub],
    ["Laboratory Results", onOpenLabs],
    ["Diet Plan", onOpenDietPlan],
    ["AI Center", onOpenAiCenter],
    ["Reports", onGenerateReport],
    ["Follow-up task", onCreateTask],
  ];
  return (
    <section className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
      {actions.map(([label, handler]) => (
        <button className="min-h-10 rounded-[14px] border border-[var(--np-color-border)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]" key={label} onClick={handler} type="button">
          {label}
        </button>
      ))}
    </section>
  );
}

function NutriMapPanelSection({ section }) {
  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{section.title}</p>
      {section.rows ? (
        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
          {section.rows.map((row) => (
            <div className="rounded-[14px] bg-white p-3" key={`${row.label}-${row.value}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-extrabold text-[var(--np-color-text)]">{row.label}</p>
                <span className="text-[10px] font-bold text-[var(--np-color-text-muted)]">{row.meta}</span>
              </div>
              <p className="mt-1 text-sm font-extrabold text-[var(--np-color-brand)]">{cleanClinicalText(row.value)}</p>
            </div>
          ))}
        </div>
      ) : section.items ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {section.items.map((item) => <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--np-color-text)]" key={item}>{cleanClinicalText(item)}</span>)}
        </div>
      ) : (
        <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text)]">{cleanClinicalText(section.value)}</p>
      )}
    </div>
  );
}

function buildMuscleTabSections(activeTab, activePatient, activeImpactId, muscleRegion, organSummary, patientWorkflow) {
  if (activeTab === "labs") {
    return [
      {
        rows: [
          muscleLabRow(activePatient, "Albumin"),
          muscleLabRow(activePatient, "Creatinine"),
          muscleLabRow(activePatient, "Vitamin D"),
          muscleLabRow(activePatient, "CRP"),
          muscleLabRow(activePatient, "Sodium"),
          muscleLabRow(activePatient, "Potassium"),
        ],
        title: "Muscle-related laboratory markers",
      },
      { title: "Laboratory boundary", value: "Values are displayed only when recorded. Open Laboratory Results for formal review." },
    ];
  }

  if (activeTab === "assessment") {
    return [
      {
        rows: [
          patientDataRow(activePatient, "Estimated muscle mass", ["estimatedMuscleMass", "muscleMass", "bodyComposition"]),
          patientDataRow(activePatient, "Mid-upper arm circumference", ["muac", "MUAC", "midUpperArmCircumference"]),
          patientDataRow(activePatient, "Calf circumference", ["calfCircumference"]),
          patientDataRow(activePatient, "Handgrip strength", ["handgripStrength"]),
          patientDataRow(activePatient, "Physical activity level", ["physicalActivity", "activityLevel", "physicalActivityLevel"]),
          patientDataRow(activePatient, "Recent weight loss", ["recentWeightLoss", "recentWeightChange", "weightChange"]),
          patientDataRow(activePatient, "Appetite", ["appetite", "appetiteLevel", "appetiteStatus"]),
          patientDataRow(activePatient, "Protein intake", ["proteinIntake", "proteinTarget", "proteinRequirement"]),
          patientDataRow(activePatient, "Energy intake", ["energyIntake", "energyTarget", "caloriesTarget"]),
        ],
        title: "Muscle assessment data",
      },
      { title: "Assessment completeness", value: `${organSummary?.completedCount || 0} of ${organSummary?.totalCount || 0} mapped muscle items recorded.` },
    ];
  }

  if (activeTab === "intervention") {
    const interventionStatus = patientWorkflow?.steps?.find((step) => step.id === "intervention")?.status || "No intervention linked";
    const dietPlanStatus = patientWorkflow?.steps?.find((step) => step.id === "dietPlan")?.status || "No active diet plan";
    return [
      { title: "Nutrition intervention", value: interventionStatus },
      { title: "Diet plan context", value: dietPlanStatus },
      { title: "Region context", value: muscleRegionClinicalContext(muscleRegion, activePatient) },
    ];
  }

  if (activeTab === "ai") {
    return [
      {
        items: [
          "Based only on available patient data",
          "Clinical consideration — clinician review required",
          "No diagnosis or exercise prescription generated",
        ],
        title: "Rule-based muscle review",
      },
      { title: "Nutrition impact context", value: muscleImpactContext(activeImpactId, activePatient) },
    ];
  }

  if (activeTab === "research") {
    return [
      { title: "Research context", value: "No de-identified muscle-region research integration is connected yet." },
      { title: "Safety boundary", value: "Research data is not mixed with patient care data." },
    ];
  }

  return [
    {
      rows: [
        { label: "Muscle status", meta: "Workflow", value: organSummary?.status || "Not recorded" },
        patientDataRow(activePatient, "Protein adequacy", ["proteinAdequacy", "proteinIntake", "proteinTarget", "proteinRequirement"]),
        patientDataRow(activePatient, "Physical activity", ["physicalActivity", "activityLevel", "physicalActivityLevel"]),
        patientDataRow(activePatient, "Weight trend", ["weightTrend", "recentWeightChange", "weightChange"]),
        patientDataRow(activePatient, "BMI", ["bmi", "BMI", "bodyMassIndex"]),
        patientDataRow(activePatient, "Risk of muscle loss", ["muscleLossRisk", "muscleRisk", "sarcopeniaScreening"]),
      ],
      title: muscleRegion.id === MUSCLE_REGION_DEFAULT_ID ? "Global muscle overview" : `${muscleRegion.label} clinical context`,
    },
    { title: "Region-specific context", value: muscleRegionClinicalContext(muscleRegion, activePatient) },
    { title: "Nutrition impact context", value: muscleImpactContext(activeImpactId, activePatient) },
  ];
}

function buildLiveTabSections(activeTab, system, organSummary) {
  if (activeTab === "labs") {
    const labRows = organSummary?.labs?.length
      ? organSummary.labs.map((lab) => ({
        label: lab.label,
        meta: `${lab.status}${lab.date ? ` · ${lab.date}` : ""}${lab.trend ? ` · ${lab.trend}` : ""}`,
        value: lab.value === "Not recorded" ? "Not recorded" : `${lab.value}${lab.unit ? ` ${lab.unit}` : ""}`,
      }))
      : [{ label: "Laboratory", meta: "Missing", value: "No related laboratory result" }];
    return [
      { title: "Related laboratory values", rows: labRows },
      { title: "Laboratory action", value: "Open Laboratory Results to add or review formal lab values." },
    ];
  }

  if (activeTab === "assessment") {
    const fieldRows = organSummary?.fields?.length
      ? organSummary.fields.map((field) => ({
        label: field.label,
        meta: field.value === "Not recorded" ? "Missing" : "Recorded",
        value: field.value,
      }))
      : [{ label: "Assessment", meta: "Missing", value: "No assessment recorded" }];
    return [
      { title: "Mapped assessment fields", rows: fieldRows },
      { title: "Completion status", value: `${organSummary?.completedCount || 0} of ${organSummary?.totalCount || 0} mapped items recorded.` },
      { title: "Clinical consideration", value: "Clinical consideration — clinician review required." },
    ];
  }

  if (activeTab === "intervention") {
    const rows = organSummary?.clinicalRows?.filter((row) => ["PES diagnosis", "Nutrition intervention", "Diet plan", "Monitoring", "Follow-up"].includes(row.label)) || [];
    return [
      { title: "Care plan links", rows: rows.map((row) => ({ label: row.label, meta: row.status, value: row.value })) },
      { title: "Care boundary", value: "NutriMap reads care-plan status from shared patient state. Formal edits remain in Clinical Hub and Diet Plan Builder." },
    ];
  }

  if (activeTab === "ai") {
    const aiRow = organSummary?.clinicalRows?.find((row) => row.label === "AI review");
    const reportRow = organSummary?.clinicalRows?.find((row) => row.label === "Reports");
    return [
      { title: "Rule-based clinical considerations", items: ["Based only on available patient data", `${organSummary?.missingCount || 0} mapped item(s) missing`, "Clinical visualization — clinician review required"] },
      { title: "AI and report state", rows: [
        { label: "AI review", meta: aiRow?.status || "Not recorded", value: aiRow?.value || "Not recorded" },
        { label: "Reports", meta: reportRow?.status || "Not recorded", value: reportRow?.value || "Not recorded" },
      ] },
      { title: "AI safety", value: "No diagnosis or prescription is generated from NutriMap." },
    ];
  }

  if (activeTab === "research") {
    return [
      { title: "Research context", value: "No de-identified research integration is connected for this organ yet." },
      { title: "Safety boundary", value: "Research data is not mixed with patient care data." },
    ];
  }

  const overviewRows = [
    ...(organSummary?.fields || []).slice(0, 4).map((field) => ({
      label: field.label,
      meta: field.value === "Not recorded" ? "Missing" : "Recorded",
      value: field.value,
    })),
    ...(organSummary?.labs || []).slice(0, 3).map((lab) => ({
      label: lab.label,
      meta: lab.status || "Not recorded",
      value: lab.value === "Not recorded" ? "Not recorded" : `${lab.value}${lab.unit ? ` ${lab.unit}` : ""}`,
    })),
  ];
  const clinicalRows = organSummary?.clinicalRows || [];
  const pesRow = clinicalRows.find((row) => row.label === "PES diagnosis");
  const interventionRow = clinicalRows.find((row) => row.label === "Nutrition intervention");
  const monitoringRow = clinicalRows.find((row) => row.label === "Monitoring");

  return [
    { title: "Current Clinical Status", value: organSummary?.status || statusLabel(system.status) },
    { title: "Main Concern", value: organSummary?.missingCount ? `${organSummary.missingCount} mapped item(s) missing.` : "No mapped data gap detected." },
    { title: "Organ-specific mapped data", rows: overviewRows.length ? overviewRows : [{ label: system.label, meta: "No Data", value: "No organ-specific data recorded" }] },
    { title: "Care context", rows: [
      { label: "Nutrition diagnosis", meta: pesRow?.status || "Not recorded", value: pesRow?.value || "Not recorded" },
      { label: "Intervention", meta: interventionRow?.status || "Not recorded", value: interventionRow?.value || "Not recorded" },
      { label: "Monitoring", meta: monitoringRow?.status || "Not recorded", value: monitoringRow?.value || "Not recorded" },
    ] },
    { title: "Clinical Notes", value: system.focus },
    { title: "Safety boundary", value: "Clinical visualization — clinician review required." },
  ];
}

function OrganNotesEditor({ activePatient, organId, updatePatient }) {
  const savedNote = activePatient?.organClinicalNotes?.[organId] || "";
  const savedDetails = activePatient?.organClinicalDetails?.[organId] || {};
  const [draft, setDraft] = useState({
    followUpReminder: savedDetails.followUpReminder || "",
    monitoringNote: savedDetails.monitoringNote || "",
    note: savedNote,
    reviewStatus: savedDetails.reviewStatus || "Needs Review",
  });
  const [saveStatus, setSaveStatus] = useState(savedDetails.savedAt ? `Saved ${formatSavedTime(savedDetails.savedAt)}` : "Saved");

  const persistDraft = useCallback((nextStatus = "Saved just now") => {
    if (!updatePatient || !activePatient) {
      setSaveStatus("Save failed");
      return;
    }
    const savedAt = new Date().toISOString();
    updatePatient({
      ...activePatient,
      organClinicalDetails: {
        ...(activePatient?.organClinicalDetails || {}),
        [organId]: {
          followUpReminder: draft.followUpReminder,
          monitoringNote: draft.monitoringNote,
          reviewStatus: draft.reviewStatus,
          savedAt,
        },
      },
      organClinicalNotes: {
        ...(activePatient?.organClinicalNotes || {}),
        [organId]: draft.note,
      },
    });
    setSaveStatus(`${nextStatus} ${formatSavedTime(savedAt)}`);
  }, [activePatient, draft.followUpReminder, draft.monitoringNote, draft.note, draft.reviewStatus, organId, updatePatient]);

  useEffect(() => {
    const hasChanged =
      draft.note !== savedNote ||
      draft.followUpReminder !== (savedDetails.followUpReminder || "") ||
      draft.monitoringNote !== (savedDetails.monitoringNote || "") ||
      draft.reviewStatus !== (savedDetails.reviewStatus || "Needs Review");

    if (!hasChanged) return undefined;
    const timer = window.setTimeout(() => {
      setSaveStatus("Saving...");
      persistDraft("Saved");
    }, 1700);

    return () => window.clearTimeout(timer);
  }, [draft, persistDraft, savedDetails.followUpReminder, savedDetails.monitoringNote, savedDetails.reviewStatus, savedNote]);

  function updateField(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
    setSaveStatus("Unsaved changes");
  }

  function cancelChanges() {
    setDraft({
      followUpReminder: savedDetails.followUpReminder || "",
      monitoringNote: savedDetails.monitoringNote || "",
      note: savedNote,
      reviewStatus: savedDetails.reviewStatus || "Needs Review",
    });
    setSaveStatus("Saved");
  }

  return (
    <section className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">Organ clinical note</p>
        <span className="text-[11px] font-bold text-[var(--np-color-text-muted)]">{saveStatus}</span>
      </div>
      <label className="mt-3 block text-xs font-extrabold text-[var(--np-color-text-muted)]">
        Review status
        <select className="np-form-control mt-1 min-h-10" value={draft.reviewStatus} onChange={(event) => updateField("reviewStatus", event.target.value)}>
          <option>Needs Review</option>
          <option>Monitoring</option>
          <option>Reviewed</option>
        </select>
      </label>
      <label className="mt-3 block text-xs font-extrabold text-[var(--np-color-text-muted)]">
        Clinical note
        <textarea className="np-form-control mt-1 min-h-24" placeholder="No organ note recorded." value={draft.note} onChange={(event) => updateField("note", event.target.value)} />
      </label>
      <label className="mt-3 block text-xs font-extrabold text-[var(--np-color-text-muted)]">
        Follow-up reminder
        <textarea className="np-form-control mt-1 min-h-20" placeholder="No follow-up recorded." value={draft.followUpReminder} onChange={(event) => updateField("followUpReminder", event.target.value)} />
      </label>
      <label className="mt-3 block text-xs font-extrabold text-[var(--np-color-text-muted)]">
        Monitoring note
        <textarea className="np-form-control mt-1 min-h-20" placeholder="No monitoring entry." value={draft.monitoringNote} onChange={(event) => updateField("monitoringNote", event.target.value)} />
      </label>
      <div className="mt-3 flex justify-end gap-2">
        <button className="np-button np-button-secondary min-h-10 px-4 py-2 text-xs" onClick={cancelChanges} type="button">Cancel</button>
        <button className="np-button np-button-primary min-h-10 px-4 py-2 text-xs" onClick={() => persistDraft("Saved")} type="button">Save</button>
      </div>
    </section>
  );
}

function formatSavedTime(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}

function patientDataRow(patient, label, keys) {
  return {
    label,
    meta: "Patient record",
    value: readFirstPatientValue(patient, keys),
  };
}

function readFirstPatientValue(patient, keys) {
  for (const key of keys) {
    const value = patient?.[key];
    if (hasClinicalValue(value)) return value;
  }
  return "Not recorded";
}

function muscleLabRow(patient, labName) {
  const lab = readLabRecord(patient, labName);
  return {
    label: labName,
    meta: lab.status || "Not recorded",
    value: hasClinicalValue(lab.value) ? `${lab.value}${lab.unit ? ` ${lab.unit}` : ""}` : "Not recorded",
  };
}

function readLabRecord(patient, labName) {
  const normalizedName = normalizeLookup(labName);
  const labRows = [
    ...(Array.isArray(patient?.labValues) ? patient.labValues : []),
    ...(Array.isArray(patient?.labs) ? patient.labs : []),
    ...(Array.isArray(patient?.laboratoryResults) ? patient.laboratoryResults : []),
  ];
  const match = labRows.find((lab) => normalizeLookup(lab.label || lab.name || lab.test) === normalizedName);
  const directValue = patient?.[camelizeLookup(labName)] || patient?.[normalizedName];
  return {
    status: match?.status || (hasClinicalValue(match?.value || directValue) ? "Recorded" : "Not recorded"),
    unit: match?.unit || "",
    value: match?.value ?? directValue ?? "Not recorded",
  };
}

function muscleRegionClinicalContext(region, patient) {
  if (region.clinicalGroup === "upper") {
    return [
      "Upper-body strength context",
      `Protein adequacy: ${readFirstPatientValue(patient, ["proteinAdequacy", "proteinIntake", "proteinTarget", "proteinRequirement"])}`,
      `Functional assessment: ${readFirstPatientValue(patient, ["functionalAssessment", "handgripStrength"])}`,
    ].join(" · ");
  }
  if (region.clinicalGroup === "core") {
    return [
      "Core strength and body composition context",
      `Body composition: ${readFirstPatientValue(patient, ["bodyComposition", "estimatedMuscleMass", "muscleMass"])}`,
      `Mobility notes: ${readFirstPatientValue(patient, ["mobilityNotes", "postureNotes", "physicalActivity"])}`,
    ].join(" · ");
  }
  if (region.clinicalGroup === "lower") {
    return [
      "Lower-body strength and mobility context",
      `Calf circumference: ${readFirstPatientValue(patient, ["calfCircumference"])}`,
      `Functional status: ${readFirstPatientValue(patient, ["functionalStatus", "mobilityNotes", "physicalActivity"])}`,
    ].join(" · ");
  }
  return "Global muscle-related assessment context. Clinician review required.";
}

function muscleImpactContext(activeImpactId, patient) {
  if (activeImpactId === "protein") {
    return [
      `Protein intake: ${readFirstPatientValue(patient, ["proteinIntake", "proteinTarget", "proteinRequirement"])}`,
      `Energy intake: ${readFirstPatientValue(patient, ["energyIntake", "energyTarget", "caloriesTarget"])}`,
      `Weight trend: ${readFirstPatientValue(patient, ["weightTrend", "recentWeightChange", "weightChange"])}`,
      "Clinical consideration only; no prescription generated.",
    ].join(" · ");
  }
  if (activeImpactId === "vitamin-d") {
    const vitaminD = readLabRecord(patient, "Vitamin D");
    return `Vitamin D: ${hasClinicalValue(vitaminD.value) ? `${vitaminD.value}${vitaminD.unit ? ` ${vitaminD.unit}` : ""}` : "Not recorded"} · Muscles and Bones shown as related context.`;
  }
  if (activeImpactId === "omega-3") {
    const crp = readLabRecord(patient, "CRP");
    return `Inflammation marker context: CRP ${hasClinicalValue(crp.value) ? `${crp.value}${crp.unit ? ` ${crp.unit}` : ""}` : "Not recorded"} · No causation implied.`;
  }
  return "Select Protein, Vitamin D, or Omega-3 to view muscle-related nutrition impact context.";
}

function hasClinicalValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0) return true;
  return Boolean(value && String(value).trim() && String(value).trim() !== "Not recorded");
}

function normalizeLookup(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function camelizeLookup(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

function cleanClinicalText(value) {
  return String(value || "Not recorded")
    .replaceAll("placeholder", "not recorded")
    .replaceAll("Placeholder", "Not recorded")
    .replaceAll("not connected yet", "not recorded")
    .replaceAll("Not connected yet", "Not recorded")
    .replaceAll("future connection", "recorded data")
    .replaceAll("Future connection", "Recorded data")
    .replaceAll("pending Clinical Hub connection", "not recorded")
    .replaceAll("pending care-plan connection", "not recorded")
    .replaceAll("pending safety workflow", "clinician review required")
    .replaceAll("will appear here", "is not recorded")
    .replaceAll("will read from", "is not recorded in")
    .replace(/\bnot recorded\s+not recorded\b/gi, "Not recorded")
    .replace(/\bNot recorded\s*-\s*Not recorded\b/g, "Not recorded");
}

function summaryList(items = [], fallback) {
  const cleanItems = items.map(cleanClinicalText).filter((item) => item && !/^not recorded$/i.test(item));
  if (!cleanItems.length) return fallback;
  return cleanItems.slice(0, 2).join(" · ");
}

function summaryValue(value, fallback) {
  const cleanValue = cleanClinicalText(value);
  if (!cleanValue || /^not recorded$/i.test(cleanValue) || cleanValue.toLowerCase().includes("not recorded")) return fallback;
  return cleanValue;
}

function statusLabel(status) {
  if (status === "Green") return "Stable / OK";
  if (status === "Yellow") return "Needs Review";
  if (status === "Orange") return "Monitor Closely";
  if (status === "Red") return "High Priority";
  return "No Data";
}

function chipClass(active, emphasis, relationship) {
  if (active) return "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white";
  if (emphasis === "primary") return "border-[var(--np-color-secondary)] bg-[var(--np-color-secondary-soft)] text-[var(--np-color-secondary)]";
  if (emphasis === "secondary") return "border-[var(--np-color-accent)] bg-[var(--np-color-accent-soft)] text-[#8a6a25]";
  if (relationship) return "border-[rgb(122_31_43_/_0.24)] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]";
  return "border-[var(--np-color-border-soft)] bg-white/90 text-[var(--np-color-text)] hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]";
}

function markerButtonClass(active, emphasis, relationship) {
  if (active) return "h-11 w-11 scale-110 border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white shadow-[0_0_0_8px_rgb(122_31_43_/_0.10),0_18px_40px_rgb(122_31_43_/_0.18)]";
  if (emphasis === "primary") return "h-9 w-9 scale-105 border-[var(--np-color-secondary)] bg-[var(--np-color-secondary-soft)] text-[var(--np-color-secondary)]";
  if (emphasis === "secondary") return "h-9 w-9 scale-105 border-[var(--np-color-accent)] bg-[var(--np-color-accent-soft)] text-[#8a6a25]";
  if (relationship) return "h-9 w-9 scale-105 border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]";
  return "h-8 w-8 border-white bg-white text-[var(--np-color-text)] hover:scale-105 hover:border-[var(--np-color-brand)]";
}

function nutriMapStatusBadge(status) {
  if (status === "Red") return "np-badge np-badge-danger";
  if (status === "Orange") return "np-badge np-badge-warning";
  if (status === "Yellow") return "np-badge np-badge-accent";
  return "np-badge np-badge-success";
}

function nutriMapStatusDot(status) {
  if (status === "Red") return "bg-[var(--np-color-danger)]";
  if (status === "Orange") return "bg-[var(--np-color-warning)]";
  if (status === "Yellow") return "bg-[var(--np-color-accent)]";
  return "bg-[var(--np-color-success)]";
}








