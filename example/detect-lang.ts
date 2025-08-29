// Detects whether `text` is *primarily* written in the target script(s).
// Supported lang codes (aliases included):
// 'ja'|'jp', 'zh'|'cn', 'th', 'hi', 'ar', 'ko'
// NOTE: This is script detection, not full language detection.
export function checkLang(
  lang: string,
  text: string,
  options?: { threshold?: number } // portion of letters that must match (default 0.4)
): boolean | null {
  const threshold = options?.threshold ?? 0.4;

  // Normalize the language to a canonical key
  const normalize = (l: string) => {
    const key = l.toLowerCase();
    if (["ja", "jp"].includes(key)) return "ja";
    if (["zh", "cn"].includes(key)) return "zh";
    if (key === "th") return "th";
    if (key === "hi") return "hi";
    if (key === "ar") return "ar";
    if (key === "ko") return "ko";
    return null;
  };

  const key = normalize(lang);
  if (!key) return null;

  // Unicode property regexes (no 'g' flag; we reuse per char)
  const RE = {
    letter: /\p{L}/u,
    han: /\p{Script=Han}/u,
    hiragana: /\p{Script=Hiragana}/u,
    katakana: /\p{Script=Katakana}/u,
    thai: /\p{Script=Thai}/u,
    devanagari: /\p{Script=Devanagari}/u,
    arabic: /\p{Script=Arabic}/u,
    hangul: /\p{Script=Hangul}/u,
  } as const;

  let totalLetters = 0;
  let counts = {
    han: 0,
    hira: 0,
    kata: 0,
    thai: 0,
    dev: 0,
    arab: 0,
    hangul: 0,
  };

  for (const ch of text) {
    if (RE.letter.test(ch)) {
      totalLetters++;
      if (RE.han.test(ch)) counts.han++;
      else if (RE.hiragana.test(ch)) counts.hira++;
      else if (RE.katakana.test(ch)) counts.kata++;
      else if (RE.thai.test(ch)) counts.thai++;
      else if (RE.devanagari.test(ch)) counts.dev++;
      else if (RE.arabic.test(ch)) counts.arab++;
      else if (RE.hangul.test(ch)) counts.hangul++;
    }
  }

  if (totalLetters === 0) return false;

  const ratio = (n: number) => n / totalLetters;

  switch (key) {
    case "ja": {
      // Prefer Kana to avoid confusing with Chinese-only Han text.
      const kana = counts.hira + counts.kata;
      const kanaRatio = ratio(kana);
      const kanaPlusHanRatio = ratio(kana + counts.han);
      return (
        kanaRatio >= threshold || (kana > 0 && kanaPlusHanRatio >= threshold)
      );
    }
    case "zh": {
      // Lots of Han, but no Japanese Kana or Korean Hangul mixed in.
      const hanRatio = ratio(counts.han);
      const hasKanaOrHangul = counts.hira + counts.kata + counts.hangul > 0;
      return hanRatio >= threshold && !hasKanaOrHangul;
    }
    case "th":
      return ratio(counts.thai) >= threshold;
    case "hi":
      return ratio(counts.dev) >= threshold;
    case "ar":
      return ratio(counts.arab) >= threshold;
    case "ko":
      return ratio(counts.hangul) >= threshold;
  }
}
/*
function testLang(lang: string, text: string) {
  const result = checkLang(lang, text);
  console.log(`${lang}: ${text} -> ${result}`);
}

testLang("ja", "これはテストです"); // true (Hiragana/Katakana)
testLang("zh", "这是一个测试"); // true (Han, no Kana/Hangul)
testLang("ja", "漢字だけ"); // false (Han only → ambiguous with Chinese)
testLang("ar", "مرحبا بالعالم"); // true
testLang("th", "สวัสดีชาวโลก"); // true
testLang("hi", "यह एक परीक्षण है"); // true
testLang("xx", "whatever"); // null (unsupported lang code)
*/
