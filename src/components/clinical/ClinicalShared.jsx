import { Edit3, Trash2 } from "lucide-react";

import { interpretMonitoringVisit } from "../../utils/clinicalWorkspaceUtils";

export function InterventionField({ label, value, onChange, wide = false }) {
  return (
    <label className={`block ${wide ? "xl:col-span-2" : ""}`}>
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full resize-y rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold leading-6 text-[var(--np-color-text)] outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      />
    </label>
  );
}

export function InterventionHistoryCard({ intervention, onEdit, onDelete }) {
  const previewFields = [
    ["Goals", intervention.plan.nutritionGoals],
    ["Diet type", intervention.plan.dietType],
    ["Meal pattern", intervention.plan.mealPattern],
    ["Follow-up", intervention.plan.followUpPlan],
  ];

  return (
    <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            {intervention.patientName}
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
            Saved {intervention.savedAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {intervention.goals.slice(0, 3).map((goal) => (
            <span
              key={goal}
              className="rounded-full border border-[rgb(122_31_43_/_0.3)] bg-[var(--np-color-brand-soft)] px-3 py-1 text-xs font-extrabold text-[var(--np-color-brand)]"
            >
              {goal}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {previewFields.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4"
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
              {label}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-[var(--np-color-border-soft)] pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => onEdit(intervention)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--np-color-border)] bg-white px-4 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)] sm:w-auto"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(intervention.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-700 transition hover:border-red-200 hover:bg-red-100 sm:w-auto"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

export function MonitoringInput({ label, type, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {label}
      </span>
      <input
        type={type}
        step={type === "number" ? "0.1" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      />
    </label>
  );
}

export function MonitoringSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MonitoringSummary({ formValues }) {
  const interpretation = interpretMonitoringVisit(formValues);
  const summaryItems = [
    ["Follow-up Visits", formValues.visitDate || "Visit date pending"],
    ["Weight Trend", formValues.weight ? `${formValues.weight} kg recorded` : "Weight pending"],
    ["BMI Trend", formValues.bmi ? `${formValues.bmi} BMI recorded` : "BMI pending"],
    ["Dietary Compliance", formValues.dietaryCompliance],
    ["Next Appointment Plan", formValues.nextFollowUpDate || "Next date pending"],
  ];

  return (
    <section className="rounded-[22px] border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            Rule-based interpretation
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--np-color-brand)]">
            Monitoring snapshot
          </h3>
        </div>
        <ProgressBadge status={formValues.progressStatus} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {summaryItems.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--np-color-border-soft)] bg-white p-4"
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
              {label}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {interpretation.map((item) => (
          <span
            key={item}
            className="rounded-full border border-[rgb(122_31_43_/_0.3)] bg-white px-3 py-1 text-xs font-extrabold text-[var(--np-color-brand)]"
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

export function MonitoringTimelineCard({ visit, onEdit, onDelete }) {
  const summary = [
    ["Weight", visit.weight ? `${visit.weight} kg` : "Pending"],
    ["BMI", visit.bmi || "Pending"],
    ["Compliance", visit.dietaryCompliance],
    ["Next visit", visit.nextFollowUpDate || "Pending"],
  ];

  return (
    <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            {visit.patientName}
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--np-color-brand)]">
            {visit.visitDate || "Follow-up visit"}
          </h3>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
            Saved {visit.savedAt}
          </p>
        </div>
        <ProgressBadge status={visit.progressStatus} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {summary.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4"
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
              {label}
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text)]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--np-color-surface-muted)] p-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
          Visit summary
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text)]">
          {visit.goalsAchieved}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {visit.interpretation.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[rgb(122_31_43_/_0.3)] bg-white px-3 py-1 text-xs font-extrabold text-[var(--np-color-brand)]"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 border-t border-[var(--np-color-border-soft)] pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => onEdit(visit)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--np-color-border)] bg-white px-4 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)] sm:w-auto"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(visit.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-700 transition hover:border-red-200 hover:bg-red-100 sm:w-auto"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

export function ProgressBadge({ status }) {
  const statusStyle = {
    Improving: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Stable: "border-blue-200 bg-blue-50 text-blue-700",
    Worsening: "border-amber-200 bg-amber-50 text-amber-700",
    "Needs urgent review": "border-red-200 bg-red-50 text-red-700",
  }[status];

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusStyle}`}>
      {status}
    </span>
  );
}

export function AiAssessmentResult({ assessment }) {
  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)] lg:col-span-2">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            AI Clinical Summary
          </p>
          <p className="mt-3 text-sm font-bold leading-7 text-[var(--np-color-text)]">
            {assessment.summary}
          </p>
        </article>

        <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            Assessment Signal
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <RiskBadge level={assessment.riskLevel} />
            <ConfidenceBadge confidence={assessment.confidence} />
          </div>
          <p className="mt-4 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
            Saved {assessment.savedAt}
          </p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AiInsightList title="Main Nutrition Problems" items={assessment.problems} />
        <AiInsightList title="Suggested Nutrition Diagnoses" items={assessment.diagnoses} />
        <AiInsightList title="Suggested Intervention Priorities" items={assessment.interventionPriorities} />
        <AiInsightList title="Monitoring Priorities" items={assessment.monitoringPriorities} />
        <AiInsightList title="Red Flags" items={assessment.redFlags} />
        <AiInsightList title="Sources Reviewed" items={assessment.sourcesUsed} />
      </section>
    </div>
  );
}

export function AiInsightList({ title, items }) {
  return (
    <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
        {title}
      </p>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <p
            key={item}
            className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-3 text-sm font-bold leading-6 text-[var(--np-color-text)]"
          >
            {item}
          </p>
        ))}
      </div>
    </article>
  );
}

export function AiAssessmentHistoryCard({ assessment, onDelete }) {
  return (
    <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            {assessment.patientName}
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
            Saved {assessment.savedAt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <RiskBadge level={assessment.riskLevel} />
          <ConfidenceBadge confidence={assessment.confidence} />
        </div>
      </div>

      <p className="rounded-2xl bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold leading-7 text-[var(--np-color-text)]">
        {assessment.summary}
      </p>

      <div className="mt-4 flex flex-col gap-2 border-t border-[var(--np-color-border-soft)] pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => onDelete(assessment.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-700 transition hover:border-red-200 hover:bg-red-100 sm:w-auto"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

export function RiskBadge({ level }) {
  const riskStyle = {
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Moderate: "border-amber-200 bg-amber-50 text-amber-700",
    High: "border-red-200 bg-red-50 text-red-700",
  }[level];

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${riskStyle}`}>
      {level} risk
    </span>
  );
}

export function ConfidenceBadge({ confidence }) {
  const confidenceStyle = {
    "High confidence": "border-emerald-200 bg-emerald-50 text-emerald-700",
    "Moderate confidence": "border-blue-200 bg-blue-50 text-blue-700",
    "Low confidence": "border-slate-200 bg-slate-50 text-[var(--np-color-text-muted)]",
  }[confidence];

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${confidenceStyle}`}>
      {confidence}
    </span>
  );
}

export function WorkspaceCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-[26px] border border-[var(--np-color-border-soft)] bg-white p-5 shadow-[var(--np-shadow-card)] lg:p-6">
      <div className="mb-5 flex items-center gap-3 border-b border-[var(--np-color-border-soft)] pb-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
            Clinical Module
          </p>
          <h3 className="mt-1 text-lg font-extrabold text-[var(--np-color-text)]">
            {title}
          </h3>
        </div>
      </div>
      {children}
    </section>
  );
}

export function AnthropometricInput({
  label,
  value,
  onChange,
  step = "0.1",
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {label}
      </span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      />
    </label>
  );
}

export function AnthropometricSelect({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      >
        <option value="">Select</option>
        <option value="Female">Female</option>
        <option value="Male">Male</option>
        <option value="Other">Other</option>
      </select>
    </label>
  );
}

export function LabInput({ lab, value, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-extrabold text-[var(--np-color-text-muted)]">
        <span>{lab.label}</span>
        <span className="shrink-0 text-xs text-[var(--np-color-text-soft)]">{lab.unit}</span>
      </span>
      <input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      />
    </label>
  );
}

export function LabResultCard({ result }) {
  const statusStyle = {
    Low: "border-amber-200 bg-amber-50 text-amber-700",
    Normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
    High: "border-red-200 bg-red-50 text-red-700",
    Critical: "border-red-300 bg-red-100 text-red-800",
    "Needs follow-up": "border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] text-[var(--np-color-brand)]",
  }[result.status];

  const value = result.value ? `${result.value} ${result.unit}` : "Pending";

  return (
    <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            {result.label}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-[var(--np-color-brand)]">
            {value}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold ${statusStyle}`}
        >
          {result.status}
        </span>
      </div>

      <div className="space-y-3">
        <p className="rounded-2xl bg-[var(--np-color-surface-muted)] p-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
          {result.interpretation}
        </p>
        <p className="text-xs font-bold text-[var(--np-color-text-soft)]">
          Placeholder range: {result.normalLow}-{result.normalHigh} {result.unit}
        </p>
      </div>
    </article>
  );
}

export function SummaryRiskCard({ item }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        item.active
          ? "border-[rgb(122_31_43_/_0.3)] bg-[var(--np-color-brand-soft)]"
          : "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)]"
      }`}
    >
      <p
        className={`text-sm font-extrabold ${
          item.active ? "text-[var(--np-color-brand)]" : "text-[var(--np-color-text-muted)]"
        }`}
      >
        {item.label}
      </p>
      <p className="mt-2 text-xs font-bold leading-5 text-[var(--np-color-text-muted)]">
        {item.text}
      </p>
    </div>
  );
}

export function MealRecallCard({ label, value, onChange }) {
  return (
    <label className="block rounded-[22px] border border-[var(--np-color-border)] bg-white p-4 shadow-[var(--np-shadow-card)]">
      <span className="mb-3 block text-sm font-extrabold text-[var(--np-color-brand)]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-24 w-full resize-y rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold leading-6 outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      />
    </label>
  );
}

export function DietaryField({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <label className="block md:col-span-2 2xl:col-span-3">
        <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
          {field.label}
        </span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 w-full resize-y rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold leading-6 outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
          {field.label}
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
        >
          {field.options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {field.label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      />
    </label>
  );
}

export function IntakeSummaryCard({ item }) {
  const isNormal = item.status === "normal";

  return (
    <article
      className={`rounded-[22px] border p-5 shadow-[var(--np-shadow-card)] ${
        isNormal
          ? "border-emerald-200 bg-emerald-50"
          : "border-[rgb(122_31_43_/_0.3)] bg-[var(--np-color-brand-soft)]"
      }`}
    >
      <p
        className={`text-xs font-extrabold uppercase tracking-wide ${
          isNormal ? "text-emerald-700" : "text-[var(--np-color-brand)]"
        }`}
      >
        {item.label}
      </p>
      <h3
        className={`mt-3 text-lg font-extrabold leading-7 ${
          isNormal ? "text-emerald-800" : "text-[var(--np-color-brand)]"
        }`}
      >
        {item.value}
      </h3>
    </article>
  );
}

export function ClinicalTextareaField({ field, value, onChange }) {
  if (field.type === "textarea") {
    return (
      <label className="block md:col-span-2 2xl:col-span-3">
        <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
          {field.label}
        </span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-28 w-full resize-y rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold leading-6 outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
        />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
          {field.label}
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
        >
          {field.options.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {field.label}
      </span>
      <input
        type={field.type === "date" ? "date" : "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      />
    </label>
  );
}

export function MedicalSummaryCard({ item }) {
  return (
    <article
      className={`rounded-[22px] border p-5 shadow-[var(--np-shadow-card)] ${
        item.active
          ? "border-[rgb(122_31_43_/_0.3)] bg-[var(--np-color-brand-soft)]"
          : "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)]"
      }`}
    >
      <p
        className={`text-xs font-extrabold uppercase tracking-wide ${
          item.active ? "text-[var(--np-color-brand)]" : "text-[var(--np-color-text-muted)]"
        }`}
      >
        {item.label}
      </p>
      <p className="mt-3 text-sm font-bold leading-6 text-[var(--np-color-text)]">
        {item.value}
      </p>
    </article>
  );
}

export function PesSection({ title, description, field, value, terms, onChange }) {
  const listId = `pes-${field}-terms`;

  return (
    <section className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <div className="mb-4">
        <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
          {title}
        </p>
        <p className="mt-2 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
          {description}
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-brand)]">
          Search standardized terms
        </span>
        <input
          list={listId}
          value={value}
          onChange={(event) => onChange(field, event.target.value)}
          className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
        />
        <datalist id={listId}>
          {terms.map((term) => (
            <option value={term} key={term} />
          ))}
        </datalist>
      </label>

      <div className="mt-4 max-h-36 space-y-2 overflow-y-auto pr-1">
        {terms.map((term) => (
          <button
            type="button"
            key={term}
            onClick={() => onChange(field, term)}
            className={`w-full rounded-2xl border px-3 py-2 text-left text-xs font-extrabold transition ${
              value === term
                ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]"
                : "border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
            }`}
          >
            {term}
          </button>
        ))}
      </div>
    </section>
  );
}

export function PesSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-extrabold text-[var(--np-color-text-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] px-4 py-3 text-sm font-bold outline-none transition focus:border-[var(--np-color-brand)] focus:bg-white focus:shadow-[var(--np-focus-ring)]"
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PesHistoryCard({ diagnosis, onEdit, onDelete }) {
  const priorityStyle = {
    High: "border-red-200 bg-red-50 text-red-700",
    Moderate: "border-amber-200 bg-amber-50 text-amber-700",
    Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[diagnosis.priority];

  const statusStyle = {
    Active: "border-[rgb(122_31_43_/_0.3)] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]",
    Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Monitoring: "border-blue-200 bg-blue-50 text-blue-700",
  }[diagnosis.status];

  return (
    <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            {diagnosis.patientName}
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--np-color-text-muted)]">
            Saved {diagnosis.savedAt}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${priorityStyle}`}>
            {diagnosis.priority}
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-extrabold ${statusStyle}`}>
            {diagnosis.status}
          </span>
        </div>
      </div>

      <p className="rounded-2xl bg-[var(--np-color-surface-muted)] p-4 text-sm font-bold leading-7 text-[var(--np-color-text)]">
        {diagnosis.statement}
      </p>

      <div className="mt-4 flex flex-col gap-2 border-t border-[var(--np-color-border-soft)] pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => onEdit(diagnosis)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--np-color-border)] bg-white px-4 py-2 text-xs font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)] sm:w-auto"
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(diagnosis.id)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-extrabold text-red-700 transition hover:border-red-200 hover:bg-red-100 sm:w-auto"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}

export function ResultCard({ result }) {
  const interpretationStyle = {
    normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
    low: "border-amber-200 bg-amber-50 text-amber-700",
    high: "border-red-200 bg-red-50 text-red-700",
    "requires follow-up": "border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] text-[var(--np-color-brand)]",
  }[result.interpretation];

  return (
    <article className="rounded-[22px] border border-[var(--np-color-border)] bg-white p-5 shadow-[var(--np-shadow-card)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
            {result.label}
          </p>
          <h3 className="mt-2 text-2xl font-extrabold text-[var(--np-color-brand)]">
            {result.value}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold capitalize ${interpretationStyle}`}
        >
          {result.interpretation}
        </span>
      </div>

      <p className="rounded-2xl bg-[var(--np-color-surface-muted)] p-3 text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
        {result.detail}
      </p>
    </article>
  );
}

export function FieldGrid({ fields }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {fields.map(([label, value]) => (
        <FieldRow key={label} label={label} value={value} />
      ))}
    </div>
  );
}

export function FieldRow({ label, value }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-4">
      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-sm font-extrabold leading-6 text-[var(--np-color-text)]">
        {value}
      </p>
    </div>
  );
}

export function HeaderMetric({ label, value }) {
  return (
    <div className="rounded-[20px] border border-[var(--np-color-border-soft)] bg-white p-4 shadow-[var(--np-shadow-sm)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[var(--np-color-text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-extrabold text-[var(--np-color-brand)]">
        {value}
      </p>
    </div>
  );
}





