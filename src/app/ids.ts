/** A unique id for a planned meal. randomUUID needs a secure context, which https and localhost both are. */
export function makeMealId(): string {
  return `meal-${crypto.randomUUID()}`
}
