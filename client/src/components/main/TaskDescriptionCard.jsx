import { MaterialIcon } from '../ui/MaterialIcon.jsx'

const CHIP_STATIC =
  'inline-flex h-[38px] shrink-0 items-center gap-2 rounded-lg border border-plantation bg-aztec px-3 py-2 font-sans text-xs font-normal leading-4 tracking-normal text-catskill [font-weight:400] [font-synthesis:none] max-[360px]:h-[34px] max-[360px]:px-2.5 max-[360px]:text-[11px]'

const LINKS = [
  { icon: 'terminal', label: 'Платформенный SDK v2.1' },
  { icon: 'description', label: 'Спецификация Quantum' },
  { icon: 'link', label: 'Репозиторий тестов' },
]

export function TaskDescriptionCard() {
  return (
    <article className="flex flex-col gap-6 rounded-xl border border-plantation bg-timber p-6 max-[360px]:gap-4 max-[360px]:p-4">
      <div className="flex items-center gap-2">
        <MaterialIcon name="assignment" size={24} opticalSize={24} className="text-turquoise" />
        <h2 className="text-lg font-bold uppercase leading-7 tracking-[0.45px] text-catskill max-[360px]:text-base max-[360px]:leading-6">
          Текущая задача: Basalt Arena (frontend)
        </h2>
      </div>

      <div className="flex flex-col gap-[15.3px]">
        <p className="relative rounded-none bg-turquoise/10 p-4 pl-5 font-mono text-sm font-normal italic leading-[23px] text-white [font-synthesis:none] max-[360px]:p-3 max-[360px]:pl-4 max-[360px]:text-[13px] max-[360px]:leading-5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-turquoise shadow-[0_0_18px_rgba(13,204,242,0.55)]"
          />
          «Перед вами — макет той самой платформы, на которой вы сейчас находитесь. Ваша задача —
          сверстать его. Да, это рекурсия.»
        </p>

        <p className="font-mono text-sm font-normal leading-[23px] text-half-baked [font-synthesis:none] max-[360px]:text-[13px] max-[360px]:leading-5">
          Реализуйте все три страницы по макету: index.html (активный спринт), hall.html (зал славы) и
          profile.html (профиль). Стек — любой: чистый HTML/CSS, React, Vue, Svelte, Tailwind, Bootstrap,
          генерация через ИИ — что угодно.
        </p>

        <h3 className="font-mono text-sm font-bold leading-[23px] text-turquoise [font-synthesis:none] max-[360px]:text-[13px] max-[360px]:leading-5">
          Критерии приёмки:
        </h3>

        <ul className="list-disc space-y-2 pl-5 font-mono text-sm font-normal leading-[23px] text-half-baked marker:text-half-baked [font-synthesis:none] max-[360px]:space-y-1.5 max-[360px]:text-[13px] max-[360px]:leading-5">
          <li>
            Главное — <span className="text-spring">соответствие макету</span>. Чем точнее, тем выше
            оценка наставника.
          </li>
          <li>
            Весь независимый от бэка JS-функционал должен{' '}
            <span className="text-spring">работать</span>: модалки, таймер, табы, формы и т.д.
          </li>
          <li>
            Все запросы к серверу — через <span className="text-spring">мок-API</span> (заглушки). На
            основе победившего мок-API в следующем спринте будем проектировать настоящий бэкенд.
          </li>
        </ul>
      </div>

      <div className="box-border flex flex-col gap-4 border-t border-plantation pt-8 max-[360px]:gap-3 max-[360px]:pt-6">
        <h4 className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-half-baked max-[360px]:text-[11px]">
          Полезные ссылки
        </h4>
        <div className="flex flex-wrap content-start items-start gap-x-3 gap-y-3 max-md:flex-col max-md:items-start">
          {LINKS.map((item) => {
            return (
              <span key={item.label} className={CHIP_STATIC}>
                <MaterialIcon name={item.icon} size={14} opticalSize={14} className="font-normal" />
                <span className="whitespace-nowrap">{item.label}</span>
              </span>
            )
          })}
        </div>
      </div>
    </article>
  )
}
