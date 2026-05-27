/** Поле tabLabel (префикс #id подставляется при сохранении). */
export function SprintTitleField({ value, onChange, className = '' }) {
  return (
    <label className={['flex flex-col gap-1.5', className].filter(Boolean).join(' ')}>
      <input
        value={value}
        onChange={onChange}
        placeholder="tabLabel"
        className="rounded-lg border border-plantation bg-aztec px-3 py-2 text-sm text-catskill placeholder:text-pale-sky/80 focus:border-plantation focus:outline-none focus:ring-1 focus:ring-turquoise/15"
      />
    </label>
  )
}
