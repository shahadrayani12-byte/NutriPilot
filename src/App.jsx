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
  Utensils,
  X,
} from "lucide-react";

import Dashboard from "./components/Dashboard/ClinicalCommandCenter";
import Patients from "./pages/Patients";
import ClinicalWorkspace from "./pages/ClinicalWorkspace";
import DietPlanBuilder from "./pages/DietPlanBuilder";
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
import { I18nProvider, useTranslation } from "./i18n";

export default function App() {
  return (
    <I18nProvider>
      <AppStateProvider>
        <PatientProvider>
          <AppShell />
        </PatientProvider>
      </AppStateProvider>
    </I18nProvider>
  );
}

function AppShell() {
  const [page, setPage] = useState("dashboard");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [nutriMapInitialSystem, setNutriMapInitialSystem] = useState("");
  const [workspaceInitialTab, setWorkspaceInitialTab] = useState("summary");
  const { language, t, toggleLanguage } = useTranslation();
  const {
    activePatient,
    aiSummary,
    completeWorkflowStep,
    dispatch,
    intelligence,
    notifications,
    patients,
    reports,
    schedule,
    setActivePatient,
    tasks,
    updatePatient,
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

  function openPatientWorkspace(patient, tabId = "summary") {
    const resolvedPatient = resolvePatient(patient);
    setActivePatient(resolvedPatient);
    setWorkspaceInitialTab(tabId);
    setPage("workspace");
    setMobileSidebarOpen(false);
  }

  function navigateToPage(nextPage) {
    setPage(nextPage);
    setMobileSidebarOpen(false);
  }

  function handleGlobalSearchResult(result) {
      if (result.patient) {
      const resolvedPatient = resolvePatient(result.patient);
      setActivePatient(resolvedPatient);
    }

    if (result.page === "workspace") {
      openPatientWorkspace(result.patient || activePatient, result.tabId || "summary");
      return;
    }

    if (result.page === "nutrimap") {
      setNutriMapInitialSystem(result.organId || "");
    }

    setPage(result.page || "dashboard");
    setMobileSidebarOpen(false);
  }

  const globalSearchProps = {
    activePatient,
    onResultSelect: handleGlobalSearchResult,
    patients,
    reports,
    schedule,
    tasks,
  };

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
        { id: "diet-plans", label: "Diet Plans", icon: Utensils },
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
  const localizedPageTitle = getLocalizedPageTitle(page, t);

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
          aria-label={t("topbar.openNavigation")}
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
            <p className="truncate text-sm font-extrabold text-[var(--np-color-brand)]">{t("app.name")}</p>
            <h1 className="truncate text-base font-extrabold text-[var(--np-color-text)]">{renderBrandSafeLabel(localizedPageTitle)}</h1>
          </div>
        </div>
        <LanguageToggle language={language} t={t} toggleLanguage={toggleLanguage} />
      </header>

      <aside className="np-sidebar np-sidebar-desktop">
        <div className="np-sidebar-logo">
          <div className="np-sidebar-logo-mark">
            <Activity className="h-9 w-9" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--np-color-brand)]">{t("app.name")}</h1>
            <p className="text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
              {t("app.tagline")}
            </p>
          </div>
        </div>

        <div className="np-sidebar-scroll">
          <nav className="space-y-4">
            {navSections.map((section) => (
              <div className="np-sidebar-section" key={section.title}>
                <p className="np-sidebar-section-title">
                  {translateSectionTitle(section.title, t)}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <SidebarItem
                      active={page === item.id}
                      badge={item.badge}
                      icon={item.icon}
                      key={item.id}
                  label={translateNavigationLabel(item.label, t)}
                      onClick={() => setPage(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
              <p className="np-sidebar-section-title">
                {t("navigation.dailyWork")}
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
                    label={translateNavigationLabel(label, t)}
                    onClick={() => setPage(id)}
                  />
                ))}
              </div>
            </div>

            <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
              <p className="np-sidebar-section-title">
                {t("navigation.system")}
              </p>
              <div className="space-y-1">
                <SidebarItem
                  active={page === "settings"}
                  icon={Settings}
                  label={t("navigation.settings")}
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
              <p className="text-sm font-extrabold">{t("profile.name")}</p>
              <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{t("profile.role")}</p>
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
            {t("navigation.mobile")}
          </p>
          <button
            aria-label={t("topbar.closeNavigation")}
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
          t={t}
        />
      </aside>

      <main className="np-app-main">
        {page === "dashboard" && (
          <Dashboard
            openClinicalHub={openPatientWorkspace}
            openNutriMap={(systemId = "") => {
              setNutriMapInitialSystem(systemId);
              setPage("nutrimap");
            }}
            activePatient={activePatient}
            globalSearchProps={globalSearchProps}
            intelligence={intelligence}
            onNavigate={setPage}
            openResearch={() => setPage("research")}
            patients={patients}
            reports={reports}
            schedule={schedule}
            setActivePatient={setActivePatient}
            updateAppointment={(appointmentId, updates) => dispatch({ type: "UPDATE_APPOINTMENT", appointmentId, updates })}
            updatePatient={updatePatient}
            workflow={workflow}
          />
        )}

        {page === "workspace" && (
          <ClinicalWorkspace
            globalSearchProps={globalSearchProps}
            initialTab={workspaceInitialTab}
            key={`${activePatient?.id || "patient"}-${workspaceInitialTab}`}
            onCompleteWorkflowStep={completeWorkflowStep}
            onNavigate={setPage}
            patient={activePatient}
            intelligence={intelligence}
            updatePatient={updatePatient}
          />
        )}

        {page === "diet-plans" && (
          <DietPlanBuilder
            activePatient={activePatient}
            onNavigate={setPage}
            updatePatient={updatePatient}
          />
        )}

        {page === "patients" && (
          <Patients
            activePatient={activePatient}
            onNavigate={setPage}
            openWorkspace={openPatientWorkspace}
            setActivePatient={setActivePatient}
            sharedPatients={patients}
            updatePatient={updatePatient}
          />
        )}

        {page === "nutrimap" && (
          <NutriMapWorkspace
            activePatient={activePatient}
            initialSystemId={nutriMapInitialSystem}
            key={`${activePatient?.id || "patient"}-${nutriMapInitialSystem || "brain"}`}
            onNavigate={setPage}
            onOpenClinicalHub={openPatientWorkspace}
            intelligence={intelligence}
            updatePatient={updatePatient}
            workflow={workflow}
          />
        )}

        {page === "settings" && <SettingsCenter />}

        {page === "research" && <ResearchCenter />}

        {page === "ai" && (
          <AICenter
            aiSummary={aiSummary}
            activePatient={activePatient}
            intelligence={intelligence}
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
            sharedPatients={patients}
            updateReport={(reportId, updates) => dispatch({ type: "UPDATE_REPORT", reportId, updates })}
            onOpenClinicalHub={openPatientWorkspace}
            setActivePatient={setActivePatient}
          />
        )}

        {page === "messages" && (
          <InboxCenter
            activePatient={activePatient}
            notificationsState={notifications}
            intelligence={intelligence}
            onArchiveNotification={(notificationId) => dispatch({ type: "ARCHIVE_NOTIFICATION", notificationId })}
            onOpenClinicalHub={openPatientWorkspace}
          />
        )}

        {page === "appointments" && (
          <ScheduleCenter
            activePatient={activePatient}
            onOpenClinicalHub={openPatientWorkspace}
            scheduleState={schedule}
            sharedPatients={patients}
            setActivePatient={setActivePatient}
          />
        )}

        {page === "tasks" && (
          <TaskCommandCenter
            addSharedTask={(task) => dispatch({ type: "ADD_TASK", task })}
            activePatient={activePatient}
            onOpenClinicalHub={openPatientWorkspace}
            sharedPatients={patients}
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

function MobileSidebar({ navSections, page, setPage, t }) {
  return (
    <>
      <div className="np-sidebar-logo">
        <div className="np-sidebar-logo-mark">
          <Activity className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--np-color-brand)]">{t("app.name")}</h1>
          <p className="text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
            {t("app.tagline")}
          </p>
        </div>
      </div>

      <div className="np-sidebar-scroll">
        <nav className="space-y-4">
          {navSections.map((section) => (
            <div className="np-sidebar-section" key={section.title}>
              <p className="np-sidebar-section-title">{translateSectionTitle(section.title, t)}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    active={page === item.id}
                    badge={item.badge}
                    icon={item.icon}
                    key={item.id}
                    label={translateNavigationLabel(item.label, t)}
                    onClick={() => setPage(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
            <p className="np-sidebar-section-title">{t("navigation.dailyWork")}</p>
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
                  label={translateNavigationLabel(label, t)}
                  onClick={() => setPage(id)}
                />
              ))}
            </div>
          </div>

          <div className="np-sidebar-section border-t border-[var(--np-color-border-soft)] pt-4">
            <p className="np-sidebar-section-title">{t("navigation.system")}</p>
            <div className="space-y-1">
              <SidebarItem
                active={page === "settings"}
                icon={Settings}
                label={t("navigation.settings")}
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
            <p className="text-sm font-extrabold">{t("profile.name")}</p>
            <p className="text-xs font-bold text-[var(--np-color-text-muted)]">{t("profile.role")}</p>
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
    "diet-plans": "Diet Plans",
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

function getLocalizedPageTitle(page, t) {
  return translateNavigationLabel(getPageTitle(page), t);
}

function translateSectionTitle(title, t) {
  const sectionKeys = {
    Clinical: "navigation.clinical",
    Intelligence: "navigation.intelligence",
    Main: "navigation.main",
    Research: "navigation.research",
  };

  return t(sectionKeys[title] || "navigation.main");
}

function translateNavigationLabel(label, t) {
  const labelKeys = {
    "AI Center": "navigation.aiCenter",
    "Clinical Hub": "navigation.clinicalHub",
    "Command Center": "navigation.commandCenter",
    "Diet Plans": "navigation.dietPlans",
    Inbox: "navigation.inbox",
    NutriMap: "navigation.nutrimap",
    "NutriMap™": "navigation.nutrimap",
    Patients: "navigation.patients",
    Reports: "navigation.reports",
    "Research Center": "navigation.researchCenter",
    "Schedule Center": "navigation.scheduleCenter",
    Settings: "navigation.settings",
    "Task Center": "navigation.taskCenter",
  };

  return t(labelKeys[label] || "app.name");
}

function LanguageToggle({ language, t, toggleLanguage }) {
  return (
    <button
      className="np-button np-button-secondary min-h-10 px-3 text-xs"
      onClick={toggleLanguage}
      title={t("language.switchTo")}
      type="button"
    >
      {language === "ar" ? "EN" : "ع"}
    </button>
  );
}

function SidebarItem({ active, badge, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`np-sidebar-item ${active ? "np-sidebar-item-active" : ""}`}
    >
      <span className="flex items-center gap-3">
        <Icon className="np-sidebar-icon" strokeWidth={2} />
        {renderBrandSafeLabel(label)}
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

function renderBrandSafeLabel(label) {
  if (typeof label === "string" && label.includes("NutriMap")) {
    return <bdi dir="ltr">{displayTrademark(label)}</bdi>;
  }

  return label;
}

function displayTrademark(label) {
  const trademark = String.fromCharCode(0x2122);
  return label.replace("NutriMap", `NutriMap${trademark}`).replaceAll(`${trademark}${trademark}`, trademark);
}





