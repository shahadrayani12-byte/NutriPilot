export default function CarePlan() {
  return (
    <section className="pw-panel">
      <h3>Nutrition Care Plan</h3>

      <div className="care-row">
        <strong>Goal</strong>
        <p>Improve iron status and reduce GI discomfort.</p>
      </div>

      <div className="care-row">
        <strong>Intervention</strong>
        <p>Iron-rich meals + absorption strategy + low-FODMAP fiber plan.</p>
      </div>

      <div className="care-row">
        <strong>Monitoring</strong>
        <p>Recheck ferritin, Hb, GI symptoms in 4 weeks.</p>
      </div>
    </section>
  );
}