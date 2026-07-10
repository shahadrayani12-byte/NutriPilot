import { useMemo, useState } from "react";
import {
  Archive,
  Bell,
  Bot,
  CheckCheck,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Inbox,
  Pin,
  Search,
  ShieldCheck,
  Stethoscope,
  UsersRound,
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
import { generatePatientNotifications } from "../utils/workflowStatus";

const categories = [
  "All",
  "Patient Messages",
  "Team Communication",
  "AI Notifications",
  "Research Notifications",
  "Reports Notifications",
  "System Notifications",
];

const inboxItems = [
  {
    id: "patient-1",
    category: "Patient Messages",
    title: "Sarah Ahmed sent a secure intake update",
    description: "Patient reports reduced appetite and asked whether the follow-up plan should be adjusted.",
    time: "08:20 AM",
    priority: "High",
    unread: true,
    pinned: true,
    source: "Secure patient portal",
    icon: Stethoscope,
  },
  {
    id: "team-1",
    category: "Team Communication",
    title: "Physician review requested for CKD nutrition plan",
    description: "Dr. Khalid requested dietitian review before the next nephrology round.",
    time: "09:05 AM",
    priority: "Medium",
    unread: true,
    pinned: false,
    source: "Clinical team",
    icon: UsersRound,
  },
  {
    id: "ai-1",
    category: "AI Notifications",
    title: "High nutrition risk detected",
    description: "Rule-based review flagged low ferritin, poor intake, and missing weight history.",
    time: "09:40 AM",
    priority: "High",
    unread: true,
    pinned: true,
    source: "AI safety engine",
    icon: Bot,
  },
  {
    id: "ai-2",
    category: "AI Notifications",
    title: "Missing laboratory data",
    description: "Ferritin and albumin values are missing for one active patient assessment.",
    time: "10:10 AM",
    priority: "Medium",
    unread: false,
    pinned: false,
    source: "AI data checker",
    icon: FlaskConical,
  },
  {
    id: "research-1",
    category: "Research Notifications",
    title: "Ethics approval update",
    description: "IRB status changed to pending final document confirmation for the oral-gut axis study.",
    time: "Yesterday",
    priority: "Medium",
    unread: true,
    pinned: false,
    source: "Research Center",
    icon: ClipboardCheck,
  },
  {
    id: "research-2",
    category: "Research Notifications",
    title: "Recruitment milestone reached",
    description: "Participant recruitment reached 73 enrolled cases with updated dataset quality indicators.",
    time: "Yesterday",
    priority: "Low",
    unread: false,
    pinned: false,
    source: "Research operations",
    icon: UsersRound,
  },
  {
    id: "reports-1",
    category: "Reports Notifications",
    title: "Clinical nutrition PDF generated",
    description: "Full clinical nutrition report is ready for clinician review and export.",
    time: "2 days ago",
    priority: "Low",
    unread: false,
    pinned: false,
    source: "Reports Center",
    icon: FileText,
  },
  {
    id: "system-1",
    category: "System Notifications",
    title: "Backup completed",
    description: "Local data backup placeholder completed successfully. Backend sync is not connected yet.",
    time: "2 days ago",
    priority: "Low",
    unread: false,
    pinned: false,
    source: "System",
    icon: ShieldCheck,
  },
  {
    id: "system-2",
    category: "System Notifications",
    title: "New version available",
    description: "NutriPilot update placeholder is available for future deployment workflow.",
    time: "3 days ago",
    priority: "Medium",
    unread: true,
    pinned: false,
    source: "System",
    icon: Bell,
  },
];

export default function InboxCenter({
  activePatient,
  notificationsState,
  onArchiveNotification,
  onOpenClinicalHub,
}) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(inboxItems);

  const activePatientItems = useMemo(
    () =>
      notificationsState?.length
        ? notificationsState.map((item, index) => ({
            ...item,
            id: item.id || `state-notification-${index}`,
            icon: item.category === "Reports Notifications" ? FileText : item.category === "Patient Messages" ? Stethoscope : item.category === "AI Notifications" ? Bot : Bell,
            pinned: item.pinned || index === 0,
            source: item.source || "Shared application state",
            time: item.time || "Now",
            unread: item.unread ?? true,
          }))
        : activePatient
          ? generatePatientNotifications(activePatient).map((item, index) => ({
              ...item,
              id: `active-${activePatient.id}-${index}`,
            icon: item.category === "Reports Notifications" ? FileText : item.category === "Patient Messages" ? Stethoscope : Bot,
            pinned: index === 0,
            source: "Active patient workflow",
            time: "Now",
              unread: true,
            }))
          : [],
    [activePatient, notificationsState],
  );
  const allItems = useMemo(() => [...activePatientItems, ...items], [activePatientItems, items]);

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return allItems
      .filter((item) => activeCategory === "All" || item.category === activeCategory)
      .filter((item) => {
        if (!normalizedSearch) {
          return true;
        }

        return [item.title, item.description, item.category, item.source]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((first, second) => Number(second.pinned) - Number(first.pinned));
  }, [activeCategory, allItems, searchTerm]);

  const unreadCount = allItems.filter((item) => item.unread).length;
  const pinnedCount = allItems.filter((item) => item.pinned).length;
  const highPriorityCount = allItems.filter((item) => item.priority === "High").length;

  function updateItem(itemId, updater) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === itemId ? updater(item) : item)),
    );
  }

  function markAsRead(itemId) {
    updateItem(itemId, (item) => ({ ...item, unread: false }));
  }

  function togglePin(itemId) {
    updateItem(itemId, (item) => ({ ...item, pinned: !item.pinned }));
  }

  function archiveItem(itemId) {
    onArchiveNotification?.(itemId);
    setItems((currentItems) => currentItems.filter((item) => item.id !== itemId));
  }

  return (
    <NutriPage>
      <NutriPageMain>
        <NutriPageHeader
          kicker="Communication Hub"
          title="Inbox"
          subtitle="A unified clinical notification center for patient messages, team updates, AI alerts, research activity, reports, and system events."
          actions={
            <>
              <NutriBadge tone="brand">{unreadCount} unread</NutriBadge>
              <NutriBadge tone="warning">{highPriorityCount} high priority</NutriBadge>
              <NutriBadge tone="secondary">{pinnedCount} pinned</NutriBadge>
            </>
          }
        />

        <ActivePatientBanner
          patient={activePatient}
          onOpenClinicalHub={() => onOpenClinicalHub(activePatient)}
        />

        <section className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <NutriPanel>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-xl">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-[var(--np-color-text-soft)]" />
                <input
                  className="np-search-field px-12"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search patient messages, AI alerts, reports..."
                  value={searchTerm}
                />
              </div>

              <div className="flex flex-wrap gap-2">
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
            </div>
          </NutriPanel>

          <NutriPanel>
            <div className="flex items-center gap-3">
              <span className="np-icon-tile">
                <Inbox className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
                  Today
                </p>
                <h2 className="text-xl font-extrabold text-[var(--np-color-text)]">
                  {allItems.length} active updates
                </h2>
              </div>
            </div>
          </NutriPanel>
        </section>

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[280px_minmax(0,1fr)]">
          <InboxSummary items={allItems} />

          <NutriPanel>
            <NutriSectionHeader
              icon={Bell}
              kicker="Timeline"
              title="Priority Communication Stream"
              action={<NutriBadge tone="accent">{visibleItems.length} shown</NutriBadge>}
            />

            {visibleItems.length ? (
              <div className="relative space-y-4">
                <div className="absolute left-6 top-2 hidden h-[calc(100%-1rem)] w-px bg-[var(--np-color-border-soft)] md:block" />
                {visibleItems.map((item) => (
                  <InboxItem
                    item={item}
                    key={item.id}
                    onArchive={archiveItem}
                    onMarkAsRead={markAsRead}
                    onOpenClinicalHub={() => onOpenClinicalHub(activePatient)}
                    onTogglePin={togglePin}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[24px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-8 text-center">
                <p className="text-lg font-extrabold text-[var(--np-color-text)]">
                  No notifications found
                </p>
                <p className="mt-2 text-sm font-bold text-[var(--np-color-text-muted)]">
                  Try another category or search term.
                </p>
              </div>
            )}
          </NutriPanel>
        </section>
      </NutriPageMain>
    </NutriPage>
  );
}

function InboxSummary({ items }) {
  const summary = categories
    .filter((category) => category !== "All")
    .map((category) => ({
      category,
      count: items.filter((item) => item.category === category).length,
      unread: items.filter((item) => item.category === category && item.unread).length,
    }));

  return (
    <NutriPanel className="2xl:sticky 2xl:top-6 2xl:self-start">
      <NutriSectionHeader icon={Inbox} kicker="Sections" title="Inbox Sources" />
      <div className="space-y-3">
        {summary.map((item) => (
          <div
            className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4"
            key={item.category}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-[var(--np-color-text)]">
                {item.category}
              </p>
              <NutriBadge tone={item.unread ? "brand" : "secondary"}>
                {item.unread} unread
              </NutriBadge>
            </div>
            <p className="mt-2 text-xs font-bold text-[var(--np-color-text-muted)]">
              {item.count} total updates
            </p>
          </div>
        ))}
      </div>
    </NutriPanel>
  );
}

function InboxItem({ item, onArchive, onMarkAsRead, onOpenClinicalHub, onTogglePin }) {
  const Icon = item.icon;

  return (
    <article className="relative md:pl-16">
      <div className="absolute left-0 top-5 z-10 hidden h-12 w-12 items-center justify-center rounded-full border border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-brand)] shadow-[var(--np-shadow-sm)] md:flex">
        <Icon className="h-5 w-5" />
      </div>

      <div
        className={`rounded-[26px] border p-5 shadow-[var(--np-shadow-sm)] transition hover:-translate-y-0.5 hover:shadow-[var(--np-shadow-card)] ${
          item.unread
            ? "border-[rgb(122_31_43_/_0.22)] bg-white"
            : "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)]"
        }`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <NutriBadge tone={categoryTone(item.category)}>{item.category}</NutriBadge>
              <NutriBadge tone={priorityTone(item.priority)}>{item.priority} priority</NutriBadge>
              {item.unread ? <NutriBadge tone="brand">Unread</NutriBadge> : null}
              {item.pinned ? <NutriBadge tone="accent">Pinned</NutriBadge> : null}
            </div>

            <h3 className="text-xl font-extrabold leading-7 text-[var(--np-color-text)]">
              {item.title}
            </h3>
            <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
              {item.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 text-xs font-extrabold text-[var(--np-color-text-muted)]">
              <span>{item.source}</span>
              <span>•</span>
              <span>{item.time}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <NutriButton
              className="min-h-10 px-3 text-xs"
              onClick={() => onMarkAsRead(item.id)}
              variant="secondary"
            >
              <CheckCheck className="h-4 w-4" />
              Mark read
            </NutriButton>
            <NutriButton
              className="min-h-10 px-3 text-xs"
              onClick={() => onTogglePin(item.id)}
              variant="secondary"
            >
              <Pin className="h-4 w-4" />
              {item.pinned ? "Unpin" : "Pin"}
            </NutriButton>
            <NutriButton
              className="min-h-10 px-3 text-xs"
              onClick={() => onArchive(item.id)}
              variant="ghost"
            >
              <Archive className="h-4 w-4" />
              Archive
            </NutriButton>
            {["Patient Messages", "AI Notifications", "Reports Notifications"].includes(item.category) ? (
              <NutriButton
                className="min-h-10 px-3 text-xs"
                onClick={onOpenClinicalHub}
                variant="secondary"
              >
                <Stethoscope className="h-4 w-4" />
                Open Clinical Hub
              </NutriButton>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function categoryTone(category) {
  return {
    "AI Notifications": "brand",
    "Patient Messages": "danger",
    "Reports Notifications": "info",
    "Research Notifications": "accent",
    "System Notifications": "secondary",
    "Team Communication": "success",
  }[category] || "secondary";
}

function priorityTone(priority) {
  return {
    High: "danger",
    Low: "secondary",
    Medium: "warning",
  }[priority] || "secondary";
}
