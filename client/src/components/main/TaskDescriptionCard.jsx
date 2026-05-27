import { MaterialIcon } from '../ui/MaterialIcon.jsx'
import { normalizeSprintBriefView } from '../../lib/sprintTaskBrief.js'

const CHIP_CLASS =
  'inline-flex h-[38px] shrink-0 items-center gap-2 rounded-lg border border-plantation bg-aztec px-3 py-2 font-sans text-xs font-normal leading-4 tracking-normal text-catskill transition-colors hover:border-turquoise/30 hover:bg-turquoise/5 max-[360px]:h-[34px] max-[360px]:px-2.5 max-[360px]:text-[11px]'

function RichLine({ parts }) {
  return (
    <span className="font-mono text-sm font-normal leading-[23px] text-half-baked">
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <span key={i} className="text-spring">
            {p.h}
          </span>
        ),
      )}
    </span>
  )
}

function TaskParagraph({ chunks }) {
  return (
    <p className="font-mono text-sm font-normal leading-[23px] text-half-baked max-[360px]:text-[13px] max-[360px]:leading-5">
      {chunks.map((c, i) =>
        typeof c === 'string' ? (
          <span key={i}>{c}</span>
        ) : (
          <span key={i}>
            <span className="text-turquoise">{c.code}</span>
            {c.after ? <span>{c.after}</span> : null}
          </span>
        ),
      )}
    </p>
  )
}

export function TaskDescriptionCard({ sprint }) {
  if (!sprint) {
    return (
      <article className="rounded-xl border border-plantation bg-timber/40 px-6 py-10 text-center">
        <p className="font-mono text-sm text-gull">Нет активного спринта с заданием.</p>
      </article>
    )
  }

  const brief = normalizeSprintBriefView(sprint)
  const heading =
    typeof brief.taskTitle === 'string' && brief.taskTitle.trim()
      ? brief.taskTitle.trim()
      : sprint.title || 'Спринт'
  const quote = typeof brief.quote === 'string' ? brief.quote.trim() : ''
  const paragraphs = Array.isArray(brief.taskParagraphs) ? brief.taskParagraphs : []
  const acceptanceTitle =
    typeof brief.acceptanceTitle === 'string' ? brief.acceptanceTitle : 'Критерии приёмки:'
  const acceptanceItems = Array.isArray(brief.acceptanceItems) ? brief.acceptanceItems : []
  const links = Array.isArray(brief.usefulLinks)
    ? brief.usefulLinks
    : Array.isArray(brief.resourceLinks)
      ? brief.resourceLinks
      : []

  return (
    <article className="flex flex-col gap-6 rounded-xl border border-plantation bg-timber p-6 max-[360px]:gap-4 max-[360px]:p-4">
      <div className="flex items-center gap-2">
        <MaterialIcon name="assignment" size={24} opticalSize={24} className="text-turquoise" />
        <h2 className="text-lg font-bold uppercase leading-7 tracking-[0.45px] text-catskill max-[360px]:text-base max-[360px]:leading-6">
          Текущая задача: {heading}
        </h2>
      </div>

      <div className="flex flex-col gap-[15.3px]">
        {!quote && paragraphs.length === 0 && acceptanceItems.length === 0 ? (
          <p className="font-mono text-sm text-gull">
            Текст задания для этого спринта ещё не задан. Администратор заполняет его в админке → Спринты → блок
            «Текст задания на главной».
          </p>
        ) : null}
        {quote ? (
          <p className="relative rounded-none bg-turquoise/10 p-4 pl-5 font-mono text-sm font-normal italic leading-[23px] text-white max-[360px]:p-3 max-[360px]:pl-4 max-[360px]:text-[13px] max-[360px]:leading-5">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-turquoise shadow-[0_0_18px_rgba(13,204,242,0.55)]"
            />
            {quote}
          </p>
        ) : null}

        {paragraphs.map((p, i) => (
          <TaskParagraph key={i} chunks={p.chunks ?? []} />
        ))}

        {acceptanceItems.length > 0 ? (
          <>
            <h3 className="font-mono text-sm font-bold leading-[23px] text-turquoise max-[360px]:text-[13px]">
              {acceptanceTitle}
            </h3>
            <ul className="list-disc space-y-2 pl-5 font-mono text-sm font-normal leading-[23px] text-half-baked marker:text-half-baked max-[360px]:space-y-1.5 max-[360px]:text-[13px]">
              {acceptanceItems.map((item, i) => (
                <li key={i}>
                  <RichLine parts={item.parts ?? []} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {links.length > 0 ? (
        <div className="box-border flex flex-col gap-4 border-t border-plantation pt-8 max-[360px]:gap-3 max-[360px]:pt-6">
          <h4 className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-half-baked max-[360px]:text-[11px]">
            Полезные ссылки
          </h4>
          <div className="flex flex-wrap content-start items-start gap-x-3 gap-y-3 max-md:flex-col max-md:items-start">
            {links.map((item) => {
              const label = String(item?.label ?? '').trim()
              if (!label) return null
              const icon = typeof item?.icon === 'string' ? item.icon : 'link'
              const url =
                typeof item?.href === 'string'
                  ? item.href.trim()
                  : typeof item?.url === 'string'
                    ? item.url.trim()
                    : ''
              const inner = (
                <>
                  <MaterialIcon name={icon} size={14} opticalSize={14} className="font-normal" />
                  <span className="whitespace-nowrap">{label}</span>
                </>
              )
              return url && url !== '#' ? (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CHIP_CLASS}
                >
                  {inner}
                </a>
              ) : (
                <span key={label} className={CHIP_CLASS}>
                  {inner}
                </span>
              )
            })}
          </div>
        </div>
      ) : null}
    </article>
  )
}
