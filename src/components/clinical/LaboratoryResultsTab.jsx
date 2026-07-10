import { useState } from "react";
import { Activity, ClipboardCheck, FileText, FlaskConical } from "lucide-react";
import { labDefaults, labReferenceRanges } from "./clinicalData";
import { buildLabClinicalSummary, evaluateLabResults } from "../../utils/clinicalWorkspaceUtils";
import { LabInput, LabResultCard, SummaryRiskCard, WorkspaceCard } from "./ClinicalShared";

export function LaboratoryTab() {
  const [formValues, setFormValues] = useState(labDefaults);
  const [savedResults, setSavedResults] = useState(() =>
    evaluateLabResults(labDefaults)
  );

  function updateField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleSave(event) {
    event.preventDefault();
    setSavedResults(evaluateLabResults(formValues));
  }

  const summaryItems = buildLabClinicalSummary(savedResults);

  return (
    <div className="space-y-5">
      <WorkspaceCard title="Laboratory Results Form" icon={FlaskConical}>
        <form className="space-y-5" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {labReferenceRanges.map((lab) => (
              <LabInput
                key={lab.key}
                lab={lab}
                value={formValues[lab.key]}
                onChange={(value) => updateField(lab.key, value)}
              />
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--np-color-brand)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--np-shadow-card)] transition hover:bg-[var(--np-color-brand-hover)] sm:w-auto"
            >
              <ClipboardCheck className="h-4 w-4" />
              Save Lab Results
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Clinical Lab Summary" icon={Activity}>
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-5">
          {summaryItems.map((item) => (
            <SummaryRiskCard key={item.label} item={item} />
          ))}
        </div>
      </WorkspaceCard>

      <WorkspaceCard title="Saved Lab Values" icon={FileText}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {savedResults.map((result) => (
            <LabResultCard key={result.key} result={result} />
          ))}
        </div>
      </WorkspaceCard>
    </div>
  );
}




