# Count Red

Ein Strategiespiel für zwei auf einem 4×4-Brett. Spielbar im Browser, ohne
Installation und ohne Anmeldung:

**→ [countred.com](https://countred.com)**

Das Spiel stammt von Walter Rehm (1998) und lag zuerst als Brettspiel vor. Dieses
Repository enthält die digitale Fassung.

> **Testversion.** Das Spiel ist offen zugänglich, aber noch nicht fertig. Regeln,
> Spielstärken und Oberfläche können sich ändern.

---

## Was es kann

- **Gegen den Rechner** in drei Spielstärken: Einsteiger, Fortgeschritten, Meister
- **Zu zweit über einen Code** — ein Spieler erstellt einen Raum, der andere tritt
  mit der Spielnummer bei
- **Interaktive Spielanleitung** — führt Schritt für Schritt durch die Regeln, mit
  Brett zum Mitspielen
- Läuft auf Telefon und Rechner, ohne App und ohne Konto

Die Regeln stehen in der Anleitung im Spiel, nicht hier — es soll nur **eine**
Regelquelle geben.

---

## Stand

| | |
|---|---|
| Build | v112 |
| Spiel-Engine | `countred-ai-2.2` |
| Anleitung | Fassung 24 |

---

## Was hier liegt

**Ausgeliefert** — das ist die Seite:

| Datei | |
|---|---|
| `index.html` | Startseite, Brett, Oberfläche, Mehrspielermodus |
| `gembel_rules.js` | Regelschicht — einzige Quelle für Zug-, Stapel- und Siegregeln |
| `countred_ai_core.js` | Suche und Bewertung des Rechnergegners |
| `countred_ai_worker.js` | führt die Suche im Hintergrund aus |
| `anleitung.html` | interaktive Spielanleitung |
| `CNAME`, `.nojekyll` | Domain und Pages-Konfiguration |

**Werkzeug und Prüfung** — nicht Teil der Seite:

| Datei | |
|---|---|
| `test_*.js` (12) | Prüfsuiten, laufen mit `node` |
| `texte.js` | erzeugt `ANLEITUNG_TEXTE.md` aus `anleitung.html` |
| `layout.js`, `bau_vorschau.js` | Hilfsskripte zur Anleitung |
| `ANLEITUNG_TEXTE.md` | alle Texte der Anleitung, **erzeugt** — Änderungen gehören in `anleitung.html` |

Entwicklungsunterlagen, Messreihen, Altstände und Datenexporte liegen bewusst
**nicht** hier, sondern beim Entwickler.

---

## Prüfsuiten

```bash
npm install jsdom          # nur für test_anleitung_137.js
node test_ui_97.js         # einzelne Suite
for f in test_*.js; do node "$f"; done
```

Jede Suite prüft zusätzlich, dass alle Ladepfade denselben Build tragen — ein
Versionssprung ohne passenden Cache-Parameter fällt sofort auf.

---

## Rückmeldungen

Fehler, Ungereimtheiten und Eindrücke aus dem Spiel sind willkommen:
über das Impressum auf [countred.com](https://countred.com).

---

*Count Red · digitale Fassung · Testbetrieb 2026*
