export const ordinaryPaint = (element) => {
  const style = getComputedStyle(element)
  for (const property of [
    'mask-border-source',
    '-webkit-mask-box-image-source',
  ]) {
    const source = style.getPropertyValue(property).trim()
    if (source !== '' && source !== 'none') return false
  }
  for (const pseudo of ['::before', '::after']) {
    if (!['none', 'normal'].includes(getComputedStyle(element, pseudo).content))
      return false
  }
  return (
    !element.matches(':fullscreen, :popover-open, :modal') &&
    element.getAnimations().length === 0 &&
    (element === document.documentElement ||
      !style.viewTransitionName ||
      style.viewTransitionName === 'none') &&
    style.offsetPath === 'none' &&
    style.transformStyle === 'flat' &&
    !element.shadowRoot &&
    !element.tagName.includes('-') &&
    Number(style.opacity) === 1 &&
    style.transform === 'none' &&
    style.translate === 'none' &&
    style.rotate === 'none' &&
    style.scale === 'none' &&
    style.filter === 'none' &&
    style.backdropFilter === 'none' &&
    style.perspective === 'none' &&
    style.mixBlendMode === 'normal' &&
    style.isolation === 'auto' &&
    style.contain === 'none' &&
    style.containerType === 'normal' &&
    style.willChange === 'auto' &&
    style.clipPath === 'none' &&
    style.maskImage === 'none' &&
    style.clip === 'auto' &&
    style.contentVisibility === 'visible' &&
    (style.zoom === '1' || style.zoom === 'normal')
  )
}
