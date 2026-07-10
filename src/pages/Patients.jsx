import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  Edit3,
  FileText,
  Filter,
  Map,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  calculateBmi,
  createPatientRecord,
  emptyPatientForm,
  managedPatients,
} from "../data/patientData";
import {
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
} from "../components/common/NutriPilotPrimitives";
import { getWorkflowStatus } from "../utils/workflowStatus";

const STORAGE_KEY = "nutripilot.patients";

const FILTERS = [
  "All",
  "High Risk",
  "Moderate",
  "Stable",
  "Follow-up Due",
  "Missing Labs",
  "Missing PES",
  "Report Pending",
  "Research Participant",
];

function loadStoredPatients() {
  try {
    const storedPatients = localStorage.getItem(STORAGE_KEY);
    return storedPatients ? JSON.parse(storedPatients) : managedPatients;
  } catch {
    return managedPatients;
  }
}

export default function Patients({ activePatient, onNavigate, openWorkspace, setActivePatient, sharedPatients = [] }) {
  const [patients, setPatients] = useState(loadStoredPatients);
  const [selectedPatientId, setSelectedPatientId] = useState(
    () => activePatient?.id || loadStoredPatients()[0]?.id || "",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [formValues, setFormValues] = useState(emptyPatientForm);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }, [patients]);

  const patientProfiles = useMemo(
    () => patients.map((patient, index) => {
      const sharedPatient = sharedPatients.find((item) => item.id === patient.id || item.fullName === patient.fullName);
      return enrichPatient({ ...patient, workflowOverrides: sharedPatient?.workflowOverrides || patient.workflowOverrides }, index);
    }),
    [patients, sharedPatients],
  );

  const filteredPatients = useMemo(() => {
    const normalizedSearch = searchTerm.toLowerCase().trim();

    return patientProfiles.filter((patient) => {
      const matchesSearch = [
        patient.fullName,
        patient.mrn,
        patient.gender,
        patient.diagnosis,
        patient.riskLevel,
        patient.nutritionStatus,
        patient.bmi,
        patient.ferritin,
        patient.vitaminD,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);

      const matchesFilter =
        activeFilter === "All" || matchesPatientFilter(patient, activeFilter);

      return matchesSearch && matchesFilter;
    });
  }, [activeFilter, patientProfiles, searchTerm]);

  const stats = useMemo(
    () => ({
      total: patients.length,
      highRisk: patientProfiles.filter((patient) => patient.riskLevel === "High Risk")
        .length,
      followUp: patientProfiles.filter((patient) => patient.status === "Follow-up")
        .length,
      stable: patientProfiles.filter((patient) => patient.status === "Stable").length,
    }),
    [patientProfiles, patients.length],
  );

  function updateFormField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function resetForm() {
    setEditingPatientId(null);
    setFormValues(emptyPatientForm);
  }

  function openPatientModal(patient) {
    if (patient) {
      setEditingPatientId(patient.id);
      setSelectedPatientId(patient.id);
      setActivePatient(patient);
      setFormValues({
        fullName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        height: patient.height,
        weight: patient.weight,
        diagnosis: patient.diagnosis,
        notes: patient.notes,
      });
    } else {
      resetForm();
    }

    setIsPatientModalOpen(true);
  }

  function closePatientModal() {
    setIsPatientModalOpen(false);
    resetForm();
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!formValues.fullName.trim()) {
      return;
    }

    const patientRecord = createPatientRecord({
      ...formValues,
      id: editingPatientId,
    });

    if (editingPatientId) {
      setPatients((currentPatients) =>
        currentPatients.map((patient) =>
          patient.id === editingPatientId ? patientRecord : patient,
        ),
      );
      setSelectedPatientId(editingPatientId);
      setActivePatient(patientRecord);
    } else {
      setPatients((currentPatients) => [patientRecord, ...currentPatients]);
      setSelectedPatientId(patientRecord.id);
      setActivePatient(patientRecord);
    }

    closePatientModal();
  }

  function handleDelete(patientId) {
    const patientToDelete = patients.find((patient) => patient.id === patientId);
    const confirmed = window.confirm(
      `Delete ${patientToDelete?.fullName || "this patient"} from the patient list?`,
    );

    if (!confirmed) {
      return;
    }

    setPatients((currentPatients) => {
      const remainingPatients = currentPatients.filter(
        (patient) => patient.id !== patientId,
      );

      if (selectedPatientId === patientId) {
        setSelectedPatientId(remainingPatients[0]?.id || "");
      }

      return remainingPatients;
    });

    if (editingPatientId === patientId) {
      resetForm();
    }
  }

  return (
    <NutriPage>
      <NutriPageMain>
      <NutriPageHeader
        kicker="Patient Management"
        title="Clinical Patient Registry"
        subtitle="Manage nutrition patients, review risk status, and open the Clinical Hub from a calm premium patient command view."
        actions={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:min-w-[560px]">
          <PatientStat icon={Users} label="Patients" value={stats.total} tone="brand" />
          <PatientStat
            icon={AlertTriangle}
            label="High Risk"
            value={stats.highRisk}
            tone="danger"
          />
          <PatientStat
            icon={CalendarDays}
            label="Follow-up"
            value={stats.followUp}
            tone="accent"
          />
          <PatientStat
            icon={ShieldCheck}
            label="Stable"
            value={stats.stable}
            tone="secondary"
          />
        </div>
        }
      />

      <section className="grid grid-cols-1 gap-5">
        <main className="rounded-[28px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-card)] lg:p-5">
          <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full xl:max-w-[520px]">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--np-color-text-soft)]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-12 w-full rounded-[var(--np-radius-lg)] border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-12 text-sm font-bold text-[var(--np-color-text)] outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
                placeholder="Search by name, MRN, diagnosis, risk, BMI, ferritin, vitamin D..."
              />
            </div>

            <button
              type="button"
              onClick={() => openPatientModal()}
              className="np-button np-button-primary h-12 shrink-0 px-5"
            >
              <Plus className="h-4 w-4" />
              Add Patient
            </button>
          </div>

          <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]">
              <Filter className="h-4 w-4" />
            </span>
            {FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`h-10 shrink-0 rounded-full border px-4 text-sm font-extrabold transition ${
                  activeFilter === filter
                    ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white shadow-[var(--np-shadow-sm)]"
                    : "border-[var(--np-color-border)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                isSelected={selectedPatientId === patient.id}
                onDelete={() => handleDelete(patient.id)}
                onEdit={() => openPatientModal(patient)}
                onOpenWorkspace={() => {
                  setActivePatient(patient);
                  openWorkspace(patient);
                }}
                onQuickAction={(targetPage) => {
                  setActivePatient(patient);
                  onNavigate(targetPage);
                }}
                onSelect={() => {
                  setSelectedPatientId(patient.id);
                  setActivePatient(patient);
                }}
                patient={patient}
              />
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-8 text-center">
              <Users className="mx-auto h-8 w-8 text-[var(--np-color-text-soft)]" />
              <p className="mt-3 text-sm font-extrabold text-[var(--np-color-text)]">
                No patients found
              </p>
              <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
                Adjust the search or filter to view more patient records.
              </p>
            </div>
          )}
        </main>
      </section>

      {isPatientModalOpen && (
        <PatientModal
          editingPatientId={editingPatientId}
          formValues={formValues}
          onClose={closePatientModal}
          onSubmit={handleSubmit}
          updateFormField={updateFormField}
        />
      )}
      </NutriPageMain>
    </NutriPage>
  );
}

function PatientCard({
  isSelected,
  onDelete,
  onEdit,
  onOpenWorkspace,
  onQuickAction,
  onSelect,
  patient,
}) {
  const workflow = getWorkflowStatus(patient);
  const journeySteps = [
    ["Assessment", "assessment"],
    ["Labs", "labs"],
    ["PES", "pes"],
    ["Intervention", "intervention"],
    ["Monitoring", "monitoring"],
    ["Report", "reports"],
  ].map(([label, stepId]) => ({
    label,
    status: workflow.steps.find((step) => step.id === stepId)?.status || "Missing",
  }));

  return (
    <article
      className={`group rounded-[24px] border bg-white p-5 shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)] ${
        isSelected
          ? "border-[var(--np-color-brand)] ring-4 ring-[rgb(122_31_43_/_0.08)]"
          : "border-[var(--np-color-border-soft)]"
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <PatientAvatar name={patient.fullName} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold text-[var(--np-color-text)]">
                {patient.fullName}
              </h2>
              <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
                MRN {patient.mrn} • {patient.age || "Age not set"} years •{" "}
                {patient.gender || "Not specified"}
              </p>
            </div>
          </div>
          <RiskBadge risk={patient.riskLevel} />
        </div>

        <div className="mt-5 rounded-[18px] bg-[var(--np-color-surface-muted)] p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
            Diagnosis
          </p>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm font-extrabold leading-5 text-[var(--np-color-text)]">
            {displayText(patient.diagnosis) || "No diagnosis recorded"}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <PatientMetric label="BMI" value={patient.bmi || "Pending"} />
          <PatientMetric label="Last visit" value={patient.lastVisit} />
          <PatientMetric label="Next follow-up" value={patient.nextFollowUpDate} />
          <PatientMetric label="AI status" value={patient.aiStatus} />
          <PatientMetric label="Report" value={patient.reportStatus} />
        </div>

        <div className="mt-5 rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
              Clinical Journey
            </p>
            <span>{workflow.percent}%</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
            {journeySteps.map((step) => (
              <JourneyStep key={step.label} label={step.label} status={step.status} />
            ))}
          </div>
        </div>
      </button>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-5">
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="np-button np-button-primary min-h-11 px-3 text-xs"
        >
          <Activity className="h-4 w-4" />
          Hub
        </button>
        <button
          type="button"
          onClick={() => onQuickAction("nutrimap")}
          className="np-button np-button-secondary min-h-11 px-3 text-xs"
        >
          <Map className="h-4 w-4" />
          Map
        </button>
        <button
          type="button"
          onClick={() => onQuickAction("ai")}
          className="np-button np-button-secondary min-h-11 px-3 text-xs"
        >
          <Brain className="h-4 w-4" />
          AI
        </button>
        <button
          type="button"
          onClick={() => onQuickAction("reports")}
          className="np-button np-button-secondary min-h-11 px-3 text-xs"
        >
          <FileText className="h-4 w-4" />
          Report
        </button>
        <button
          type="button"
          onClick={() => onQuickAction("appointments")}
          className="np-button np-button-secondary min-h-11 px-3 text-xs"
        >
          <CalendarDays className="h-4 w-4" />
          Follow-up
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="np-button np-button-secondary min-h-10 px-3 text-xs"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="np-button min-h-10 border border-[rgb(185_28_28_/_0.22)] bg-[var(--np-color-danger-bg)] px-3 text-xs font-extrabold text-[var(--np-color-danger)] hover:border-[var(--np-color-danger)]"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

function PatientModal({
  editingPatientId,
  formValues,
  onClose,
  onSubmit,
  updateFormField,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(31_41_55_/_0.32)] p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-elevated)]">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[var(--np-color-border-soft)] bg-white/95 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
                Patient Record
              </p>
              <h2 className="text-xl font-extrabold text-[var(--np-color-text)]">
                {editingPatientId ? "Edit Patient" : "Add New Patient"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--np-color-text-muted)] transition hover:bg-[var(--np-color-surface-muted)] hover:text-[var(--np-color-brand)]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form className="space-y-5 p-5" onSubmit={onSubmit}>
          <PatientInput
            label="Full Name"
            value={formValues.fullName}
            onChange={(value) => updateFormField("fullName", value)}
            required
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PatientInput
              label="Age"
              type="number"
              value={formValues.age}
              onChange={(value) => updateFormField("age", value)}
            />
            <PatientSelect
              label="Gender"
              value={formValues.gender}
              onChange={(value) => updateFormField("gender", value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PatientInput
              label="Height"
              type="number"
              value={formValues.height}
              onChange={(value) => updateFormField("height", value)}
            />
            <PatientInput
              label="Weight"
              type="number"
              value={formValues.weight}
              onChange={(value) => updateFormField("weight", value)}
            />
          </div>

          <PatientInput
            label="Diagnosis / Condition"
            value={formValues.diagnosis}
            onChange={(value) => updateFormField("diagnosis", value)}
          />

          <label className="block">
            <span className="np-form-label">Notes</span>
            <textarea
              value={formValues.notes}
              onChange={(event) => updateFormField("notes", event.target.value)}
              className="np-form-control min-h-32 resize-y"
            />
          </label>

          <footer className="flex flex-col gap-3 border-t border-[var(--np-color-border-soft)] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="np-button np-button-secondary">
              Cancel
            </button>
            <button type="submit" className="np-button np-button-primary">
              <Save className="h-4 w-4" />
              {editingPatientId ? "Save Changes" : "Add Patient"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function PatientStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-card)]">
      <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] ${toneClass(tone)}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-2xl font-extrabold text-[var(--np-color-text)]">{value}</p>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{label}</p>
    </div>
  );
}

function PatientMetric({ label, value }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--np-color-text-soft)]">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-extrabold text-[var(--np-color-text)]">
        {value}
      </p>
    </div>
  );
}

function PatientInput({ label, type = "text", value, onChange, required = false }) {
  return (
    <label className="block">
      <span className="np-form-label">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="np-form-control"
      />
    </label>
  );
}

function PatientSelect({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="np-form-label">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="np-form-control"
      >
        <option value="">Select</option>
        <option value="Female">Female</option>
        <option value="Male">Male</option>
        <option value="Other">Other</option>
      </select>
    </label>
  );
}

function PatientAvatar({ inverse = false, name }) {
  const initials = name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2);

  return (
    <span
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] text-lg font-extrabold shadow-[var(--np-shadow-sm)] ${
        inverse
          ? "bg-white text-[var(--np-color-brand)]"
          : "bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]"
      }`}
    >
      {initials}
    </span>
  );
}

function RiskBadge({ risk }) {
  if (risk === "High Risk") {
    return <span className="np-badge np-badge-danger shrink-0">High Risk</span>;
  }

  if (risk === "Moderate Risk") {
    return <span className="np-badge np-badge-warning shrink-0">Moderate</span>;
  }

  return <span className="np-badge np-badge-secondary shrink-0">Low Risk</span>;
}

function enrichPatient(patient, index) {
  const bmi = calculateBmi(patient.height, patient.weight);
  const diagnosis = displayText(patient.diagnosis || "");
  const riskLevel = getRiskLevel(diagnosis, bmi);
  const status = getPatientStatus(patient, riskLevel, index);
  const labProfile = getLabProfile(index, diagnosis);

  return {
    ...patient,
    bmi,
    diagnosis,
    aiStatus: riskLevel === "High Risk" ? "Review needed" : "Ready",
    ferritin: labProfile.ferritin,
    isResearchParticipant: index === 0 || diagnosis.toLowerCase().includes("ibs"),
    riskLevel,
    mrn: patient.mrn || `MRN-${String(index + 1).padStart(4, "0")}`,
    lastVisit: getLastVisit(index),
    nextFollowUpDate: getNextFollowUp(index, riskLevel),
    nutritionStatus: getNutritionStatus(diagnosis, bmi),
    reportStatus: riskLevel === "High Risk" ? "Pending" : "Ready",
    status,
    vitaminD: labProfile.vitaminD,
  };
}

function matchesPatientFilter(patient, filter) {
  const workflow = getWorkflowStatus(patient);
  const stepStatus = (stepId) => workflow.steps.find((step) => step.id === stepId)?.status;

  if (filter === "High Risk") return patient.riskLevel === "High Risk";
  if (filter === "Moderate") return patient.riskLevel === "Moderate Risk";
  if (filter === "Stable") return patient.status === "Stable";
  if (filter === "Follow-up Due") return patient.status === "Follow-up";
  if (filter === "Missing Labs") return stepStatus("labs") === "Missing";
  if (filter === "Missing PES") return stepStatus("pes") === "Missing";
  if (filter === "Report Pending") return patient.reportStatus === "Pending" || stepStatus("reports") === "Missing";
  if (filter === "Research Participant") return patient.isResearchParticipant;
  return false;
}

function getRiskLevel(diagnosis, bmi) {
  const normalizedDiagnosis = diagnosis.toLowerCase();
  const numericBmi = Number(bmi);

  if (
    normalizedDiagnosis.includes("deficiency") ||
    normalizedDiagnosis.includes("iron") ||
    normalizedDiagnosis.includes("ckd") ||
    (numericBmi && (numericBmi < 18.5 || numericBmi >= 30))
  ) {
    return "High Risk";
  }

  if (
    normalizedDiagnosis.includes("ibs") ||
    normalizedDiagnosis.includes("obesity") ||
    (numericBmi && numericBmi >= 25)
  ) {
    return "Moderate Risk";
  }

  return "Low Risk";
}

function getPatientStatus(patient, riskLevel, index) {
  if (patient.id?.includes(Date.now().toString())) {
    return "New";
  }

  if (index === 0 && patient.id?.startsWith("patient-")) {
    return "New";
  }

  if (riskLevel === "High Risk" || patient.notes?.toLowerCase().includes("follow")) {
    return "Follow-up";
  }

  return "Stable";
}

function getNutritionStatus(diagnosis, bmi) {
  const normalizedDiagnosis = diagnosis.toLowerCase();
  const numericBmi = Number(bmi);

  if (normalizedDiagnosis.includes("deficiency") || normalizedDiagnosis.includes("iron")) {
    return "Micronutrient review";
  }

  if (numericBmi >= 30) {
    return "Weight management";
  }

  if (numericBmi && numericBmi < 18.5) {
    return "Undernutrition risk";
  }

  return "Stable nutrition";
}

function getLastVisit(index) {
  const visits = ["Today", "Yesterday", "2 days ago", "Last week", "2 weeks ago"];
  return visits[index % visits.length];
}

function getNextFollowUp(index, riskLevel) {
  if (riskLevel === "High Risk") return "This week";
  return ["May 28, 2026", "Jun 02, 2026", "Jun 09, 2026"][index % 3];
}

function getLabProfile(index, diagnosis) {
  const normalizedDiagnosis = diagnosis.toLowerCase();

  if (normalizedDiagnosis.includes("iron")) {
    return { ferritin: "12", vitaminD: "20" };
  }

  if (normalizedDiagnosis.includes("vitamin d")) {
    return { ferritin: "24", vitaminD: "14" };
  }

  return [
    { ferritin: "55", vitaminD: "28" },
    { ferritin: "42", vitaminD: "31" },
    { ferritin: "36", vitaminD: "22" },
  ][index % 3];
}

function JourneyStep({ label, status }) {
  const statusIcon = {
    Completed: "✓",
    "In Progress": "…",
    Missing: "□",
    "Needs Review": "!",
  }[status] || "□";
  const toneClassName = {
    Completed: "border-[var(--np-color-success-border)] bg-[var(--np-color-success-bg)] text-[var(--np-color-success)]",
    "In Progress": "border-[rgb(122_31_43_/_0.22)] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]",
    Missing: "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] text-[var(--np-color-text-muted)]",
    "Needs Review": "border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] text-[var(--np-color-warning)]",
  }[status];

  return (
    <span className={`flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-extrabold ${toneClassName}`}>
      <span>{statusIcon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function toneClass(tone) {
  if (tone === "secondary") {
    return "bg-[var(--np-color-secondary-soft)] text-[var(--np-color-secondary)]";
  }

  if (tone === "accent") {
    return "bg-[var(--np-color-accent-soft)] text-[var(--np-color-accent)]";
  }

  if (tone === "danger") {
    return "bg-[var(--np-color-danger-bg)] text-[var(--np-color-danger)]";
  }

  return "bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]";
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








