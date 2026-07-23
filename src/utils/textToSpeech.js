let currentUtterance = null;
let currentState = "idle";

function getSpeechSynthesis() {
  if (
    typeof window === "undefined" ||
    !("speechSynthesis" in window)
  ) {
    return null;
  }

  return window.speechSynthesis;
}

function normalizeSpeechText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function getLanguageCode(language) {
  const languageCodes = {
    it: "it-IT",
    bn: "bn-BD",
    en: "en-US"
  };

  return (
    languageCodes[language] ||
    languageCodes.it
  );
}

function findBestVoice(languageCode) {
  const speechSynthesis =
    getSpeechSynthesis();

  if (!speechSynthesis) {
    return null;
  }

  const voices =
    speechSynthesis.getVoices();

  if (!voices.length) {
    return null;
  }

  const exactVoice =
    voices.find(
      (voice) =>
        voice.lang
          .toLowerCase() ===
        languageCode.toLowerCase()
    );

  if (exactVoice) {
    return exactVoice;
  }

  const baseLanguage =
    languageCode
      .split("-")[0]
      .toLowerCase();

  return (
    voices.find(
      (voice) =>
        voice.lang
          .toLowerCase()
          .startsWith(baseLanguage)
    ) ||
    null
  );
}

export function isTextToSpeechSupported() {
  return Boolean(
    getSpeechSynthesis()
  );
}

export function speakText(
  text,
  {
    language = "it",
    rate = 0.9,
    pitch = 1,
    volume = 1,
    onStart,
    onEnd,
    onError
  } = {}
) {
  const speechSynthesis =
    getSpeechSynthesis();

  const normalizedText =
    normalizeSpeechText(text);

  if (!speechSynthesis) {
    onError?.(
      new Error(
        "La lettura audio non è supportata da questo browser."
      )
    );

    return false;
  }

  if (!normalizedText) {
    onError?.(
      new Error(
        "Non c'è testo da leggere."
      )
    );

    return false;
  }

  speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(
      normalizedText
    );

  const languageCode =
    getLanguageCode(language);

  utterance.lang =
    languageCode;

  utterance.rate =
    Number(rate) || 0.9;

  utterance.pitch =
    Number(pitch) || 1;

  utterance.volume =
    Number(volume) || 1;

  const matchingVoice =
    findBestVoice(languageCode);

  if (matchingVoice) {
    utterance.voice =
      matchingVoice;
  }

  utterance.onstart = () => {
    currentState = "playing";
    onStart?.();
  };

  utterance.onend = () => {
    currentUtterance = null;
    currentState = "idle";
    onEnd?.();
  };

  utterance.onerror = (event) => {
    currentUtterance = null;
    currentState = "idle";

    if (
      event.error === "canceled" ||
      event.error === "interrupted"
    ) {
      return;
    }

    onError?.(
      new Error(
        "Non è stato possibile riprodurre l'audio."
      )
    );
  };

  currentUtterance =
    utterance;

  speechSynthesis.speak(
    utterance
  );

  return true;
}

export function pauseSpeech() {
  const speechSynthesis =
    getSpeechSynthesis();

  if (
    !speechSynthesis ||
    !speechSynthesis.speaking ||
    speechSynthesis.paused
  ) {
    return false;
  }

  speechSynthesis.pause();
  currentState = "paused";

  return true;
}

export function resumeSpeech() {
  const speechSynthesis =
    getSpeechSynthesis();

  if (
    !speechSynthesis ||
    !speechSynthesis.paused
  ) {
    return false;
  }

  speechSynthesis.resume();
  currentState = "playing";

  return true;
}

export function stopSpeech() {
  const speechSynthesis =
    getSpeechSynthesis();

  if (!speechSynthesis) {
    return false;
  }

  speechSynthesis.cancel();

  currentUtterance = null;
  currentState = "idle";

  return true;
}

export function getSpeechState() {
  return currentState;
}