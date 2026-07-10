export function Panel({
  title,
  icon: Icon,
  children,
  className = "",
  padding = "p-6",
  headingMargin = "mb-5",
}) {
  return (
    <div
      className={`np-panel ${padding} ${className}`}
    >
      <div className={`${headingMargin} flex items-center gap-3`}>
        <span className="np-icon-tile">
          <Icon className="h-5 w-5" />
        </span>
        <h3 className="np-heading-section">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function Info({ label, value, className = "" }) {
  return (
    <div className={`np-card-muted flex justify-between text-sm ${className}`}>
      <span className="text-[var(--np-color-text-muted)]">{label}</span>
      <span className="font-extrabold text-[var(--np-color-brand)]">{value}</span>
    </div>
  );
}

export function Progress({ label, value, className = "mb-3" }) {
  return (
    <div className={className}>
      <div className="mb-1 flex justify-between text-sm font-bold">
        <span>{label}</span>
        <span className="text-[var(--np-color-brand)]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--np-color-border-soft)]">
        <div className="h-full rounded-full bg-[var(--np-color-brand)]" style={{ width: value }} />
      </div>
    </div>
  );
}

