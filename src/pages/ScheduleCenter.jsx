import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Beaker,
  Brain,
  BriefcaseMedical,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  FlaskConical,
  Lock,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Stethoscope,
  Video,
  XCircle,
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
import { useTranslation } from "../i18n";

const filters = ["All", "Clinical", "Follow-up", "Research", "Telehealth", "High Risk", "Missed", "Completed"];
const views = ["Month", "Week", "Day"];

const appointments = [
  {
    id: "appt-1",
    time: "08:00",
    endTime: "08:45",
    patient: "Sarah Ahmed",
    type: "Lab Review",
    group: "Clinical",
    duration: "45 min",
    risk: "High",
    status: "Scheduled",
    color: "danger",
    notes: "Low ferritin trend with poor dietary intake.",
    checklist: ["Review ferritin", "Check Hb", "Prepare iron-rich diet education"],
    labs: ["Ferritin", "Hemoglobin", "CRP"],
    tasks: ["Schedule 6-8 week recheck", "Update PES statement"],
    icon: FlaskConical,
  },
  {
    id: "appt-2",
    time: "09:00",
    endTime: "09:30",
    patient: "Mohammed Khalid",
    type: "Follow-up",
    group: "Follow-up",
    duration: "30 min",
    risk: "Moderate",
    status: "Completed",
    color: "success",
    notes: "CKD protein assessment follow-up.",
    checklist: ["Review dietary adherence", "Check recent weight", "Confirm renal diet goals"],
    labs: ["Albumin", "Potassium", "Creatinine"],
    tasks: ["Document intake change", "Coordinate with nephrology"],
    icon: Stethoscope,
  },
  {
    id: "appt-3",
    time: "10:00",
    endTime: "10:40",
    patient: "Research Participant 042",
    type: "Plaque sample collection",
    group: "Research",
    duration: "40 min",
    risk: "Low",
    status: "Scheduled",
    color: "accent",
    notes: "Oral-gut axis sample collection visit.",
    checklist: ["Confirm consent", "Prepare sample kit", "Label collection tube"],
    labs: ["Plaque sample", "Dietary recall"],
    tasks: ["Update dataset", "Notify lab team"],
    icon: Beaker,
  },
  {
    id: "appt-4",
    time: "11:00",
    endTime: "11:30",
    patient: "Reem Hassan",
    type: "Initial Assessment",
    group: "Clinical",
    duration: "30 min",
    risk: "High",
    status: "Scheduled",
    color: "brand",
    notes: "Pediatric growth monitoring and intake review.",
    checklist: ["Growth chart", "Parent interview", "Diet recall"],
    labs: ["Vitamin D", "CBC"],
    tasks: ["Create baseline intervention", "Set follow-up interval"],
    icon: BriefcaseMedical,
  },
  {
    id: "appt-5",
    time: "12:00",
    endTime: "12:45",
    patient: "Ali Abdullah",
    type: "Telehealth",
    group: "Telehealth",
    duration: "45 min",
    risk: "Moderate",
    status: "Missed",
    color: "warning",
    notes: "Missed obesity diet follow-up call.",
    checklist: ["Reschedule call", "Review adherence barriers", "Send reminder"],
    labs: ["HbA1c", "Lipid profile"],
    tasks: ["Create missed visit note", "Notify care team"],
    icon: Video,
  },
  {
    id: "appt-6",
    time: "13:30",
    endTime: "14:00",
    patient: "Fatima Ali",
    type: "AI Review",
    group: "Clinical",
    duration: "30 min",
    risk: "High",
    status: "Scheduled",
    color: "info",
    notes: "AI clinical summary requires clinician review.",
    checklist: ["Open AI summary", "Check red flags", "Approve safe priorities"],
    labs: ["Glucose", "HbA1c", "Vitamin D"],
    tasks: ["Update monitoring plan", "Prepare counseling notes"],
    icon: Brain,
  },
  {
    id: "appt-7",
    time: "15:00",
    endTime: "16:00",
    patient: "Protected Work Time",
    type: "Blocked Time",
    group: "Clinical",
    duration: "60 min",
    risk: "Low",
    status: "Scheduled",
    color: "secondary",
    notes: "Report writing and lab interpretation block.",
    checklist: ["Close pending reports", "Review lab queue"],
    labs: ["Pending report queue"],
    tasks: ["Export reports", "Prepare tomorrow schedule"],
    icon: Lock,
  },
];

const calendarDays = [
  ["Mon", "18", ["Lab Review", "Follow-up"]],
  ["Tue", "19", ["Research Visit"]],
  ["Wed", "20", ["Telehealth", "AI Review"]],
  ["Thu", "21", ["Report Review"]],
  ["Fri", "22", ["Blocked Time"]],
  ["Sat", "23", []],
  ["Sun", "24", ["Follow-up"]],
];

const assistantCards = [
  "Sarah Ahmed has low ferritin. Consider scheduling lab review follow-up in 6-8 weeks.",
  "Two high-risk patients are clustered before noon. Keep preparation notes ready.",
  "Ali Abdullah missed telehealth follow-up. Reschedule within 7 days.",
  "Research participant 042 needs sample kit and consent confirmation before visit.",
];

const reminders = [
  ["Recheck ferritin", "Sarah Ahmed", "6-8 weeks", "High"],
  ["Weight follow-up", "Mohammed Khalid", "Next visit", "Medium"],
  ["Review dietary adherence", "Ali Abdullah", "This week", "Medium"],
  ["Repeat vitamin D", "Fatima Ali", "8 weeks", "Low"],
  ["Monitor GI symptoms", "Reem Hassan", "Next assessment", "High"],
];

const researchVisits = [
  ["Participant screening", "3 candidates", "Ready"],
  ["Consent visit", "Participant 042", "Today"],
  ["Plaque sample collection", "Lab kit required", "Today"],
  ["Blood test visit", "2 participants", "This week"],
  ["Dietary recall session", "5 recalls pending", "Open"],
  ["Follow-up data collection", "Dataset phase 2", "Planned"],
];

const intelligence = [
  ["Workload balance", "Heavy morning", "warning"],
  ["High-risk patients today", "3 patients", "danger"],
  ["Missed appointments", "1 missed", "warning"],
  ["Upcoming lab reviews", "4 reviews", "info"],
  ["Research workload", "Moderate", "accent"],
];

export default function ScheduleCenter({ activePatient, onOpenClinicalHub, scheduleState, setActivePatient, sharedPatients = [] }) {
  const { language } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [activeView, setActiveView] = useState("Week");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(appointments[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const scheduleAppointments = useMemo(
    () =>
      scheduleState?.length
        ? scheduleState.map((appointment, index) => ({
            ...appointments[index % appointments.length],
            id: appointment.id,
            patient: appointment.patientName,
            status: appointment.status,
            time: appointment.time,
            type: appointment.type,
          }))
        : appointments,
    [scheduleState],
  );

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return scheduleAppointments.filter((appointment) => {
      const matchesFilter =
        activeFilter === "All" ||
        appointment.group === activeFilter ||
        appointment.status === activeFilter ||
        (activeFilter === "High Risk" && appointment.risk === "High");

      const matchesSearch = normalizedSearch
        ? [appointment.patient, appointment.type, appointment.notes, appointment.status]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, scheduleAppointments, searchTerm]);

  const selectedAppointment =
    scheduleAppointments.find((appointment) => appointment.id === selectedAppointmentId) || scheduleAppointments[0];

  function resolveSchedulePatient(patientName) {
    return sharedPatients.find(
      (patient) => patient.fullName === patientName || patient.name === patientName,
    );
  }

  function selectAppointmentPatient(appointment) {
    const patient = resolveSchedulePatient(appointment?.patient);
    if (patient) {
      setActivePatient(patient);
    }
  }

  function openAppointmentPatient(appointment) {
    const patient = resolveSchedulePatient(appointment?.patient);
    if (patient) {
      onOpenClinicalHub(patient);
    }
  }

  return (
    <NutriPage data-language={language}>
      <NutriPageMain>
        <NutriPageHeader
          kicker="Daily Operations"
          title="Schedule Center"
          subtitle="Manage clinical appointments, follow-ups, protected work time, research visits, and schedule intelligence from one premium daily hub."
          actions={
            <>
              <NutriBadge tone="brand">8 today</NutriBadge>
              <NutriBadge tone="danger">3 high risk</NutriBadge>
              <NutriBadge tone="accent">2 research visits</NutriBadge>
            </>
          }
        />

        <ActivePatientBanner
          patient={activePatient}
          onOpenClinicalHub={() => onOpenClinicalHub(activePatient)}
        />

        <ScheduleDashboard />

        <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <div className="space-y-5">
            <NutriPanel>
              <div className="mb-5 flex flex-col gap-4 border-b border-[var(--np-color-border-soft)] pb-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  {views.map((view) => (
                    <button
                      className={`np-button min-h-10 px-4 text-xs ${
                        activeView === view ? "np-button-primary" : "np-button-secondary"
                      }`}
                      key={view}
                      onClick={() => setActiveView(view)}
                      type="button"
                    >
                      {view}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <NutriButton variant="secondary">
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </NutriButton>
                  <NutriButton>
                    <CalendarDays className="h-4 w-4" />
                    Today
                  </NutriButton>
                  <NutriButton variant="secondary">
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </NutriButton>
                </div>
              </div>

              <NutriSectionHeader
                icon={CalendarDays}
                kicker={activeView}
                title="Main Calendar"
                action={<NutriBadge tone="secondary">May 18-24, 2025</NutriBadge>}
              />

              <CalendarGrid onSelectAppointment={setSelectedAppointmentId} />
            </NutriPanel>

            <NutriPanel>
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative w-full lg:max-w-md">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--np-color-text-soft)]" />
                  <input
                    className="np-search-field px-12"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search appointments, patients, visit purpose..."
                    value={searchTerm}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      className={`np-badge transition ${
                        activeFilter === filter
                          ? "np-badge-brand"
                          : "np-badge-secondary hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
                      }`}
                      key={filter}
                      onClick={() => setActiveFilter(filter)}
                      type="button"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <NutriSectionHeader
                icon={Clock}
                kicker="Today"
                title="Daily Clinical Timeline"
                action={<NutriBadge tone="accent">{filteredAppointments.length} visible</NutriBadge>}
              />

              <ClinicalTimeline
                appointments={filteredAppointments}
                onSelectAppointment={(appointmentId) => {
                  const appointment = scheduleAppointments.find((item) => item.id === appointmentId);
                  setSelectedAppointmentId(appointmentId);
                  selectAppointmentPatient(appointment);
                }}
                selectedAppointmentId={selectedAppointmentId}
              />
            </NutriPanel>
          </div>

          <aside className="space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
            <TodaySchedulePanel
              appointments={scheduleAppointments}
              onSelectAppointment={(appointmentId) => {
                const appointment = scheduleAppointments.find((item) => item.id === appointmentId);
                setSelectedAppointmentId(appointmentId);
                selectAppointmentPatient(appointment);
              }}
              selectedAppointmentId={selectedAppointmentId}
            />
            <AppointmentDetailPanel
              appointment={selectedAppointment}
              onOpenClinicalHub={() => openAppointmentPatient(selectedAppointment)}
            />
          </aside>
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <SmartSchedulingAssistant />
          <FollowUpReminders />
          <ResearchScheduling />
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <QuickActions />
          <ScheduleIntelligence />
        </section>
      </NutriPageMain>
    </NutriPage>
  );
}

function ScheduleDashboard() {
  const stats = [
    ["Today's Appointments", "8", CalendarCheck, "brand"],
    ["This Week", "34", CalendarDays, "secondary"],
    ["Completed", "12", CheckCircle2, "success"],
    ["Missed", "1", XCircle, "warning"],
    ["Cancelled", "2", RotateCcw, "secondary"],
    ["Research Visits", "4", Beaker, "accent"],
    ["Follow-ups Due", "9", CalendarClock, "info"],
    ["Urgent Visits", "3", ShieldAlert, "danger"],
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(([label, value, Icon, tone]) => (
        <NutriPanel className="p-4" key={label}>
          <div className="flex items-center justify-between gap-4">
            <span className="np-icon-tile">
              <Icon className="h-5 w-5" />
            </span>
            <NutriBadge tone={tone}>{label}</NutriBadge>
          </div>
          <p className="mt-5 text-3xl font-extrabold text-[var(--np-color-text)]">{value}</p>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">Schedule signal</p>
        </NutriPanel>
      ))}
    </section>
  );
}

function CalendarGrid({ onSelectAppointment }) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-7">
      {calendarDays.map(([day, date, entries]) => (
        <div
          className="min-h-44 rounded-[24px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4"
          key={date}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
              {day}
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)]">
              {date}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {entries.length ? (
              entries.map((entry) => (
                <button
                  className="w-full rounded-[16px] border border-[rgb(122_31_43_/_0.14)] bg-white p-3 text-left text-xs font-extrabold text-[var(--np-color-text)] shadow-[var(--np-shadow-sm)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
                  key={entry}
                  onClick={() => onSelectAppointment(appointments.find((appointment) => appointment.type === entry)?.id || appointments[0].id)}
                  type="button"
                >
                  {entry}
                </button>
              ))
            ) : (
              <p className="rounded-[16px] border border-dashed border-[var(--np-color-border)] p-3 text-xs font-bold text-[var(--np-color-text-muted)]">
                Protected capacity
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ClinicalTimeline({ appointments: visibleAppointments, selectedAppointmentId, onSelectAppointment }) {
  const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:30", "15:00"];

  return (
    <div className="space-y-3">
      {hours.map((hour) => {
        const appointment = visibleAppointments.find((item) => item.time === hour);

        return (
          <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4" key={hour}>
            <p className="pt-4 text-sm font-extrabold text-[var(--np-color-text-muted)]">{hour}</p>
            {appointment ? (
              <button
                className={`rounded-[24px] border p-4 text-left shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)] ${
                  selectedAppointmentId === appointment.id
                    ? "border-[var(--np-color-brand)] bg-white ring-4 ring-[rgb(122_31_43_/_0.08)]"
                    : "border-[var(--np-color-border-soft)] bg-white"
                }`}
                onClick={() => onSelectAppointment(appointment.id)}
                type="button"
              >
                <AppointmentSummary appointment={appointment} />
              </button>
            ) : (
              <div className="rounded-[24px] border border-dashed border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold text-[var(--np-color-text-muted)]">
                No visible appointment in this filtered view.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TodaySchedulePanel({ appointments: todayAppointments, selectedAppointmentId, onSelectAppointment }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={CalendarCheck} kicker="Today" title="Today's Schedule" />
      <div className="space-y-3">
        {todayAppointments.map((appointment) => (
          <button
            className={`w-full rounded-[20px] border p-4 text-left transition hover:border-[var(--np-color-brand)] ${
              selectedAppointmentId === appointment.id
                ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]"
                : "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)]"
            }`}
            key={appointment.id}
            onClick={() => onSelectAppointment(appointment.id)}
            type="button"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[var(--np-color-text)]">
                  {appointment.time} - {appointment.patient}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                  {appointment.type} • {appointment.duration}
                </p>
              </div>
              <StatusBadge value={appointment.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <RiskBadge value={appointment.risk} />
              <NutriBadge tone="secondary">Open Clinical Hub</NutriBadge>
            </div>
          </button>
        ))}
      </div>
    </NutriPanel>
  );
}

function AppointmentDetailPanel({ appointment, onOpenClinicalHub }) {
  const Icon = appointment.icon;

  return (
    <NutriPanel>
      <NutriSectionHeader icon={Icon} kicker="Selected Visit" title="Appointment Detail" />
      <div className="rounded-[24px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-extrabold text-[var(--np-color-text)]">{appointment.patient}</h3>
            <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
              {appointment.time} - {appointment.endTime} • {appointment.type}
            </p>
          </div>
          <Icon className="h-6 w-6 text-[var(--np-color-brand)]" />
        </div>
        <p className="mt-4 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
          {appointment.notes}
        </p>
      </div>

      <DetailList title="Preparation Checklist" items={appointment.checklist} />
      <DetailList title="Related Labs" items={appointment.labs} />
      <DetailList title="Related Tasks" items={appointment.tasks} />

      <NutriButton className="mt-5 w-full" onClick={onOpenClinicalHub}>
        <BriefcaseMedical className="h-4 w-4" />
        Open Clinical Hub
      </NutriButton>
    </NutriPanel>
  );
}

function SmartSchedulingAssistant() {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={Brain} kicker="Placeholder" title="Smart Scheduling Assistant" />
      <div className="space-y-3">
        {assistantCards.map((text) => (
          <p
            className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]"
            key={text}
          >
            {text}
          </p>
        ))}
      </div>
    </NutriPanel>
  );
}

function FollowUpReminders() {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={AlertTriangle} kicker="Clinical" title="Follow-up Reminders" />
      <div className="space-y-3">
        {reminders.map(([title, patient, due, priority]) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4" key={`${title}-${patient}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</p>
                <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                  {patient} • {due}
                </p>
              </div>
              <RiskBadge value={priority === "Medium" ? "Moderate" : priority} />
            </div>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function ResearchScheduling() {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={Beaker} kicker="Research" title="Research Visit Scheduling" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {researchVisits.map(([title, detail, status]) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4" key={title}>
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</p>
            <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{detail}</p>
            <NutriBadge className="mt-3" tone="accent">{status}</NutriBadge>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function QuickActions() {
  const actions = [
    ["New Appointment", Plus],
    ["Schedule Follow-up", CalendarClock],
    ["Book Research Visit", Beaker],
    ["Block Time", Lock],
    ["Create Reminder", BellIcon],
  ];

  return (
    <NutriPanel>
      <NutriSectionHeader icon={Plus} kicker="Actions" title="Quick Actions" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {actions.map(([label, Icon]) => (
          <NutriButton className="min-h-16 justify-start" key={label} variant="secondary">
            <Icon className="h-4 w-4" />
            {label}
          </NutriButton>
        ))}
      </div>
    </NutriPanel>
  );
}

function ScheduleIntelligence() {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={Brain} kicker="Operations" title="Schedule Intelligence" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {intelligence.map(([label, value, tone]) => (
          <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4" key={label}>
            <NutriBadge tone={tone}>{label}</NutriBadge>
            <p className="mt-4 text-xl font-extrabold text-[var(--np-color-text)]">{value}</p>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function AppointmentSummary({ appointment }) {
  const Icon = appointment.icon;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-start gap-4">
        <span className="np-icon-tile">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-lg font-extrabold text-[var(--np-color-text)]">{appointment.patient}</p>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
            {appointment.type} • {appointment.time}-{appointment.endTime} • {appointment.duration}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <RiskBadge value={appointment.risk} />
        <StatusBadge value={appointment.status} />
        <NutriBadge tone={appointment.group === "Research" ? "accent" : "secondary"}>{appointment.group}</NutriBadge>
      </div>
    </div>
  );
}

function DetailList({ items, title }) {
  return (
    <div className="mt-5">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
        {title}
      </p>
      <div className="space-y-2">
        {items.map((item) => (
          <p className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3 text-sm font-bold text-[var(--np-color-text)]" key={item}>
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function RiskBadge({ value }) {
  const tone = {
    High: "danger",
    Low: "secondary",
    Moderate: "warning",
  }[value] || "secondary";

  return <NutriBadge tone={tone}>{value} risk</NutriBadge>;
}

function StatusBadge({ value }) {
  const tone = {
    Completed: "success",
    Missed: "warning",
    Scheduled: "brand",
  }[value] || "secondary";

  return <NutriBadge tone={tone}>{value}</NutriBadge>;
}

function BellIcon(props) {
  return <CalendarClock {...props} />;
}
