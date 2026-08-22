// Global reference to prevent garbage collection of the active utterance in mobile browsers
let activeUtterance: SpeechSynthesisUtterance | null = null;

const CHINESE_FEMALE_KEYWORDS = [
  'female', 'tingting', 'ting-ting', 'xiaoxiao', 'huihui', 'yaoyao', 'nữ', 'girl', 'woman',
  'sfg', 'sinji', 'mei-jia', 'meijia', 'mandarin', 'putonghua', 'chinese'
];

const CHINESE_MALE_KEYWORDS = [
  'male', 'kangkang', 'nam', 'boy', 'man', 'iom', 'yunxi', 'yunjian', 'luan'
];

const ENGLISH_FEMALE_KEYWORDS = [
  'female', 'samantha', 'zira', 'hazel', 'karen', 'susan', 'nữ', 'girl', 'woman',
  'sfg', 'lisa', 'zoe', 'moira', 'tessa', 'veena', 'fiona'
];

const ENGLISH_MALE_KEYWORDS = [
  'male', 'david', 'daniel', 'george', 'ravi', 'nam', 'boy', 'man', 'iom', 'fred'
];

function selectVoice(
  voices: SpeechSynthesisVoice[],
  targetLang: string,
  preferredKeywords: string[],
  avoidedKeywords: string[]
): SpeechSynthesisVoice | null {
  const targetLangLower = targetLang.toLowerCase().replace('_', '-');
  const targetPrefix = targetLangLower.split('-')[0];

  // Filter voices that match target language prefix (e.g., 'zh' or 'en')
  const candidateVoices = voices.filter(v => {
    const voiceLangLower = v.lang.toLowerCase().replace('_', '-');
    return voiceLangLower === targetLangLower || voiceLangLower.startsWith(targetPrefix);
  });

  if (candidateVoices.length === 0) {
    return null;
  }

  let bestVoice = candidateVoices[0];
  let bestScore = -1000;

  for (const voice of candidateVoices) {
    let score = 0;
    const nameLower = voice.name.toLowerCase();
    const langLower = voice.lang.toLowerCase().replace('_', '-');

    // Prefer exact language match (e.g. zh-CN over zh-TW)
    if (langLower === targetLangLower) {
      score += 100;
    }

    // Score based on female preference keywords
    for (const kw of preferredKeywords) {
      if (nameLower.includes(kw)) {
        score += 50;
      }
    }

    // Deduct points for male voices
    for (const kw of avoidedKeywords) {
      if (nameLower.includes(kw)) {
        score -= 100;
      }
    }

    // Slight preference for default system voice if it's otherwise matching
    if (voice.default) {
      score += 5;
    }

    // Prefer premium/enhanced quality voices on iOS/macOS
    if (nameLower.includes('enhanced') || nameLower.includes('premium')) {
      score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestVoice = voice;
    }
  }

  return bestVoice;
}

export function speakChinese(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Prepare utterance
    const cleanText = text.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s]/g, ''); // Speak only characters/pinyin
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';
    
    // Helper to find, configure and set voice
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const chineseVoice = selectVoice(voices, 'zh-CN', CHINESE_FEMALE_KEYWORDS, CHINESE_MALE_KEYWORDS);
      
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }
      
      // Crucial: Set rate and pitch after setting the voice to prevent browser overrides/resets
      utterance.rate = 0.8; // Slightly slower pace, perfect for learning Chinese
      utterance.pitch = 1.0;
      
      // Prevent GC of utterance on iOS and other mobile browsers
      activeUtterance = utterance;
      
      utterance.onend = () => {
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    };

    // Chrome and mobile browsers load voices asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
      const voicesChanged = () => {
        setVoiceAndSpeak();
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChanged);
      };
      window.speechSynthesis.addEventListener('voiceschanged', voicesChanged);
    } else {
      setVoiceAndSpeak();
    }
  });
}

export function speakEnglish(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Prepare utterance
    const cleanText = text.replace(/[^a-zA-Z0-9\s]/g, ''); // Speak only alphanumeric characters
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';

    // Helper to find, configure and set voice
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = selectVoice(voices, 'en-US', ENGLISH_FEMALE_KEYWORDS, ENGLISH_MALE_KEYWORDS);
      
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      // Crucial: Set rate and pitch after setting the voice to prevent browser overrides/resets
      utterance.rate = 0.85; // Slightly slower pace for learning English
      utterance.pitch = 1.0;
      
      // Prevent GC of utterance on iOS and other mobile browsers
      activeUtterance = utterance;
      
      utterance.onend = () => {
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        if (activeUtterance === utterance) {
          activeUtterance = null;
        }
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    };

    // Chrome and mobile browsers load voices asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
      const voicesChanged = () => {
        setVoiceAndSpeak();
        window.speechSynthesis.removeEventListener('voiceschanged', voicesChanged);
      };
      window.speechSynthesis.addEventListener('voiceschanged', voicesChanged);
    } else {
      setVoiceAndSpeak();
    }
  });
}
