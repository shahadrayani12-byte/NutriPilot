import { useEffect, useState } from "react";
import { ClipboardCheck, ClipboardList, Target } from "lucide-react";
import { interventionDefaults, interventionGoalChips } from "./clinicalData";
import { generateInterventionDraft, getInterventionStorageKey } from "../../utils/clinicalWorkspaceUtils";
import { InterventionField, InterventionHistoryCard, WorkspaceCard } from "./ClinicalShared";

export function InterventionTab({ patient }) {
  const storageKey = getInterventionStorageKey(patient);
  const [selectedGoals, setSelectedGoals] = useState([
    "Improve oral intake",
    "Correct iron deficiency",
  ]);
  const [formValues, setFormValues] = useState(interventionDefaults);
  const [interventionHistory, setInterventionHistory] = useState(() => {
    const savedInterventions = localStorage.getItem(storageKey);
    return savedInterventions ? JSON.parse(savedInterventions) : [];
  });
  const [editingInterventionId, setEditingInterventionId] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(interventionHistory));
  }, [interventionHistory, storageKey]);

  function updateField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function toggleGoal(goal) {
    setSelectedGoals((currentGoals) =>
      currentGoals.includes(goal)
        ? currentGoals.filter((currentGoal) => currentGoal !== goal)
        : [...currentGoals, goal],
    );
  }

  function handleGenerateDraft() {
    setFormValues(generateInterventionDraft(selectedGoals, patient));
  }

  function handleSave(event) {
    event.preventDefault();

    const savedIntervention = {
      id: editingInterventionId ?? `intervention-${Date.now()}`,
      patientName: patient.fullName,
      goals: selectedGoals,
      plan: formValues,
      savedAt: new Date().toLocaleString(),
    };

    setInterventionHistory((currentHistory) => {
      if (editingInterventionId) {
        return currentHistory.map((intervention) =>
          intervention.id === editingInterventionId ? savedIntervention : intervention,
        );
      }

      return [
        savedIntervention,
        ...currentHistory,
      ];
    });
    setEditingInterventionId(null);
  }

  function handleEditIntervention(intervention) {
    setEditingInterventionId(intervention.id);
    setSelectedGoals(intervention.goals);
    setFormValues(intervention.plan);
  }

  function handleDeleteIntervention(interventionId) {
    setInterventionHistory((currentHistory) =>
      currentHistory.filter((intervention) => intervention.id !== interventionId),
    );

    if (editingInterventionId === interventionId) {
      setEditingInterventionId(null);
      setSelectedGoals(["Improve oral intake", "Correct iron deficiency"]);
      setFormValues(interventionDefaults);
    }
  }

  function handleCancelEdit() {
    setEditingInterventionId(null);
    setSelectedGoals(["Improve oral intake", "Correct iron deficiency"]);
    setFormValues(interventionDefaults);
  }

  return (
    <div className="space-y-5">
      <WorkspaceCard title="Nutrition Intervention Plan" icon={Target}>
        <form className="space-y-5" onSubmit={handleSave}>
          <section className="rounded-[22px] border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
                  Clinical Goal Builder
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-[var(--np-color-brand)]">
                  Select intervention priorities
                </h3>
              </div>
              <button
                type="button"
                onClick={handleGenerateDraft}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--np-color-brand)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--np-shadow-card)] transition hover:bg-[var(--np-color-brand-hover)] md:w-auto"
              >
                <ClipboardCheck className="h-4 w-4" />
                Generate Draft Intervention
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {interventionGoalChips.map((goal) => (
                <button
                  type="button"
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-extrabold transition ${
                    selectedGoals.includes(goal)
                      ? "border-[var(--np-color-brand)] bg-[var(--np-color-brand-soft)] text-[var(--np-color-brand)]"
                      : "border-[var(--np-color-border-soft)] bg-white text-[var(--np-color-text-muted)] hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)]"
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <InterventionField
              label="Nutrition Goals"
              value={formValues.nutritionGoals}
              onChange={(value) => updateField("nutritionGoals", value)}
            />
            <InterventionField
              label="Energy Prescription"
              value={formValues.energyPrescription}
              onChange={(value) => updateField("energyPrescription", value)}
            />
            <InterventionField
              label="Protein Prescription"
              value={formValues.proteinPrescription}
              onChange={(value) => updateField("proteinPrescription", value)}
            />
            <InterventionField
              label="Fluid Prescription"
              value={formValues.fluidPrescription}
              onChange={(value) => updateField("fluidPrescription", value)}
            />
            <InterventionField
              label="Diet Type"
              value={formValues.dietType}
              onChange={(value) => updateField("dietType", value)}
            />
            <InterventionField
              label="Meal Pattern"
              value={formValues.mealPattern}
              onChange={(value) => updateField("mealPattern", value)}
            />
            <InterventionField
              label="Supplements"
              value={formValues.supplements}
              onChange={(value) => updateField("supplements", value)}
            />
            <InterventionField
              label="Food Restrictions"
              value={formValues.foodRestrictions}
              onChange={(value) => updateField("foodRestrictions", value)}
            />
            <InterventionField
              label="Nutrition Education"
              value={formValues.nutritionEducation}
              onChange={(value) => updateField("nutritionEducation", value)}
            />
            <InterventionField
              label="Counseling Notes"
              value={formValues.counselingNotes}
              onChange={(value) => updateField("counselingNotes", value)}
            />
            <InterventionField
              label="Follow-up Plan"
              value={formValues.followUpPlan}
              onChange={(value) => updateField("followUpPlan", value)}
              wide
            />
          </section>

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            {editingInterventionId ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex w-full items-center justify-center rounded-2xl border border-[var(--np-color-border)] bg-white px-5 py-3 text-sm font-extrabold text-[var(--np-color-text-muted)] transition hover:border-[var(--np-color-brand)] hover:text-[var(--np-color-brand)] sm:w-auto"
              >
                Cancel edit
              </button>
            ) : null}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--np-color-brand)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--np-shadow-card)] transition hover:bg-[var(--np-color-brand-hover)] sm:w-auto"
            >
              <ClipboardCheck className="h-4 w-4" />
              {editingInterventionId ? "Update Intervention" : "Save Intervention"}
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Intervention History" icon={ClipboardList}>
        {interventionHistory.length ? (
          <div className="space-y-3">
            {interventionHistory.map((intervention) => (
              <InterventionHistoryCard
                key={intervention.id}
                intervention={intervention}
                onEdit={handleEditIntervention}
                onDelete={handleDeleteIntervention}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 text-sm font-bold text-[var(--np-color-text-muted)]">
            No saved nutrition intervention yet for {patient.fullName}.
          </div>
        )}
      </WorkspaceCard>
    </div>
  );
}




