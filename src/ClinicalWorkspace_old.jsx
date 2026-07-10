export default function ClinicalWorkspace() {
  return (
    <div className="clinical-page">

      <div className="clinical-header">
        <h1>Sarah Ahmed</h1>
        <p>Female • 28 Years • IBS • Iron Deficiency</p>
        <span className="badge green">Stable</span>
      </div>

      <div className="clinical-tabs">
        <button>Overview</button>
        <button>Labs</button>
        <button>Nutrition</button>
        <button>NutriMap™</button>
        <button>AI</button>
        <button>Reports</button>
      </div>

      <div className="clinical-card big">
        <h2>NutriMap™</h2>

        <div className="body-map">
          <div className="organ brain">🧠</div>
          <div className="organ mouth">🦷</div>
          <div className="organ heart">❤️</div>
          <div className="organ liver">🫀</div>
          <div className="organ gut">🥣</div>
          <div className="organ muscle">💪</div>
        </div>
      </div>

    </div>
  );
}