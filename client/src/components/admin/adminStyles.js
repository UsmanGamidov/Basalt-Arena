/** Общие классы для адаптивной админки */
export const adminPanelClass =
  'rounded-xl border border-plantation bg-timber p-3 sm:p-4 lg:p-5 xl:p-6'

export const adminTableScrollClass =
  'admin-table-scroll admin-table-scroll-hint w-full overflow-x-auto'

export const adminTabsNavClass =
  'mb-6 flex gap-2 overflow-x-auto overscroll-x-contain pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-1'

export const adminSearchInputClass =
  'h-8 w-full rounded-lg border border-plantation bg-aztec px-3 font-mono text-xs text-catskill'

export const adminTabButtonClass = (active) =>
  [
    'shrink-0 rounded-lg px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wide transition sm:px-4 sm:text-xs',
    active
      ? 'bg-turquoise text-aztec'
      : 'border border-plantation bg-aztec/50 text-gull hover:border-turquoise/30',
  ].join(' ')
