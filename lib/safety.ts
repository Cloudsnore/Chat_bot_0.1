/**
 * Detects the special crisis trigger token injected by the AI model
 * when it recognizes a severe distress situation.
 */
export function detectCrisis(text: string): boolean {
  return text.includes("[CRISIS_TRIGGER]");
}

/**
 * Strips the crisis trigger token from the text so it's not
 * displayed in the UI (the modal handles the UX instead).
 */
export function stripCrisisTrigger(text: string): string {
  return text.replace(/\[CRISIS_TRIGGER\]/g, "").trim();
}
