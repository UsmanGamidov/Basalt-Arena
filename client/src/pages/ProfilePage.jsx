import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteMySubmissionV2, patchProfile } from '../api/basaltApi.js'
import { notifyLiveDataChanged } from '../lib/liveData.js'
import { useAuth } from '../auth/useAuth.js'
import { AppFooter } from '../components/layout/AppFooter.jsx'
import { AppHeader } from '../components/layout/AppHeader.jsx'
import { MaterialIcon } from '../components/ui/MaterialIcon.jsx'
import { resolveUserAvatarUrl } from '../lib/avatar.js'
import { useConfirm } from '../context/ConfirmProvider.jsx'

function isSubmissionHistoryDeleted(row) {
  return (
    row?.isDeleted === true ||
    row?.status === 'deleted_by_user' ||
    row?.status === 'deleted_by_admin'
  )
}

const EMPTY_PROFILE = {
  bio: '',
  skillsLabel: '',
  contacts: {
    telegram: '',
    email: '',
    github: '',
  },
  statsCards: [],
  achievements: [],
  form: {
    username: '',
    email: '',
    telegram: '',
    about: '',
  },
}

const SIDEBAR_NAV = [
  { key: 'overview', label: 'Обзор', icon: 'person', sectionId: 'profile-hero' },
  { key: 'badges', label: 'Бейджи и достижения', icon: 'workspace_premium', sectionId: 'profile-achievements' },
  { key: 'stats', label: 'Статистика', icon: 'query_stats', sectionId: 'profile-stats' },
  { key: 'history', label: 'История отправок', icon: 'history', sectionId: 'profile-sprint-history' },
  { key: 'settings', label: 'Настройки', icon: 'settings', sectionId: 'profile-settings' },
]

const SECTION_TO_NAV = {
  'profile-hero': 'overview',
  'profile-stats': 'stats',
  'profile-achievements': 'badges',
  'profile-sprint-history': 'history',
  'profile-settings': 'settings',
}

function trendPillClass(variant) {
  switch (variant) {
    case 'malachite':
      return 'border border-[rgba(11,218,84,0.2)] bg-[rgba(11,218,84,0.1)] text-[#0BDA54]'
    case 'turquoise':
      return 'border border-turquoise/20 bg-turquoise/10 text-turquoise'
    case 'spring':
      return 'border border-[rgba(0,255,157,0.2)] bg-[rgba(0,255,157,0.1)] text-spring'
    default:
      return 'border border-turquoise/20 bg-turquoise/10 text-turquoise'
  }
}

function bigIconTintClass(tint) {
  return tint === 'spring'
    ? 'text-spring group-hover:opacity-35 group-hover:text-[#22FFB4]'
    : 'text-turquoise group-hover:opacity-35 group-hover:text-[#22D3EE]'
}

function StatMetricCard({ card }) {
  const trendVariant = card.trendVariant ?? 'turquoise'
  const iconTint = card.iconTint ?? 'turquoise'
  const cardKey = String(card.key ?? '')
  const hoverFrameClass =
    cardKey === 'money'
      ? 'hover:border-spring/45 hover:shadow-[0_0_28px_-10px_rgba(0,255,157,0.3)]'
      : 'hover:border-turquoise/40 hover:shadow-[0_0_24px_-12px_rgba(13,204,242,0.28)]'

  return (
    <div
      className={[
        'group relative isolate overflow-hidden rounded-xl border border-plantation bg-timber/20 p-6 transition-[border-color,box-shadow] duration-300 max-[360px]:p-4',
        hoverFrameClass,
      ].join(' ')}
    >
      <div
        className={`pointer-events-none absolute right-px top-px flex items-start justify-end p-2 opacity-10 transition-[opacity,color] duration-300 ${bigIconTintClass(iconTint)}`}
        aria-hidden
      >
        <MaterialIcon name={card.icon} size={72} opticalSize={24} className="leading-none" />
      </div>
      <div className="relative z-[1] flex min-h-[99px] flex-col max-[360px]:min-h-[84px]">
        <p className="pb-1 text-xs font-bold uppercase leading-4 tracking-[1.2px] text-gull max-[360px]:text-[10px]">
          {card.label}
        </p>
        <p className="pb-2 text-[36px] font-bold leading-[45px] text-white max-[360px]:text-[30px] max-[360px]:leading-9">
          {card.value}
        </p>
        {card.trendLabel ? (
          <div
            className={`inline-flex w-max max-w-full items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold leading-4 ${trendPillClass(trendVariant)}`}
          >
            <MaterialIcon name="trending_up" size={14} opticalSize={14} className="leading-none" />
            <span>{card.trendLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function AchievementTile({ achievement }) {
  const locked = achievement.variant === 'locked'
  const iconName = achievement.icon === 'looks_one' ? 'filter_1' : achievement.icon
  return (
    <div
      className={[
        'group relative isolate flex flex-col items-center rounded-xl p-6 transition-[border-color,background-color,box-shadow] duration-300 max-[360px]:p-4',
        locked
          ? 'border border-dashed border-red-500/30 bg-[rgba(239,68,68,0.05)] hover:border-red-400/55 hover:bg-[rgba(239,68,68,0.08)]'
          : 'border border-plantation bg-timber/10 hover:border-turquoise/45 hover:bg-timber/20 hover:shadow-[0_0_24px_-12px_rgba(13,204,242,0.28)]',
      ].join(' ')}
    >
      <div className="relative z-[1] mb-4 flex flex-col items-center">
        <div
          className={[
            'relative flex size-16 items-center justify-center rounded-full bg-timber shadow-[0_10px_15px_-3px_rgba(0,0,0,0.2),0_4px_6px_-4px_rgba(0,0,0,0.2)] max-[360px]:size-14',
            locked ? 'border border-red-500/40' : 'border border-plantation',
          ].join(' ')}
        >
          <MaterialIcon
            name={iconName}
            size={30}
            opticalSize={24}
            className={[
              'transition-transform duration-300 group-hover:scale-110 max-[360px]:[font-size:26px]',
              locked ? 'text-[#F87171]' : 'text-turquoise',
            ].join(' ')}
          />
        </div>
      </div>
      <div className="relative z-[2] flex min-w-[110px] max-w-[180px] flex-col items-center gap-1 text-center">
        <p
          className={[
            'text-sm font-bold leading-5',
            locked ? 'text-[#FCA5A5]' : 'text-white',
          ].join(' ')}
        >
          {achievement.title}
        </p>
        <p className="font-mono text-[10px] font-normal leading-[15px] text-slate-arena">{achievement.subtitle}</p>
      </div>
    </div>
  )
}

function formatSubmittedAt(iso) {
  if (typeof iso !== 'string' || !iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ProfilePage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { user, profile: profileRaw, sprintHistory, refreshSession, logout } =
    useAuth()
  const profile = useMemo(() => {
    const p = profileRaw && typeof profileRaw === 'object' ? profileRaw : {}
    return {
      ...EMPTY_PROFILE,
      ...p,
      contacts: {
        ...EMPTY_PROFILE.contacts,
        ...(p.contacts && typeof p.contacts === 'object' ? p.contacts : {}),
      },
      form: {
        ...EMPTY_PROFILE.form,
        ...(p.form && typeof p.form === 'object' ? p.form : {}),
      },
      statsCards: Array.isArray(p.statsCards) ? p.statsCards : [],
      achievements: Array.isArray(p.achievements) ? p.achievements : [],
    }
  }, [profileRaw])

  const [activeNav, setActiveNav] = useState('overview')
  const [form, setForm] = useState(() => ({ ...EMPTY_PROFILE.form }))
  const [saveState, setSaveState] = useState('idle')
  const [saveError, setSaveError] = useState(null)
  const [historyDeletingId, setHistoryDeletingId] = useState(null)
  const [historyNotice, setHistoryNotice] = useState(null)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [editingContacts, setEditingContacts] = useState(false)
  const [contactsDraft, setContactsDraft] = useState({ telegram: '', email: '' })
  const [contactsBusy, setContactsBusy] = useState(false)
  const [contactsError, setContactsError] = useState(null)
  const [editingSkills, setEditingSkills] = useState(false)
  const [skillsDraft, setSkillsDraft] = useState('')
  const [skillsBusy, setSkillsBusy] = useState(false)
  const [achievementsModalOpen, setAchievementsModalOpen] = useState(false)
  const scrollSuppressRef = useRef(0)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setForm({
        ...EMPTY_PROFILE.form,
        ...(profileRaw?.form && typeof profileRaw.form === 'object' ? profileRaw.form : {}),
      })
    }, 0)
    return () => window.clearTimeout(id)
  }, [profileRaw])

  const historyItems = Array.isArray(sprintHistory?.items) ? sprintHistory.items : []
  const historyPreviewItems = historyItems.slice(0, 3)

  useEffect(() => {
    const ids = Object.keys(SECTION_TO_NAV)
    const obs = new IntersectionObserver(
      (entries) => {
        if (Date.now() < scrollSuppressRef.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const id = visible[0]?.target?.id
        if (id && SECTION_TO_NAV[id]) {
          setActiveNav(SECTION_TO_NAV[id])
        }
      },
      { root: null, rootMargin: '-96px 0px -48% 0px', threshold: [0, 0.05, 0.1] },
    )
    for (const id of ids) {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
  }, [])

  const avatarSrc = resolveUserAvatarUrl(user)

  const scrollToSection = useCallback((navKey, sectionId) => {
    scrollSuppressRef.current = Date.now() + 800
    setActiveNav(navKey)
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const displayHandle = `@${String(user.handle ?? '').replace(/^@/, '')}`

  async function onWithdrawSubmission(submissionId) {
    const ok = await confirm({
      title: 'Отозвать отправку?',
      message: 'Наставник всё равно увидит её в очереди проверки.',
      confirmLabel: 'Отозвать',
      danger: true,
    })
    if (!ok) return
    setHistoryDeletingId(submissionId)
    setHistoryNotice(null)
    try {
      await deleteMySubmissionV2(submissionId)
      setHistoryNotice({ type: 'ok', text: 'Отправка отозвана' })
      await refreshSession()
      notifyLiveDataChanged({ source: 'submission' })
    } catch (e) {
      setHistoryNotice({
        type: 'err',
        text: e instanceof Error ? e.message : 'Не удалось отозвать отправку',
      })
    } finally {
      setHistoryDeletingId(null)
    }
  }

  async function saveContacts() {
    setContactsBusy(true)
    setContactsError(null)
    try {
      await patchProfile({
        form: { telegram: contactsDraft.telegram, email: contactsDraft.email },
      })
      await refreshSession()
      setEditingContacts(false)
    } catch (e) {
      setContactsError(e instanceof Error ? e.message : 'Не удалось сохранить')
    } finally {
      setContactsBusy(false)
    }
  }

  async function saveSkills() {
    setSkillsBusy(true)
    try {
      await patchProfile({ form: { skillsLabel: skillsDraft } })
      await refreshSession()
      setEditingSkills(false)
    } catch {
      /* оставляем режим редактирования открытым */
    } finally {
      setSkillsBusy(false)
    }
  }

  const sortedAchievements = [...profile.achievements].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0
    return tb - ta
  })
  const achievementsPreview = sortedAchievements.slice(0, 4)

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col bg-aztec">
      <AppHeader />
      <main className="flex-1 pt-[116px] md:pt-[73px]">
        <div className="mx-auto max-w-[1400px] px-6 pb-10 pt-10 max-[360px]:px-3 max-[360px]:pb-6 max-[360px]:pt-6 md:px-10">
          <div className="flex flex-col gap-8 max-[360px]:gap-6 lg:flex-row lg:items-start lg:gap-8">
            <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[306px]">
              <nav className="flex flex-col gap-2 max-[360px]:gap-1.5">
                {SIDEBAR_NAV.map((item) => {
                  const active = activeNav === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        if (item.disabled || !item.sectionId) return
                        scrollToSection(item.key, item.sectionId)
                      }}
                      disabled={item.disabled}
                      className={[
                        'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium leading-5 transition max-[360px]:gap-2 max-[360px]:px-3 max-[360px]:py-2.5 max-[360px]:text-xs',
                        active
                          ? 'border border-turquoise/20 bg-turquoise/10 text-turquoise'
                          : item.disabled
                            ? 'cursor-default text-fiord opacity-40'
                            : 'text-fiord opacity-40 hover:opacity-70',
                      ].join(' ')}
                    >
                      <MaterialIcon
                        name={item.icon}
                        size={24}
                        opticalSize={24}
                        className={active ? 'text-turquoise' : 'text-fiord'}
                      />
                      {item.label}
                    </button>
                  )
                })}
              </nav>

              <div className="flex flex-col gap-4 rounded-xl border border-plantation bg-timber/20 p-5 max-[360px]:gap-3 max-[360px]:p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-slate-arena">Контакты</p>
                  {!editingContacts ? (
                    <button
                      type="button"
                      onClick={() => {
                        setContactsError(null)
                        setContactsDraft({
                          telegram: profile.contacts.telegram ?? '',
                          email: profile.contacts.email ?? '',
                        })
                        setEditingContacts(true)
                      }}
                      className="rounded p-1 text-slate-arena transition-colors hover:text-white"
                      aria-label="Изменить контакты"
                    >
                      <MaterialIcon name="edit" size={14} opticalSize={14} />
                    </button>
                  ) : null}
                </div>
                {editingContacts ? (
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void saveContacts()
                    }}
                  >
                    <label className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-slate-arena">
                        <MaterialIcon name="send" size={14} opticalSize={14} /> Telegram
                      </span>
                      <input
                        value={contactsDraft.telegram}
                        onChange={(e) => setContactsDraft((d) => ({ ...d, telegram: e.target.value }))}
                        placeholder="@username"
                        className="h-10 rounded-lg border border-plantation bg-aztec px-3 text-sm text-white outline-none focus:border-turquoise/40"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide text-slate-arena">
                        <MaterialIcon name="mail" size={14} opticalSize={14} /> Email
                      </span>
                      <input
                        type="email"
                        value={contactsDraft.email}
                        onChange={(e) => setContactsDraft((d) => ({ ...d, email: e.target.value }))}
                        placeholder="you@example.com"
                        className="h-10 rounded-lg border border-plantation bg-aztec px-3 text-sm text-white outline-none focus:border-turquoise/40"
                      />
                    </label>
                    <p className="font-mono text-[10px] leading-relaxed text-slate-arena">
                      GitHub формируется из логина и меняется в настройках профиля.
                    </p>
                    {contactsError ? (
                      <p className="font-mono text-[11px] text-red-400">{contactsError}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={contactsBusy}
                        className="flex-1 rounded-lg bg-turquoise px-3 py-2 font-mono text-xs font-bold text-aztec transition hover:bg-white disabled:opacity-60"
                      >
                        {contactsBusy ? 'Сохранение…' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        disabled={contactsBusy}
                        onClick={() => {
                          setEditingContacts(false)
                          setContactsError(null)
                        }}
                        className="rounded-lg border border-plantation px-3 py-2 font-mono text-xs text-gull transition hover:bg-white/5 disabled:opacity-60"
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="group flex items-center justify-between gap-2 rounded border border-transparent px-2 py-2 transition-[border-color,background-color] duration-200 hover:border-white/15 hover:bg-white/[0.045]">
                      <span className="inline-flex items-center gap-2 text-sm text-gull transition-colors group-hover:text-white max-[360px]:text-xs">
                        <MaterialIcon
                          name="send"
                          size={18}
                          opticalSize={18}
                          className="text-gull transition-colors group-hover:text-white"
                        />
                        Telegram
                      </span>
                      <span className="text-sm text-turquoise max-[360px]:text-xs">{profile.contacts.telegram}</span>
                    </div>
                    <div className="group flex items-center justify-between gap-2 rounded border border-transparent px-2 py-2 transition-[border-color,background-color] duration-200 hover:border-white/15 hover:bg-white/[0.045]">
                      <span className="inline-flex items-center gap-2 text-sm text-gull transition-colors group-hover:text-white max-[360px]:text-xs">
                        <MaterialIcon
                          name="mail"
                          size={18}
                          opticalSize={18}
                          className="text-gull transition-colors group-hover:text-white"
                        />
                        Email
                      </span>
                      <span className="truncate text-sm text-turquoise max-[360px]:text-xs">{profile.contacts.email}</span>
                    </div>
                    <div className="group flex items-center justify-between gap-2 rounded border border-transparent px-2 py-2 transition-[border-color,background-color] duration-200 hover:border-white/15 hover:bg-white/[0.045]">
                      <span className="inline-flex items-center gap-2 text-sm text-gull transition-colors group-hover:text-white max-[360px]:text-xs">
                        <MaterialIcon
                          name="code"
                          size={18}
                          opticalSize={18}
                          className="text-gull transition-colors group-hover:text-white"
                        />
                        GitHub
                      </span>
                      <span className="text-sm text-turquoise max-[360px]:text-xs">{profile.contacts.github}</span>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col gap-8">
              <section
                id="profile-hero"
                className="scroll-mt-[88px] relative isolate overflow-hidden rounded-xl border border-plantation bg-timber/20 p-8 max-[360px]:p-4"
              >
                <div
                  className="pointer-events-none absolute -right-[127px] -top-[127px] size-64 rounded-full bg-turquoise/5 blur-[32px]"
                  aria-hidden
                />
                <div className="relative z-[1] flex flex-col items-center gap-8 max-[360px]:gap-4 md:flex-row md:items-center">
                  <div className="relative flex size-[132px] shrink-0 items-center justify-center rounded-2xl border-2 border-turquoise/50 bg-white/[0.002] shadow-[0_10px_15px_-3px_rgba(13,204,242,0.1),0_4px_6px_-4px_rgba(13,204,242,0.1)] transition-transform duration-300 hover:scale-105 max-[360px]:size-24">
                    <img
                      src={avatarSrc}
                      alt=""
                      className="size-32 object-contain max-[360px]:size-20"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-1 md:items-start">
                    <h1 className="text-center text-[30px] font-bold leading-9 tracking-[-0.75px] text-white max-[360px]:text-2xl max-[360px]:leading-8 md:text-left">
                      {displayHandle}
                    </h1>
                    <p className="max-w-[512px] text-center font-mono text-sm font-normal leading-5 text-gull max-[360px]:text-xs md:text-left">
                      {profile.bio}
                    </p>
                    <div className="flex w-full flex-wrap justify-center gap-2 pt-4 md:justify-start">
                      {editingSkills ? (
                        <form
                          className="flex w-full max-w-sm items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault()
                            void saveSkills()
                          }}
                        >
                          <input
                            value={skillsDraft}
                            onChange={(e) => setSkillsDraft(e.target.value)}
                            maxLength={120}
                            placeholder="JavaScript, React"
                            className="h-9 min-w-0 flex-1 rounded border border-plantation bg-aztec px-3 text-xs text-white outline-none focus:border-turquoise/40"
                          />
                          <button
                            type="submit"
                            disabled={skillsBusy}
                            className="rounded bg-turquoise px-3 py-1.5 font-mono text-[11px] font-bold text-aztec transition hover:bg-white disabled:opacity-60"
                          >
                            {skillsBusy ? '…' : 'OK'}
                          </button>
                          <button
                            type="button"
                            disabled={skillsBusy}
                            onClick={() => setEditingSkills(false)}
                            className="rounded border border-plantation px-2 py-1.5 font-mono text-[11px] text-gull transition hover:bg-white/5 disabled:opacity-60"
                          >
                            Отмена
                          </button>
                        </form>
                      ) : (
                        <div className="inline-flex items-center gap-2 rounded border border-plantation bg-aztec/80 px-3 py-1.5">
                          <MaterialIcon name="code" size={14} opticalSize={14} className="text-[#4ADE80]" />
                          <span className="text-xs font-medium leading-4 text-mystic">
                            {profile.skillsLabel || 'Не указано'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSkillsDraft(profile.skillsLabel ?? '')
                              setEditingSkills(true)
                            }}
                            className="rounded p-0.5 text-slate-arena transition-colors hover:text-white"
                            aria-label="Изменить навыки"
                          >
                            <MaterialIcon name="edit" size={12} opticalSize={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section id="profile-stats" className="scroll-mt-[88px] grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {profile.statsCards.length === 0 ? (
                  <p className="col-span-full font-mono text-sm text-gull">Статистика загружается с сервера…</p>
                ) : (
                  profile.statsCards.map((c) => <StatMetricCard key={String(c.key)} card={c} />)
                )}
              </section>

              <section id="profile-achievements" className="scroll-mt-[88px] flex flex-col gap-6 max-[360px]:gap-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:pb-2">
                  <h2 className="inline-flex items-center gap-2 text-lg font-bold leading-7 text-white">
                    <MaterialIcon name="military_tech" size={24} opticalSize={24} className="text-turquoise" />
                    Галерея достижений
                  </h2>
                  {sortedAchievements.length > 4 ? (
                    <button
                      type="button"
                      onClick={() => setAchievementsModalOpen(true)}
                      className="group inline-flex items-center gap-1 text-xs font-bold uppercase leading-4 tracking-[0.6px] text-gull transition hover:text-turquoise"
                    >
                      ВСЕ ДОСТИЖЕНИЯ ({sortedAchievements.length})
                      <MaterialIcon
                        name="arrow_forward"
                        size={16}
                        opticalSize={16}
                        className="text-gull transition-colors group-hover:text-turquoise"
                      />
                    </button>
                  ) : null}
                </div>
                {sortedAchievements.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-plantation bg-timber/10 px-6 py-10 text-center">
                    <p className="font-mono text-sm text-gull">
                      Пока нет достижений. Они появятся, когда наставник отметит твои успехи.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 max-[360px]:grid-cols-1 max-[360px]:gap-3 min-[760px]:grid-cols-4">
                    {achievementsPreview.map((a) => (
                      <AchievementTile key={String(a.id)} achievement={a} />
                    ))}
                  </div>
                )}
              </section>

              <section
                id="profile-sprint-history"
                className="scroll-mt-[88px] flex flex-col gap-6 max-[360px]:gap-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:pb-2">
                  <h2 className="inline-flex items-center gap-2 text-lg font-bold leading-7 text-white">
                    <MaterialIcon name="history" size={24} opticalSize={24} className="text-turquoise" />
                    История отправок
                  </h2>
                  <p className="font-mono text-xs text-slate-arena max-[360px]:text-[11px]">
                    Репозитории и демо, которые ты отправлял через терминал на главной.
                  </p>
                </div>
                {historyNotice ? (
                  <p
                    className={
                      historyNotice.type === 'ok'
                        ? 'font-mono text-xs text-spring'
                        : 'font-mono text-xs text-red-400'
                    }
                    role="status"
                  >
                    {historyNotice.text}
                  </p>
                ) : null}
                {historyItems.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-plantation bg-timber/10 px-6 py-10 text-center">
                    <p className="font-mono text-sm text-gull">
                      Пока нет отправок. Когда отправишь решение в активном спринте, оно появится здесь.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-xl border border-plantation bg-timber/15">
                    <ul className="divide-y divide-plantation/80">
                      {historyPreviewItems.map((row) => {
                        const deleted = isSubmissionHistoryDeleted(row)
                        return (
                        <li
                          key={String(row.id)}
                          className={[
                            'px-4 py-4 max-[360px]:px-3 max-[360px]:py-3',
                            deleted
                              ? 'border-l-2 border-red-400/50 bg-red-950/15 opacity-85'
                              : '',
                          ].join(' ')}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <p
                                className={[
                                  'truncate text-sm font-bold',
                                  deleted ? 'text-gull line-through decoration-red-400/60' : 'text-white',
                                ].join(' ')}
                              >
                                {row.sprintTitle ?? row.tabLabel}
                              </p>
                              <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-arena">
                                Спринт #{row.sprintId} · {formatSubmittedAt(row.submittedAt)}
                              </p>
                              {row.statusLabel ? (
                                <p
                                  className={[
                                    'inline-flex w-fit rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide',
                                    deleted
                                      ? 'bg-red-950/40 text-red-300'
                                      : row.status === 'approved'
                                        ? 'bg-spring/10 text-spring'
                                          : 'bg-turquoise/10 text-turquoise',
                                  ].join(' ')}
                                >
                                  {row.statusLabel}
                                </p>
                              ) : null}
                              {row.reviewNote ? (
                                <p className="font-mono text-[10px] text-gull">
                                  Комментарий наставника: {row.reviewNote}
                                </p>
                              ) : null}
                              {row.status === 'approved' && row.mentorScore != null ? (
                                <p className="font-mono text-[10px] text-spring">
                                  Балл за спринт: {row.mentorScore}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                              {row.sprintId != null && String(row.sprintId) !== '' ? (
                                <Link
                                  to={`/hall?sprint=${encodeURIComponent(String(row.sprintId))}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/60 px-3 py-1.5 font-mono text-xs text-catskill transition hover:border-turquoise/40 hover:text-turquoise"
                                >
                                  <MaterialIcon name="bolt" size={14} opticalSize={14} />
                                  К спринту
                                </Link>
                              ) : null}
                              {row.canDelete ? (
                                <button
                                  type="button"
                                  disabled={historyDeletingId === row.id}
                                  onClick={() => void onWithdrawSubmission(row.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-950/20 px-3 py-1.5 font-mono text-xs text-red-300 transition hover:border-red-400/50 disabled:opacity-50"
                                >
                                  {historyDeletingId === row.id ? '…' : 'Отозвать'}
                                </button>
                              ) : null}
                              <a
                                href={row.repoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/60 px-3 py-1.5 font-mono text-xs text-turquoise transition hover:border-turquoise/40 hover:bg-aztec"
                              >
                                <MaterialIcon name="code" size={14} opticalSize={14} />
                                Код
                              </a>
                              {row.demoUrl ? (
                                <a
                                  href={row.demoUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/60 px-3 py-1.5 font-mono text-xs text-gull transition hover:border-white/25 hover:text-white"
                                >
                                  <MaterialIcon name="rocket_launch" size={14} opticalSize={14} />
                                  Демо
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </li>
                        )
                      })}
                    </ul>
                    </div>
                    {historyItems.length > 3 ? (
                      <button
                        type="button"
                        onClick={() => setHistoryModalOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/60 px-3 py-1.5 font-mono text-xs text-catskill transition hover:border-turquoise/40 hover:text-turquoise"
                      >
                        <MaterialIcon name="visibility" size={14} opticalSize={14} />
                        Посмотреть все ({historyItems.length})
                      </button>
                    ) : null}
                  </div>
                )}
              </section>

              <section
                id="profile-settings"
                className="scroll-mt-[88px] flex flex-col gap-6 rounded-xl border border-plantation bg-timber/10 px-8 pb-12 pt-8 max-[360px]:gap-4 max-[360px]:px-4 max-[360px]:pb-6 max-[360px]:pt-5"
              >
                <div className="flex items-center gap-3 pb-2">
                  <MaterialIcon name="manage_accounts" size={24} opticalSize={24} className="text-turquoise" />
                  <h2 className="text-lg font-bold leading-7 text-white">Настройки профиля</h2>
                </div>

                <form
                  className="flex flex-col gap-6"
                  onSubmit={async (e) => {
                    e.preventDefault()
                    setSaveState('saving')
                    setSaveError(null)
                    try {
                      await patchProfile({ form })
                      await refreshSession()
                      setSaveState('saved')
                      window.setTimeout(() => setSaveState('idle'), 2800)
                    } catch (err) {
                      setSaveError(err instanceof Error ? err.message : null)
                      setSaveState('error')
                    }
                  }}
                >
                  <div className="grid grid-cols-1 gap-6 max-[360px]:gap-4 xl:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-gull">
                        Имя пользователя
                      </label>
                      <div className="relative isolate">
                        <MaterialIcon
                          name="person"
                          size={18}
                          opticalSize={18}
                          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-slate-arena"
                        />
                        <input
                          value={form.username}
                          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                          className="box-border h-[46px] w-full rounded-lg border border-plantation bg-aztec py-2.5 pl-10 pr-4 text-base font-normal leading-6 text-white outline-none placeholder:text-gull/50 focus:border-turquoise/40"
                          autoComplete="username"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-gull">
                        Электронная почта
                      </label>
                      <div className="relative isolate min-w-0">
                        <MaterialIcon
                          name="mail"
                          size={18}
                          opticalSize={18}
                          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-slate-arena"
                        />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          className="box-border h-[46px] w-full rounded-lg border border-plantation bg-aztec py-2.5 pl-10 pr-4 text-base font-normal leading-6 text-white outline-none placeholder:text-gull/50 focus:border-turquoise/40"
                          autoComplete="email"
                        />
                      </div>
                      <p className="font-mono text-[10px] leading-relaxed text-gull">
                        Email обновится после сохранения профиля.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 max-[360px]:gap-4 xl:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-gull">Telegram</label>
                      <div className="relative isolate">
                        <MaterialIcon
                          name="send"
                          size={18}
                          opticalSize={18}
                          className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 text-slate-arena"
                        />
                        <input
                          value={form.telegram}
                          onChange={(e) => setForm((f) => ({ ...f, telegram: e.target.value }))}
                          className="box-border h-[46px] w-full rounded-lg border border-plantation bg-aztec py-2.5 pl-10 pr-4 text-base font-normal leading-6 text-white outline-none placeholder:text-gull/50 focus:border-turquoise/40"
                        />
                      </div>
                    </div>
                    <div className="hidden xl:block" aria-hidden />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-gull">О себе</label>
                    <textarea
                      value={form.about}
                      onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
                      rows={4}
                      className="min-h-[94px] w-full resize-y rounded-lg border border-plantation bg-aztec px-4 py-3 font-mono text-sm font-normal leading-[23px] text-white outline-none placeholder:text-gull/50 focus:border-turquoise/40"
                    />
                  </div>

                  <div className="flex flex-col gap-2 border-t border-[rgba(34,66,73,0.5)] pt-4">
                    <div className="flex min-h-6 w-full flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
                      {saveState === 'saved' ? (
                        <span className="font-mono text-xs text-spring md:mr-auto">Изменения сохранены</span>
                      ) : null}
                      {saveState === 'error' ? (
                        <span className="font-mono text-xs text-[#FCA5A5] md:mr-auto">
                          {saveError || 'Не удалось сохранить'}
                        </span>
                      ) : null}
                      <div className="flex w-full min-w-0 flex-row items-stretch gap-3 md:w-auto md:justify-end">
                        <button
                          type="button"
                          className="h-12 min-w-0 flex-1 basis-0 rounded-lg border border-plantation px-4 text-sm font-bold leading-5 text-gull transition hover:bg-white/5 md:w-auto md:flex-none md:basis-auto md:min-w-[107px] md:px-6"
                          onClick={() => setForm({ ...profile.form })}
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          disabled={saveState === 'saving'}
                          className="relative inline-flex h-12 min-w-0 flex-[1.15] basis-0 items-center justify-center gap-2 rounded-lg bg-turquoise px-4 text-sm font-bold leading-5 text-aztec shadow-[0_10px_15px_-3px_rgba(13,204,242,0.2),0_4px_6px_-4px_rgba(13,204,242,0.2)] transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_12px_18px_-3px_rgba(255,255,255,0.35),0_6px_10px_-4px_rgba(255,255,255,0.35)] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:flex-none md:basis-auto md:px-8"
                        >
                          <MaterialIcon
                            name="save"
                            size={18}
                            opticalSize={18}
                            className="shrink-0 text-aztec"
                          />
                          {saveState === 'saving' ? 'Сохранение…' : 'Сохранить'}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="border-t border-plantation pt-6 xl:hidden">
                  <button
                    type="button"
                    onClick={async () => {
                      await logout()
                      navigate('/login', { replace: true })
                    }}
                    className="font-mono text-xs font-semibold uppercase tracking-[1px] text-gull transition hover:text-catskill"
                  >
                    Выйти из аккаунта
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      {historyModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button
            type="button"
            onClick={() => setHistoryModalOpen(false)}
            className="absolute inset-0 bg-aztec/80 backdrop-blur-[1px]"
            aria-label="Закрыть историю отправок"
          />
          <div className="relative z-[1] flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-plantation bg-timber shadow-2xl sm:max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-plantation/70 px-4 py-3">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <MaterialIcon name="history" size={18} opticalSize={18} className="text-turquoise" />
                Все отправки
              </h3>
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="rounded px-2 py-1 font-mono text-xs text-gull hover:bg-white/5"
              >
                Закрыть
              </button>
            </div>
            <div className="overflow-auto p-3 sm:p-4">
              <div className="overflow-hidden rounded-xl border border-plantation bg-timber/15">
                <ul className="divide-y divide-plantation/80">
                  {historyItems.map((row) => {
                    const deleted = isSubmissionHistoryDeleted(row)
                    return (
                      <li
                        key={`modal-${String(row.id)}`}
                        className={[
                          'px-4 py-4 max-[360px]:px-3 max-[360px]:py-3',
                          deleted ? 'border-l-2 border-red-400/50 bg-red-950/15 opacity-85' : '',
                        ].join(' ')}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={[
                                'truncate text-sm font-bold',
                                deleted ? 'text-gull line-through decoration-red-400/60' : 'text-white',
                              ].join(' ')}
                            >
                              {row.sprintTitle ?? row.tabLabel}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-arena">
                              Спринт #{row.sprintId} · {formatSubmittedAt(row.submittedAt)}
                            </p>
                            {row.statusLabel ? (
                              <p
                                className={[
                                  'inline-flex w-fit rounded-md px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide',
                                  deleted
                                    ? 'bg-red-950/40 text-red-300'
                                    : row.status === 'approved'
                                      ? 'bg-spring/10 text-spring'
                                        : 'bg-turquoise/10 text-turquoise',
                                ].join(' ')}
                              >
                                {row.statusLabel}
                              </p>
                            ) : null}
                            {row.reviewNote ? (
                              <p className="font-mono text-[10px] text-gull">
                                Комментарий наставника: {row.reviewNote}
                              </p>
                            ) : null}
                            {row.status === 'approved' && row.mentorScore != null ? (
                              <p className="font-mono text-[10px] text-spring">
                                Балл за спринт: {row.mentorScore}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {row.sprintId != null && String(row.sprintId) !== '' ? (
                              <Link
                                to={`/hall?sprint=${encodeURIComponent(String(row.sprintId))}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/60 px-3 py-1.5 font-mono text-xs text-catskill transition hover:border-turquoise/40 hover:text-turquoise"
                              >
                                <MaterialIcon name="bolt" size={14} opticalSize={14} />
                                К спринту
                              </Link>
                            ) : null}
                            {row.canDelete ? (
                              <button
                                type="button"
                                disabled={historyDeletingId === row.id}
                                onClick={() => void onWithdrawSubmission(row.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-950/20 px-3 py-1.5 font-mono text-xs text-red-300 transition hover:border-red-400/50 disabled:opacity-50"
                              >
                                {historyDeletingId === row.id ? '…' : 'Отозвать'}
                              </button>
                            ) : null}
                            <a
                              href={row.repoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/60 px-3 py-1.5 font-mono text-xs text-turquoise transition hover:border-turquoise/40 hover:bg-aztec"
                            >
                              <MaterialIcon name="code" size={14} opticalSize={14} />
                              Код
                            </a>
                            {row.demoUrl ? (
                              <a
                                href={row.demoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-plantation bg-aztec/60 px-3 py-1.5 font-mono text-xs text-gull transition hover:border-white/25 hover:text-white"
                              >
                                <MaterialIcon name="rocket_launch" size={14} opticalSize={14} />
                                Демо
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {achievementsModalOpen ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button
            type="button"
            onClick={() => setAchievementsModalOpen(false)}
            className="absolute inset-0 bg-aztec/80 backdrop-blur-[1px]"
            aria-label="Закрыть список достижений"
          />
          <div className="relative z-[1] flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-plantation bg-timber shadow-2xl sm:max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-plantation/70 px-4 py-3">
              <h3 className="inline-flex items-center gap-2 text-sm font-bold text-white">
                <MaterialIcon name="military_tech" size={18} opticalSize={18} className="text-turquoise" />
                Все достижения ({sortedAchievements.length})
              </h3>
              <button
                type="button"
                onClick={() => setAchievementsModalOpen(false)}
                className="rounded px-2 py-1 font-mono text-xs text-gull hover:bg-white/5"
              >
                Закрыть
              </button>
            </div>
            <div className="overflow-auto p-3 sm:p-4">
              <div className="grid grid-cols-2 gap-4 max-[360px]:grid-cols-1 min-[760px]:grid-cols-4">
                {sortedAchievements.map((a) => (
                  <AchievementTile key={`all-${String(a.id)}`} achievement={a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <AppFooter />
    </div>
  )
}
