import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Edit3,
  Layers3,
  MoreHorizontal,
  Plus,
  Search,
  ShieldAlert,
  Stethoscope,
  Trash2,
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
import { buildNutritionCareCore } from "../utils/nutritionCareCore";

const TASK_VIEWS = ["My Tasks", "Today", "Upcoming", "Overdue", "Completed"];
const TASK_STATUSES = ["To Do", "In Progress", "Waiting", "Needs Review", "Completed", "Cancelled", "Overdue"];
const TASK_PRIORITIES = ["Critical", "High", "Medium", "Low"];
const TASK_CATEGORIES = [
  "Clinical Documentation",
  "Laboratory Review",
  "Nutrition Assessment",
  "PES Diagnosis",
  "Care Plan",
  "Diet Plan",
  "Patient Follow-up",
  "Report",
  "Referral",
  "Appointment Preparation",
  "Administrative",
  "Quality Review",
  "Research",
  "General",
];
const SORT_OPTIONS = ["Priority", "Due date", "Created date", "Patient", "Status"];
const GROUP_OPTIONS = ["None", "Date", "Patient", "Category", "Priority", "Assignee"];

export default function TaskCommandCenter({
  activePatient,
  addSharedTask,
  deleteSharedTask,
  onOpenClinicalHub,
  schedule = [],
  sharedPatients = [],
  sharedTasks = [],
  updateSharedTask,
}) {
  const { language, t } = useTranslation();
  const [activeView, setActiveView] = useState("Today");
  const [selectedTaskId, setSelectedTaskId] = useState(sharedTasks[0]?.id || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ assignee: "All", branch: "All", category: "All", department: "All", module: "All", patient: "All", priority: "All", status: "All" });
  const [sortBy, setSortBy] = useState("Priority");
  const [groupBy, setGroupBy] = useState("None");
  const [editingTask, setEditingTask] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [saveState, setSaveState] = useState("Saved");

  const workflowSuggestions = useMemo(
    () => buildWorkflowSuggestedTasks(activePatient, sharedTasks),
    [activePatient, sharedTasks],
  );
  const tasks = useMemo(
    () => normalizeTasks(sharedTasks, sharedPatients, schedule),
    [schedule, sharedPatients, sharedTasks],
  );
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0] || null;
  const filterOptions = useMemo(() => buildFilterOptions(tasks, sharedPatients), [sharedPatients, tasks]);
  const visibleTasks = useMemo(
    () => groupTasks(sortTasks(filterTasks(tasks, { activeView, filters, searchTerm }), sortBy), groupBy),
    [activeView, filters, groupBy, searchTerm, sortBy, tasks],
  );
  const flatVisibleTasks = useMemo(() => visibleTasks.flatMap((group) => group.tasks), [visibleTasks]);
  const todayStats = useMemo(() => buildTaskStats(tasks), [tasks]);
  const nextAppointmentTask = useMemo(() => findNextAppointmentTask(tasks, schedule), [schedule, tasks]);

  function resolvePatient(task) {
    return sharedPatients.find((patient) =>
      patient.id === task?.patientId ||
      patient.fullName === task?.relatedPatient ||
      patient.name === task?.relatedPatient);
  }

  function openPatient(task, tabId = "summary") {
    const patient = resolvePatient(task);
    if (patient) onOpenClinicalHub?.(patient, tabId);
  }

  function openLinkedModule(task) {
    const tabId = task.linkedWorkflowStage || moduleToClinicalTab(task.linkedModule || task.relatedModule);
    if (task.category === "Diet Plan") {
      openPatient(task, "dietPlan");
      return;
    }
    openPatient(task, tabId || "summary");
  }

  function updateTaskStatus(task, status) {
    const updates = {
      status,
      updatedAt: new Date().toISOString(),
      ...(status === "Completed" ? { completedAt: new Date().toISOString(), progress: 100 } : {}),
    };
    updateSharedTask?.(task.id, updates);
    setSaveState("Saved just now");
  }

  function openEditor(task = null) {
    setDuplicateWarning(null);
    setEditingTask(createTaskDraft(task, activePatient, nextAppointmentTask?.appointment));
    setSaveState("Unsaved changes");
  }

  function saveTask(draft) {
    const normalizedDraft = normalizeTaskDraft(draft, sharedPatients, schedule);
    const duplicate = findDuplicateTask(normalizedDraft, tasks);
    if (duplicate) {
      setDuplicateWarning(duplicate);
      return;
    }

    if (tasks.some((task) => task.id === normalizedDraft.id)) {
      updateSharedTask?.(normalizedDraft.id, normalizedDraft);
    } else {
      addSharedTask?.(normalizedDraft);
    }
    setSelectedTaskId(normalizedDraft.id);
    setEditingTask(null);
    setDuplicateWarning(null);
    setSaveState("Saved just now");
  }

  function deletePermittedTask(task) {
    if (task.status === "Completed") return;
    deleteSharedTask?.(task.id);
    setSelectedTaskId("");
  }

  return (
    <NutriPage data-language={language}>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">{todayStats.dueToday} {t("task.dueToday", { defaultValue: "due today" })}</NutriBadge>
              <NutriBadge tone="danger">{todayStats.overdue} {t("task.overdue", { defaultValue: "overdue" })}</NutriBadge>
              <NutriBadge tone="secondary">{saveState}</NutriBadge>
              <NutriButton onClick={() => openEditor()}><Plus className="h-4 w-4" />{t("task.newTask", { defaultValue: "New Task" })}</NutriButton>
            </>
          }
          kicker={t("task.kicker", { defaultValue: "Clinical work management" })}
          subtitle={t("task.subtitle", { defaultValue: "Prioritize, assign, and complete clinical work from one shared task source." })}
          title={t("navigation.taskCenter", { defaultValue: "Task Center" })}
        />

        <ActivePatientBanner patient={activePatient} onOpenClinicalHub={() => onOpenClinicalHub?.(activePatient)} />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TaskStat icon={ClipboardList} label="Due Today" tone="brand" value={todayStats.dueToday} />
          <TaskStat icon={AlertTriangle} label="Overdue" tone="danger" value={todayStats.overdue} />
          <TaskStat icon={ShieldAlert} label="High Priority" tone="warning" value={todayStats.highPriority} />
          <TaskStat icon={CheckCircle2} label="Completed Today" tone="success" value={todayStats.completedToday} />
        </section>

        <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <NutriPanel>
              <div className="flex flex-col gap-4 border-b border-[var(--np-color-border-soft)] pb-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {TASK_VIEWS.map((view) => (
                    <button
                      className={`np-button min-h-10 shrink-0 px-4 text-xs ${activeView === view ? "np-button-primary" : "np-button-secondary"}`}
                      key={view}
                      onClick={() => setActiveView(view)}
                      type="button"
                    >
                      {t(`task.view.${view}`, { defaultValue: view })}
                    </button>
                  ))}
                </div>
                <div className="relative w-full xl:max-w-md">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--np-color-text-soft)]" />
                  <input
                    className="np-search-field px-12"
                    dir="auto"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={t("task.searchPlaceholder", { defaultValue: "Search tasks, patients, assignees, records..." })}
                    value={searchTerm}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[250px_minmax(0,1fr)]">
                <TaskFilters
                  filterOptions={filterOptions}
                  filters={filters}
                  groupBy={groupBy}
                  setFilters={setFilters}
                  setGroupBy={setGroupBy}
                  setSortBy={setSortBy}
                  sortBy={sortBy}
                />
                <TaskList
                  groupedTasks={visibleTasks}
                  onCancel={(task) => updateTaskStatus(task, "Cancelled")}
                  onComplete={(task) => updateTaskStatus(task, "Completed")}
                  onEdit={openEditor}
                  onOpenLinkedModule={openLinkedModule}
                  onOpenPatient={openPatient}
                  onSelectTask={setSelectedTaskId}
                  onStart={(task) => updateTaskStatus(task, task.status === "To Do" ? "In Progress" : task.status)}
                  selectedTaskId={selectedTaskId}
                />
              </div>
            </NutriPanel>

            <SuggestedTasksPanel
              onCreate={(task) => saveTask(task)}
              suggestions={workflowSuggestions}
            />
          </div>

          <aside className="space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
            <TaskDetailsPanel
              appointment={nextAppointmentTask?.appointment}
              onCancel={(task) => updateTaskStatus(task, "Cancelled")}
              onComplete={(task) => updateTaskStatus(task, "Completed")}
              onDelete={deletePermittedTask}
              onEdit={openEditor}
              onOpenLinkedModule={openLinkedModule}
              onOpenPatient={openPatient}
              onStart={(task) => updateTaskStatus(task, task.status === "To Do" ? "In Progress" : task.status)}
              task={selectedTask}
            />
            <TaskOperationsPanel tasks={tasks} visibleCount={flatVisibleTasks.length} />
          </aside>
        </section>

        <button className="np-button np-button-primary fixed bottom-5 right-5 z-30 min-h-12 shadow-[var(--np-shadow-elevated)] md:hidden" onClick={() => openEditor()} type="button">
          <Plus className="h-4 w-4" />
          {t("task.newTask", { defaultValue: "New Task" })}
        </button>

        {editingTask ? (
          <TaskEditor
            duplicateWarning={duplicateWarning}
            onCancel={() => {
              setEditingTask(null);
              setDuplicateWarning(null);
              setSaveState("Saved");
            }}
            onChange={setEditingTask}
            onSave={saveTask}
            patients={sharedPatients}
            schedule={schedule}
            task={editingTask}
          />
        ) : null}
      </NutriPageMain>
    </NutriPage>
  );
}

function TaskList({ groupedTasks, onCancel, onComplete, onEdit, onOpenLinkedModule, onOpenPatient, onSelectTask, onStart, selectedTaskId }) {
  if (!groupedTasks.some((group) => group.tasks.length)) {
    return <EmptyTaskState />;
  }

  return (
    <div className="space-y-5">
      {groupedTasks.map((group) => (
        <section className="space-y-3" key={group.label}>
          {group.label !== "All" ? <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">{group.label}</h3> : null}
          {group.tasks.map((task) => (
            <TaskCard
              key={task.id}
              onCancel={onCancel}
              onComplete={onComplete}
              onEdit={onEdit}
              onOpenLinkedModule={onOpenLinkedModule}
              onOpenPatient={onOpenPatient}
              onSelectTask={onSelectTask}
              onStart={onStart}
              selected={selectedTaskId === task.id}
              task={task}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function TaskCard({ onCancel, onComplete, onEdit, onOpenLinkedModule, onOpenPatient, onSelectTask, onStart, selected, task }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <article className={`rounded-[22px] border bg-white p-4 shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)] ${selected ? "border-[var(--np-color-brand)] ring-4 ring-[rgb(122_31_43_/_0.08)]" : "border-[var(--np-color-border-soft)]"}`}>
      <button className="w-full text-left" onClick={() => onSelectTask(task.id)} type="button">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              <NutriBadge tone="secondary">{task.category}</NutriBadge>
            </div>
            <h3 className="text-lg font-extrabold text-[var(--np-color-text)]">{task.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{task.description}</p>
          </div>
          <div className="text-sm font-extrabold text-[var(--np-color-brand)]">{task.dueDate}{task.dueTime ? ` · ${task.dueTime}` : ""}</div>
        </div>
      </button>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <MiniMeta label="Patient" value={task.relatedPatient || "Not linked"} />
        <MiniMeta label="Assignee" value={task.assignedTo} />
        <MiniMeta label="Module" value={task.linkedModule || task.relatedModule} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onStart(task)} variant="secondary">Mark In Progress</NutriButton>
        <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onComplete(task)} variant="secondary">Mark Completed</NutriButton>
        <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onOpenPatient(task)} variant="secondary">Open Patient</NutriButton>
        <div className="relative">
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => setMenuOpen((current) => !current)} variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            More
          </NutriButton>
          {menuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-56 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-2 shadow-[var(--np-shadow-elevated)]">
              {[
                ["Edit", () => onEdit(task), Edit3],
                ["Reschedule", () => onEdit({ ...task, dueDate: toDateKey(new Date()) }), CalendarClock],
                ["Open Linked Module", () => onOpenLinkedModule(task), Layers3],
                ["Cancel", () => onCancel(task), X],
              ].map(([label, onClick, Icon]) => (
                <button className="flex min-h-10 w-full items-center gap-2 rounded-[12px] px-3 text-left text-xs font-extrabold hover:bg-[var(--np-color-surface-muted)]" key={label} onClick={onClick} type="button">
                  <Icon className="h-4 w-4 text-[var(--np-color-brand)]" />
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function TaskDetailsPanel({ appointment, onCancel, onComplete, onDelete, onEdit, onOpenLinkedModule, onOpenPatient, onStart, task }) {
  if (!task) {
    return (
      <NutriPanel>
        <NutriSectionHeader icon={ClipboardList} kicker="Details" title="Task Details" />
        <EmptyTaskState />
      </NutriPanel>
    );
  }
  const primaryAction = task.status === "Completed" ? "Review Task" : task.status === "In Progress" ? "Continue Task" : "Start Task";

  return (
    <NutriPanel>
      <NutriSectionHeader icon={ClipboardList} kicker="Selected task" title="Task Details" />
      <div className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-[var(--np-color-text)]">{task.title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{task.description}</p>
          </div>
          <PriorityBadge priority={task.priority} />
        </div>
      </div>
      <DetailRows rows={[
        ["Status", task.status],
        ["Category", task.category],
        ["Due", `${task.dueDate}${task.dueTime ? ` · ${task.dueTime}` : ""}`],
        ["Assigned user", task.assignedTo],
        ["Created by", task.createdBy],
        ["Patient context", task.relatedPatient || "Not linked"],
        ["Appointment context", appointment ? `${appointment.time || ""} ${appointment.type || ""}` : task.linkedAppointment || "Not linked"],
        ["Workflow stage", task.linkedWorkflowStage || "Not linked"],
        ["Care plan", task.linkedCarePlan || "Not linked"],
        ["Referral", task.linkedReferral || "Not linked"],
        ["Report", task.linkedReport || "Not linked"],
        ["Activity history", task.activityHistory?.join("; ") || task.notes || "No activity recorded"],
        ["Completion notes", task.completionNotes || "Not completed"],
      ]} />
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <NutriButton onClick={() => onStart(task)}><Clock3 className="h-4 w-4" />{primaryAction}</NutriButton>
        <NutriButton onClick={() => onComplete(task)} variant="secondary"><CheckCircle2 className="h-4 w-4" />Complete Task</NutriButton>
        <NutriButton onClick={() => onEdit(task)} variant="secondary"><Edit3 className="h-4 w-4" />Edit</NutriButton>
        <NutriButton onClick={() => onOpenPatient(task)} variant="secondary"><Stethoscope className="h-4 w-4" />Open Clinical Workspace</NutriButton>
        <NutriButton onClick={() => onOpenLinkedModule(task)} variant="secondary"><Layers3 className="h-4 w-4" />Open Linked Module</NutriButton>
        <NutriButton onClick={() => onCancel(task)} variant="secondary"><X className="h-4 w-4" />Cancel</NutriButton>
        <NutriButton disabled={task.status === "Completed"} onClick={() => onDelete(task)} variant="danger"><Trash2 className="h-4 w-4" />Delete</NutriButton>
      </div>
    </NutriPanel>
  );
}

function SuggestedTasksPanel({ onCreate, suggestions }) {
  if (!suggestions.length) return null;
  return (
    <NutriPanel>
      <NutriSectionHeader icon={AlertTriangle} kicker="Suggested" title="Workflow-Suggested Tasks" />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {suggestions.map((task) => (
          <article className="rounded-[20px] border border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-4" key={task.id}>
            <div className="flex flex-wrap gap-2">
              <NutriBadge tone="warning">Suggested</NutriBadge>
              <PriorityBadge priority={task.priority} />
            </div>
            <h3 className="mt-3 text-base font-extrabold text-[var(--np-color-text)]">{task.title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{task.description}</p>
            <NutriButton className="mt-4 min-h-10 px-3 text-xs" onClick={() => onCreate(task)} variant="secondary">
              <Plus className="h-4 w-4" />
              Create Suggested Task
            </NutriButton>
          </article>
        ))}
      </div>
    </NutriPanel>
  );
}

function TaskFilters({ filterOptions, filters, groupBy, setFilters, setGroupBy, setSortBy, sortBy }) {
  const fields = [
    ["status", "Status"],
    ["priority", "Priority"],
    ["category", "Category"],
    ["assignee", "Assigned user"],
    ["patient", "Patient"],
    ["branch", "Branch"],
    ["department", "Department"],
    ["module", "Linked module"],
  ];
  return (
    <aside className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="mb-3 text-sm font-extrabold text-[var(--np-color-text)]">Filters</p>
      <div className="grid grid-cols-1 gap-3">
        {fields.map(([field, label]) => (
          <label className="block" key={field}>
            <span className="np-form-label">{label}</span>
            <select className="np-form-control min-h-11" onChange={(event) => setFilters((current) => ({ ...current, [field]: event.target.value }))} value={filters[field]}>
              {filterOptions[field].map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ))}
        <label className="block">
          <span className="np-form-label">Sort by</span>
          <select className="np-form-control min-h-11" onChange={(event) => setSortBy(event.target.value)} value={sortBy}>
            {SORT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="np-form-label">Group by</span>
          <select className="np-form-control min-h-11" onChange={(event) => setGroupBy(event.target.value)} value={groupBy}>
            {GROUP_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>
    </aside>
  );
}

function TaskEditor({ duplicateWarning, onCancel, onChange, onSave, patients, schedule, task }) {
  function updateField(field, value) {
    onChange({ ...task, [field]: value });
  }

  return (
    <NutriModal className="max-w-4xl" kicker="Task" onClose={onCancel} title={task.id.startsWith("task-new") ? "New Task" : "Edit Task"}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NutriInput label="Title" onChange={(event) => updateField("title", event.target.value)} value={task.title || ""} />
        <label className="block">
          <span className="np-form-label">Category</span>
          <select className="np-form-control" onChange={(event) => updateField("category", event.target.value)} value={task.category || "General"}>
            {TASK_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="np-form-label">Priority</span>
          <select className="np-form-control" onChange={(event) => updateField("priority", event.target.value)} value={task.priority || "Medium"}>
            {TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="np-form-label">Status</span>
          <select className="np-form-control" onChange={(event) => updateField("status", event.target.value)} value={task.status || "To Do"}>
            {TASK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <NutriInput label="Due date" onChange={(event) => updateField("dueDate", event.target.value)} type="date" value={normalizeDateInput(task.dueDate)} />
        <NutriInput label="Due time" onChange={(event) => updateField("dueTime", event.target.value)} type="time" value={task.dueTime || ""} />
        <NutriInput label="Assigned user" onChange={(event) => updateField("assignedTo", event.target.value)} value={task.assignedTo || ""} />
        <NutriInput label="Created by" onChange={(event) => updateField("createdBy", event.target.value)} value={task.createdBy || ""} />
        <label className="block">
          <span className="np-form-label">Linked patient</span>
          <select className="np-form-control" onChange={(event) => {
            const patient = patients.find((item) => item.id === event.target.value);
            onChange({ ...task, patientId: patient?.id || "", relatedPatient: patient?.fullName || patient?.name || "None" });
          }} value={task.patientId || ""}>
            <option value="">No patient</option>
            {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.fullName || patient.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="np-form-label">Linked appointment</span>
          <select className="np-form-control" onChange={(event) => updateField("linkedAppointmentId", event.target.value)} value={task.linkedAppointmentId || ""}>
            <option value="">No appointment</option>
            {schedule.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.time} {appointment.patientName} - {appointment.type}</option>)}
          </select>
        </label>
        <NutriInput label="Linked workflow stage" onChange={(event) => updateField("linkedWorkflowStage", event.target.value)} value={task.linkedWorkflowStage || ""} />
        <NutriInput label="Linked module" onChange={(event) => updateField("linkedModule", event.target.value)} value={task.linkedModule || task.relatedModule || ""} />
        <NutriInput label="Organization" onChange={(event) => updateField("organization", event.target.value)} value={task.organization || ""} />
        <NutriInput label="Branch" onChange={(event) => updateField("branch", event.target.value)} value={task.branch || ""} />
        <NutriInput label="Department" onChange={(event) => updateField("department", event.target.value)} value={task.department || ""} />
        <NutriInput label="Recurrence" onChange={(event) => updateField("recurrence", event.target.value)} value={task.recurrence || ""} />
        <label className="block md:col-span-2">
          <span className="np-form-label">Description</span>
          <textarea className="np-form-control min-h-24" onChange={(event) => updateField("description", event.target.value)} value={task.description || ""} />
        </label>
        <label className="block md:col-span-2">
          <span className="np-form-label">Completion notes</span>
          <textarea className="np-form-control min-h-24" onChange={(event) => updateField("completionNotes", event.target.value)} value={task.completionNotes || ""} />
        </label>
      </div>
      {duplicateWarning ? <DuplicateWarning duplicate={duplicateWarning} /> : null}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <NutriButton onClick={onCancel} variant="secondary">Cancel</NutriButton>
        <NutriButton onClick={() => onSave(task)}>Save Task</NutriButton>
      </div>
    </NutriModal>
  );
}

function DuplicateWarning({ duplicate }) {
  return (
    <section className="mt-5 rounded-[20px] border border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[var(--np-color-warning)]" />
        <div>
          <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">Possible duplicate task</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
            An active task already exists for the same patient, category, linked record, reason, and due context.
          </p>
          <p className="mt-2 text-xs font-extrabold text-[var(--np-color-text)]">{duplicate.title} · {duplicate.status}</p>
        </div>
      </div>
    </section>
  );
}

function TaskOperationsPanel({ tasks, visibleCount }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={Layers3} kicker="Operations" title="Task Workload" />
      <div className="grid grid-cols-2 gap-3">
        <MiniMetric label="Visible" value={visibleCount} />
        <MiniMetric label="All tasks" value={tasks.length} />
        <MiniMetric label="Waiting" value={tasks.filter((task) => task.status === "Waiting").length} />
        <MiniMetric label="Review" value={tasks.filter((task) => task.status === "Needs Review").length} />
      </div>
      <p className="mt-4 rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
        Role behavior is prepared for existing user permissions. No new permission system or notification channel was added.
      </p>
    </NutriPanel>
  );
}

function TaskStat({ icon: Icon, label, tone, value }) {
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
    <div className="mt-4 space-y-2">
      {rows.map(([label, value]) => (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-[var(--np-color-surface-muted)] p-3" key={label}>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
          <p className="text-sm font-bold text-[var(--np-color-text)]" dir="auto">{value || "Not recorded"}</p>
        </div>
      ))}
    </div>
  );
}

function MiniMeta({ label, value }) {
  return (
    <div className="rounded-[14px] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text)]" dir="auto">{value || "Not recorded"}</p>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-soft)]">{label}</p>
      <p className="mt-1 text-lg font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function EmptyTaskState() {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-6 text-center text-sm font-bold text-[var(--np-color-text-muted)]">
      No tasks match this view.
    </div>
  );
}

function PriorityBadge({ priority }) {
  const tone = { Critical: "danger", High: "warning", Low: "secondary", Medium: "brand" }[priority] || "secondary";
  return <NutriBadge tone={tone}>{priority}</NutriBadge>;
}

function StatusBadge({ status }) {
  const tone = {
    Cancelled: "danger",
    Completed: "success",
    "In Progress": "brand",
    "Needs Review": "warning",
    Overdue: "danger",
    "To Do": "secondary",
    Waiting: "warning",
  }[status] || "secondary";
  return <NutriBadge tone={tone}>{status}</NutriBadge>;
}

function normalizeTasks(tasks, patients, schedule) {
  return tasks.map((task, index) => {
    const patient = patients.find((item) => item.id === task.patientId || item.fullName === task.relatedPatient || item.name === task.relatedPatient);
    const appointment = schedule.find((item) => item.id === task.linkedAppointmentId || item.patientName === task.relatedPatient);
    const due = normalizeDueDate(task.dueDate);
    const status = normalizeTaskStatus(task.status, due);
    return {
      activityHistory: task.activityHistory || [`Created from ${task.relatedModule || task.linkedModule || "Task Center"}`],
      assignedTo: task.assignedTo || task.assignedUser || "Dr. Shahad",
      branch: task.branch || appointment?.branch || "Main Clinic",
      category: normalizeTaskCategory(task.category, task.relatedModule),
      completedAt: task.completedAt || "",
      completionNotes: task.completionNotes || "",
      createdAt: task.createdAt || new Date().toISOString(),
      createdBy: task.createdBy || "NutriPilot",
      department: task.department || appointment?.department || "Clinical Nutrition",
      description: task.description || "Task description not recorded.",
      dueDate: due.date,
      dueTime: task.dueTime || due.time || appointment?.time || "",
      id: task.id || `task-${index}`,
      linkedAppointment: appointment?.type || task.linkedAppointment || "",
      linkedAppointmentId: task.linkedAppointmentId || appointment?.id || "",
      linkedCarePlan: task.linkedCarePlan || "",
      linkedModule: task.linkedModule || task.relatedModule || "Task Center",
      linkedRecordKey: task.linkedRecordKey || task.relatedModule || task.id,
      linkedReferral: task.linkedReferral || "",
      linkedReport: task.linkedReport || "",
      linkedWorkflowStage: task.linkedWorkflowStage || inferWorkflowStage(task),
      notes: task.notes || "",
      organization: task.organization || "NutriPilot Demo Hospital",
      patientId: task.patientId || patient?.id || "",
      priority: normalizePriority(task.priority),
      progress: Number(task.progress) || (status === "Completed" ? 100 : status === "In Progress" ? 50 : 0),
      reason: task.reason || task.description || task.title,
      recurrence: task.recurrence || "",
      relatedPatient: patient?.fullName || patient?.name || task.relatedPatient || "None",
      status,
      title: task.title || "Untitled task",
      updatedAt: task.updatedAt || task.createdAt || new Date().toISOString(),
    };
  });
}

function buildWorkflowSuggestedTasks(activePatient, sharedTasks) {
  if (!activePatient) return [];
  const core = buildNutritionCareCore(activePatient);
  return [
    ...core.journey.missingRequirements.slice(0, 3).map(({ item, stage }) => ({
      category: stage.includes("Diagnosis") ? "PES Diagnosis" : "Clinical Documentation",
      description: `${item} is missing in ${stage}. Suggested task only - clinician review required.`,
      dueDate: toDateKey(new Date()),
      id: `suggested-${activePatient.id}-${stage}-${item}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      linkedWorkflowStage: stage,
      priority: stage.includes("Diagnosis") || stage.includes("Intervention") ? "High" : "Medium",
      relatedPatient: activePatient.fullName || activePatient.name,
      status: "To Do",
      title: `Complete ${item}`,
    })),
    ...core.alerts.slice(0, 2).map((alert) => ({
      category: "Quality Review",
      description: `${alert.reason} Suggested task only - does not modify the care plan.`,
      dueDate: toDateKey(new Date()),
      id: `suggested-${activePatient.id}-${alert.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      linkedWorkflowStage: "Review / Discharge",
      priority: alert.severity === "High" ? "High" : "Medium",
      relatedPatient: activePatient.fullName || activePatient.name,
      status: "To Do",
      title: alert.title,
    })),
  ].filter((suggestion) => !sharedTasks.some((task) => task.id === suggestion.id || task.title === suggestion.title));
}

function filterTasks(tasks, { activeView, filters, searchTerm }) {
  const today = toDateKey(new Date());
  const query = searchTerm.trim().toLowerCase();
  return tasks.filter((task) => {
    const matchesView = activeView === "My Tasks"
      ? task.assignedTo === "Dr. Shahad"
      : activeView === "Today"
        ? task.dueDate === today && task.status !== "Completed"
        : activeView === "Upcoming"
          ? task.dueDate > today && task.status !== "Completed"
          : activeView === "Overdue"
            ? task.status === "Overdue" || (task.dueDate < today && task.status !== "Completed")
            : activeView === "Completed"
              ? task.status === "Completed"
              : true;
    const matchesFilters = Object.entries(filters).every(([field, value]) => {
      if (value === "All") return true;
      if (field === "patient") return task.patientId === value;
      if (field === "module") return task.linkedModule === value || task.relatedModule === value;
      if (field === "assignee") return task.assignedTo === value;
      return task[field] === value;
    });
    const matchesSearch = query ? [
      task.title,
      task.description,
      task.relatedPatient,
      task.assignedTo,
      task.category,
      task.linkedModule,
      task.linkedRecordKey,
    ].join(" ").toLowerCase().includes(query) : true;
    return matchesView && matchesFilters && matchesSearch;
  });
}

function sortTasks(tasks, sortBy) {
  const priorityRank = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const statusRank = { Overdue: 0, "In Progress": 1, "Needs Review": 2, "To Do": 3, Waiting: 4, Completed: 5, Cancelled: 6 };
  return [...tasks].sort((first, second) => {
    if (sortBy === "Due date") return `${first.dueDate} ${first.dueTime}`.localeCompare(`${second.dueDate} ${second.dueTime}`);
    if (sortBy === "Created date") return String(second.createdAt).localeCompare(String(first.createdAt));
    if (sortBy === "Patient") return String(first.relatedPatient).localeCompare(String(second.relatedPatient));
    if (sortBy === "Status") return (statusRank[first.status] ?? 9) - (statusRank[second.status] ?? 9);
    return (statusRank[first.status] ?? 9) - (statusRank[second.status] ?? 9)
      || (priorityRank[first.priority] ?? 9) - (priorityRank[second.priority] ?? 9)
      || `${first.dueDate} ${first.dueTime}`.localeCompare(`${second.dueDate} ${second.dueTime}`);
  });
}

function groupTasks(tasks, groupBy) {
  if (groupBy === "None") return [{ label: "All", tasks }];
  const getKey = {
    Assignee: (task) => task.assignedTo,
    Category: (task) => task.category,
    Date: (task) => task.dueDate,
    Patient: (task) => task.relatedPatient || "No patient",
    Priority: (task) => task.priority,
  }[groupBy];
  const groups = new Map();
  tasks.forEach((task) => {
    const key = getKey?.(task) || "Other";
    groups.set(key, [...(groups.get(key) || []), task]);
  });
  return [...groups.entries()].map(([label, groupTasks]) => ({ label, tasks: groupTasks }));
}

function buildFilterOptions(tasks, patients) {
  const options = (values) => ["All", ...unique(values)].map((value) => ({ label: value, value }));
  return {
    assignee: options(tasks.map((task) => task.assignedTo)),
    branch: options(tasks.map((task) => task.branch)),
    category: options(TASK_CATEGORIES),
    department: options(tasks.map((task) => task.department)),
    module: options(tasks.map((task) => task.linkedModule)),
    patient: [{ label: "All", value: "All" }, ...patients.map((patient) => ({ label: patient.fullName || patient.name, value: patient.id }))],
    priority: options(TASK_PRIORITIES),
    status: options(TASK_STATUSES),
  };
}

function buildTaskStats(tasks) {
  const today = toDateKey(new Date());
  return {
    completedToday: tasks.filter((task) => task.status === "Completed" && String(task.completedAt || "").startsWith(today)).length,
    dueToday: tasks.filter((task) => task.dueDate === today && task.status !== "Completed").length,
    highPriority: tasks.filter((task) => ["Critical", "High"].includes(task.priority) && task.status !== "Completed").length,
    overdue: tasks.filter((task) => task.status === "Overdue").length,
  };
}

function createTaskDraft(task, activePatient, appointment) {
  if (task) return { ...task };
  const now = new Date().toISOString();
  return {
    activityHistory: ["Manual task draft created"],
    assignedTo: "Dr. Shahad",
    branch: appointment?.branch || "Main Clinic",
    category: "General",
    completedAt: "",
    completionNotes: "",
    createdAt: now,
    createdBy: "Dr. Shahad",
    department: appointment?.department || "Clinical Nutrition",
    description: "",
    dueDate: toDateKey(new Date()),
    dueTime: appointment?.time || "",
    id: `task-new-${Date.now()}`,
    linkedAppointmentId: appointment?.id || "",
    linkedCarePlan: "",
    linkedModule: "Task Center",
    linkedRecordKey: "",
    linkedReferral: "",
    linkedReport: "",
    linkedWorkflowStage: "",
    organization: "NutriPilot Demo Hospital",
    patientId: activePatient?.id || "",
    priority: "Medium",
    recurrence: "",
    relatedPatient: activePatient?.fullName || activePatient?.name || "None",
    status: "To Do",
    title: "",
    updatedAt: now,
  };
}

function normalizeTaskDraft(task, patients, schedule) {
  const patient = patients.find((item) => item.id === task.patientId);
  const appointment = schedule.find((item) => item.id === task.linkedAppointmentId);
  return {
    ...task,
    assignedTo: task.assignedTo || "Unassigned",
    category: normalizeTaskCategory(task.category, task.linkedModule),
    dueDate: normalizeDateInput(task.dueDate) || toDateKey(new Date()),
    linkedModule: task.linkedModule || task.relatedModule || "Task Center",
    patientId: patient?.id || task.patientId || "",
    priority: normalizePriority(task.priority),
    relatedPatient: patient?.fullName || patient?.name || task.relatedPatient || "None",
    status: normalizeTaskStatus(task.status, { date: task.dueDate }),
    title: task.title || "Untitled task",
    updatedAt: new Date().toISOString(),
    ...(appointment ? { linkedAppointment: appointment.type } : {}),
  };
}

function findDuplicateTask(draft, tasks) {
  return tasks.find((task) =>
    task.id !== draft.id &&
    task.status !== "Completed" &&
    task.status !== "Cancelled" &&
    task.patientId === draft.patientId &&
    task.category === draft.category &&
    task.linkedRecordKey === draft.linkedRecordKey &&
    task.reason === draft.reason &&
    task.dueDate === draft.dueDate);
}

function findNextAppointmentTask(tasks, schedule) {
  const today = toDateKey(new Date());
  const appointment = schedule
    .filter((item) => (item.date || today) >= today && !["Completed", "Cancelled", "No Show"].includes(item.status))
    .sort((first, second) => `${first.date || today} ${first.time}`.localeCompare(`${second.date || today} ${second.time}`))[0];
  if (!appointment) return null;
  return {
    appointment,
    task: tasks.find((task) => task.linkedAppointmentId === appointment.id),
  };
}

function moduleToClinicalTab(module) {
  const text = String(module || "").toLowerCase();
  if (text.includes("lab")) return "laboratory";
  if (text.includes("pes")) return "pes";
  if (text.includes("diet")) return "dietPlan";
  if (text.includes("intervention")) return "intervention";
  if (text.includes("monitor")) return "monitoring";
  if (text.includes("assessment")) return "anthropometric";
  return "summary";
}

function inferWorkflowStage(task) {
  const text = `${task.category} ${task.relatedModule} ${task.title}`.toLowerCase();
  if (text.includes("lab")) return "laboratory";
  if (text.includes("pes")) return "pes";
  if (text.includes("diet plan")) return "dietPlan";
  if (text.includes("intervention") || text.includes("care plan")) return "intervention";
  if (text.includes("follow") || text.includes("monitor")) return "monitoring";
  if (text.includes("report")) return "reports";
  return "";
}

function normalizeTaskCategory(category, module) {
  const text = `${category || ""} ${module || ""}`.toLowerCase();
  if (text.includes("laboratory") || text.includes("lab")) return "Laboratory Review";
  if (text.includes("pes")) return "PES Diagnosis";
  if (text.includes("diet plan")) return "Diet Plan";
  if (text.includes("intervention") || text.includes("care plan")) return "Care Plan";
  if (text.includes("follow") || text.includes("monitoring")) return "Patient Follow-up";
  if (text.includes("report")) return "Report";
  if (text.includes("research")) return "Research";
  if (text.includes("assessment")) return "Nutrition Assessment";
  if (TASK_CATEGORIES.includes(category)) return category;
  if (category === "Clinical") return "Clinical Documentation";
  if (category === "Administrative") return "Administrative";
  return "General";
}

function normalizeTaskStatus(status, due = {}) {
  const normalized = {
    Archived: "Cancelled",
    "Not Started": "To Do",
  }[status] || status || "To Do";
  const dueDate = typeof due === "string" ? normalizeDueDate(due).date : due.date;
  if (!["Completed", "Cancelled"].includes(normalized) && dueDate && dueDate < toDateKey(new Date())) return "Overdue";
  return TASK_STATUSES.includes(normalized) ? normalized : "To Do";
}

function normalizePriority(priority) {
  if (TASK_PRIORITIES.includes(priority)) return priority;
  return priority === "High" ? "High" : "Medium";
}

function normalizeDueDate(value) {
  const raw = String(value || "").trim();
  const today = toDateKey(new Date());
  if (!raw || raw === "Not scheduled") return { date: "", time: "" };
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { date: raw, time: "" };
  if (raw.toLowerCase().includes("today")) return { date: today, time: extractTime(raw) };
  if (raw.toLowerCase().includes("tomorrow")) {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return { date: toDateKey(date), time: extractTime(raw) };
  }
  return { date: raw.length <= 10 ? raw : today, time: extractTime(raw) };
}

function normalizeDateInput(value) {
  return normalizeDueDate(value).date || String(value || "");
}

function extractTime(value) {
  const match = String(value).match(/(\d{1,2}:\d{2})/);
  return match?.[1] || "";
}

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
