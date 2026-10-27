// Titles are never set in all caps. Shouted text is rewritten in sentence case,
// spelling each word the way the page itself spells it elsewhere ("e-Visa",
// "India", "ETA"), so acronyms and brand names survive.
// Mirrored in extension/content.js — keep the two in step.

const WORD = /[A-Za-z][A-Za-z'’]*(?:-[A-Za-z][A-Za-z'’]*)*/g;

const isUpper = (w: string) => w === w.toUpperCase() && w !== w.toLowerCase();

// Common short words. Any other short word the page never spells otherwise is
// treated as an acronym and kept in capitals.
const COMMON = new Set(
  (
    "a an the and or but nor so yet of to in on at by for from with as into onto upon off out up down over " +
    "is am are was were be been do does did has have had can may will must not no yes all any each few " +
    "how why who what when where here there this that these those it its we us our you your my me he she " +
    "him her his they them their i if then than too very just only also more most less much many some " +
    "new now old get got go see use used one two six ten own via per log sign home help about " +
    "join read view find shop sale menu next back page last open free gift news blog team work " +
    "fees fee pay paid form step user name date time year day days week site book call mail info " +
    "like make take give keep show list main data file done edit save send stop start end plan care"
  ).split(" "),
);

export type CaseDictionary = Map<string, string>;

/** Learns each word's preferred spelling from the page's own (non-shouted) text. */
export function learnCasing(text: string): CaseDictionary {
  const counts = new Map<string, Map<string, number>>();
  for (const w of text.match(WORD) ?? []) {
    if (isUpper(w) && w.length > 1) continue;
    const key = w.toLowerCase();
    const forms = counts.get(key) ?? new Map<string, number>();
    forms.set(w, (forms.get(w) ?? 0) + 1);
    counts.set(key, forms);
  }
  const dict: CaseDictionary = new Map();
  for (const [key, forms] of counts) {
    // Most frequent spelling wins; ties go to lowercase (a capital may just start a sentence).
    const best = [...forms].sort((a, b) => b[1] - a[1] || Number(a[0] !== key) - Number(b[0] !== key))[0][0];
    dict.set(key, best);
  }
  return dict;
}

/** True when text is written in capitals for emphasis rather than as an acronym. */
export function isShouting(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  return letters.length >= 4 && isUpper(letters);
}

export function fixCase(text: string, dict: CaseDictionary): string {
  if (!isShouting(text)) return text;
  let first = true;
  return text.replace(WORD, (w) => {
    const key = w.toLowerCase();
    let form =
      dict.get(key) ??
      // Unknown short words are probably acronyms (FAQ, NASA); longer ones are words.
      (COMMON.has(key) || w.replace(/[^A-Za-z]/g, "").length > 4 ? key : w);
    if (first) {
      first = false;
      if (form === form.toLowerCase()) form = form[0].toUpperCase() + form.slice(1);
    }
    return form;
  });
}
