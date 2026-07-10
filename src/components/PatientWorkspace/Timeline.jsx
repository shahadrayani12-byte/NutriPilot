export default function Timeline() {
  return (
    <section className="pw-panel">
      <h3>Patient Timeline</h3>

      <div className="timeline-item">
        <strong>Initial Visit</strong>
        <p>IBS + iron deficiency recorded</p>
      </div>

      <div className="timeline-item">
        <strong>Lab Review</strong>
        <p>Ferritin and Hb require follow-up</p>
      </div>

      <div className="timeline-item">
        <strong>Nutrition Plan</strong>
        <p>Iron intake and GI tolerance strategy started</p>
      </div>
    </section>
  );
}