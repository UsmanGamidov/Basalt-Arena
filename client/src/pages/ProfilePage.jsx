import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { patchProfile } from '../api/basaltApi.js'
import { useAuth } from '../auth/useAuth.js'
import { AppFooter } from '../components/layout/AppFooter.jsx'
import { AppHeader } from '../components/layout/AppHeader.jsx'
import { MaterialIcon } from '../components/ui/MaterialIcon.jsx'

function dicebearAvatar(seed) {
  const q = new URLSearchParams({
    seed: String(seed),
    scale: '62',
    radius: '12',
  })
  return `https://api.dicebear.com/7.x/identicon/svg?${q.toString()}`
}

const FALLBACK_PROFILE = {
  bio: 'Разработчик. Учусь, делаю проекты, участвую в спринтах Basalt Arena.',
  skillsLabel: 'Python, Go, Rust',
  contacts: {
    telegram: '@dev_architect',
    email: 'admin@admin.com',
    github: '/dev_architect',
  },
  statsCards: [
    {
      key: 'points',
      label: 'Баллы',
      value: '90',
      trendLabel: '+12% за месяц',
      trendVariant: 'malachite',
      icon: 'star',
      iconTint: 'turquoise',
    },
    {
      key: 'rank',
      label: 'Глобальный ранг',
      value: '#3',
      trendLabel: '+2 позиции',
      trendVariant: 'malachite',
      icon: 'bar_chart',
      iconTint: 'turquoise',
    },
    {
      key: 'sprints',
      label: 'Спринтов пройдено',
      value: '1',
      trendLabel: '100% участия',
      trendVariant: 'turquoise',
      icon: 'bolt',
      iconTint: 'turquoise',
    },
    {
      key: 'money',
      label: 'Заработано денег',
      value: '20 000 \u20BD',
      trendLabel: '+20 000 \u20BD',
      trendVariant: 'spring',
      icon: 'account_balance_wallet',
      iconTint: 'spring',
    },
  ],
  achievements: [
    {
      id: 'gaz',
      title: 'Газующий',
      subtitle: 'Не пропустил ни одного спринта',
      icon: 'calendar_month',
      variant: 'earned',
    },
    {
      id: 'arch',
      title: 'Архитектор',
      subtitle: 'Создатель Basalt Arena',
      icon: 'architecture',
      variant: 'earned',
    },
    {
      id: 'first',
      title: 'Первый',
      subtitle: 'Выложил решение первым',
      icon: 'looks_one',
      variant: 'earned',
    },
    {
      id: 'ghost',
      title: 'Невидимка',
      subtitle: 'Ни разу не участвовал',
      icon: 'block',
      variant: 'locked',
    },
  ],
  form: {
    username: 'dev_architect',
    email: 'admin@admin.com',
    telegram: '@dev_architect',
    about: 'Разработчик. Учусь, делаю проекты, участвую в спринтах Basalt Arena.',
  },
}

const SIDEBAR_NAV = [
  { key: 'overview', label: 'Обзор', icon: 'person', sectionId: 'profile-hero' },
  { key: 'badges', label: 'Бейджи и достижения', icon: 'workspace_premium', sectionId: 'profile-achievements' },
  { key: 'stats', label: 'Статистика', icon: 'leaderboard', sectionId: 'profile-stats' },
  { key: 'history', label: 'История спринтов', icon: 'history', sectionId: null, disabled: true },
  { key: 'settings', label: 'Настройки', icon: 'settings', sectionId: 'profile-settings' },
]

const SECTION_TO_NAV = {
  'profile-hero': 'overview',
  'profile-stats': 'stats',
  'profile-achievements': 'badges',
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
  return tint === 'spring' ? 'text-spring' : 'text-turquoise'
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
        'relative isolate overflow-hidden rounded-xl border border-plantation bg-timber/20 p-6 transition-[border-color,box-shadow] duration-300',
        hoverFrameClass,
      ].join(' ')}
    >
      <div
        className={`pointer-events-none absolute right-px top-px flex items-start justify-end p-2 opacity-10 ${bigIconTintClass(iconTint)}`}
        aria-hidden
      >
        <MaterialIcon name={card.icon} size={72} opticalSize={24} className="leading-none" />
      </div>
      <div className="relative z-[1] flex min-h-[99px] flex-col">
        <p className="pb-1 text-xs font-bold uppercase leading-4 tracking-[1.2px] text-gull">{card.label}</p>
        <p className="pb-2 text-[36px] font-bold leading-[45px] text-white">{card.value}</p>
        <div
          className={`inline-flex w-max max-w-full items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold leading-4 ${trendPillClass(trendVariant)}`}
        >
          <MaterialIcon name="trending_up" size={14} opticalSize={14} className="leading-none" />
          <span>{card.trendLabel}</span>
        </div>
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
        'group relative isolate flex flex-col items-center rounded-xl p-6 transition-[border-color,background-color,box-shadow] duration-300',
        locked
          ? 'border border-dashed border-red-500/30 bg-[rgba(239,68,68,0.05)] hover:border-red-400/55 hover:bg-[rgba(239,68,68,0.08)]'
          : 'border border-plantation bg-timber/10 hover:border-turquoise/45 hover:bg-timber/20 hover:shadow-[0_0_24px_-12px_rgba(13,204,242,0.28)]',
      ].join(' ')}
    >
      <div className="relative z-[1] mb-4 flex flex-col items-center">
        <div
          className={[
            'relative flex size-16 items-center justify-center rounded-full bg-timber shadow-[0_10px_15px_-3px_rgba(0,0,0,0.2),0_4px_6px_-4px_rgba(0,0,0,0.2)]',
            locked ? 'border border-red-500/40' : 'border border-plantation',
          ].join(' ')}
        >
          <MaterialIcon
            name={iconName}
            size={30}
            opticalSize={24}
            className={[
              'transition-transform duration-300 group-hover:scale-110',
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

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile: profileRaw, refreshSession, logout } =
    useAuth()
  const profile = useMemo(() => {
    const p = profileRaw && typeof profileRaw === 'object' ? profileRaw : {}
    return {
      ...FALLBACK_PROFILE,
      ...p,
      contacts: {
        ...FALLBACK_PROFILE.contacts,
        ...(p.contacts && typeof p.contacts === 'object' ? p.contacts : {}),
      },
      form: {
        ...FALLBACK_PROFILE.form,
        ...(p.form && typeof p.form === 'object' ? p.form : {}),
      },
      statsCards: Array.isArray(p.statsCards) ? p.statsCards : FALLBACK_PROFILE.statsCards,
      achievements: Array.isArray(p.achievements) ? p.achievements : FALLBACK_PROFILE.achievements,
    }
  }, [profileRaw])

  const [activeNav, setActiveNav] = useState('overview')
  const [form, setForm] = useState(() => ({ ...FALLBACK_PROFILE.form }))
  const [saveState, setSaveState] = useState('idle')
  const scrollSuppressRef = useRef(0)

  useEffect(() => {
    const id = window.setTimeout(() => {
      setForm({
        ...FALLBACK_PROFILE.form,
        ...(profileRaw?.form && typeof profileRaw.form === 'object' ? profileRaw.form : {}),
      })
    }, 0)
    return () => window.clearTimeout(id)
  }, [profileRaw])

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

  const avatarSrc =
    user?.avatarUrl?.trim() ||
    dicebearAvatar(user?.handle ?? user?.id ?? 'user')

  const scrollToSection = useCallback((navKey, sectionId) => {
    scrollSuppressRef.current = Date.now() + 800
    setActiveNav(navKey)
    const el = document.getElementById(sectionId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const displayHandle = `@${String(user.handle ?? '').replace(/^@/, '')}`

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col bg-aztec">
      <AppHeader />
      <main className="flex-1 pt-[73px]">
        <div className="mx-auto max-w-[1400px] px-6 pb-10 pt-10 md:px-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
            <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-[306px]">
              <nav className="flex flex-col gap-2">
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
                        'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium leading-5 transition',
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

              <div className="flex flex-col gap-4 rounded-xl border border-plantation bg-timber/20 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase leading-4 tracking-[1.2px] text-slate-arena">Контакты</p>
                  <button
                    type="button"
                    className="rounded p-1 text-slate-arena transition hover:bg-white/5 hover:text-white"
                    aria-label="Изменить контакты"
                  >
                    <MaterialIcon name="edit" size={14} opticalSize={14} />
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="group flex items-center justify-between gap-2 rounded border border-transparent px-2 py-2 transition-[border-color,background-color] duration-200 hover:border-white/15 hover:bg-white/[0.045]">
                    <span className="inline-flex items-center gap-2 text-sm text-gull transition-colors group-hover:text-white">
                      <MaterialIcon
                        name="send"
                        size={18}
                        opticalSize={18}
                        className="text-gull transition-colors group-hover:text-white"
                      />
                      Telegram
                    </span>
                    <span className="text-sm text-turquoise">{profile.contacts.telegram}</span>
                  </div>
                  <div className="group flex items-center justify-between gap-2 rounded border border-transparent px-2 py-2 transition-[border-color,background-color] duration-200 hover:border-white/15 hover:bg-white/[0.045]">
                    <span className="inline-flex items-center gap-2 text-sm text-gull transition-colors group-hover:text-white">
                      <MaterialIcon
                        name="mail"
                        size={18}
                        opticalSize={18}
                        className="text-gull transition-colors group-hover:text-white"
                      />
                      Email
                    </span>
                    <span className="truncate text-sm text-turquoise">{profile.contacts.email}</span>
                  </div>
                  <div className="group flex items-center justify-between gap-2 rounded border border-transparent px-2 py-2 transition-[border-color,background-color] duration-200 hover:border-white/15 hover:bg-white/[0.045]">
                    <span className="inline-flex items-center gap-2 text-sm text-gull transition-colors group-hover:text-white">
                      <MaterialIcon
                        name="code"
                        size={18}
                        opticalSize={18}
                        className="text-gull transition-colors group-hover:text-white"
                      />
                      GitHub
                    </span>
                    <span className="text-sm text-turquoise">{profile.contacts.github}</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col gap-8">
              <section
                id="profile-hero"
                className="scroll-mt-[88px] relative isolate overflow-hidden rounded-xl border border-plantation bg-timber/20 p-8"
              >
                <div
                  className="pointer-events-none absolute -right-[127px] -top-[127px] size-64 rounded-full bg-turquoise/5 blur-[32px]"
                  aria-hidden
                />
                <div className="relative z-[1] flex flex-col items-center gap-8 md:flex-row md:items-center">
                  <div className="relative flex size-[132px] shrink-0 items-center justify-center rounded-2xl border-2 border-turquoise/50 bg-white/[0.002] shadow-[0_10px_15px_-3px_rgba(13,204,242,0.1),0_4px_6px_-4px_rgba(13,204,242,0.1)]">
                    <img
                      src={avatarSrc}
                      alt=""
                      className="size-32 object-contain"
                      decoding="async"
                      draggable={false}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col items-center gap-1 md:items-start">
                    <h1 className="text-center text-[30px] font-bold leading-9 tracking-[-0.75px] text-white md:text-left">
                      {displayHandle}
                    </h1>
                    <p className="max-w-[512px] text-center font-mono text-sm font-normal leading-5 text-gull md:text-left">
                      {profile.bio}
                    </p>
                    <div className="flex w-full flex-wrap justify-center gap-2 pt-4 md:justify-start">
                      <div className="inline-flex items-center gap-2 rounded border border-plantation bg-aztec/80 px-3 py-1.5">
                        <MaterialIcon name="code" size={14} opticalSize={14} className="text-[#4ADE80]" />
                        <span className="text-xs font-medium leading-4 text-mystic">{profile.skillsLabel}</span>
                        <MaterialIcon name="edit" size={12} opticalSize={12} className="text-slate-arena" />
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section id="profile-stats" className="scroll-mt-[88px] grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {profile.statsCards.map((c) => (
                  <StatMetricCard key={String(c.key)} card={c} />
                ))}
              </section>

              <section id="profile-achievements" className="scroll-mt-[88px] flex flex-col gap-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:pb-2">
                  <h2 className="inline-flex items-center gap-2 text-lg font-bold leading-7 text-white">
                    <MaterialIcon name="emoji_events" size={24} opticalSize={24} className="text-turquoise" />
                    Галерея достижений
                  </h2>
                  <Link
                    to="/hall"
                    className="group inline-flex items-center gap-1 text-xs font-bold uppercase leading-4 tracking-[0.6px] text-gull transition hover:text-turquoise"
                  >
                    ВСЕ ДОСТИЖЕНИЯ
                    <MaterialIcon
                      name="arrow_forward"
                      size={16}
                      opticalSize={16}
                      className="text-gull transition-colors group-hover:text-turquoise"
                    />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4 min-[760px]:grid-cols-4">
                  {profile.achievements.map((a) => (
                    <AchievementTile key={String(a.id)} achievement={a} />
                  ))}
                </div>
              </section>

              <section
                id="profile-settings"
                className="scroll-mt-[88px] flex flex-col gap-6 rounded-xl border border-plantation bg-timber/10 px-8 pb-12 pt-8"
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
                    try {
                      await patchProfile({ form })
                      await refreshSession()
                      setSaveState('saved')
                      window.setTimeout(() => setSaveState('idle'), 2800)
                    } catch (err) {
                      console.warn('[profile] save', err)
                      setSaveState('error')
                    }
                  }}
                >
                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                      <div className="relative isolate">
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
                        <span className="font-mono text-xs text-[#FCA5A5] md:mr-auto">Не удалось сохранить</span>
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
                          className="group relative inline-flex h-12 min-w-0 flex-[1.15] basis-0 items-center justify-center gap-2 rounded-lg bg-turquoise px-4 text-sm font-bold leading-5 text-aztec shadow-[0_10px_15px_-3px_rgba(13,204,242,0.2),0_4px_6px_-4px_rgba(13,204,242,0.2)] transition-[box-shadow,filter] duration-300 hover:brightness-105 hover:shadow-[0_12px_18px_-3px_rgba(13,204,242,0.3),0_6px_10px_-4px_rgba(13,204,242,0.3)] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:flex-none md:basis-auto md:px-8"
                        >
                          <MaterialIcon
                            name="save"
                            size={18}
                            opticalSize={18}
                            className="shrink-0 text-aztec transition-transform duration-300 group-hover:translate-x-0.5"
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
      <AppFooter />
    </div>
  )
}
