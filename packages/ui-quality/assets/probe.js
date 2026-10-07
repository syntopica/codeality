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

  // The canvas serialises an sRGB colour as #rrggbb or rgba(r, g, b, a) with
  // its channels intact. A painted pixel is stored premultiplied, so reading
  // one back at 6% alpha moves #1e3a8a to #223388: the serialised form is used
  // whenever there is one.
  const SERIALISED_RGBA = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/
  const serialisedRgba = (style) => {
    if (/^#[\da-f]{6}$/.test(style))
      return [1, 3, 5].map((i) => parseInt(style.slice(i, i + 2), 16)).concat(1)
    const match = SERIALISED_RGBA.exec(style)
    return match ? match.slice(1).map(Number) : null
  }

  const paintPixel = (style) => {
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = style
    context.fillRect(0, 0, 1, 1)
    return context.getImageData(0, 0, 1, 1).data
  }

  // Any CSS colour, oklch and color-mix included, resolved to sRGB bytes by
  // painting one pixel: computed styles may keep the authored colour space.
  const toRgba = (value) => {
    if (!value || !CSS.supports('color', value)) return null
    if (colorCache.has(value)) return colorCache.get(value)
    context.fillStyle = value
    const serialised = serialisedRgba(context.fillStyle)
    if (serialised) {
      serialised[3] = Math.round(serialised[3] * 100) / 100
      colorCache.set(value, serialised)
      return serialised
    }
    // Outside sRGB (Tailwind's color-mix lands in oklab) the pixel is the
    // only reader, so the channels are painted opaque and the alpha apart.
    const opaque = `rgb(from ${value} r g b / 1)`
    const relative = CSS.supports('color', opaque)
    const [r, g, b, a] = paintPixel(relative ? opaque : value)
    const alpha = relative
      ? paintPixel(`rgb(from ${value} calc(alpha * 255) 0 0 / 1)`)[0]
      : a
    const rgba = [r, g, b, Math.round((alpha / 255) * 100) / 100]
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
  // An open dialog or drawer, native or by its ARIA role.
  const DIALOG =
    'dialog[open], [role="dialog"], [role="alertdialog"], [aria-modal="true"]'
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
  // The height of one line of a select's font: Chromium clips the chosen
  // option's text to the content box, so a box shorter than this cuts it.
  // Zero for everything else, whose text wraps or overflows visibly.
  const measure = document.createElement('canvas').getContext('2d')
  const lineBoxOf = (element, style) => {
    if (element.tagName !== 'SELECT' || !measure) return 0
    measure.font = style.font
    const metrics = measure.measureText('Mg')
    return metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
  }

  // The width of the placeholder an empty field shows; 0 when it shows none.
  const placeholderWidthOf = (element, style) => {
    const placeholder = element.getAttribute('placeholder')
    if (!placeholder || element.value || !measure) return 0
    measure.font = style.font
    return measure.measureText(placeholder).width
  }

  // Which icon an svg draws, whatever its size or classes: its markup with
  // the presentational attributes removed, hashed (djb2).
  const NOISE = [
    'class',
    'style',
    'width',
    'height',
    'id',
    'aria-hidden',
    'focusable',
    'role',
  ]
  const svgDigestOf = (element) => {
    if (element.tagName.toLowerCase() !== 'svg') return ''
    const copy = element.cloneNode(true)
    for (const node of [copy, ...copy.querySelectorAll('*')])
      for (const name of NOISE) node.removeAttribute(name)
    let hash = 5381
    for (const char of copy.outerHTML.replace(/\s+/g, ' '))
      hash = ((hash * 33) ^ char.charCodeAt(0)) >>> 0
    return hash.toString(16)
  }
  // Whether an svg's first shape is filled or only stroked: a solid glyph or
  // an outline one.
  const SHAPES = 'path, circle, rect, ellipse, line, polyline, polygon'
  const svgPaintOf = (element) => {
    if (element.tagName.toLowerCase() !== 'svg') return ''
    const shape = element.querySelector(SHAPES)
    if (!shape) return ''
    const painted = getComputedStyle(shape)
    if (painted.fill !== 'none') return 'fill'
    return painted.stroke !== 'none' ? 'stroke' : ''
  }

  // The widest blur of the visible outer shadows: 3px for Tailwind's
  // shadow-sm, 6px and up from shadow-md. Inset and transparent layers paint
  // no elevation.
  const SHADOW_LAYERS = /,(?![^(]*\))/
  const SHADOW_COLOR =
    /(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^)]*\)|#[\da-f]+/i
  const shadowBlurOf = (style) => {
    if (style.boxShadow === 'none') return 0
    let widest = 0
    for (const layer of style.boxShadow.split(SHADOW_LAYERS)) {
      if (layer.includes('inset')) continue
      const color = layer.match(SHADOW_COLOR)
      const rgba = color ? toRgba(color[0]) : null
      if (!rgba || rgba[3] === 0) continue
      const lengths = layer.replace(SHADOW_COLOR, '').match(/-?[\d.]+px/g) ?? []
      widest = Math.max(widest, parseFloat(lengths[2] ?? '0'))
    }
    return widest
  }

  // The line height in px; `normal` is the font's own ascent plus descent,
  // which is what the browser lays a line out with.
  const lineHeightOf = (style) => {
    if (style.lineHeight !== 'normal') return parseFloat(style.lineHeight)
    if (!measure) return 0
    measure.font = style.font
    const metrics = measure.measureText('Mg')
    return (
      Math.round(
        (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent) * 10,
      ) / 10
    )
  }

  // Whether every digit of the element's font takes one width, so a column
  // of numbers lines up: `tabular-nums`, or a font whose figures are tabular
  // unless told otherwise. The canvas ignores font-variant-numeric, so an
  // explicit `proportional-nums` is read from the style.
  const tabularCache = new Map()
  const tabularDigitsOf = (style) => {
    const variant = style.fontVariantNumeric
    if (variant.includes('tabular-nums')) return true
    if (variant.includes('proportional-nums') || !measure) return false
    if (tabularCache.has(style.font)) return tabularCache.get(style.font)
    measure.font = style.font
    const narrow = measure.measureText('1111111111').width
    const wide = measure.measureText('0000000000').width
    const tabular = Math.abs(narrow - wide) < 0.5
    tabularCache.set(style.font, tabular)
    return tabular
  }

  // How many lines the element's own text is laid out on: the distinct tops
  // of its text fragments. Zero when it has no text of its own.
  const range = document.createRange()
  const linesOf = (element) => {
    const tops = []
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      for (const rect of range.getClientRects()) {
        if (rect.width === 0) continue
        if (!tops.some((top) => Math.abs(top - rect.top) < rect.height / 2))
          tops.push(rect.top)
      }
    }
    return tops.length
  }

  const signatureOf = (element) =>
    [element.tagName.toLowerCase(), ...[...element.classList].sort()].join('.')

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

  // Every CSS background image a visible element asks for, as the absolute
  // address the computed style resolves it to; data: URLs never fail.
  const BACKGROUND_URL = /url\("([^"]+)"\)/g
  const MAX_BACKGROUNDS = 200
  const backgroundImages = []
  const recordBackgrounds = (element, style) => {
    if (backgroundImages.length >= MAX_BACKGROUNDS) return
    for (const [, url] of style.backgroundImage.matchAll(BACKGROUND_URL)) {
      if (url.startsWith('data:')) continue
      backgroundImages.push({
        url,
        signature: signatureOf(element),
        selector: selectorOf(element),
      })
    }
  }

  // What a thumb hits: links, buttons, ARIA widgets and the non-typing inputs.
  // Text fields have their own rules, and a disabled control is not hit.
  const TAPPABLE =
    'a[href], button, summary, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"], input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], input[type="reset"], input[type="image"]'
  // The box a tap lands in: the element's own, its labels' (a checkbox is
  // hit through its label), and the absolutely positioned ::before and
  // ::after that extend a small control's hit area.
  const tapAreaOf = (element, style, rect) => {
    const box = {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
    }
    const grow = (left, top, width, height) => {
      box.left = Math.min(box.left, left)
      box.top = Math.min(box.top, top)
      box.right = Math.max(box.right, left + width)
      box.bottom = Math.max(box.bottom, top + height)
    }
    for (const label of element.labels ?? []) {
      const own = label.getBoundingClientRect()
      grow(own.left, own.top, own.width, own.height)
    }
    if (style.position !== 'static') {
      for (const pseudo of ['::before', '::after']) {
        const extra = getComputedStyle(element, pseudo)
        if (extra.position !== 'absolute' || extra.content === 'none') continue
        const left =
          rect.left + parseFloat(style.borderLeftWidth) + parseFloat(extra.left)
        const top =
          rect.top + parseFloat(style.borderTopWidth) + parseFloat(extra.top)
        const width = parseFloat(extra.width)
        const height = parseFloat(extra.height)
        if ([left, top, width, height].every(Number.isFinite))
          grow(left, top, width, height)
      }
    }
    return [box.right - box.left, box.bottom - box.top]
  }

  // The top-left corner radius in px; a percentage is of the box's width.
  const radiusOf = (style, rect) => {
    const value = style.borderTopLeftRadius
    const length = parseFloat(value) || 0
    return value.endsWith('%')
      ? Math.round((length * rect.width) / 100)
      : length
  }

  const ids = new Map()
  const elements = []
  // Elements with text of their own, for the occlusion pass once every
  // element has an id.
  const texted = []
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
    if (text) texted.push(element)
    const tappable = element.matches(TAPPABLE)
    const [tapWidth, tapHeight] = tappable
      ? tapAreaOf(element, style, rect)
      : [0, 0]
    if (style.backgroundImage.includes('url('))
      recordBackgrounds(element, style)
    elements.push({
      id,
      parent: parent ? ids.get(parent) : null,
      tag: element.tagName.toLowerCase(),
      signature: signatureOf(element),
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
      disabled:
        element.matches(':disabled') ||
        element.getAttribute('aria-disabled') === 'true',
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
      flexWrap: style.flexWrap,
      textOverflow: style.textOverflow,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      contentHeight:
        element.clientHeight -
        parseFloat(style.paddingTop) -
        parseFloat(style.paddingBottom),
      lineBoxHeight: lineBoxOf(element, style),
      contentWidth:
        element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight),
      placeholderWidth: placeholderWidthOf(element, style),
      transitionAll:
        style.transitionProperty.split(',').some((p) => p.trim() === 'all') &&
        style.transitionDuration.split(',').some((d) => parseFloat(d) > 0),
      svgDigest: svgDigestOf(element),
      svgPaint: svgPaintOf(element),
      shadowBlur: shadowBlurOf(style),
      isControl: isControl(element),
      fontSize: parseFloat(style.fontSize),
      lineHeight: lineHeightOf(style),
      letterSpacing:
        style.letterSpacing === 'normal' ? 0 : parseFloat(style.letterSpacing),
      fontWeight: Number(style.fontWeight),
      fontFamily: style.fontFamily
        .split(',')[0]
        .replace(/["']/g, '')
        .trim()
        .toLowerCase()
        .slice(0, 40),
      fontVariantNumeric: style.fontVariantNumeric,
      tabularDigits: text ? tabularDigitsOf(style) : false,
      textAlign: style.textAlign,
      textTransform: style.textTransform,
      lines: text ? linesOf(element) : 0,
      display: style.display,
      tappable,
      tapWidth: Math.round(tapWidth),
      tapHeight: Math.round(tapHeight),
      borderRadius: radiusOf(style, rect),
      padding: [
        parseFloat(style.paddingTop),
        parseFloat(style.paddingRight),
        parseFloat(style.paddingBottom),
        parseFloat(style.paddingLeft),
      ],
      isTextEntry: isTextEntry(element),
      isDialog: element.matches(DIALOG),
      label: (element.getAttribute('aria-label') ?? '').trim().slice(0, 80),
      isMain: element === main,
      isBanner: element === banner,
      occluder: null,
    })
  }

  // What paints on top of each text: the element hit at the centre of its
  // first line. Only texts on screen, hit-testable and not scrolled out of a
  // clipping ancestor are sampled, at most MAX_OCCLUSION_SAMPLES of them.
  const MAX_OCCLUSION_SAMPLES = 400
  const insideClips = (element, x, y) => {
    for (let box = element.parentElement; box; box = box.parentElement) {
      const style = getComputedStyle(box)
      if (style.overflowX === 'visible' && style.overflowY === 'visible')
        continue
      const rect = box.getBoundingClientRect()
      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
        return false
    }
    return true
  }
  const textCentreOf = (element) => {
    for (const node of element.childNodes) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      range.selectNodeContents(node)
      const rect = range.getClientRects()[0]
      if (rect) return [rect.left + rect.width / 2, rect.top + rect.height / 2]
    }
    return null
  }
  // The centre of an element's first line when it can be hit-tested there:
  // on screen, not `pointer-events: none`, not scrolled out of a clip.
  const samplePointOf = (element) => {
    if (getComputedStyle(element).pointerEvents === 'none') return null
    const centre = textCentreOf(element)
    if (!centre) return null
    const [x, y] = centre
    if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight)
      return null
    return insideClips(element, x, y) ? centre : null
  }
  const occluderOf = (element, [x, y]) => {
    const hit = document.elementFromPoint(x, y)
    if (!hit || hit.contains(element) || element.contains(hit)) return null
    // An svg's shapes are not walked; an invisible overlay paints nothing.
    return ids.get(hit.closest('svg') ?? hit) ?? null
  }
  let samples = 0
  for (const element of texted) {
    if (samples >= MAX_OCCLUSION_SAMPLES) break
    const point = samplePointOf(element)
    if (!point) continue
    samples += 1
    elements[ids.get(element)].occluder = occluderOf(element, point)
  }

  // Text in the main region that is laid out but painted invisible: opacity
  // 0 or visibility hidden, the mark of a reveal animation that never ran.
  // What is closed on purpose (a collapsed <details>, `hidden`, `inert`,
  // `aria-hidden`) is left out of both counts, and so is `display: none`.
  const AT_REST_EXEMPT =
    'details:not([open]) > :not(summary), [hidden], [inert], [aria-hidden="true"]'
  const hiddenTextOf = (root) => {
    const counts = { total: 0, hidden: 0, selector: '' }
    if (!root) return counts
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const length = node.textContent.replace(/\s+/g, '').length
      const parent = node.parentElement
      if (length === 0 || !parent || SKIP.has(parent.tagName)) continue
      if (parent.closest(AT_REST_EXEMPT) || !parent.checkVisibility()) continue
      counts.total += length
      if (
        parent.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
      )
        continue
      counts.hidden += length
      if (!counts.selector) counts.selector = selectorOf(parent)
    }
    return counts
  }

  // Whether an image or video failed: an image that finished loading with no
  // pixels, one with no source at all (a lazy loader's `data-src` aside), or
  // a video the browser could not play.
  const isBroken = (media) => {
    if (media.tagName === 'VIDEO')
      return media.error !== null || media.networkState === 3
    if (media.complete && media.currentSrc && media.naturalWidth === 0)
      return true
    return (
      !media.currentSrc &&
      !(media.getAttribute('src') ?? '').trim() &&
      !media.hasAttribute('srcset') &&
      !media.hasAttribute('data-src') &&
      !media.hasAttribute('data-srcset')
    )
  }

  // Whether the box an image or video takes is known before its file loads.
  // Width and height attributes or an aspect-ratio give it; so do CSS sizes,
  // which a copy without a source shows: it keeps a height only when the
  // stylesheet sets one (a video's default is 300x150 whatever it plays).
  const isSized = (media, style) => {
    if (media.hasAttribute('width') && media.hasAttribute('height')) return true
    if (style.aspectRatio !== 'auto' || style.objectFit !== 'fill') return true
    if (style.position === 'absolute' || style.position === 'fixed') return true
    const copy = media.cloneNode(false)
    for (const name of ['id', 'src', 'srcset', 'poster'])
      copy.removeAttribute(name)
    copy.setAttribute('alt', '')
    // Beside a <picture>, not in it: inside, its sources would load again.
    const anchor =
      media.parentElement?.tagName === 'PICTURE' ? media.parentElement : media
    anchor.after(copy)
    const box = copy.getBoundingClientRect()
    copy.remove()
    if (media.tagName === 'VIDEO')
      return box.width !== 300 || box.height !== 150
    // The height is what moves the content below when the file arrives.
    return box.height > 0
  }

  const MAX_MEDIA = 200
  const media = [...document.body.querySelectorAll('img, video')]
    .filter((element) => element.checkVisibility())
    .slice(0, MAX_MEDIA)
    .map((element) => {
      const broken = isBroken(element)
      return {
        tag: element.tagName.toLowerCase(),
        signature: signatureOf(element),
        selector: selectorOf(element),
        broken,
        sized: broken || isSized(element, getComputedStyle(element)),
      }
    })

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

  // The walk above starts inside body, so the canvas every fill sits on is
  // read here: html then body, outermost first.
  const rootBackgrounds = [document.documentElement, document.body].map(
    (root) => {
      const computed = getComputedStyle(root)
      return {
        color: toRgba(computed.backgroundColor),
        hasImage: computed.backgroundImage !== 'none',
      }
    },
  )

  // The focus pass reads which element is which from the page.
  window.__uiqIds = ids

  return {
    elements,
    variables,
    rootBackgrounds,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    documentWidth: document.documentElement.scrollWidth,
    media,
    hiddenText: hiddenTextOf(main),
    backgroundImages,
  }
}
