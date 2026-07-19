import { AlertTriangle, ClipboardCheck, FileClock, GitBranch, Stethoscope } from "lucide-react";

import {
  NutriBadge,
  NutriButton,
  NutriPanel,
  NutriSectionHeader,
} from "../common/NutriPilotPrimitives";
import { useTranslation } from "../../i18n";

const statusTone = {
  Completed: "success",
  Escalated: "danger",
  "In Progress": "warning",
  "Needs Review": "warning",
  "Not Started": "secondary",
  Overdue: "danger",
};

export function NutritionCareJourney({ compact = false, core, onOpenStage, onUsePreviousNoteDraft }) {
  const { t } = useTranslation();
  const journey = core?.journey;
  if (!journey) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
            {t("nutritionCore.journey", { defaultValue: "Nutrition Care Journey" })}
          </p>
          <h3 className="mt-1 text-base font-extrabold text-[var(--np-color-text)]">
            {journey.currentStage?.label || "Review"} - {journey.nextExpectedAction?.actionLabel}
          </h3>
        </div>
        <NutriBadge tone={journey.percent >= 80 ? "success" : journey.percent >= 45 ? "warning" : "danger"}>
          {journey.percent}%
        </NutriBadge>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <CoreMetric label={t("nutritionCore.currentStage", { defaultValue: "Current stage" })} value={journey.currentStage?.label || "Review"} />
        <CoreMetric label={t("nutritionCore.completion", { defaultValue: "Completion" })} value={`${journey.percent}%`} />
        <CoreMetric label={t("nutritionCore.missing", { defaultValue: "Missing requirements" })} value={journey.missingRequirements.length} />
        <CoreMetric label={t("nutritionCore.reviewStatus", { defaultValue: "Review status" })} value={journey.reviewStatus} />
      </div>

      <div className={compact ? "flex gap-2 overflow-x-auto pb-1" : "grid grid-cols-1 gap-2 lg:grid-cols-7"}>
        {journey.stages.map((stage, index) => (
          <button
            className={`${compact ? "min-w-[180px] shrink-0 p-2" : "min-h-20 p-3"} rounded-[18px] border border-[var(--np-color-border-soft)] bg-white text-left transition hover:-translate-y-0.5 hover:border-[var(--np-color-brand)] hover:shadow-[var(--np-shadow-card)]`}
            key={stage.id}
            onClick={() => onOpenStage?.(stage)}
            type="button"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--np-color-brand-soft)] text-xs font-extrabold text-[var(--np-color-brand)]">
                {index + 1}
              </span>
              <NutriBadge tone={statusTone[stage.status] || "secondary"}>{stage.status}</NutriBadge>
            </div>
            <p className={`${compact ? "mt-2 text-xs" : "mt-3 text-sm"} font-extrabold leading-5 text-[var(--np-color-text)]`}>{stage.label}</p>
            <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
              {stage.missingRequirements[0] || stage.overdueItems[0] || stage.reviewStatus}
            </p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <article className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">
                {t("nutritionCore.nextAction", { defaultValue: "Next expected action" })}
              </p>
              <h3 className="mt-1 text-base font-extrabold text-[var(--np-color-text)]">
                {journey.nextExpectedAction?.actionLabel}
              </h3>
            </div>
            <NutriButton className="min-h-10 px-3 text-xs" onClick={() => onOpenStage?.({ tabId: journey.nextExpectedAction?.tabId })} variant="secondary">
              <ClipboardCheck className="h-4 w-4" />
              {t("nutritionCore.openAction", { defaultValue: "Open action" })}
            </NutriButton>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
            {journey.nextExpectedAction?.reason}
          </p>
        </article>

        <article className="rounded-[18px] border border-[var(--np-color-warning-border)] bg-[var(--np-color-warning-bg)] p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[var(--np-color-warning)]" />
            <div>
              <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">
                {t("nutritionCore.safetyLabel", { defaultValue: "Clinical decision support only" })}
              </h3>
              <p className="mt-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
                {core.intelligenceSummary.disclaimer}
              </p>
            </div>
          </div>
        </article>
      </div>

      {compact ? null : <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <CoreListCard
          icon={AlertTriangle}
          items={core.alerts.map((alert) => alert.title)}
          title={t("nutritionCore.reviewAlerts", { defaultValue: "Review alerts" })}
          zeroText={t("nutritionCore.noReviewAlerts", { defaultValue: "No rule-based non-response alert from recorded data." })}
        />
        <CoreListCard
          icon={FileClock}
          items={core.outcomes.filter((outcome) => outcome.status !== "Missing").slice(0, 4).map((outcome) => `${outcome.label}: ${outcome.current}`)}
          title={t("nutritionCore.outcomeTracking", { defaultValue: "Outcome tracking" })}
          zeroText={t("nutritionCore.noOutcomes", { defaultValue: "No recorded outcome measures yet." })}
        />
        {core.ironPathway.applicable ? (
          <CoreListCard
            icon={GitBranch}
            items={core.ironPathway.stages.slice(0, 4).map((stage) => `${stage.label}: ${stage.status}`)}
            title={core.ironPathway.label}
            zeroText={t("nutritionCore.pathwayPlaceholder", { defaultValue: "Pathway structure is ready for clinician review." })}
          />
        ) : null}
      </div>}

      {compact ? null : <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <CoreListCard
          icon={ClipboardCheck}
          items={[
            `Recorded fields: ${core.profile.recordedCount}/${core.profile.totalCount}`,
            `Missing fields: ${Math.max(0, core.profile.totalCount - core.profile.recordedCount)}`,
            `Latest source: ${core.audit.source}`,
          ]}
          title={t("nutritionCore.digitalProfile", { defaultValue: "Nutrition Digital Profile" })}
          zeroText={t("nutritionCore.noProfile", { defaultValue: "No patient profile data available." })}
        />
        <CoreListCard
          icon={Stethoscope}
          items={[
            `Primary concern: ${core.intelligenceSummary.primaryNutritionConcern}`,
            `Risk: ${core.intelligenceSummary.risk}`,
            `Next: ${core.intelligenceSummary.nextWorkflowAction?.actionLabel}`,
          ]}
          title={t("nutritionCore.summary", { defaultValue: "Nutrition Intelligence Summary" })}
          zeroText={t("nutritionCore.noSummary", { defaultValue: "Summary unavailable." })}
        />
        <CoreListCard
          icon={GitBranch}
          items={core.referrals.slice(0, 3).map((referral) => `${referral.destination}: ${referral.status}`)}
          title={t("nutritionCore.referrals", { defaultValue: "Collaboration Referrals" })}
          zeroText={t("nutritionCore.noReferrals", { defaultValue: "No nutrition collaboration referrals recorded." })}
        />
      </div>}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4">
        <div>
          <p className="text-sm font-extrabold text-[var(--np-color-text)]">
            {t("nutritionCore.previousNoteDraft", { defaultValue: "Use Previous Note as Draft" })}
          </p>
          <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
            {core.previousNoteDraft.available
              ? `Source: ${core.previousNoteDraft.sourceDate}. Requires review of symptoms, intake, weight, adherence, intervention response, and next plan.`
              : "No reusable previous note was found in the shared patient record."}
          </p>
        </div>
        <NutriButton
          className="min-h-10 px-3 text-xs"
          disabled={!core.previousNoteDraft.available}
          onClick={() => onUsePreviousNoteDraft?.(core.previousNoteDraft)}
          variant="secondary"
        >
          <Stethoscope className="h-4 w-4" />
          {t("nutritionCore.usePreviousNote", { defaultValue: "Use Previous Note as Draft" })}
        </NutriButton>
      </div>
    </div>
  );
}

export function NutritionCareCorePanel({ core, onOpenStage }) {
  const { t } = useTranslation();
  if (!core) return null;

  return (
    <NutriPanel>
      <NutriSectionHeader
        icon={Stethoscope}
        kicker={t("nutritionCore.kicker", { defaultValue: "Nutrition care core" })}
        title={t("nutritionCore.title", { defaultValue: "Nutrition Care Intelligence Core" })}
      />
      <NutritionCareJourney core={core} onOpenStage={onOpenStage} />
    </NutriPanel>
  );
}

function CoreMetric({ label, value }) {
  return (
    <article className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-soft)]">{label}</p>
      <p className="mt-2 text-lg font-extrabold text-[var(--np-color-text)]">{value}</p>
    </article>
  );
}

function CoreListCard({ icon: Icon, items, title, zeroText }) {
  return (
    <article className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="np-icon-tile h-9 w-9">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">{title}</h3>
      </div>
      <ul className="mt-3 space-y-2">
        {(items.length ? items : [zeroText]).map((item) => (
          <li className="text-xs font-bold leading-5 text-[var(--np-color-text-muted)]" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}
