# Count Red — Interaktive Spielanleitung: alle Texte

**Quelle: `anleitung.html` · Anleitung · Fassung 19 · 25.08.2026**

> Diese Datei ist **erzeugt**, nicht abgeschrieben: ein Skript bedient `anleitung.html`
> im DOM und fängt jeden Text ab, den ein Lernender wirklich zu sehen bekommt — samt
> der Markierungen, die dabei auf dem Brett stehen.
>
> **Änderungen gehören in `anleitung.html`, nicht hierher.** Danach `node texte.js` laufen lassen.

---

## Aufbau

Neun Schritte. Ein eigener Zug ist in **drei Teilschritte** zerlegt — anheben, absetzen,
ausführen. Der Lernende ist durchgehend **Spieler 1 mit ungerader Parität**;
Schritt 9 sagt ausdrücklich, dass es im Spiel gespiegelt sein kann.

Der Mitspieler zieht nur zweimal: am Ende von Schritt 5, damit ein leeres Feld entsteht,
und am Ende von Schritt 8, wo er den unklugen Bonuszug bestraft. Beide Male läuft
sein Zug **langsamer** ab — und auf **einen** Weiter-Druck, nicht in Teilschritten.

Im Kasten über dem Brett stehen bis zu drei Textsorten:

| Sorte | wozu |
|---|---|
| **Erklärung** | führt den Schritt oder die Aktion ein |
| **Rechnung** | grün abgesetzt: was gezählt wird und was herauskommt |
| **Aufgabe** | blau: was jetzt zu tun ist |

Die Markierungen auf dem Brett sind mit aufgeführt:

| Markierung | Bedeutung |
|---|---|
| dünner grüner Rahmen | der Bereich, in dem gerechnet wird |
| **dick** | auf diesem Feld stehen (oder landen) zählende rote Figuren |
| **blinkt** | hier handeln — grün, wenn das Feld selbst zählende rote trägt, sonst blau |
| **blau** | hier ist gehandelt worden |
| **gesperrt** | Basis-Figur eines Dreiers (oranger Rahmen) |
| **Sieg** | die vier Felder der Siegspalte |

In den Schritten 1 und 2 sowie bei den Zügen des Mitspielers fehlen die grünen
Markierungen bewusst: dort wird noch nichts gerechnet.

---

## Die Teilschritte


### Schritt 1 von 9 — Spielziel

**·  anheben**

> Gewonnen hat, wer die **vierte gleichfarbige Figur in eine Spalte** ziehen kann — A, B, C oder D.

*Aufgabe:*  `Tippe 1D an.`

*Brett:*  blinkt: 1D (blau) · gesperrt: 2B, 3B, 4B

**·  absetzen**

*Aufgabe:*  `Jetzt 1B antippen.`

*Brett:*  blinkt: 1B (blau) · blau: 1D · gesperrt: 2B, 3B, 4B

**·  ausgeführt**

> Vier schwarze Figuren in Spalte B. Du hast gewonnen.

*Brett:*  Sieg: 1B, 2B, 3B, 4B


### Schritt 2 von 9 — Spielbeginn

**·  anheben**

> Die Punktezahl oben auf einem Feld (3, 2, 1 oder 0 Punkte) und die Zahl auf der Figur (3, 2, 1 oder 0) auf diesem Feld müssen übereinstimmen. Beispiel: Die vier Figuren mit einer **2** können nur auf den leeren Feldern 2A, 2B, 2C oder 2D abgesetzt werden.

*Aufgabe:*  `Tippe 1B an.`

*Brett:*  blinkt: 1B (blau)

**·  absetzen**

*Aufgabe:*  `Jetzt 4D antippen.`

*Brett:*  blinkt: 4D (blau) · blau: 1B

**·  ausgeführt**

> Du hast einen Stapel auf 4D gebildet.

**·  lesen**

> Grundsätzliches, bevor du die Zugerlaubnis kennenlernst: Du darfst jede Figur bewegen, rote **und** schwarze. Du darfst überall hinziehen. Es gibt keine vorgeschriebene Richtung. Es gibt keine Beschränkung der Zugweite. Du kannst Stapel bilden und wieder auflösen. Nur Zweierstapel, ein Top auf einer Basis. Beim Top spielen auch die Punkte und die Zahl auf der Figur keine Rolle.


### Schritt 3 von 9 — Zugerlaubnis

**·  antippen**

> Wer welche Figur ziehen darf, du oder dein Mitspieler, entscheidet allein die Parität: Du darfst eine Figur **anheben**, wenn die Summe aller **roten** Nachbarfiguren **ungerade** ist. Ist die Zugfigur selbst auch rot, musst du sie mitzählen.

*Aufgabe:*  `Tippe 1B an.`

*Brett:*  dick: 1B, 2A, 2C · blinkt: 1B (grün)

**·  erklärt**

> Wer welche Figur ziehen darf, du oder dein Mitspieler, entscheidet allein die Parität: Du darfst eine Figur **anheben**, wenn die Summe aller **roten** Nachbarfiguren **ungerade** ist. Ist die Zugfigur selbst auch rot, musst du sie mitzählen.

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren und der Zugfigur: 3 = ungerade

*Brett:*  dick: 1B, 2A, 2C · blau: 1B

**·  antippen**

*Aufgabe:*  `Tippe 3A an.`

*Brett:*  dick: 2A, 3B, 4A · blinkt: 3A (blau)

**·  erklärt**

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren: 3 = ungerade

*Brett:*  dick: 2A, 3B, 4A · blau: 3A

**·  antippen**

*Aufgabe:*  `Tippe 3C an.`

*Brett:*  dick: 2C, 3B, 3D, 4C · blinkt: 3C (blau)

**·  erklärt**

*Rechnung:*  Du darfst **nicht** anheben. Summe der roten Nachbarfiguren: 4 = gerade

*Brett:*  dick: 2C, 3B, 3D, 4C

**·  antippen**

*Aufgabe:*  `Tippe 1D an.`

*Brett:*  dick: 1D, 2C · blinkt: 1D (grün)

**·  erklärt**

*Rechnung:*  Du darfst **nicht** anheben. Summe der roten Nachbarfiguren und der Zugfigur: 2 = gerade

*Brett:*  dick: 1D, 2C

**·  lesen**

> Die Zugerlaubnis musst du genauso auch beim Absetzen der Figur beachten: Du darfst die Figur **absetzen**, wenn die Summe aller **roten** Nachbarfiguren **nach** dem Absetzen **ungerade** ist. Ist die Zugfigur selbst auch rot, musst du sie mitzählen.
>
> Noch sind aber alle Felder belegt, also lernst du zuvor die Zugerlaubnis beim Stapel kennen …


### Schritt 4 von 9 — Stapel bilden

**·  anheben**

> Beim Stapeln zählst du keine Nachbarfiguren, sondern nur die roten Figuren im Stapel. Du darfst eine Figur auf eine andere setzen, wenn danach die Summe der **roten** Figuren im Stapel **ungerade** ist. In deinem Fall ist das 1 rote Figur. Die Parität des Mitspielers ist gerade, also sind es bei ihm 0 oder 2 rote Figuren.

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren und der Zugfigur: 3 = ungerade

*Aufgabe:*  `Tippe 1B an.`

*Brett:*  dick: 1B, 2A, 2C · blinkt: 1B (grün)

**·  absetzen**

*Rechnung:*  Du darfst stapeln. Summe der roten Figuren im Stapel: 1 = ungerade

*Aufgabe:*  `Jetzt 4D antippen.`

*Brett:*  dick: 4D · blinkt: 4D (grün) · blau: 1B

**·  ausgeführt**

*Rechnung:*  Du darfst stapeln. Summe der roten Figuren im Stapel: 1 = ungerade

**·  anheben**

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren: 3 = ungerade

*Aufgabe:*  `Tippe 3A an.`

*Brett:*  dick: 2A, 3B, 4A · blinkt: 3A (blau)

**·  absetzen**

*Rechnung:*  Du darfst stapeln. Summe der roten Figuren im Stapel: 1 = ungerade

*Aufgabe:*  `Jetzt 3D antippen.`

*Brett:*  dick: 3D · blinkt: 3D (grün) · blau: 3A

**·  ausgeführt**

*Rechnung:*  Du darfst stapeln. Summe der roten Figuren im Stapel: 1 = ungerade

**·  anheben**

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren und der Zugfigur: 3 = ungerade

*Aufgabe:*  `Tippe 1B an.`

*Brett:*  dick: 1B, 2A, 2C · blinkt: 1B (grün)

**·  abgelehnt**

*Aufgabe:*  `Jetzt 4C antippen.`

*Brett:*  dick: 4C · blinkt: 4C (grün) · blau: 1B

**·  erklärt**

*Rechnung:*  Du darfst **nicht** stapeln. Summe der roten Figuren im Stapel: 2 = gerade

*Brett:*  dick: 4C

**·  anheben**

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren: 3 = ungerade

*Aufgabe:*  `Tippe 3A an.`

*Brett:*  dick: 2A, 3B, 4A · blinkt: 3A (blau)

**·  abgelehnt**

*Aufgabe:*  `Jetzt 3C antippen.`

*Brett:*  blinkt: 3C (blau) · blau: 3A

**·  erklärt**

*Rechnung:*  Du darfst **nicht** stapeln. Summe der roten Figuren im Stapel: 0 = gerade


### Schritt 5 von 9 — Stapel auflösen

**·  antippen**

> Die Zugerlaubnis musst du genauso auch beim Anheben der Figur von einem Stapel beachten: Du darfst die Top-Figur anheben, wenn die Summe der **roten** Figuren im Stapel **ungerade** ist. In deinem Fall ist das 1 rote Figur. Die Parität des Mitspielers ist gerade, also sind es bei ihm 0 oder 2 rote Figuren.

*Aufgabe:*  `Tippe 4D an.`

*Brett:*  dick: 4D · blinkt: 4D (grün)

**·  erklärt**

> Die Zugerlaubnis musst du genauso auch beim Anheben der Figur von einem Stapel beachten: Du darfst die Top-Figur anheben, wenn die Summe der **roten** Figuren im Stapel **ungerade** ist. In deinem Fall ist das 1 rote Figur. Die Parität des Mitspielers ist gerade, also sind es bei ihm 0 oder 2 rote Figuren.

*Rechnung:*  Du darfst anheben. Summe der roten Figuren im Stapel: 1 = ungerade

*Brett:*  dick: 4D · blau: 4D

**·  zeigen**

> Leichter zu merken: Nur wer den Stapel gebildet hat, kann ihn wieder auflösen.

*Rechnung:*  Du darfst anheben. Summe der roten Figuren im Stapel: 1 = ungerade

*Brett:*  dick: 4D · blau: 4D

**·  zeigen**

> Wichtig: nur die Top-Figur darf bewegt werden, nicht der Stapel als ganzes.
>
> Strategie: mit jedem Zug einer roten Figur ändert sich die Parität vieler Felder. Da, wo die Figur weggezogen wird, und auch dort, wo sie abgesetzt wird. Nur im Stapel ist eine Figur also vor dem Zugriff deines Mitspielers sicher.

*Rechnung:*  Du darfst anheben. Summe der roten Figuren im Stapel: 1 = ungerade

*Brett:*  dick: 4D · blau: 4D

**·  lesen**

> Für das nächste Beispiel macht dein Mitspieler auch seinen ersten Zug. Mit Weiter zieht der Mitspieler von 1D auf 2C:

**·  ausgeführt**

> Für das nächste Beispiel macht dein Mitspieler auch seinen ersten Zug. Mit Weiter zieht der Mitspieler von 1D auf 2C:


### Schritt 6 von 9 — Figur auf ein leeres Feld

**·  anheben**

> Du darfst eine Figur auf ein leeres Feld **absetzen**, wenn die Summe aller **roten** Nachbarfiguren **nach** dem Absetzen **ungerade** ist. Ist die Zugfigur selbst auch rot, musst du sie mitzählen. Nicht vergessen: Punktezahl auf dem Feld und Zahl auf der Figur müssen übereinstimmen.

*Rechnung:*  Du darfst anheben. Summe der roten Figuren im Stapel: 1 = ungerade

*Aufgabe:*  `Tippe 4D an.`

*Brett:*  dick: 4D · blinkt: 4D (grün)

**·  abgelehnt**

*Aufgabe:*  `Jetzt 1B antippen.`

*Brett:*  dick: 1B, 2A, 2C · blinkt: 1B (grün) · blau: 4D

**·  erklärt**

*Rechnung:*  Du darfst **nicht** absetzen. Zahl auf der Figur und Punkte auf dem Feld (**3**) stimmen überein, aber: Summe der roten Nachbarfiguren und der Zugfigur: 4 = gerade

*Brett:*  dick: 1B, 2A, 2C

**·  anheben**

> Neuer Versuch.

*Rechnung:*  Du darfst anheben. Summe der roten Figuren im Stapel: 1 = ungerade

*Aufgabe:*  `Tippe 4D an.`

*Brett:*  dick: 4D · blinkt: 4D (grün)

**·  absetzen**

*Rechnung:*  Du darfst absetzen. Zahl auf der Figur und Punkte auf dem Feld (**3**) stimmen überein. Summe der roten Nachbarfiguren und der Zugfigur: 3 = ungerade

*Aufgabe:*  `Jetzt 1D antippen.`

*Brett:*  dick: 1D, 2C · blinkt: 1D (grün) · blau: 4D

**·  ausgeführt**

> Jetzt kennst du alle Zugvarianten: Figur vom Feld anheben, auf einem Feld absetzen, auf eine Figur absetzen, von einer Figur anheben.


### Schritt 7 von 9 — Drei in einer Spalte

**·  anheben**

> Erinnerst du dich an das Ziel: die vierte gleichfarbige Figur in einer Spalte? Es gibt noch ein Zwischenziel davor: die **dritte** gleichfarbige Figur in eine Spalte ziehen. Für den Dreier — und ebenso für den Vierer — zählt bei einem Stapel nur die untere Figur, nicht die darauf gestapelte.

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren: 5 = ungerade

*Aufgabe:*  `Tippe 3C an.`

*Brett:*  dick: 2B, 2C, 3D, 4C · blinkt: 3C (blau)

**·  absetzen**

*Rechnung:*  Du darfst absetzen. Zahl auf der Figur und Punkte auf dem Feld (**1**) stimmen überein. Summe der roten Nachbarfiguren: 5 = ungerade

*Aufgabe:*  `Jetzt 3B antippen.`

*Brett:*  dick: 2A, 2B, 2C, 4A, 4C · blinkt: 3B (blau) · blau: 3C

**·  ausgeführt**

> Du hast einen **Dreier** gebaut: 4B, 3B, 2B — drei schwarze übereinander.

*Brett:*  gesperrt: 2B, 3B, 4B

**·  lesen**

> Jetzt gelten mehrere Besonderheiten. Die wichtigste: **Du bekommst einen Bonuszug.** Ist kein Bonuszug möglich, zieht der Mitspieler.
>
> Die drei unteren Figuren bleiben für den Rest des Spieles gesperrt. Stapeln darauf bleibt erlaubt, und die obere Figur darfst du auch wieder herunternehmen. Für die Parität zählen auch die gesperrten Figuren weiterhin mit.

*Brett:*  gesperrt: 2B, 3B, 4B


### Schritt 8 von 9 — Bonuszug und Taktik

**·  lesen**

> Ein Dreier ist meistens gut, vor allem wegen dem Bonuszug.
>
> Den Dreier kann aber auch dein Mitspieler zum Vierer vervollständigen und gewinnen.
>
> Lote mit zwei Varianten deines Bonuszuges diese strategischen Möglichkeiten aus.

*Brett:*  gesperrt: 2B, 3B, 4B

**·  anheben**

> Ein **guter** Bonuszug:

*Rechnung:*  Du darfst anheben. Summe der roten Nachbarfiguren und der Zugfigur: 3 = ungerade

*Aufgabe:*  `Tippe 2A an.`

*Brett:*  dick: 1B, 2A, 2B · blinkt: 2A (grün) · gesperrt: 2B, 3B, 4B

**·  absetzen**

*Rechnung:*  Du darfst stapeln. Summe der roten Figuren im Stapel: 1 = ungerade

*Aufgabe:*  `Jetzt 1A antippen.`

*Brett:*  dick: 1A · blinkt: 1A (grün) · blau: 2A · gesperrt: 2B, 3B, 4B

**·  ausgeführt**

*Rechnung:*  Du darfst stapeln. Summe der roten Figuren im Stapel: 1 = ungerade

*Brett:*  gesperrt: 2B, 3B, 4B

**·  zeigen**

> Zwischen den zwei schwarzen Figuren in Spalte A wird das Feld 2A frei. Für die passende dritte schwarze Figur und damit den nächsten möglichen Dreier ist die Parität: Summe der roten Nachbarfiguren: **3 = ungerade**.

*Brett:*  dick: 1A, 1B, 2B · gesperrt: 2B, 3B, 4B

**·  zeigen**

> Die passende Figur mit Zahl auf der Figur und Punkte auf dem Feld (2) steht auf 2D und hat gerade ebenfalls deine Parität: Summe der roten Nachbarfiguren: **3 = ungerade**. Die andere passende Figur ist bereits im Dreier gesperrt.
>
> Mit diesem Bonuszug hast du dir die perfekte Ausgangslage für deinen nächsten Dreier geschaffen und setzt deinen Mitspieler unter Druck.

*Brett:*  dick: 2C, 3D · gesperrt: 2B, 3B, 4B

**·  anheben**

> Ein **nicht so schlauer** Bonuszug — der Spielstand ist wieder wie vor der ersten Variante:

*Rechnung:*  Du darfst anheben. Summe der roten Figuren im Stapel: 1 = ungerade

*Aufgabe:*  `Tippe 2B an.`

*Brett:*  dick: 2B · blinkt: 2B (grün) · gesperrt: 2B, 3B, 4B

**·  absetzen**

*Rechnung:*  Du darfst absetzen. Zahl auf der Figur und Punkte auf dem Feld (**3**) stimmen überein. Summe der roten Nachbarfiguren und der Zugfigur: 3 = ungerade

*Aufgabe:*  `Jetzt 1C antippen.`

*Brett:*  dick: 1B, 1C, 2C · blinkt: 1C (grün) · blau: 2B · gesperrt: 2B, 3B, 4B

**·  ausgeführt**

> Dein Bonuszug ist korrekt, aber du schenkst dem Mitspieler damit direkt den Sieg. Drei Dinge musst du beachten:

*Brett:*  gesperrt: 2B, 3B, 4B

**·  zeigen**

> **Erstens:** Die Lücke in Zeile 3 zwischen den drei gleichfarbigen Figuren in Spalte C ermöglicht den Sieg, obwohl zuvor kein Dreier in dieser Spalte bestand.

*Brett:*  gesperrt: 2B, 3B, 4B

**·  zeigen**

> **Zweitens:** Die für das Sieg-Feld 3C passenden roten Figuren werden beide von deinem Mitspieler in dem von ihm gebildeten Stapel auf 3D kontrolliert: Summe der roten Figuren im Stapel: **2 = gerade**. Zahl auf der Figur und Punkte auf dem Feld (1) stimmen überein für das Sieg-Feld 3C.

*Brett:*  dick: 3D · gesperrt: 2B, 3B, 4B

**·  zeigen**

> **Drittens:** Dein Mitspieler kann die Sieg-Figur direkt auf 3C absetzen: Summe der roten Nachbarfiguren und der Zugfigur: **4 = gerade**.
>
> Mit Weiter zieht dein Mitspieler und gewinnt.

*Brett:*  dick: 2C, 3C, 3D, 4C · gesperrt: 2B, 3B, 4B

**·  ausgeführt**

> **Drittens:** Dein Mitspieler kann die Sieg-Figur direkt auf 3C absetzen: Summe der roten Nachbarfiguren und der Zugfigur: **4 = gerade**.
>
> Mit Weiter zieht dein Mitspieler und gewinnt.
>
> Vier rote Figuren in Spalte C — dein Mitspieler hat gewonnen.

*Brett:*  gesperrt: 2B, 3B, 4B · Sieg: 1C, 2C, 3C, 4C


### Schritt 9 von 9 — Gut zu wissen

**·  lesen**

> Passen gibt es nicht.

**·  lesen**

> Wer keinen erlaubten Zug hat, setzt aus — der andere zieht nochmals.

**·  lesen**

> Wer beginnt, entscheidet beim ersten Spiel der Zufall, ebenso, wer gerade und wer ungerade spielt. Beim Nochmal beginnt der Verlierer, nach einem Remis wechselt der Anziehende — und die Parität wechselt nach jedem Spiel.

**·  lesen**

> Remis könnt ihr jederzeit vereinbaren. Steht dieselbe Stellung zum dritten Mal auf dem Brett, kannst du Remis einfordern, wenn du am Zug bist. Beim fünften Mal endet die Partie automatisch mit Remis, ebenso nach 50 Zügen ohne neuen Dreier.

**·  lesen**

> Im Spiel kannst du nicht falsch ziehen. Tippst du eine Figur an, die du gerade nicht anheben oder nirgends absetzen kannst, dann siehst du unten, warum der Zug nicht erlaubt ist.

---

## Bedienelemente

| Element | Text |
|---|---|
| Kopfzeile links | `COUNT · RED` |
| Kopfzeile rechts | `Schritt N von 9` |
| unter dem Fortschrittsbalken | `Anleitung · Fassung 19 · 25.08.2026` |
| Knopf links | `Zurück` — einen Teilschritt zurück |
| Knopf rechts | `Weiter` — einen Teilschritt vor; im letzten Schritt `Zum Spiel` |

Im Schritt des Lernenden ist **Weiter gesperrt**, bis er getippt hat. Beim Mitspieler
treibt **Weiter** die Teilschritte.

## Wenn etwas schiefgeht

Der Lernende sieht in **jedem** Ausfall genau einen Satz — fehlende Regelschicht,
fehlgeschlagener Selbsttest, Abweichung zur Regelschicht, gar nicht gestarteter
Programmteil, alles dasselbe:

> **Die Anleitung konnte nicht starten.**

Sichtbar bleiben daneben nur der Fassungsstempel und der Ausgang ins Spiel.
Was wirklich los war, steht in der Konsole.

