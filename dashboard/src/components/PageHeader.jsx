// En-tete de page reutilisable - version dark mode
export default function PageHeader({ title, subtitle, children }) {
  return (
    <div
      className="px-7 py-5 flex items-center justify-between"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-1 text-[var(--text-tertiary)] uppercase tracking-wider">
            {subtitle}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
