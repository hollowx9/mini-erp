function StatCard({ title, value, icon, variant = "blue" }) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div>
          <h4>{title}</h4>
          <p>{value}</p>
        </div>

        <div className={`stat-card-icon stat-card-icon-${variant}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatCard;