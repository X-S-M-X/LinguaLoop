import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSpeechRecognitionConstructor,
  isSpeechRecognitionSupported,
} from '../lib/speechHelpers.js';

const RECOGNITION_ERRORS = {
  'audio-capture': 'No microphone was found. Check your device microphone and try again.',
  'network': 'Speech recognition could not reach the browser service. Try again when online.',
  'no-speech': 'No speech was detected. Try speaking a little closer to your microphone.',
  'not-allowed': 'Microphone access was blocked. Allow microphone access in your browser settings.',
  'service-not-allowed': 'Speech recognition is blocked by this browser or device.',
};

export function useSpeechRecognition() {
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const supported = isSpeechRecognitionSupported();

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Some browser implementations throw when recognition already ended.
    }
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const clearResult = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const startListening = useCallback((locale, onTranscript) => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setError('Speech recognition is not available in this browser.');
      return false;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      // Some browser implementations throw when recognition already ended.
    }
    setTranscript('');
    setError(null);

    const recognition = new Recognition();
    recognition.lang = locale || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const nextTranscript = event.results?.[0]?.[0]?.transcript?.trim() || '';
      setTranscript(nextTranscript);
      onTranscript?.(nextTranscript);
    };
    recognition.onerror = (event) => {
      setError(RECOGNITION_ERRORS[event.error] || 'Speech recognition failed. Please try again.');
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      recognitionRef.current = null;
      setListening(false);
      setError('The microphone could not start. Wait a moment and try again.');
      return false;
    }
  }, []);

  useEffect(() => () => {
    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore cleanup errors after the browser has already stopped listening.
    }
  }, []);

  return {
    supported,
    listening,
    transcript,
    error,
    startListening,
    stopListening,
    clearResult,
  };
}
