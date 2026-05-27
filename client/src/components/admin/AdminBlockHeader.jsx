export function AdminBlockHeader({
  title,
  icon = null,
  titleClassName = 'font-mono text-xs font-bold uppercase text-slate-arena',
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className={`flex min-w-0 items-center gap-2 ${titleClassName}`}>
        {icon}
        <span className="truncate">{title}</span>
      </h2>
    </div>
  )
}
