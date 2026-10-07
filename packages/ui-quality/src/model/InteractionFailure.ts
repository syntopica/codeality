/** A configured interaction whose selector matched nothing, so its screen was not measured. */
export type InteractionFailure = {
  action: 'click' | 'scroll' | 'hover' | 'focus'
  selector: string
}
