import type { Measurement } from '@/model/Measurement.js'

/** A measurement and the screen (viewport and scheme) it was taken at. */
export type ScreenMeasurement = Measurement & { screen: string }
