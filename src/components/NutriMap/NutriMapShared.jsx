import { useEffect, useState } from "react";
import { Activity, Brain, ChevronDown, ClipboardList, FlaskConical, Network, StickyNote, Target, X } from "lucide-react";
import { useTranslation } from "../../i18n";
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

export function NutriMapClinicalPanel({ activePatient, compact = false, onCollapse, onClose, onOpenAiCenter, onOpenClinicalHub, onOpenDietPlan, onOpenLabs, onCreateTask, onGenerateReport, selectOrgan, organSummary, patientWorkflow, system, systems = [], updatePatient }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const tabs = [
    { id: "overview", label: "Overview", icon: ClipboardList },
    { id: "labs", label: "Labs", icon: FlaskConical },
    { id: "assessment", label: "Assessment", icon: Activity },
    { id: "intervention", label: "Intervention", icon: Target },
    { id: "ai", label: "AI", icon: Brain },
    { id: "research", label: "Research", icon: Network },
    { id: "notes", label: "Notes", icon: StickyNote },
  ];
  const relatedSystems = system.connections.map((systemId) => systems.find((item) => item.id === systemId)).filter(Boolean);
  const activeSections = buildLiveTabSections(activeTab, system, organSummary, patientWorkflow);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.debug("PANEL_ORGAN", system?.id);
  }, [system?.id]);

  return (
    <aside className="flex flex-col bg-white">
      <div className="sticky top-0 z-10 border-b border-[var(--np-color-border-soft)] bg-white/95 p-4 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">{t("nutrimap.organIntelligencePanel")}</p>
            <h3 className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-extrabold text-[var(--np-color-text)]`}>{system.label}</h3>
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
      </div>

      <div className="p-4">
        <OrganStatusSummary organSummary={organSummary} patientWorkflow={patientWorkflow} system={system} />

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
export function NutriMapStage({ activeLayer, activeLayerId, selectedOrganId, drawerOpen = false, impactEmphasis = {}, systems, selectOrgan, size = "large" }) {
  return (
    <NutriMapModelStage
      activeLayer={activeLayer}
      activeLayerId={activeLayerId}
      drawerOpen={drawerOpen}
      impactEmphasis={impactEmphasis}
      selectOrgan={selectOrgan}
      selectedOrganId={selectedOrganId}
      size={size}
      systems={systems}
    />
  );
}

function OrganStatusSummary({ organSummary, patientWorkflow, system }) {
  const { t } = useTranslation();
  const summary = system.statusSummary;
  const stepStatus = (stepId, fallback) => patientWorkflow?.steps?.find((step) => step.id === stepId)?.status || fallback;
  const labSummary = organSummary?.labs?.filter((lab) => lab.value !== "Not recorded").slice(0, 2).map((lab) => `${lab.label}: ${lab.value}${lab.unit ? ` ${lab.unit}` : ""}`).join(" · ");
  const assessmentSummary = organSummary?.fields?.filter((field) => field.value !== "Not recorded").slice(0, 2).map((field) => field.label).join(" · ");
  const items = [
    [t("nutrimap.summary.currentStatus"), statusLabel(system.status)],
    [t("nutrimap.summary.laboratoryMarkers"), labSummary || summaryList(summary.relatedLabs, "No related laboratory result"), stepStatus("labs", "Not recorded")],
    [t("nutrimap.summary.assessments"), assessmentSummary || summaryList(summary.relatedAssessments, "No assessment recorded"), stepStatus("assessment", "Not recorded")],
    [t("nutrimap.summary.nutritionDiagnosis"), summaryValue(summary.relatedDiagnosis, "No nutrition diagnosis linked"), stepStatus("pes", "Not recorded")],
    [t("nutrimap.summary.intervention"), summaryValue(summary.relatedIntervention, "No intervention linked"), stepStatus("intervention", "Not recorded")],
    [t("nutrimap.summary.monitoring"), summaryValue(summary.monitoringStatus, "No monitoring entry"), stepStatus("monitoring", "Not recorded")],
    [t("nutrimap.summary.aiReview"), summaryValue(summary.aiReviewStatus, "No AI review recorded"), stepStatus("ai", "Not recorded")],
    [t("nutrimap.summary.reportReadiness"), summaryValue(summary.reportReadiness, "Report not ready"), stepStatus("reports", "Not recorded")],
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

function buildLiveTabSections(activeTab, system, organSummary, patientWorkflow) {
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
    ];
  }

  if (activeTab === "intervention") {
    const pesStatus = patientWorkflow?.steps?.find((step) => step.id === "pes")?.status || "Not recorded";
    const interventionStatus = patientWorkflow?.steps?.find((step) => step.id === "intervention")?.status || "No intervention linked";
    const dietPlanStatus = patientWorkflow?.steps?.find((step) => step.id === "dietPlan")?.status || "No active diet plan";
    return [
      { title: "Nutrition diagnosis", value: pesStatus },
      { title: "Nutrition intervention", value: interventionStatus },
      { title: "Diet plan", value: dietPlanStatus },
    ];
  }

  if (activeTab === "ai") {
    return [
      { title: "Rule-based clinical considerations", items: ["Based only on available patient data", `${organSummary?.missingCount || 0} mapped item(s) missing`, "Clinician review required"] },
      { title: "AI safety", value: "No diagnosis or prescription is generated from NutriMap." },
    ];
  }

  if (activeTab === "research") {
    return [
      { title: "Research context", value: "No de-identified research integration is connected for this organ yet." },
      { title: "Safety boundary", value: "Research data is not mixed with patient care data." },
    ];
  }

  return [
    { title: "Current Clinical Status", value: organSummary?.status || statusLabel(system.status) },
    { title: "Main Concern", value: organSummary?.missingCount ? `${organSummary.missingCount} mapped item(s) missing.` : "No mapped data gap detected." },
    { title: "Clinical Notes", value: system.focus },
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
  const [saveStatus, setSaveStatus] = useState("Saved");

  useEffect(() => {
    const hasChanged =
      draft.note !== savedNote ||
      draft.followUpReminder !== (savedDetails.followUpReminder || "") ||
      draft.monitoringNote !== (savedDetails.monitoringNote || "") ||
      draft.reviewStatus !== (savedDetails.reviewStatus || "Needs Review");

    if (!hasChanged) return undefined;
    const timer = window.setTimeout(() => {
      setSaveStatus("Saving...");
      updatePatient?.({
        ...activePatient,
        organClinicalDetails: {
          ...(activePatient?.organClinicalDetails || {}),
          [organId]: {
            followUpReminder: draft.followUpReminder,
            monitoringNote: draft.monitoringNote,
            reviewStatus: draft.reviewStatus,
            savedAt: new Date().toISOString(),
          },
        },
        organClinicalNotes: {
          ...(activePatient?.organClinicalNotes || {}),
          [organId]: draft.note,
        },
      });
      setSaveStatus("Saved just now");
    }, 1700);

    return () => window.clearTimeout(timer);
  }, [activePatient, draft, organId, savedDetails.followUpReminder, savedDetails.monitoringNote, savedDetails.reviewStatus, savedNote, updatePatient]);

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
        <button className="np-button np-button-primary min-h-10 px-4 py-2 text-xs" onClick={() => updatePatient?.({ ...activePatient, organClinicalNotes: { ...(activePatient?.organClinicalNotes || {}), [organId]: draft.note }, organClinicalDetails: { ...(activePatient?.organClinicalDetails || {}), [organId]: { ...draft, savedAt: new Date().toISOString() } } })} type="button">Save</button>
      </div>
    </section>
  );
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






