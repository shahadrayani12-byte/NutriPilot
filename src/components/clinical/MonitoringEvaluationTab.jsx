import { useEffect, useState } from "react";
import { ClipboardCheck, HeartPulse } from "lucide-react";
import { monitoringDefaults, progressStatusOptions } from "./clinicalData";
import { getMonitoringStorageKey, interpretMonitoringVisit } from "../../utils/clinicalWorkspaceUtils";
import { InterventionField, MonitoringInput, MonitoringSelect, MonitoringSummary, MonitoringTimelineCard, WorkspaceCard } from "./ClinicalShared";

export function MonitoringTab({ patient }) {
  const storageKey = getMonitoringStorageKey(patient);
  const [formValues, setFormValues] = useState(monitoringDefaults);
  const [followUpVisits, setFollowUpVisits] = useState(() => {
    const savedVisits = localStorage.getItem(storageKey);
    return savedVisits ? JSON.parse(savedVisits) : [];
  });
  const [editingVisitId, setEditingVisitId] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(followUpVisits));
  }, [followUpVisits, storageKey]);

  function updateField(field, value) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));
  }

  function handleSave(event) {
    event.preventDefault();

    const savedVisit = {
      id: editingVisitId ?? `monitoring-${Date.now()}`,
      patientName: patient.fullName,
      ...formValues,
      interpretation: interpretMonitoringVisit(formValues),
      savedAt: new Date().toLocaleString(),
    };

    setFollowUpVisits((currentVisits) => {
      if (editingVisitId) {
        return currentVisits.map((visit) =>
          visit.id === editingVisitId ? savedVisit : visit,
        );
      }

      return [
        savedVisit,
        ...currentVisits,
      ];
    });
    setEditingVisitId(null);
  }

  function handleEditVisit(visit) {
    setEditingVisitId(visit.id);
    setFormValues({
      visitDate: visit.visitDate,
      weight: visit.weight,
      bmi: visit.bmi,
      appetiteStatus: visit.appetiteStatus,
      dietaryCompliance: visit.dietaryCompliance,
      symptoms: visit.symptoms,
      labChanges: visit.labChanges,
      goalsAchieved: visit.goalsAchieved,
      clinicalNotes: visit.clinicalNotes,
      nextFollowUpDate: visit.nextFollowUpDate,
      progressStatus: visit.progressStatus,
    });
  }

  function handleDeleteVisit(visitId) {
    setFollowUpVisits((currentVisits) =>
      currentVisits.filter((visit) => visit.id !== visitId),
    );

    if (editingVisitId === visitId) {
      setEditingVisitId(null);
      setFormValues(monitoringDefaults);
    }
  }

  function handleCancelEdit() {
    setEditingVisitId(null);
    setFormValues(monitoringDefaults);
  }

  return (
    <div className="space-y-5">
      <WorkspaceCard title="Monitoring & Evaluation" icon={ClipboardCheck}>
        <form className="space-y-5" onSubmit={handleSave}>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MonitoringInput
              label="Visit date"
              type="date"
              value={formValues.visitDate}
              onChange={(value) => updateField("visitDate", value)}
            />
            <MonitoringInput
              label="Weight"
              type="number"
              value={formValues.weight}
              onChange={(value) => updateField("weight", value)}
            />
            <MonitoringInput
              label="BMI"
              type="number"
              value={formValues.bmi}
              onChange={(value) => updateField("bmi", value)}
            />
            <MonitoringSelect
              label="Progress badge"
              value={formValues.progressStatus}
              options={progressStatusOptions}
              onChange={(value) => updateField("progressStatus", value)}
            />
            <MonitoringSelect
              label="Appetite status"
              value={formValues.appetiteStatus}
              options={["Good", "Fair", "Poor", "Variable"]}
              onChange={(value) => updateField("appetiteStatus", value)}
            />
            <MonitoringSelect
              label="Dietary compliance"
              value={formValues.dietaryCompliance}
              options={["High", "Moderate", "Low"]}
              onChange={(value) => updateField("dietaryCompliance", value)}
            />
            <MonitoringInput
              label="Next follow-up date"
              type="date"
              value={formValues.nextFollowUpDate}
              onChange={(value) => updateField("nextFollowUpDate", value)}
            />
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <InterventionField
              label="Symptoms Follow-up"
              value={formValues.symptoms}
              onChange={(value) => updateField("symptoms", value)}
            />
            <InterventionField
              label="Laboratory Follow-up"
              value={formValues.labChanges}
              onChange={(value) => updateField("labChanges", value)}
            />
            <InterventionField
              label="Goal Progress"
              value={formValues.goalsAchieved}
              onChange={(value) => updateField("goalsAchieved", value)}
            />
            <InterventionField
              label="Clinical Notes"
              value={formValues.clinicalNotes}
              onChange={(value) => updateField("clinicalNotes", value)}
            />
          </section>

          <MonitoringSummary formValues={formValues} />

          <div className="flex flex-col justify-end gap-3 sm:flex-row">
            {editingVisitId ? (
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
              {editingVisitId ? "Update Follow-up Visit" : "Save Follow-up Visit"}
            </button>
          </div>
        </form>
      </WorkspaceCard>

      <WorkspaceCard title="Follow-up Timeline" icon={HeartPulse}>
        {followUpVisits.length ? (
          <div className="space-y-3">
            {followUpVisits.map((visit) => (
              <MonitoringTimelineCard
                key={visit.id}
                visit={visit}
                onEdit={handleEditVisit}
                onDelete={handleDeleteVisit}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--np-color-border-soft)] bg-[var(--np-color-surface-muted)] p-5 text-sm font-bold text-[var(--np-color-text-muted)]">
            No follow-up visits recorded yet for {patient.fullName}.
          </div>
        )}
      </WorkspaceCard>
    </div>
  );
}




