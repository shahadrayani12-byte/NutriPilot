import { usePatientStore } from "../../store/patientStore";
import { getClinicalAlerts } from "../../services/clinicalRules";

export default function ClinicalAlerts() {
  const patient = usePatientStore((state) => state.patient);
  const alerts = getClinicalAlerts(patient);

  return (
    <section className="pw-panel">
      <h3>Clinical Alerts</h3>

      {alerts.map((alert, index) => (
        <div className={`alert-row ${alert.level}`} key={index}>
          <strong>{alert.title}</strong>
          <p>{alert.message}</p>
        </div>
      ))}
    </section>
  );
}