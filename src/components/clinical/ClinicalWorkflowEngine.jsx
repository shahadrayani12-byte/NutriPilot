import { useState } from "react";
import { ArrowRight, ClipboardList, Clock3, FileCheck2, Plus, Route } from "lucide-react";

import { getWorkflowNextAction, getWorkflowStatus } from "../../utils/workflowStatus";
import { NutriBadge, NutriButton, NutriPanel, NutriSectionHeader } from "../common/NutriPilotPrimitives";

export function ClinicalWorkflowEngine({ activeTab, compact = false, onNavigate, patient, setActiveTab }) {
  const [generatedTask, setGeneratedTask] = useState("");
  const workflow = getWorkflowStatus(patient);
  const nextAction = getWorkflowNextAction(patient);
  const firstMissingStep = workflow.missing[0] || workflow.needsReview[0] || nextAction;
  const remainingSteps = workflow.total - workflow.completed;
  const estimatedMinutes = Math.max(remainingSteps * 6, remainingSteps ? 6 : 0);
  const reportStep = workflow.steps.find((step) => step.id === "reports");
  const reportReadiness = reportStep?.status === "Completed" ? 100 : reportStep?.status === "Needs Review" ? 75 : workflow.percent;

  function openStep(step) {
    if (!step?.tabId) {
      return;
    }

    if (step.tabId === "reports") {
      onNavigate?.("reports");
      return;
    }

    setActiveTab(step.tabId);
  }

  function generateRelatedTask() {
    setGeneratedTask(`${nextAction.actionLabel} for ${patient.fullName}`);
  }

  const stepGridClass = compact
    ? "grid grid-cols-2 gap-2 md:grid-cols-5 xl:grid-cols-10"
    : "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5";
  const stepButtonClass = compact
    ? "rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3 text-left transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]"
    : "rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4 text-left transition hover:border-[var(--np-color-brand)] hover:bg-[var(--np-color-brand-soft)]";

  return (
    <NutriPanel className={`mb-0 ${compact ? "p-4" : ""}`}>
      <NutriSectionHeader
        icon={Route}
        kicker="Patient Journey"
        title="Guided Clinical Workflow"
        action={<NutriBadge tone="brand">{workflow.percent}% complete</NutriBadge>}
      />

      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <WorkflowMetric icon={FileCheck2} label="Remaining" value={`${remainingSteps} steps`} />
        <WorkflowMetric icon={Clock3} label="Estimated time" value={estimatedMinutes ? `${estimatedMinutes} min` : "Ready"} />
        <WorkflowMetric icon={ClipboardList} label="Report readiness" value={`${reportReadiness}%`} />
        <WorkflowMetric icon={Route} label="Next step" value={nextAction.label} />
      </div>

      <div className={compact ? "mb-4" : "mb-5"}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-[var(--np-color-text-muted)]">
          <span>{workflow.completed} of {workflow.total} steps completed</span>
          <span>{workflow.nextStep.label}: {workflow.nextStep.status}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--np-color-surface-muted)]">
          <div className="h-full rounded-full bg-[var(--np-color-brand)]" style={{ width: `${workflow.percent}%` }} />
        </div>
      </div>

      <div className={stepGridClass}>
        {workflow.steps.map((step, index) => {
          const isActive = activeTab === step.tabId;

          return (
            <button
              aria-current={isActive ? "step" : undefined}
              className={`${stepButtonClass} ${isActive ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)] shadow-[var(--np-shadow-sm)]" : ""}`}
              key={step.id}
              onClick={() => openStep(step)}
              type="button"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--np-color-surface-muted)] text-[11px] font-extrabold text-[var(--np-color-brand)]">
                  {index + 1}
                </span>
                <WorkflowStatusBadge status={step.status} />
              </div>
              <p className={`${compact ? "text-xs leading-4" : "text-sm leading-5"} font-extrabold text-[var(--np-color-text)]`}>
                {step.label}
              </p>
            </button>
          );
        })}
      </div>

      <div className={`${compact ? "mt-4" : "mt-5"} grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto]`}>
        <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
            Next Recommended Step
          </p>
          <h3 className="mt-1 text-base font-extrabold text-[var(--np-color-text)]">
            {nextAction.actionLabel}
          </h3>
          <p className="mt-1 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
            {nextAction.reason}
          </p>
          {generatedTask ? (
            <p className="mt-3 rounded-[14px] bg-white p-3 text-sm font-extrabold text-[var(--np-color-brand)]">
              Generated placeholder task: {generatedTask}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row xl:flex-col">
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => openStep(nextAction)}>
            <ArrowRight className="h-4 w-4" />
            Go to next step
          </NutriButton>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={() => openStep(firstMissingStep)} variant="secondary">
            <ClipboardList className="h-4 w-4" />
            Open missing section
          </NutriButton>
          <NutriButton className="min-h-10 px-3 text-xs" onClick={generateRelatedTask} variant="secondary">
            <Plus className="h-4 w-4" />
            Generate related task
          </NutriButton>
        </div>
      </div>
    </NutriPanel>
  );
}

function WorkflowMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[14px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--np-color-brand)]">
        <Icon className="h-4 w-4" />
        <span className="text-[10px] font-extrabold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="truncate text-sm font-extrabold text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function WorkflowStatusBadge({ status }) {
  const tone = {
    Completed: "success",
    "In Progress": "brand",
    Missing: "danger",
    "Needs Review": "warning",
  }[status] || "secondary";

  return <NutriBadge className="text-[10px]" tone={tone}>{status}</NutriBadge>;
}
