export default function DashboardPanels() {
  return (
    <div className="dashboard-panels">

      <section className="panel">
        <h2>Recent Patients</h2>

        <div className="patient-row">
          <span>Sarah A.</span>
          <b>Low Ferritin</b>
        </div>

        <div className="patient-row">
          <span>Mohammed K.</span>
          <b>High BMI</b>
        </div>

        <div className="patient-row">
          <span>Reem H.</span>
          <b>Vitamin D Deficiency</b>
        </div>
      </section>

      <section className="panel">
        <h2>AI Alerts</h2>

        <div className="alert">
          🩸 Possible iron deficiency pattern detected.
        </div>

        <div className="alert">
          ⚠️ Patient needs nutrition risk screening.
        </div>

        <div className="alert">
          ☀️ Review vitamin D status for recent labs.
        </div>
      </section>

    </div>
  );
}