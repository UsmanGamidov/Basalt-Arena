import { useState } from 'react'
import { postSubmission } from '../../api/basaltApi.js'
import {
  figmaCode,
  figmaLaunch,
  figmaSendOnTurquoise,
  figmaVisibility,
} from '../../assets/icons/index.js'
import { figmaIcon } from '../ui/figmaIconSizes.js'
import { SvgIcon } from '../ui/SvgIcon.jsx'

export function SubmissionTerminal() {
  const [repo, setRepo] = useState('')
  const [demo, setDemo] = useState('')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
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
      setNotice({ type: 'ok', text: `Отправлено (мок): ${res.id}` })
      setRepo('')
      setDemo('')
    } catch (err) {
      setNotice({ type: 'err', text: err instanceof Error ? err.message : 'Ошибка отправки' })
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="flex flex-col gap-6 rounded-xl border border-plantation bg-timber p-6 pb-10">
      <div className="flex items-center gap-2">
        <SvgIcon src={figmaLaunch} className={figmaIcon.row14} alt="" />
        <h2 className="text-lg font-bold uppercase leading-7 tracking-[0.45px] text-catskill">
          Терминал отправки
        </h2>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block pl-1 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-half-baked">
            Ссылка на репозиторий
          </label>
          <div className="relative">
            <SvgIcon src={figmaCode} className={figmaIcon.inputCode} alt="" />
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="https://github.com/..."
              className="box-border h-[38px] w-full rounded-lg border border-plantation bg-aztec py-[9px] pl-10 pr-3 font-sans text-sm font-normal leading-[18px] text-catskill placeholder:text-pale-sky/90 focus:border-plantation focus:outline-none focus:ring-1 focus:ring-turquoise/15 [font-synthesis:none]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block pl-1 text-[10px] font-bold uppercase leading-[15px] tracking-[1px] text-half-baked">
            Ссылка на демо (необязательно)
          </label>
          <div className="relative">
            <SvgIcon src={figmaVisibility} className={figmaIcon.inputEye} alt="" />
            <input
              value={demo}
              onChange={(e) => setDemo(e.target.value)}
              placeholder="https://demo.basalt..."
              className="box-border h-[38px] w-full rounded-lg border border-plantation bg-aztec py-[9px] pl-10 pr-3 font-sans text-sm font-normal leading-[18px] text-catskill placeholder:text-pale-sky/90 focus:border-plantation focus:outline-none focus:ring-1 focus:ring-turquoise/15 [font-synthesis:none]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="group flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-transparent bg-turquoise px-0 py-4 font-sans text-base font-bold uppercase leading-6 tracking-[1.6px] text-aztec shadow-[0_0_5px_rgba(13,204,242,0.3)] transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-[0_0_14px_rgba(255,255,255,0.4)] disabled:opacity-60"
        >
          {pending ? 'Отправка…' : 'Отправить решение'}
          <SvgIcon
            src={figmaSendOnTurquoise}
            className={`${figmaIcon.send} transition-transform duration-300 group-hover:translate-x-1`}
            alt=""
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
