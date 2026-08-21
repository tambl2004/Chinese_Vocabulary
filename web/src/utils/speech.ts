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
    utterance.rate = 0.85; // Slightly slower for language learners

    // Helper to find and set voice
    const setVoiceAndSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a Simplified Chinese voice, fallback to other Chinese accents
      const chineseVoice = voices.find(v => v.lang === 'zh-CN') || 
                           voices.find(v => v.lang.startsWith('zh-')) ||
                           voices.find(v => v.name.includes('Chinese') || v.name.includes('Google 普通话'));
      
      if (chineseVoice) {
        utterance.voice = chineseVoice;
      }
      
      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    };

    // Chrome loads voices asynchronously
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
