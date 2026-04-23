import { figmaCellTower } from '../../assets/icons/index.js'
import { figmaIcon } from '../ui/figmaIconSizes.js'
import { SvgIcon } from '../ui/SvgIcon.jsx'

export function PageTitleRow({
  title = '#2 BASALT ARENA (FRONTEND)',
  systemActive = true,
}) {
  return (
    <div className="flex w-full flex-row flex-nowrap items-center justify-between gap-2 md:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
        <SvgIcon src={figmaCellTower} className={`${figmaIcon.row24} shrink-0`} alt="" />
        <h1 className="max-w-[161px] text-[20px] font-bold leading-[28px] tracking-[-0.5px] text-catskill sm:max-w-[220px] md:max-w-[276px] lg:max-w-none">
          {title}
        </h1>
      </div>
      <div
        className={[
          'box-border flex shrink-0 flex-row items-center gap-2 rounded-full border px-3 py-1 md:h-[25px] md:gap-2',
          systemActive
            ? 'border-spring/30 bg-spring/10'
            : 'border-gull/30 bg-gull/10',
        ].join(' ')}
      >
        <span
          className={[
            'h-2 w-[5.52px] shrink-0 rounded-full md:w-2',
            systemActive ? 'bg-spring' : 'bg-gull',
          ].join(' ')}
          aria-hidden
        />
        {systemActive ? (
          <span className="pr-1 text-left text-[10px] font-medium uppercase leading-[15px] tracking-[1px] text-spring md:pr-2">
            <span className="flex flex-col items-start justify-center gap-0 md:hidden">
              <span>СИСТЕМА</span>
              <span>АКТИВНА</span>
            </span>
            <span className="hidden whitespace-nowrap md:inline">СИСТЕМА АКТИВНА</span>
          </span>
        ) : (
          <span className="max-w-[4.5rem] text-left text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-gull">
            Система недоступна
          </span>
        )}
      </div>
    </div>
  )
}
