import { useState } from "react";
import { Activity, ClipboardCheck, ClipboardList, FileText, Stethoscope } from "lucide-react";
import { medicalHistoryDefaults, medicalHistoryFields, medicalStructuredFields } from "./clinicalData";
import { buildMedicalSummary } from "../../utils/clinicalWorkspaceUtils";
import {
  ClinicalTextareaField,
  FieldRow,
  MedicalSummaryCard,
  WorkspaceCard,
} from "./ClinicalShared";

export function MedicalHistoryTab() {
  const [formValues, setFormValues] = useState(medicalHistoryDefaults);
  const [savedHistory, setSavedHistory] = useState(medicalHistoryDefaults);

  function updateField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleSave(event) {
    event.preventDefault();
    setSavedHistory(formValues);
  }

  const summaryItems = buildMedicalSummary(savedHistory);

  return (
    <div className="space-y-5">
      <WorkspaceCard title="Medical History Profile" icon={Stethoscope}>
        <form className="space-y-5" onSubmit={handleSave}>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {medicalHistoryFields.map((field) => (
              <ClinicalTextareaField
                key={field.key}
                field={field}
                value={formValues[field.key]}
                onChange={(value) => updateField(field.key, value)}
              />
            ))}
          </section>

          <section className="border-t border-[var(--np-color-border)] pt-5">
            <div className="mb-4 flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-[var(--np-color-brand)]" />
              <h3 className="text-lg font-extrabold">Structured Clinical Fields</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {medicalStructuredFields.map((field) => (
                <ClinicalTextareaField
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
              Save Medical History
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Clinical Summary" icon={Activity}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryItems.map((item) => (
            <MedicalSummaryCard key={item.label} item={item} />
          ))}
        </div>
      </WorkspaceCard>

      <WorkspaceCard title="Saved Medical Snapshot" icon={FileText}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <FieldRow label="Primary diagnosis" value={savedHistory.primaryDiagnosis} />
          <FieldRow label="Secondary diagnoses" value={savedHistory.secondaryDiagnoses} />
          <FieldRow label="Current medications" value={savedHistory.currentMedications} />
          <FieldRow label="GI complaints" value={savedHistory.giComplaints} />
          <FieldRow label="Physical activity" value={savedHistory.physicalActivity} />
          <FieldRow label="Lifestyle notes" value={savedHistory.lifestyleNotes} />
        </div>
      </WorkspaceCard>
    </div>
  );
}




