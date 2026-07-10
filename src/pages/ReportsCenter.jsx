import { useMemo, useState } from "react";
import {
  ClipboardList,
  Download,
  Eye,
  FileText,
  History,
  PenLine,
  Plus,
  Printer,
  Stethoscope,
  UserRound,
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
import { managedPatients } from "../data/patientData";
import { ActivePatientBanner } from "../components/common/ActivePatientBanner";
import { getWorkflowNextAction, getWorkflowStatus } from "../utils/workflowStatus";

const reportTemplates = ["Clinical", "Research", "Follow-up", "AI Summary"];

const reports = [
  ["Full Clinical Nutrition Report", "Complete nutrition assessment, diagnosis, intervention, and monitoring summary.", "Ready"],
  ["Anthropometric Assessment Report", "Height, weight, BMI, weight history, and body composition indicators.", "Draft"],
  ["Laboratory Results Report", "Nutrition-related laboratory values, status badges, and interpretation notes.", "Ready"],
  ["Dietary Assessment Report", "Diet recall, intake pattern, symptoms, barriers, and nutrition risks.", "Needs review"],
  ["Medical History Report", "Diagnosis, medications, symptoms, allergies, and lifestyle context.", "Ready"],
  ["Nutrition Diagnosis (PES) Report", "Saved PES statements, priority, status, and diagnosis history.", "Draft"],
  ["Nutrition Intervention Report", "Goals, prescriptions, education, counseling, and follow-up plan.", "Ready"],
  ["Monitoring & Evaluation Report", "Follow-up visits, trends, progress badges, and next appointment plan.", "Draft"],
  ["AI Clinical Summary Report", "Rule-based AI summary, risks, red flags, and monitoring priorities.", "Clinician review"],
  ["Research Summary Report", "Research activity, datasets, study progress, and publication readiness.", "Ready"],
];

const selectedSections = [
  "Patient information",
  "Assessment summary",
  "Clinical findings",
  "Nutrition care plan",
  "Follow-up recommendations",
  "NutriPilot audit note",
];

export default function ReportsCenter({
  activePatient,
  completeWorkflowStep,
  onOpenClinicalHub,
  reportsState,
  setActivePatient,
  updateReport,
}) {
  const [selectedPatientId, setSelectedPatientId] = useState(activePatient?.id || "");
  const [selectedTemplate, setSelectedTemplate] = useState("Clinical");
  const [selectedReport, setSelectedReport] = useState(reports[0][0]);

  const selectedPatient = useMemo(
    () =>
      activePatient?.id === selectedPatientId
        ? activePatient
        : managedPatients.find((patient) => patient.id === selectedPatientId) || activePatient || managedPatients[0],
    [activePatient, selectedPatientId],
  );
  const workflow = getWorkflowStatus(selectedPatient);
  const nextAction = getWorkflowNextAction(selectedPatient);
  const reportCards = reports.map(([name, description, status], index) => {
    const reportState = reportsState?.find((item) => item.name === name || name.includes(item.name));

    return {
      description,
      id: reportState?.id || `report-${index}`,
      lastGenerated: reportState?.lastGenerated || "Today, 09:30 AM",
      name,
      status: reportState?.status || status,
      template: reportTemplates[index % reportTemplates.length],
    };
  });

  function generateReport(report) {
    setSelectedReport(report.name);
    updateReport?.(report.id, {
      lastGenerated: new Date().toLocaleString(),
      status: "Ready",
    });
    completeWorkflowStep?.("reports", selectedPatient);
  }

  return (
    <NutriPage>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">PDF placeholder</NutriBadge>
              <NutriBadge tone="secondary">Preview ready</NutriBadge>
            </>
          }
          kicker="Reports"
          subtitle="Prepare, preview, and export structured clinical nutrition reports with consistent NutriPilot branding."
          title="Reports Center"
        />

        <ActivePatientBanner
          patient={selectedPatient}
          onOpenClinicalHub={() => onOpenClinicalHub(selectedPatient)}
        />

        <NutriPanel className="mb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                Workflow-linked report readiness
              </p>
              <h2 className="mt-1 text-lg font-extrabold text-[var(--np-color-text)]">
                {workflow.percent}% complete • Next: {nextAction.actionLabel}
              </h2>
            </div>
            <NutriBadge tone={workflow.steps.find((step) => step.id === "reports")?.status === "Missing" ? "danger" : "warning"}>
              Report Generation: {workflow.steps.find((step) => step.id === "reports")?.status}
            </NutriBadge>
          </div>
        </NutriPanel>

        <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <NutriPanel>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="np-form-label">Patient</span>
                <select
                  className="np-form-control"
                  onChange={(event) => {
                    const patient = managedPatients.find((item) => item.id === event.target.value);
                    setSelectedPatientId(event.target.value);
                    setActivePatient(patient);
                  }}
                  value={managedPatients.some((patient) => patient.id === selectedPatientId) ? selectedPatientId : ""}
                >
                  {activePatient && !managedPatients.some((patient) => patient.id === activePatient.id) ? (
                    <option value="">
                      {activePatient.fullName}
                    </option>
                  ) : null}
                  {managedPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="np-form-label">Report Template</span>
                <select
                  className="np-form-control"
                  onChange={(event) => setSelectedTemplate(event.target.value)}
                  value={selectedTemplate}
                >
                  {reportTemplates.map((template) => (
                    <option key={template} value={template}>
                      {template}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </NutriPanel>

          <NutriPanel>
            <div className="flex items-center gap-3">
              <span className="np-icon-tile">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                  Active patient
                </p>
                <h2 className="truncate text-lg font-extrabold text-[var(--np-color-text)]">
                  {selectedPatient.fullName}
                </h2>
              </div>
            </div>
          </NutriPanel>
        </section>

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <NutriPanel>
            <NutriSectionHeader
              action={<NutriButton onClick={() => generateReport(reportCards.find((report) => report.name === selectedReport) || reportCards[0])} type="button"><Plus className="h-4 w-4" />Generate Selected</NutriButton>}
              icon={FileText}
              kicker="Report library"
              title="Clinical Report Categories"
            />
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {reportCards.map((report) => (
                <ReportCard
                  description={report.description}
                  key={report.name}
                  lastGenerated={report.lastGenerated}
                  name={report.name}
                  onGenerate={() => generateReport(report)}
                  onSelect={() => setSelectedReport(report.name)}
                  selected={selectedReport === report.name}
                  status={report.status}
                  template={report.template}
                />
              ))}
            </div>
          </NutriPanel>

          <ReportPreviewPanel
            patient={selectedPatient}
            report={selectedReport}
            template={selectedTemplate}
          />
        </section>
      </NutriPageMain>
    </NutriPage>
  );
}

function ReportCard({ description, lastGenerated, name, onGenerate, onSelect, selected, status, template }) {
  return (
    <article
      className={`rounded-[22px] border bg-white p-5 shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)] ${
        selected
          ? "border-[var(--np-color-brand)] ring-4 ring-[rgb(122_31_43_/_0.08)]"
          : "border-[var(--np-color-border-soft)]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold leading-6 text-[var(--np-color-text)]">{name}</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
            {description}
          </p>
        </div>
        <ReportStatus status={status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <ReportMeta icon={History} label="Last generated" value={lastGenerated} />
        <ReportMeta icon={ClipboardList} label="Template" value={template} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button className="np-button np-button-secondary min-h-11 px-3 text-xs" onClick={onSelect} type="button">
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button className="np-button np-button-primary min-h-11 px-3 text-xs" onClick={onGenerate} type="button">
          <PenLine className="h-4 w-4" />
          Generate
        </button>
        <button className="np-button np-button-secondary min-h-11 px-3 text-xs" type="button">
          <Download className="h-4 w-4" />
          Export PDF
        </button>
      </div>
    </article>
  );
}

function ReportPreviewPanel({ patient, report, template }) {
  return (
    <aside className="space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
      <NutriPanel>
        <NutriSectionHeader icon={Printer} kicker="Preview" title="Report Preview" />
        <div className="overflow-hidden rounded-[24px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-sm)]">
          <div className="border-b border-[var(--np-color-border-soft)] bg-[var(--np-color-brand)] p-5 text-white">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/75">
              NutriPilot
            </p>
            <h3 className="mt-2 text-xl font-extrabold">{report}</h3>
            <p className="mt-1 text-sm font-bold text-white/78">{template} template</p>
          </div>

          <div className="space-y-4 p-5">
            <PreviewRow label="Patient" value={patient.fullName} />
            <PreviewRow label="Age / Gender" value={`${patient.age} years / ${patient.gender}`} />
            <PreviewRow label="Diagnosis" value={cleanText(patient.diagnosis) || "Pending"} />
            <PreviewRow label="Generated date" value={new Date().toLocaleDateString()} />
            <PreviewRow label="Prepared by" value="Dr. Shahad, Clinical Nutritionist" />

            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">
                Selected sections
              </p>
              <div className="mt-3 space-y-2">
                {selectedSections.map((section) => (
                  <p
                    className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3 text-sm font-bold text-[var(--np-color-text)]"
                    key={section}
                  >
                    {section}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </NutriPanel>

      <NutriPanel>
        <NutriSectionHeader icon={Stethoscope} kicker="Branding" title="Export Notes" />
        <p className="text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
          PDF export is currently a placeholder. Future export will preserve
          NutriPilot branding, clinician signature, and audit information.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <NutriBadge tone="brand">Clinical</NutriBadge>
          <NutriBadge tone="secondary">Research</NutriBadge>
          <NutriBadge tone="accent">Follow-up</NutriBadge>
          <NutriBadge tone="info">AI Summary</NutriBadge>
        </div>
      </NutriPanel>
    </aside>
  );
}

function ReportMeta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <Icon className="h-4 w-4 text-[var(--np-color-brand)]" />
      <p className="mt-2 text-xs font-bold text-[var(--np-color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function PreviewRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--np-color-border-soft)] pb-3 last:border-b-0">
      <span className="text-sm font-bold text-[var(--np-color-text-muted)]">{label}</span>
      <span className="text-right text-sm font-extrabold text-[var(--np-color-text)]">{value}</span>
    </div>
  );
}

function ReportStatus({ status }) {
  const tone = {
    "Clinician review": "warning",
    Draft: "secondary",
    "Needs review": "danger",
    Ready: "success",
  }[status] || "brand";

  return <NutriBadge tone={tone}>{status}</NutriBadge>;
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






