export default function Sidebar({ setPage }) {
  return (
    <aside className="sidebar">

      <h2>🥗 NutriPilot</h2>

      <button onClick={() => setPage("dashboard")}>🏠 Dashboard</button>
      <button onClick={() => setPage("patients")}>👤 Patients</button>
      <button>🧪 Laboratory</button>
      <button>📏 Anthropometric</button>
      <button>🍎 Diet Plans</button>
      <button>🤖 AI Assistant</button>
      <button>📄 Reports</button>
      <button>⚙ Settings</button>

    </aside>
  );
}