export default function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">📊</div>

      <div className="stat-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>

      <span className="stat-growth">
        ↑ 12%
      </span>
    </div>
  );
}