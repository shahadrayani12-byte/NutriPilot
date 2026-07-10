import { Activity, UserRound } from "lucide-react";

import { HeaderMetric } from "./ClinicalShared";

export function ClinicalWorkspaceHeader({ patient }) {
  const initials = patient.fullName
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2);

  return (
    <section className="mb-5 overflow-hidden rounded-[32px] border border-[var(--np-color-border-soft)] bg-white shadow-[var(--np-shadow-card)]">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="p-6 lg:p-7">
          <div className="flex min-w-0 items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[26px] bg-[var(--np-color-brand)] text-2xl font-extrabold text-white shadow-[var(--np-shadow-card)]">
              {initials}
            </div>

            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--np-color-brand)]">
                <UserRound className="h-4 w-4" />
                Clinical Patient File
              </p>
              <h1 className="truncate text-4xl font-extrabold leading-tight text-[var(--np-color-text)]">
                {patient.fullName}
              </h1>
              <p className="mt-2 text-sm font-bold text-[var(--np-color-text-muted)]">
                {patient.gender} • {patient.age} years
              </p>
              <p className="mt-2 flex items-center gap-2 font-extrabold text-[var(--np-color-brand)]">
                <Activity className="h-4 w-4" />
                {patient.diagnosis}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 sm:grid-cols-3 xl:border-l xl:border-t-0">
          <HeaderMetric label="Height" value={patient.height ? `${patient.height} cm` : "Pending"} />
          <HeaderMetric label="Weight" value={patient.weight ? `${patient.weight} kg` : "Pending"} />
          <HeaderMetric label="BMI" value="Pending" />
        </div>
      </div>
    </section>
  );
}






