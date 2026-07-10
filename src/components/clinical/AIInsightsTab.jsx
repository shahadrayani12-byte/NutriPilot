import { useEffect, useState } from "react";
import { Brain, ClipboardList } from "lucide-react";
import { buildAiAssessment, getAiAssessmentStorageKey, readJsonStorage } from "../../utils/clinicalWorkspaceUtils";
import { AiAssessmentHistoryCard, AiAssessmentResult, WorkspaceCard } from "./ClinicalShared";

export function AiInsightsTab({ patient }) {
  const storageKey = getAiAssessmentStorageKey(patient);
  const [currentAssessment, setCurrentAssessment] = useState(null);
  const [assessmentHistory, setAssessmentHistory] = useState(() =>
    readJsonStorage(storageKey),
  );

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(assessmentHistory));
  }, [assessmentHistory, storageKey]);

  function handleGenerateAssessment() {
    const assessment = buildAiAssessment(patient);
    setCurrentAssessment(assessment);
    setAssessmentHistory((currentHistory) => [
      assessment,
      ...currentHistory,
    ]);
  }

  function handleDeleteAssessment(assessmentId) {
    setAssessmentHistory((currentHistory) =>
      currentHistory.filter((assessment) => assessment.id !== assessmentId),
    );

    if (currentAssessment?.id === assessmentId) {
      setCurrentAssessment(null);
    }
  }

  return (
    <div className="space-y-5">
      <WorkspaceCard title="AI Clinical Assistant" icon={Brain}>
        <div className="space-y-5">
          <section className="rounded-[22px] border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
                  Rule-based clinical support
                </p>
                <h3 className="mt-1 text-xl font-extrabold text-[var(--np-color-brand)]">
                  Generate a structured nutrition insight for {patient.fullName}
                </h3>
                <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
                  AI recommendations support clinical decision-making and do not replace professional judgment.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAssessment}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--np-color-brand)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--np-shadow-card)] transition hover:bg-[var(--np-color-brand-hover)] lg:w-auto"
              >
                <Brain className="h-4 w-4" />
                Generate AI Assessment
              </button>
            </div>
          </section>

          {currentAssessment ? (
            <AiAssessmentResult assessment={currentAssessment} />
          ) : (
            <div className="rounded-2xl border border-[var(--np-color-border-soft)] bg-white p-5 text-sm font-bold text-[var(--np-color-text-muted)]">
              No AI assessment generated yet. Use the button above to create a rule-based clinical summary from available patient data.
            </div>
          )}
        </div>
      </WorkspaceCard>

      <WorkspaceCard title="AI Assessment History" icon={ClipboardList}>
        {assessmentHistory.length ? (
          <div className="space-y-3">
            {assessmentHistory.map((assessment) => (
              <AiAssessmentHistoryCard
                key={assessment.id}
                assessment={assessment}
                onDelete={handleDeleteAssessment}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 text-sm font-bold text-[var(--np-color-text-muted)]">
            No saved AI assessments yet for {patient.fullName}.
          </div>
        )}
      </WorkspaceCard>
    </div>
  );
}




