const fieldLabel =
  'pl-1 font-mono text-[10px] font-bold uppercase tracking-[1px] text-half-baked'
const textareaClass =
  'resize-y rounded-lg border border-plantation bg-aztec px-3 py-2 font-mono text-sm leading-relaxed text-catskill'

export function SprintTaskFields({
  taskQuote,
  setTaskQuote,
  taskBody,
  setTaskBody,
  acceptanceLines,
  setAcceptanceLines,
  usefulLinksText,
  setUsefulLinksText,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-turquoise/20 bg-turquoise/5 p-4">
      <div>
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-turquoise">
          Текст задания и бриф
        </h3>
        <p className="mt-1 font-mono text-[11px] leading-relaxed text-gull">
          Текст для карточки задания на главной и модалки «Открыть бриф» в зале славы.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>Цитата (блок с полоской слева)</span>
        <textarea
          value={taskQuote}
          onChange={(e) => setTaskQuote(e.target.value)}
          rows={3}
          className={textareaClass}
          placeholder="«Перед вами — макет…»"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>Основной текст задания</span>
        <textarea
          value={taskBody}
          onChange={(e) => setTaskBody(e.target.value)}
          rows={5}
          className={textareaClass}
          placeholder="Реализуйте все три страницы по макету…"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>Критерии приёмки (каждый пункт с новой строки)</span>
        <textarea
          value={acceptanceLines}
          onChange={(e) => setAcceptanceLines(e.target.value)}
          rows={5}
          className={textareaClass}
          placeholder={'Главное — **соответствие макету**. Чем точнее…\nВесь JS должен **работать**…'}
        />
        <span className="pl-1 font-mono text-[10px] text-gull">
          Выделение: оберните фразу в **двойные звёздочки**
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={fieldLabel}>Полезные ссылки (строка: иконка|название|url)</span>
        <textarea
          value={usefulLinksText}
          onChange={(e) => setUsefulLinksText(e.target.value)}
          rows={4}
          spellCheck={false}
          className={`${textareaClass} text-xs`}
          placeholder={'terminal|Платформенный SDK v2.1|https://…\ndescription|Спецификация|#'}
        />
      </label>
    </div>
  )
}
