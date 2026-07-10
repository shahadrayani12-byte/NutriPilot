import { useState } from "react";
import { Activity, Calculator, Ruler } from "lucide-react";
import { anthropometricDefaults } from "./clinicalData";
import { calculateAnthropometricResults } from "../../utils/clinicalWorkspaceUtils";
import { AnthropometricInput, AnthropometricSelect, ResultCard, WorkspaceCard } from "./ClinicalShared";

export function AnthropometricTab({ patient }) {
  const [formValues, setFormValues] = useState(() => ({
    ...anthropometricDefaults,
    height: patient.height || "",
    weight: patient.weight || "",
    age: patient.age || "",
    gender: patient.gender || "",
    usualBodyWeight: patient.weight || "",
  }));
  const [results, setResults] = useState(null);

  function updateField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleCalculate(event) {
    event.preventDefault();
    setResults(calculateAnthropometricResults(formValues));
  }

  return (
    <div className="space-y-5">
      <WorkspaceCard title="Anthropometric Clinical Form" icon={Ruler}>
        <form className="space-y-5" onSubmit={handleCalculate}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
            <AnthropometricInput
              label="Height (cm)"
              value={formValues.height}
              onChange={(value) => updateField("height", value)}
            />
            <AnthropometricInput
              label="Weight (kg)"
              value={formValues.weight}
              onChange={(value) => updateField("weight", value)}
            />
            <AnthropometricInput
              label="Age"
              value={formValues.age}
              onChange={(value) => updateField("age", value)}
            />
            <AnthropometricSelect
              label="Gender"
              value={formValues.gender}
              onChange={(value) => updateField("gender", value)}
            />
            <AnthropometricInput
              label="Usual body weight (kg)"
              value={formValues.usualBodyWeight}
              onChange={(value) => updateField("usualBodyWeight", value)}
            />
            <AnthropometricInput
              label="Ideal body weight (kg)"
              value={formValues.idealBodyWeight}
              onChange={(value) => updateField("idealBodyWeight", value)}
            />
            <AnthropometricInput
              label="Activity factor"
              value={formValues.activityFactor}
              step="0.01"
              onChange={(value) => updateField("activityFactor", value)}
            />
            <AnthropometricInput
              label="Stress factor"
              value={formValues.stressFactor}
              step="0.01"
              onChange={(value) => updateField("stressFactor", value)}
            />
            <AnthropometricInput
              label="MUAC (cm)"
              value={formValues.muac}
              onChange={(value) => updateField("muac", value)}
            />
            <AnthropometricInput
              label="TSF (mm)"
              value={formValues.tsf}
              onChange={(value) => updateField("tsf", value)}
            />
            <AnthropometricInput
              label="Waist circumference (cm)"
              value={formValues.waistCircumference}
              onChange={(value) => updateField("waistCircumference", value)}
            />
            <AnthropometricInput
              label="Hip circumference (cm)"
              value={formValues.hipCircumference}
              onChange={(value) => updateField("hipCircumference", value)}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--np-color-brand)] px-5 py-3 text-sm font-extrabold text-white shadow-[var(--np-shadow-card)] transition hover:bg-[var(--np-color-brand-hover)] sm:w-auto"
            >
              <Calculator className="h-4 w-4" />
              Calculate
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Anthropometric Results" icon={Activity}>
        {results ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {results.map((result) => (
              <ResultCard key={result.label} result={result} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 text-sm font-bold text-[var(--np-color-text-muted)]">
            Enter assessment values and click Calculate to display clinical
            estimates.
          </div>
        )}
      </WorkspaceCard>
    </div>
  );
}




