import { usePatientStore } from "../../store/patientStore";

export default function RecentLabs() {
  const patient = usePatientStore((state) => state.patient);

  return (
    <section className="pw-panel">
      <h3>Recent Laboratory Results</h3>

      <table className="labs-table">
        <tbody>
          <tr>
            <td>Ferritin</td>
            <td>{patient.labs.ferritin} ng/mL</td>
            <td className="status-low">Low</td>
          </tr>

          <tr>
            <td>Hemoglobin</td>
            <td>{patient.labs.hemoglobin} g/dL</td>
            <td className="status-low">Low</td>
          </tr>

          <tr>
            <td>Vitamin D</td>
            <td>{patient.labs.vitaminD} ng/mL</td>
            <td className="status-low">Low</td>
          </tr>

          <tr>
            <td>Albumin</td>
            <td>{patient.labs.albumin}</td>
            <td className="status-normal">Normal</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}