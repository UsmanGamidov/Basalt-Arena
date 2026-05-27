import { groupSprintsForAdminSidebar } from '../../lib/adminSprints.js'
import { formatSprintTitle } from '../../lib/sprintIds.js'

function SprintListButton({ sprint, active, onSelect }) {
  const s = sprint
  const title = (s.tabLabel ?? s.title)?.trim() || formatSprintTitle(s.id, '')

  return (
    <li className="shrink-0 xl:shrink">
      <button
        type="button"
        onClick={() => onSelect(String(s.id))}
        className={[
          'w-[min(260px,75vw)] rounded-lg px-3 py-2.5 text-left transition xl:w-full',
          active ? 'bg-turquoise/15 ring-1 ring-turquoise/30' : 'text-catskill hover:bg-white/5',
        ].join(' ')}
      >
        <div className="flex items-start gap-2">
          <span
            className={[
              'mt-0.5 shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold',
              active ? 'bg-turquoise/25 text-turquoise' : 'bg-fiord/50 text-half-baked',
            ].join(' ')}
          >
            #{s.id}
          </span>
          <div className="min-w-0 flex-1">
            <span className={['block truncate text-sm', active ? 'font-semibold text-turquoise' : ''].join(' ')}>
              {title}
            </span>
          </div>
        </div>
        <span className="mt-1.5 flex flex-wrap gap-1">
          {s.isMainActive ? (
            <span className="inline-block rounded bg-turquoise/20 px-1.5 py-0.5 font-mono text-[10px] text-turquoise">
              на главной
            </span>
          ) : null}
          {s.published === false ? (
            <span className="inline-block rounded bg-fiord/40 px-1.5 py-0.5 font-mono text-[10px] text-gull">
              черновик
            </span>
          ) : null}
        </span>
      </button>
    </li>
  )
}

export function AdminSprintSidebar({
  sprints,
  filteredSprints,
  searchQuery,
  onSearchChange,
  selectedId,
  onSelect,
  children,
}) {
  const groups = groupSprintsForAdminSidebar(filteredSprints)
  const mainCount = sprints.filter((s) => s.isMainActive).length
  const showGroupHeaders = filteredSprints.length > 4

  return (
    <aside className="flex flex-col gap-3 xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:self-start">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-xs font-bold uppercase tracking-[1.2px] text-slate-arena">
          Спринты
        </h2>
        <span className="font-mono text-[10px] text-gull">
          {filteredSprints.length === sprints.length
            ? `${sprints.length}`
            : `${filteredSprints.length} / ${sprints.length}`}
          {mainCount > 0 ? ` · ${mainCount} на главной` : ''}
        </span>
      </div>
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск: id, название, вкладка…"
        className="h-8 shrink-0 rounded-lg border border-plantation bg-aztec px-3 font-mono text-xs text-catskill"
      />
      <ul className="flex min-h-0 flex-row gap-2 overflow-x-auto overscroll-x-contain rounded-xl border border-plantation bg-timber/40 p-2 [-webkit-overflow-scrolling:touch] xl:max-h-[min(52vh,480px)] xl:flex-1 xl:flex-col xl:gap-0 xl:overflow-y-auto xl:overflow-x-hidden">
        {filteredSprints.length === 0 ? (
          <li className="px-3 py-4 font-mono text-xs text-gull">
            {searchQuery.trim() ? 'Ничего не найдено' : 'Нет спринтов'}
          </li>
        ) : showGroupHeaders ? (
          groups.map((group) => (
            <li key={group.id} className="xl:mb-2">
              <p className="hidden px-2 py-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-half-baked xl:block">
                {group.label} ({group.items.length})
              </p>
              <ul className="flex flex-row gap-2 xl:flex-col xl:gap-1">
                {group.items.map((s) => (
                  <SprintListButton
                    key={s.id}
                    sprint={s}
                    active={String(s.id) === String(selectedId)}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </li>
          ))
        ) : (
          filteredSprints.map((s) => (
            <SprintListButton
              key={s.id}
              sprint={s}
              active={String(s.id) === String(selectedId)}
              onSelect={onSelect}
            />
          ))
        )}
      </ul>
      <div className="shrink-0">{children}</div>
    </aside>
  )
}
