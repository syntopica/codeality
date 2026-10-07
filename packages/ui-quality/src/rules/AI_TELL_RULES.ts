import { eyebrowLabel } from '@/rules/eyebrowLabel.js'
import { glowShadow } from '@/rules/glowShadow.js'
import { gradientText } from '@/rules/gradientText.js'
import { pulsingDecoration } from '@/rules/pulsingDecoration.js'
import { purpleGradient } from '@/rules/purpleGradient.js'
import type { Rule } from '@/rules/Rule.js'
import { sideStripeAccent } from '@/rules/sideStripeAccent.js'

/** The advisory rules for what makes a screen look machine-made: gradients, glows, stripes, eyebrows and pulses. */
export const AI_TELL_RULES: Rule[] = [
  eyebrowLabel,
  glowShadow,
  gradientText,
  pulsingDecoration,
  purpleGradient,
  sideStripeAccent,
]
