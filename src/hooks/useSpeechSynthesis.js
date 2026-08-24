import { useCallback, useEffect, useState } from 'react';
import { isSpeechSynthesisSupported } from '../lib/speechHelpers.js';

export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  const supported = isSpeechSynthesisSupported();

  const stop = useCallback(() => {
    if (!isSpeechSynthesisSupported()) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text, { locale, rate = 1 } = {}) => {
    if (!text || !isSpeechSynthesisSupported()) return false;

    window.speechSynthesis.cancel();

    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.lang = locale || 'en-US';
    utterance.rate = Number(rate) || 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
    return true;
  }, []);

  useEffect(() => stop, [stop]);

  return { supported, speaking, speak, stop };
}
