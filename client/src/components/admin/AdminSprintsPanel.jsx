import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { AdminNumberInput } from './AdminNumberInput.jsx'
import { AdminSprintSidebar } from './AdminSprintSidebar.jsx'
import { SprintTaskFields } from './SprintTaskFields.jsx'
import { SprintTitleField } from './SprintTitleField.jsx'

export function AdminSprintsPanel({
  sprints,
  filteredSprints,
  searchQuery,
  onSearchChange,
  selectedId,
  onSelect,
  suggestedSprintId,
  createTabLabel,
  onCreateTabLabelChange,
  createEndsAtLocal,
  onCreateEndsAtLocalChange,
  createPublished,
  onCreatePublishedChange,
  creating,
  onCreateSprint,
  selected,
  tabLabel,
  onTabLabelChange,
  taskQuote,
  onTaskQuoteChange,
  taskBody,
  onTaskBodyChange,
  taskAcceptance,
  onTaskAcceptanceChange,
  taskLinks,
  onTaskLinksChange,
  endsAtLocal,
  onEndsAtLocalChange,
  prizeMoney,
  onPrizeMoneyChange,
  tagsText,
  onTagsTextChange,
  published,
  onPublishedChange,
  isMainActive,
  onMainActiveChange,
  saving,
  onSave,
  onDeleteSprint,
  onOpenPreview,
}) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:items-start xl:gap-8">
      <AdminSprintSidebar
        sprints={sprints}
        filteredSprints={filteredSprints}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedId={selectedId}
        onSelect={onSelect}
      >
        <div className="rounded-xl border border-plantation bg-timber/40 p-4">
          <h2 className="mb-3 font-mono text-xs font-bold uppercase tracking-[1.2px] text-slate-arena">
            Новый спринт
          </h2>
          <form onSubmit={onCreateSprint} className="flex flex-col gap-3">
            <p className="font-mono text-[11px] text-gull">
              ID: <span className="text-catskill">{suggestedSprintId}</span>
              <span className="text-half-baked"> (следующий после максимального)</span>
            </p>
            <SprintTitleField value={createTabLabel} onChange={onCreateTabLabelChange} />
            <input
              type="datetime-local"
              value={createEndsAtLocal}
              onChange={onCreateEndsAtLocalChange}
              className="rounded-lg border border-plantation bg-aztec px-3 py-2 text-sm text-catskill"
              title="Дедлайн спринта"
            />
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={createPublished}
                onChange={onCreatePublishedChange}
                className="size-4 rounded border-plantation bg-aztec"
              />
              <span className="font-mono text-xs text-catskill">Сразу опубликовать</span>
            </label>
            <p className="font-mono text-[10px] leading-relaxed text-half-baked">
              Описание, теги и задание — после создания в форме редактирования.
            </p>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-turquoise py-2 font-mono text-xs font-bold text-aztec disabled:opacity-50"
            >
              {creating ? '…' : 'Создать'}
            </button>
          </form>
        </div>
      </AdminSprintSidebar>

      <section className="flex flex-col gap-8">
        {selected ? (
          <>
            <form
              onSubmit={onSave}
              className="flex flex-col gap-5 rounded-xl border border-plantation bg-timber p-6 max-[360px]:p-4"
            >
              <div className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-plantation/70 pb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <MaterialIcon name="edit_note" size={22} className="text-turquoise" />
                  Редактирование спринта
                </h2>
                <button
                  type="button"
                  onClick={onDeleteSprint}
                  className="shrink-0 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-1.5 font-mono text-xs font-bold text-red-200 transition hover:bg-red-950/50 max-[360px]:w-full"
                >
                  Удалить спринт
                </button>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="pl-1 font-mono text-[10px] font-bold uppercase tracking-[1px] text-half-baked">
                  id
                </span>
                <input
                  readOnly
                  value={String(selected.id)}
                  className="rounded-lg border border-plantation bg-aztec/80 px-3 py-2 font-mono text-sm text-gull"
                />
              </label>

              <SprintTitleField value={tabLabel} onChange={onTabLabelChange} />

              <SprintTaskFields
                taskQuote={taskQuote}
                setTaskQuote={onTaskQuoteChange}
                taskBody={taskBody}
                setTaskBody={onTaskBodyChange}
                acceptanceLines={taskAcceptance}
                setAcceptanceLines={onTaskAcceptanceChange}
                usefulLinksText={taskLinks}
                setUsefulLinksText={onTaskLinksChange}
              />

              <label className="flex flex-col gap-1.5">
                <span className="pl-1 font-mono text-[10px] font-bold uppercase tracking-[1px] text-half-baked">
                  Дедлайн спринта (обязательно)
                </span>
                <input
                  type="datetime-local"
                  value={endsAtLocal}
                  onChange={onEndsAtLocalChange}
                  required
                  className="rounded-lg border border-plantation bg-aztec px-3 py-2 text-sm text-catskill"
                />
                <span className="pl-1 font-mono text-[11px] leading-relaxed text-gull">
                  Момент окончания приёма решений. Таймер на главной и в зале считает вниз от этой даты; после
                  истечения спринт остаётся в зале, но отправки и статус «система активна» отключаются. Чтобы
                  продлить — измените дату и сохраните.
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="pl-1 font-mono text-[10px] font-bold uppercase tracking-[1px] text-half-baked">
                  Призовые, ₽
                </span>
                <AdminNumberInput
                  value={prizeMoney}
                  onChange={onPrizeMoneyChange}
                  min={0}
                  step={5000}
                  className="w-full"
                  placeholder="0"
                />
                <span className="pl-1 font-mono text-[11px] leading-relaxed text-gull">
                  После дедлайна сумма будет закреплена за участником с 1 местом.
                </span>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="pl-1 font-mono text-[10px] font-bold uppercase tracking-[1px] text-half-baked">
                  tags (JSON-массив)
                </span>
                <textarea
                  value={tagsText}
                  onChange={onTagsTextChange}
                  rows={4}
                  spellCheck={false}
                  className="resize-y rounded-lg border border-plantation bg-aztec px-3 py-2 font-mono text-xs text-catskill"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={published}
                  disabled={isMainActive}
                  onChange={onPublishedChange}
                  className="size-4 rounded border-plantation bg-aztec text-turquoise disabled:opacity-60"
                />
                <span className="font-mono text-sm text-catskill">
                  Опубликован (виден в зале и публичном API)
                  {isMainActive ? <span className="text-half-baked"> — включён вместе с активным спринтом</span> : null}
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isMainActive}
                  onChange={onMainActiveChange}
                  className="size-4 rounded border-plantation bg-aztec text-turquoise"
                />
                <span className="font-mono text-sm text-catskill">
                  Активный спринт на главной (только один; отправка — у зачисленных)
                </span>
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-turquoise px-5 font-sans text-sm font-bold text-aztec transition hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? '…' : 'Сохранить'}
                  <MaterialIcon name="save" size={18} className="text-aztec" />
                </button>
                <button
                  type="button"
                  onClick={onOpenPreview}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-turquoise/40 bg-turquoise/10 px-4 font-mono text-xs font-bold uppercase tracking-wide text-turquoise hover:bg-turquoise/20"
                >
                  Превью задания
                  <MaterialIcon name="visibility" size={18} className="text-turquoise" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <p className="text-gull">Нет спринтов. Создайте спринт в колонке слева.</p>
        )}
      </section>
    </div>
  )
}
