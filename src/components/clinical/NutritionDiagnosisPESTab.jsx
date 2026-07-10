import { useEffect, useState } from "react";
import { ClipboardCheck, ClipboardList, FileText } from "lucide-react";
import { nutritionDiagnosisTerms, pesDefaults } from "./clinicalData";
import { buildPesStatement, getPesStorageKey } from "../../utils/clinicalWorkspaceUtils";
import { PesHistoryCard, PesSection, PesSelect, WorkspaceCard } from "./ClinicalShared";

export function PesTab({ patient }) {
  const storageKey = getPesStorageKey(patient);
  const [formValues, setFormValues] = useState(pesDefaults);
  const [statement, setStatement] = useState(() => buildPesStatement(pesDefaults));
  const [diagnosisHistory, setDiagnosisHistory] = useState(() => {
    const savedDiagnoses = localStorage.getItem(storageKey);
    return savedDiagnoses ? JSON.parse(savedDiagnoses) : [];
  });
  const [editingDiagnosisId, setEditingDiagnosisId] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(diagnosisHistory));
  }, [diagnosisHistory, storageKey]);

  function updateField(field, value) {
    const nextValues = {
      ...formValues,
      [field]: value,
    };

    setFormValues(nextValues);
    setStatement(buildPesStatement(nextValues));
  }

  function handleStatementChange(value) {
    setStatement(value);
  }

  function handleSave(event) {
    event.preventDefault();

    if (!statement.trim()) {
      return;
    }

    const savedDiagnosis = {
      id: editingDiagnosisId ?? `pes-${Date.now()}`,
      patientName: patient.fullName,
      statement: statement.trim(),
      problem: formValues.problem,
      etiology: formValues.etiology,
      signsSymptoms: formValues.signsSymptoms,
      priority: formValues.priority,
      status: formValues.status,
      savedAt: new Date().toLocaleString(),
    };

    setDiagnosisHistory((currentHistory) => {
      if (editingDiagnosisId) {
        return currentHistory.map((diagnosis) =>
          diagnosis.id === editingDiagnosisId ? savedDiagnosis : diagnosis,
        );
      }

      return [
        savedDiagnosis,
        ...currentHistory,
      ];
    });
    setEditingDiagnosisId(null);
  }

  function handleEditDiagnosis(diagnosis) {
    const nextValues = {
      problem: diagnosis.problem,
      etiology: diagnosis.etiology,
      signsSymptoms: diagnosis.signsSymptoms,
      priority: diagnosis.priority,
      status: diagnosis.status,
    };

    setEditingDiagnosisId(diagnosis.id);
    setFormValues(nextValues);
    setStatement(diagnosis.statement);
  }

  function handleDeleteDiagnosis(diagnosisId) {
    setDiagnosisHistory((currentHistory) =>
      currentHistory.filter((diagnosis) => diagnosis.id !== diagnosisId),
    );

    if (editingDiagnosisId === diagnosisId) {
      setEditingDiagnosisId(null);
      setFormValues(pesDefaults);
      setStatement(buildPesStatement(pesDefaults));
    }
  }

  function handleCancelEdit() {
    setEditingDiagnosisId(null);
    setFormValues(pesDefaults);
    setStatement(buildPesStatement(pesDefaults));
  }

  return (
    <div className="space-y-5">
      <WorkspaceCard title="Nutrition Care Process Workflow" icon={FileText}>
        <form className="space-y-5" onSubmit={handleSave}>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <PesSection
              title="Problem"
              description="Select the primary nutrition diagnosis problem."
              field="problem"
              value={formValues.problem}
              terms={nutritionDiagnosisTerms.problem}
              onChange={updateField}
            />
            <PesSection
              title="Etiology"
              description="Identify the root cause or contributing factor."
              field="etiology"
              value={formValues.etiology}
              terms={nutritionDiagnosisTerms.etiology}
              onChange={updateField}
            />
            <PesSection
              title="Signs & Symptoms"
              description="Document measurable evidence or reported symptoms."
              field="signsSymptoms"
              value={formValues.signsSymptoms}
              terms={nutritionDiagnosisTerms.signsSymptoms}
              onChange={updateField}
            />
          </div>

          <section className="grid grid-cols-1 gap-4 border-t border-[var(--np-color-border)] pt-5 md:grid-cols-2">
            <PesSelect
              label="Clinical priority"
              value={formValues.priority}
              options={["High", "Moderate", "Low"]}
              onChange={(value) => updateField("priority", value)}
            />
            <PesSelect
              label="Status"
              value={formValues.status}
              options={["Active", "Resolved", "Monitoring"]}
              onChange={(value) => updateField("status", value)}
            />
          </section>

          <section className="rounded-[22px] border border-[var(--np-color-border)] bg-[var(--np-color-surface-muted)] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--np-color-text-muted)]">
                  Live PES Statement
                </p>
                <h3 className="mt-1 text-lg font-extrabold text-[var(--np-color-brand)]">
                  Editable draft
                </h3>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[var(--np-color-brand)]">
                {formValues.priority} • {formValues.status}
              </span>
            </div>

            <textarea
              value={statement}
              onChange={(event) => handleStatementChange(event.target.value)}
              className="min-h-32 w-full resize-y rounded-2xl border border-[var(--np-color-border)] bg-white px-4 py-3 text-sm font-bold leading-7 text-[var(--np-color-text)] outline-none transition focus:border-[var(--np-color-brand)]"
            />
          </section>

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            {editingDiagnosisId ? (
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
              {editingDiagnosisId ? "Update Nutrition Diagnosis" : "Save Nutrition Diagnosis"}
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Diagnosis History" icon={ClipboardList}>
        {diagnosisHistory.length ? (
          <div className="space-y-3">
            {diagnosisHistory.map((diagnosis) => (
              <PesHistoryCard
                key={diagnosis.id}
                diagnosis={diagnosis}
                onEdit={handleEditDiagnosis}
                onDelete={handleDeleteDiagnosis}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 text-sm font-bold text-[var(--np-color-text-muted)]">
            No saved nutrition diagnosis yet for {patient.fullName}.
          </div>
        )}
      </WorkspaceCard>
    </div>
  );
}





