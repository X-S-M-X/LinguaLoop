export const SPEECH_RATE_OPTIONS = [0.75, 1, 1.25];

export function normalizeSpeechText(value, locale = 'en') {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase(locale)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function getTextSimilarity(expected, actual, locale = 'en') {
  const left = normalizeSpeechText(expected, locale);
  const right = normalizeSpeechText(actual, locale);

  if (!left || !right) return 0;
  if (left === right) return 1;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        previous[rightIndex] + 1,
        current[rightIndex - 1] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return Math.max(0, 1 - previous[right.length] / Math.max(left.length, right.length));
}

export function getSpeechMatch(expected, actual, locale = 'en') {
  const similarity = getTextSimilarity(expected, actual, locale);
  const score = Math.round(similarity * 100);

  if (similarity >= 0.82) return { status: 'matched', score };
  if (similarity >= 0.58) return { status: 'almost', score };
  return { status: 'try-again', score };
}

export function isSpeechSynthesisSupported(browserWindow = globalThis.window) {
  return Boolean(browserWindow?.speechSynthesis && browserWindow?.SpeechSynthesisUtterance);
}

export function getSpeechRecognitionConstructor(browserWindow = globalThis.window) {
  return browserWindow?.SpeechRecognition ?? browserWindow?.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(browserWindow = globalThis.window) {
  return Boolean(getSpeechRecognitionConstructor(browserWindow));
}
