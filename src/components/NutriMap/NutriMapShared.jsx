import { useState } from "react";
import { Activity, Brain, ClipboardList, FlaskConical, Network, StickyNote, Target } from "lucide-react";

export function HumanBodyPlaceholder({ size = "large" }) {
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
        Future 3D body model area
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

export function NutriMapClinicalPanel({ compact = false, onOpenAiCenter, onOpenClinicalHub, onOpenLabs, onCreateTask, onGenerateReport, onSelectSystem, patientWorkflow, system, systems = [] }) {
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
  const activeSections = system.tabContent?.[activeTab] || [];

  return (
    <aside className={`rounded-[24px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-card)] transition ${compact ? "p-4" : "p-5"}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">Organ Intelligence Panel</p>
          <h3 className={`${compact ? "text-xl" : "text-2xl"} mt-2 font-extrabold text-[var(--np-color-text)]`}>{system.label}</h3>
        </div>
        <span className={nutriMapStatusBadge(system.status)}>{system.status}</span>
      </div>

      <OrganStatusSummary patientWorkflow={patientWorkflow} system={system} />

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-extrabold transition ${isActive ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white" : "border-[var(--np-color-border)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"}`} key={tab.id} onClick={() => setActiveTab(tab.id)} type="button">
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3" key={`${system.id}-${activeTab}`}>
        {activeSections.map((section) => <NutriMapPanelSection key={section.title} section={section} />)}
      </div>

      <NutritionConnections relatedSystems={relatedSystems} onSelectSystem={onSelectSystem} />
      <OrganTimeline timeline={system.timeline} />
      <OrganQuickActions onCreateTask={onCreateTask} onGenerateReport={onGenerateReport} onOpenAiCenter={onOpenAiCenter} onOpenClinicalHub={onOpenClinicalHub} onOpenLabs={onOpenLabs} />
    </aside>
  );
}

export function NutriMapStage({ activeSystemId, impactEmphasis = {}, systems, onSelectSystem, size = "large" }) {
  const isPreview = size === "preview";
  const activeSystem = systems.find((system) => system.id === activeSystemId);
  const relationshipIds = activeSystem?.connections || [];

  return (
    <div className={`relative overflow-hidden rounded-[32px] border border-[var(--np-color-border-soft)] bg-[radial-gradient(circle_at_center,var(--np-color-secondary-soft),var(--np-color-surface-muted)_58%,white)] ${isPreview ? "p-3" : "p-4"}`}>
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(95_168_163_/_0.22)] ${isPreview ? "h-[360px] w-[220px]" : "h-[560px] w-[330px]"}`} />
      <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgb(201_168_106_/_0.3)] ${isPreview ? "h-[270px] w-[155px]" : "h-[420px] w-[235px]"}`} />

      <div className={`relative z-10 flex items-center justify-center ${isPreview ? "py-2" : "min-h-[560px]"}`}>
        <HumanBodyPlaceholder size={size} />
        <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${isPreview ? "h-[340px] w-[195px]" : "h-[640px] w-[360px]"}`}>
          <RelationshipLines activeSystem={activeSystem} systems={systems} />
          {systems.map((system) => (
            <NutriMapBodyRegion
              key={system.id}
              active={activeSystemId === system.id}
              emphasis={impactEmphasis[system.id] || "none"}
              label={system.label}
              position={system.bodyPosition}
              relationship={relationshipIds.includes(system.id)}
              status={system.status}
              onClick={() => onSelectSystem(system.id)}
            />
          ))}
        </div>

      </div>


    </div>
  );
}

function RelationshipLines({ activeSystem, systems }) {
  if (!activeSystem?.mapPoint) return null;

  return (
    <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
      {activeSystem.connections.map((systemId) => {
        const target = systems.find((system) => system.id === systemId);
        if (!target?.mapPoint) return null;
        return (
          <line className="nutrimap-relationship-line" key={systemId} x1={activeSystem.mapPoint.x} y1={activeSystem.mapPoint.y} x2={target.mapPoint.x} y2={target.mapPoint.y} />
        );
      })}
    </svg>
  );
}

function OrganStatusSummary({ patientWorkflow, system }) {
  const summary = system.statusSummary;
  const stepStatus = (stepId, fallback) => patientWorkflow?.steps?.find((step) => step.id === stepId)?.status || fallback;
  const items = [
    ["Current status", system.status],
    ["Laboratory markers", `${summary.relatedLabs.join(", ")} - ${stepStatus("labs", "Placeholder")}`],
    ["Assessments", `${summary.relatedAssessments.join(", ")} - ${stepStatus("assessment", "Placeholder")}`],
    ["Nutrition diagnosis", `${summary.relatedDiagnosis} - ${stepStatus("pes", "Placeholder")}`],
    ["Intervention", `${summary.relatedIntervention} - ${stepStatus("intervention", "Placeholder")}`],
    ["Monitoring", `${summary.monitoringStatus} - ${stepStatus("monitoring", "Placeholder")}`],
    ["AI review", `${summary.aiReviewStatus} - ${stepStatus("ai", "Placeholder")}`],
    ["Report readiness", `${summary.reportReadiness} - ${stepStatus("reports", "Placeholder")}`],
  ];

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="rounded-[14px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={label}>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{label}</p>
          <p className="mt-1 text-xs font-extrabold leading-5 text-[var(--np-color-text)]">{value}</p>
        </div>
      ))}
    </div>
  );
}

function NutritionConnections({ relatedSystems, onSelectSystem }) {
  if (!relatedSystems.length) return null;
  return (
    <section className="mt-4 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]"><Network className="h-4 w-4" />Organ Relationships</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {relatedSystems.map((system) => (
          <button className="rounded-full border border-[var(--np-color-border)] bg-white px-3 py-1.5 text-xs font-extrabold text-[var(--np-color-text)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]" key={system.id} onClick={() => onSelectSystem(system.id)} type="button">
            {system.shortLabel || system.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function OrganTimeline({ timeline = [] }) {
  if (!timeline.length) return null;
  return (
    <section className="mt-4 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">Organ Timeline</p>
      <div className="mt-3 space-y-2">
        {timeline.map((item) => (
          <div className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3" key={item.stage}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-extrabold text-[var(--np-color-text)]">{item.stage}</p>
                <p className="text-[11px] font-bold text-[var(--np-color-text-muted)]">{item.date}</p>
              </div>
              <span className="np-badge np-badge-secondary">{item.status}</span>
            </div>
            <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">{item.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function OrganQuickActions({ onCreateTask, onGenerateReport, onOpenAiCenter, onOpenClinicalHub, onOpenLabs }) {
  const actions = [
    ["Clinical Hub", onOpenClinicalHub],
    ["AI Center", onOpenAiCenter],
    ["Laboratory Results", onOpenLabs],
    ["Reports", onGenerateReport],
    ["Follow-up task", onCreateTask],
  ];
  return (
    <section className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
      {actions.map(([label, handler]) => (
        <button className="rounded-[14px] border border-[var(--np-color-border)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]" key={label} onClick={handler} type="button">
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
      {section.items ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {section.items.map((item) => <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--np-color-text)]" key={item}>{item}</span>)}
        </div>
      ) : (
        <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text)]">{section.value}</p>
      )}
    </div>
  );
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



