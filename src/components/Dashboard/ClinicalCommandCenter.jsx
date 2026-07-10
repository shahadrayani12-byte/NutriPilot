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
  Search,
  Stethoscope,
  Sun,
  Users,
} from "lucide-react";

import { commandCenterPatients as patients } from "../../data/patientData";
import { NutriMapStage } from "../NutriMap/NutriMapShared";
import { NUTRIMAP_SYSTEMS, getNutriMapSystem } from "../../data/nutrimapSystems";

const scheduleTimes = ["08:00 AM", "09:00 AM", "10:30 AM"];
const scheduleEndTimes = ["09:00 AM", "10:00 AM", "11:30 AM"];
const appointmentTags = ["Low Ferritin", "Protein Assessment", "Growth Monitoring"];

function normalizeDashboardPatient(patient) {
  if (!patient) return patients[0];
  if (patient.name) return patient;

  return {
    ...patients[0],
    ...patient,
    condition: patient.diagnosis || patient.condition || patients[0].condition,
    name: patient.fullName || patient.name || patients[0].name,
    risk: patient.riskLevel?.includes("High") ? "High" : patient.riskLevel?.includes("Moderate") ? "Medium" : "Low",
  };
}

export default function ClinicalCommandCenter({ activePatient, openClinicalHub, openNutriMap, openResearch, setActivePatient, workflow }) {
  const [selectedPatient, setSelectedPatient] = useState(normalizeDashboardPatient(activePatient));
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOrgan, setActiveOrgan] = useState("gastrointestinal");


  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );
  const highRiskCount = patients.filter((patient) => patient.risk === "High").length;
  const lowFerritinCount = patients.filter((patient) => Number(patient.labs.ferritin) < 15).length;
  const vitaminDDeficiencyCount = patients.filter((patient) => Number(patient.labs.vitaminD) < 20).length;
  const labReviewCount = patients.filter((patient) => {
    const ferritin = Number(patient.labs.ferritin);
    const hb = Number(patient.labs.hb);
    const vitaminD = Number(patient.labs.vitaminD);

    return ferritin < 15 || hb < 12 || vitaminD < 20;
  }).length;

  return (
    <div className="min-h-screen bg-[var(--np-color-surface-page)] font-[var(--np-font-family-sans)] text-[var(--np-color-text)]">
      <TopBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <main className="px-7 pb-8 pt-6">
        <WelcomeBand
          highRiskCount={highRiskCount}
          labReviewCount={labReviewCount}
          selectedPatient={selectedPatient}
        />

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Active Patients"
            value={patients.length}
            note="clinical queue"
            icon={Users}
            tone="secondary"
            trend="up"
          />
          <MetricCard
            title="Low Ferritin Cases"
            value={lowFerritinCount}
            note="needs review"
            icon={DropletIcon}
            tone="brand"
            trend="up"
          />
          <MetricCard
            title="Vitamin D Deficiency"
            value={vitaminDDeficiencyCount}
            note="micronutrient risk"
            icon={Sun}
            tone="accent"
            trend="up"
          />
          <MetricCard
            title="Nutrition Risk (MUST)"
            value={highRiskCount}
            note="high priority"
            icon={ClipboardList}
            tone="info"
            trend="steady"
          />
          <MetricCard
            title="Critical Alerts"
            value={labReviewCount}
            note="requires attention"
            icon={AlertTriangle}
            tone="danger"
            trend="up"
          />
        </section>

        <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[340px_minmax(0,1fr)_340px] xl:items-stretch">
          <SchedulePanel
            openClinicalHub={openClinicalHub}
            patients={filteredPatients}
            selectedPatient={selectedPatient}
            setSelectedPatient={(patient) => {
              setSelectedPatient(patient);
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

        <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr] 2xl:grid-cols-[1.05fr_0.95fr_0.95fr_0.95fr]">
          <LaboratorySummary patient={selectedPatient} />
          <ResearchActivity openResearch={openResearch} />
          <QuickActions
            openClinicalHub={openClinicalHub}
            setSelectedPatient={(patient) => {
              setSelectedPatient(patient);
              setActivePatient(patient);
            }}
          />
          <RecentDocuments patient={selectedPatient} />
        </section>
      </main>
    </div>
  );
}

function TopBar({ searchTerm, setSearchTerm }) {
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
            placeholder="Search patient by name, MRN, phone..."
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
          Today's Appointments
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
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">Dr. Shahad</p>
            <p className="text-xs font-bold text-[var(--np-color-text-muted)]">Clinical Nutritionist</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function WelcomeBand({ highRiskCount, labReviewCount, selectedPatient }) {
  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(520px,0.95fr)]">
      <div className="rounded-[28px] bg-[var(--np-color-surface-page)] px-2 py-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--np-color-brand)]">
          Clinical Nutrition Intelligence
        </p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-[var(--np-color-text)]">
          Good Morning, Dr. Shahad
        </h1>
        <p className="mt-2 text-base font-bold text-[var(--np-color-text-muted)]">
          Here's what's happening with your patients today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-[24px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-card)] md:grid-cols-3">
        <ContextItem icon={CalendarDays} label="Date" value="May 18, 2025" />
        <ContextItem icon={Stethoscope} label="Hospital" value="Jazan University Hospital" />
        <ContextItem icon={Users} label="Department" value="Clinical Nutrition" />
        <div className="md:col-span-3">
          <p className="text-xs font-bold text-[var(--np-color-text-muted)]">
            {highRiskCount} high-risk patient • {labReviewCount} lab reviews • Focus: {displayText(selectedPatient.diagnosis)}
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricCard({ title, value, note, icon: Icon, tone, trend }) {
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
          {trend === "steady" ? "stable" : "↑ today"}
        </span>
      </div>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{note}</p>
      <Sparkline tone={tone} />
    </article>
  );
}

function SchedulePanel({ openClinicalHub, patients, selectedPatient, setSelectedPatient }) {
  return (
    <Panel action="View all" className="h-full" icon={CalendarDays} title="Today's Schedule">
      <div className="space-y-3">
        {patients.map((patient, index) => (
          <button
            key={patient.name}
            onClick={() => setSelectedPatient(patient)}
            className={`grid w-full grid-cols-[74px_42px_minmax(0,1fr)_auto] items-center gap-4 rounded-[18px] border-l-2 bg-white p-3 text-left transition hover:bg-[var(--np-color-surface-muted)] ${
              selectedPatient.name === patient.name
                ? "border-l-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)]"
                : "border-l-[var(--np-color-secondary)]"
            }`}
            type="button"
          >
            <div>
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">{scheduleTimes[index] || "01:30 PM"}</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{scheduleEndTimes[index] || "02:30 PM"}</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--np-color-secondary-soft)] text-sm font-extrabold text-[var(--np-color-text)]">
              {patient.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[var(--np-color-text)]">{patient.name}</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]">
                {patient.age} y, {patient.gender}
              </p>
            </div>
            <span className={tagClass(patient.risk)}>{appointmentTags[index] || patient.risk}</span>
          </button>
        ))}
      </div>

      <button
        className="np-button np-button-primary mt-4 w-full"
        onClick={() => openClinicalHub(selectedPatient)}
        type="button"
      >
        Open Clinical Hub
      </button>

      {patients.length === 0 && (
        <p className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
          No patients found.
        </p>
      )}

      <button className="np-button np-button-primary mx-auto mt-5 w-full max-w-[220px]" type="button">
        <Plus className="h-4 w-4" />
        New Appointment
      </button>
    </Panel>
  );
}

function NutriMapPanel({ activeOrgan, openNutriMap, patientWorkflow, setActiveOrgan }) {
  const selectedSystem = getNutriMapSystem(activeOrgan);
  const indicators = buildNutriMapPreviewIndicators(selectedSystem, patientWorkflow);

  return (
    <Panel action="Open NutriMap" icon={Activity} onAction={openNutriMap} title="NutriMap™ Preview">
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
              Selected Organ
            </p>
            <div className="mt-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-[var(--np-color-text)]">{selectedSystem.label}</h3>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
                  Compact clinical navigation preview
                </p>
              </div>
              <span className={nutriMapPreviewStatusClass(selectedSystem.status)}>{selectedSystem.status}</span>
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

          <button className="np-button np-button-primary w-full" onClick={openNutriMap} type="button">
            Open NutriMap
          </button>
        </div>
      </div>
    </Panel>
  );
}

function buildNutriMapPreviewIndicators(system, patientWorkflow) {
  const summary = system.statusSummary;
  const stepStatus = (stepId, fallback) =>
    patientWorkflow?.steps?.find((step) => step.id === stepId)?.status || fallback;

  return [
    { label: "Related labs", value: summary.relatedLabs.slice(0, 2).join(", ") || "Placeholder labs" },
    { label: "Assessment", value: stepStatus("assessment", "Placeholder") },
    { label: "AI review", value: stepStatus("ai", summary.aiReviewStatus) },
    { label: "Report readiness", value: stepStatus("reports", summary.reportReadiness) },
  ];
}

function nutriMapPreviewStatusClass(status) {
  if (status === "Red") return "np-badge np-badge-danger";
  if (status === "Orange") return "np-badge np-badge-warning";
  if (status === "Yellow") return "np-badge np-badge-accent";
  return "np-badge np-badge-success";
}
function AIInsightsPanel({ patient, labReviewCount }) {
  const insights = [
    {
      icon: DropletIcon,
      title: `${labReviewCount} patients require Ferritin level review`,
      detail: "Based on latest lab results",
      tone: "brand",
    },
    {
      icon: AlertTriangle,
      title: `${patient.risk === "High" ? 2 : 1} patient at high nutrition risk`,
      detail: "Recommend MUST screening",
      tone: "warning",
    },
    {
      icon: Activity,
      title: `${patient.nutrition.fiber === "Low" ? 1 : 0} patient shows poor dietary adherence`,
      detail: "AI suggested intervention available",
      tone: "info",
    },
    {
      icon: Sun,
      title: "Vitamin D deficiency trend increased",
      detail: "Consider group education session",
      tone: "accent",
    },
  ];

  return (
    <Panel action="See all" className="h-full" icon={Brain} title="AI Clinical Insights">
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
                <span className="block text-sm font-extrabold text-[var(--np-color-text)]">{insight.title}</span>
                <span className="mt-1 block text-xs font-bold text-[var(--np-color-text-muted)]">{insight.detail}</span>
              </span>
              <span className="text-lg text-[var(--np-color-text-muted)]">&rsaquo;</span>
            </button>
          );
        })}
      </div>
      <button className="np-button np-button-secondary mt-5 w-full text-[var(--np-color-brand)]" type="button">
        <Brain className="h-4 w-4" />
        Open AI Assistant
      </button>
    </Panel>
  );
}

function LaboratorySummary({ patient }) {
  const labs = [
    ["Ferritin", patient.labs.ferritin, "ug/L"],
    ["Vitamin D", patient.labs.vitaminD, "ng/L"],
    ["Hemoglobin", patient.labs.hb, "g/dL"],
    ["Albumin", patient.labs.albumin, "g/dL"],
  ];

  return (
    <Panel action="View all labs" className="h-full" icon={FlaskConical} title="Laboratory Summary">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
        {labs.map(([label, value, unit], index) => (
          <div key={label} className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4">
            <p className="text-xs font-extrabold text-[var(--np-color-brand)]">
              {label} <span className="text-[var(--np-color-text-muted)]">({unit})</span>
            </p>
            <h3 className="mt-4 text-3xl font-extrabold text-[var(--np-color-text)]">{value}</h3>
            <p className="mt-1 text-xs font-bold text-emerald-700">↑ today</p>
            <MiniBars index={index} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ResearchActivity({ openResearch }) {
  return (
    <Panel action="Open Research" className="h-full" icon={Stethoscope} onAction={openResearch} title="Research Activity">
      <h3 className="text-lg font-extrabold text-[var(--np-color-text)]">IBS Study: Oral-Gut Axis</h3>
      <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">Cross-sectional Study</p>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <ResearchMetric label="Participants" value="73" />
        <ResearchMetric label="Plaque Samples" value="18" />
        <ResearchMetric label="Dietary Records" value="56" />
        <ResearchMetric label="Lab Results" value="32" />
      </div>
      <div className="mt-5 flex items-center justify-between text-xs font-extrabold text-[var(--np-color-text-muted)]">
        <span>Progress</span>
        <span>68%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[var(--np-color-border-soft)]">
        <div className="h-full w-[68%] rounded-full bg-[var(--np-color-brand)]" />
      </div>
    </Panel>
  );
}

function QuickActions({ openClinicalHub, setSelectedPatient }) {
  const actions = [
    ["New Patient", Users, patients[0]],
    ["Nutrition Assessment", ClipboardList, patients[0]],
    ["Diet Plan", Apple, patients[1] || patients[0]],
    ["AI Analysis", Brain, patients[2] || patients[0]],
    ["Diet Analysis", Activity, patients[0]],
    ["Generate Report", FileText, patients[2] || patients[0]],
  ];

  return (
    <Panel className="h-full" icon={Plus} title="Quick Actions">
      <div className="grid grid-cols-2 gap-3">
        {actions.map(([label, Icon, patient]) => (
          <button
            key={label}
            onClick={() => {
              setSelectedPatient(patient);
              if (["Nutrition Assessment", "Diet Plan", "AI Analysis", "Generate Report"].includes(label)) {
                openClinicalHub(patient);
              }
            }}
            className="flex min-h-[92px] items-center gap-3 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4 text-left text-sm font-extrabold text-[var(--np-color-text)] transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]"
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

function RecentDocuments({ patient }) {
  const docs = [
    `${patient.name} - Assessment Report`,
    "IBS Study - Weekly Report",
    `Nutrition Plan - ${patients[2]?.name || patient.name}`,
  ];

  return (
    <Panel action="View all" className="h-full" icon={FileText} title="Recent Documents">
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
              <p className="truncate text-xs font-extrabold text-[var(--np-color-text)]">{doc}</p>
              <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                PDF • {index + 1}h ago
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
          <h2 className="text-lg font-extrabold text-[var(--np-color-text)]">{displayText(title)}</h2>
        </div>
        {action ? (
          <button
            className="rounded-[10px] border border-[var(--np-color-border)] bg-white px-3 py-2 text-xs font-extrabold text-[var(--np-color-text)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
            onClick={onAction}
            type="button"
          >
            {action}
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
        <span className="mt-1 block text-sm font-extrabold text-[var(--np-color-text)]">{value}</span>
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











