import {
  Bell,
  Database,
  Download,
  FileUp,
  Info,
  KeyRound,
  Languages,
  Lock,
  Palette,
  RotateCcw,
  ShieldCheck,
  Upload,
  UserRound,
} from "lucide-react";

import {
  NutriBadge,
  NutriInput,
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
  NutriPanel,
  NutriSectionHeader,
} from "../components/common/NutriPilotPrimitives";

const profileFields = [
  ["Name", "Dr. Shahad"],
  ["Role", "Clinical Nutritionist"],
  ["Hospital", "Jazan University Hospital"],
];

const notificationSettings = [
  ["Follow-up reminders", "Enabled"],
  ["AI notifications", "Enabled"],
  ["Report notifications", "Weekly"],
];

const themeColors = [
  ["Deep Burgundy", "var(--np-color-brand)"],
  ["Soft Medical Teal", "var(--np-color-secondary)"],
  ["Muted Gold", "var(--np-color-accent)"],
  ["Warm White", "var(--np-color-surface-page)"],
];

export default function SettingsCenter() {
  return (
    <NutriPage>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">Local settings</NutriBadge>
              <NutriBadge tone="secondary">No backend connected</NutriBadge>
            </>
          }
          kicker="System"
          subtitle="Manage NutriPilot profile preferences, display settings, notifications, data utilities, and security placeholders."
          title="Settings Center"
        />

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <NutriPanel>
              <NutriSectionHeader icon={UserRound} kicker="Account" title="Profile" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {profileFields.map(([label, value]) => (
                  <NutriInput defaultValue={value} key={label} label={label} />
                ))}
                <label className="block">
                  <span className="np-form-label">Language</span>
                  <select className="np-form-control default-select" defaultValue="English">
                    <option>English</option>
                    <option>Arabic</option>
                  </select>
                </label>
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Palette} kicker="Interface" title="Appearance" />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold text-[var(--np-color-text)]">
                        Light Mode
                      </p>
                      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                        Current default interface mode.
                      </p>
                    </div>
                    <span className="np-badge np-badge-success">Active</span>
                  </div>
                  <div className="mt-4">
                    <label className="np-form-label">Font Size</label>
                    <select className="np-form-control" defaultValue="Comfortable">
                      <option>Compact</option>
                      <option>Comfortable</option>
                      <option>Large</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4">
                  <p className="text-sm font-extrabold text-[var(--np-color-text)]">
                    Theme Colors
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {themeColors.map(([label, color]) => (
                      <div
                        className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3"
                        key={label}
                      >
                        <span
                          className="block h-8 rounded-[12px] border border-white shadow-[var(--np-shadow-sm)]"
                          style={{ background: color }}
                        />
                        <p className="mt-2 text-xs font-extrabold text-[var(--np-color-text)]">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Bell} kicker="Alerts" title="Notifications" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {notificationSettings.map(([label, status]) => (
                  <SettingStatusCard key={label} label={label} status={status} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Database} kicker="Utilities" title="Data" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <DataAction icon={Download} label="Backup" />
                <DataAction icon={RotateCcw} label="Restore" />
                <DataAction icon={FileUp} label="Export" />
                <DataAction icon={Upload} label="Import" />
              </div>
            </NutriPanel>
          </div>

          <aside className="space-y-5">
            <NutriPanel>
              <NutriSectionHeader icon={ShieldCheck} kicker="Access" title="Security" />
              <div className="space-y-3">
                <button className="np-button np-button-secondary w-full justify-start" type="button">
                  <KeyRound className="h-4 w-4" />
                  Change password
                </button>
                <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-[var(--np-color-text)]">
                    <Lock className="h-4 w-4 text-[var(--np-color-brand)]" />
                    Session information
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                    Current session is local to this browser. Authentication and
                    audit tracking will be connected later.
                  </p>
                </div>
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Info} kicker="Product" title="About NutriPilot" />
              <div className="space-y-3">
                <InfoRow label="Version" value="0.0.0" />
                <InfoRow label="Build" value="Local Vite build" />
                <InfoRow label="Credits" value="Clinical Nutrition Intelligence" />
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Languages} kicker="Future" title="Localization" />
              <p className="text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                Arabic and English clinical workflows are prepared in the design
                system and can be expanded when product localization is connected.
              </p>
            </NutriPanel>
          </aside>
        </section>
      </NutriPageMain>
    </NutriPage>
  );
}

function SettingStatusCard({ label, status }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <p className="text-sm font-extrabold text-[var(--np-color-text)]">{label}</p>
      <p className="mt-3 text-xs font-bold text-[var(--np-color-text-muted)]">
        Notification preference
      </p>
      <span className="np-badge np-badge-brand mt-3">{status}</span>
    </article>
  );
}

function DataAction({ icon: Icon, label }) {
  return (
    <button
      className="flex min-h-[92px] flex-col items-start justify-between rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4 text-left transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]"
      type="button"
    >
      <Icon className="h-5 w-5 text-[var(--np-color-brand)]" />
      <span className="text-sm font-extrabold text-[var(--np-color-text)]">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <span className="text-sm font-bold text-[var(--np-color-text-muted)]">{label}</span>
      <span className="text-right text-sm font-extrabold text-[var(--np-color-text)]">{value}</span>
    </div>
  );
}
