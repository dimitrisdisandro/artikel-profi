# 📘 Artikel-Profi

Eine kostenlose Lern-App für Kinder, die die Artikel der deutschen Sprache üben möchten: **der, die, das, ein, eine** und ihre Formen in allen vier Fällen. Sie läuft direkt im Browser, ohne Installation, ohne Registrierung und ohne Werbung.

Artikel-Profi ist die erste App auf dem gemeinsamen Basis-Framework `lernapp-core` (siehe [docs/FRAMEWORK.md](docs/FRAMEWORK.md)).

## So wird geübt

Ein Satz mit einer Lücke wird gezeigt, zum Beispiel «Ich sehe ___ Hund.» Das Kind setzt den passenden Artikel ein (hier «den»).

**Zwei Übungsmodi**

- **Auswählen:** den richtigen Artikel aus sechs Knöpfen antippen (der, die, das, den, dem, des oder ein, eine, einen, einem, einer, eines).
- **Eintippen:** den Artikel selbst in die Lücke schreiben. Gross- und Kleinschreibung und Leerzeichen spielen keine Rolle.

**Drei Stufen**

| Stufe | Fälle | Wörter |
|---|---|---|
| Einfach | Nominativ, Akkusativ | häufige Wörter |
| Mittel | zusätzlich Dativ | häufige Wörter |
| Schwer | alle vier Fälle (auch Genitiv) | auch seltene Wörter |

**Hilfen**

- Der **Hinweis-Knopf** zeigt zuerst die Fragehilfe («Wen oder was? → Akkusativ») und dann das Geschlecht des Wortes.
- Nach der Antwort erscheint das Nomen in der **Farbe seines Geschlechts**: männlich blau, weiblich rot, sächlich grün, Mehrzahl gelb. So prägt sich das Geschlecht mit der Zeit ein.
- Bei einem Fehler wird der ganze Satz richtig angezeigt und vorgelesen.

## Wortschatz

Über 500 kindgerechte Nomen (Tiere, Essen, Schule, Familie, Haus, Natur, Fahrzeuge, Spielen, Körper, Zeit) mit Geschlecht und Mehrzahl. Jedes Wort hat eine Häufigkeitsstufe:

| Stufe | Bedeutung | Gewicht beim Ziehen |
|---|---|---|
| 1 | Kernwortschatz (Hund, Haus, Schule, Mutter) | 6 |
| 2 | häufig (Kaninchen, Rucksack, Hubschrauber) | 3 |
| 3 | selten | 1 |

Zusätzlich werden Wörter, bei denen ein Kind Fehler macht, häufiger wiederholt (adaptives Lernen). Die Stufen sind eine Einschätzung des Kinderwortschatzes und keine geprüfte Häufigkeitsliste. Die Liste liegt als einfache Textdatei in `app/nouns.js` und lässt sich leicht anpassen.

Zeit- und Gefühlswörter (Sommer, Zeit, Angst, Idee …) bekommen nur Sätze, die dazu passen («Wir freuen uns auf den Sommer»), damit keine unsinnigen Sätze entstehen.

## Funktionen

- **Mehrere Profile** mit Emoji-Avatar und Rangliste ab zwei Profilen
- **Statistik** pro Fall, pro Geschlecht und pro Artikel
- **Ausgleichssystem:** jede Übung höchstens 10 Mal; danach ist sie gesperrt, und die App wechselt automatisch zur nächsten freien Übung. Sobald alle Übungen 10 Mal gemacht wurden, startet eine neue Runde.
- **Tagesaufgabe** (5 Aufgaben pro Tag), **Lernpfad** mit 9 Stufen und **11 Abzeichen**
- **Ton-Feedback** und **Vorlesen** (mit der Sprachausgabe des Geräts)
- **Dunkelmodus**
- **Offline-fähig** (PWA, installierbar auf Android und iOS). Updates erscheinen sofort, weil zuerst das Netz und erst danach der Zwischenspeicher verwendet wird.

Der Fortschritt wird nur auf dem Gerät gespeichert (localStorage). Wenn der Browser-Cache oder die App-Daten gelöscht werden, gehen die Statistiken verloren. Darauf weist die App beim Erstellen eines Profils hin.

## Aufbau

```
index.html          Seitenstruktur
manifest.json       PWA-Angaben
sw.js               Service Worker (Offline-Betrieb)
core/               gemeinsamer Kern für alle Lern-Apps (lernapp-core)
app/                alles, was nur Artikel-Profi betrifft
  nouns.js            Wortschatz
  grammar.js          Artikel, Wortformen, Satzvorlagen, Aufgabenerzeugung
  modes.js            die beiden Übungsmodi
  config.js           Texte, Abzeichen, Statistik-Gruppen
tools/check.js      automatische Prüfung
docs/FRAMEWORK.md   Anleitung für weitere Apps
```

Reines HTML, CSS und JavaScript, ohne Bibliotheken und ohne Build-Schritt.

## Prüfen vor jeder Veröffentlichung

```
cd tools
npm install        # nur beim ersten Mal (installiert jsdom)
cd ..
node tools/check.js
```

Das Skript prüft die Syntax, die Pflichtfunktionen, die HTML-Struktur (jede verwendete ID, ausgeglichene Tags), alle Nomen in allen Fällen, 30 000 Zufallsaufgaben und spielt die echte App in einem simulierten Browser durch (beide Modi, Ausgleichssystem, Neuladen, Einstellungen, Profile).

## Veröffentlichen

Alle Dateien und Ordner (`index.html`, `manifest.json`, `sw.js`, `core/`, `app/`, `icons/`) in das Repository hochladen. Den Ordner `tools/node_modules` nicht hochladen.

Bei einer neuen Version in `sw.js` den Namen des Zwischenspeichers erhöhen (`artikel-profi-v1` → `v2`).

## Hinweis

Diese App wurde für den privaten Gebrauch entwickelt und wird ohne Gewähr bereitgestellt. Sie dient ausschliesslich zu Lernzwecken. Für allfällige Fehler oder Ungenauigkeiten wird keine Haftung übernommen.

Alle Rechte vorbehalten, siehe [LICENSE](LICENSE).
