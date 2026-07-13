import { workspaceTabs } from "./clinicalData";

export function ClinicalWorkspaceTabs({ activeTab, hasUnsavedChanges = false, setActiveTab }) {
  return (
    <aside className="rounded-[28px] border border-[var(--np-color-border-soft)] bg-white p-3 shadow-[var(--np-shadow-card)] xl:sticky xl:top-7 xl:self-start">
      <div className="mb-3 px-3 py-2">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--np-color-brand)]">
          Clinical Modules
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
          Nutrition care workflow
        </p>
      </div>
      <nav className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-12 items-center gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-extrabold transition ${
                isActive
                  ? "bg-[var(--np-color-brand)] text-white shadow-[var(--np-shadow-sm)]"
                  : "text-[var(--np-color-text-muted)] hover:bg-[var(--np-color-brand-soft)] hover:text-[var(--np-color-brand)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{tab.label}</span>
              {isActive && hasUnsavedChanges ? (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--np-color-accent)]" aria-label="Unsaved changes" />
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}




