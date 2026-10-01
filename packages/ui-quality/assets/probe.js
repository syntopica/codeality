// Serialises what the ui-quality rules need from a rendered page. It is
// evaluated inside the page as `(source)(mainSelector)`, so it is plain
// browser JavaScript with no imports, kept outside the bundle on purpose: a
// bundler's injected helpers would not exist on the page. The bare expression
// is the point: the caller wraps it, so nothing here uses it.
// oxlint-disable-next-line no-unused-expressions
;(mainSelector) => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const colorCache = new Map()

  // Any CSS colour, oklch and color-mix included, resolved to sRGB bytes by
  // painting one pixel: computed styles may keep the authored colour space.
  const toRgba = (value) => {
    if (!value || !CSS.supports('color', value)) return null
    if (colorCache.has(value)) return colorCache.get(value)
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = value
    context.fillRect(0, 0, 1, 1)
    const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data
    const rgba = [r, g, b, Math.round((a / 255) * 100) / 100]
    colorCache.set(value, rgba)
    return rgba
  }

  const SKIP = new Set([
    'SCRIPT',
    'STYLE',
    'NOSCRIPT',
    'TEMPLATE',
    'HEAD',
    'META',
    'LINK',
  ])
  const CONTROL_TAGS = new Set(['INPUT', 'SELECT', 'TEXTAREA'])
  const HIDDEN_INPUTS = new Set([
    'hidden',
    'checkbox',
    'radio',
    'range',
    'color',
    'file',
  ])

  // A box of one pixel or less paints nothing a person can see: it is the
  // screen-reader-only pattern, whose clipping is the point.
  // checkVisibility also sees what the box does not: content inside a closed
  // <details> keeps a layout box but is hidden by content-visibility.
  const isVisible = (element, style, rect) =>
    element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
    rect.width > 1 &&
    rect.height > 1 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    Number(style.opacity) > 0

  const ownText = (element) => {
    let text = ''
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) text += node.textContent
    }
    return text.replace(/\s+/g, ' ').trim()
  }

  const selectorPart = (element) => {
    const tag = element.tagName.toLowerCase()
    if (element.id) return `${tag}#${CSS.escape(element.id)}`
    const classes = [...element.classList]
      .slice(0, 2)
      .map((c) => `.${CSS.escape(c)}`)
    return tag + classes.join('')
  }

  const selectorOf = (element) => {
    const parts = []
    let current = element
    while (current && current !== document.body && parts.length < 4) {
      parts.unshift(selectorPart(current))
      if (current.id) break
      current = current.parentElement
    }
    return parts.join(' > ')
  }

  const isControl = (element) => {
    if (
      element.getAttribute('role') === 'searchbox' ||
      element.getAttribute('role') === 'textbox'
    )
      return true
    if (!CONTROL_TAGS.has(element.tagName)) return false
    return !(element.tagName === 'INPUT' && HIDDEN_INPUTS.has(element.type))
  }

  // Inputs that open the keyboard; buttons and pickers rendered as inputs do not.
  const NON_TYPING_INPUTS = new Set(['button', 'submit', 'reset', 'image'])
  const isTextEntry = (element) => {
    if (element.isContentEditable)
      return !element.parentElement || !element.parentElement.isContentEditable
    if (element.tagName === 'TEXTAREA' || element.tagName === 'SELECT')
      return true
    if (element.tagName !== 'INPUT') return false
    return (
      !HIDDEN_INPUTS.has(element.type) && !NON_TYPING_INPUTS.has(element.type)
    )
  }

  const ids = new Map()
  const elements = []
  const main = document.querySelector(mainSelector || 'main')
  // The page-level header: a <header> outside any sectioning element, which
  // the HTML accessibility mapping exposes as the banner landmark.
  const banner =
    document.querySelector('[role="banner"]') ||
    [...document.querySelectorAll('header')].find(
      (header) => !header.closest('article, aside, main, nav, section'),
    )

  for (const element of document.body.querySelectorAll('*')) {
    if (SKIP.has(element.tagName)) continue
    if (element.closest('svg') && element.tagName.toLowerCase() !== 'svg')
      continue
    const style = getComputedStyle(element)
    const rect = element.getBoundingClientRect()
    if (!isVisible(element, style, rect)) continue
    const text = ownText(element)
    let parent = element.parentElement
    while (parent && !ids.has(parent)) parent = parent.parentElement
    const id = elements.length
    ids.set(element, id)
    elements.push({
      id,
      parent: parent ? ids.get(parent) : null,
      tag: element.tagName.toLowerCase(),
      signature: [
        element.tagName.toLowerCase(),
        ...[...element.classList].sort(),
      ].join('.'),
      selector: selectorOf(element),
      x: Math.round(rect.left + window.scrollX),
      y: Math.round(rect.top + window.scrollY),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      text: text.slice(0, 80),
      textLength: text.length,
      textTail: text.slice(-3),
      color: toRgba(style.color),
      backgroundColor: toRgba(style.backgroundColor),
      hasBackgroundImage: style.backgroundImage !== 'none',
      borderWidths: [
        parseFloat(style.borderTopWidth),
        parseFloat(style.borderRightWidth),
        parseFloat(style.borderBottomWidth),
        parseFloat(style.borderLeftWidth),
      ],
      borderColors: [
        toRgba(style.borderTopColor),
        toRgba(style.borderRightColor),
        toRgba(style.borderBottomColor),
        toRgba(style.borderLeftColor),
      ],
      overflowX: style.overflowX,
      overflowY: style.overflowY,
      position: style.position,
      textOverflow: style.textOverflow,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      isControl: isControl(element),
      fontSize: parseFloat(style.fontSize),
      isTextEntry: isTextEntry(element),
      isMain: element === main,
      isBanner: element === banner,
    })
  }

  // shadcn/ui keeps a token as its channels alone ("222 47% 11%") and wraps it
  // in hsl() where it is used, so a bare triplet is read as hsl.
  const HSL_TRIPLET = /^-?[\d.]+(deg)?\s+[\d.]+%\s+[\d.]+%(\s*\/\s*[\d.]+%?)?$/
  const variables = {}
  const rootStyle = getComputedStyle(document.documentElement)
  for (const name of rootStyle) {
    if (!name.startsWith('--')) continue
    const value = rootStyle.getPropertyValue(name).trim()
    const rgba = toRgba(HSL_TRIPLET.test(value) ? `hsl(${value})` : value)
    if (rgba) variables[name] = rgba
  }

  return {
    elements,
    variables,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
  }
}
