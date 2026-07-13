import { Activity, ArrowRight, CheckCircle2, UserRound } from "lucide-react";

import { getWorkflowStatus } from "../../utils/workflowStatus";
import { buildClinicalDecisionSupport } from "../../utils/clinicalDecisionSupport";
import { useTranslation } from "../../i18n";
import { NutriBadge, NutriButton } from "./NutriPilotPrimitives";

export function ActivePatientBanner({ patient, onOpenClinicalHub, quickActions = [], compact = false }) {
  const { t } = useTranslation();

  if (!patient) {
    return null;
  }

  const workflow = getWorkflowStatus(patient);
  const intelligence = buildClinicalDecisionSupport(patient);
  const riskLevel = patient.riskLevel || "Not classified";
  const actions = quickActions.length ? quickActions : [["Open Clinical Hub", onOpenClinicalHub]];

  return (
    <section className={`np-panel ${compact ? "p-4" : "mb-5"}`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="np-icon-tile">
            <UserRound className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
              {t("patient.active")}
            </p>
            <h2 className="truncate text-xl font-extrabold text-[var(--np-color-text)]">
              {patient.fullName}
            </h2>
            <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
              {patient.diagnosis || t("patient.noDiagnosis")} <span aria-hidden="true">•</span> {t("patient.lastUpdated")} {patient.lastUpdated || t("common.today")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NutriBadge tone={riskLevel === "High Risk" ? "danger" : riskLevel === "Moderate Risk" ? "warning" : "secondary"}>
            {riskLevel}
          </NutriBadge>
          <NutriBadge tone={intelligence.riskEngine.level === "High" ? "danger" : intelligence.riskEngine.level === "Moderate" ? "warning" : "success"}>
            CDS {intelligence.nutritionStatusScore.score}%
          </NutriBadge>
          <div className="min-w-40">
            <div className="mb-1 flex items-center justify-between text-xs font-extrabold text-[var(--np-color-text-muted)]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("workflow.label")}
              </span>
              <span>{workflow.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--np-color-surface-muted)]">
              <div className="h-full rounded-full bg-[var(--np-color-brand)]" style={{ width: `${workflow.percent}%` }} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions.map(([label, handler], index) => (
              <NutriButton
                className="min-h-10 px-3 text-xs"
                key={label}
                onClick={handler}
                variant={index === 0 && !quickActions.length ? "secondary" : "secondary"}
              >
                {index === 0 && !quickActions.length ? <Activity className="h-4 w-4" /> : null}
                {t(`actions.${label}`, { defaultValue: label })}
                {index === 0 && !quickActions.length ? <ArrowRight className="h-4 w-4" /> : null}
              </NutriButton>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

