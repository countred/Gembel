# Gembel — Digitales Strategiespiel

## Was ist das hier?

Dieser Ordner enthält das vollständige digitale Gembel-Spiel als drei
eigenständige HTML-Dateien. Kein Server, keine Installation, keine
Abhängigkeiten — einfach im Browser öffnen.

---

## Die drei Dateien

| Datei | Zweck | Öffnen mit |
|---|---|---|
| `gembel_final.html` | Spiel für Mobilgeräte (iPhone/Android) | Browser auf dem Handy |
| `gembel_laptop.html` | Spiel für Desktop/Laptop | Chrome, Safari, Firefox |
| `gembel_anleitung.html` | Vollständige Spielanleitung | Beliebiger Browser |

Alle drei Dateien funktionieren offline und online, lokal und auf einem Server.

---

## Schnellstart lokal

1. Datei `gembel_laptop.html` doppelklicken → öffnet sich im Browser
2. Overlay: wer beginnt auswählen (Spieler 1 oder Spieler 2)
3. Spielen

Für Mobilgeräte: siehe Abschnitt "Online veröffentlichen" weiter unten.

---

## Spielregeln (Kurzfassung)

**Brett:** 4×4 Felder, bezeichnet 1–4 (Zeilen, oben nach unten)
und A–D (Spalten, links nach rechts).
Felder haben Markierungen: Zeile 1 = ••• (3 Punkte), Zeile 4 = kein Punkt.

**Figuren:** Schwarz (S) und Weiß (W), mit Streifenzahl 0–3.
Label in der App: W3 = weiße Figur Stripe 3, S2 = schwarze Figur Stripe 2.
Beide Spieler ziehen alle Figuren — schwarz und weiß gehören keinem Spieler.

**Spielziel:** Vier gleichfarbige Figuren in einer zusammenhängenden
Reihe (waagrecht oder senkrecht). Alle vier müssen direkt auf dem
Spielfeld stehen (nicht als obere Figur eines Stapels).

**Zugregel:** Weiße Figuren auf allen 8 angrenzenden Feldern zählen
(orthogonal + diagonal). Ist die Zugfigur selbst weiß, zählt sie mit.
- Spieler 1 (ungerade): zieht wenn Summe ungerade (1, 3, 5…)
- Spieler 2 (gerade): zieht wenn Summe gerade (0, 2, 4…)
Beim Abstellen gilt dieselbe Regel am Zielfeld.

**Stapelregel:** Beim Stapeln/Entstapeln keine Nachbarprüfung —
nur Figuren im Stapel zählen. S1 stapelt verschiedenfarbig, S2 gleichfarbig.
Max. 2 Figuren. Nur der Bildner darf entstapeln.
Beim Abstellen nach Entstapeln gilt wieder die normale Paritätsregel.

**Dreierreihe:** Wer die 3. gleichfarbige Figur in eine zusammenhängende
Reihe zieht, erhält einen Bonuszug. Die Felder werden gesperrt (oranger Rahmen).

**Zugverzicht:** Nicht erlaubt. Hat ein Spieler keine Zugmöglichkeit,
zieht der andere nochmals. Gilt auch für den Bonuszug.

Vollständige Spielanleitung: `gembel_anleitung.html` öffnen.

---

## Bedienung der App

| Farbe | Bedeutung |
|---|---|
| Hellgrün | Figur kann vom aktuellen Spieler wegbewegt werden |
| Dunkelgrün | Gültiges Zielfeld (nach Auswahl einer Figur) |
| Blau | Ausgewählte Figur |
| Oranger Rahmen | Feld ist Teil einer gesperrten Dreierreihe |
| Gold | Gewinnfelder (Vierreihe) |

**Buttons:**
- 💡 Hinweise — Zugmarkierungen ein/ausschalten (wird gespeichert)
- ↩ Zurück — letzten Zug rückgängig (unbegrenzt)
- ↺ Neu — neues Spiel, Auswahl wer beginnt

**Tipp:** Auf eine nicht-ziehbare Figur tippen zeigt warum der Zug
nicht möglich ist (Paritätsanzeige unten).

---

## Online veröffentlichen (GitHub Pages)

Voraussetzung: GitHub-Account (kostenlos auf github.com).

Kurzfassung:
1. Neues Repository anlegen (Name z.B. "gembel")
2. Alle 3 HTML-Dateien + README.md hochladen
3. Settings → Pages → Branch: main → Save
4. Spiel ist erreichbar unter: https://DEINNAME.github.io/gembel/gembel_final.html

Schritt-für-Schritt-Anleitung: siehe `gembel_anleitung.html` → Abschnitt "App-Bedienung"
oder das beiliegende Entwicklungsgespräch-PDF.

---

## Projektstand & Entwicklungshistorie

Entwickelt mit Claude (Anthropic) im April 2026.
Vollständiges Entwicklungsgespräch: `gembel_gespraech_komplett.pdf`
Quellcode als Text: `gembel_code.pdf`

**Implementierte Features:**
- Vollständige Gembel-Spiellogik (Parität, Stapeln, Dreier-/Vierreihe)
- W/S-Label in Figuren für eindeutige Identifikation
- Zughinweise (hellgrün/dunkelgrün, persistent)
- Dreierreihe: Erkennung + Sperrung + Bonuszug
- Vierreihe: Gewinnfelder golden markiert
- Undo (unbegrenzt)
- Startspieler-Auswahl
- Zugverzicht-Logik (inkl. Bonuszug-Fallback)
- Mobile: Safe Areas, Touch, Vollbild, Dark Mode, PWA-ready
- Laptop: Feste Boardgröße, hover-Effekte

**Bekannte offene Punkte:**
- Kein Netzwerk-Multiplayer (aktuell: lokales Zwei-Spieler-Spiel)
- Keine KI-Gegner
- Keine Spieler-Accounts / Rangliste

---

## Weiterentwicklung

Nächste sinnvolle Schritte für Online-Multiplayer:
1. Node.js + Socket.io Backend (Echtzeit-Züge)
2. Spielraum-System (2 Spieler per Link verbinden)
3. Zugvalidierung server-seitig (Cheating-Schutz)
4. Deployment auf Hetzner/DigitalOcean (ca. 5 EUR/Monat)

Die gesamte Spiellogik (canLift, canDrop, checkThreeInRow etc.) ist bereits
sauber in Funktionen gekapselt und kann direkt als Node.js-Modul verwendet werden.

---

*Gembel Digital Edition — Prototyp · April 2026*
