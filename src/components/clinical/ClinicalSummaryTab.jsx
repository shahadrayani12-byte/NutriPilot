import { Activity, ClipboardList, HeartPulse, Ruler, User } from "lucide-react";

import { FieldGrid, WorkspaceCard } from "./ClinicalShared";

function valueOrPending(value, suffix = "") {
  return value ? `${value}${suffix}` : "Pending";
}

function getCarePriority(patient) {
  if (patient.riskLevel === "High Risk") {
    return "High priority nutrition review";
  }

  if (patient.riskLevel === "Moderate Risk") {
    return "Moderate priority follow-up";
  }

  return "Routine nutrition follow-up";
}

export function SummaryTab({ patient }) {
  const bmi = patient.bmi || "Pending";
  const riskLevel = patient.riskLevel || "Not classified";

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <WorkspaceCard title="Patient Snapshot" icon={User}>
        <FieldGrid
          fields={[
            ["Full name", patient.fullName],
            ["Age / Sex", `${patient.age} years / ${patient.gender}`],
            ["Primary diagnosis", patient.diagnosis || "No diagnosis recorded"],
          ]}
        />
      </WorkspaceCard>

      <WorkspaceCard title="Key Anthropometrics" icon={Ruler}>
        <FieldGrid
          fields={[
            ["Height", valueOrPending(patient.height, " cm")],
            ["Weight", valueOrPending(patient.weight, " kg")],
            ["BMI", bmi],
            ["Last visit", patient.lastVisit || "Not recorded"],
          ]}
        />
      </WorkspaceCard>

      <WorkspaceCard title="Nutrition Risk & Care Priority" icon={HeartPulse}>
        <FieldGrid
          fields={[
            ["Nutrition risk", riskLevel],
            ["Care priority", getCarePriority(patient)],
            ["Clinical focus", patient.diagnosis ? `Nutrition support for ${patient.diagnosis}` : "Complete clinical assessment"],
            ["Follow-up need", patient.nextFollowUp || "To be scheduled"],
          ]}
        />
      </WorkspaceCard>

      <WorkspaceCard title="Clinical Notes" icon={ClipboardList}>
        <div className="rounded-[16px] bg-[var(--np-color-surface-muted)] p-4">
          <div className="mb-2 flex items-center gap-2 text-[var(--np-color-brand)]">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-extrabold uppercase tracking-[0.14em]">Care context</span>
          </div>
          <p className="text-sm font-bold leading-7 text-[var(--np-color-text-muted)]">
            {patient.notes || "Review the patient's nutrition context, risk level, priority, and care readiness before opening detailed clinical modules."}
          </p>
        </div>
      </WorkspaceCard>
    </div>
  );
}
