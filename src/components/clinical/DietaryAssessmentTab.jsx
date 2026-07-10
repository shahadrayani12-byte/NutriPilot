import { useState } from "react";
import { Activity, Apple, ClipboardCheck, ClipboardList, FileText } from "lucide-react";
import { dietaryAssessmentFields, dietaryDefaults, dietaryMealFields } from "./clinicalData";
import { buildDietarySummary } from "../../utils/clinicalWorkspaceUtils";
import {
  DietaryField,
  FieldRow,
  IntakeSummaryCard,
  MealRecallCard,
  WorkspaceCard,
} from "./ClinicalShared";

export function DietaryTab() {
  const [formValues, setFormValues] = useState(dietaryDefaults);
  const [savedAssessment, setSavedAssessment] = useState(dietaryDefaults);

  function updateField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleSave(event) {
    event.preventDefault();
    setSavedAssessment(formValues);
  }

  const summaryItems = buildDietarySummary(savedAssessment);

  return (
    <div className="space-y-5">
      <WorkspaceCard title="24-Hour Dietary Recall" icon={Apple}>
        <form className="space-y-5" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {dietaryMealFields.map((meal) => (
              <MealRecallCard
                key={meal.key}
                label={meal.label}
                value={formValues[meal.key]}
                onChange={(value) => updateField(meal.key, value)}
              />
            ))}
          </div>

          <section className="border-t border-[var(--np-color-border)] pt-5">
            <div className="mb-4 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-[var(--np-color-brand)]" />
              <h3 className="text-lg font-extrabold">Dietary Assessment Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {dietaryAssessmentFields.map((field) => (
                <DietaryField
                  key={field.key}
                  field={field}
                  value={formValues[field.key]}
                  onChange={(value) => updateField(field.key, value)}
                />
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--np-color-brand)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--np-shadow-card)] transition hover:bg-[var(--np-color-brand-hover)] sm:w-auto"
            >
              <ClipboardCheck className="h-4 w-4" />
              Save Dietary Assessment
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Nutrition Intake Summary" icon={Activity}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <IntakeSummaryCard key={item.label} item={item} />
          ))}
        </div>
      </WorkspaceCard>

      <WorkspaceCard title="Saved Dietary Snapshot" icon={FileText}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldRow label="Meal pattern" value={savedAssessment.mealPattern} />
          <FieldRow label="Appetite level" value={savedAssessment.appetiteLevel} />
          <FieldRow label="Water intake" value={savedAssessment.waterIntake} />
          <FieldRow label="Caffeine intake" value={savedAssessment.caffeineIntake} />
          <FieldRow label="Bowel habits" value={savedAssessment.bowelHabits} />
          <FieldRow label="Nutrition barriers" value={savedAssessment.nutritionBarriers} />
        </div>
      </WorkspaceCard>
    </div>
  );
}




