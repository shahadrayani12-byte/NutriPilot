import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock3,
  Copy,
  Edit3,
  FileText,
  Lock,
  Plus,
  Search,
  Stethoscope,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

import {
  NutriBadge,
  NutriButton,
  NutriInput,
  NutriModal,
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
  NutriPanel,
  NutriSectionHeader,
} from "../components/common/NutriPilotPrimitives";
import { ActivePatientBanner } from "../components/common/ActivePatientBanner";
import { useTranslation } from "../i18n";

const APPOINTMENT_STATUSES = ["Scheduled", "Confirmed", "Checked In", "In Session", "Completed", "No Show", "Cancelled", "Rescheduled"];
const APPOINTMENT_TYPES = ["Initial Assessment", "Lab Review", "Follow-up", "Diet Plan Review", "AI Review", "Research Visit", "Telehealth"];
const VISIT_MODES = ["In-person", "Virtual"];
const VIEW_OPTIONS = ["Day", "Week", "Month"];
const WORKING_HOURS = { end: 17, start: 8 };
const BLOCKED_SLOTS = [
  { id: "admin-block", date: "2026-07-19", endTime: "13:00", label: "Administrative time", startTime: "12:30", type: "Administrative time" },
];

export default function ScheduleCenter({
  activePatient,
  addAppointment,
  deleteAppointment,
  onOpenClinicalHub,
  scheduleState = [],
  setActivePatient,
  sharedPatients = [],
  updateAppointment,
}) {
  const { formatDate, language, t } = useTranslation();
  const [activeView, setActiveView] = useState("Day");
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(scheduleState[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ branch: "All", clinician: "All", department: "All", patient: "All", status: "All", type: "All" });
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [saveState, setSaveState] = useState("Saved");
  const timelineRef = useRef(null);

  const appointments = useMemo(
    () => normalizeAppointments(scheduleState, sharedPatients),
    [scheduleState, sharedPatients],
  );
  const selectedAppointment = appointments.find((appointment) => appointment.id === selectedAppointmentId) || appointments[0] || null;
  const dateAppointments = useMemo(
    () => filterAppointments(appointments, { filters, searchTerm }).filter((appointment) => appointment.date === selectedDate),
    [appointments, filters, searchTerm, selectedDate],
  );
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const visibleWeekAppointments = useMemo(
    () => filterAppointments(appointments, { filters, searchTerm }).filter((appointment) => weekDates.includes(appointment.date)),
    [appointments, filters, searchTerm, weekDates],
  );
  const monthDates = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);
  const filterOptions = useMemo(() => buildFilterOptions(appointments, sharedPatients), [appointments, sharedPatients]);
  const stats = useMemo(() => buildScheduleStats(appointments, selectedDate), [appointments, selectedDate]);
  const currentTime = useCurrentTime();

  useEffect(() => {
    if (selectedDate === toDateKey(new Date())) {
      window.requestAnimationFrame(() => {
        timelineRef.current?.scrollTo({ behavior: "smooth", top: Math.max(0, (new Date().getHours() - WORKING_HOURS.start - 1) * 88) });
      });
    }
  }, [selectedDate, activeView]);

  function resolvePatient(appointment) {
    return sharedPatients.find((patient) =>
      patient.id === appointment?.patientId ||
      patient.fullName === appointment?.patientName ||
      patient.name === appointment?.patientName);
  }

  function selectAppointment(appointment) {
    setSelectedAppointmentId(appointment.id);
    const patient = resolvePatient(appointment);
    if (patient) setActivePatient?.(patient);
  }

  function openPatientFromAppointment(appointment, tabId = "summary") {
    const patient = resolvePatient(appointment);
    if (patient) {
      setActivePatient?.(patient);
      onOpenClinicalHub?.(patient, tabId);
    }
  }

  function openEditor(appointment = null) {
    const patient = appointment ? resolvePatient(appointment) : activePatient;
    setConflict(null);
    setEditingAppointment(createAppointmentDraft(appointment, patient, selectedDate));
    setSaveState("Unsaved changes");
  }

  function saveAppointment(draft) {
    const normalizedDraft = normalizeAppointmentDraft(draft, sharedPatients);
    const nextConflict = findSchedulingConflict(normalizedDraft, appointments);
    if (nextConflict) {
      setConflict(nextConflict);
      return;
    }

    setSaveState("Saving...");
    if (appointments.some((appointment) => appointment.id === normalizedDraft.id)) {
      updateAppointment?.(normalizedDraft.id, normalizedDraft);
    } else {
      addAppointment?.(normalizedDraft);
    }
    setSelectedAppointmentId(normalizedDraft.id);
    setSelectedDate(normalizedDraft.date);
    setEditingAppointment(null);
    setConflict(null);
    setSaveState("Saved just now");
  }

  function cancelAppointment(appointment) {
    updateAppointment?.(appointment.id, { status: "Cancelled" });
  }

  function duplicateAppointment(appointment) {
    openEditor({
      ...appointment,
      id: `appt-${Date.now()}`,
      status: "Scheduled",
      notes: `${appointment.notes || ""} Draft duplicate - review required.`.trim(),
    });
  }

  function deletePermittedAppointment(appointment) {
    if (!canDeleteAppointment(appointment)) return;
    deleteAppointment?.(appointment.id);
    setSelectedAppointmentId("");
  }

  function shiftDate(direction) {
    const date = parseDate(selectedDate);
    if (activeView === "Day") date.setDate(date.getDate() + direction);
    if (activeView === "Week") date.setDate(date.getDate() + (direction * 7));
    if (activeView === "Month") date.setMonth(date.getMonth() + direction);
    setSelectedDate(toDateKey(date));
  }

  return (
    <NutriPage data-language={language}>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">{stats.today} {t("schedule.appointments", { defaultValue: "appointments" })}</NutriBadge>
              <NutriBadge tone="warning">{stats.needsAction} {t("schedule.needAction", { defaultValue: "need action" })}</NutriBadge>
              <NutriBadge tone="secondary">{saveState}</NutriBadge>
            </>
          }
          kicker={t("schedule.kicker", { defaultValue: "Healthcare scheduling" })}
          subtitle={t("schedule.subtitle", { defaultValue: "Book, manage, and review patient appointments from one shared schedule source." })}
          title={t("navigation.scheduleCenter", { defaultValue: "Schedule Center" })}
        />

        <ActivePatientBanner patient={activePatient} onOpenClinicalHub={() => onOpenClinicalHub?.(activePatient)} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ScheduleStat icon={CalendarCheck} label={t("schedule.today", { defaultValue: "Today" })} tone="brand" value={stats.today} />
          <ScheduleStat icon={UserCheck} label={t("schedule.checkedIn", { defaultValue: "Checked in" })} tone="success" value={stats.checkedIn} />
          <ScheduleStat icon={AlertTriangle} label={t("schedule.noShow", { defaultValue: "No show / cancelled" })} tone="warning" value={stats.disrupted} />
          <ScheduleStat icon={Clock3} label={t("schedule.nextAppointment", { defaultValue: "Next appointment" })} tone="secondary" value={stats.next || "None"} />
        </section>

        <NutriPanel className="mt-5">
          <div className="flex flex-col gap-4 border-b border-[var(--np-color-border-soft)] pb-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {VIEW_OPTIONS.map((view) => (
                <button
                  className={`np-button min-h-10 px-4 text-xs ${activeView === view ? "np-button-primary" : "np-button-secondary"}`}
                  key={view}
                  onClick={() => setActiveView(view)}
                  type="button"
                >
                  {t(`schedule.view.${view}`, { defaultValue: view })}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <NutriButton onClick={() => shiftDate(-1)} variant="secondary"><ArrowLeft className="h-4 w-4" />{t("schedule.previous", { defaultValue: "Previous" })}</NutriButton>
              <NutriButton onClick={() => setSelectedDate(toDateKey(new Date()))}><CalendarDays className="h-4 w-4" />{t("common.today", { defaultValue: "Today" })}</NutriButton>
              <NutriButton onClick={() => shiftDate(1)} variant="secondary">{t("schedule.next", { defaultValue: "Next" })}<ArrowRight className="h-4 w-4" /></NutriButton>
              <NutriButton onClick={() => openEditor()}><Plus className="h-4 w-4" />{t("schedule.newAppointment", { defaultValue: "New Appointment" })}</NutriButton>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">{activeView}</p>
                  <h2 className="mt-1 text-2xl font-extrabold text-[var(--np-color-text)]">{formatDate(parseDate(selectedDate))}</h2>
                </div>
                <SearchBox searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              </div>
              {activeView === "Day" ? (
                <DayView
                  appointments={dateAppointments}
                  blockedSlots={BLOCKED_SLOTS.filter((slot) => slot.date === selectedDate)}
                  currentTime={currentTime}
                  isToday={selectedDate === toDateKey(new Date())}
                  onSelectAppointment={selectAppointment}
                  selectedAppointmentId={selectedAppointmentId}
                  timelineRef={timelineRef}
                />
              ) : null}
              {activeView === "Week" ? (
                <WeekView
                  appointments={visibleWeekAppointments}
                  currentTime={currentTime}
                  onSelectAppointment={selectAppointment}
                  selectedAppointmentId={selectedAppointmentId}
                  setSelectedDate={setSelectedDate}
                  weekDates={weekDates}
                />
              ) : null}
              {activeView === "Month" ? (
                <MonthView
                  appointments={filterAppointments(appointments, { filters, searchTerm })}
                  monthDates={monthDates}
                  selectedDate={selectedDate}
                  setActiveView={setActiveView}
                  setSelectedDate={setSelectedDate}
                />
              ) : null}
            </div>

            <aside className="space-y-4">
              <ScheduleFilters filterOptions={filterOptions} filters={filters} setFilters={setFilters} />
              <RoleBehaviorPanel />
            </aside>
          </div>
        </NutriPanel>

        <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <AppointmentList
            appointments={dateAppointments}
            onEdit={openEditor}
            onOpenClinicalHub={openPatientFromAppointment}
            onSelectAppointment={selectAppointment}
            selectedAppointmentId={selectedAppointmentId}
          />
          <AppointmentDetailPanel
            appointment={selectedAppointment}
            canDelete={selectedAppointment ? canDeleteAppointment(selectedAppointment) : false}
            onCancel={cancelAppointment}
            onDelete={deletePermittedAppointment}
            onDuplicate={duplicateAppointment}
            onEdit={openEditor}
            onOpenClinicalHub={openPatientFromAppointment}
          />
        </section>

        {editingAppointment ? (
          <AppointmentEditor
            appointment={editingAppointment}
            conflict={conflict}
            onCancel={() => {
              setEditingAppointment(null);
              setConflict(null);
              setSaveState("Saved");
            }}
            onChange={setEditingAppointment}
            onSave={saveAppointment}
            patients={sharedPatients}
          />
        ) : null}
      </NutriPageMain>
    </NutriPage>
  );
}

function DayView({ appointments, blockedSlots, currentTime, isToday, onSelectAppointment, selectedAppointmentId, timelineRef }) {
  const hours = buildHours();

  return (
    <div className="max-h-[680px] overflow-y-auto rounded-[24px] border border-[var(--np-color-border-soft)] bg-white" ref={timelineRef}>
      <div className="relative min-h-[792px]">
        {hours.map((hour) => (
          <div className="grid min-h-[88px] grid-cols-[72px_minmax(0,1fr)] border-b border-[var(--np-color-border-soft)]" key={hour}>
            <p className="px-3 pt-3 text-xs font-extrabold text-[var(--np-color-text-muted)]">{formatHour(hour)}</p>
            <div className="bg-[var(--np-color-surface-muted)]/45" />
          </div>
        ))}
        {blockedSlots.map((slot) => (
          <BlockedSlot key={slot.id} slot={slot} />
        ))}
        {appointments.map((appointment) => (
          <PositionedAppointmentCard
            appointment={appointment}
            key={appointment.id}
            onSelectAppointment={onSelectAppointment}
            selected={selectedAppointmentId === appointment.id}
          />
        ))}
        {isToday ? <CurrentTimeLine currentTime={currentTime} /> : null}
        {!appointments.length ? <EmptyScheduleState /> : null}
      </div>
    </div>
  );
}

function WeekView({ appointments, currentTime, onSelectAppointment, selectedAppointmentId, setSelectedDate, weekDates }) {
  const today = toDateKey(new Date());

  return (
    <div className="overflow-x-auto rounded-[24px] border border-[var(--np-color-border-soft)] bg-white">
      <div className="min-w-[920px] grid grid-cols-7">
        {weekDates.map((date) => {
          const dayAppointments = appointments.filter((appointment) => appointment.date === date);
          return (
            <div className={`min-h-[620px] border-e border-[var(--np-color-border-soft)] ${date === today ? "bg-[var(--np-color-brand-soft)]/50" : ""}`} key={date}>
              <button className="w-full border-b border-[var(--np-color-border-soft)] p-3 text-left" onClick={() => setSelectedDate(date)} type="button">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{weekdayLabel(date)}</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--np-color-text)]">{parseDate(date).getDate()}</p>
              </button>
              <div className="relative min-h-[560px]">
                {dayAppointments.map((appointment) => (
                  <PositionedAppointmentCard
                    appointment={appointment}
                    compact
                    key={appointment.id}
                    onSelectAppointment={onSelectAppointment}
                    selected={selectedAppointmentId === appointment.id}
                  />
                ))}
                {date === today ? <CurrentTimeLine currentTime={currentTime} compact /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ appointments, monthDates, selectedDate, setActiveView, setSelectedDate }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {monthDates.map((date) => {
        const dayAppointments = appointments.filter((appointment) => appointment.date === date.key);
        return (
          <button
            className={`min-h-28 rounded-[20px] border p-3 text-left transition hover:border-[var(--np-color-brand)] ${date.key === selectedDate ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]" : "border-[var(--np-color-border-soft)] bg-white"} ${date.isCurrentMonth ? "" : "opacity-55"}`}
            key={date.key}
            onClick={() => {
              setSelectedDate(date.key);
              setActiveView("Day");
            }}
            type="button"
          >
            <p className="text-xs font-extrabold text-[var(--np-color-text-muted)]">{weekdayLabel(date.key)}</p>
            <p className="mt-1 text-lg font-extrabold text-[var(--np-color-text)]">{date.day}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {dayAppointments.slice(0, 3).map((appointment) => (
                <span className={`h-2 w-2 rounded-full ${statusDotClass(appointment.status)}`} key={appointment.id} title={appointment.type} />
              ))}
              {dayAppointments.length > 3 ? <span className="text-[10px] font-extrabold text-[var(--np-color-text-muted)]">+{dayAppointments.length - 3}</span> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PositionedAppointmentCard({ appointment, compact = false, onSelectAppointment, selected }) {
  const top = Math.max(0, (toMinutes(appointment.time) - (WORKING_HOURS.start * 60)) / 60 * 88);
  const height = Math.max(54, (appointment.duration || minutesBetween(appointment.time, appointment.endTime)) / 60 * 88);

  return (
    <button
      aria-label={`${appointment.patientName} ${appointment.type} ${appointment.status}`}
      className={`absolute left-[84px] right-3 rounded-[18px] border p-3 text-left shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)] ${selected ? "border-[var(--np-color-brand)] bg-white ring-4 ring-[rgb(122_31_43_/_0.10)]" : "border-[var(--np-color-border-soft)] bg-white"}`}
      onClick={() => onSelectAppointment(appointment)}
      style={{ height, top, ...(compact ? { left: 8, right: 8 } : {}) }}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[var(--np-color-text)]">{appointment.patientName || "Patient not linked"}</p>
          <p className="mt-1 truncate text-xs font-bold text-[var(--np-color-text-muted)]">{appointment.time}-{appointment.endTime} · {appointment.type}</p>
        </div>
        <StatusBadge status={appointment.status} />
      </div>
    </button>
  );
}

function AppointmentList({ appointments, onEdit, onOpenClinicalHub, onSelectAppointment, selectedAppointmentId }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={CalendarCheck} kicker="Appointments" title="Selected Day Appointments" />
      <div className="space-y-3">
        {appointments.map((appointment) => (
          <article
            className={`rounded-[20px] border p-4 ${selectedAppointmentId === appointment.id ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]" : "border-[var(--np-color-border-soft)] bg-white"}`}
            key={appointment.id}
          >
            <button className="w-full text-left" onClick={() => onSelectAppointment(appointment)} type="button">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-extrabold text-[var(--np-color-text)]">{appointment.time} {appointment.patientName}</p>
                  <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{appointment.purpose || appointment.type}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={appointment.status} />
                  <NutriBadge tone="secondary">{appointment.department}</NutriBadge>
                </div>
              </div>
            </button>
            <div className="mt-3 flex flex-wrap gap-2">
              <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onOpenClinicalHub(appointment)} variant="secondary"><Stethoscope className="h-4 w-4" />Open Clinical Workspace</NutriButton>
              <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onOpenClinicalHub(appointment, "monitoring")} variant="secondary"><FileText className="h-4 w-4" />Add Follow-up Note</NutriButton>
              <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onEdit(appointment)} variant="secondary"><Edit3 className="h-4 w-4" />Edit</NutriButton>
            </div>
          </article>
        ))}
        {!appointments.length ? <EmptyScheduleState /> : null}
      </div>
    </NutriPanel>
  );
}

function AppointmentDetailPanel({ appointment, canDelete, onCancel, onDelete, onDuplicate, onEdit, onOpenClinicalHub }) {
  if (!appointment) {
    return (
      <NutriPanel>
        <NutriSectionHeader icon={CalendarClock} kicker="Selected visit" title="Appointment Details" />
        <EmptyScheduleState />
      </NutriPanel>
    );
  }

  return (
    <NutriPanel>
      <NutriSectionHeader icon={CalendarClock} kicker="Selected visit" title="Appointment Details" />
      <div className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-[var(--np-color-text)]">{appointment.patientName || "Patient not linked"}</h3>
            <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">{appointment.date} · {appointment.time}-{appointment.endTime}</p>
          </div>
          <StatusBadge status={appointment.status} />
        </div>
        <p className="mt-4 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{appointment.notes || "No appointment notes recorded."}</p>
      </div>
      <DetailRows rows={[
        ["Clinician", appointment.clinician],
        ["Organization", appointment.organization],
        ["Branch", appointment.branch],
        ["Department", appointment.department],
        ["Type", appointment.type],
        ["Mode", appointment.visitMode],
        ["Location", appointment.location],
        ["Care journey", appointment.linkedCareStage],
        ["Created", `${appointment.createdBy || "Unknown"} · ${appointment.createdAt || "Not recorded"}`],
        ["Updated", `${appointment.updatedBy || "Unknown"} · ${appointment.updatedAt || "Not recorded"}`],
      ]} />
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NutriButton onClick={() => onOpenClinicalHub(appointment)}><Stethoscope className="h-4 w-4" />Open Patient Profile</NutriButton>
        <NutriButton onClick={() => onOpenClinicalHub(appointment, "summary")} variant="secondary"><UserCheck className="h-4 w-4" />Start Session</NutriButton>
        <NutriButton onClick={() => onOpenClinicalHub(appointment, "dietPlan")} variant="secondary"><FileText className="h-4 w-4" />Open Care Plan</NutriButton>
        <NutriButton onClick={() => onOpenClinicalHub(appointment, "monitoring")} variant="secondary"><CalendarClock className="h-4 w-4" />Add Follow-up Note</NutriButton>
        <NutriButton onClick={() => onEdit(appointment)} variant="secondary"><Edit3 className="h-4 w-4" />Edit / Reschedule</NutriButton>
        <NutriButton onClick={() => onDuplicate(appointment)} variant="secondary"><Copy className="h-4 w-4" />Duplicate Draft</NutriButton>
        <NutriButton onClick={() => onCancel(appointment)} variant="secondary"><X className="h-4 w-4" />Cancel</NutriButton>
        <NutriButton disabled={!canDelete} onClick={() => onDelete(appointment)} variant="danger"><Trash2 className="h-4 w-4" />Delete</NutriButton>
      </div>
    </NutriPanel>
  );
}

function AppointmentEditor({ appointment, conflict, onCancel, onChange, onSave, patients }) {
  function updateField(field, value) {
    onChange({ ...appointment, [field]: value });
  }

  return (
    <NutriModal className="max-w-4xl" kicker="Appointment" onClose={onCancel} title={appointment.id.startsWith("appt-new") ? "Create Appointment" : "Edit Appointment"}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block">
          <span className="np-form-label">Patient</span>
          <select className="np-form-control" onChange={(event) => {
            const patient = patients.find((item) => item.id === event.target.value);
            onChange({ ...appointment, patientId: patient?.id || "", patientName: patient?.fullName || patient?.name || "" });
          }} value={appointment.patientId || ""}>
            <option value="">Select patient</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName || patient.name}</option>)}
          </select>
        </label>
        <NutriInput label="Assigned clinician" onChange={(event) => updateField("clinician", event.target.value)} value={appointment.clinician || ""} />
        <NutriInput label="Organization" onChange={(event) => updateField("organization", event.target.value)} value={appointment.organization || ""} />
        <NutriInput label="Branch" onChange={(event) => updateField("branch", event.target.value)} value={appointment.branch || ""} />
        <NutriInput label="Department / specialty" onChange={(event) => updateField("department", event.target.value)} value={appointment.department || ""} />
        <label className="block">
          <span className="np-form-label">Appointment type</span>
          <select className="np-form-control" onChange={(event) => updateField("type", event.target.value)} value={appointment.type || APPOINTMENT_TYPES[0]}>
            {APPOINTMENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <NutriInput label="Date" onChange={(event) => updateField("date", event.target.value)} type="date" value={appointment.date || ""} />
        <NutriInput label="Start time" onChange={(event) => updateField("time", event.target.value)} type="time" value={appointment.time || ""} />
        <NutriInput label="End time" onChange={(event) => updateField("endTime", event.target.value)} type="time" value={appointment.endTime || ""} />
        <NutriInput label="Location / room" onChange={(event) => updateField("location", event.target.value)} value={appointment.location || ""} />
        <label className="block">
          <span className="np-form-label">Mode</span>
          <select className="np-form-control" onChange={(event) => updateField("visitMode", event.target.value)} value={appointment.visitMode || VISIT_MODES[0]}>
            {VISIT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="np-form-label">Status</span>
          <select className="np-form-control" onChange={(event) => updateField("status", event.target.value)} value={appointment.status || "Scheduled"}>
            {APPOINTMENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <NutriInput label="Linked care journey stage" onChange={(event) => updateField("linkedCareStage", event.target.value)} value={appointment.linkedCareStage || ""} />
        <label className="block md:col-span-2">
          <span className="np-form-label">Clinical purpose</span>
          <textarea className="np-form-control min-h-24" onChange={(event) => updateField("purpose", event.target.value)} value={appointment.purpose || ""} />
        </label>
        <label className="block md:col-span-2">
          <span className="np-form-label">Notes</span>
          <textarea className="np-form-control min-h-24" onChange={(event) => updateField("notes", event.target.value)} value={appointment.notes || ""} />
        </label>
      </div>
      {conflict ? <ConflictPanel conflict={conflict} /> : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <NutriButton onClick={onCancel} variant="secondary">Cancel</NutriButton>
        <NutriButton onClick={() => onSave(appointment)}>Save Appointment</NutriButton>
      </div>
    </NutriModal>
  );
}

function ScheduleFilters({ filterOptions, filters, setFilters }) {
  const fields = [
    ["clinician", "Clinician"],
    ["patient", "Patient"],
    ["branch", "Branch"],
    ["department", "Department"],
    ["status", "Status"],
    ["type", "Type"],
  ];

  return (
    <NutriPanel className="p-4 shadow-none">
      <NutriSectionHeader icon={Search} kicker="Filters" title="Search & Filters" />
      <div className="mt-3 grid grid-cols-1 gap-3">
        {fields.map(([field, label]) => (
          <label className="block" key={field}>
            <span className="np-form-label">{label}</span>
            <select className="np-form-control min-h-11" onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))} value={filters[field]}>
              {filterOptions[field].map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </NutriPanel>
  );
}

function SearchBox({ searchTerm, setSearchTerm }) {
  return (
    <div className="relative w-full lg:max-w-sm">
      <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--np-color-text-soft)]" />
      <input
        className="np-search-field px-12"
        dir="auto"
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search patient, clinician, room, purpose..."
        value={searchTerm}
      />
    </div>
  );
}

function RoleBehaviorPanel() {
  return (
    <NutriPanel className="p-4 shadow-none">
      <NutriSectionHeader icon={Lock} kicker="Access model" title="Role Behavior" />
      <div className="space-y-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
        <p><strong>Clinician:</strong> personal schedule and patient sessions.</p>
        <p><strong>Reception:</strong> booking, confirmation, rescheduling, cancellation, check-in.</p>
        <p><strong>Admin:</strong> organization schedule and working-hour settings placeholder.</p>
      </div>
    </NutriPanel>
  );
}

function ConflictPanel({ conflict }) {
  return (
    <section className="mt-5 rounded-[20px] border border-[var(--np-color-danger-border)] bg-[var(--np-color-danger-bg)] p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[var(--np-color-danger)]" />
        <div>
          <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">Scheduling conflict</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{conflict.reason}</p>
          <p className="mt-2 text-xs font-extrabold text-[var(--np-color-text)]">
            Conflicting appointment: {conflict.appointment.patientName || conflict.appointment.type} · {conflict.appointment.time}-{conflict.appointment.endTime}
          </p>
          <p className="mt-2 text-xs font-bold text-[var(--np-color-text-muted)]">
            Available alternative: {conflict.alternative || "Review another time in the same day."}
          </p>
        </div>
      </div>
    </section>
  );
}

function ScheduleStat({ icon: Icon, label, tone, value }) {
  return (
    <NutriPanel className="p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="np-icon-tile"><Icon className="h-5 w-5" /></span>
        <NutriBadge tone={tone}>{label}</NutriBadge>
      </div>
      <p className="mt-4 text-2xl font-extrabold text-[var(--np-color-text)]">{value}</p>
    </NutriPanel>
  );
}

function DetailRows({ rows }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-2">
      {rows.map(([label, value]) => (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-[var(--np-color-surface-muted)] p-3" key={label}>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
          <p className="text-sm font-bold text-[var(--np-color-text)]" dir="auto">{value || "Not recorded"}</p>
        </div>
      ))}
    </div>
  );
}

function BlockedSlot({ slot }) {
  const top = Math.max(0, (toMinutes(slot.startTime) - (WORKING_HOURS.start * 60)) / 60 * 88);
  const height = Math.max(44, minutesBetween(slot.startTime, slot.endTime) / 60 * 88);
  return (
    <div className="absolute left-[84px] right-3 rounded-[16px] border border-dashed border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-3 text-xs font-extrabold text-[var(--np-color-text-muted)]" style={{ height, top }}>
      {slot.label}
    </div>
  );
}

function CurrentTimeLine({ compact = false, currentTime }) {
  const top = Math.max(0, (toMinutes(currentTime) - (WORKING_HOURS.start * 60)) / 60 * 88);
  return (
    <div className="pointer-events-none absolute left-0 right-0 z-20 flex items-center" style={{ top }}>
      <span className="h-2 w-2 rounded-full bg-[var(--np-color-danger)]" />
      <span className={`h-0.5 flex-1 bg-[var(--np-color-danger)] ${compact ? "opacity-60" : ""}`} />
    </div>
  );
}

function EmptyScheduleState() {
  return (
    <div className="rounded-[20px] border border-dashed border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-5 text-center text-sm font-bold text-[var(--np-color-text-muted)]">
      No appointments recorded for this view.
    </div>
  );
}

function StatusBadge({ status }) {
  const tone = {
    Cancelled: "danger",
    "Checked In": "info",
    Completed: "success",
    Confirmed: "success",
    "In Session": "brand",
    "No Show": "warning",
    Rescheduled: "warning",
    Scheduled: "brand",
  }[status] || "secondary";
  return <NutriBadge tone={tone}>{status}</NutriBadge>;
}

function normalizeAppointments(schedule, patients) {
  return schedule.map((appointment, index) => {
    const patient = patients.find((item) => item.id === appointment.patientId || item.fullName === appointment.patientName || item.name === appointment.patientName);
    const date = appointment.date || "2026-07-19";
    const time = appointment.time || "08:00";
    const duration = Number(appointment.duration) || minutesBetween(time, appointment.endTime || addMinutes(time, 30));
    return {
      branch: appointment.branch || "Main Clinic",
      clinician: appointment.clinician || "Dr. Shahad",
      createdAt: appointment.createdAt || new Date().toISOString(),
      createdBy: appointment.createdBy || "Dr. Shahad",
      date,
      department: appointment.department || "Clinical Nutrition",
      duration,
      endTime: appointment.endTime || addMinutes(time, duration),
      id: appointment.id || `appt-${index}`,
      linkedCareStage: appointment.linkedCareStage || "Monitoring & Outcomes",
      location: appointment.location || appointment.room || "Room pending",
      notes: appointment.notes || "",
      organization: appointment.organization || "NutriPilot Demo Hospital",
      patientId: appointment.patientId || patient?.id || "",
      patientName: appointment.patientName || appointment.patient || patient?.fullName || "Patient not linked",
      purpose: appointment.purpose || appointment.clinicalPurpose || appointment.type || "Clinical nutrition appointment",
      status: normalizeStatus(appointment.status),
      time,
      type: appointment.type || "Follow-up",
      updatedAt: appointment.updatedAt || appointment.createdAt || new Date().toISOString(),
      updatedBy: appointment.updatedBy || "Dr. Shahad",
      visitMode: appointment.visitMode || "In-person",
    };
  });
}

function createAppointmentDraft(appointment, patient, selectedDate) {
  if (appointment) return { ...appointment };
  const now = new Date().toISOString();
  return {
    branch: "Main Clinic",
    clinician: "Dr. Shahad",
    createdAt: now,
    createdBy: "Dr. Shahad",
    date: selectedDate,
    department: "Clinical Nutrition",
    duration: 30,
    endTime: "09:30",
    id: `appt-new-${Date.now()}`,
    linkedCareStage: "Monitoring & Outcomes",
    location: "Room pending",
    notes: "",
    organization: "NutriPilot Demo Hospital",
    patientId: patient?.id || "",
    patientName: patient?.fullName || patient?.name || "",
    purpose: "",
    status: "Scheduled",
    time: "09:00",
    type: "Follow-up",
    updatedAt: now,
    updatedBy: "Dr. Shahad",
    visitMode: "In-person",
  };
}

function normalizeAppointmentDraft(draft, patients) {
  const patient = patients.find((item) => item.id === draft.patientId);
  const duration = minutesBetween(draft.time, draft.endTime);
  return {
    ...draft,
    duration,
    patientName: patient?.fullName || patient?.name || draft.patientName,
    status: normalizeStatus(draft.status),
    updatedAt: new Date().toISOString(),
    updatedBy: "Dr. Shahad",
  };
}

function findSchedulingConflict(draft, appointments) {
  if (!draft.patientId || !draft.date || !draft.time || !draft.endTime) {
    return { appointment: draft, reason: "Patient, date, start time, and end time are required before saving.", alternative: "" };
  }
  const start = toMinutes(draft.time);
  const end = toMinutes(draft.endTime);
  if (end <= start) {
    return { appointment: draft, reason: "End time must be after start time.", alternative: "" };
  }
  if ((start / 60) < WORKING_HOURS.start || (end / 60) > WORKING_HOURS.end) {
    return { appointment: draft, reason: "Appointment is outside configured working hours.", alternative: nextAvailableTime(draft, appointments) };
  }
  const blocked = BLOCKED_SLOTS.find((slot) => slot.date === draft.date && rangesOverlap(start, end, toMinutes(slot.startTime), toMinutes(slot.endTime)));
  if (blocked) {
    return { appointment: blocked, reason: `Selected time overlaps with blocked slot: ${blocked.label}.`, alternative: nextAvailableTime(draft, appointments) };
  }
  const conflict = appointments.find((appointment) => appointment.id !== draft.id && appointment.date === draft.date && appointment.status !== "Cancelled" && rangesOverlap(start, end, toMinutes(appointment.time), toMinutes(appointment.endTime)) && (
    appointment.clinician === draft.clinician ||
    appointment.patientId === draft.patientId ||
    (draft.location && appointment.location === draft.location)
  ));
  if (!conflict) return null;
  const reason = conflict.patientId === draft.patientId
    ? "Patient already has an appointment during this time."
    : conflict.clinician === draft.clinician
      ? "Assigned clinician already has an appointment during this time."
      : "Assigned room is already booked during this time.";
  return { appointment: conflict, reason, alternative: nextAvailableTime(draft, appointments) };
}

function nextAvailableTime(draft, appointments) {
  const duration = minutesBetween(draft.time, draft.endTime) || 30;
  for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour += 0.5) {
    const candidateStart = `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`;
    const candidateEnd = addMinutes(candidateStart, duration);
    const candidate = { ...draft, time: candidateStart, endTime: candidateEnd };
    if (!findSchedulingConflictWithoutAlternative(candidate, appointments)) return `${candidateStart}-${candidateEnd}`;
  }
  return "";
}

function findSchedulingConflictWithoutAlternative(draft, appointments) {
  const start = toMinutes(draft.time);
  const end = toMinutes(draft.endTime);
  if ((start / 60) < WORKING_HOURS.start || (end / 60) > WORKING_HOURS.end) return true;
  return appointments.some((appointment) => appointment.id !== draft.id && appointment.date === draft.date && appointment.status !== "Cancelled" && rangesOverlap(start, end, toMinutes(appointment.time), toMinutes(appointment.endTime)) && (
    appointment.clinician === draft.clinician ||
    appointment.patientId === draft.patientId ||
    (draft.location && appointment.location === draft.location)
  ));
}

function filterAppointments(appointments, { filters, searchTerm }) {
  const query = searchTerm.trim().toLowerCase();
  return appointments.filter((appointment) => {
    const matchesFilters = Object.entries(filters).every(([field, value]) => {
      if (value === "All") return true;
      if (field === "patient") return appointment.patientId === value || appointment.patientName === value;
      return appointment[field] === value;
    });
    const matchesSearch = query ? [
      appointment.patientName,
      appointment.clinician,
      appointment.branch,
      appointment.department,
      appointment.status,
      appointment.type,
      appointment.location,
      appointment.purpose,
    ].join(" ").toLowerCase().includes(query) : true;
    return matchesFilters && matchesSearch;
  });
}

function buildFilterOptions(appointments, patients) {
  const options = (values) => ["All", ...unique(values)].map((value) => ({ label: value, value }));
  return {
    branch: options(appointments.map((item) => item.branch)),
    clinician: options(appointments.map((item) => item.clinician)),
    department: options(appointments.map((item) => item.department)),
    patient: [{ label: "All", value: "All" }, ...patients.map((patient) => ({ label: patient.fullName || patient.name, value: patient.id }))],
    status: options(APPOINTMENT_STATUSES),
    type: options(APPOINTMENT_TYPES),
  };
}

function buildScheduleStats(appointments, selectedDate) {
  const todayAppointments = appointments.filter((appointment) => appointment.date === selectedDate);
  const next = todayAppointments
    .filter((appointment) => !["Completed", "Cancelled", "No Show"].includes(appointment.status))
    .sort((first, second) => toMinutes(first.time) - toMinutes(second.time))[0];
  return {
    checkedIn: todayAppointments.filter((appointment) => ["Checked In", "In Session"].includes(appointment.status)).length,
    disrupted: todayAppointments.filter((appointment) => ["Cancelled", "No Show", "Rescheduled"].includes(appointment.status)).length,
    needsAction: todayAppointments.filter((appointment) => ["Scheduled", "Rescheduled"].includes(appointment.status)).length,
    next: next ? `${next.time} ${next.patientName}` : "",
    today: todayAppointments.length,
  };
}

function canDeleteAppointment(appointment) {
  return ["Scheduled", "Cancelled", "Rescheduled"].includes(appointment.status);
}

function buildHours() {
  return Array.from({ length: WORKING_HOURS.end - WORKING_HOURS.start + 1 }, (_, index) => WORKING_HOURS.start + index);
}

function getWeekDates(dateKey) {
  const date = parseDate(dateKey);
  const day = date.getDay();
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - day);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(sunday);
    next.setDate(sunday.getDate() + index);
    return toDateKey(next);
  });
}

function getMonthGrid(dateKey) {
  const date = parseDate(dateKey);
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return {
      day: next.getDate(),
      isCurrentMonth: next.getMonth() === date.getMonth(),
      key: toDateKey(next),
    };
  });
}

function useCurrentTime() {
  const [value, setValue] = useState(() => timeFromDate(new Date()));
  useEffect(() => {
    const interval = window.setInterval(() => setValue(timeFromDate(new Date())), 60000);
    return () => window.clearInterval(interval);
  }, []);
  return value;
}

function normalizeStatus(status) {
  if (status === "Missed") return "No Show";
  if (status === "Needs Review") return "Scheduled";
  return APPOINTMENT_STATUSES.includes(status) ? status : "Scheduled";
}

function statusDotClass(status) {
  return {
    Cancelled: "bg-[var(--np-color-danger)]",
    Completed: "bg-[var(--np-color-success)]",
    "No Show": "bg-[var(--np-color-warning)]",
    Scheduled: "bg-[var(--np-color-brand)]",
  }[status] || "bg-[var(--np-color-text-soft)]";
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function minutesBetween(start, end) {
  return Math.max(0, toMinutes(end) - toMinutes(start));
}

function toMinutes(time) {
  const [hours, minutes] = String(time || "00:00").split(":").map(Number);
  return (hours * 60) + (minutes || 0);
}

function addMinutes(time, minutes) {
  const total = toMinutes(time) + Number(minutes || 0);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

function timeFromDate(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function parseDate(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekdayLabel(dateKey) {
  return parseDate(dateKey).toLocaleDateString("en-US", { weekday: "short" });
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
