export const srgbToLinear = (channel: number): number => {
  const value = channel / 255
  return value <= 0.040_45 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}
