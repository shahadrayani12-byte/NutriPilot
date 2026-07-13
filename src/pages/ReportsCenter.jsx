import { useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Eye,
  FileText,
  History,
  Layers,
  PenLine,
  Printer,
  RotateCcw,
  Save,
  Share2,
  ShieldCheck,
  X,
} from "lucide-react";

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
import { managedPatients } from "../data/patientData";
import { useTranslation } from "../i18n";
import { getWorkflowNextAction, getWorkflowStatus } from "../utils/workflowStatus";

const reportTypes = [
  {
    id: "full-clinical",
    title: "Full Clinical Nutrition Report",
    description: "Complete clinical nutrition documentation for assessment, diagnosis, intervention, monitoring, and review.",
  },
  {
    id: "anthropometric",
    title: "Anthropometric Assessment",
    description: "Height, weight, BMI, body weight history, and nutrition assessment indicators.",
  },
  {
    id: "laboratory",
    title: "Laboratory Results",
    description: "Nutrition-related laboratory values, review status, and clinician verification placeholders.",
  },
  {
    id: "dietary",
    title: "Dietary Assessment",
    description: "Diet recall, meal pattern, intake barriers, symptoms, and nutrition risk context.",
  },
  {
    id: "medical",
    title: "Medical History",
    description: "Diagnosis, medication review, allergies, symptoms, and lifestyle context.",
  },
  {
    id: "pes",
    title: "Nutrition Diagnosis (PES)",
    description: "PES statements, priority, status, and clinician review history.",
  },
  {
    id: "intervention",
    title: "Nutrition Intervention",
    description: "Goals, nutrition prescription, education, counseling notes, and follow-up plan.",
  },
  {
    id: "monitoring",
    title: "Monitoring & Evaluation",
    description: "Follow-up visits, progress status, lab follow-up, and next appointment planning.",
  },
  {
    id: "follow-up",
    title: "Follow-up Report",
    description: "Compact progress note for follow-up visits, monitoring items, and next steps.",
  },
  {
    id: "ai-summary",
    title: "AI Clinical Summary",
    description: "Rule-based AI brief, limitations, missing data, and clinician review placeholders.",
  },
  {
    id: "research",
    title: "Research Summary",
    description: "Research activity, data readiness, study progress, and publication preparation context.",
  },
  {
    id: "discharge",
    title: "Discharge Nutrition Summary",
    description: "Clinical handover summary, discharge nutrition plan, and continuity-of-care placeholders.",
  },
];

const defaultSections = [
  { id: "patient-info", title: "Patient Information", workflowStep: "summary", included: true, incomplete: false },
  { id: "anthropometric", title: "Anthropometric Assessment", workflowStep: "assessment", included: true, incomplete: false },
  { id: "labs", title: "Laboratory Results", workflowStep: "labs", included: true, incomplete: true },
  { id: "dietary", title: "Dietary Assessment", workflowStep: "dietary", included: true, incomplete: false },
  { id: "medical", title: "Medical History", workflowStep: "medical", included: true, incomplete: false },
  { id: "pes", title: "Nutrition Diagnosis (PES)", workflowStep: "pes", included: true, incomplete: true },
  { id: "intervention", title: "Nutrition Intervention", workflowStep: "intervention", included: true, incomplete: true },
  { id: "monitoring", title: "Monitoring & Evaluation", workflowStep: "monitoring", included: true, incomplete: true },
  { id: "ai", title: "AI Review", workflowStep: "ai", included: true, incomplete: true },
  { id: "notes", title: "Clinical Notes", workflowStep: "summary", included: true, incomplete: false },
  { id: "follow-up", title: "Follow-up Plan", workflowStep: "monitoring", included: true, incomplete: true },
  { id: "signature", title: "Signature", workflowStep: "reports", included: true, incomplete: false },
];

const generationSteps = [
  "Collecting patient information",
  "Reviewing assessment data",
  "Checking laboratory results",
  "Building nutrition care summary",
  "Preparing preview",
  "Report ready",
];

const comparisonRows = [
  ["Weight", "64 kg", "63 kg", "Placeholder trend only"],
  ["BMI", "23.5", "23.1", "Placeholder trend only"],
  ["Ferritin", "42", "48", "Placeholder lab comparison"],
  ["Vitamin D", "31", "34", "Placeholder lab comparison"],
  ["Hemoglobin", "15", "14.8", "Placeholder lab comparison"],
  ["Nutrition diagnosis", "Active PES", "Monitoring", "Placeholder diagnosis status"],
  ["Intervention progress", "In progress", "Improving", "Placeholder intervention progress"],
  ["Follow-up status", "Scheduled", "Completed", "Placeholder follow-up status"],
];

export default function ReportsCenter({
  activePatient,
  completeWorkflowStep,
  onOpenClinicalHub,
  reportsState,
  setActivePatient,
  sharedPatients = managedPatients,
  updateReport,
}) {
  const { language } = useTranslation();
  const [selectedPatientId, setSelectedPatientId] = useState(activePatient?.id || managedPatients[0]?.id || "");
  const [selectedReportId, setSelectedReportId] = useState(reportTypes[0].id);
  const [sections, setSections] = useState(defaultSections);
  const [generationIndex, setGenerationIndex] = useState(-1);
  const [compareOpen, setCompareOpen] = useState(false);
  const [reportHistory, setReportHistory] = useState(() => buildInitialHistory(reportsState));
  const patientOptions = useMemo(
    () =>
      activePatient?.id && !sharedPatients.some((patient) => patient.id === activePatient.id)
        ? [activePatient, ...sharedPatients]
        : sharedPatients,
    [activePatient, sharedPatients],
  );

  const currentSelectedPatientId = activePatient?.id || selectedPatientId;

  const selectedPatient = useMemo(
    () =>
      patientOptions.find((patient) => patient.id === currentSelectedPatientId) ||
      managedPatients.find((patient) => patient.id === currentSelectedPatientId) ||
      (activePatient?.id === currentSelectedPatientId ? activePatient : null) ||
      activePatient ||
      managedPatients[0],
    [activePatient, currentSelectedPatientId, patientOptions],
  );
  const selectedReport = reportTypes.find((report) => report.id === selectedReportId) || reportTypes[0];
  const workflow = getWorkflowStatus(selectedPatient);
  const nextAction = getWorkflowNextAction(selectedPatient);
  const readiness = calculateReadiness(sections, workflow, generationIndex);
  const timeline = buildReportTimeline(reportHistory);
  const generating = generationIndex >= 0 && generationIndex < generationSteps.length - 1;

  function handlePatientChange(patientId) {
    const patient = patientOptions.find((item) => item.id === patientId) || managedPatients.find((item) => item.id === patientId) || activePatient || managedPatients[0];
    setSelectedPatientId(patientId);
    setActivePatient?.(patient);
  }

  async function generateReport() {
    if (generating) return;

    setGenerationIndex(0);
    for (let index = 0; index < generationSteps.length; index += 1) {
      setGenerationIndex(index);
      await delay(420);
    }

    const generatedAt = new Date().toLocaleString();
    const historyItem = {
      author: "Dr. Shahad",
      date: generatedAt,
      id: `report-${Date.now()}`,
      status: "Ready to Export",
      title: selectedReport.title,
      version: `v${reportHistory.length + 1}.0`,
    };

    setReportHistory((items) => [historyItem, ...items]);
    updateReport?.(selectedReport.id, { lastGenerated: generatedAt, status: "Ready" });
    completeWorkflowStep?.("reports", selectedPatient);
  }

  function saveDraft() {
    const draftAt = new Date().toLocaleString();
    setReportHistory((items) => [
      {
        author: "Dr. Shahad",
        date: draftAt,
        id: `draft-${Date.now()}`,
        status: "Draft",
        title: selectedReport.title,
        version: `v${items.length + 1}.0`,
      },
      ...items,
    ]);
  }

  function duplicateLatest() {
    const latest = reportHistory[0];
    if (!latest) return;

    setReportHistory((items) => [
      {
        ...latest,
        date: new Date().toLocaleString(),
        id: `duplicate-${Date.now()}`,
        status: "Draft",
        title: `${latest.title} Copy`,
        version: `v${items.length + 1}.0`,
      },
      ...items,
    ]);
  }

  function updateSection(sectionId, updates) {
    setSections((items) =>
      items.map((section) => (section.id === sectionId ? { ...section, ...updates } : section)),
    );
  }

  function moveSection(sectionId, direction) {
    setSections((items) => {
      const index = items.findIndex((section) => section.id === sectionId);
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) return items;

      const nextItems = [...items];
      const [movedSection] = nextItems.splice(index, 1);
      nextItems.splice(nextIndex, 0, movedSection);
      return nextItems;
    });
  }

  function resetSections() {
    setSections(defaultSections);
  }

  return (
    <NutriPage data-language={language}>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">Studio v2.0</NutriBadge>
              <NutriBadge tone={readiness.statusTone}>{readiness.status}</NutriBadge>
            </>
          }
          kicker="Reports"
          subtitle="A focused clinical document studio for preparing, reviewing, and exporting NutriPilot reports."
          title="Clinical Report Studio"
        />

        <ActivePatientBanner
          patient={selectedPatient}
          onOpenClinicalHub={() => onOpenClinicalHub?.(selectedPatient)}
        />

        <NutriPanel className="mb-5">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(220px,300px)_auto] xl:items-end">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                Workflow-linked document readiness
              </p>
              <h2 className="mt-1 text-xl font-extrabold text-[var(--np-color-text)]">
                {workflow.percent}% workflow complete. Next: {nextAction.actionLabel}
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                This studio uses shared patient and workflow state. Placeholder-only sections remain clearly marked.
              </p>
            </div>

            <label className="block">
              <span className="np-form-label">Patient</span>
              <select
                className="np-form-control"
                onChange={(event) => handlePatientChange(event.target.value)}
                value={selectedPatient?.id || ""}
              >
                {patientOptions.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName}
                  </option>
                ))}
              </select>
            </label>

            <NutriButton
              className="w-full xl:w-auto"
              disabled={generating}
              onClick={generateReport}
              type="button"
            >
              <PenLine className="h-4 w-4" />
              {generating ? "Generating..." : "Generate Report"}
            </NutriButton>
          </div>
        </NutriPanel>

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[280px_minmax(0,1fr)_360px]">
          <ReportLibrary
            selectedReportId={selectedReportId}
            setSelectedReportId={setSelectedReportId}
          />

          <LiveReportPreview
            generationIndex={generationIndex}
            patient={selectedPatient}
            readiness={readiness}
            report={selectedReport}
            sections={sections}
            workflow={workflow}
          />

          <aside className="space-y-5">
            <ReportReadinessPanel readiness={readiness} />
            <SectionControls
              moveSection={moveSection}
              resetSections={resetSections}
              sections={sections}
              updateSection={updateSection}
              workflow={workflow}
            />
            <AIClinicalHighlights patient={selectedPatient} workflow={workflow} />
            <ExportActions
              duplicateLatest={duplicateLatest}
              generateReport={generateReport}
              generating={generating}
              onCompare={() => setCompareOpen(true)}
              saveDraft={saveDraft}
            />
          </aside>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
          <ReportTimeline items={timeline} />
          <ReportHistory
            duplicateLatest={duplicateLatest}
            history={reportHistory}
            onCompare={() => setCompareOpen(true)}
          />
        </section>

        {compareOpen ? <CompareReportsModal onClose={() => setCompareOpen(false)} /> : null}
      </NutriPageMain>
    </NutriPage>
  );
}

function ReportLibrary({ selectedReportId, setSelectedReportId }) {
  return (
    <NutriPanel className="2xl:sticky 2xl:top-6 2xl:self-start">
      <NutriSectionHeader icon={FileText} kicker="Library" title="Report Types" />
      <div className="flex gap-3 overflow-x-auto pb-2 2xl:block 2xl:space-y-2 2xl:overflow-visible 2xl:pb-0">
        {reportTypes.map((report) => (
          <button
            className={`min-w-[240px] rounded-[20px] border p-4 text-left transition 2xl:min-w-0 2xl:w-full ${
              selectedReportId === report.id
                ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)] shadow-[var(--np-shadow-sm)]"
                : "border-[var(--np-color-border-soft)] bg-white hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-sm)]"
            }`}
            key={report.id}
            onClick={() => setSelectedReportId(report.id)}
            type="button"
          >
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{report.title}</p>
            <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
              {report.description}
            </p>
          </button>
        ))}
      </div>
    </NutriPanel>
  );
}

function LiveReportPreview({ generationIndex, patient, readiness, report, sections, workflow }) {
  const includedSections = sections.filter((section) => section.included);

  return (
    <NutriPanel>
      <NutriSectionHeader
        action={<NutriBadge tone="secondary">Live preview</NutriBadge>}
        icon={Eye}
        kicker="Document"
        title="Hospital Report Preview"
      />

      <article className="overflow-hidden rounded-[28px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-md)]">
        <header className="border-b border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--np-color-brand)] text-white shadow-[var(--np-shadow-sm)]">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--np-color-brand)]">
                    NutriPilot Clinical Nutrition Intelligence
                  </p>
                  <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                    Confidential Clinical Document
                  </p>
                </div>
              </div>
              <h2 className="mt-3 text-2xl font-extrabold text-[var(--np-color-text)] sm:text-3xl">
                {report.title}
              </h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                Hospital / Organization Placeholder - Clinical Nutrition Department
              </p>
            </div>
            <div className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-white p-4 text-left lg:text-right">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                Report status
              </p>
              <p className="mt-2 text-xl font-extrabold text-[var(--np-color-brand)]">{readiness.status}</p>
              <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{readiness.percent}% ready</p>
            </div>
          </div>
        </header>

        <div className="space-y-6 p-5 sm:p-7">
          {generationIndex >= 0 ? <GenerationProgress generationIndex={generationIndex} /> : null}

          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            <PreviewMeta label="Patient name" value={patient.fullName} />
            <PreviewMeta label="Report ID" value={`NPR-${report.id.toUpperCase()}-0001`} />
            <PreviewMeta label="Age / Sex" value={`${patient.age} years / ${patient.gender}`} />
            <PreviewMeta label="MRN" value="MRN-0000 placeholder" />
            <PreviewMeta label="Diagnosis" value={cleanText(patient.diagnosis) || "Pending documentation"} />
            <PreviewMeta label="Risk level" value={patient.riskLevel || "Not classified"} />
            <PreviewMeta label="Generated date" value={new Date().toLocaleString()} />
            <PreviewMeta label="Prepared by" value="Dr. Shahad, Clinical Nutritionist" />
            <PreviewMeta label="Review / approval" value="Clinician review required" />
            <PreviewMeta label="Page" value="Page 1 of 1" />
            <PreviewMeta label="Workflow" value={`${workflow.completed}/${workflow.total} sections complete`} />
          </section>

          <section className="space-y-3">
            {includedSections.map((section) => (
              <ReportPreviewSection
                key={section.id}
                section={section}
                status={getSectionStatus(section, workflow)}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--np-color-border-soft)] p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                Clinician signature
              </p>
              <div className="mt-8 border-t border-dashed border-[var(--np-color-border)] pt-3 text-sm font-bold text-[var(--np-color-text-muted)]">
                Signature placeholder
              </div>
            </div>
            <div className="rounded-[22px] border border-[var(--np-color-border-soft)] p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                Review / approval
              </p>
              <p className="mt-4 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                This report is a local preview and must be reviewed by the responsible clinician before export.
              </p>
            </div>
          </section>
        </div>

        <footer className="border-t border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4 text-center text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
          Confidential clinical nutrition document - Page 1 of 1. Placeholder-only export flow. Not for clinical use without professional review.
        </footer>
      </article>
    </NutriPanel>
  );
}

function ReportPreviewSection({ section, status }) {
  const tone = status === "Ready" ? "success" : status === "Needs Review" ? "warning" : "danger";

  return (
    <div className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-extrabold text-[var(--np-color-text)]">{section.title}</h3>
        <NutriBadge tone={tone}>{status}</NutriBadge>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
        Placeholder section content connected to the active patient workflow. Unsupported clinical interpretation remains marked for clinician review.
      </p>
    </div>
  );
}

function ReportReadinessPanel({ readiness }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={ShieldCheck} kicker="Readiness" title="Report Readiness" />
      <div className="flex items-center gap-5">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[10px] border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]">
          <span className="text-xl font-extrabold text-[var(--np-color-brand)]">{readiness.percent}%</span>
        </div>
        <div>
          <NutriBadge tone={readiness.statusTone}>{readiness.status}</NutriBadge>
          <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
            {readiness.ready} ready, {readiness.missing} missing, {readiness.needsReview} need review.
          </p>
        </div>
      </div>
    </NutriPanel>
  );
}

function SectionControls({ moveSection, resetSections, sections, updateSection, workflow }) {
  return (
    <NutriPanel>
      <NutriSectionHeader
        action={
          <button className="np-button np-button-secondary min-h-10 px-3 text-xs" onClick={resetSections} type="button">
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        }
        icon={Layers}
        kicker="Controls"
        title="Report Sections"
      />
      <div className="space-y-3">
        {sections.map((section, index) => {
          const status = getSectionStatus(section, workflow);
          return (
            <div
              className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3"
              key={section.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[var(--np-color-text)]">{section.title}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{status}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    className="np-button np-button-secondary min-h-10 px-2"
                    disabled={index === 0}
                    onClick={() => moveSection(section.id, "up")}
                    type="button"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    className="np-button np-button-secondary min-h-10 px-2"
                    disabled={index === sections.length - 1}
                    onClick={() => moveSection(section.id, "down")}
                    type="button"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex min-h-11 items-center gap-2 rounded-[14px] bg-[var(--np-color-surface-muted)] px-3 text-xs font-extrabold text-[var(--np-color-text)]">
                  <input
                    checked={section.included}
                    onChange={(event) => updateSection(section.id, { included: event.target.checked })}
                    type="checkbox"
                  />
                  Included
                </label>
                <label className="flex min-h-11 items-center gap-2 rounded-[14px] bg-[var(--np-color-surface-muted)] px-3 text-xs font-extrabold text-[var(--np-color-text)]">
                  <input
                    checked={section.incomplete}
                    onChange={(event) => updateSection(section.id, { incomplete: event.target.checked })}
                    type="checkbox"
                  />
                  Mark incomplete
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </NutriPanel>
  );
}

function AIClinicalHighlights({ patient, workflow }) {
  const missingData = workflow.missing.map((step) => step.label);
  const reviewItems = workflow.needsReview.map((step) => step.label);
  const alerts = workflow.alerts.slice(0, 3);
  const dataUsed = workflow.steps
    .filter((step) => step.status === "Completed")
    .map((step) => step.label);

  return (
    <NutriPanel>
      <NutriSectionHeader icon={ClipboardList} kicker="Rule-based" title="AI Clinical Highlights" />
      <NutriBadge tone="warning">Rule-based placeholder — clinician review required.</NutriBadge>

      <div className="mt-4 space-y-3">
        <HighlightBlock
          label="Workflow gaps"
          values={[...missingData, ...reviewItems].slice(0, 4)}
          fallback="No major workflow gaps flagged locally."
        />
        <HighlightBlock
          label="Available clinical alerts"
          values={alerts.map((alert) => alert.title)}
          fallback="No active report-specific alerts."
        />
        <HighlightBlock
          label="Follow-up reminders"
          values={workflow.alerts
            .filter((alert) => alert.title.toLowerCase().includes("follow"))
            .map((alert) => alert.title)}
          fallback="Follow-up timing remains a placeholder."
        />
        <HighlightBlock
          label="Data used"
          values={dataUsed.slice(0, 5)}
          fallback={`Only basic profile data is available for ${patient.fullName}.`}
        />
        <HighlightBlock
          label="Missing data"
          values={missingData.slice(0, 5)}
          fallback="No missing workflow data detected."
        />
      </div>
    </NutriPanel>
  );
}

function HighlightBlock({ fallback, label, values }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{label}</p>
      <div className="mt-2 space-y-1">
        {values.length ? (
          values.map((value) => (
            <p className="text-sm font-bold leading-5 text-[var(--np-color-text)]" key={value}>
              {value}
            </p>
          ))
        ) : (
          <p className="text-sm font-bold leading-5 text-[var(--np-color-text-muted)]">{fallback}</p>
        )}
      </div>
    </div>
  );
}

function ExportActions({ duplicateLatest, generateReport, generating, onCompare, saveDraft }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={Download} kicker="Actions" title="Export Actions" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-1">
        <NutriButton disabled={generating} onClick={generateReport} type="button">
          <Download className="h-4 w-4" />
          Export PDF placeholder
        </NutriButton>
        <NutriButton onClick={() => window.print()} type="button" variant="secondary">
          <Printer className="h-4 w-4" />
          Print
        </NutriButton>
        <NutriButton onClick={saveDraft} type="button" variant="secondary">
          <Save className="h-4 w-4" />
          Save Draft
        </NutriButton>
        <NutriButton onClick={duplicateLatest} type="button" variant="secondary">
          <Copy className="h-4 w-4" />
          Duplicate
        </NutriButton>
        <NutriButton type="button" variant="secondary">
          <Share2 className="h-4 w-4" />
          Share placeholder
        </NutriButton>
        <NutriButton onClick={onCompare} type="button" variant="secondary">
          <ClipboardList className="h-4 w-4" />
          Compare Reports
        </NutriButton>
      </div>
    </NutriPanel>
  );
}

function GenerationProgress({ generationIndex }) {
  return (
    <div className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-brand-soft)] p-4">
      <p className="text-sm font-extrabold text-[var(--np-color-brand)]">Generating report preview</p>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
        {generationSteps.map((step, index) => (
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--np-color-text)]" key={step}>
            <CheckCircle2
              className={`h-4 w-4 ${index <= generationIndex ? "text-[var(--np-color-brand)]" : "text-[var(--np-color-text-muted)]"}`}
            />
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportTimeline({ items }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={History} kicker="Timeline" title="Report Activity" />
      <div className="space-y-3">
        {items.map((item) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4" key={item.id}>
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{item.title}</p>
            <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{item.date}</p>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function ReportHistory({ duplicateLatest, history, onCompare }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={FileText} kicker="History" title="Previous Reports" />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {history.map((item) => (
          <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4" key={item.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[var(--np-color-text)]">{item.title}</h3>
                <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
                  {item.date} - {item.author} - {item.version}
                </p>
              </div>
              <NutriBadge tone={item.status === "Ready to Export" ? "success" : "warning"}>{item.status}</NutriBadge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="np-button np-button-secondary min-h-10 px-3 text-xs" type="button">View</button>
              <button className="np-button np-button-secondary min-h-10 px-3 text-xs" onClick={duplicateLatest} type="button">
                Duplicate
              </button>
              <button className="np-button np-button-secondary min-h-10 px-3 text-xs" onClick={onCompare} type="button">
                Compare
              </button>
              <button className="np-button np-button-secondary min-h-10 px-3 text-xs" type="button">
                Download placeholder
              </button>
            </div>
          </article>
        ))}
      </div>
    </NutriPanel>
  );
}

function CompareReportsModal({ onClose }) {
  return (
    <div className="np-modal-backdrop">
      <section className="np-modal max-w-4xl">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--np-color-border-soft)] p-5">
          <div>
            <p className="np-page-kicker">Comparison</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--np-color-text)]">Compare Reports</h2>
          </div>
          <button className="np-button np-button-secondary min-h-10 px-3" onClick={onClose} type="button">
            <X className="h-4 w-4" />
            Close
          </button>
        </header>
        <div className="overflow-x-auto p-5">
          <table className="np-table min-w-[720px]">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Previous report</th>
                <th>Current report</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([metric, previous, current, note]) => (
                <tr key={metric}>
                  <td>{metric}</td>
                  <td>{previous}</td>
                  <td>{current}</td>
                  <td>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function PreviewMeta({ label, value }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function calculateReadiness(sections, workflow, generationIndex) {
  const includedSections = sections.filter((section) => section.included);
  const sectionStatuses = includedSections.map((section) => getSectionStatus(section, workflow));
  const ready = sectionStatuses.filter((status) => status === "Ready").length;
  const missing = sectionStatuses.filter((status) => status === "Missing").length;
  const needsReview = sectionStatuses.filter((status) => status === "Needs Review").length;
  const percent = includedSections.length ? Math.round((ready / includedSections.length) * 100) : 0;
  const status = generationIndex === generationSteps.length - 1
    ? "Ready to Export"
    : percent >= 85 && needsReview === 0 && missing === 0
      ? "Ready to Export"
      : percent >= 55
        ? "Needs Review"
        : "Draft";

  return {
    missing,
    needsReview,
    percent,
    ready,
    status,
    statusTone: status === "Ready to Export" ? "success" : status === "Needs Review" ? "warning" : "secondary",
  };
}

function getSectionStatus(section, workflow) {
  if (!section.included) return "Excluded";
  if (section.incomplete) return "Needs Review";

  const workflowStep = workflow.steps.find((step) => step.id === section.workflowStep);
  if (!workflowStep) return "Ready";
  if (workflowStep.status === "Completed") return "Ready";
  if (workflowStep.status === "Needs Review" || workflowStep.status === "In Progress") return "Needs Review";
  return "Missing";
}

function buildInitialHistory(reportsState = []) {
  const sourceReports = reportsState.length ? reportsState : [
    { name: "Full Clinical Nutrition Report", status: "Ready", lastGenerated: "Today, 09:30 AM" },
    { name: "Laboratory Results Report", status: "Ready", lastGenerated: "Yesterday, 02:15 PM" },
    { name: "AI Clinical Summary Report", status: "Clinician review", lastGenerated: "Not generated" },
  ];

  return sourceReports.map((report, index) => ({
    author: "Dr. Shahad",
    date: report.lastGenerated || "Not generated",
    id: report.id || `history-${index}`,
    status: report.status === "Ready" ? "Ready to Export" : report.status || "Draft",
    title: report.name,
    version: `v${index + 1}.0`,
  }));
}

function buildReportTimeline(reportHistory) {
  return [
    { id: "generated", title: reportHistory[0] ? `${reportHistory[0].title} updated` : "Report generated", date: reportHistory[0]?.date || "Pending" },
    { id: "follow-up", title: "Follow-up scheduled", date: "Placeholder timeline" },
    { id: "intervention", title: "Intervention added", date: "Placeholder timeline" },
    { id: "pes", title: "PES created", date: "Placeholder timeline" },
    { id: "labs", title: "Laboratory updated", date: "Placeholder timeline" },
    { id: "assessment", title: "Assessment completed", date: "Placeholder timeline" },
  ];
}

function delay(duration) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });
}

function cleanText(value) {
  const fromCodes = (codes) => codes.map((code) => String.fromCharCode(code)).join("");
  const badBullet = fromCodes([0x00e2, 0x20ac, 0x00a2]);
  const oldBullet = fromCodes([0x0623, 0x00a2, 0x00e2, 0x201a, 0x00ac, 0x0622, 0x00a2]);
  const bullet = fromCodes([0x2022]);

  return String(value)
    .replaceAll(badBullet, bullet)
    .replaceAll(oldBullet, bullet);
}
