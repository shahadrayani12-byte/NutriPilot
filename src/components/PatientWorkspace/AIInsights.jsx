import { usePatientStore } from "../../store/patientStore";

export default function AIInsights() {
  const patient = usePatientStore((state) => state.patient);

  return (
    <section className="pw-panel">
      <h3>AI Clinical Insights</h3>

      <p>
        Ferritin {patient.labs.ferritin} ng/mL with hemoglobin{" "}
        {patient.labs.hemoglobin} g/dL suggests a need to review iron intake,
        absorption factors, and GI tolerance.
      </p>

      <button className="pw-action-btn">Generate Care Plan</button>
    </section>
  );
}