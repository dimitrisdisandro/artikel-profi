'use strict';
/*
 * Konfiguration von «Artikel-Profi». Alles, was nur diese App betrifft,
 * steht hier oder in nouns.js, grammar.js und modes.js.
 * Der Kern (core/) kennt nur dieses Objekt.
 */
const APP = {
  id: 'artikel-profi',
  name: 'Artikel-Profi',
  icon: '📘',
  version: '1.0.0',
  speechLang: 'de-DE',
  balanceMax: 10,
  dailyGoal: 5,
  pathIcons: ['🌱', '⭐', '🌙', '☀️', '🔥', '💫', '🏆', '👑', '🎓'],

  levels: [
    { label: 'Einfach', info: 'Nominativ und Akkusativ, häufige Wörter' },
    { label: 'Mittel', info: 'zusätzlich Dativ' },
    { label: 'Schwer', info: 'alle vier Fälle, auch seltene Wörter' }
  ],

  modes: Modes,
  createTask: Grammar.createTask,

  statGroups: [
    {
      title: 'Pro Fall',
      items: [
        { key: 'c0', label: 'Nominativ' },
        { key: 'c1', label: 'Akkusativ' },
        { key: 'c2', label: 'Dativ' },
        { key: 'c3', label: 'Genitiv' }
      ]
    },
    {
      title: 'Pro Geschlecht',
      items: [
        { key: 'g_m', label: 'männlich', tone: 'm' },
        { key: 'g_f', label: 'weiblich', tone: 'f' },
        { key: 'g_n', label: 'sächlich', tone: 'n' },
        { key: 'g_p', label: 'Mehrzahl', tone: 'p' }
      ]
    },
    {
      title: 'Pro Artikel',
      items: Grammar.DEF_LIST.concat(Grammar.INDEF_LIST).map((a) => ({ key: 'a_' + a, label: a }))
    }
  ],

  badges: [
    { id: 'first', icon: '🎯', title: 'Erster Schritt', desc: 'Die erste Aufgabe gelöst', test: (p) => p.stats.total >= 1 },
    { id: 'ten', icon: '🔟', title: 'Zehn richtig', desc: '10 richtige Antworten', test: (p) => p.stats.correct >= 10 },
    { id: 'fifty', icon: '🥉', title: 'Fünfzig richtig', desc: '50 richtige Antworten', test: (p) => p.stats.correct >= 50 },
    { id: 'hundred', icon: '🥈', title: 'Hundert richtig', desc: '100 richtige Antworten', test: (p) => p.stats.correct >= 100 },
    { id: 'streak5', icon: '🔥', title: 'Serie 5', desc: '5 richtige Antworten in Folge', test: (p) => p.stats.bestStreak >= 5 },
    { id: 'streak10', icon: '⚡', title: 'Serie 10', desc: '10 richtige Antworten in Folge', test: (p) => p.stats.bestStreak >= 10 },
    { id: 'bothModes', icon: '🧩', title: 'Beide Modi', desc: 'Auswählen und Eintippen ausprobiert', test: (p) => p.stats.modesUsed.length >= 2 },
    {
      id: 'allCases', icon: '📚', title: 'Alle Fälle', desc: 'In jedem Fall 10 richtige Antworten',
      test: (p) => [0, 1, 2, 3].every((k) => ((p.cats['c' + k] || {}).c || 0) >= 10)
    },
    { id: 'daily3', icon: '📅', title: 'Drei Tage', desc: 'Drei Tage nacheinander die Tagesaufgabe geschafft', test: (p) => p.stats.dayStreak >= 3 },
    { id: 'daily7', icon: '🗓️', title: 'Eine Woche', desc: 'Sieben Tage nacheinander die Tagesaufgabe geschafft', test: (p) => p.stats.dayStreak >= 7 },
    { id: 'master', icon: '👑', title: 'Artikel-Meister', desc: '300 richtige Antworten und eine Serie von 15', test: (p) => p.stats.correct >= 300 && p.stats.bestStreak >= 15 }
  ],

  texts: {
    whoPlays: 'Wer spielt?',
    tagline: 'der, die, das, ein, eine … immer der richtige Artikel',
    newProfile: 'Neues Profil',
    namePlaceholder: 'Name',
    save: 'Speichern',
    cancel: 'Abbrechen',
    deleteProfile: 'Profil löschen',
    deleteConfirm: (name) => 'Profil «' + name + '» wirklich löschen? Der Fortschritt geht verloren.',
    profileMeta: (p) => p.stats.correct + ' richtig · beste Serie ' + p.stats.bestStreak,
    storageHint: '⚠️ Dein Fortschritt wird nur auf diesem Gerät gespeichert. Wenn du den Browser-Cache oder die App-Daten löschst, gehen die Statistiken verloren.',
    highscore: 'Rangliste',

    scoreCorrect: 'Richtig',
    scoreTotal: 'Gesamt',
    scoreStreak: 'Serie',
    level: 'Stufe:',
    taskTitle: 'Welcher Artikel passt?',
    hint: 'Hinweis',
    next: 'Weiter',
    daily: (done, goal) => 'Tagesaufgabe: ' + done + '/' + goal,
    praise: ['Richtig! 🎉', 'Super!', 'Genau!', 'Perfekt!', 'Toll gemacht!', 'Stimmt!'],
    wrong: (t) => 'Richtig ist «' + t.answer + '»:  ' + t.full,
    speakWrong: (t) => 'Nicht ganz. Richtig ist: ' + t.full,
    locked: '🔒 Diese Übung ist gesperrt, bis alle anderen auch 10 Mal geübt wurden.',
    roundDone: '🎉 Runde geschafft! Alle Übungen sind wieder frei.',
    balanceInfo: (labels, minLeft) => '🔒 ' + labels.join(', ') + ' gesperrt. Noch mindestens ' + minLeft + ' Aufgabe(n) in den anderen Übungen.',
    newBadge: (b) => b.icon + ' Neues Abzeichen: ' + b.title,
    streakMsg: (n) => '🔥 ' + n + ' richtig in Folge!',
    dailyDone: '📅 Tagesaufgabe geschafft!',

    statsTitle: 'Statistik',
    badgesTitle: 'Abzeichen',

    settings: 'Einstellungen',
    darkMode: 'Dunkelmodus',
    sound: 'Ton',
    speech: 'Vorlesen',
    on: 'EIN',
    off: 'AUS',
    reset: 'Fortschritt zurücksetzen',
    resetBtn: 'Zurücksetzen',
    resetConfirm: 'Den ganzen Fortschritt dieses Profils wirklich zurücksetzen?',

    aboutTitle: 'Über diese App',
    aboutText:
      'Eine kostenlose Lern-App für Kinder, die die Artikel der deutschen Sprache üben möchten: der, die, das, ein, eine und ihre Formen in allen vier Fällen.\n\n' +
      'Der Fortschritt wird nur auf diesem Gerät gespeichert. Es gibt keine Registrierung, keine Werbung und keine Datenübertragung.\n\n' +
      'Diese App wurde für den privaten Gebrauch entwickelt und wird ohne Gewähr bereitgestellt. Sie dient ausschliesslich zu Lernzwecken.',

    disclaimer: {
      title: 'Hinweis',
      text:
        'Diese App wurde für den privaten Gebrauch entwickelt und dient ausschliesslich zu Lernzwecken. ' +
        'Sie wird ohne Gewähr bereitgestellt. Für allfällige Fehler oder Ungenauigkeiten wird keine Haftung übernommen.',
      btn: 'Verstanden'
    }
  }
};
