export function NutriPage({ children, className = "" }) {
  return <div className={`np-page ${className}`}>{children}</div>;
}

export function NutriPageMain({ children, className = "" }) {
  return <main className={`np-page-main ${className}`}>{children}</main>;
}

export function NutriPageHeader({ kicker, title, subtitle, actions }) {
  return (
    <header className="np-page-header xl:grid-cols-[minmax(0,1fr)_auto]">
      <div>
        {kicker ? <p className="np-page-kicker">{kicker}</p> : null}
        <h1 className="np-page-title">{title}</h1>
        {subtitle ? <p className="np-page-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}

export function NutriPanel({ children, className = "" }) {
  return <section className={`np-panel ${className}`}>{children}</section>;
}

export function NutriCard({ children, className = "", interactive = false }) {
  return (
    <article className={`${interactive ? "np-interactive-card" : "np-card"} ${className}`}>
      {children}
    </article>
  );
}

export function NutriSectionHeader({ icon: Icon, kicker, title, action }) {
  return (
    <div className="np-section-header">
      <div className="np-section-heading-group">
        {Icon ? (
          <span className="np-icon-tile">
            <Icon className="h-5 w-5" />
          </span>
        ) : null}
        <div>
          {kicker ? (
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--np-color-text-muted)]">
              {kicker}
            </p>
          ) : null}
          <h2 className="np-heading-section mt-1">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

export function NutriButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const variantClass = {
    danger: "np-button-danger",
    ghost: "np-button-ghost",
    primary: "np-button-primary",
    secondary: "np-button-secondary",
  }[variant];

  return (
    <button className={`np-button ${variantClass} ${className}`} type={type} {...props}>
      {children}
    </button>
  );
}

export function NutriBadge({ children, tone = "brand", className = "" }) {
  const toneClass = {
    accent: "np-badge-accent",
    brand: "np-badge-brand",
    danger: "np-badge-danger",
    info: "np-badge-info",
    secondary: "np-badge-secondary",
    success: "np-badge-success",
    warning: "np-badge-warning",
  }[tone];

  return <span className={`np-badge ${toneClass} ${className}`}>{children}</span>;
}

export function NutriInput({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="np-form-label">{label}</span> : null}
      <input className={`np-form-control ${className}`} {...props} />
    </label>
  );
}

export function NutriTextarea({ label, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="np-form-label">{label}</span> : null}
      <textarea className={`np-form-control ${className}`} {...props} />
    </label>
  );
}

export function NutriSelect({ label, children, className = "", ...props }) {
  return (
    <label className="block">
      {label ? <span className="np-form-label">{label}</span> : null}
      <select className={`np-form-control ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}

export function NutriAlert({ children, tone = "brand", className = "" }) {
  const toneClass = {
    brand: "np-alert-brand",
    danger: "np-alert-danger",
    info: "np-alert-info",
    warning: "np-alert-warning",
  }[tone];

  return <div className={`np-alert ${toneClass} ${className}`}>{children}</div>;
}

export function NutriEmptyState({ icon: Icon, title, children, action, className = "" }) {
  return (
    <section className={`np-empty-state ${className}`}>
      {Icon ? (
        <span className="np-icon-tile mx-auto mb-3">
          <Icon className="h-5 w-5" />
        </span>
      ) : null}
      {title ? <h3 className="text-base font-extrabold text-[var(--np-color-text)]">{title}</h3> : null}
      {children ? (
        <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-[var(--np-color-text-muted)]">
          {children}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </section>
  );
}

export function NutriLoadingState({ rows = 3, className = "" }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <div className="np-loading-skeleton h-12" key={index} />
      ))}
    </div>
  );
}

export function NutriTabs({ items, activeItem, onChange, className = "" }) {
  return (
    <div className={`np-tab-list ${className}`}>
      {items.map((item) => (
        <button
          className={`np-tab ${activeItem === item.id ? "np-tab-active" : ""}`}
          key={item.id}
          onClick={() => onChange(item.id)}
          type="button"
        >
          {item.icon ? <item.icon className="h-4 w-4" /> : null}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function NutriModal({ children, onClose, title, kicker, className = "" }) {
  return (
    <div className="np-modal-backdrop">
      <section className={`np-modal ${className}`}>
        {title ? (
          <header className="flex items-center justify-between gap-4 border-b border-[var(--np-color-border-soft)] p-5">
            <div>
              {kicker ? <p className="np-page-kicker">{kicker}</p> : null}
              <h2 className="mt-2 text-2xl font-extrabold text-[var(--np-color-text)]">{title}</h2>
            </div>
            {onClose ? (
              <button className="np-button np-button-secondary min-h-10 px-3" onClick={onClose} type="button">
                Close
              </button>
            ) : null}
          </header>
        ) : null}
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}
