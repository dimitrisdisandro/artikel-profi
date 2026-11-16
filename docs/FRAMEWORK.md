# lernapp-core: Framework für Lern-Apps

Der Ordner `core/` ist der gemeinsame Kern. Er enthält alles, was jede Lern-App braucht, und kennt keine Inhalte. Eine App liefert nur ein Konfigurationsobjekt `APP` und ihre Übungsmodi.

## Was der Kern übernimmt

- Profile (Avatar, Rangliste, Löschen) und Speicherung in localStorage
- Statistik pro Kategorie und pro Modus
- Adaptive Gewichtung (Aufgaben mit Fehlern kommen häufiger)
- Ausgleichssystem (jede Übung höchstens N Mal, Sperre, automatischer Wechsel, neue Runde)
- Abzeichen, Lernpfad, Tagesaufgabe, Serie, Konfetti
- Einstellungen (Dunkelmodus, Ton, Vorlesen, Zurücksetzen), Hinweis beim ersten Start, «Über diese App»
- Ton (Web Audio) und Sprachausgabe (Web Speech)
- Layout und Gestaltung (`core.css`), PWA-Grundlage

## Was eine App liefert

```
app/
  nouns.js (oder anderer Inhalt)   die Inhalte der App
  grammar.js (oder anderer Code)   erzeugt Aufgaben
  modes.js                         die Übungsmodi
  config.js                        das Objekt APP
  main.js                          Core.init(APP)
```

### Das Objekt `APP`

| Feld | Bedeutung |
|---|---|
| `id` | eindeutiger Name, auch Präfix für localStorage |
| `name`, `icon`, `version` | Titel, Emoji, Version |
| `speechLang` | Sprache der Sprachausgabe, z.B. `de-DE` |
| `balanceMax` | wie oft jeder Modus gespielt werden darf (Standard 10) |
| `dailyGoal` | Aufgaben pro Tag |
| `pathIcons` | 9 Emojis für den Lernpfad |
| `levels` | `[{ label, info }]` Schwierigkeitsstufen |
| `modes` | Liste der Übungsmodi (siehe unten) |
| `createTask(opts)` | erzeugt eine Aufgabe |
| `statGroups` | `[{ title, items: [{ key, label, tone? }] }]` |
| `badges` | `[{ id, icon, title, desc, test(profil) }]` |
| `texts` | alle Texte der Oberfläche (siehe `app/config.js`) |

### `createTask({ mode, level, weights, last })`

Gibt ein Objekt zurück. Der Kern braucht nur diese Felder:

| Feld | Bedeutung |
|---|---|
| `itemKey` | Schlüssel für die adaptive Gewichtung (z.B. das Nomen) |
| `cats` | Liste von Statistik-Schlüsseln, z.B. `['c1', 'a_den', 'g_m']` |
| `hints` | Liste von Hinweis-Texten (der Hinweis-Knopf zeigt sie der Reihe nach) |
| `speak` | Text für die Sprachausgabe bei richtiger Antwort |

Alle weiteren Felder sind Sache der App und werden an den Modus weitergereicht. `weights[itemKey]` ist das Gewicht (1 bis 8) für Aufgaben mit Fehlern, `last` der Schlüssel der letzten Aufgabe, damit nichts doppelt kommt.

### Ein Übungsmodus

```js
{
  label: 'Auswählen',          // Beschriftung des Tabs
  title: '…', sub: '…',        // Titel und Untertitel der Aufgabenkarte
  render(task, ui) { … }
}
```

`ui` enthält:

- `ui.body`: Container für die Aufgabe
- `ui.row`: Container für die Knöpfe unten
- `ui.hintButton()`: liefert einen fertigen Hinweis-Knopf
- `ui.done(ok, given)`: **meldet das Ergebnis**

Der Modus zeichnet nur die Aufgabe und ruft `ui.done` genau einmal auf. Statistik, Gewichte, Ausgleichszähler, Abzeichen, Tagesaufgabe, Rückmeldung und der «Weiter»-Knopf gehören dem Kern. Diese Trennung verhindert viele Fehler, die in der Uhr-App entstanden sind, weil Modus und Spiellogik vermischt waren.

## Neue App anlegen

1. Ordner `core/`, `icons/`, `manifest.json`, `sw.js`, `index.html`, `tools/check.js` kopieren.
2. `app/` neu schreiben: Inhalte, Aufgabenerzeugung, Modi, `config.js`, `main.js`.
3. In `index.html` Titel anpassen, in `manifest.json` Name und Farben, in `sw.js` den Cache-Namen und die Dateiliste, in `tools/check.js` die Liste `JS_FILES` und die Inhaltsprüfungen.
4. Icons ersetzen.
5. `node tools/check.js` ausführen, bis alles besteht.

## Versionen

Der Kern wird pro App kopiert (keine zentrale Auslieferung). So bleibt jede App eigenständig und offline lauffähig. Ein Fehler im Kern muss deshalb in jede App übernommen werden. Die Version steht im Kommentar am Anfang von `core/core.js` und `core/core.css`.

## Regeln für Änderungen

- Nach jeder Änderung `node tools/check.js` ausführen, vor jedem ZIP.
- Neue HTML-Elemente nur mit eindeutiger ID einfügen. Das Skript meldet fehlende und doppelte IDs.
- Zustand beim Klick prüfen, nicht beim Zeichnen merken (Beispiel: Sperre eines Modus).
- README der App bei jeder sichtbaren Änderung nachführen.
- Schweizer Schreibweise: nie das Eszett, immer «ss».
