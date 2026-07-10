export default function NutriMapCard({ setActiveTab }) {
  return (
    <section className="pw-panel nutrimap-mini">
      <h3>NutriMap™ Snapshot</h3>

      <div className="mini-body">
        <span>Brain</span>
        <span>Heart</span>
        <span>Gut</span>
        <span>Bone</span>
      </div>

      <p>Gut and iron-related indicators need review.</p>

      <button className="pw-action-btn" onClick={() => setActiveTab("nutrimap")}>
        Open NutriMap™
      </button>
    </section>
  );
}