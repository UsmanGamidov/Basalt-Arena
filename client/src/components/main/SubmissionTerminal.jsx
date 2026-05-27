import { useMemo, useState } from 'react'
import { postSubmission } from '../../api/basaltApi.js'
import { useAuth } from '../../auth/useAuth.js'
import { notifyLiveDataChanged } from '../../lib/liveData.js'
import { isSprintAcceptingSubmissions } from '../../lib/sprintTime.js'
import { MaterialIcon } from '../ui/MaterialIcon.jsx'

export function SubmissionTerminal() {
  const { refreshSession, activeSprint, ready } = useAuth()
  const [repo, setRepo] = useState('')
  const [demo, setDemo] = useState('')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState(null)

  const sprintOpen = useMemo(() => {
    if (!activeSprint) return false
    if (typeof activeSprint.systemActive === 'boolean') return activeSprint.systemActive
    return isSprintAcceptingSubmissions(true, activeSprint.endsAt)
  }, [activeSprint])

  const submissionClosedByDeadline = Boolean(activeSprint) && !sprintOpen
  const notEnrolled = Boolean(activeSprint?.id) && activeSprint.enrolled === false
  const noActiveSprint = ready && !activeSprint?.id
  const activeSubmission = activeSprint?.activeSubmission ?? null
  const submissionBlocked = Boolean(activeSubmission)
  const formDisabled = noActiveSprint || notEnrolled || submissionClosedByDeadline || submissionBlocked

  async function handleSubmit(e) {
    e.preventDefault()
    if (notEnrolled) {
      setNotice({
        type: 'err',
        text: 'Отправка доступна только зачисленным участникам спринта',
      })
      return
    }
    if (!activeSprint?.id) {
      setNotice({ type: 'err', text: 'Сейчас нет активного спринта для отправки' })
      return
    }
    if (!repo.trim()) {
      setNotice({ type: 'err', text: 'Укажите ссылку на репозиторий' })
      return
    }
    setPending(true)
    setNotice(null)
    try {
      const res = await postSubmission({
        repoUrl: repo.trim(),
        demoUrl: demo.trim() || undefined,
      })
      setNotice({
        type: 'ok',
        text: `Отправка принята (${res.statusLabel ?? 'на проверке'}). Наставник проверит решение.`,
      })
      setRepo('')
      setDemo('')
      void refreshSession()
      notifyLiveDataChanged({ source: 'submission' })
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Ошибка отправки' })
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-plantation bg-timber p-6 pb-10 max-[360px]:gap-4 max-[360px]:p-4 max-[360px]:pb-6">
      <div className="flex items-center gap-2">
        <MaterialIcon name="publish" size={24} opticalSize={25} className="text-spring" />
        <h2 className="text-lg font-bold uppercase leading-7 tracking-[0.45px] text-catskill max-[360px]:text-base max-[360px]:leading-6">
          Терминал отправки
        </h2>
      </div>

      <form className="flex flex-col gap-5 max-[360px]:gap-4" onSubmit={handleSubmit}>
        {!ready ? (
          <p className="pl-1 font-mono text-xs text-half-baked">Загрузка…</p>
        ) : noActiveSprint ? (
          <p className="pl-1 font-mono text-xs text-red-400/90">
            Сейчас нет активного спринта. Когда админ включит спринт на главной, здесь появится отправка.
          </p>
        ) : notEnrolled ? (
          <p className="rounded-lg border border-plantation/80 bg-aztec/60 px-3 py-2.5 font-mono text-xs text-half-baked">
            Нет доступа для отправки решения.
          </p>
        ) : (
          <>
            {submissionClosedByDeadline ? (
              <p className="font-mono text-[11px] text-red-400/90">Приём решений по дедлайну закрыт.</p>
            ) : null}
            {submissionBlocked ? (
              <p className="font-mono text-[11px] text-turquoise/90">
                Текущая отправка: {activeSubmission.statusLabel ?? 'на проверке'}
                {activeSubmission.status === 'approved' &&
                activeSubmission.mentorScore != null &&
                Number.isFinite(activeSubmission.mentorScore)
                  ? ` · ${activeSubmission.mentorScore} баллов за спринт`
                  : ''}
                . Повторная отправка недоступна.
              </p>
            ) : null}
          </>
        )}

        <div className="space-y-2">
          <label className="block pl-1 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-half-baked max-[360px]:text-[9px]">
            Ссылка на репозиторий
          </label>
          <div className="relative">
            <MaterialIcon
              name="code"
              size={14}
              opticalSize={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-turquoise"
            />
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="https://github.com/..."
              disabled={formDisabled || pending}
              className="box-border h-[38px] w-full rounded-lg border border-plantation bg-aztec py-[9px] pl-10 pr-3 font-sans text-sm font-normal leading-[18px] text-catskill placeholder:text-pale-sky/90 focus:border-plantation focus:outline-none focus:ring-1 focus:ring-turquoise/15 [font-synthesis:none] max-[360px]:text-[13px] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block pl-1 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-half-baked max-[360px]:text-[9px]">
            Ссылка на демо (необязательно)
          </label>
          <div className="relative">
            <MaterialIcon
              name="visibility"
              size={14}
              opticalSize={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-turquoise"
            />
            <input
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              placeholder="https://demo.basalt..."
              disabled={formDisabled || pending}
              className="box-border h-[38px] w-full rounded-lg border border-plantation bg-aztec py-[9px] pl-10 pr-3 font-sans text-sm font-normal leading-[18px] text-catskill placeholder:text-pale-sky/90 focus:border-plantation focus:outline-none focus:ring-1 focus:ring-turquoise/15 [font-synthesis:none] max-[360px]:text-[13px] disabled:opacity-50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending || formDisabled}
          className="group flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-transparent bg-turquoise px-0 py-4 font-sans text-base font-bold uppercase leading-6 tracking-[1.6px] text-aztec shadow-[0_0_5px_rgba(13,204,242,0.3)] transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_0_14px_rgba(255,255,255,0.4)] disabled:opacity-60 max-[360px]:h-12 max-[360px]:gap-2 max-[360px]:text-sm max-[360px]:tracking-[1.2px]"
        >
          {pending ? 'Отправка…' : 'Отправить решение'}
          <MaterialIcon
            name="send"
            size={24}
            opticalSize={24}
            className="text-aztec transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
        {notice ? (
          <p
            className={
              notice.type === 'ok'
                ? 'text-center text-xs text-spring'
                : 'text-center text-xs text-red-400'
            }
            role="status"
          >
            {notice.text}
          </p>
        ) : null}
      </form>
    </section>
  )
}
