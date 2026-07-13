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
import { useTranslation } from "../i18n";

export default function SettingsCenter() {
  const { language, setLanguage, t } = useTranslation();
  const profileFields = [
    [t("settings.name"), t("profile.name")],
    [t("settings.role"), t("profile.role")],
    [t("settings.hospital"), "Jazan University Hospital"],
  ];
  const notificationSettings = [
    [t("settings.followUpReminders"), t("settings.enabled")],
    [t("settings.aiNotifications"), t("settings.enabled")],
    [t("settings.reportNotifications"), t("settings.weekly")],
  ];
  const themeColors = [
    [t("settings.deepBurgundy"), "var(--np-color-brand)"],
    [t("settings.softTeal"), "var(--np-color-secondary)"],
    [t("settings.mutedGold"), "var(--np-color-accent)"],
    [t("settings.warmWhite"), "var(--np-color-surface-page)"],
  ];

  return (
    <NutriPage>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">{t("settings.local")}</NutriBadge>
              <NutriBadge tone="secondary">{t("settings.noBackend")}</NutriBadge>
            </>
          }
          kicker={t("settings.kicker")}
          subtitle={t("settings.subtitle")}
          title={t("settings.title")}
        />

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5">
            <NutriPanel>
              <NutriSectionHeader icon={UserRound} kicker={t("settings.account")} title={t("settings.profile")} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {profileFields.map(([label, value]) => (
                  <NutriInput defaultValue={value} key={label} label={label} />
                ))}
                <label className="block">
                  <span className="np-form-label">{t("settings.language")}</span>
                  <select
                    className="np-form-control default-select"
                    onChange={(event) => setLanguage(event.target.value)}
                    value={language}
                  >
                    <option value="en">{t("language.english")}</option>
                    <option value="ar">{t("language.arabic")}</option>
                  </select>
                </label>
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Palette} kicker={t("settings.interface")} title={t("settings.appearance")} />
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold text-[var(--np-color-text)]">
                        {t("settings.lightMode")}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-muted)]">
                        {t("settings.lightModeNote")}
                      </p>
                    </div>
                    <span className="np-badge np-badge-success">{t("settings.active")}</span>
                  </div>
                  <div className="mt-4">
                    <label className="np-form-label">{t("settings.fontSize")}</label>
                    <select className="np-form-control" defaultValue="comfortable">
                      <option value="compact">{t("settings.compact")}</option>
                      <option value="comfortable">{t("settings.comfortable")}</option>
                      <option value="large">{t("settings.large")}</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4">
                  <p className="text-sm font-extrabold text-[var(--np-color-text)]">
                    {t("settings.themeColors")}
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
              <NutriSectionHeader icon={Bell} kicker={t("settings.alerts")} title={t("settings.notifications")} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {notificationSettings.map(([label, status]) => (
                  <SettingStatusCard key={label} label={label} status={status} preferenceLabel={t("settings.notificationPreference")} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Database} kicker={t("settings.utilities")} title={t("settings.data")} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                <DataAction icon={Download} label={t("settings.backup")} />
                <DataAction icon={RotateCcw} label={t("settings.restore")} />
                <DataAction icon={FileUp} label={t("settings.export")} />
                <DataAction icon={Upload} label={t("settings.import")} />
              </div>
            </NutriPanel>
          </div>

          <aside className="space-y-5">
            <NutriPanel>
              <NutriSectionHeader icon={ShieldCheck} kicker={t("settings.access")} title={t("settings.security")} />
              <div className="space-y-3">
                <button className="np-button np-button-secondary w-full justify-start" type="button">
                  <KeyRound className="h-4 w-4" />
                  {t("settings.changePassword")}
                </button>
                <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
                  <p className="flex items-center gap-2 text-sm font-extrabold text-[var(--np-color-text)]">
                    <Lock className="h-4 w-4 text-[var(--np-color-brand)]" />
                    {t("settings.sessionInformation")}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                    {t("settings.sessionNote")}
                  </p>
                </div>
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Info} kicker={t("settings.product")} title={t("settings.about")} />
              <div className="space-y-3">
                <InfoRow label={t("settings.version")} value="0.0.0" />
                <InfoRow label={t("settings.build")} value={t("settings.localViteBuild")} />
                <InfoRow label={t("settings.credits")} value={t("app.tagline")} />
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Languages} kicker={t("settings.future")} title={t("settings.localization")} />
              <p className="text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                {t("settings.localizationNote")}
              </p>
            </NutriPanel>
          </aside>
        </section>
      </NutriPageMain>
    </NutriPage>
  );
}

function SettingStatusCard({ label, preferenceLabel, status }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <p className="text-sm font-extrabold text-[var(--np-color-text)]">{label}</p>
      <p className="mt-3 text-xs font-bold text-[var(--np-color-text-muted)]">
        {preferenceLabel}
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

