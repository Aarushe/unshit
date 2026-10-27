// Titles are never set in all caps. Shouted text is rewritten in sentence case,
// spelling each word the way the page itself spells it elsewhere ("e-Visa",
// "India", "ETA", "Αθήνα"), so acronyms and brand names survive.
// Works for every cased script (Latin, Greek, Cyrillic, Armenian…); scripts
// without case (CJK, Arabic, Hebrew, Indic…) are never shouting and pass through.
// Mirrored in extension/content.js — keep the two in step.

const WORD = /[\p{L}\p{M}][\p{L}\p{M}'’]*(?:[-‐][\p{L}\p{M}][\p{L}\p{M}'’]*)*/gu;

/** Has capitals and no small letters ("ÉTÉ", "МОСКВА"); uncased scripts never are. */
const isUpper = (w: string) => /\p{Lu}/u.test(w) && !/\p{Ll}/u.test(w);

// Locale-aware casing (Turkish İ/ı, Lithuanian…), with invalid lang tags ignored.
const locales = new Map<string, string>();
function locale(lang?: string): string {
  if (!lang) return "und";
  let hit = locales.get(lang);
  if (!hit) {
    try {
      "i".toLocaleUpperCase(lang);
      hit = lang;
    } catch {
      hit = "und";
    }
    locales.set(lang, hit);
  }
  return hit;
}

/** Lookup key: lowercase without accents, since capitals often drop them (ETE → été, ΑΘΗΝΑ → Αθήνα). */
const fold = (w: string) => w.toLocaleLowerCase("und").normalize("NFD").replace(/\p{M}/gu, "");

// Common short words, as folded keys. Any other short plain-Latin word the page
// never spells otherwise is treated as an acronym and kept in capitals.
const COMMON = new Set(
  (
    // English
    "a an the and or but nor so yet of to in on at by for from with as into onto upon off out up down over " +
    "is am are was were be been do does did has have had can may will must not no yes all any each few " +
    "how why who what when where here there this that these those it its we us our you your my me he she " +
    "him her his they them their if then than too very just only also more most less much many some " +
    "new now old get got go see use used one two six ten own via per log sign home help about " +
    "join read view find shop sale menu next back page last open free gift news blog team work " +
    "fees fee pay paid form step user name date time year day days week site book call mail info " +
    "like make take give keep show list main data file done edit save send stop start end plan care " +
    "set run buy try ask add let put war art law tax job act age air big car far fun hot low man men way win " +
    // French, Spanish, Portuguese, Italian, German, Dutch
    "le la les un une des du de et ou en au aux sur par pour dans avec sans est son sa ses nos vos ce cet qui que ne pas plus " +
    "el los las y o e u con por para del al una uno su sus mas mi tu " +
    "os um uma do da dos das no na em ao com sem " +
    "il lo gli di da per non che " +
    "der die das und oder mit von zu im am ist ein eine den dem auf fur bei aus wie was wir sie ihr uns ich es " +
    "het een van voor op met niet"
  ).split(" "),
);

export type CaseDictionary = {
  /** Folded key → spelling → how often the page uses it. */
  forms: Map<string, Map<string, number>>;
  lang?: string;
};

/**
 * Adds a piece of the page's text (a line, a text node) to the dictionary. In
 * shouted pieces capitals mean nothing; in ordinary ones they mark acronyms.
 */
export function learn(dict: CaseDictionary, text: string) {
  // Only pieces with small letters show which words the page really writes in capitals.
  const shouted = !/\p{Ll}/u.test(text);
  for (const w of text.match(WORD) ?? []) {
    if (shouted && isUpper(w)) continue;
    if (!/\p{L}/u.test(w)) continue;
    const key = fold(w);
    let forms = dict.forms.get(key);
    if (!forms) dict.forms.set(key, (forms = new Map()));
    forms.set(w, (forms.get(w) ?? 0) + 1);
  }
}

/** Learns each word's preferred spelling from the page's own text, given piece by piece. */
export function learnCasing(pieces: string | Iterable<string>, lang?: string): CaseDictionary {
  const dict: CaseDictionary = { forms: new Map(), lang };
  for (const piece of typeof pieces === "string" ? [pieces] : pieces) learn(dict, piece);
  return dict;
}

/** The page's spelling of a shouted word: one that capitalises to it exactly, else any accent variant. */
function spell(dict: CaseDictionary, w: string, loc: string): string | undefined {
  const forms = dict.forms.get(fold(w));
  if (!forms) return undefined;
  const all = [...forms];
  const exact = all.filter(([f]) => f.toLocaleUpperCase(loc) === w);
  const pool = exact.length ? exact : all;
  // Most frequent spelling wins; ties go to lowercase (a capital may just start a sentence).
  return pool.sort(
    (a, b) => b[1] - a[1] || Number(a[0] !== a[0].toLocaleLowerCase(loc)) - Number(b[0] !== b[0].toLocaleLowerCase(loc)),
  )[0][0];
}

/** True when text is written in capitals for emphasis rather than as an acronym. */
export function isShouting(text: string): boolean {
  return !/\p{Ll}/u.test(text) && (text.match(/\p{Lu}/gu) ?? []).length >= 4;
}

/** Acronyms are short plain-Latin capitals: FAQ, USA, II, HTML (no vowel). Words with accents or in other scripts are words. */
const acronymish = (w: string) =>
  /^[A-Z]+$/.test(w) && (w.length <= 3 || (w.length === 4 && !/[AEIOUY]/.test(w)));

const capitalise = (w: string, loc: string) => {
  const [first, ...rest] = w;
  return first.toLocaleUpperCase(loc) + rest.join("");
};

// Sentence ends before a word: ". ", "! ", "。", "?» "…
const SENTENCE_END = /[.!?…。！？]["'”’»)\]]*\s*$/u;
// Words joined to digits or underscores are codes and identifiers: MAX_VALUE, MP3, COVID-19.
const CODEISH = /[\p{N}_]/u;

export type FixCaseOptions = {
  /** Language of the text; defaults to the dictionary's. */
  lang?: string;
  /** Rewrite even if this piece alone isn't shouting (it's part of a shouted line). */
  force?: boolean;
  /** Whether this piece starts the line (so its first word is capitalised). */
  first?: boolean;
};

export function fixCase(text: string, dict: CaseDictionary, options: FixCaseOptions = {}): string {
  if (!(options.force ? /\p{Lu}/u.test(text) && !/\p{Ll}/u.test(text) : isShouting(text))) return text;
  const loc = locale(options.lang ?? dict.lang);
  let first = options.first ?? true;
  let lastEnd = 0;
  return text.replace(WORD, (w: string, offset: number) => {
    const start = first || (lastEnd > 0 && SENTENCE_END.test(text.slice(lastEnd, offset)));
    first = false;
    lastEnd = offset + w.length;
    if (!/\p{Lu}/u.test(w)) return w;
    if (CODEISH.test(text[offset - 1] ?? "") || CODEISH.test(text.slice(lastEnd, lastEnd + 2).replace(/^[-‐]/, "")[0] ?? "")) return w;
    let form = spell(dict, w, loc) ?? (acronymish(w) && !COMMON.has(fold(w)) ? w : w.toLocaleLowerCase(loc));
    if (start && form === form.toLocaleLowerCase(loc)) form = capitalise(form, loc);
    return form;
  });
}
