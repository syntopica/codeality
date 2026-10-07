import type { Oklch } from '@/color/Oklch.js'
import { srgbToLinear } from '@/color/srgbToLinear.js'
import type { Rgba } from '@/model/Rgba.js'

/** sRGB to OKLCH (Ottosson's OKLab, then polar). Alpha is ignored. */
export const rgbaToOklch = ([r, g, b]: Rgba): Oklch => {
  const [lr, lg, lb] = [r, g, b].map(srgbToLinear) as [number, number, number]
  const long = Math.cbrt(
    0.412_221_470_8 * lr + 0.536_332_536_3 * lg + 0.051_445_992_9 * lb,
  )
  const medium = Math.cbrt(
    0.211_903_498_2 * lr + 0.680_699_545_1 * lg + 0.107_396_956_6 * lb,
  )
  const short = Math.cbrt(
    0.088_302_461_9 * lr + 0.281_718_837_6 * lg + 0.629_978_700_5 * lb,
  )
  const a =
    1.977_998_495_1 * long - 2.428_592_205 * medium + 0.450_593_709_9 * short
  const bAxis =
    0.025_904_037_1 * long + 0.782_771_766_2 * medium - 0.808_675_766 * short
  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI
  return {
    l:
      0.210_454_255_3 * long + 0.793_617_785 * medium - 0.004_072_046_8 * short,
    c: Math.hypot(a, bAxis),
    h: hue < 0 ? hue + 360 : hue,
  }
}
