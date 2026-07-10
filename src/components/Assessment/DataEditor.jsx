import { usePatientStore } from "../../store/patientStore";

export default function DataEditor() {
  const patient = usePatientStore((state) => state.patient);
  const updatePatient = usePatientStore((state) => state.updatePatient);

  function updateLab(field, value) {
    updatePatient({
      labs: {
        ...patient.labs,
        [field]: value,
      },
    });
  }

  return (
    <div className="data-editor">
      <h3>Quick Lab Editor</h3>

      <label>
        Ferritin
        <input
          type="number"
          value={patient.labs.ferritin}
          onChange={(e) => updateLab("ferritin", e.target.value)}
        />
      </label>

      <label>
        Vitamin D
        <input
          type="number"
          value={patient.labs.vitaminD}
          onChange={(e) => updateLab("vitaminD", e.target.value)}
        />
      </label>

      <label>
        Hemoglobin
        <input
          type="number"
          value={patient.labs.hemoglobin}
          onChange={(e) => updateLab("hemoglobin", e.target.value)}
        />
      </label>
    </div>
  );
}