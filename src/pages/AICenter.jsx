import { useState } from "react";
import {
  AlertTriangle,
  Bot,
  Brain,
  CheckCircle2,
  ClipboardList,
  FileText,
  FlaskConical,  ListChecks,
  MessageSquareText,
  SearchCheck,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import {
  NutriBadge,
  NutriButton,
  NutriInput,
  NutriPage,
  NutriPageHeader,
  NutriPageMain,
  NutriPanel,
  NutriSectionHeader,
} from "../components/common/NutriPilotPrimitives";
import { ActivePatientBanner } from "../components/common/ActivePatientBanner";
import { useTranslation } from "../i18n";
import { getWorkflowNextAction, getWorkflowStatus } from "../utils/workflowStatus";

export default function AICenter({ activePatient, aiSummary, intelligence, onOpenClinicalHub, workflow: sharedWorkflow }) {
  const { language } = useTranslation();
  const patient = normalizeAiPatient(activePatient);
  const workflow = sharedWorkflow || getWorkflowStatus(patient);
  const nextAction = getWorkflowNextAction(patient);
  const clinicalBrief = buildClinicalBrief(patient, workflow, aiSummary);
  const support = intelligence;
  const priorities = buildClinicalPriorities(patient, workflow);
  const missingInfo = buildMissingInformation(workflow);
  const suggestedActions = buildSuggestedActions(workflow, nextAction);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "AI Copilot",
      text: "Ask about available patient context, workflow status, missing documentation, labs, PES, intervention, monitoring, or reports. I will not invent unavailable data.",
    },
  ]);

  function askCopilot(event) {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "Clinician", text: trimmedQuestion },
      { role: "AI Copilot", text: answerFromAvailableData(trimmedQuestion, patient, workflow, clinicalBrief, missingInfo) },
    ]);
    setQuestion("");
  }

  return (
    <NutriPage data-language={language}>
      <NutriPageMain>
        <NutriPageHeader
          actions={
            <>
              <NutriBadge tone="brand">Rule-based only</NutriBadge>
              <NutriBadge tone="warning">No free generation</NutriBadge>
              <NutriBadge tone="secondary">Clinician review</NutriBadge>
            </>
          }
          kicker="AI Center 1.0"
          subtitle="A proactive clinical nutrition copilot that reviews available patient data, highlights workflow gaps, and refuses to invent missing information."
          title="AI Clinical Copilot"
        />

        <ActivePatientBanner patient={patient} onOpenClinicalHub={() => onOpenClinicalHub(patient)} />

        <section className="mb-5 rounded-[26px] border border-[rgb(185_28_28_/_0.18)] bg-[var(--np-color-danger-bg)] p-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-[var(--np-color-danger)]" />
            <div>
              <h2 className="text-lg font-extrabold text-[var(--np-color-text)]">Safety Guardrail</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                This copilot uses only available NutriPilot data for {patient.fullName}. It does not diagnose, prescribe, or invent missing patient information.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <div className="space-y-5">
            <NutriPanel>
              <NutriSectionHeader icon={Brain} kicker="Clinical brief" title="AI Clinical Brief" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {clinicalBrief.map((item) => (
                  <BriefCard key={item.label} {...item} />
                ))}
              </div>
            </NutriPanel>

            {support ? (
              <NutriPanel>
                <NutriSectionHeader icon={Sparkles} kicker="Decision support" title="Clinical Decision Support" />
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                  {support.decisionCards.map((card) => (
                    <DecisionSupportCard card={card} key={card.title} />
                  ))}
                </div>
              </NutriPanel>
            ) : null}

            {support ? (
              <NutriPanel>
                <NutriSectionHeader icon={FlaskConical} kicker="Smart labs" title="Laboratory Trends & Interpretation" />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {support.labInterpretation.map((lab) => (
                    <LabInterpretationCard lab={lab} trend={support.labTrends.find((item) => item.label === lab.label)} key={lab.label} />
                  ))}
                </div>
              </NutriPanel>
            ) : null}

            {support ? (
              <NutriPanel>
                <NutriSectionHeader icon={ListChecks} kicker="Timeline" title="AI Timeline" />
                <div className="space-y-3">
                  {support.aiTimeline.map((event) => (
                    <AiTimelineRow event={event} key={event.title} />
                  ))}
                </div>
              </NutriPanel>
            ) : null}

            <NutriPanel>
              <NutriSectionHeader icon={ListChecks} kicker="Proactive queue" title="Clinical Priorities" />
              <div className="space-y-3">
                {priorities.map((priority, index) => (
                  <PriorityCard index={index} key={priority.title} priority={priority} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={Sparkles} kicker="Next actions" title="Suggested Actions" />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {suggestedActions.map((action) => (
                  <ActionCard action={action} key={action.title} onOpenClinicalHub={() => onOpenClinicalHub(patient)} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={MessageSquareText} kicker="Safe Q&A" title="AI Conversation" />
              <div className="mb-4 max-h-[340px] space-y-3 overflow-auto rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
                {messages.map((message, index) => (
                  <ConversationMessage key={`${message.role}-${index}`} message={message} />
                ))}
              </div>
              <form className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]" onSubmit={askCopilot}>
                <NutriInput
                  aria-label="Ask AI Copilot"
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="Ask about available workflow, missing data, labs, reports..."
                  value={question}
                />
                <NutriButton type="submit">
                  <Bot className="h-4 w-4" />
                  Ask safely
                </NutriButton>
              </form>
            </NutriPanel>
          </div>

          <aside className="space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
            <NutriPanel>
              <NutriSectionHeader icon={AlertTriangle} kicker="Data gaps" title="Missing Information" />
              <div className="space-y-2">
                {missingInfo.map((item) => (
                  <MissingInfoRow item={item} key={item.label} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={SearchCheck} kicker="Reasoning" title="Explain Reasoning" />
              <div className="space-y-3">
                {priorities.map((priority) => (
                  <ReasoningBlock key={priority.title} priority={priority} />
                ))}
              </div>
            </NutriPanel>

            <NutriPanel>
              <NutriSectionHeader icon={FileText} kicker="Evidence" title="Evidence Placeholder" />
              <p className="rounded-[18px] bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                Guideline citations, evidence grading, and institutional protocol links are reserved for future integration. Current output is workflow-based and placeholder-only.
              </p>
            </NutriPanel>
          </aside>
        </section>
      </NutriPageMain>
    </NutriPage>
  );
}

function DecisionSupportCard({ card }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">{card.title}</h3>
        <NutriBadge tone={card.priority === "High" ? "danger" : card.priority === "Moderate" ? "warning" : "secondary"}>
          {card.priority}
        </NutriBadge>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{card.reason}</p>
      <p className="mt-3 text-sm font-extrabold text-[var(--np-color-text)]">{card.action}</p>
      <p className="mt-2 text-xs font-bold text-[var(--np-color-text-soft)]">Confidence: {card.confidence}</p>
    </article>
  );
}

function LabInterpretationCard({ lab, trend }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">{lab.label}</h3>
        <NutriBadge tone={lab.status === "Normal" ? "success" : lab.status === "Low" ? "warning" : "danger"}>{lab.status}</NutriBadge>
      </div>
      <p className="mt-2 text-lg font-extrabold text-[var(--np-color-text)]">{lab.value}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{lab.interpretation}</p>
      <p className="mt-2 text-xs font-bold text-[var(--np-color-text-soft)]">{trend?.summary}</p>
    </article>
  );
}

function AiTimelineRow({ event }) {
  return (
    <div className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-[var(--np-color-text)]">{event.title}</p>
        <NutriBadge tone={event.status === "High" || event.status === "Needs Review" ? "danger" : event.status === "Moderate" ? "warning" : "secondary"}>
          {event.status}
        </NutriBadge>
      </div>
      <p className="mt-1 text-xs font-bold text-[var(--np-color-text-soft)]">{event.time}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{event.detail}</p>
    </div>
  );
}

function normalizeAiPatient(patient) {
  return {
    fullName: patient?.fullName || patient?.name || "Active patient unavailable",
    age: patient?.age || "Unavailable",
    gender: patient?.gender || "Unavailable",
    diagnosis: patient?.diagnosis || patient?.note || "Diagnosis unavailable",
    height: patient?.height || "Unavailable",
    weight: patient?.weight || "Unavailable",
    bmi: patient?.bmi || "Unavailable",
    notes: patient?.notes || patient?.note || "No clinical notes available",
    riskLevel: patient?.riskLevel || "Not classified",
  };
}

function buildClinicalBrief(patient, workflow, aiSummary) {
  return [
    { icon: Stethoscope, label: "Active patient", tone: "brand", value: patient.fullName },
    { icon: ClipboardList, label: "Diagnosis", tone: "secondary", value: patient.diagnosis },
    { icon: CheckCircle2, label: "Workflow progress", tone: "success", value: `${workflow.percent}% complete` },
    { icon: AlertTriangle, label: "Missing documentation", tone: workflow.missing.length ? "danger" : "success", value: workflow.missing.map((step) => step.label).join(", ") || "No missing workflow steps" },
    { icon: FlaskConical, label: "Pending lab review", tone: workflow.needsReview.some((step) => step.id === "labs") || workflow.missing.some((step) => step.id === "labs") ? "warning" : "success", value: getStepStatus(workflow, "labs") },
    { icon: FileText, label: "Report readiness", tone: getStepStatus(workflow, "reports") === "Missing" ? "danger" : "warning", value: getStepStatus(workflow, "reports") },
    { icon: ListChecks, label: "Follow-up status", tone: getStepStatus(workflow, "monitoring") === "Missing" ? "warning" : "success", value: getStepStatus(workflow, "monitoring") },
    { icon: Brain, label: "Shared AI summary", tone: "brand", value: aiSummary?.summary || "Not generated" },
  ];
}

function buildClinicalPriorities(patient, workflow) {
  const actionableSteps = [...workflow.needsReview, ...workflow.missing].slice(0, 5);
  const fallback = workflow.steps.filter((step) => step.status !== "Completed").slice(0, 3);
  const sourceSteps = actionableSteps.length ? actionableSteps : fallback;

  return sourceSteps.map((step, index) => ({
    title: priorityTitle(step),
    rank: index + 1,
    status: step.status,
    priority: step.status === "Missing" || index === 0 ? "High" : "Moderate",
    suggestedAction: suggestedActionForStep(step),
    why: `${step.label} is currently ${step.status.toLowerCase()} in the active patient workflow.`,
    dataUsed: [`Patient: ${patient.fullName}`, `Diagnosis: ${patient.diagnosis}`, `Workflow step: ${step.label}`, `Status: ${step.status}`],
    missing: workflow.missing.map((missingStep) => missingStep.label),
  }));
}

function buildMissingInformation(workflow) {
  const missingByStep = workflow.missing.map((step) => ({
    label: step.label,
    status: "Missing",
    detail: `${step.label} is not complete in the current workflow context.`,
  }));

  return missingByStep.length ? missingByStep : [{ label: "No missing workflow steps", status: "Ready", detail: "The placeholder workflow has no missing steps." }];
}

function buildSuggestedActions(workflow, nextAction) {
  const baseActions = [
    { id: "labs", title: "Complete Laboratory Review", step: workflow.steps.find((step) => step.id === "labs") },
    { id: "pes", title: "Finish PES", step: workflow.steps.find((step) => step.id === "pes") },
    { id: "reports", title: "Generate Report", step: workflow.steps.find((step) => step.id === "reports") },
    { id: "monitoring", title: "Schedule Follow-up", step: workflow.steps.find((step) => step.id === "monitoring") },
  ];

  return baseActions.map((action) => ({
    ...action,
    reason: action.step ? `${action.step.label} is ${action.step.status.toLowerCase()}.` : "Workflow status unavailable.",
    status: action.step?.status || "Unavailable",
    recommended: nextAction.id === action.id,
  }));
}

function answerFromAvailableData(question, patient, workflow, clinicalBrief, missingInfo) {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("diagnosis")) {
    return patient.diagnosis === "Diagnosis unavailable" ? "Diagnosis is unavailable in the current patient context." : `Available diagnosis: ${patient.diagnosis}.`;
  }

  if (normalizedQuestion.includes("missing")) {
    return missingInfo.map((item) => `${item.label}: ${item.detail}`).join(" ");
  }

  if (normalizedQuestion.includes("workflow") || normalizedQuestion.includes("progress")) {
    return `Workflow progress is ${workflow.percent}%. Missing steps: ${workflow.missing.map((step) => step.label).join(", ") || "none"}. Steps needing review: ${workflow.needsReview.map((step) => step.label).join(", ") || "none"}.`;
  }

  if (normalizedQuestion.includes("lab")) {
    const labStatus = getStepStatus(workflow, "labs");
    return `Laboratory workflow status: ${labStatus}. Specific patient lab values are unavailable here unless they are documented in connected patient data.`;
  }

  if (normalizedQuestion.includes("report")) {
    return `Report readiness status: ${getStepStatus(workflow, "reports")}. Report generation should be completed in Reports Center.`;
  }

  if (normalizedQuestion.includes("patient") || normalizedQuestion.includes("summary")) {
    return clinicalBrief.map((item) => `${item.label}: ${item.value}`).join(". ");
  }

  return "That information is unavailable in the current AI Center context. I can only answer from active patient demographics, diagnosis text, workflow status, missing documentation, AI summary state, and report/lab workflow readiness.";
}

function BriefCard({ icon: Icon, label, tone, value }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="np-icon-tile h-10 w-10"><Icon className="h-4 w-4" /></span>
        <NutriBadge tone={tone}>{label}</NutriBadge>
      </div>
      <p className="text-sm font-extrabold leading-6 text-[var(--np-color-text)]">{value}</p>
    </article>
  );
}

function PriorityCard({ index, priority }) {
  return (
    <article className="rounded-[22px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-brand)]">Priority {index + 1}</p>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--np-color-text)]">{priority.title}</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <NutriBadge tone={priority.priority === "High" ? "danger" : "warning"}>{priority.priority}</NutriBadge>
          <NutriBadge tone={priority.status === "Missing" ? "danger" : "warning"}>{priority.status}</NutriBadge>
        </div>
      </div>
      <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{priority.suggestedAction}</p>
    </article>
  );
}

function MissingInfoRow({ item }) {
  return (
    <article className="rounded-[16px] border border-[var(--np-color-border-soft)] bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-extrabold text-[var(--np-color-text)]">{item.label}</p>
        <NutriBadge tone={item.status === "Missing" ? "danger" : "success"}>{item.status}</NutriBadge>
      </div>
      <p className="mt-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">{item.detail}</p>
    </article>
  );
}

function ActionCard({ action, onOpenClinicalHub }) {
  return (
    <article className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">{action.title}</h3>
        {action.recommended ? <NutriBadge tone="brand">Next</NutriBadge> : <NutriBadge tone="secondary">{action.status}</NutriBadge>}
      </div>
      <p className="mt-3 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">{action.reason}</p>
      <NutriButton className="mt-4 min-h-10 px-3 text-xs" onClick={onOpenClinicalHub} variant="secondary">Open workflow</NutriButton>
    </article>
  );
}

function ConversationMessage({ message }) {
  const isCopilot = message.role === "AI Copilot";
  return (
    <article className={`rounded-[18px] border p-3 ${isCopilot ? "border-[var(--np-color-border-soft)] bg-white" : "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)]"}`}>
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-brand)]">{message.role}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">{message.text}</p>
    </article>
  );
}

function ReasoningBlock({ priority }) {
  return (
    <article className="rounded-[18px] border border-[var(--np-color-border-soft)] bg-white p-4">
      <h3 className="text-sm font-extrabold text-[var(--np-color-text)]">{priority.title}</h3>
      <ReasoningLine label="Why" value={priority.why} />
      <ReasoningLine label="Patient information used" value={priority.dataUsed.join("; ")} />
      <ReasoningLine label="Still missing" value={priority.missing.join(", ") || "No missing workflow steps"} />
    </article>
  );
}

function ReasoningLine({ label, value }) {
  return (
    <div className="mt-3">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--np-color-text-muted)]">{label}</p>
      <p className="mt-1 text-xs font-bold leading-5 text-[var(--np-color-text)]">{value}</p>
    </div>
  );
}

function getStepStatus(workflow, stepId) {
  return workflow.steps.find((step) => step.id === stepId)?.status || "Unavailable";
}

function priorityTitle(step) {
  const titles = {
    ai: "Review AI output",
    assessment: "Complete assessment documentation",
    dietary: "Complete dietary assessment",
    intervention: "Complete nutrition intervention",
    labs: "Review laboratory documentation",
    medical: "Complete medical history",
    monitoring: "Schedule or document follow-up",
    pes: "Finish PES diagnosis",
    reports: "Generate clinical report",
    summary: "Review patient summary",
  };

  return titles[step.id] || `Review ${step.label}`;
}

function suggestedActionForStep(step) {
  const actions = {
    labs: "Complete Laboratory Review before relying on lab-driven recommendations.",
    pes: "Finish PES so the care plan has a documented nutrition diagnosis.",
    intervention: "Complete Nutrition Intervention before monitoring outcomes.",
    monitoring: "Schedule Follow-up or document Monitoring and Evaluation status.",
    reports: "Generate Report when the clinical workflow is ready for communication.",
    ai: "Review AI output and confirm clinician approval before use.",
  };

  return actions[step.id] || `Open ${step.label} and complete the missing workflow documentation.`;
}

