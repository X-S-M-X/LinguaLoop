import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getSpeechMatch,
  getSpeechRecognitionConstructor,
  getTextSimilarity,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  normalizeSpeechText,
} from './speechHelpers.js';

test('normalizeSpeechText ignores punctuation, spacing and accents', () => {
  assert.equal(normalizeSpeechText('  ¿Cómo   estás? ', 'es'), 'como estas');
  assert.equal(normalizeSpeechText('Perdón', 'es'), 'perdon');
});

test('getTextSimilarity treats a normalised phrase as an exact match', () => {
  assert.equal(getTextSimilarity('Me llamo...', 'me llamo', 'es'), 1);
});

test('getSpeechMatch separates matched, almost and retry results', () => {
  assert.equal(getSpeechMatch('Hasta luego', 'hasta luego', 'es').status, 'matched');
  assert.equal(getSpeechMatch('Mucho gusto', 'mucho buenos', 'es').status, 'almost');
  assert.equal(getSpeechMatch('Buenos días', 'adiós', 'es').status, 'try-again');
});

test('speech support helpers detect standard and prefixed browser APIs', () => {
  function Recognition() {}
  const standardWindow = {
    speechSynthesis: {},
    SpeechSynthesisUtterance: function Utterance() {},
    SpeechRecognition: Recognition,
  };
  const prefixedWindow = { webkitSpeechRecognition: Recognition };

  assert.equal(isSpeechSynthesisSupported(standardWindow), true);
  assert.equal(isSpeechRecognitionSupported(standardWindow), true);
  assert.equal(getSpeechRecognitionConstructor(prefixedWindow), Recognition);
  assert.equal(isSpeechRecognitionSupported({}), false);
});
