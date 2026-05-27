/** Разбор строки с выделением **так**. */
export function parseHighlightParts(line) {
  const text = String(line ?? '')
  const parts = []
  const re = /\*\*([^*]+)\*\*/g
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    parts.push({ h: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length ? parts : ['']
}

/** Поля формы админки ← объект brief из БД. */
export function taskFieldsFromBrief(brief) {
  const b = brief && typeof brief === 'object' ? brief : {}

  let taskBody = ''
  if (typeof b.taskBody === 'string' && b.taskBody.trim()) {
    taskBody = b.taskBody.trim()
  } else if (Array.isArray(b.taskParagraphs) && b.taskParagraphs.length > 0) {
    const chunks = b.taskParagraphs[0]?.chunks ?? []
    taskBody = chunks
      .map((c) => (typeof c === 'string' ? c : `${c.code ?? ''}${c.after ?? ''}`))
      .join('')
  }

  let acceptanceLines = ''
  if (Array.isArray(b.acceptanceLines)) {
    acceptanceLines = b.acceptanceLines.map((l) => String(l)).join('\n')
  } else if (Array.isArray(b.acceptanceItems)) {
    acceptanceLines = b.acceptanceItems
      .map((item) => {
        const parts = item?.parts ?? []
        return parts
          .map((p) => (typeof p === 'string' ? p : p.h ?? ''))
          .join('')
      })
      .join('\n')
  }

  const links = Array.isArray(b.usefulLinks)
    ? b.usefulLinks
    : Array.isArray(b.resourceLinks)
      ? b.resourceLinks
      : []

  const usefulLinksText = links
    .map((l) => {
      const icon = String(l?.icon ?? 'link').trim()
      const label = String(l?.label ?? '').trim()
      const url = String(l?.url ?? '#').trim()
      return label ? `${icon}|${label}|${url}` : ''
    })
    .filter(Boolean)
    .join('\n')

  return {
    taskQuote: typeof b.quote === 'string' ? b.quote : '',
    taskBody,
    acceptanceLines,
    usefulLinksText,
    acceptanceTitle: typeof b.acceptanceTitle === 'string' ? b.acceptanceTitle : 'Критерии приёмки:',
  }
}

/** Поля формы → фрагмент brief для главной и модалки. */
export function buildTaskBriefFromFields(fields) {
  const quote = String(fields.taskQuote ?? '').trim()
  const taskBody = String(fields.taskBody ?? '').trim()
  const acceptanceTitle = String(fields.acceptanceTitle ?? 'Критерии приёмки:').trim() || 'Критерии приёмки:'
  const acceptanceLines = String(fields.acceptanceLines ?? '')
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const acceptanceItems = acceptanceLines.map((line) => ({ parts: parseHighlightParts(line) }))

  const usefulLinks = String(fields.usefulLinksText ?? '')
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [icon, label, url] = line.split('|').map((s) => s.trim())
      const href = url || '#'
      return {
        icon: icon || 'link',
        label: label || icon || 'Ссылка',
        url: href,
        href,
      }
    })

  const out = {
    acceptanceTitle,
    acceptanceLines,
    acceptanceItems,
    usefulLinks,
    resourceLinks: usefulLinks,
  }

  if (quote) out.quote = quote
  if (taskBody) {
    out.taskBody = taskBody
    out.taskParagraphs = [{ chunks: [taskBody] }]
  }

  return out
}

/** Полный brief для сохранения: поля задания + служебные ключи модалки (title, sprintPath). */
export function buildSprintBriefForSave({ sprintId, sprintTitle, existingBrief, taskFields }) {
  const base = existingBrief && typeof existingBrief === 'object' && !Array.isArray(existingBrief) ? existingBrief : {}
  const task = buildTaskBriefFromFields(taskFields)
  const id = String(sprintId ?? '')
  const links = (task.usefulLinks ?? task.resourceLinks ?? []).map((l) => ({
    icon: l.icon || 'link',
    label: l.label || 'Ссылка',
    url: l.href ?? l.url ?? '#',
    href: l.href ?? l.url ?? '#',
  }))

  const displayTitle = String(sprintTitle ?? '').trim()
  return {
    title: displayTitle || (typeof base.title === 'string' && base.title.trim() ? base.title : id ? `Спринт #${id}` : ''),
    subtitle: typeof base.subtitle === 'string' ? base.subtitle : '',
    sprintPath: typeof base.sprintPath === 'string' && base.sprintPath.trim() ? base.sprintPath : (id ? `/?sprint=${encodeURIComponent(id)}` : '/'),
    ...task,
    usefulLinks: links,
    resourceLinks: links,
  }
}

const VIEW_FALLBACK = {
  taskParagraphs: [
    {
      chunks: [
        'Описание спринта приходит с API в поле brief. Обновите страницу или перезапустите сервер.',
      ],
    },
  ],
  acceptanceTitle: 'Критерии приёмки:',
  acceptanceItems: [{ parts: ['Соответствие макету и работоспособный фронтенд по заданию спринта.'] }],
  resourceLinks: [],
  usefulLinks: [],
  sprintPath: '/',
}

/** Единое представление brief для главной и модалки «Открыть бриф». */
export function normalizeSprintBriefView(sprint) {
  const raw = sprint?.brief && typeof sprint.brief === 'object' ? sprint.brief : {}
  const fields = taskFieldsFromBrief(raw)

  let taskParagraphs = []
  if (fields.taskBody) {
    taskParagraphs = [{ chunks: [fields.taskBody] }]
  } else if (Array.isArray(raw.taskParagraphs) && raw.taskParagraphs.length > 0) {
    taskParagraphs = raw.taskParagraphs
  }

  const desc = typeof sprint?.description === 'string' ? sprint.description.trim() : ''
  if (!taskParagraphs.length && desc) {
    taskParagraphs = desc.split(/\n\n+/).map((t) => ({ chunks: [t.trim()] })).filter((p) => p.chunks[0])
  }

  let acceptanceItems = Array.isArray(raw.acceptanceItems) ? raw.acceptanceItems : []
  if (fields.acceptanceLines) {
    acceptanceItems = fields.acceptanceLines
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => ({ parts: parseHighlightParts(line) }))
  }

  const linkLines = fields.usefulLinksText
    ? fields.usefulLinksText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [icon, label, url] = line.split('|').map((s) => s.trim())
          const href = url || '#'
          return { icon: icon || 'link', label: label || 'Ссылка', url: href, href }
        })
    : (Array.isArray(raw.resourceLinks) && raw.resourceLinks.length
        ? raw.resourceLinks
        : Array.isArray(raw.usefulLinks)
          ? raw.usefulLinks
          : []
      ).map((l) => ({
        icon: l.icon || 'link',
        label: l.label || 'Ссылка',
        url: l.href ?? l.url ?? '#',
        href: l.href ?? l.url ?? '#',
      }))

  const hasContent =
    fields.taskQuote ||
    taskParagraphs.length > 0 ||
    acceptanceItems.length > 0 ||
    linkLines.length > 0

  const brief = {
    ...(hasContent ? raw : { ...VIEW_FALLBACK, ...raw }),
    quote: fields.taskQuote || raw.quote,
    taskParagraphs: taskParagraphs.length ? taskParagraphs : VIEW_FALLBACK.taskParagraphs,
    acceptanceTitle: fields.acceptanceTitle || raw.acceptanceTitle || VIEW_FALLBACK.acceptanceTitle,
    acceptanceItems: acceptanceItems.length ? acceptanceItems : VIEW_FALLBACK.acceptanceItems,
    usefulLinks: linkLines,
    resourceLinks: linkLines,
    sprintPath: typeof raw.sprintPath === 'string' && raw.sprintPath.trim() ? raw.sprintPath : VIEW_FALLBACK.sprintPath ?? '/',
  }

  return brief
}

export const EMPTY_TASK_FIELDS = {
  taskQuote: '',
  taskBody: '',
  acceptanceLines: '',
  usefulLinksText: '',
}

export const DEFAULT_TASK_TEMPLATE = {
  taskQuote:
    '«Перед вами — макет той самой платформы, на которой вы сейчас находитесь. Ваша задача — сверстать его. Да, это рекурсия.»',
  taskBody:
    'Реализуйте все три страницы по макету: index.html (активный спринт), hall.html (зал славы) и profile.html (профиль). Стек — любой: чистый HTML/CSS, React, Vue, Svelte, Tailwind, Bootstrap, генерация через ИИ — что угодно.',
  acceptanceLines:
    'Главное — **соответствие макету**. Чем точнее, тем выше оценка наставника.\n' +
    'Весь независимый от бэка JS-функционал должен **работать**: модалки, таймер, табы, формы и т.д.\n' +
    'Все запросы к серверу — через **мок-API** (заглушки). На основе победившего мок-API в следующем спринте будем проектировать настоящий бэкенд.',
  usefulLinksText:
    'terminal|Платформенный SDK v2.1|#\n' +
    'description|Спецификация Quantum|#\n' +
    'link|Репозиторий тестов|#',
}
