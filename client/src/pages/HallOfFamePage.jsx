import { useEffect, useMemo, useState } from 'react'
import { getHall } from '../api/basaltApi.js'
import { useAuth } from '../auth/useAuth.js'
import { AppFooter } from '../components/layout/AppFooter.jsx'
import { AppHeader } from '../components/layout/AppHeader.jsx'
import { SprintBriefModal } from '../components/main/SprintBriefModal.jsx'
import { MaterialIcon } from '../components/ui/MaterialIcon.jsx'

function dicebearAvatar(seed) {
  const q = new URLSearchParams({
    seed: String(seed),
    scale: '62',
    radius: '12',
  })
  return `https://api.dicebear.com/7.x/identicon/svg?${q.toString()}`
}

function rankBadgeClasses(badge) {
  switch (badge) {
    case 'gold':
      return 'bg-[#EAB308] text-aztec shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]'
    case 'slate':
      return 'bg-fiord text-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]'
    case 'bronze':
      return 'bg-[#9A3412] text-[#FFEDD5] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]'
    default:
      return 'bg-[#334155] text-catskill shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]'
  }
}

function SolutionCard({ solution, isWinner }) {
  const s = solution
  const rank = s.rank
  const badge = s.rankBadge ?? 'muted'
  const likesActive = rank === 1

  return (
    <article
      className={[
        'group relative isolate overflow-hidden rounded-xl border bg-timber p-5 max-[360px]:p-4 md:p-6 transition-[border-color,box-shadow] duration-200 ease-out',
        isWinner
          ? 'border-2 border-[rgba(255,215,0,0.4)] shadow-[0_0_20px_rgba(255,215,0,0.15),inset_0_0_10px_2px_rgba(255,215,0,0.1)]'
          : 'border border-plantation hover:border-white/35',
      ].join(' ')}
    >
      {isWinner ? (
        <div
          className="pointer-events-none absolute -right-[38px] -top-[38px] size-40 rounded-full bg-[rgba(234,179,8,0.1)] blur-[32px]"
          aria-hidden
        />
      ) : null}

      <div className="relative z-[1] flex flex-col gap-6 max-[360px]:gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        <div className="flex min-w-0 items-center gap-5 max-[360px]:gap-3">
          <div className="relative shrink-0">
            <div
              className={[
                'flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.002] max-[360px]:size-14',
                isWinner
                  ? 'border-2 border-[rgba(234,179,8,0.5)] shadow-[0_10px_15px_-3px_rgba(234,179,8,0.1),0_4px_6px_-4px_rgba(234,179,8,0.1)]'
                  : 'border border-plantation transition-colors duration-200 group-hover:border-white/35',
              ].join(' ')}
            >
              <img
                src={
                  typeof s.avatarUrl === 'string' && s.avatarUrl
                    ? s.avatarUrl
                    : dicebearAvatar(s.avatarSeed ?? s.handle)
                }
                alt=""
                className="h-full w-full object-contain"
                decoding="async"
                draggable={false}
              />
            </div>
            <div
              className={`absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-md font-mono text-xs font-extrabold ${rankBadgeClasses(badge)}`}
            >
              {rank}
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <h3
              className={[
                'flex flex-wrap items-center gap-2 font-bold',
                rank === 1
                  ? 'text-xl leading-7 text-white max-[360px]:text-lg md:text-xl md:leading-7'
                  : 'text-lg leading-7 text-mystic max-[360px]:text-base',
              ].join(' ')}
            >
              <span className={rank === 1 ? 'text-white' : 'text-mystic'}>{s.displayName}</span>
              {s.showCrown ? (
                <MaterialIcon name="workspace_premium" size={18} className="text-[#EAB308]" />
              ) : null}
            </h3>
            <div className="flex flex-wrap items-center gap-3 font-mono text-sm leading-5 max-[360px]:gap-2 max-[360px]:text-xs">
              <span className="text-catskill">{s.dateLabel}</span>
              <span
                className={`size-1 shrink-0 rounded-full ${rank === 1 ? 'bg-fiord' : 'bg-[#334155]'}`}
                aria-hidden
              />
              <span className="font-mono text-[#FACC15]">
                Оценка наставника: {s.mentorScore}
              </span>
            </div>
            <a
              className="mt-1 inline-flex items-center gap-1.5 font-mono text-xs text-turquoise hover:underline"
            >
              <MaterialIcon name="send" size={12} opticalSize={12} className="text-turquoise" />
              @{s.handle}
            </a>
          </div>
        </div>

        <div
          className={[
            'flex w-full flex-shrink-0 flex-wrap items-center justify-between gap-3 max-[360px]:gap-2 md:w-auto md:justify-end',
            rank > 1 ? 'opacity-60 transition-opacity duration-200 group-hover:opacity-100' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div
            className={[
              'flex items-center rounded-lg border border-plantation bg-aztec/50 p-1 transition-[border-color,background-color] duration-200',
              isWinner ? '' : 'group-hover:border-white/30 group-hover:bg-[#0F2732]/70',
            ].join(' ')}
          >
            <a
              href={s.codeUrl}
              target="_blank"
              rel="noreferrer"
              className={[
                'group flex items-center gap-2 rounded py-1.5 text-gull transition-[background-color,color,box-shadow] duration-200 max-[360px]:gap-1',
                isWinner ? 'px-3' : 'px-2',
                isWinner
                  ? 'hover:bg-white/5 hover:text-turquoise'
                  : 'group-hover:text-white hover:text-turquoise',
              ].join(' ')}
              title="Код"
            >
              <MaterialIcon name="code" size={18} />
              <span
                className={[
                  'font-mono text-xs font-bold',
                  isWinner ? 'inline' : 'hidden',
                ].join(' ')}
              >
                КОД
              </span>
            </a>
            <div className="mx-1 h-4 w-px bg-plantation" aria-hidden />
            <a
              href={s.demoUrl}
              target="_blank"
              rel="noreferrer"
              className={[
                'group/demo flex items-center gap-2 rounded py-1.5 text-gull transition-[background-color,color,box-shadow] duration-200 max-[360px]:gap-1',
                isWinner ? 'px-3' : 'px-2',
                isWinner
                  ? 'hover:bg-white/5 hover:text-turquoise'
                  : 'group-hover:text-white hover:text-turquoise',
              ].join(' ')}
              title="Демо"
            >
              <MaterialIcon name="rocket_launch" size={18} />
              <span
                className={[
                  'font-mono text-xs font-bold',
                  isWinner ? 'inline' : 'hidden',
                ].join(' ')}
              >
                ДЕМО
              </span>
            </a>
          </div>

          <button
            type="button"
            className={[
              'inline-flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm font-bold transition max-[360px]:px-2 max-[360px]:py-1.5 max-[360px]:text-xs',
              likesActive
                ? 'border-turquoise/30 bg-turquoise/20 text-turquoise hover:border-turquoise/55 hover:bg-turquoise/30 hover:text-[#67E8F9] hover:shadow-[0_0_16px_rgba(13,204,242,0.28)]'
                : 'border-[rgba(71,85,105,0.5)] bg-[rgba(51,65,85,0.3)] text-gull hover:text-white',
            ].join(' ')}
          >
            <MaterialIcon name="favorite" size={18} className={likesActive ? 'text-turquoise' : ''} />
            {s.likes}
          </button>
        </div>
      </div>
    </article>
  )
}

function SprintMetrics({ metrics }) {
  const m = metrics
  const pct = Math.min(100, Math.max(0, Number(m.submissionsBarPct) || 0))

  return (
    <div className="space-y-4">
      <h3 className="font-mono text-xs font-bold uppercase tracking-[1.2px] text-slate-arena">
        Метрики спринта
      </h3>
      <div className="space-y-4 max-[360px]:space-y-3">
        <div className="flex flex-col gap-2 rounded-xl border border-plantation bg-timber px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-[360px]:px-4 max-[360px]:py-4">
          <div className="flex items-start justify-between gap-4">
            <span className="font-sans text-xs font-medium leading-4 text-gull">Всего отправок</span>
            <MaterialIcon name="dataset" size={18} opticalSize={18} className="text-gull" />
          </div>
          <p className="font-mono text-[30px] font-extrabold leading-9 text-white max-[360px]:text-[26px] max-[360px]:leading-8">
            {Number(m.submissions).toLocaleString('ru-RU').replace(/\u00a0/g, ' ')}
          </p>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#1E293B]">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-turquoise"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="flex items-center gap-1 font-mono text-[10px] leading-[15px] text-[#4ADE80]">
            <MaterialIcon name="trending_up" size={12} className="text-[#4ADE80]" />
            {m.deltaLabel}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-plantation bg-timber px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-[360px]:px-4 max-[360px]:py-4">
          <div className="flex items-start justify-between gap-4">
            <span className="font-sans text-xs font-medium leading-4 text-gull">Доля успешных</span>
            <MaterialIcon name="check_circle" size={18} opticalSize={18} className="text-gull" />
          </div>
          <p className="font-mono text-[30px] font-extrabold leading-9 text-white max-[360px]:text-[26px] max-[360px]:leading-8">
            {m.successRate}
          </p>
          <div className="flex items-center gap-2 rounded-lg bg-[rgba(30,41,59,0.5)] px-2 py-2">
            <span className="size-2 shrink-0 rounded-full bg-[#0BDA54]" aria-hidden />
            <span className="font-mono text-[10px] uppercase leading-[15px] tracking-[0.5px] text-gull">
              {m.verifiedSolutions} проверенных решений
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function PastWinners({ winners }) {
  return (
    <div className="space-y-4">
      <h3 className="font-mono text-xs font-bold uppercase tracking-[1.2px] text-slate-arena">
        Победители прошлых спринтов
      </h3>
      <div className="overflow-hidden rounded-xl border border-plantation bg-timber">
        {winners.map((w, i) => (
          <div
            key={`${w.sprintRank}-${w.handle}`}
            className={[
              'group flex items-center gap-4 px-4 py-4 transition-[background-color,box-shadow] duration-300 ease-out max-[360px]:gap-3 max-[360px]:px-3 max-[360px]:py-3',
              'hover:bg-[linear-gradient(90deg,rgba(13,204,242,0.08)_0%,rgba(13,204,242,0.02)_42%,rgba(13,204,242,0)_100%)]',
              i > 0 ? 'border-t border-plantation' : '',
            ].join(' ')}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-plantation bg-[#1E293B] font-mono text-xs font-bold text-gull transition-[border-color,color,background-color] duration-300 group-hover:border-turquoise/70 group-hover:bg-turquoise/10 group-hover:text-turquoise">
              {w.sprintRank}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-mystic transition-colors duration-300 group-hover:text-white">
                {w.title}
              </p>
              <p className="font-mono text-xs text-turquoise">@{w.handle}</p>
            </div>
            <MaterialIcon
              name="chevron_right"
              size={18}
              className="shrink-0 text-fiord transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-gull"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function QuoteCard({ quote }) {
  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-turquoise/20 bg-gradient-to-r from-turquoise/10 to-transparent px-5 pb-5 pt-[19px]">
      <MaterialIcon
        name="format_quote"
        size={96}
        className="pointer-events-none absolute -bottom-4 -right-1 rotate-12 text-turquoise/[0.05]"
      />
      <p className="relative z-[1] text-[11.4px] font-medium leading-5 text-catskill">{quote.text}</p>
      <div className="relative z-[2] mt-3 flex items-center gap-2">
        <div className="size-5 shrink-0 rounded-full bg-[#334155]" aria-hidden />
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25px] text-turquoise">
          {quote.attribution}
        </p>
      </div>
    </div>
  )
}

export function HallOfFamePage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSprintId, setActiveSprintId] = useState('2')
  const [loadMoreClicked, setLoadMoreClicked] = useState(false)
  const [briefOpen, setBriefOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const json = await getHall()
        if (!cancelled) {
          setData(json)
          const first = json?.sprints?.[0]?.id
          if (first) setActiveSprintId(first)
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const activeSprint = useMemo(() => {
    if (!data?.sprints?.length) return null
    return data.sprints.find((s) => s.id === activeSprintId) ?? data.sprints[0]
  }, [data, activeSprintId])

  const sortedSolutions = useMemo(() => {
    const list = activeSprint?.solutions ? [...activeSprint.solutions] : []
    list.sort(
      (a, b) => (b.mentorScore ?? 0) - (a.mentorScore ?? 0) || (b.likes ?? 0) - (a.likes ?? 0),
    )
    return list
  }, [activeSprint])

  if (!user) return null

  const page = data?.page

  return (
    <div className="flex min-h-screen flex-col bg-aztec">
      <AppHeader />
      <main className="flex-1 px-0 pt-[73px]">
        <div className="mx-auto max-w-[1400px] px-6 py-10 max-[360px]:px-3 max-[360px]:py-6 md:px-10">
          {loading ? (
            <p className="font-mono text-sm text-gull">Загрузка зала славы…</p>
          ) : error ? (
            <div className="rounded-xl border border-plantation bg-timber/60 px-6 py-8 text-center">
              <p className="text-gull">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 max-[360px]:gap-6">
              <header className="flex flex-col gap-3">
                <div className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-turquoise/10 bg-turquoise/5 px-3 py-1">
                  {page?.breadcrumbs?.map((crumb, i) => (
                    <span key={crumb.label} className="flex items-center gap-2">
                      {i > 0 ? (
                        <MaterialIcon name="chevron_right" size={10} className="text-turquoise" />
                      ) : null}
                      <span
                        className={`font-mono text-xs leading-4 text-turquoise ${crumb.muted ? 'opacity-70' : 'font-bold'}`}
                      >
                        {crumb.label}
                      </span>
                    </span>
                  ))}
                </div>
                <h1 className="text-[30px] font-bold leading-9 tracking-[-0.75px] text-white max-[360px]:text-[22px] max-[360px]:leading-7 md:text-[48px] md:leading-[48px] md:tracking-[-1.2px]">
                  {page?.title}
                </h1>
                <p className="max-w-[768px] pt-1 text-lg leading-[29px] text-gull max-[360px]:text-sm max-[360px]:leading-6">
                  {page?.description}
                </p>
              </header>

              <div className="border-b border-plantation/80">
                <div className="flex gap-8 overflow-x-auto pb-px max-[360px]:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {data?.sprints?.map((sp) => {
                    const active = sp.id === activeSprint?.id
                    const basaltTab =
                      sp.id === '2' ||
                      String(sp.tabLabel ?? '')
                        .toLowerCase()
                        .includes('basalt arena')
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setActiveSprintId(sp.id)}
                        className={[
                          'flex shrink-0 items-center gap-2 border-b-2 pb-3 text-base transition max-[360px]:gap-1.5 max-[360px]:text-sm',
                          active
                            ? 'border-turquoise font-bold text-turquoise'
                            : 'border-transparent font-normal text-slate-arena hover:border-[#334155] hover:text-gull',
                        ].join(' ')}
                      >
                        {active && basaltTab ? (
                          <MaterialIcon
                            name="radio_button_checked"
                            size={18}
                            opticalSize={18}
                            className="text-turquoise"
                          />
                        ) : sp.tabIcon ? (
                          <MaterialIcon
                            name="radio_button_checked"
                            size={18}
                            className={active ? 'text-turquoise' : 'text-slate-arena'}
                          />
                        ) : null}
                        {sp.tabLabel}
                      </button>
                    )
                  })}
                </div>
              </div>

              {activeSprint ? (
                <section className="relative isolate overflow-hidden rounded-xl border border-plantation bg-timber px-6 pb-6 pt-8 max-[360px]:px-4 max-[360px]:pb-4 max-[360px]:pt-5 md:px-6 md:pb-6 md:pt-8 lg:px-8 lg:pb-8 lg:pt-10">
                  <div
                    className="pointer-events-none absolute inset-y-2 right-px z-0 w-64 bg-gradient-to-l from-turquoise/5 to-transparent"
                    aria-hidden
                  />
                  <div className="relative z-[1] flex flex-col gap-6 max-[360px]:gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4 max-[360px]:space-y-3">
                      <h2 className="text-2xl font-bold leading-8 text-white max-[360px]:text-xl max-[360px]:leading-7 md:text-[30px] md:leading-9">
                        {activeSprint.heroTitle}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        {activeSprint.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border border-[#334155] bg-aztec px-2.5 py-1 font-mono text-xs text-catskill max-[360px]:text-[11px]"
                          >
                            {tag}
                          </span>
                        ))}
                        <span className="flex items-center gap-1 rounded-md border border-[#334155] bg-aztec px-2.5 py-1 font-mono text-xs text-gull max-[360px]:text-[11px]">
                          <MaterialIcon name="event" size={12} className="text-gull" />
                          {activeSprint.completedLabel}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBriefOpen(true)}
                      className="relative z-[2] inline-flex h-12 w-[174px] shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-turquoise px-5 py-2.5 text-sm font-bold leading-5 text-aztec shadow-[0_10px_15px_-3px_rgba(13,204,242,0.25),0_4px_6px_-4px_rgba(13,204,242,0.25)] transition-[box-shadow,filter] duration-300 hover:brightness-110 hover:shadow-[0_12px_18px_-3px_rgba(13,204,242,0.32),0_6px_10px_-4px_rgba(13,204,242,0.32)] active:brightness-95 max-[360px]:h-11 max-[360px]:w-full lg:self-end"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 rounded-lg bg-white/[0.002]"
                        aria-hidden
                      />
                      <MaterialIcon name="description" size={18} className="text-aztec" />
                      Открыть бриф
                    </button>
                  </div>
                </section>
              ) : null}

              <div className="grid grid-cols-1 gap-8 max-[360px]:gap-6 xl:grid-cols-[minmax(0,1fr)_418px] xl:items-start">
                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex flex-row items-center justify-between gap-2 max-[360px]:items-end">
                    <h2 className="text-lg font-bold leading-7 text-catskill">Лучшие решения</h2>
                    <p className="whitespace-nowrap font-mono text-xs uppercase tracking-[1.2px] max-[360px]:text-[10px]">
                      <span className="text-slate-arena">СОРТИРОВКА: </span>
                      <span className="font-bold text-catskill">ЭФФЕКТИВНОСТЬ</span>
                    </p>
                  </div>

                  {sortedSolutions.length === 0 ? (
                    <p className="rounded-xl border border-plantation bg-timber/50 px-6 py-10 text-center text-gull">
                      Для этого спринта пока нет решений в архиве.
                    </p>
                  ) : (
                    sortedSolutions.map((sol) => (
                      <SolutionCard key={sol.rank} solution={sol} isWinner={sol.rank === 1} />
                    ))
                  )}

                  {data?.loadMoreRemaining > 0 && sortedSolutions.length > 0 ? (
                    <div className="flex justify-center pt-6">
                      <button
                        type="button"
                        onClick={() => setLoadMoreClicked(true)}
                        disabled={loadMoreClicked}
                        className="inline-flex items-center gap-2 font-mono text-sm uppercase tracking-[1.4px] text-slate-arena transition hover:text-gull disabled:opacity-50"
                      >
                        {loadMoreClicked
                          ? 'Пагинация появится в API'
                          : `Загрузить ещё ${data.loadMoreRemaining} решений`}
                        <MaterialIcon name="expand_more" size={18} />
                      </button>
                    </div>
                  ) : null}
                </div>

                <aside className="flex min-w-0 flex-col gap-8">
                  {activeSprint?.metrics ? <SprintMetrics metrics={activeSprint.metrics} /> : null}
                  {data?.pastWinners?.length ? <PastWinners winners={data.pastWinners} /> : null}
                  {data?.quote ? <QuoteCard quote={data.quote} /> : null}
                </aside>
              </div>
            </div>
          )}
        </div>
      </main>
      <SprintBriefModal open={briefOpen} onClose={() => setBriefOpen(false)} sprint={activeSprint} />
      <AppFooter />
    </div>
  )
}
