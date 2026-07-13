import { useMemo, useState } from "react";
import {
  Archive,
  Beaker,
  Bot,
  BriefcaseMedical,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Layers3,
  ListChecks,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  TimerReset,
  UserPlus,
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
import { useTranslation } from "../i18n";

const viewOptions = ["List View", "Kanban View", "Timeline View", "Calendar View"];
const categories = ["All", "Clinical", "Follow-up", "Laboratory", "AI Review", "Reports", "Research", "Administrative", "Innovation"];

const initialTasks = [
  {
    id: "task-1",
    title: "Review low ferritin for Sarah Ahmed",
    description: "Ferritin trend requires clinical review before the next nutrition follow-up.",
    category: "Laboratory",
    priority: "Critical",
    status: "In Progress",
    dueDate: "Today, 10:30 AM",
    assignedTo: "Dr. Shahad",
    relatedPatient: "Sarah Ahmed",
    relatedProject: "None",
    relatedModule: "Clinical Hub / Laboratory Results",
    progress: 70,
    notes: "Check Hb and dietary iron intake before updating intervention.",
    reason: "Abnormal lab with high nutrition risk.",
    nextAction: "Open Clinical Hub",
  },
  {
    id: "task-2",
    title: "Complete PES for high-risk patient",
    description: "Nutrition diagnosis needs clinician completion after assessment review.",
    category: "Clinical",
    priority: "High",
    status: "Not Started",
    dueDate: "Today, 12:00 PM",
    assignedTo: "Clinical Dietitian",
    relatedPatient: "Reem Hassan",
    relatedProject: "None",
    relatedModule: "Clinical Hub / PES",
    progress: 20,
    notes: "Use current anthropometric and dietary assessment data.",
    reason: "Missing PES limits intervention planning.",
    nextAction: "Open Clinical Hub",
  },
  {
    id: "task-3",
    title: "Export follow-up report",
    description: "Monitoring report is ready for preview and PDF export placeholder.",
    category: "Reports",
    priority: "Medium",
    status: "Waiting",
    dueDate: "Tomorrow",
    assignedTo: "Reports Coordinator",
    relatedPatient: "Mohammed Khalid",
    relatedProject: "None",
    relatedModule: "Reports Center",
    progress: 55,
    notes: "Confirm visit summary and follow-up date before export.",
    reason: "Report ready to export.",
    nextAction: "Open Reports Center",
  },
  {
    id: "task-4",
    title: "Review missing dietary recall",
    description: "Dietary recall is incomplete and affects intake interpretation.",
    category: "Follow-up",
    priority: "High",
    status: "In Progress",
    dueDate: "Today, 02:00 PM",
    assignedTo: "Dr. Shahad",
    relatedPatient: "Fatima Ali",
    relatedProject: "None",
    relatedModule: "Clinical Hub / Dietary Assessment",
    progress: 45,
    notes: "Ask patient to complete breakfast and late snack details.",
    reason: "Missing dietary data lowers confidence.",
    nextAction: "Open Clinical Hub",
  },
  {
    id: "task-5",
    title: "Check research dataset missing values",
    description: "Dataset quality card shows missing plaque samples and dietary recalls.",
    category: "Research",
    priority: "High",
    status: "Not Started",
    dueDate: "This week",
    assignedTo: "Research Assistant",
    relatedPatient: "None",
    relatedProject: "IBS Study: Oral-Gut Axis",
    relatedModule: "Research Center / Dataset Control Room",
    progress: 30,
    notes: "Prepare missing value log before supervisor review.",
    reason: "Research dataset quality risk.",
    nextAction: "Open Research Project",
  },
  {
    id: "task-6",
    title: "AI lab interpretation pending approval",
    description: "AI-generated lab interpretation requires clinician review before use.",
    category: "AI Review",
    priority: "Medium",
    status: "Waiting",
    dueDate: "Today",
    assignedTo: "Dr. Shahad",
    relatedPatient: "Ali Abdullah",
    relatedProject: "None",
    relatedModule: "AI Center",
    progress: 60,
    notes: "Verify glucose and HbA1c patterns with available patient data.",
    reason: "AI output requires clinician review.",
    nextAction: "Open AI Center",
  },
  {
    id: "task-7",
    title: "Prepare protected time for innovation prototype",
    description: "Reserve focused block for NutriMap clinical information architecture.",
    category: "Innovation",
    priority: "Low",
    status: "Not Started",
    dueDate: "Friday",
    assignedTo: "Product Team",
    relatedPatient: "None",
    relatedProject: "NutriMap 2.0",
    relatedModule: "Innovation Lab",
    progress: 10,
    notes: "Placeholder task for future experimental workflows.",
    reason: "Future product planning.",
    nextAction: "Open Research Project",
  },
];

const clinicalSignals = [
  ["Missing PES", "2 patients require nutrition diagnosis completion", "High"],
  ["Missing intervention", "1 high-risk patient has no saved intervention", "Critical"],
  ["Missing follow-up", "3 patients have no next monitoring date", "Medium"],
  ["Abnormal labs", "Low ferritin and high glucose need review", "Critical"],
  ["Reports ready", "2 follow-up reports ready to export", "Medium"],
];

const researchSignals = [
  ["IRB form incomplete", "Signature page pending upload", "High"],
  ["Recruitment target not met", "73 of 120 participants enrolled", "Medium"],
  ["Missing consent forms", "2 forms require confirmation", "High"],
  ["Dataset missing values", "Plaque sample field incomplete", "Critical"],
  ["Manuscript draft pending", "Discussion section not started", "Low"],
];

const aiReviewItems = [
  ["AI PES suggestion pending review", "Sarah Ahmed", "High"],
  ["AI lab interpretation pending approval", "Ali Abdullah", "Medium"],
  ["AI intervention plan needs clinician confirmation", "Fatima Ali", "High"],
];

export default function TaskCommandCenter({
  activePatient,
  addSharedTask,
  onOpenClinicalHub,
  sharedPatients = [],
  sharedTasks,
  updateSharedTask,
}) {
  const { language } = useTranslation();
  const tasks = sharedTasks?.length ? sharedTasks : initialTasks;
  const [activeView, setActiveView] = useState("List View");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesCategory = activeCategory === "All" || task.category === activeCategory;
      const matchesSearch = normalizedSearch
        ? [
            task.title,
            task.description,
            task.category,
            task.assignedTo,
            task.relatedPatient,
            task.relatedProject,
            task.relatedModule,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchTerm, tasks]);

  const priorityQueue = useMemo(
    () =>
      tasks
        .filter((task) => ["Critical", "High"].includes(task.priority) && task.status !== "Completed")
        .slice(0, 5),
    [tasks],
  );

  function addTask(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") || "").trim();

    if (!title) {
      return;
    }

    const newTask = {
      id: `task-${Date.now()}`,
      title,
      description: "New placeholder task created locally in the Task Command Center.",
      category: String(formData.get("category")),
      priority: String(formData.get("priority")),
      status: "Not Started",
      dueDate: String(formData.get("dueDate") || "Not scheduled"),
      assignedTo: String(formData.get("assignedTo") || "Unassigned"),
      relatedPatient: String(formData.get("related") || "None"),
      relatedProject: String(formData.get("related") || "None"),
      relatedModule: "Task Command Center",
      progress: 0,
      notes: String(formData.get("notes") || "No notes added."),
      reason: "Manually created task.",
      nextAction: "Open Clinical Hub",
    };

    addSharedTask(newTask);
    setIsModalOpen(false);
  }

  function markComplete(taskId) {
    updateSharedTask(taskId, { progress: 100, status: "Completed" });
  }

  function archiveTask(taskId) {
    updateSharedTask(taskId, { status: "Archived" });
  }

  function snoozeTask(taskId) {
    updateSharedTask(taskId, { dueDate: "Snoozed to tomorrow", status: "Waiting" });
  }

  function openKnownPatient(patientName) {
    const patient = sharedPatients.find(
      (item) => item.fullName === patientName || item.name === patientName,
    );

    if (patient) {
      onOpenClinicalHub(patient);
    }
  }

  return (
    <NutriPage data-language={language}>
      <NutriPageMain>
        <NutriPageHeader
          kicker="Clinical Operations"
          title="Task Command Center"
          subtitle="Know what needs to be done, why it matters, who owns it, and which patient or research workflow it affects."
          actions={
            <>
              <NutriBadge tone="brand">{tasks.filter((task) => task.status !== "Completed").length} active</NutriBadge>
              <NutriBadge tone="danger">{tasks.filter((task) => task.priority === "Critical").length} critical</NutriBadge>
              <NutriButton onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Task
              </NutriButton>
            </>
          }
        />

        <ActivePatientBanner
          patient={activePatient}
          onOpenClinicalHub={() => onOpenClinicalHub(activePatient)}
        />

        <TaskDashboard tasks={tasks} />

        <section className="mt-5 grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <div className="space-y-5">
            <SmartPriorityQueue onOpenClinicalHub={openKnownPatient} tasks={priorityQueue} />

            <NutriPanel>
              <div className="mb-5 flex flex-col gap-4 border-b border-[var(--np-color-border-soft)] pb-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  {viewOptions.map((view) => (
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

                <div className="relative w-full xl:max-w-md">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--np-color-text-soft)]" />
                  <input
                    className="np-search-field px-12"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search tasks, patients, projects, modules..."
                    value={searchTerm}
                  />
                </div>
              </div>

              <div className="mb-5 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    className={`np-badge transition ${
                      activeCategory === category
                        ? "np-badge-brand"
                        : "np-badge-secondary hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
                    }`}
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>

              <TaskView
                activeView={activeView}
                onArchive={archiveTask}
                onComplete={markComplete}
                onOpenClinicalHub={openKnownPatient}
                onSnooze={snoozeTask}
                tasks={filteredTasks}
              />
            </NutriPanel>
          </div>

          <aside className="space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
            <ClinicalTaskIntelligence />
            <ResearchTaskIntelligence />
            <AIReviewQueue />
          </aside>
        </section>

        <section className="mt-5">
          <QuickActions onCreate={() => setIsModalOpen(true)} />
        </section>
      </NutriPageMain>

      {isModalOpen ? (
        <TaskCreationModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={addTask}
        />
      ) : null}
    </NutriPage>
  );
}

function TaskDashboard({ tasks }) {
  const stats = [
    ["Today's Tasks", tasks.filter((task) => task.dueDate.includes("Today")).length, ListChecks, "brand"],
    ["Overdue", 1, TimerReset, "danger"],
    ["High Priority", tasks.filter((task) => ["Critical", "High"].includes(task.priority)).length, ShieldAlert, "danger"],
    ["Clinical Tasks", tasks.filter((task) => task.category === "Clinical").length, BriefcaseMedical, "secondary"],
    ["Research Tasks", tasks.filter((task) => task.category === "Research").length, Beaker, "accent"],
    ["AI Review Tasks", tasks.filter((task) => task.category === "AI Review").length, Bot, "info"],
    ["Reports Pending", tasks.filter((task) => task.category === "Reports").length, FileText, "warning"],
    ["Completed This Week", tasks.filter((task) => task.status === "Completed").length + 6, CheckCircle2, "success"],
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
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">Task signal</p>
        </NutriPanel>
      ))}
    </section>
  );
}

function SmartPriorityQueue({ onOpenClinicalHub, tasks }) {
  return (
    <NutriPanel>
      <NutriSectionHeader
        icon={Sparkles}
        kicker="Start Here"
        title="Smart Priority Queue"
        action={<NutriBadge tone="danger">{tasks.length} focus tasks</NutriBadge>}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {tasks.map((task) => (
          <article className="rounded-[24px] border border-[rgb(122_31_43_/_0.16)] bg-white p-5 shadow-[var(--np-shadow-sm)]" key={task.id}>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge value={task.priority} />
              <NutriBadge tone="secondary">{task.category}</NutriBadge>
            </div>
            <h3 className="mt-4 text-xl font-extrabold text-[var(--np-color-text)]">{task.title}</h3>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{task.reason}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MiniMeta label="Related" value={task.relatedPatient !== "None" ? task.relatedPatient : task.relatedProject} />
              <MiniMeta label="Due" value={task.dueDate} />
            </div>
            <NutriButton className="mt-4 w-full" onClick={() => onOpenClinicalHub(task.relatedPatient)} variant="secondary">
              <BriefcaseMedical className="h-4 w-4" />
              {task.nextAction}
            </NutriButton>
          </article>
        ))}
      </div>
    </NutriPanel>
  );
}

function TaskView({ activeView, tasks, onArchive, onComplete, onOpenClinicalHub, onSnooze }) {
  if (activeView === "Kanban View") {
    return <KanbanView tasks={tasks} onArchive={onArchive} onComplete={onComplete} onOpenClinicalHub={onOpenClinicalHub} onSnooze={onSnooze} />;
  }

  if (activeView === "Timeline View") {
    return <TimelineView tasks={tasks} onArchive={onArchive} onComplete={onComplete} onOpenClinicalHub={onOpenClinicalHub} onSnooze={onSnooze} />;
  }

  if (activeView === "Calendar View") {
    return <CalendarTaskView tasks={tasks} onArchive={onArchive} onComplete={onComplete} onOpenClinicalHub={onOpenClinicalHub} onSnooze={onSnooze} />;
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          onArchive={onArchive}
          onComplete={onComplete}
          onOpenClinicalHub={onOpenClinicalHub}
          onSnooze={onSnooze}
          task={task}
        />
      ))}
    </div>
  );
}

function KanbanView({ tasks, onArchive, onComplete, onOpenClinicalHub, onSnooze }) {
  const statuses = ["Not Started", "In Progress", "Waiting", "Completed", "Archived"];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      {statuses.map((status) => (
        <div className="rounded-[24px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3" key={status}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{status}</p>
            <NutriBadge tone="secondary">{tasks.filter((task) => task.status === status).length}</NutriBadge>
          </div>
          <div className="space-y-3">
            {tasks
              .filter((task) => task.status === status)
              .map((task) => (
                <TaskCard
                  compact
                  key={task.id}
                  onArchive={onArchive}
                  onComplete={onComplete}
                  onOpenClinicalHub={onOpenClinicalHub}
                  onSnooze={onSnooze}
                  task={task}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineView({ tasks, onArchive, onComplete, onOpenClinicalHub, onSnooze }) {
  return (
    <div className="relative space-y-4">
      <div className="absolute left-5 top-2 hidden h-[calc(100%-1rem)] w-px bg-[var(--np-color-border-soft)] md:block" />
      {tasks.map((task) => (
        <div className="relative md:pl-14" key={task.id}>
          <span className="absolute left-0 top-5 hidden h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)] md:flex">
            <Clock className="h-4 w-4" />
          </span>
          <TaskCard task={task} onArchive={onArchive} onComplete={onComplete} onOpenClinicalHub={onOpenClinicalHub} onSnooze={onSnooze} />
        </div>
      ))}
    </div>
  );
}

function CalendarTaskView({ tasks, onArchive, onComplete, onOpenClinicalHub, onSnooze }) {
  const days = ["Today", "Tomorrow", "Wednesday", "Thursday"];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
      {days.map((day) => (
        <div className="min-h-64 rounded-[24px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4" key={day}>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-extrabold text-[var(--np-color-text)]">{day}</p>
            <CalendarDays className="h-4 w-4 text-[var(--np-color-brand)]" />
          </div>
          <div className="space-y-3">
            {tasks
              .filter((task) => (day === "Today" ? task.dueDate.includes("Today") : !task.dueDate.includes("Today")))
              .slice(0, 3)
              .map((task) => (
                <TaskCard
                  compact
                  key={`${day}-${task.id}`}
                  onArchive={onArchive}
                  onComplete={onComplete}
                  onOpenClinicalHub={onOpenClinicalHub}
                  onSnooze={onSnooze}
                  task={task}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskCard({ compact = false, task, onArchive, onComplete, onOpenClinicalHub, onSnooze }) {
  return (
    <article className="rounded-[24px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <PriorityBadge value={task.priority} />
            <StatusBadge value={task.status} />
            <NutriBadge tone={categoryTone(task.category)}>{task.category}</NutriBadge>
          </div>
          <h3 className="text-lg font-extrabold leading-7 text-[var(--np-color-text)]">{task.title}</h3>
          {!compact ? (
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{task.description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onComplete(task.id)} variant="secondary">
            <CheckCircle2 className="h-4 w-4" />
            Mark Complete
          </NutriButton>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onSnooze(task.id)} variant="secondary">
            <TimerReset className="h-4 w-4" />
            Snooze
          </NutriButton>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onArchive(task.id)} variant="ghost">
            <Archive className="h-4 w-4" />
            Archive
          </NutriButton>
          {task.relatedPatient !== "None" ? (
            <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onOpenClinicalHub(task.relatedPatient)} variant="secondary">
              <BriefcaseMedical className="h-4 w-4" />
              Open Clinical Hub
            </NutriButton>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MiniMeta label="Due date" value={task.dueDate} />
            <MiniMeta label="Assigned to" value={task.assignedTo} />
            <MiniMeta label="Related module" value={task.relatedModule} />
            <MiniMeta label="Related patient" value={task.relatedPatient} />
            <MiniMeta label="Research project" value={task.relatedProject} />
            <MiniMeta label="Suggested action" value={task.nextAction} />
          </div>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs font-extrabold text-[var(--np-color-text-muted)]">
              <span>Progress</span>
              <span>{task.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--np-color-surface-muted)]">
              <div className="h-full rounded-full bg-[var(--np-color-brand)]" style={{ width: `${task.progress}%` }} />
            </div>
            <p className="mt-3 text-sm font-bold text-[var(--np-color-text-muted)]">{task.notes}</p>
          </div>
        </>
      ) : null}
    </article>
  );
}

function ClinicalTaskIntelligence() {
  return (
    <SignalPanel icon={BriefcaseMedical} kicker="Rule-based" signals={clinicalSignals} title="Clinical Task Intelligence" />
  );
}

function ResearchTaskIntelligence() {
  return (
    <SignalPanel icon={Beaker} kicker="Research" signals={researchSignals} title="Research Task Intelligence" />
  );
}

function AIReviewQueue() {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={Bot} kicker="Clinician Review" title="AI Review Queue" />
      <div className="space-y-3">
        {aiReviewItems.map(([title, subject, priority]) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4" key={title}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</p>
                <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">{subject}</p>
              </div>
              <PriorityBadge value={priority} />
            </div>
            <NutriButton className="mt-3 w-full" variant="secondary">
              <Bot className="h-4 w-4" />
              Open AI Center
            </NutriButton>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function SignalPanel({ icon, kicker, signals, title }) {
  return (
    <NutriPanel>
      <NutriSectionHeader icon={icon} kicker={kicker} title={title} />
      <div className="space-y-3">
        {signals.map(([label, detail, priority]) => (
          <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4" key={label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-[var(--np-color-text)]">{label}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">{detail}</p>
              </div>
              <PriorityBadge value={priority} />
            </div>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function QuickActions({ onCreate }) {
  const actions = [
    ["Create Task", Plus, onCreate],
    ["Assign Task", UserPlus],
    ["Mark Complete", CheckCircle2],
    ["Snooze", TimerReset],
    ["Archive", Archive],
    ["Open Patient", BriefcaseMedical],
    ["Open Research Project", Beaker],
  ];

  return (
    <NutriPanel>
      <NutriSectionHeader icon={Layers3} kicker="Actions" title="Quick Actions" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {actions.map(([label, Icon, action]) => (
          <NutriButton
            className="min-h-16 justify-start"
            key={label}
            onClick={action}
            variant={label === "Create Task" ? "primary" : "secondary"}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NutriButton>
        ))}
      </div>
    </NutriPanel>
  );
}

function TaskCreationModal({ onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--np-color-overlay)] p-4">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[32px] border border-[var(--np-color-border-soft)] bg-white p-6 shadow-[var(--np-shadow-elevated)]">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--np-color-border-soft)] pb-5">
          <div>
            <p className="np-page-kicker">New Task</p>
            <h2 className="mt-2 text-2xl font-extrabold text-[var(--np-color-text)]">Create Clinical Operations Task</h2>
          </div>
          <button className="np-button np-button-secondary min-h-10 px-3" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="md:col-span-2">
            <span className="np-form-label">Title</span>
            <input className="np-form-control" name="title" placeholder="Review missing follow-up data" required />
          </label>
          <SelectField label="Category" name="category" options={categories.filter((category) => category !== "All")} />
          <SelectField label="Priority" name="priority" options={["Critical", "High", "Medium", "Low"]} />
          <label>
            <span className="np-form-label">Due date</span>
            <input className="np-form-control" name="dueDate" placeholder="Today, 04:00 PM" />
          </label>
          <label>
            <span className="np-form-label">Assigned to</span>
            <input className="np-form-control" name="assignedTo" placeholder="Dr. Shahad" />
          </label>
          <label className="md:col-span-2">
            <span className="np-form-label">Related patient/project</span>
            <input className="np-form-control" name="related" placeholder="Sarah Ahmed or IBS Study" />
          </label>
          <label className="md:col-span-2">
            <span className="np-form-label">Notes</span>
            <textarea className="np-form-control min-h-28" name="notes" placeholder="Add preparation notes or context." />
          </label>
          <div className="flex flex-wrap justify-end gap-3 md:col-span-2">
            <NutriButton onClick={onClose} variant="secondary">
              Cancel
            </NutriButton>
            <NutriButton type="submit">
              <Plus className="h-4 w-4" />
              Create Task
            </NutriButton>
          </div>
        </form>
      </section>
    </div>
  );
}

function SelectField({ label, name, options }) {
  return (
    <label>
      <span className="np-form-label">{label}</span>
      <select className="np-form-control" name={name}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MiniMeta({ label, value }) {
  return (
    <div className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function PriorityBadge({ value }) {
  const tone = {
    Critical: "danger",
    High: "warning",
    Low: "secondary",
    Medium: "info",
  }[value] || "secondary";

  return <NutriBadge tone={tone}>{value}</NutriBadge>;
}

function StatusBadge({ value }) {
  const tone = {
    Archived: "secondary",
    Completed: "success",
    "In Progress": "brand",
    "Not Started": "warning",
    Waiting: "accent",
  }[value] || "secondary";

  return <NutriBadge tone={tone}>{value}</NutriBadge>;
}

function categoryTone(category) {
  return {
    "AI Review": "info",
    Administrative: "secondary",
    Clinical: "brand",
    "Follow-up": "success",
    Innovation: "accent",
    Laboratory: "danger",
    Reports: "warning",
    Research: "accent",
  }[category] || "secondary";
}
