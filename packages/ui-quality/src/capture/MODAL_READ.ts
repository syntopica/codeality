/**
 * Reads the first open dialog: its subject, and the middle of the widest band
 * of backdrop around its panel when that band is at least 24px and a click
 * there lands on an overlay covering the window (or a native modal's
 * ::backdrop) rather than on the page. A dialog that fills the window is
 * measured by its first painted descendant smaller than it. Null with no
 * dialog, or with an alert dialog open. A function source, called with the
 * dialog selector, because this package compiles without the DOM library.
 */
export const MODAL_READ = `(selector) => {
  if ([...document.querySelectorAll('[role="alertdialog"]')].some((e) => e.checkVisibility())) return null
  const dialog = [...document.querySelectorAll(selector)].find((e) =>
    e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))
  if (!dialog) return null
  const tag = dialog.tagName.toLowerCase()
  const subject = dialog.id ? tag + '#' + dialog.id : [tag, ...[...dialog.classList].slice(0, 2)].join('.')
  const width = innerWidth
  const height = innerHeight
  const covers = (rect) => rect.width * rect.height >= width * height * 0.9
  const painted = (element) => {
    const fill = getComputedStyle(element).backgroundColor
    return fill !== 'transparent' && !/,\\s*0\\)$/.test(fill)
  }
  const panel = covers(dialog.getBoundingClientRect())
    ? [...dialog.querySelectorAll('*')].find((element) => {
        const rect = element.getBoundingClientRect()
        return !covers(rect) && rect.width * rect.height >= width * height * 0.05 && painted(element)
      })
    : dialog
  if (!panel) return { subject, point: null }
  const rect = panel.getBoundingClientRect()
  const band = [
    [rect.left, [rect.left / 2, height / 2]],
    [width - rect.right, [(rect.right + width) / 2, height / 2]],
    [rect.top, [width / 2, rect.top / 2]],
    [height - rect.bottom, [width / 2, (rect.bottom + height) / 2]],
  ].filter(([size]) => size >= 24).sort((a, b) => b[0] - a[0])[0]
  if (!band) return { subject, point: null }
  const point = band[1]
  const hit = document.elementFromPoint(point[0], point[1])
  if (!hit || panel.contains(hit)) return { subject, point: null }
  let overlay = dialog.matches(':modal') && hit === dialog
  for (let element = hit; element && !overlay; element = element.parentElement) {
    const position = getComputedStyle(element).position
    overlay = (position === 'fixed' || position === 'absolute') && covers(element.getBoundingClientRect())
  }
  return { subject, point: overlay ? point : null }
}`
