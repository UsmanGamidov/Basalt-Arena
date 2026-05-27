/** Кнопка «Сохранить изменения» и строка статуса для админских таблиц с черновиками. */
export function AdminSaveButton({ busy, dirtyCount, onClick, className = '' }) {
  return (
    <button
      type="button"
      disabled={busy || dirtyCount === 0}
      onClick={onClick}
      className={[
        'h-8 rounded-lg bg-turquoise/20 px-3 font-mono text-[10px] font-bold uppercase tracking-wide text-turquoise disabled:opacity-40',
        className,
      ].join(' ')}
    >
      {busy ? '…' : dirtyCount ? `Сохранить изменения (${dirtyCount})` : 'Сохранить изменения'}
    </button>
  )
}

export function AdminSaveToolbar({ statusText, busy, dirtyCount, onSave, className = '' }) {
  return (
    <div className={['flex flex-wrap items-center gap-2', className].filter(Boolean).join(' ')}>
      <span className="font-mono text-[11px] text-gull">{statusText}</span>
      <AdminSaveButton busy={busy} dirtyCount={dirtyCount} onClick={onSave} />
    </div>
  )
}
