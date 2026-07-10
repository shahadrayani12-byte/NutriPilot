export default function PatientTabs({ activeTab, setActiveTab }) {
  const tabs = [
    "overview",
    "assessment",
    "laboratory",
    "nutrition",
    "nutrimap",
    "ai",
    "reports",
    "timeline",
  ];

  return (
    <nav className="pw-tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? "active" : ""}
          onClick={() => setActiveTab(tab)}
        >
          {tab === "nutrimap" ? "NutriMap™" : tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </nav>
  );
}