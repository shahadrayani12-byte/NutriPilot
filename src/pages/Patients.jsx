import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FileText,
  Filter,
  HeartPulse,
  IdCard,
  Mail,
  Map,
  MoreHorizontal,
  Phone,
  Pill,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Stethoscope,
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
import { useTranslation } from "../i18n";
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

const FIELD_ICONS = {
  Email: Mail,
  "Full Name": UserRound,
  MRN: IdCard,
  "National ID": IdCard,
  "Phone Number": Phone,
  "Referring Department": Stethoscope,
  "Referring Physician": Stethoscope,
};

const PATIENT_RECORD_TABS = [
  { id: "overview", label: "Overview" },
  { id: "personal", label: "Personal Information" },
  { id: "medical", label: "Medical Information" },
  { id: "laboratory", label: "Laboratory" },
  { id: "nutrition", label: "Nutrition Assessment" },
  { id: "pes", label: "Nutrition Diagnosis (PES)" },
  { id: "intervention", label: "Nutrition Intervention" },
  { id: "followUp", label: "Follow-up" },
  { id: "review", label: "Clinical Review" },
];

const AUTOSAVE_DELAY_MS = 1700;

const JOURNEY_TRACKER_STAGES = [
  { id: "assessment", label: "Assessment", tabId: "nutrition" },
  { id: "laboratory", label: "Laboratory", tabId: "laboratory" },
  { id: "pes", label: "PES", tabId: "pes" },
  { id: "intervention", label: "Intervention", tabId: "intervention" },
  { id: "followUp", label: "Follow-up", tabId: "followUp" },
  { id: "report", label: "Report", tabId: "review" },
];

const PATIENT_UX_TEXT = {
  ar: {
    activityLog: "سجل النشاط",
    aiReview: "مراجعة ذكية",
    cancel: "إلغاء",
    cancelChanges: "إلغاء التغييرات",
    cannotUndo: "لا يمكن التراجع عن هذا الحذف.",
    clinicalConsideration: "اعتبار سريري — يتطلب مراجعة المختص.",
    completedSections: "أقسام مكتملة",
    delete: "حذف",
    jumpTo: "انتقال سريع",
    missing: "ناقص",
    missingFields: "حقول ناقصة",
    more: "المزيد",
    needsReview: "يحتاج مراجعة",
    noAlerts: "لا توجد تنبيهات حرجة بناءً على البيانات الحالية.",
    openClinicalHub: "فتح المركز السريري",
    patientRecordCompletion: "اكتمال سجل المريض",
    reports: "التقارير",
    saveChanges: "حفظ التغييرات",
    saveFailed: "فشل الحفظ",
    saved: "تم الحفظ",
    savedJustNow: "تم الحفظ الآن",
    savedMinuteAgo: "تم الحفظ قبل دقيقة",
    savedMinutesAgo: "تم الحفظ قبل {count} دقائق",
    saving: "جارٍ الحفظ...",
    scheduleFollowUp: "جدولة متابعة",
    smartAlerts: "تنبيهات ذكية",
    unsavedChanges: "تغييرات غير محفوظة",
  },
  en: {
    activityLog: "Patient Activity Log",
    aiReview: "AI Review",
    cancel: "Cancel",
    cancelChanges: "Cancel Changes",
    cannotUndo: "This deletion cannot be undone.",
    clinicalConsideration: "Clinical consideration — clinician review required.",
    completedSections: "Completed sections",
    delete: "Delete",
    jumpTo: "Jump to",
    missing: "Missing",
    missingFields: "Missing fields",
    more: "More",
    needsReview: "Needs review",
    noAlerts: "No critical alerts from the available patient data.",
    openClinicalHub: "Open Clinical Hub",
    patientRecordCompletion: "Patient Record Completion",
    reports: "Reports",
    saveChanges: "Save Changes",
    saveFailed: "Save failed",
    saved: "Saved",
    savedJustNow: "Saved just now",
    savedMinuteAgo: "Saved 1 minute ago",
    savedMinutesAgo: "Saved {count} minutes ago",
    saving: "Saving...",
    scheduleFollowUp: "Schedule Follow-up",
    smartAlerts: "Smart Alerts",
    unsavedChanges: "Unsaved changes",
  },
};

const PATIENT_COPY_AR = {
  "Abnormal available laboratory indicators": "مؤشرات مخبرية متاحة غير طبيعية",
  "Abnormal laboratory indicators": "مؤشرات مخبرية غير طبيعية",
  "Abnormal labs": "تحاليل غير طبيعية",
  Assessment: "التقييم",
  "Available lab indicators include abnormal or review-required values.": "توجد مؤشرات مخبرية متاحة غير طبيعية أو تحتاج مراجعة.",
  "Clinical review": "المراجعة السريرية",
  "Clinical review approval": "اعتماد المراجعة السريرية",
  "Complete problem, etiology, and signs/symptoms.": "أكمل المشكلة والسبب والعلامات والأعراض.",
  "Complete required demographic and contact fields.": "أكمل الحقول الشخصية وبيانات التواصل المطلوبة.",
  "Current nutrition risk": "الخطر التغذوي الحالي",
  "Current record": "السجل الحالي",
  "Follow-up": "المتابعة",
  "Follow-up added": "تمت إضافة متابعة",
  "Follow-up overdue": "المتابعة متأخرة",
  "Follow-up visit": "زيارة متابعة",
  Ferritin: "الفيريتين",
  "Intervention": "التدخل",
  "Intervention missing": "التدخل غير مكتمل",
  "Intervention plan": "خطة التدخل",
  "Intervention review": "مراجعة التدخل",
  "Intervention updated": "تم تحديث التدخل",
  "Laboratory": "المختبر",
  "Laboratory result": "نتيجة مخبرية",
  "Laboratory result missing": "نتيجة المختبر غير موجودة",
  "Laboratory review": "مراجعة المختبر",
  "Laboratory updated": "تم تحديث المختبر",
  Latest: "الأحدث",
  "Missing critical documentation": "توثيق أساسي ناقص",
  MRN: "MRN",
  "Needs review": "يحتاج مراجعة",
  "Next follow-up": "المتابعة القادمة",
  "No laboratory result recorded yet.": "لا توجد نتيجة مخبرية مسجلة حتى الآن.",
  "None from available data": "لا يوجد حسب البيانات المتاحة",
  "None recorded": "لا يوجد مسجل",
  "Not flagged": "غير محدد",
  "Nutrition assessment updated": "تم تحديث التقييم التغذوي",
  "Nutrition risk": "الخطر التغذوي",
  "Patient created": "تم إنشاء المريض",
  "Personal information updated": "تم تحديث المعلومات الشخصية",
  "PES": "PES",
  "PES / intervention": "PES / التدخل",
  "PES diagnosis": "تشخيص PES",
  "PES incomplete": "تشخيص PES غير مكتمل",
  "PES review": "مراجعة PES",
  "PES updated": "تم تحديث PES",
  "Phone number": "رقم الهاتف",
  Recent: "حديثًا",
  Report: "التقرير",
  "Report generated": "تم إنشاء التقرير",
  "Report pending": "التقرير قيد الانتظار",
  "Record is not ready for final export approval.": "السجل غير جاهز لاعتماد التصدير النهائي.",
  "Required personal information missing": "معلومات شخصية مطلوبة ناقصة",
  "Review next follow-up date and visit status.": "راجع تاريخ المتابعة القادم وحالة الزيارة.",
};

function loadStoredPatients() {
  try {
    const storedPatients = localStorage.getItem(STORAGE_KEY);
    return storedPatients ? JSON.parse(storedPatients) : managedPatients;
  } catch {
    return managedPatients;
  }
}

export default function Patients({ activePatient, onNavigate, openWorkspace, setActivePatient, sharedPatients = [], updatePatient }) {
  const { language } = useTranslation();
  const [patients, setPatients] = useState(loadStoredPatients);
  const [selectedPatientId, setSelectedPatientId] = useState(
    () => activePatient?.id || loadStoredPatients()[0]?.id || "",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [formValues, setFormValues] = useState(emptyPatientForm);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [pendingPatientDelete, setPendingPatientDelete] = useState(null);
  const [activeRecordTab, setActiveRecordTab] = useState(() => getStoredPatientTab(activePatient?.id || selectedPatientId));

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
  const currentSelectedPatientId = activePatient?.id || selectedPatientId;
  const selectedPatient = useMemo(
    () =>
      patientProfiles.find((patient) => patient.id === currentSelectedPatientId) ||
      patientProfiles[0],
    [currentSelectedPatientId, patientProfiles],
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
  const filterCounts = useMemo(
    () =>
      Object.fromEntries(
        FILTERS.map((filter) => [
          filter,
          filter === "All"
            ? patientProfiles.length
            : patientProfiles.filter((patient) => matchesPatientFilter(patient, filter)).length,
        ]),
      ),
    [patientProfiles],
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
      setActiveRecordTab(getStoredPatientTab(patient.id));
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
    setPendingPatientDelete(patients.find((patient) => patient.id === patientId) || null);
  }

  function confirmPatientDelete() {
    if (!pendingPatientDelete) {
      return;
    }

    setPatients((currentPatients) => {
      const remainingPatients = currentPatients.filter(
        (patient) => patient.id !== pendingPatientDelete.id,
      );

      if (currentSelectedPatientId === pendingPatientDelete.id) {
        setSelectedPatientId(remainingPatients[0]?.id || "");
      }

      return remainingPatients;
    });

    if (editingPatientId === pendingPatientDelete.id) {
      resetForm();
    }

    setPendingPatientDelete(null);
  }

  return (
    <NutriPage data-language={language}>
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
                <span>{filter}</span>
                <span className="ml-2 rounded-full bg-[rgb(122_31_43_/_0.08)] px-2 py-0.5 text-[11px]">
                  {filterCounts[filter] || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                isSelected={currentSelectedPatientId === patient.id}
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
                onJourneyStage={(tabId) => {
                  setSelectedPatientId(patient.id);
                  setActivePatient(patient);
                  setActiveRecordTab(tabId);
                }}
                onSelect={() => {
                  setSelectedPatientId(patient.id);
                  setActivePatient(patient);
                  setActiveRecordTab(getStoredPatientTab(patient.id));
                }}
                patient={patient}
                language={language}
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

        {selectedPatient ? (
          <ClinicalNutritionPatientRecord
            key={selectedPatient.id}
            activeTab={activeRecordTab}
            language={language}
            onNavigate={(targetPage) => {
              setActivePatient(selectedPatient);
              onNavigate(targetPage);
            }}
            onOpenWorkspace={() => {
              setActivePatient(selectedPatient);
              openWorkspace(selectedPatient);
            }}
            patient={selectedPatient}
            setActiveTab={setActiveRecordTab}
            onSavePatient={(updatedPatient) => {
              setPatients((currentPatients) =>
                currentPatients.map((patient) => (patient.id === updatedPatient.id ? updatedPatient : patient)),
              );
              setSelectedPatientId(updatedPatient.id);
              setActivePatient(updatedPatient);
              updatePatient?.(updatedPatient);
            }}
          />
        ) : null}
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
      {pendingPatientDelete ? (
        <ConfirmDialog
          description={`This will remove ${pendingPatientDelete.fullName || "this patient"} from the local patient registry.`}
          itemName={pendingPatientDelete.fullName || "Patient"}
          language={language}
          onCancel={() => setPendingPatientDelete(null)}
          onConfirm={confirmPatientDelete}
          title="Delete patient?"
        />
      ) : null}
      </NutriPageMain>
    </NutriPage>
  );
}

function PatientCard({
  isSelected,
  language,
  onDelete,
  onEdit,
  onJourneyStage,
  onOpenWorkspace,
  onQuickAction,
  onSelect,
  patient,
}) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const draftPatient = createPatientDraft(patient);
  const validationErrors = validatePatientDraft(draftPatient);
  const completion = buildPatientRecordCompletion(draftPatient, validationErrors);
  const journeySteps = JOURNEY_TRACKER_STAGES.map((stage) => ({
    ...stage,
    status: completion.tabStatuses[stage.tabId] || "Missing",
  }));

  return (
    <article
      className={`group rounded-[24px] border bg-white p-4 shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)] ${
        isSelected
          ? "border-[var(--np-color-brand)] ring-4 ring-[rgb(122_31_43_/_0.08)]"
          : "border-[var(--np-color-border-soft)]"
      }`}
    >
      <div
        className="w-full text-left"
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
        role="button"
        tabIndex={0}
      >
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

        <div className="mt-4 rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
              Clinical Journey
            </p>
            <span className="text-sm font-extrabold text-[var(--np-color-brand)]">{completion.percent}%</span>
          </div>
          <JourneyTracker
            compact
            language={language}
            onStageClick={(tabId) => onJourneyStage?.(tabId)}
            stages={journeySteps}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onOpenWorkspace}
          className="np-button np-button-primary min-h-11 flex-1 px-3 text-xs sm:flex-none"
        >
          <Activity className="h-4 w-4" />
          Open Clinical Hub
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreOpen((current) => !current)}
            className="np-button np-button-secondary min-h-11 px-3 text-xs"
            aria-expanded={isMoreOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
            More
          </button>
          {isMoreOpen ? (
            <div className="absolute right-0 z-30 mt-2 w-56 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-2 shadow-[var(--np-shadow-elevated)]">
              {[
                ["nutrimap", Map, "NutriMap"],
                ["ai", Brain, "AI Review"],
                ["reports", FileText, "Reports"],
                ["appointments", CalendarDays, "Schedule Follow-up"],
              ].map(([targetPage, Icon, label]) => (
                <button
                  className="flex min-h-10 w-full items-center gap-2 rounded-[12px] px-3 text-left text-xs font-extrabold text-[var(--np-color-text)] transition hover:bg-[var(--np-color-surface-muted)]"
                  key={targetPage}
                  onClick={() => {
                    setIsMoreOpen(false);
                    onQuickAction(targetPage);
                  }}
                  type="button"
                >
                  <Icon className="h-4 w-4 text-[var(--np-color-brand)]" />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="min-h-10 rounded-full px-3 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:bg-[var(--np-color-surface-muted)] hover:text-[var(--np-color-brand)]"
          >
            <Edit3 className="h-4 w-4" />
            Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="min-h-10 rounded-full px-3 text-xs font-extrabold text-[var(--np-color-danger)] transition hover:bg-[var(--np-color-danger-bg)]"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

function ClinicalNutritionPatientRecord({ activeTab, language, onNavigate, onOpenWorkspace, onSavePatient, patient, setActiveTab }) {
  const [draftPatient, setDraftPatient] = useState(() => createPatientDraft(patient));
  const [autosaveStatus, setAutosaveStatus] = useState("Saved");
  const [isRecordMoreOpen, setIsRecordMoreOpen] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState(() => loadPatientDraft(patient.id));
  const [pendingClinicalDelete, setPendingClinicalDelete] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const livePatient = enrichPatient({ ...draftPatient, diagnosis: primaryDiagnosisText(draftPatient) }, 0);
  const workflow = getWorkflowStatus(livePatient);
  const labs = buildPatientLabSummary(livePatient);
  const snapshot = buildClinicalSnapshot(livePatient, labs);
  const savedDraft = useMemo(() => createPatientDraft(patient), [patient]);
  const validationErrors = useMemo(() => validatePatientDraft(draftPatient), [draftPatient]);
  const completion = useMemo(() => buildPatientRecordCompletion(draftPatient, validationErrors), [draftPatient, validationErrors]);
  const smartAlerts = buildPatientSmartAlerts(livePatient, completion);
  const riskSummary = buildClinicalRiskSummary(livePatient, completion, labs);
  const activityLog = buildPatientActivityLog(livePatient, workflow);
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const changedFields = useMemo(() => getChangedFields(savedDraft, draftPatient), [draftPatient, savedDraft]);
  const hasChanges = Object.keys(changedFields).length > 0;

  useEffect(() => {
    localStorage.setItem(patientTabStorageKey(patient.id), activeTab);
  }, [activeTab, patient.id]);

  useEffect(() => {
    if (!hasChanges) {
      clearPatientDraft(patient.id);
      return undefined;
    }

    savePatientDraft(patient.id, draftPatient);

    if (hasValidationErrors) {
      return undefined;
    }

    const autosaveTimer = window.setTimeout(() => {
      try {
        setAutosaveStatus("Saving...");
        onSavePatient?.(normalizeInteractivePatient({ ...savedDraft, ...changedFields, id: draftPatient.id }));
        clearPatientDraft(patient.id);
        setRecoveryDraft(null);
        setAutosaveStatus("Saved");
        setSavedAt(Date.now());
      } catch {
        setAutosaveStatus("Save failed");
      }
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(autosaveTimer);
  }, [changedFields, draftPatient, hasChanges, hasValidationErrors, onSavePatient, patient.id, savedDraft]);

  function updateField(field, value) {
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((currentPatient) => ({ ...currentPatient, [field]: value }));
  }

  function updateCollection(collectionName, itemId, field, value) {
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((currentPatient) => ({
      ...currentPatient,
      [collectionName]: currentPatient[collectionName].map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addCollectionItem(collectionName, template) {
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((currentPatient) => ({
      ...currentPatient,
      [collectionName]: [{ ...template, id: `${collectionName}-${Date.now()}` }, ...currentPatient[collectionName]],
    }));
  }

  function deleteCollectionItem(collectionName, itemId) {
    const item = draftPatient[collectionName].find((collectionItem) => collectionItem.id === itemId);
    setPendingClinicalDelete({
      collectionName,
      itemId,
      itemName: clinicalItemName(collectionName, item),
    });
  }

  function confirmClinicalDelete() {
    if (!pendingClinicalDelete) {
      return;
    }
    setAutosaveStatus("Unsaved changes");
    setDraftPatient((currentPatient) => ({
      ...currentPatient,
      [pendingClinicalDelete.collectionName]: currentPatient[pendingClinicalDelete.collectionName].filter((item) => item.id !== pendingClinicalDelete.itemId),
    }));
    setPendingClinicalDelete(null);
  }

  function saveRecord() {
    if (hasValidationErrors) {
      setAutosaveStatus("Unsaved changes");
      return;
    }

    onSavePatient?.(normalizeInteractivePatient(draftPatient));
    clearPatientDraft(patient.id);
    setRecoveryDraft(null);
    setAutosaveStatus("Saved");
    setSavedAt(Date.now());
  }

  function cancelEdits() {
    setDraftPatient(createPatientDraft(patient));
    clearPatientDraft(patient.id);
    setRecoveryDraft(null);
    setAutosaveStatus("Saved");
  }

  function restoreDraft() {
    if (!recoveryDraft) {
      return;
    }

    setDraftPatient(recoveryDraft);
    setRecoveryDraft(null);
    setAutosaveStatus("Unsaved changes");
  }

  function discardDraft() {
    clearPatientDraft(patient.id);
    setRecoveryDraft(null);
  }

  function handleTabKeyDown(event, tabId) {
    const currentIndex = PATIENT_RECORD_TABS.findIndex((tab) => tab.id === tabId);
    const nextIndex = event.key === "ArrowRight" ? currentIndex + 1 : event.key === "ArrowLeft" ? currentIndex - 1 : currentIndex;

    if (nextIndex !== currentIndex) {
      event.preventDefault();
      const nextTab = PATIENT_RECORD_TABS[(nextIndex + PATIENT_RECORD_TABS.length) % PATIENT_RECORD_TABS.length];
      setActiveTab(nextTab.id);
      window.requestAnimationFrame(() => document.getElementById(`patient-record-tab-${nextTab.id}`)?.focus());
    }
  }

  return (
    <aside className="space-y-5">
      <section className="sticky top-3 z-20 rounded-[30px] border border-[var(--np-color-border-soft)] bg-white/95 p-5 shadow-[var(--np-shadow-card)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <PatientAvatar inverse name={livePatient.fullName} />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
                Clinical Nutrition Patient Record
              </p>
              <h2 className="mt-1 text-2xl font-extrabold leading-tight text-[var(--np-color-text)]">
                {livePatient.fullName}
              </h2>
              <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
                {livePatient.mrn} • {livePatient.gender || "Not specified"} • {livePatient.age || "Age pending"} years
              </p>
              <p className="mt-1 line-clamp-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                {primaryDiagnosisText(draftPatient) || "Diagnosis pending"} • {livePatient.status || "Status pending"} • Last: {livePatient.lastVisit || "Pending"} • Next: {draftPatient.nextFollowUpDate || livePatient.nextFollowUpDate || "Pending"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <RiskBadge risk={livePatient.riskLevel} />
            <span className="np-badge np-badge-secondary shrink-0">
              {completion.percent}%
            </span>
            <span className={`np-badge ${autosaveStatus === "Save failed" ? "np-badge-danger" : autosaveStatus === "Saving..." ? "np-badge-warning" : autosaveStatus === "Unsaved changes" ? "np-badge-accent" : "np-badge-success"}`}>
              {formatSaveStatus(autosaveStatus, savedAt, language)}
            </span>
            <button className="np-button np-button-primary min-h-10 px-3 text-xs" disabled={!hasChanges || hasValidationErrors} onClick={saveRecord} type="button">
              <Save className="h-4 w-4" />
              {uxText(language, "saveChanges")}
            </button>
            <button className="np-button np-button-secondary min-h-10 px-3 text-xs" disabled={!hasChanges} onClick={cancelEdits} type="button">
              {uxText(language, "cancelChanges")}
            </button>
            <div className="relative">
              <button
                aria-expanded={isRecordMoreOpen}
                className="np-button np-button-secondary min-h-10 px-3 text-xs"
                onClick={() => setIsRecordMoreOpen((current) => !current)}
                type="button"
              >
                <MoreHorizontal className="h-4 w-4" />
                {uxText(language, "more")}
              </button>
              {isRecordMoreOpen ? (
                <div className="absolute right-0 z-40 mt-2 w-56 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-2 shadow-[var(--np-shadow-elevated)]">
                  {[
                    [uxText(language, "openClinicalHub"), Activity, onOpenWorkspace],
                    [uxText(language, "reports"), FileText, () => onNavigate("reports")],
                    ["NutriMap", Map, () => onNavigate("nutrimap")],
                    [uxText(language, "scheduleFollowUp"), CalendarDays, () => onNavigate("appointments")],
                    [uxText(language, "aiReview"), Brain, () => onNavigate("ai")],
                  ].map(([label, Icon, action]) => (
                    <button
                      className="flex min-h-10 w-full items-center gap-2 rounded-[12px] px-3 text-left text-xs font-extrabold text-[var(--np-color-text)] transition hover:bg-[var(--np-color-surface-muted)]"
                      key={label}
                      onClick={() => {
                        setIsRecordMoreOpen(false);
                        action();
                      }}
                      type="button"
                    >
                      <Icon className="h-4 w-4 text-[var(--np-color-brand)]" />
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <ClinicalRiskSummaryPanel language={language} summary={riskSummary} />

        {recoveryDraft ? (
          <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">An unsaved patient draft was found.</p>
            <div className="flex flex-wrap gap-2">
              <button className="np-button np-button-secondary min-h-9 px-3 text-xs" onClick={restoreDraft} type="button">Restore Draft</button>
              <button className="np-button np-button-secondary min-h-9 px-3 text-xs" onClick={discardDraft} type="button">Discard Draft</button>
            </div>
          </div>
        ) : null}

        <div aria-label="Patient record sections" className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist">
          {PATIENT_RECORD_TABS.map((tab) => (
            <button
              aria-controls={`patient-record-panel-${tab.id}`}
              aria-selected={activeTab === tab.id}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-xs font-extrabold transition ${
                activeTab === tab.id
                  ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white"
                  : "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
              }`}
              id={`patient-record-tab-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
              role="tab"
              tabIndex={activeTab === tab.id ? 0 : -1}
              type="button"
            >
              {tab.label}
              <span className="ms-2 rounded-full bg-white/20 px-2 py-0.5 text-[10px]">{translateStatus(getTabCompletionStatus(tab.id, draftPatient, validationErrors), language)}</span>
            </button>
          ))}
        </div>
        <label className="mt-3 flex flex-col gap-2 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
            {uxText(language, "jumpTo")}
          </span>
          <select
            className="np-form-control min-h-10 bg-white text-sm sm:max-w-xs"
            onChange={(event) => setActiveTab(event.target.value)}
            value={activeTab}
          >
            {PATIENT_RECORD_TABS.map((tab) => (
              <option key={tab.id} value={tab.id}>
                {tab.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {activeTab === "personal" ? (
        <div id="patient-record-panel-personal" role="tabpanel" aria-labelledby="patient-record-tab-personal">
        <ClinicalRecordSection icon={UserRound} title="Personal Information">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <EditableField error={validationErrors.fullName} label="Full Name" value={draftPatient.fullName} onChange={(value) => updateField("fullName", value)} />
          <EditableField label="MRN" value={draftPatient.mrn} onChange={(value) => updateField("mrn", value)} />
          <EditableField label="National ID" value={draftPatient.nationalId} onChange={(value) => updateField("nationalId", value)} />
          <EditableField label="Date of Birth" type="date" value={draftPatient.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} />
          <EditableField error={validationErrors.age} label="Age" type="number" value={draftPatient.age} onChange={(value) => updateField("age", value)} />
          <EditableSelect label="Gender" options={["Female", "Male", "Other", "Not specified"]} value={draftPatient.gender} onChange={(value) => updateField("gender", value)} />
          <EditableField error={validationErrors.phone} label="Phone Number" value={draftPatient.phone} onChange={(value) => updateField("phone", value)} />
          <EditableField label="Email" type="email" value={draftPatient.email} onChange={(value) => updateField("email", value)} />
          <EditableField label="Referring Department" value={draftPatient.referringDepartment} onChange={(value) => updateField("referringDepartment", value)} />
          <EditableField label="Referring Physician" value={draftPatient.referringPhysician} onChange={(value) => updateField("referringPhysician", value)} />
          <EditableSelect label="Nutrition Risk Level" options={["High Risk", "Moderate Risk", "Low Risk"]} value={draftPatient.riskLevel} onChange={(value) => updateField("riskLevel", value)} />
          <EditableSelect label="Current Status" options={["New", "Stable", "Follow-up", "Needs Review"]} value={draftPatient.status} onChange={(value) => updateField("status", value)} />
          <EditableField error={validationErrors.lastVisitDate} label="Last Visit" type="date" value={draftPatient.lastVisitDate} onChange={(value) => updateField("lastVisitDate", value)} />
          <EditableField error={validationErrors.nextFollowUpDate} label="Next Follow-up" type="date" value={draftPatient.nextFollowUpDate} onChange={(value) => updateField("nextFollowUpDate", value)} />
          <EditableTextarea className="sm:col-span-2" label="Clinical Notes" value={draftPatient.notes} onChange={(value) => updateField("notes", value)} />
          </div>
        </ClinicalRecordSection>
        </div>
      ) : null}

      {activeTab === "overview" ? (
      <div id="patient-record-panel-overview" role="tabpanel" aria-labelledby="patient-record-tab-overview" className="space-y-5">
      <ClinicalRecordSection icon={HeartPulse} title="Clinical Snapshot">
        <div className="grid grid-cols-2 gap-3">
          {snapshot.map((item) => (
            <SnapshotMetric key={item.label} {...item} />
          ))}
        </div>
      </ClinicalRecordSection>
      <PatientRecordCompletionPanel completion={completion} language={language} />
      <SmartAlertsPanel alerts={smartAlerts} language={language} onOpenTab={setActiveTab} />
      <PatientActivityLogPanel events={activityLog} language={language} />
      </div>
      ) : null}

      {activeTab === "medical" ? (
      <div id="patient-record-panel-medical" role="tabpanel" aria-labelledby="patient-record-tab-medical">
      <ClinicalRecordSection icon={ClipboardCheck} title="Medical Information">
        <div className="grid grid-cols-1 gap-3">
          <EditableTextarea label="Medical History" value={draftPatient.medicalHistory} onChange={(value) => updateField("medicalHistory", value)} />
          <EditableMultiSelect label="Comorbidities" options={["CKD", "Diabetes", "IBS", "Obesity", "Hypertension", "Iron deficiency"]} value={draftPatient.comorbidities} onChange={(value) => updateField("comorbidities", value)} />
          <EditableTextarea label="Lifestyle" value={draftPatient.lifestyle} onChange={(value) => updateField("lifestyle", value)} />
          <ToggleField checked={draftPatient.smoking} label="Smoking" onChange={(value) => updateField("smoking", value)} />
          <EditableSelect label="Physical Activity" options={["Sedentary", "Light", "Moderate", "Active"]} value={draftPatient.physicalActivity} onChange={(value) => updateField("physicalActivity", value)} />
          <EditableTextarea label="Family History" value={draftPatient.familyHistory} onChange={(value) => updateField("familyHistory", value)} />
          <EditableCollection
            collectionName="medications"
            fields={[
              ["name", "Medication", "text"],
              ["dose", "Dose", "text"],
              ["notes", "Nutrition interaction notes", "textarea"],
            ]}
            items={draftPatient.medications}
            onAdd={() => addCollectionItem("medications", { name: "", dose: "", notes: "" })}
            onDelete={(itemId) => deleteCollectionItem("medications", itemId)}
            onUpdate={(itemId, field, value) => updateCollection("medications", itemId, field, value)}
            title="Current Medications"
          />
          <EditableCollection
            collectionName="allergies"
            fields={[
              ["name", "Allergy / Intolerance", "text"],
              ["reaction", "Reaction", "text"],
              ["severity", "Severity", "select", ["Low", "Moderate", "High"]],
            ]}
            items={draftPatient.allergies}
            onAdd={() => addCollectionItem("allergies", { name: "", reaction: "", severity: "Low" })}
            onDelete={(itemId) => deleteCollectionItem("allergies", itemId)}
            onUpdate={(itemId, field, value) => updateCollection("allergies", itemId, field, value)}
            title="Food Allergies & Intolerances"
          />
        </div>
      </ClinicalRecordSection>
      </div>
      ) : null}

      {activeTab === "laboratory" ? (
      <div id="patient-record-panel-laboratory" role="tabpanel" aria-labelledby="patient-record-tab-laboratory">
      <ClinicalRecordSection icon={Pill} title="Laboratory Summary">
        <EditableCollection
          collectionName="labValues"
          fields={[
            ["label", "Lab", "text"],
            ["value", "Value", "number"],
            ["unit", "Unit", "text"],
            ["status", "Status", "select", ["Normal", "Low", "High", "Needs Review", "Pending"]],
          ]}
          items={draftPatient.labValues}
          onAdd={() => addCollectionItem("labValues", { label: "New Lab", value: "", unit: "", status: "Pending" })}
          onDelete={(itemId) => deleteCollectionItem("labValues", itemId)}
          errors={validationErrors.labValues}
          onUpdate={(itemId, field, value) => updateCollection("labValues", itemId, field, value)}
          title="Editable Laboratory Values"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {labs.map((lab) => (
            <LabSummaryItem key={lab.label} lab={lab} />
          ))}
        </div>
      </ClinicalRecordSection>
      </div>
      ) : null}

      {activeTab === "nutrition" ? (
      <div id="patient-record-panel-nutrition" role="tabpanel" aria-labelledby="patient-record-tab-nutrition">
      <ClinicalRecordSection icon={Activity} title="Nutrition Assessment">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <EditableField error={validationErrors.height} label="Height (cm)" type="number" value={draftPatient.height} onChange={(value) => updateField("height", value)} />
          <EditableField error={validationErrors.weight} label="Weight (kg)" type="number" value={draftPatient.weight} onChange={(value) => updateField("weight", value)} />
          <EditableField label="Recent Weight Change" value={draftPatient.weightChange} onChange={(value) => updateField("weightChange", value)} />
          <EditableSelect label="Appetite" options={["Good", "Fair", "Poor", "Reduced"]} value={draftPatient.appetite} onChange={(value) => updateField("appetite", value)} />
          <EditableTextarea label="Dietary Recall" value={draftPatient.dietaryRecall} onChange={(value) => updateField("dietaryRecall", value)} />
          <EditableTextarea label="GI Symptoms" value={draftPatient.giSymptoms} onChange={(value) => updateField("giSymptoms", value)} />
          <EditableField label="Fluid Intake" value={draftPatient.fluidIntake} onChange={(value) => updateField("fluidIntake", value)} />
          <EditableTextarea label="Estimated Requirements" value={draftPatient.estimatedRequirements} onChange={(value) => updateField("estimatedRequirements", value)} />
          {buildNutritionAssessment(livePatient, workflow).map(([label, value]) => (
            <ClinicalRecordField key={label} label={label} value={value} />
          ))}
        </div>
      </ClinicalRecordSection>
      </div>
      ) : null}

      {activeTab === "pes" ? (
      <div id="patient-record-panel-pes" role="tabpanel" aria-labelledby="patient-record-tab-pes">
      <ClinicalRecordSection icon={Stethoscope} title="Nutrition Diagnosis (PES)">
        <EditableCollection
          collectionName="diagnoses"
          fields={[
            ["problem", "Problem", "text"],
            ["etiology", "Etiology", "text"],
            ["signs", "Signs & Symptoms", "textarea"],
            ["status", "Status", "select", ["Active", "Monitoring", "Resolved"]],
          ]}
          items={draftPatient.diagnoses}
          onAdd={() => addCollectionItem("diagnoses", { problem: "", etiology: "", signs: "", status: "Active" })}
          onDelete={(itemId) => deleteCollectionItem("diagnoses", itemId)}
          onUpdate={(itemId, field, value) => updateCollection("diagnoses", itemId, field, value)}
          title="Editable PES Diagnoses"
        />
      </ClinicalRecordSection>
      </div>
      ) : null}

      {activeTab === "intervention" ? (
      <div id="patient-record-panel-intervention" role="tabpanel" aria-labelledby="patient-record-tab-intervention">
      <ClinicalRecordSection icon={FileText} title="Nutrition Intervention">
        <EditableCollection
          collectionName="interventions"
          fields={[
            ["goal", "Goal", "text"],
            ["dietPrescription", "Diet Prescription", "text"],
            ["education", "Education", "textarea"],
            ["supplements", "Supplements", "text"],
            ["status", "Status", "select", ["Draft", "Active", "Completed"]],
          ]}
          items={draftPatient.interventions}
          onAdd={() => addCollectionItem("interventions", { goal: "", dietPrescription: "", education: "", supplements: "", status: "Draft" })}
          onDelete={(itemId) => deleteCollectionItem("interventions", itemId)}
          onUpdate={(itemId, field, value) => updateCollection("interventions", itemId, field, value)}
          title="Editable Nutrition Interventions"
        />
      </ClinicalRecordSection>
      </div>
      ) : null}

      {activeTab === "followUp" ? (
      <div id="patient-record-panel-followUp" role="tabpanel" aria-labelledby="patient-record-tab-followUp">
      <ClinicalRecordSection icon={CalendarDays} title="Follow-up Timeline">
        <EditableCollection
          collectionName="followUps"
          fields={[
            ["date", "Visit Date", "date"],
            ["type", "Visit Type", "text"],
            ["summary", "Summary", "textarea"],
            ["status", "Status", "select", ["Scheduled", "Completed", "Missed", "Needs Review"]],
          ]}
          items={draftPatient.followUps}
          onAdd={() => addCollectionItem("followUps", { date: "", type: "Follow-up Visit", summary: "", status: "Scheduled" })}
          onDelete={(itemId) => deleteCollectionItem("followUps", itemId)}
          onUpdate={(itemId, field, value) => updateCollection("followUps", itemId, field, value)}
          title="Follow-up Visits"
        />
        <div className="mt-4">
          <PatientRecordTimeline patient={livePatient} workflow={workflow} />
        </div>
      </ClinicalRecordSection>
      </div>
      ) : null}

      {activeTab === "review" ? (
      <div id="patient-record-panel-review" role="tabpanel" aria-labelledby="patient-record-tab-review">
      <ClinicalRecordSection icon={ShieldCheck} title="Clinical Review">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <EditableSelect label="Review Status" options={["Needs Review", "Reviewed", "Approved"]} value={draftPatient.reviewStatus} onChange={(value) => updateField("reviewStatus", value)} />
          <ToggleField checked={draftPatient.needsReview} label="Needs Review" onChange={(value) => updateField("needsReview", value)} />
          <ToggleField checked={draftPatient.approved} label="Approved" onChange={(value) => updateField("approved", value)} />
          <EditableField label="Reviewed By" value={draftPatient.reviewedBy} onChange={(value) => updateField("reviewedBy", value)} />
          <EditableField label="Review Date" type="date" value={draftPatient.reviewDate} onChange={(value) => updateField("reviewDate", value)} />
        </div>
      </ClinicalRecordSection>
      </div>
      ) : null}

      {activeTab === "overview" ? (
      <section className="rounded-[28px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-card)]">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">
              Quick Actions
            </p>
            <h3 className="text-lg font-extrabold text-[var(--np-color-text)]">Main clinical actions</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={onOpenWorkspace} className="np-button np-button-primary min-h-12">
            <Activity className="h-4 w-4" />
            Open Clinical Hub
          </button>
          <button type="button" onClick={() => onNavigate("reports")} className="np-button np-button-secondary min-h-12">
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
          <button type="button" onClick={() => onNavigate("nutrimap")} className="np-button np-button-secondary min-h-12">
            <Map className="h-4 w-4" />
            Open NutriMap
          </button>
          <button type="button" onClick={() => onNavigate("appointments")} className="np-button np-button-secondary min-h-12">
            <CalendarDays className="h-4 w-4" />
            Schedule Follow-up
          </button>
          <button type="button" onClick={() => onNavigate("ai")} className="np-button np-button-secondary min-h-12 sm:col-span-2">
            <Brain className="h-4 w-4" />
            AI Review
          </button>
        </div>
      </section>
      ) : null}
      {pendingClinicalDelete ? (
        <ConfirmDialog
          description={`This will remove "${pendingClinicalDelete.itemName}" from this patient record.`}
          itemName={pendingClinicalDelete.itemName}
          language={language}
          onCancel={() => setPendingClinicalDelete(null)}
          onConfirm={confirmClinicalDelete}
          title="Delete clinical entry?"
        />
      ) : null}
    </aside>
  );
}

function ClinicalRecordSection({ children, icon: Icon, title }) {
  return (
    <section className="rounded-[28px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-card)]">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-[var(--np-color-surface-muted)] text-[var(--np-color-brand)]">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="text-lg font-extrabold text-[var(--np-color-text)]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function ClinicalRecordField({ label, value }) {
  const Icon = FIELD_ICONS[label];

  return (
    <div className="min-w-0 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--np-color-brand)]" /> : null}
        <p className="truncate text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--np-color-text-soft)]">
          {label}
        </p>
      </div>
      <p className="mt-1 break-words text-sm font-extrabold leading-5 text-[var(--np-color-text)]">
        {value || "Not recorded"}
      </p>
    </div>
  );
}

function EditableField({ className = "", error = "", label, onChange, type = "text", value }) {
  const Icon = FIELD_ICONS[label];

  return (
    <label className={`block min-w-0 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-2.5 ${className}`}>
      <span className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--np-color-text-soft)]">
        {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--np-color-brand)]" /> : null}
        {label}
      </span>
      <input
        className={`np-form-control min-h-10 bg-white text-sm ${error ? "border-[var(--np-color-danger)]" : ""}`}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value || ""}
      />
      {error ? <p className="mt-2 text-xs font-bold text-[var(--np-color-danger)]">{error}</p> : null}
    </label>
  );
}

function EditableTextarea({ className = "", label, onChange, value }) {
  return (
    <label className={`block min-w-0 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-2.5 ${className}`}>
      <span className="np-form-label">{label}</span>
      <textarea
        className="np-form-control min-h-24 resize-y bg-white text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value || ""}
      />
    </label>
  );
}

function EditableSelect({ label, onChange, options, value }) {
  return (
    <label className="block min-w-0 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-2.5">
      <span className="np-form-label">{label}</span>
      <select className="np-form-control min-h-10 bg-white text-sm" onChange={(event) => onChange(event.target.value)} value={value || ""}>
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function EditableMultiSelect({ label, onChange, options, value = [] }) {
  function toggleOption(option) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-2.5">
      <p className="np-form-label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`rounded-full border px-3 py-2 text-xs font-extrabold transition ${
              value.includes(option)
                ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand)] text-white"
                : "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)]"
            }`}
            key={option}
            onClick={() => toggleOption(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleField({ checked, label, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-2.5">
      <span className="text-sm font-extrabold text-[var(--np-color-text)]">{label}</span>
      <button
        aria-pressed={checked}
        className={`relative h-8 w-14 rounded-full transition ${checked ? "bg-[var(--np-color-brand)]" : "bg-[var(--np-color-border)]"}`}
        onClick={() => onChange(!checked)}
        type="button"
      >
        <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}

function EditableCollection({ errors = [], fields, items, onAdd, onDelete, onUpdate, title }) {
  return (
    <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</h4>
        <button className="np-button np-button-secondary min-h-9 px-3 text-xs" onClick={onAdd} type="button">
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-2.5" key={item.id}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {fields.map(([field, label, type, options]) => (
                <CollectionField
                  field={field}
                  key={field}
                  label={label}
                  onChange={(value) => onUpdate(item.id, field, value)}
                  options={options}
                  type={type}
                  value={item[field]}
                />
              ))}
            </div>
            <button
              className="np-button mt-3 min-h-9 border border-[rgb(185_28_28_/_0.22)] bg-[var(--np-color-danger-bg)] px-3 text-xs font-extrabold text-[var(--np-color-danger)]"
              onClick={() => onDelete(item.id)}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            {errors.find((error) => error.id === item.id)?.message ? (
              <p className="mt-2 text-xs font-bold text-[var(--np-color-danger)]">
                {errors.find((error) => error.id === item.id).message}
              </p>
            ) : null}
          </div>
        ))}
        {items.length === 0 ? (
          <p className="rounded-[16px] bg-[var(--np-color-surface-muted)] p-3 text-sm font-bold text-[var(--np-color-text-muted)]">
            No items added yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CollectionField({ label, onChange, options = [], type, value }) {
  if (type === "textarea") {
    return <EditableTextarea label={label} onChange={onChange} value={value} />;
  }

  if (type === "select") {
    return <EditableSelect label={label} onChange={onChange} options={options} value={value} />;
  }

  return <EditableField label={label} onChange={onChange} type={type} value={value} />;
}

function ConfirmDialog({ description, itemName, language = "en", onCancel, onConfirm, title }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgb(31_41_55_/_0.36)] p-4 backdrop-blur-sm">
      <section className="w-full max-w-md rounded-[24px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-elevated)]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[var(--np-color-danger-bg)] text-[var(--np-color-danger)]">
            <Trash2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold text-[var(--np-color-text)]">{title}</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{description}</p>
            <p className="mt-2 text-xs font-extrabold text-[var(--np-color-danger)]">
              {uxText(language, "cannotUndo")}
            </p>
            <p className="mt-3 rounded-[14px] bg-[var(--np-color-surface-muted)] p-3 text-sm font-extrabold text-[var(--np-color-text)]">
              {itemName}
            </p>
          </div>
        </div>
        <footer className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button className="np-button np-button-secondary min-h-11" onClick={onCancel} type="button">
            {uxText(language, "cancel")}
          </button>
          <button className="np-button min-h-11 border border-[rgb(185_28_28_/_0.22)] bg-[var(--np-color-danger-bg)] px-4 text-sm font-extrabold text-[var(--np-color-danger)] hover:border-[var(--np-color-danger)]" onClick={onConfirm} type="button">
            {uxText(language, "delete")}
          </button>
        </footer>
      </section>
    </div>
  );
}

function SnapshotMetric({ label, status, value }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--np-color-text-soft)]">{label}</p>
        <ClinicalStatusBadge status={status} />
      </div>
      <p className="mt-2 break-words text-lg font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function LabSummaryItem({ lab }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-[var(--np-color-text)]">{lab.label}</p>
          <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{lab.group}</p>
        </div>
        <ClinicalStatusBadge status={lab.status} />
      </div>
      <p className="mt-3 text-lg font-extrabold text-[var(--np-color-text)]">
        {lab.value} <span className="text-xs text-[var(--np-color-text-muted)]">{lab.unit}</span>
      </p>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{lab.range}</p>
    </div>
  );
}

function ClinicalStatusBadge({ status }) {
  const className = {
    Normal: "np-badge np-badge-success",
    Low: "np-badge np-badge-warning",
    High: "np-badge np-badge-danger",
    "Needs Review": "np-badge np-badge-danger",
    Pending: "np-badge np-badge-secondary",
    Ready: "np-badge np-badge-success",
  }[status] || "np-badge np-badge-secondary";

  return <span className={`${className} shrink-0 text-[10px]`}>{status}</span>;
}

function ClinicalRiskSummaryPanel({ language, summary }) {
  return (
    <section className="mt-4 rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">
          {uxText(language, "clinicalConsideration")}
        </p>
        <ClinicalStatusBadge status={summary.priority} />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
        {summary.items.map((item) => (
          <div className="rounded-[16px] bg-white p-3" key={item.label}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--np-color-text-soft)]">
              {translateClinicalCopy(item.label, language)}
            </p>
            <p className="mt-1 text-sm font-extrabold text-[var(--np-color-text)]">{translateClinicalCopy(item.value, language)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PatientRecordCompletionPanel({ completion, language }) {
  return (
    <ClinicalRecordSection icon={ClipboardCheck} title={uxText(language, "patientRecordCompletion")}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_1fr]">
        <div className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4 text-center">
          <p className="text-4xl font-extrabold text-[var(--np-color-brand)]">{completion.percent}%</p>
          <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
            {uxText(language, "completedSections")}: {completion.completedCount}/{completion.totalCount}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <CompletionList
            emptyText={uxText(language, "noAlerts")}
            items={completion.missingFields}
            language={language}
            title={uxText(language, "missingFields")}
            tone="missing"
          />
          <CompletionList
            emptyText={uxText(language, "noAlerts")}
            items={completion.needsReviewFields}
            language={language}
            title={uxText(language, "needsReview")}
            tone="review"
          />
        </div>
      </div>
    </ClinicalRecordSection>
  );
}

function CompletionList({ emptyText, items, language, title, tone }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${
                tone === "review"
                  ? "bg-[var(--np-color-warning-bg)] text-[var(--np-color-warning)]"
                  : "bg-white text-[var(--np-color-text-muted)]"
              }`}
              key={item}
            >
              {translateClinicalCopy(item, language)}
            </span>
          ))
        ) : (
          <span className="text-sm font-bold text-[var(--np-color-text-muted)]">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function SmartAlertsPanel({ alerts, language, onOpenTab }) {
  return (
    <ClinicalRecordSection icon={AlertTriangle} title={uxText(language, "smartAlerts")}>
      <div className="space-y-2">
        {alerts.length ? (
          alerts.map((alert) => (
            <button
              className="flex min-h-12 w-full items-center justify-between gap-3 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3 text-left transition hover:border-[var(--np-color-brand)] hover:bg-white"
              key={alert.title}
              onClick={() => onOpenTab(alert.tabId)}
              type="button"
            >
              <span className="min-w-0">
                <span className="block text-sm font-extrabold text-[var(--np-color-text)]">{translateClinicalCopy(alert.title, language)}</span>
                <span className="mt-0.5 block text-xs font-bold text-[var(--np-color-text-muted)]">{translateClinicalCopy(alert.detail, language)}</span>
              </span>
              <ClinicalStatusBadge status={alert.status} />
            </button>
          ))
        ) : (
          <p className="rounded-[16px] bg-[var(--np-color-surface-muted)] p-3 text-sm font-bold text-[var(--np-color-text-muted)]">
            {uxText(language, "noAlerts")}
          </p>
        )}
      </div>
    </ClinicalRecordSection>
  );
}

function PatientActivityLogPanel({ events, language }) {
  return (
    <ClinicalRecordSection icon={Activity} title={uxText(language, "activityLog")}>
      <div className="space-y-2">
        {events.map((event) => (
          <div className="flex items-start gap-3 rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={`${event.title}-${event.date}`}>
            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${event.status === "Complete" ? "bg-[var(--np-color-success)]" : event.status === "Needs Review" ? "bg-[var(--np-color-warning)]" : "bg-[var(--np-color-brand)]"}`} />
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">{translateClinicalCopy(event.title, language)}</p>
              <p className="mt-0.5 text-xs font-bold text-[var(--np-color-text-muted)]">{translateClinicalCopy(event.date, language)}</p>
            </div>
          </div>
        ))}
      </div>
    </ClinicalRecordSection>
  );
}

function JourneyTracker({ compact = false, language, onStageClick, stages }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {stages.map((stage) => (
        <button
          className={`min-h-11 shrink-0 rounded-[16px] border px-3 text-left transition hover:-translate-y-0.5 ${journeyToneClass(stage.status)} ${compact ? "min-w-[132px]" : "min-w-[150px]"}`}
          key={stage.id}
          onClick={(event) => {
            event.stopPropagation();
            onStageClick(stage.tabId);
          }}
          type="button"
        >
          <span className="block text-xs font-extrabold text-[var(--np-color-text)]">{translateClinicalCopy(stage.label, language)}</span>
          <span className="mt-1 block text-[11px] font-bold text-[var(--np-color-text-muted)]">
            {translateStatus(stage.status, language)}
          </span>
        </button>
      ))}
    </div>
  );
}

function PatientRecordTimeline({ patient, workflow }) {
  const timeline = buildPatientTimeline(patient, workflow);

  return (
    <div className="space-y-3">
      {timeline.map((event, index) => (
        <div className="relative flex gap-3" key={`${event.title}-${event.date}`}>
          <div className="flex flex-col items-center">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${eventToneClass(event.status)}`}>
              <CheckCircle2 className="h-4 w-4" />
            </span>
            {index < timeline.length - 1 ? <span className="mt-2 h-full min-h-8 w-px bg-[var(--np-color-border-soft)]" /> : null}
          </div>
          <div className="min-w-0 flex-1 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">{event.title}</p>
              <ClinicalStatusBadge status={event.status} />
            </div>
            <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{event.date}</p>
            <p className="mt-2 text-sm font-bold leading-5 text-[var(--np-color-text-muted)]">{event.detail}</p>
          </div>
        </div>
      ))}
    </div>
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

function patientTabStorageKey(patientId) {
  return `nutripilot.patientRecord.tab.${patientId}`;
}

function patientDraftStorageKey(patientId) {
  return `nutripilot.patientRecord.draft.${patientId}`;
}

function getStoredPatientTab(patientId) {
  try {
    const storedTab = localStorage.getItem(patientTabStorageKey(patientId));
    return PATIENT_RECORD_TABS.some((tab) => tab.id === storedTab) ? storedTab : "overview";
  } catch {
    return "overview";
  }
}

function loadPatientDraft(patientId) {
  try {
    const storedDraft = localStorage.getItem(patientDraftStorageKey(patientId));
    return storedDraft ? JSON.parse(storedDraft) : null;
  } catch {
    return null;
  }
}

function savePatientDraft(patientId, draftPatient) {
  localStorage.setItem(patientDraftStorageKey(patientId), JSON.stringify(draftPatient));
}

function clearPatientDraft(patientId) {
  localStorage.removeItem(patientDraftStorageKey(patientId));
}

function getChangedFields(savedDraft, draftPatient) {
  return Object.fromEntries(
    Object.entries(draftPatient).filter(([key, value]) => JSON.stringify(savedDraft[key]) !== JSON.stringify(value)),
  );
}

function validatePatientDraft(patient) {
  const errors = {};
  const numericAge = Number(patient.age);
  const numericHeight = Number(patient.height);
  const numericWeight = Number(patient.weight);

  if (!String(patient.fullName || "").trim()) {
    errors.fullName = "Patient name is required.";
  }

  if (patient.age !== "" && (!numericAge || numericAge < 0 || numericAge > 120)) {
    errors.age = "Age must be between 0 and 120.";
  }

  if (patient.phone && !/^[+()\-\s0-9]{7,20}$/.test(patient.phone)) {
    errors.phone = "Use a valid phone number format.";
  }

  if (patient.height !== "" && (!numericHeight || numericHeight < 0)) {
    errors.height = "Height cannot be negative.";
  }

  if (patient.weight !== "" && (!numericWeight || numericWeight < 0)) {
    errors.weight = "Weight cannot be negative.";
  }

  if (patient.lastVisitDate && !isValidDateValue(patient.lastVisitDate)) {
    errors.lastVisitDate = "Use a valid date.";
  }

  if (patient.nextFollowUpDate && !isValidDateValue(patient.nextFollowUpDate)) {
    errors.nextFollowUpDate = "Use a valid date.";
  }

  const labErrors = (patient.labValues || [])
    .map((lab) => {
      if (lab.value !== "" && Number.isNaN(Number(lab.value))) {
        return { id: lab.id, message: "Laboratory value must be numeric." };
      }

      if (lab.value !== "" && !String(lab.unit || "").trim()) {
        return { id: lab.id, message: "Unit is required when a value is entered." };
      }

      return null;
    })
    .filter(Boolean);

  if (labErrors.length) {
    errors.labValues = labErrors;
  }

  return errors;
}

function isValidDateValue(value) {
  return !Number.isNaN(Date.parse(value));
}

function getTabCompletionStatus(tabId, patient, validationErrors) {
  if (tabHasErrors(tabId, validationErrors)) return "Draft";

  const hasValue = (value) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(String(value || "").trim());
  };
  const hasMeaningfulCollectionData = (items, fields) =>
    (items || []).some((item) => fields.some((field) => hasValue(item[field])));
  const hasReviewStatus = (items) => (items || []).some((item) => ["Needs Review", "Monitoring", "Draft", "Scheduled"].includes(item.status));

  const statusByTab = {
    followUp: collectionCompletion(patient.followUps, ["date", "type", "summary"], ["date", "type"]),
    intervention: hasReviewStatus(patient.interventions)
      ? "Needs Review"
      : collectionCompletion(patient.interventions, ["goal", "dietPrescription", "education", "supplements"], ["goal", "dietPrescription"]),
    laboratory: labCompletion(patient.labValues),
    medical: hasReviewStatus(patient.medications)
      ? "Needs Review"
      : medicalCompletion(patient, hasMeaningfulCollectionData, hasValue),
    nutrition: nutritionCompletion(patient, hasValue),
    overview: "Complete",
    personal: hasValue(patient.fullName) && hasValue(patient.mrn) ? "Complete" : "Missing",
    pes: hasReviewStatus(patient.diagnoses)
      ? "Needs Review"
      : collectionCompletion(patient.diagnoses, ["problem", "etiology", "signs"], ["problem", "etiology", "signs"]),
    review: patient.reviewStatus === "Approved" ? "Complete" : "Needs Review",
  };

  return statusByTab[tabId] || "Missing";
}

function collectionCompletion(items = [], dataFields, requiredFields) {
  const hasAnyData = items.some((item) => dataFields.some((field) => Boolean(String(item[field] || "").trim())));
  if (!hasAnyData) return "Missing";

  const hasCompleteItem = items.some((item) => requiredFields.every((field) => Boolean(String(item[field] || "").trim())));
  return hasCompleteItem ? "Complete" : "In Progress";
}

function labCompletion(labValues = []) {
  const labsWithData = labValues.filter((lab) => hasClinicalEntryValue(lab.value));
  if (!labsWithData.length) return "Missing";
  if (labsWithData.some((lab) => lab.status === "Needs Review" || lab.status === "Low" || lab.status === "High")) return "Needs Review";
  return labsWithData.every((lab) => Boolean(String(lab.unit || "").trim())) ? "Complete" : "In Progress";
}

function hasClinicalEntryValue(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  return Boolean(normalizedValue) && !["pending", "no result recorded yet", "not recorded"].includes(normalizedValue);
}

function medicalCompletion(patient, hasMeaningfulCollectionData, hasValue) {
  const hasMedicalData =
    hasValue(patient.medicalHistory) ||
    hasValue(patient.lifestyle) ||
    hasMeaningfulCollectionData(patient.medications, ["name", "dose", "notes"]) ||
    hasMeaningfulCollectionData(patient.allergies, ["name", "reaction"]);

  if (!hasMedicalData) return "Missing";
  return hasValue(patient.medicalHistory) ? "Complete" : "In Progress";
}

function nutritionCompletion(patient, hasValue) {
  const hasNutritionData = ["height", "weight", "dietaryRecall", "giSymptoms", "fluidIntake", "estimatedRequirements"].some((field) => hasValue(patient[field]));
  if (!hasNutritionData) return "Missing";
  return hasValue(patient.height) && hasValue(patient.weight) && hasValue(patient.dietaryRecall) ? "Complete" : "In Progress";
}

function tabHasErrors(tabId, validationErrors) {
  const errorKeysByTab = {
    laboratory: ["labValues"],
    nutrition: ["height", "weight"],
    personal: ["fullName", "age", "phone", "lastVisitDate", "nextFollowUpDate"],
  };

  return (errorKeysByTab[tabId] || []).some((key) => validationErrors[key]);
}

function buildPatientRecordCompletion(patient, validationErrors = {}) {
  const tabStatuses = Object.fromEntries(
    PATIENT_RECORD_TABS.map((tab) => [tab.id, getTabCompletionStatus(tab.id, patient, validationErrors)]),
  );
  const trackedTabs = PATIENT_RECORD_TABS.filter((tab) => tab.id !== "overview");
  const scoreByStatus = {
    Complete: 1,
    "In Progress": 0.45,
    "Needs Review": 0.65,
    Draft: 0.25,
    Missing: 0,
  };
  const score = trackedTabs.reduce((total, tab) => total + (scoreByStatus[tabStatuses[tab.id]] || 0), 0);
  const completedCount = trackedTabs.filter((tab) => tabStatuses[tab.id] === "Complete").length;
  const missingFields = getMissingPatientFields(patient, tabStatuses);
  const needsReviewFields = getNeedsReviewFields(patient, tabStatuses);

  return {
    completedCount,
    missingFields,
    needsReviewFields,
    percent: Math.round((score / trackedTabs.length) * 100),
    tabStatuses,
    totalCount: trackedTabs.length,
  };
}

function getMissingPatientFields(patient, tabStatuses) {
  const missing = [];
  const hasValue = (value) => Boolean(String(value || "").trim());

  if (!hasValue(patient.phone)) missing.push("Phone number");
  if (!hasValue(patient.mrn)) missing.push("MRN");
  if (!hasValue(patient.nextFollowUpDate)) missing.push("Next follow-up");
  if (tabStatuses.laboratory === "Missing") missing.push("Laboratory result");
  if (!hasClinicalEntryValue(patient.labValues?.find((lab) => lab.label === "Ferritin")?.value)) missing.push("Ferritin");
  if (tabStatuses.pes === "Missing") missing.push("PES diagnosis");
  if (tabStatuses.intervention === "Missing") missing.push("Intervention plan");
  if (tabStatuses.followUp === "Missing") missing.push("Follow-up visit");
  if (tabStatuses.review !== "Complete") missing.push("Clinical review approval");

  return [...new Set(missing)];
}

function getNeedsReviewFields(patient, tabStatuses) {
  const reviewFields = [];
  const abnormalLabs = (patient.labValues || []).filter((lab) => ["Low", "High", "Needs Review"].includes(lab.status));

  if (patient.riskLevel === "High Risk") reviewFields.push("Nutrition risk");
  if (abnormalLabs.length) reviewFields.push("Abnormal laboratory indicators");
  if (tabStatuses.laboratory === "Needs Review") reviewFields.push("Laboratory review");
  if (tabStatuses.pes === "Needs Review") reviewFields.push("PES review");
  if (tabStatuses.intervention === "Needs Review") reviewFields.push("Intervention review");
  if (patient.needsReview || patient.reviewStatus === "Needs Review") reviewFields.push("Clinical review");

  return [...new Set(reviewFields)];
}

function buildPatientSmartAlerts(patient, completion) {
  const alerts = [];
  const statusFor = (tabId) => completion.tabStatuses[tabId];
  const hasAbnormalLabs = (patient.labValues || []).some((lab) => ["Low", "High", "Needs Review"].includes(lab.status));

  if (statusFor("laboratory") === "Missing") {
    alerts.push({ detail: "No laboratory result recorded yet.", status: "Pending", tabId: "laboratory", title: "Laboratory result missing" });
  }

  if (hasFollowUpOverdue(patient)) {
    alerts.push({ detail: "Review next follow-up date and visit status.", status: "Needs Review", tabId: "followUp", title: "Follow-up overdue" });
  }

  if (statusFor("pes") !== "Complete") {
    alerts.push({ detail: "Complete problem, etiology, and signs/symptoms.", status: statusFor("pes"), tabId: "pes", title: "PES incomplete" });
  }

  if (statusFor("intervention") !== "Complete") {
    alerts.push({ detail: "Add clinician-approved nutrition goals and prescription.", status: statusFor("intervention"), tabId: "intervention", title: "Intervention missing" });
  }

  if (statusFor("review") !== "Complete") {
    alerts.push({ detail: "Record is not ready for final export approval.", status: statusFor("review"), tabId: "review", title: "Report pending" });
  }

  if (completion.missingFields.some((field) => ["Phone number", "MRN"].includes(field))) {
    alerts.push({ detail: "Complete required demographic and contact fields.", status: "Missing", tabId: "personal", title: "Required personal information missing" });
  }

  if (hasAbnormalLabs) {
    alerts.push({ detail: "Available lab indicators include abnormal or review-required values.", status: "Needs Review", tabId: "laboratory", title: "Abnormal available laboratory indicators" });
  }

  return alerts;
}

function buildClinicalRiskSummary(patient, completion, labs) {
  const abnormalLabs = labs.filter((lab) => ["Low", "High", "Needs Review"].includes(lab.status));
  const missingCritical = completion.missingFields.slice(0, 3);
  const priority = patient.riskLevel === "High Risk" || abnormalLabs.length ? "Needs Review" : "Ready";

  return {
    priority,
    items: [
      { label: "Current nutrition risk", value: patient.riskLevel || "Not recorded" },
      { label: "Missing critical documentation", value: missingCritical.length ? missingCritical.join(", ") : "None from available data" },
      { label: "Overdue follow-up", value: hasFollowUpOverdue(patient) ? "Needs review" : "Not flagged" },
      { label: "Abnormal labs", value: abnormalLabs.length ? abnormalLabs.map((lab) => lab.label).slice(0, 3).join(", ") : "None recorded" },
      { label: "PES / intervention", value: [completion.tabStatuses.pes, completion.tabStatuses.intervention].join(" / ") },
    ],
  };
}

function buildPatientActivityLog(patient, workflow) {
  const stepStatus = (stepId) => workflow.steps.find((step) => step.id === stepId)?.status || "Missing";
  const events = [
    { date: "Current record", status: "Complete", title: "Patient created" },
    { date: patient.lastVisit || "Recent", status: patient.phone || patient.mrn ? "Complete" : "In Progress", title: "Personal information updated" },
    { date: patient.lastVisit || "Recent", status: stepStatus("labs"), title: "Laboratory updated" },
    { date: patient.lastVisit || "Recent", status: stepStatus("assessment"), title: "Nutrition assessment updated" },
    { date: patient.lastVisit || "Recent", status: stepStatus("pes"), title: "PES updated" },
    { date: patient.lastVisit || "Recent", status: stepStatus("intervention"), title: "Intervention updated" },
    { date: patient.nextFollowUpDate || "Pending", status: stepStatus("monitoring"), title: "Follow-up added" },
    { date: "Latest", status: stepStatus("reports"), title: "Report generated" },
  ];

  return events.reverse();
}

function hasFollowUpOverdue(patient) {
  if (!patient.nextFollowUpDate || !isValidDateValue(patient.nextFollowUpDate)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(patient.nextFollowUpDate) < today;
}

function uxText(language, key, params = {}) {
  const text = PATIENT_UX_TEXT[language]?.[key] || PATIENT_UX_TEXT.en[key] || key;
  return Object.entries(params).reduce((current, [paramKey, value]) => current.replace(`{${paramKey}}`, value), text);
}

function formatSaveStatus(status, savedAt, language) {
  if (status === "Saving...") return uxText(language, "saving");
  if (status === "Unsaved changes") return uxText(language, "unsavedChanges");
  if (status === "Save failed") return uxText(language, "saveFailed");
  if (!savedAt) return uxText(language, "saved");

  const minutes = Math.floor((Date.now() - savedAt) / 60000);
  if (minutes <= 0) return uxText(language, "savedJustNow");
  if (minutes === 1) return uxText(language, "savedMinuteAgo");
  return uxText(language, "savedMinutesAgo", { count: minutes });
}

function translateStatus(status, language) {
  if (language !== "ar") return status;

  return {
    Complete: "مكتمل",
    Completed: "مكتمل",
    Draft: "مسودة",
    "In Progress": "قيد العمل",
    Missing: "ناقص",
    "Needs Review": "يحتاج مراجعة",
    Pending: "قيد الانتظار",
    Ready: "جاهز",
  }[status] || status;
}

function translateClinicalCopy(value, language) {
  if (language !== "ar") return value;
  const text = String(value || "");

  if (text.includes(", ")) {
    return text
      .split(", ")
      .map((item) => translateClinicalCopy(item, language))
      .join("، ");
  }

  if (text.includes(" / ")) {
    return text
      .split(" / ")
      .map((item) => translateClinicalCopy(item, language))
      .join(" / ");
  }

  return PATIENT_COPY_AR[text] || translateStatus(text, language);
}

function journeyToneClass(status) {
  return {
    Complete: "border-[var(--np-color-success-border)] bg-[var(--np-color-success-bg)]",
    "In Progress": "border-[rgb(122_31_43_/_0.22)] bg-[var(--np-color-brand-soft)]",
    "Needs Review": "border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)]",
    Draft: "border-[var(--np-color-accent-border)] bg-[var(--np-color-accent-soft)]",
    Missing: "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)]",
  }[status] || "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)]";
}

function clinicalItemName(collectionName, item = {}) {
  const fallbackNames = {
    allergies: "Allergy or intolerance",
    diagnoses: "PES diagnosis",
    followUps: "Follow-up visit",
    interventions: "Nutrition intervention",
    labValues: "Laboratory result",
    medications: "Medication",
  };

  return item.name || item.label || item.problem || item.goal || item.type || fallbackNames[collectionName] || "Clinical entry";
}

function createPatientDraft(patient) {
  const diagnoses = Array.isArray(patient.diagnoses) && patient.diagnoses.length
    ? patient.diagnoses
    : buildPesDiagnoses(patient).map((diagnosis, index) => ({
        ...diagnosis,
        id: `diagnosis-${index}`,
        status: index === 0 ? "Active" : "Monitoring",
      }));
  const labs = Array.isArray(patient.labValues) && patient.labValues.length
    ? patient.labValues
    : buildPatientLabSummary(patient).map((lab, index) => ({
        id: `lab-${index}`,
        label: lab.label,
        status: lab.status,
        unit: lab.unit,
        value: ["Pending", "Panel", "No result recorded yet"].includes(lab.value) ? "" : lab.value,
      }));

  return {
    ...patient,
    allergies: Array.isArray(patient.allergies) ? patient.allergies : [{ id: "allergy-1", name: "", reaction: "", severity: "Low" }],
    appetite: patient.appetite || "Fair",
    approved: Boolean(patient.approved),
    comorbidities: Array.isArray(patient.comorbidities) ? patient.comorbidities : inferredComorbidities(patient.diagnosis),
    dateOfBirth: patient.dateOfBirth || "",
    diagnoses,
    dietaryRecall: patient.dietaryRecall || "",
    email: patient.email || "",
    estimatedRequirements: patient.estimatedRequirements || "",
    familyHistory: patient.familyHistory || "",
    fluidIntake: patient.fluidIntake || "",
    followUps: Array.isArray(patient.followUps) && patient.followUps.length
      ? patient.followUps
      : [{ id: "follow-up-1", date: patient.nextFollowUpDate || "", status: "Scheduled", summary: "", type: "Follow-up Visit" }],
    giSymptoms: patient.giSymptoms || getGiSymptoms(patient.diagnosis),
    labValues: labs,
    lastVisitDate: patient.lastVisitDate || "",
    lifestyle: patient.lifestyle || "",
    medicalHistory: patient.medicalHistory || "",
    medications: Array.isArray(patient.medications) ? patient.medications : [{ id: "medication-1", name: "", dose: "", notes: "" }],
    nationalId: patient.nationalId || "",
    needsReview: patient.needsReview ?? patient.riskLevel === "High Risk",
    phone: patient.phone || "",
    physicalActivity: patient.physicalActivity || "Light",
    referringDepartment: patient.referringDepartment || getReferringDepartment(patient.diagnosis),
    referringPhysician: patient.referringPhysician || "",
    reviewDate: patient.reviewDate || "",
    reviewedBy: patient.reviewedBy || "",
    reviewStatus: patient.reviewStatus || (patient.riskLevel === "High Risk" ? "Needs Review" : "Reviewed"),
    smoking: Boolean(patient.smoking),
    weightChange: patient.weightChange || "",
    interventions: Array.isArray(patient.interventions) && patient.interventions.length
      ? patient.interventions
      : [{
          dietPrescription: "",
          education: "",
          goal: getInterventionGoals(patient),
          id: "intervention-1",
          status: "Draft",
          supplements: "",
        }],
  };
}

function normalizeInteractivePatient(patient) {
  return {
    ...patient,
    age: Number(patient.age) || "",
    diagnosis: primaryDiagnosisText(patient),
    height: Number(patient.height) || "",
    notes: patient.notes || "",
    weight: Number(patient.weight) || "",
  };
}

function primaryDiagnosisText(patient) {
  const activeDiagnosis = patient.diagnoses?.find((diagnosis) => diagnosis.status === "Active") || patient.diagnoses?.[0];

  return activeDiagnosis?.problem || patient.diagnosis || "";
}

function inferredComorbidities(diagnosis) {
  const normalizedDiagnosis = String(diagnosis || "").toLowerCase();
  return [
    normalizedDiagnosis.includes("ckd") ? "CKD" : null,
    normalizedDiagnosis.includes("diabetes") ? "Diabetes" : null,
    normalizedDiagnosis.includes("ibs") ? "IBS" : null,
    normalizedDiagnosis.includes("obesity") ? "Obesity" : null,
    normalizedDiagnosis.includes("iron") ? "Iron deficiency" : null,
  ].filter(Boolean);
}

function getReferringDepartment(diagnosis) {
  const normalizedDiagnosis = String(diagnosis || "").toLowerCase();
  if (normalizedDiagnosis.includes("ckd")) return "Nephrology";
  if (normalizedDiagnosis.includes("diabetes") || normalizedDiagnosis.includes("obesity")) return "Endocrinology";
  if (normalizedDiagnosis.includes("ibs") || normalizedDiagnosis.includes("gi")) return "Gastroenterology";
  if (normalizedDiagnosis.includes("pediatric")) return "Pediatrics";
  return "Internal Medicine";
}

function buildPatientLabSummary(patient) {
  if (Array.isArray(patient.labValues) && patient.labValues.length) {
    return patient.labValues.map((lab) => ({
      group: lab.group || lab.label,
      label: lab.label || "Lab",
      range: lab.range || "Editable clinical value",
      status: lab.status || "Pending",
      unit: lab.unit || "",
      value: lab.value || "Pending",
    }));
  }

  const ferritin = Number(patient.ferritin || 42);
  const vitaminD = Number(patient.vitaminD || 28);
  const bmi = Number(patient.bmi);
  const hb = patient.riskLevel === "High Risk" ? 10.8 : 13.2;
  const albumin = patient.riskLevel === "High Risk" ? 3.2 : 4.1;
  const hba1c = String(patient.diagnosis || "").toLowerCase().includes("obesity") ? 6.1 : 5.4;

  return [
    { group: "CBC", label: "CBC", range: "Add CBC panel values", status: "Pending", unit: "", value: "No result recorded yet" },
    { group: "CBC", label: "Hemoglobin", range: "12.0-16.0", status: hb < 12 ? "Low" : "Normal", unit: "g/dL", value: hb },
    { group: "Iron", label: "Ferritin", range: "15-150", status: ferritin < 15 ? "Low" : "Normal", unit: "ug/L", value: ferritin },
    { group: "Iron", label: "Serum Iron", range: "Add reference range", status: ferritin < 15 ? "Needs Review" : "Pending", unit: "ug/dL", value: "No result recorded yet" },
    { group: "Iron", label: "TIBC", range: "Add reference range", status: "Pending", unit: "ug/dL", value: "No result recorded yet" },
    { group: "Iron", label: "Transferrin Saturation", range: "20-50", status: ferritin < 15 ? "Low" : "Pending", unit: "%", value: ferritin < 15 ? "14" : "Pending" },
    { group: "Vitamins", label: "Vitamin D", range: "30-100", status: vitaminD < 20 ? "Low" : "Normal", unit: "ng/mL", value: vitaminD },
    { group: "Vitamins", label: "Vitamin B12", range: "Add reference range", status: "Pending", unit: "pg/mL", value: "No result recorded yet" },
    { group: "Vitamins", label: "Folate", range: "Add reference range", status: "Pending", unit: "ng/mL", value: "No result recorded yet" },
    { group: "Protein", label: "Albumin", range: "3.5-5.0", status: albumin < 3.5 ? "Low" : "Normal", unit: "g/dL", value: albumin },
    { group: "Inflammation", label: "CRP", range: "< 5", status: patient.riskLevel === "High Risk" ? "High" : "Pending", unit: "mg/L", value: patient.riskLevel === "High Risk" ? "8" : "Pending" },
    { group: "Glucose", label: "HbA1c", range: "< 5.7", status: hba1c >= 5.7 ? "High" : "Normal", unit: "%", value: hba1c },
    { group: "Renal", label: "Creatinine", range: "Add reference range", status: "Pending", unit: "mg/dL", value: "No result recorded yet" },
    { group: "Renal", label: "eGFR", range: "Add reference range", status: String(patient.diagnosis || "").toLowerCase().includes("ckd") ? "Needs Review" : "Pending", unit: "mL/min", value: "No result recorded yet" },
    { group: "Lipid Profile", label: "Lipid Profile", range: "Add lipid panel values", status: bmi >= 30 ? "Needs Review" : "Pending", unit: "", value: "No result recorded yet" },
    { group: "Electrolytes", label: "Electrolytes", range: "Add electrolyte panel values", status: "Pending", unit: "", value: "No result recorded yet" },
  ];
}

function buildClinicalSnapshot(patient, labs) {
  const findLab = (label) => labs.find((lab) => lab.label === label) || {};

  return [
    { label: "BMI", status: getBmiStatus(patient.bmi), value: patient.bmi || "Pending" },
    { label: "Weight", status: patient.weight ? "Normal" : "Pending", value: patient.weight ? `${patient.weight} kg` : "Pending" },
    { label: "Height", status: patient.height ? "Normal" : "Pending", value: patient.height ? `${patient.height} cm` : "Pending" },
    { label: "Recent Weight Change", status: patient.riskLevel === "High Risk" ? "Needs Review" : "Pending", value: patient.weightChange || "Enter recent weight change" },
    { label: "Ferritin", status: findLab("Ferritin").status, value: `${findLab("Ferritin").value} ug/L` },
    { label: "Hemoglobin", status: findLab("Hemoglobin").status, value: `${findLab("Hemoglobin").value} g/dL` },
    { label: "Vitamin D", status: findLab("Vitamin D").status, value: `${findLab("Vitamin D").value} ng/mL` },
    { label: "Albumin", status: findLab("Albumin").status, value: `${findLab("Albumin").value} g/dL` },
    { label: "HbA1c", status: findLab("HbA1c").status, value: `${findLab("HbA1c").value}%` },
    { label: "Current Nutrition Diagnosis", status: patient.riskLevel === "High Risk" ? "Needs Review" : "Ready", value: getPrimaryNutritionDiagnosis(patient) },
    { label: "Latest AI Insight", status: patient.aiStatus === "Review needed" ? "Needs Review" : "Ready", value: patient.aiStatus },
  ];
}

function buildNutritionAssessment(patient, workflow) {
  return [
    ["Anthropometrics", workflow.steps.find((step) => step.id === "assessment")?.status || "Missing"],
    ["Weight History", patient.weightChange || "Enter weight history"],
    ["Dietary Recall", patient.dietaryRecall || workflow.steps.find((step) => step.id === "dietary")?.status || "Missing"],
    ["Food Frequency", "Enter food frequency details"],
    ["Appetite", patient.appetite || "Not documented"],
    ["GI Symptoms", patient.giSymptoms || getGiSymptoms(patient.diagnosis)],
    ["Nutrition Risk Screening", patient.riskLevel],
    ["Estimated Requirements", patient.estimatedRequirements || "Pending calculation review"],
    ["Fluid Intake", patient.fluidIntake || "Enter fluid intake"],
    ["Physical Activity", patient.physicalActivity || "Enter physical activity level"],
  ];
}

function buildPesDiagnoses(patient) {
  if (Array.isArray(patient.diagnoses) && patient.diagnoses.length) {
    return patient.diagnoses;
  }

  const primary = getPrimaryNutritionDiagnosis(patient);

  return [
    {
      problem: primary,
      etiology: getPesEtiology(patient),
      signs: getPesSigns(patient),
    },
    {
      problem: "Food and nutrition-related knowledge deficit",
      etiology: "related to pending education assessment",
      signs: "as evidenced by incomplete education documentation",
    },
  ];
}

function buildPatientTimeline(patient, workflow) {
  const stepStatus = (stepId) => workflow.steps.find((step) => step.id === stepId)?.status || "Missing";

  return [
    { date: "Newest", detail: "Report status follows the shared workflow state.", status: stepStatus("reports") === "Completed" ? "Ready" : "Pending", title: "Report Generated" },
    { date: patient.nextFollowUpDate || "Pending", detail: "Add follow-up timing and visit notes.", status: stepStatus("monitoring"), title: "Follow-up Visit" },
    { date: "Recent", detail: "Add patient education notes.", status: stepStatus("intervention"), title: "Patient Education" },
    { date: "Recent", detail: "Rule-based AI review status from local patient workflow.", status: stepStatus("ai"), title: "AI Review" },
    { date: "Recent", detail: "Diet plan and intervention record status.", status: stepStatus("intervention"), title: "Diet Plan Created" },
    { date: patient.lastVisit || "Recent", detail: "Laboratory review status from shared workflow.", status: stepStatus("labs"), title: "Laboratory Updated" },
    { date: patient.lastVisit || "Recent", detail: "Initial assessment status from shared workflow.", status: stepStatus("assessment"), title: "Assessment Completed" },
  ];
}

function getBmiStatus(bmi) {
  const numericBmi = Number(bmi);
  if (!numericBmi) return "Pending";
  if (numericBmi < 18.5 || numericBmi >= 30) return "Needs Review";
  if (numericBmi >= 25) return "High";
  return "Normal";
}

function getPrimaryNutritionDiagnosis(patient) {
  const diagnosis = String(patient.diagnosis || "").toLowerCase();
  if (diagnosis.includes("iron")) return "Altered nutrition-related laboratory values";
  if (diagnosis.includes("obesity")) return "Overweight/obesity";
  if (diagnosis.includes("ibs")) return "Altered GI function nutrition concern";
  if (Number(patient.bmi) < 18.5) return "Unintended weight loss risk";
  return "Nutrition diagnosis pending clinician review";
}

function getPesEtiology(patient) {
  const diagnosis = String(patient.diagnosis || "").toLowerCase();
  if (diagnosis.includes("iron")) return "related to possible inadequate iron intake or absorption context";
  if (diagnosis.includes("ibs")) return "related to gastrointestinal symptoms";
  if (diagnosis.includes("obesity")) return "related to energy balance and lifestyle factors";
  return "related to incomplete nutrition assessment data";
}

function getPesSigns(patient) {
  if (patient.riskLevel === "High Risk") return "as evidenced by high nutrition risk and abnormal available indicators";
  if (patient.bmi) return `as evidenced by BMI ${patient.bmi}`;
  return "as evidenced by incomplete clinical documentation";
}

function getGiSymptoms(diagnosis) {
  const normalizedDiagnosis = String(diagnosis || "").toLowerCase();
  if (normalizedDiagnosis.includes("ibs")) return "Enter gastrointestinal symptoms...";
  return "No GI symptoms documented";
}

function getInterventionGoals(patient) {
  if (patient.riskLevel === "High Risk") return "Prioritize nutrition risk review, lab follow-up, and clinician-approved intervention.";
  if (String(patient.diagnosis || "").toLowerCase().includes("obesity")) return "Support weight management and cardiometabolic nutrition goals.";
  return "Maintain nutrition stability and complete missing workflow documentation.";
}

function eventToneClass(status) {
  if (status === "Completed" || status === "Ready" || status === "Reviewed") {
    return "bg-[var(--np-color-success-bg)] text-[var(--np-color-success)]";
  }

  if (status === "Needs Review" || status === "High") {
    return "bg-[var(--np-color-danger-bg)] text-[var(--np-color-danger)]";
  }

  if (status === "In Progress") {
    return "bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]";
  }

  return "bg-[var(--np-color-surface-muted)] text-[var(--np-color-text-muted)]";
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








