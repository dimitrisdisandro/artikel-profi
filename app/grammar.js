'use strict';
/*
 * Grammatik für «Artikel-Profi»: Artikel, Nomenformen in den vier Fällen,
 * Satzvorlagen und die gewichtete Aufgabenerzeugung.
 */
const Grammar = (function () {
  const CASES = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'];
  const QUESTIONS = ['Wer oder was?', 'Wen oder was?', 'Wem?', 'Wessen?'];

  // Index = Fall (0 Nominativ, 1 Akkusativ, 2 Dativ, 3 Genitiv)
  const DEF = {
    m: ['der', 'den', 'dem', 'des'],
    f: ['die', 'die', 'der', 'der'],
    n: ['das', 'das', 'dem', 'des'],
    p: ['die', 'die', 'den', 'der']
  };
  const INDEF = {
    m: ['ein', 'einen', 'einem', 'eines'],
    f: ['eine', 'eine', 'einer', 'einer'],
    n: ['ein', 'ein', 'einem', 'eines']
  };
  const DEF_LIST = ['der', 'die', 'das', 'den', 'dem', 'des'];
  const INDEF_LIST = ['ein', 'eine', 'einen', 'einem', 'einer', 'eines'];

  const GENDER_TEXT = { m: 'männlich', f: 'weiblich', n: 'sächlich' };
  const BASE_ARTICLE = { m: 'der', f: 'die', n: 'das' };

  // Wie oft ein Nomen der jeweiligen Stufe gezogen wird
  const TIER_WEIGHT = { 1: 6, 2: 3, 3: 1 };

  // Schwierigkeitsstufen: welche Fälle, welche Wörter
  const LEVELS = [
    { cases: [0, 1], maxTier: 2 },
    { cases: [0, 1, 2], maxTier: 2 },
    { cases: [0, 1, 2, 3], maxTier: 3 }
  ];

  /*
   * Satzvorlagen. {A} = Lücke für den Artikel, {N} = Nomen in der richtigen
   * Form, {is} = ist/sind. Alle Verben und Präpositionen sind so gewählt,
   * dass sie zu (fast) jedem Nomen passen. «q» überschreibt die Fragehilfe.
   * «all» = passt auch zu Zeit- und Gefühlswörtern (Nomen mit Option x).
   */
  const TEMPLATES = [
    // Nominativ
    { c: 0, t: 'Da {is} {A} {N}.' },
    { c: 0, t: 'Wo {is} {A} {N}?' },
    { c: 0, t: '{A} {N} {is} hier.' },
    { c: 0, t: 'Das {is} {A} {N}.', all: true },
    { c: 0, t: 'Hier {is} {A} {N}.' },
    { c: 0, t: '{A} {N} {is} sehr schön.', all: true },
    // Akkusativ
    { c: 1, t: 'Ich sehe {A} {N}.' },
    { c: 1, t: 'Ich suche {A} {N}.' },
    { c: 1, t: 'Wir brauchen {A} {N}.' },
    { c: 1, t: 'Sie malt {A} {N}.' },
    { c: 1, t: 'Er findet {A} {N}.' },
    { c: 1, t: 'Wir sprechen über {A} {N}.', all: true },
    { c: 1, t: 'Ich denke an {A} {N}.', all: true },
    { c: 1, t: 'Er wartet auf {A} {N}.', all: true },
    { c: 1, t: 'Wir freuen uns auf {A} {N}.', all: true },
    { c: 1, t: 'Das Geschenk ist für {A} {N}.' },
    { c: 1, t: 'Ich gehe nicht ohne {A} {N}.' },
    // Dativ
    { c: 2, t: 'Ich spiele mit {A} {N}.' },
    { c: 2, t: 'Wir sitzen neben {A} {N}.', q: 'Wo? (neben)' },
    { c: 2, t: 'Sie steht hinter {A} {N}.', q: 'Wo? (hinter)' },
    { c: 2, t: 'Er wartet vor {A} {N}.', q: 'Wo? (vor)' },
    { c: 2, t: 'Ich komme von {A} {N}.' },
    { c: 2, t: 'Wir gehen zu {A} {N}.' },
    { c: 2, t: 'Das Kind spricht mit {A} {N}.' },
    { c: 2, t: 'Ich bin bei {A} {N}.' },
    { c: 2, t: 'Sie träumt von {A} {N}.', all: true },
    { c: 2, t: 'Er hat Angst vor {A} {N}.', all: true },
    { c: 2, t: 'Ich erzähle von {A} {N}.', all: true },
    // Genitiv
    { c: 3, t: 'Das ist die Farbe {A} {N}.' },
    { c: 3, t: 'Ich kenne den Namen {A} {N}.' },
    { c: 3, t: 'Wir sehen das Ende {A} {N}.', all: true },
    { c: 3, t: 'Wegen {A} {N} bin ich zu spät.', all: true },
    { c: 3, t: 'Das ist die Mitte {A} {N}.' }
  ];

  let NOUNS = [];

  // ── Hilfsfunktionen für Wortformen ──────────────────────────────

  function syllables(w) {
    const m = w.toLowerCase().match(/[aeiouyäöü]+/g);
    return m ? m.length : 1;
  }

  // Genitiv Singular für männliche und sächliche Nomen (Regel + Ausnahmen per G=)
  function genitiveRule(w) {
    if (/[aeiouäöüy]$/i.test(w)) return w + 's';
    if (/nis$/i.test(w)) return w + 'ses';
    if (/(s|x|z|sch|st)$/i.test(w)) return w + 'es';
    if (syllables(w) === 1) return w + 'es';
    return w + 's';
  }

  // Dativ Plural: -n anhängen, ausser das Wort endet schon auf -n oder -s
  function dativePlural(p) {
    return /[nsi]$/i.test(p) ? p : p + 'n';   // -i: den Spaghetti
  }

  // Schwache Maskulina: der Hase, den/dem/des Hasen
  function weakForm(w) {
    return /e$/i.test(w) ? w + 'n' : w + 'en';
  }

  function nounForm(n, kase, plural) {
    if (plural) {
      const p = n.g === 'p' ? n.sg : n.pl;
      return kase === 2 ? dativePlural(p) : p;
    }
    if (n.g === 'm' && n.weak && kase > 0) {
      return kase === 3 && n.gen ? n.gen : weakForm(n.sg);
    }
    if (kase === 3 && (n.g === 'm' || n.g === 'n')) return n.gen || genitiveRule(n.sg);
    return n.sg;
  }

  function article(def, kase, g, plural) {
    if (plural) return DEF.p[kase];
    return def ? DEF[g][kase] : INDEF[g][kase];
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  // ── Wortschatz einlesen ─────────────────────────────────────────

  function parseNouns(lines) {
    const seen = new Set();
    const out = [];
    lines.forEach((line) => {
      const parts = line.split('|');
      const sg = parts[0];
      if (seen.has(sg)) return;            // Doppelte Einträge ignorieren
      seen.add(sg);
      const flags = parts.slice(4);
      const n = {
        sg: sg,
        g: parts[1],
        pl: parts[2] === '-' ? null : parts[2],
        tier: parseInt(parts[3], 10),
        weak: flags.indexOf('w') >= 0,
        unc: flags.indexOf('u') >= 0,
        abs: flags.indexOf('x') >= 0,
        gen: null
      };
      flags.forEach((f) => { if (f.indexOf('G=') === 0) n.gen = f.slice(2); });
      out.push(n);
    });
    return out;
  }

  function loadNouns(lines) { NOUNS = parseNouns(lines); return NOUNS; }

  // ── Aufgabe erzeugen ────────────────────────────────────────────

  function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function pickNoun(level, weights, last) {
    const L = LEVELS[level] || LEVELS[0];
    let pool = NOUNS.filter((n) => n.tier <= L.maxTier && n.sg !== last);
    if (!pool.length) pool = NOUNS.slice();
    const ws = pool.map((n) => TIER_WEIGHT[n.tier] * Math.max(1, (weights && weights[n.sg]) || 1));
    let total = 0;
    ws.forEach((w) => { total += w; });
    let r = Math.random() * total;
    for (let i = 0; i < pool.length; i++) {
      r -= ws[i];
      if (r <= 0) return pool[i];
    }
    return pool[pool.length - 1];
  }

  function createTask(opts) {
    const level = opts.level || 0;
    const L = LEVELS[level] || LEVELS[0];
    const n = pickNoun(level, opts.weights || {}, opts.last);
    const kase = rnd(L.cases);
    const tpl = rnd(TEMPLATES.filter((t) => t.c === kase && (!n.abs || t.all)));

    const canSingular = n.g !== 'p';
    const canPlural = n.g === 'p' || !!n.pl;
    const plural = !canSingular ? true : (canPlural && Math.random() < 0.3);
    const def = plural || n.unc ? true : Math.random() < 0.5;

    const answer = article(def, kase, n.g, plural);
    const noun = nounForm(n, kase, plural);

    const withIs = tpl.t.replace('{is}', plural ? 'sind' : 'ist');
    const halves = withIs.split('{A}');
    const before = halves[0].trim();
    const after = (halves[1] || '').replace('{N}', noun).trim();
    const shown = before ? answer : cap(answer);
    const full = [before, shown, after].filter(Boolean).join(' ');

    const genderKey = plural ? 'p' : n.g;
    const hints = [
      'Frage: ' + (tpl.q || QUESTIONS[kase]) + '  →  ' + CASES[kase],
      plural
        ? '«' + noun + '» steht hier in der Mehrzahl.'
        : '«' + n.sg + '» ist ' + GENDER_TEXT[n.g] + ': ' + BASE_ARTICLE[n.g] + ' ' + n.sg + '.'
    ];

    return {
      itemKey: n.sg,
      template: tpl.t,
      kase: kase,
      plural: plural,
      def: def,
      gender: genderKey,
      answer: answer,
      noun: noun,
      before: before,
      after: after,
      full: full,
      speak: full,
      options: (def ? DEF_LIST : INDEF_LIST).slice(),
      hints: hints,
      cats: ['c' + kase, 'a_' + answer, 'g_' + genderKey]
    };
  }

  return {
    CASES, QUESTIONS, DEF, INDEF, DEF_LIST, INDEF_LIST, GENDER_TEXT, LEVELS, TEMPLATES, TIER_WEIGHT,
    loadNouns, parseNouns, nounForm, article, genitiveRule, dativePlural, weakForm, createTask,
    nouns: () => NOUNS
  };
})();
