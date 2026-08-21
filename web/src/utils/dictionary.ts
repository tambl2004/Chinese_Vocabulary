import { convertPinyinNumberToAccent } from './pinyinUtils';
import * as OpenCC from 'opencc-js';

const s2tConverter = OpenCC.Converter({ from: 'cn', to: 'tw' });

// Types
export interface ChineseMatch {
  chinese: string;
  pinyin: string;
  han_viet: string;
  meaning: string;
  word_type?: string;
}

export interface EnglishMatch {
  word: string;
  transliteration: string;
  meaning: string;
  word_type?: string;
  suggestions?: EnglishMatch[];
}

interface DictItem {
  hanviet: string[];
  pinyin: string;
}

// Memory caches
const dictMap = new Map<string, DictItem[]>();
const englishDictMap = new Map<string, EnglishMatch>();

let isChineseDictLoading = false;
let isChineseDictLoaded = false;
let isEnglishDictLoading = false;
let isEnglishDictLoaded = false;

// CSV Parser helper
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

// Load Chinese Dictionary
async function ensureChineseDictLoaded() {
  if (isChineseDictLoaded) return;
  if (isChineseDictLoading) {
    // Wait until loaded
    while (isChineseDictLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }
  
  isChineseDictLoading = true;
  try {
    const response = await fetch('/data/hanviet.csv');
    if (!response.ok) throw new Error('Failed to load hanviet.csv');
    const content = await response.text();
    const lines = content.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 3) continue;
      
      const char = parts[0].trim();
      let hanvietStr = parts[1].trim();
      const pinyin = parts[2].trim();
      
      hanvietStr = hanvietStr.replace(/[\[\]']/g, '');
      const hanvietList = hanvietStr ? hanvietStr.split(',').map(s => s.trim()) : [];
      
      if (!dictMap.has(char)) {
        dictMap.set(char, []);
      }
      dictMap.get(char)!.push({
        hanviet: hanvietList,
        pinyin: pinyin
      });
    }
    console.log(`Loaded Chinese dictionary in browser: ${dictMap.size} characters.`);
    isChineseDictLoaded = true;
  } catch (error) {
    console.error('Error loading Chinese dictionary in client:', error);
  } finally {
    isChineseDictLoading = false;
  }
}

// Load English Dictionary
async function ensureEnglishDictLoaded() {
  if (isEnglishDictLoaded) return;
  if (isEnglishDictLoading) {
    while (isEnglishDictLoading) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return;
  }
  
  isEnglishDictLoading = true;
  try {
    const response = await fetch('/data/english.csv');
    if (!response.ok) throw new Error('Failed to load english.csv');
    const content = await response.text();
    const lines = content.split(/\r?\n/);
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = parseCSVLine(line);
      if (parts.length < 3) continue;
      
      const word = parts[0].trim().toLowerCase();
      const transliteration = parts[1].trim();
      const meaning = parts[2].trim();
      
      englishDictMap.set(word, {
        word: parts[0].trim(),
        transliteration,
        meaning
      });
    }
    console.log(`Loaded English dictionary in browser: ${englishDictMap.size} words.`);
    isEnglishDictLoaded = true;
  } catch (error) {
    console.error('Error loading English dictionary in client:', error);
  } finally {
    isEnglishDictLoading = false;
  }
}

// Client Lookup API: Chinese
export async function lookupChineseWord(word: string): Promise<ChineseMatch> {
  await ensureChineseDictLoaded();
  
  const hanvietList: string[] = [];
  const fallbackPinyinList: string[] = [];
  
  const traditionalWord = s2tConverter(word);
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const tradChar = traditionalWord[i] || char;
    const match = dictMap.get(tradChar) || dictMap.get(char);
    if (match && match.length > 0) {
      const item = match[0];
      const pinyinAccent = convertPinyinNumberToAccent(item.pinyin);
      fallbackPinyinList.push(pinyinAccent);
      
      const hv = item.hanviet.length > 0 ? item.hanviet[0] : '';
      hanvietList.push(hv);
    } else {
      fallbackPinyinList.push(char);
      hanvietList.push(char);
    }
  }
  
  const han_viet = hanvietList.join(' ');
  let pinyin = fallbackPinyinList.join(' ');
  let meaning = '';
  let word_type = 'Danh từ';

  try {
    const [viRes, enRes] = await Promise.all([
      fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&dt=rm&q=${encodeURIComponent(word)}`),
      fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=bd&q=${encodeURIComponent(word)}`)
    ]);

    if (viRes.ok) {
      const viData = await viRes.json();
      if (viData && viData[0]) {
        // Meaning is at data[0][0][0]
        if (viData[0][0] && viData[0][0][0]) {
          meaning = viData[0][0][0].trim();
        }
        // Pinyin is at data[0][1] and index 3
        if (viData[0][1] && viData[0][1][3]) {
          pinyin = viData[0][1][3].trim().toLowerCase();
        }
      }
    }

    if (enRes.ok) {
      const enData = await enRes.json();
      if (enData && enData[1] && enData[1][0] && enData[1][0][0]) {
        const enPos = enData[1][0][0].toLowerCase();
        if (enPos.includes('noun')) {
          word_type = 'Danh từ';
        } else if (enPos.includes('verb')) {
          word_type = 'Động từ';
        } else if (enPos.includes('adjective')) {
          word_type = 'Tính từ';
        } else if (enPos.includes('adverb')) {
          word_type = 'Phó từ';
        } else if (enPos.includes('pronoun')) {
          word_type = 'Đại từ';
        } else if (enPos.includes('preposition')) {
          word_type = 'Giới từ';
        } else if (enPos.includes('conjunction')) {
          word_type = 'Liên từ';
        } else if (enPos.includes('interjection')) {
          word_type = 'Thán từ';
        } else if (enPos.includes('numeral') || enPos.includes('number') || enPos.includes('cardinal')) {
          word_type = 'Lượng từ';
        } else {
          word_type = 'Khác';
        }
      }
    }
  } catch (error) {
    console.error('Error fetching online pinyin/meaning/wordtype:', error);
  }
  
  return {
    chinese: word,
    pinyin,
    han_viet,
    meaning,
    word_type
  };
}

// Client Lookup API: English
export async function lookupEnglishWord(word: string): Promise<EnglishMatch> {
  await ensureEnglishDictLoaded();
  
  const searchWord = word.trim().toLowerCase();
  let match = englishDictMap.get(searchWord);
  
  // Find suggestions from local dictionary
  const suggestions: EnglishMatch[] = [];
  if (searchWord.length > 0) {
    for (const key of englishDictMap.keys()) {
      if (key.startsWith(searchWord)) {
        suggestions.push(englishDictMap.get(key)!);
        if (suggestions.length >= 8) break;
      }
    }
  }
  
  if (match) {
    return {
      ...match,
      suggestions
    };
  }
  
  // Fallback: fetch online
  let transliteration = '';
  let meaning = '';
  let word_type = 'Danh từ';
  
  // 1. Dictionary phonetic & POS
  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchWord)}`);
    if (dictRes.ok) {
      const dictData = await dictRes.json();
      if (Array.isArray(dictData) && dictData.length > 0) {
        const entry = dictData[0];
        transliteration = entry.phonetic || '';
        if (!transliteration && entry.phonetics) {
          const foundText = entry.phonetics.find((p: any) => p.text && p.text.trim())?.text;
          if (foundText) transliteration = foundText;
        }
        if (entry.meanings && entry.meanings.length > 0) {
          const pos = entry.meanings[0].partOfSpeech?.toLowerCase() || '';
          if (pos.includes('noun')) {
            word_type = 'Danh từ';
          } else if (pos.includes('verb')) {
            word_type = 'Động từ';
          } else if (pos.includes('adjective')) {
            word_type = 'Tính từ';
          } else if (pos.includes('adverb')) {
            word_type = 'Phó từ';
          } else if (pos.includes('pronoun')) {
            word_type = 'Đại từ';
          } else if (pos.includes('preposition')) {
            word_type = 'Giới từ';
          } else if (pos.includes('conjunction')) {
            word_type = 'Liên từ';
          } else if (pos.includes('interjection')) {
            word_type = 'Thán từ';
          } else if (pos.includes('numeral') || pos.includes('number') || pos.includes('cardinal')) {
            word_type = 'Lượng từ';
          } else {
            word_type = 'Khác';
          }
        }
      }
    }
  } catch (err) {
    console.error('Error fetching Dictionary API:', err);
  }
  
  // 2. Google single translation
  try {
    const translateRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(searchWord)}`);
    if (translateRes.ok) {
      const translateData = await translateRes.json();
      if (Array.isArray(translateData) && translateData[0] && translateData[0][0]) {
        meaning = translateData[0][0][0] || '';
      }
    }
  } catch (err) {
    console.error('Error fetching Google Translate:', err);
  }
  
  if (transliteration || meaning) {
    const dynamicMatch = {
      word: word.trim(),
      transliteration: transliteration || '',
      meaning: meaning || '',
      word_type
    };
    englishDictMap.set(searchWord, dynamicMatch);
    return {
      ...dynamicMatch,
      suggestions
    };
  }
  
  return {
    word,
    transliteration: '',
    meaning: '',
    word_type: 'Danh từ',
    suggestions
  };
}
