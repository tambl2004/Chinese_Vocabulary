const toneMap: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü']
};

export function convertPinyinNumberToAccent(pinyinWord: string): string {
  const clean = pinyinWord.trim().toLowerCase();
  
  // Match letters and potential trailing number
  const match = clean.match(/^([a-züv]+)([1-5])?$/);
  if (!match) return clean;
  
  const syllable = match[1];
  const tone = match[2] ? parseInt(match[2]) : 5;
  
  if (tone === 5) return syllable.replace('v', 'ü');
  
  let targetChar = '';
  
  // Rules for Pinyin tone mark placement:
  // 1. If there's an 'a' or 'e', the mark goes on it.
  if (syllable.includes('a')) {
    targetChar = 'a';
  } else if (syllable.includes('e')) {
    targetChar = 'e';
  } 
  // 2. If there's an 'ou', the mark goes on the 'o'.
  else if (syllable.includes('ou')) {
    targetChar = 'o';
  } 
  // 3. Otherwise, the mark goes on the last vowel (usually the second vowel in 'ui' or 'iu')
  else {
    const vowels = ['a', 'o', 'e', 'i', 'u', 'v', 'ü'];
    for (let i = syllable.length - 1; i >= 0; i--) {
      if (vowels.includes(syllable[i])) {
        targetChar = syllable[i];
        break;
      }
    }
  }
  
  if (targetChar && toneMap[targetChar]) {
    const accentedChar = toneMap[targetChar][tone - 1];
    return syllable.replace(targetChar, accentedChar).replace('v', 'ü');
  }
  
  return syllable.replace('v', 'ü');
}

export function convertPinyinSentence(sentence: string): string {
  if (!sentence) return '';
  return sentence.split(/\s+/).map(convertPinyinNumberToAccent).join(' ');
}
