import { useEffect, useState } from "react";
import {
  Activity,
  LayoutDashboard,
  Users,
  Bot,
  FileText,
  Settings,
  BriefcaseMedical,
  CalendarDays,
  CheckSquare,
  MessageCircle,
  Microscope,
  Menu,
  X,
} from "lucide-react";

import Dashboard from "./components/Dashboard/ClinicalCommandCenter";
import Patients from "./pages/Patients";
import ClinicalWorkspace from "./pages/ClinicalWorkspace";
import NutriMapWorkspace from "./pages/NutriMapWorkspace";
import SettingsCenter from "./pages/SettingsCenter";
import ResearchCenter from "./pages/ResearchCenter";
import AICenter from "./pages/AICenter";
import ReportsCenter from "./pages/ReportsCenter";
import InboxCenter from "./pages/InboxCenter";
import ScheduleCenter from "./pages/ScheduleCenter";
import TaskCommandCenter from "./pages/TaskCommandCenter";
import { AppStateProvider } from "./context/AppStateProvider";
import { PatientProvider } from "./context/PatientContext";
import { useAppState } from "./context/useAppState";

export default function App() {
  return (
    <AppStateProvider>
      <PatientProvider>
        <AppShell />
      </PatientProvider>
    </AppStateProvider>
  );
}

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [workspacePatient, setWorkspacePatient] = useState(null);
  const {
    activePatient,
    aiSummary,
    completeWorkflowStep,
    dispatch,
    notifications,
    patients,
    reports,
    schedule,
    setActivePatient,
    tasks,
    workflow,
  } = useAppState();

  function resolvePatient(patient) {
    return patients.find(
      (item) =>
        item.id === patient?.id ||
        item.fullName === patient?.fullName ||
        item.fullName === patient?.name,
    ) || activePatient;
  }

  function openPatientWorkspace(patient) {
    const resolvedPatient = resolvePatient(patient);
    setActivePatient(resolvedPatient);
    setWorkspacePatient(resolvedPatient);
    setPage("workspace");
    setMobileSidebarOpen(false);
  }

  function navigateToPage(nextPage) {
    setPage(nextPage);
    setMobileSidebarOpen(false);
  }

  const navSections = [
    {
      title: "Main",
      items: [
        { id: "dashboard", label: "Command Center", icon: LayoutDashboard },
        { id: "patients", label: "Patients", icon: Users },
      ],
    },
    {
      title: "Clinical",
      items: [
        { id: "workspace", label: "Clinical Hub", icon: BriefcaseMedical },
        { id: "nutrimap", label: "NutriMap™", icon: Activity },
        { id: "reports", label: "Reports", icon: FileText },
      ],
    },
    {
      title: "Intelligence",
      items: [
        { id: "ai", label: "AI Center", icon: Bot },
      ],
    },
    {
      title: "Research",
      items: [
        { id: "research", label: "Research Center", icon: Microscope },
      ],
    },
  ];
  const pageTitle = getPageTitle(page);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--np-color-surface-page)] font-[var(--np-font-family-sans)] text-[var(--np-color-text)]">
      <header className="np-mobile-header">
        <button
          aria-label="Open navigation menu"
          className="np-mobile-menu-button"
          onClick={() => setMobileSidebarOpen(true)}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 items-center gap-3">
          <span className="np-mobile-brand-mark">
            <Activity className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[var(--np-color-brand)]">NutriPilot</p>
            <h1 className="truncate text-base font-extrabold text-[var(--np-color-text)]">{pageTitle}</h1>
          </div>
        </div>
      </header>

      <aside className="np-sidebar np-sidebar-desktop">
        <div className="np-sidebar-logo">
          <div className="np-sidebar-logo-mark">
            <Activity className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--np-color-brand)]">NutriPilot</h1>
            <p className="text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
              Clinical Nutrition<br />Intelligence
            </p>
          </div>
        </div>

        <div className="np-sidebar-scroll">
          <nav className="space-y-4">
            {navSections.map((section) => (
              <div className="np-sidebar-section" key={section.title}>
                <p className="np-sidebar-section-title">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarItem
                      active={page === item.id}
                      badge={item.badge}
                      icon={item.icon}
                      key={item.id}
                      label={item.label}
                      onClick={() => setPage(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
              <p className="np-sidebar-section-title">
                Daily Work
              </p>
              <div className="space-y-1">
                {[
                  ["appointments", "Schedule Center", CalendarDays],
                  ["tasks", "Task Center", CheckSquare],
                  ["messages", "Inbox", MessageCircle],
                ].map(([id, label, Icon, badge]) => (
                  <SidebarItem
                    active={page === id}
                    badge={badge}
                    icon={Icon}
                    key={id}
                    label={label}
                    onClick={() => setPage(id)}
                  />
                ))}
              </div>
            </div>

            <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
              <p className="np-sidebar-section-title">
                System
              </p>
              <div className="space-y-1">
                <SidebarItem
                  active={page === "settings"}
                  icon={Settings}
                  label="Settings"
                  onClick={() => setPage("settings")}
                />
              </div>
            </div>
          </nav>
        </div>

        <div className="mt-auto border-t border-[var(--np-color-border-soft)] pt-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--np-color-brand)] text-sm font-extrabold text-white">
              S
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold">Dr. Shahad</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]">Clinical Nutritionist</p>
            </div>
          </div>
        </div>
      </aside>

      <div
        aria-hidden={!mobileSidebarOpen}
        className={`np-mobile-sidebar-overlay ${mobileSidebarOpen ? "np-mobile-sidebar-overlay-open" : ""}`}
        onClick={() => setMobileSidebarOpen(false)}
      />
      <aside
        aria-label="Mobile navigation"
        className={`np-sidebar np-sidebar-mobile ${mobileSidebarOpen ? "np-sidebar-mobile-open" : ""}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
            Navigation
          </p>
          <button
            aria-label="Close navigation menu"
            className="np-mobile-menu-button"
            onClick={() => setMobileSidebarOpen(false)}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <MobileSidebar
          navSections={navSections}
          page={page}
          setPage={navigateToPage}
        />
      </aside>

      <main className="np-app-main">
        {page === "dashboard" && (
          <Dashboard
            openClinicalHub={openPatientWorkspace}
            openNutriMap={() => setPage("nutrimap")}
            activePatient={activePatient}
            openResearch={() => setPage("research")}
            setActivePatient={setActivePatient}
            workflow={workflow}
          />
        )}

        {page === "workspace" && (
          <ClinicalWorkspace
            onCompleteWorkflowStep={completeWorkflowStep}
            onNavigate={setPage}
            patient={workspacePatient || activePatient}
          />
        )}

        {page === "patients" && (
          <Patients
            activePatient={activePatient}
            onNavigate={setPage}
            openWorkspace={openPatientWorkspace}
            setActivePatient={setActivePatient}
            sharedPatients={patients}
          />
        )}

        {page === "nutrimap" && (
          <NutriMapWorkspace
            activePatient={activePatient}
            onNavigate={setPage}
            onOpenClinicalHub={openPatientWorkspace}
            workflow={workflow}
          />
        )}

        {page === "settings" && <SettingsCenter />}

        {page === "research" && <ResearchCenter />}

        {page === "ai" && (
          <AICenter
            aiSummary={aiSummary}
            activePatient={activePatient}
            onOpenClinicalHub={openPatientWorkspace}
            workflow={workflow}
          />
        )}

        {page === "knowledge" && (
          <PlaceholderCenter
            kicker="Knowledge"
            title="Knowledge Center"
            subtitle="A future evidence and clinical learning workspace for NutriPilot."
          />
        )}

        {page === "reports" && (
          <ReportsCenter
            activePatient={activePatient}
            completeWorkflowStep={completeWorkflowStep}
            reportsState={reports}
            updateReport={(reportId, updates) => dispatch({ type: "UPDATE_REPORT", reportId, updates })}
            onOpenClinicalHub={openPatientWorkspace}
            setActivePatient={setActivePatient}
          />
        )}

        {page === "messages" && (
          <InboxCenter
            activePatient={activePatient}
            notificationsState={notifications}
            onArchiveNotification={(notificationId) => dispatch({ type: "ARCHIVE_NOTIFICATION", notificationId })}
            onOpenClinicalHub={openPatientWorkspace}
          />
        )}

        {page === "appointments" && (
          <ScheduleCenter
            activePatient={activePatient}
            onOpenClinicalHub={openPatientWorkspace}
            scheduleState={schedule}
            setActivePatient={setActivePatient}
          />
        )}

        {page === "tasks" && (
          <TaskCommandCenter
            addSharedTask={(task) => dispatch({ type: "ADD_TASK", task })}
            activePatient={activePatient}
            onOpenClinicalHub={openPatientWorkspace}
            sharedTasks={tasks}
            updateSharedTask={(taskId, updates) => dispatch({ type: "UPDATE_TASK", taskId, updates })}
          />
        )}

        {page === "innovation" && (
          <PlaceholderCenter
            kicker="Research"
            title="Innovation Lab"
            subtitle="A future experimental workspace for prototypes, pilots, and clinical nutrition product ideas."
          />
        )}
      </main>
    </div>
  );
}

function MobileSidebar({ navSections, page, setPage }) {
  return (
    <>
      <div className="np-sidebar-logo">
        <div className="np-sidebar-logo-mark">
          <Activity className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--np-color-brand)]">NutriPilot</h1>
          <p className="text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
            Clinical Nutrition<br />Intelligence
          </p>
        </div>
      </div>

      <div className="np-sidebar-scroll">
        <nav className="space-y-4">
          {navSections.map((section) => (
            <div className="np-sidebar-section" key={section.title}>
              <p className="np-sidebar-section-title">{section.title}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    active={page === item.id}
                    badge={item.badge}
                    icon={item.icon}
                    key={item.id}
                    label={item.label}
                    onClick={() => setPage(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
            <p className="np-sidebar-section-title">Daily Work</p>
            <div className="space-y-1">
              {[
                ["appointments", "Schedule Center", CalendarDays],
                ["tasks", "Task Center", CheckSquare],
                ["messages", "Inbox", MessageCircle],
              ].map(([id, label, Icon, badge]) => (
                <SidebarItem
                  active={page === id}
                  badge={badge}
                  icon={Icon}
                  key={id}
                  label={label}
                  onClick={() => setPage(id)}
                />
              ))}
            </div>
          </div>

          <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
            <p className="np-sidebar-section-title">System</p>
            <div className="space-y-1">
              <SidebarItem
                active={page === "settings"}
                icon={Settings}
                label="Settings"
                onClick={() => setPage("settings")}
              />
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto border-t border-[var(--np-color-border-soft)] pt-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--np-color-brand)] text-sm font-extrabold text-white">
            S
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold">Dr. Shahad</p>
            <p className="text-xs font-bold text-[var(--np-color-text-muted)]">Clinical Nutritionist</p>
          </div>
        </div>
      </div>
    </>
  );
}

function getPageTitle(page) {
  const titles = {
    ai: "AI Center",
    appointments: "Schedule Center",
    dashboard: "Command Center",
    messages: "Inbox",
    nutrimap: "NutriMap",
    patients: "Patients",
    reports: "Reports",
    research: "Research Center",
    settings: "Settings",
    tasks: "Task Center",
    workspace: "Clinical Hub",
  };

  return titles[page] || "NutriPilot";
}

function SidebarItem({ active, badge, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`np-sidebar-item ${active ? "np-sidebar-item-active" : ""}`}
    >
      <span className="flex items-center gap-3">
        <Icon className="np-sidebar-icon" strokeWidth={2} />
        {label}
      </span>
      {badge ? (
        <span
          className={
            badge === "NEW"
              ? "rounded-full border border-[var(--np-color-brand)] px-2 py-0.5 text-[10px] font-extrabold text-[var(--np-color-brand)]"
              : "flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--np-color-brand)] px-1 text-[10px] font-extrabold text-white"
          }
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function PlaceholderCenter({ kicker, subtitle, title }) {
  return (
    <div className="np-page">
      <main className="np-page-main">
        <header className="np-page-header">
          <div>
            <p className="np-page-kicker">{kicker}</p>
            <h1 className="np-page-title">{title}</h1>
            <p className="np-page-subtitle">{subtitle}</p>
          </div>
        </header>
        <section className="np-panel">
          <p className="text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
            This navigation destination is reserved for a future NutriPilot module.
          </p>
        </section>
      </main>
    </div>
  );
}





