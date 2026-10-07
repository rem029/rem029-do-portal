// Subjects are headers: drop line breaks and keep them short. Apply to user-entered values
// interpolated into a subject (subjects are plain text, so never HTML-escape them).
export function toSubjectText(value: string): string {
  return value
    .replace(/[\r\n]+/g, ' ')
    .trim()
    .slice(0, 120)
}
