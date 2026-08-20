# Count Red — Interaktive Spielanleitung: alle Texte

**Quelle: `anleitung.html` · Stand: Session 26 · gebaut gegen Build v108 / `gembel_rules.js` v2.1**

> Diese Datei ist **erzeugt**, nicht abgeschrieben: ein Skript bedient `anleitung.html`
> im DOM und fängt jeden Text ab, den ein Lernender wirklich zu sehen bekommt.
> Sie kann deshalb nicht von der Auslieferung abweichen.
>
> **Änderungen gehören in `anleitung.html`, nicht hierher.** Diese Datei danach neu erzeugen.

---

## Aufbau

Elf Schritte. Der Lernende ist durchgehend **Spieler 1 mit ungerader Parität** — fest,
weil der Text sonst nicht „du brauchst ungerade" sagen könnte. Schritt 11 sagt ausdrücklich,
dass es im echten Spiel gespiegelt sein kann.

Jeder Schritt hat bis zu vier Textsorten:

| Sorte | wo | wann |
|---|---|---|
| **Erklärtext** | Kasten über dem Brett | beim Betreten des Schritts |
| **Aufgabe** | blaue Zeile darunter | solange die Aufgabe offen ist |
| **Erklärkasten** | unter dem Brett | bei jedem Antippen — mit der ausgerechneten Parität |
| **Nach dem Schritt** | ersetzt den Erklärtext | sobald die Aufgabe erfüllt ist |

Die Zahlen im Erklärkasten stehen hier so, wie sie in der geprüften Lehrpartie wirklich
erscheinen — sie sind keine Beispiele, sondern die tatsächlichen Werte.

---

## Die elf Schritte

### Schritt 1 — Das Ziel

**Erklärtext**

> Gewonnen hat, wer **vier gleichfarbige Figuren in einer Spalte** stehen hat — A, B, C oder D.
>
> In Spalte B stehen schon drei schwarze. Der orange Rahmen heißt: diese drei sind **gesperrt**, dazu gleich mehr. Oben auf 1B ist noch Platz.
>
> Auf 1D steht eine schwarze Figur. **Es gibt keine Zugweite und keine Zugrichtung** — jede Figur darf auf jedes Feld, auch über andere hinweg.

**Aufgabe** — `Tippe 1D an und dann 1B.`

**Erklärkasten**

- *falsches Feld angetippt* — **1C wäre hebbar** — Rote Nachbarn von 1C: **2** · die Figur selbst ist rot: **+1** → 3 = ungerade. In diesem Schritt geht es aber um **1D**.
- *1D angetippt* — **Abheben erlaubt** — Diese Figur darfst du nehmen. **Warum** ausgerechnet diese — das kommt gleich. Jetzt das Zielfeld **1B**.
- *Zug ausgeführt* — **Vier in einer Spalte — gewonnen.** — Und sie darf dorthin. Auch das hat einen Grund; zwei Schritte weiter steht er.

**Nach dem Schritt**

> Vier Schwarze in Spalte B — Partie vorbei.
>
> Die Farbe war dabei egal: **die Figuren gehören keinem Spieler**. Wer die vierte setzt, gewinnt — auch wenn ein anderer die drei darunter gebaut hat.
>
> Bleibt die Frage, warum ausgerechnet _diese_ Figur ziehen durfte. Das ist die eigentliche Regel des Spiels.

### Schritt 2 — Brett und Figuren

**Erklärtext**

> Das ist die Ausgangsstellung: 16 Felder, 16 Figuren, alles voll.
>
> Die Punkte oben in jedem Feld sind sein **Wert**: Zeile 1 zählt 3, Zeile 2 zählt 2, Zeile 3 zählt 1, Zeile 4 zählt 0.
>
> Jede Figur trägt eine Zahl — den Wert des Feldes, auf dem sie zu Beginn steht. Die Zahl bleibt ihr, auch wenn sie sich bewegt.

**Aufgabe** — `Tippe 2C an, um die Figur anzusehen.`

**Erklärkasten**

- *2C angetippt* — **2C** — Figur: **rot** mit der **2**. Das Feld ist **2** Punkte wert — so viele Punkte stehen oben im Feld.

**Nach dem Schritt**

> Rot mit der 2, auf einem Feld, das 2 Punkte wert ist.
>
> Auf die roten Figuren kommt es an — nach ihnen ist das Spiel benannt.

### Schritt 3 — Wer darf ziehen — die Parität

**Erklärtext**

> Das ist die Regel, an der alles hängt. Sie entscheidet nicht, _wohin_ eine Figur darf, sondern **ob du sie überhaupt anfassen darfst**.
>
> Zähle alle **roten** Figuren auf den bis zu acht Nachbarfeldern. Ist die Figur selbst rot, zähle sie mit. Einer der beiden Spieler zieht bei **gerader** Summe, der andere bei **ungerader**.
>
> Du bist in dieser Anleitung der **ungerade** Spieler.

**Aufgabe** — `Tippe 2B an. Das geht schief — sieh dir an, warum.`

**Erklärkasten**

- *2B angetippt* — **Das darfst du nicht heben.** — Rote Nachbarn von 2B: **4** · die Figur selbst ist schwarz: **+0** → 4 = gerade. Du brauchst **ungerade**.

**Nach dem Schritt**

> Vier — gerade. Die gehört dem anderen Spieler, nicht dir.
>
> Genau das ist der Punkt, an dem Neulinge hängenbleiben: die Figur bewegt sich einfach nicht, und ohne die Rechnung sieht das nach einem Fehler aus.

### Schritt 4 — Eine, die dir gehört

**Erklärtext**

> Dieselbe Rechnung, ein anderes Feld. Achte auf die grün umrandeten Nachbarn: das sind die, die zählen.

**Aufgabe** — `Tippe 1B an.`

**Erklärkasten**

- *1B angetippt* — **Das darfst du heben.** — Rote Nachbarn von 1B: **2** · die Figur selbst ist rot: **+1** → 3 = ungerade. Du brauchst **ungerade**.

**Nach dem Schritt**

> Drei — ungerade. Diese Figur darfst du nehmen.
>
> Die Parität wechselt mit jedem Zug am ganzen Brett. Wer eben noch gesperrt war, ist zwei Züge später frei.

### Schritt 5 — Stapeln

**Erklärtext**

> Zu Beginn ist jedes Feld besetzt — es gibt gar kein leeres Ziel. Bleibt nur eines: eine Figur **auf eine andere stellen**.
>
> Beim Stapeln gilt eine andere Zählung: **nur die Figuren im neuen Stapel** zählen, keine Nachbarn. Ein Stapel fasst höchstens zwei Figuren.

**Aufgabe** — `Nimm 1B und stelle sie auf 2B.`

**Erklärkasten**

- *nicht hebbare Figur angetippt* — **4A ist nicht hebbar** — Rote Nachbarn von 4A: **1** · die Figur selbst ist rot: **+1** → 2 = gerade. In diesem Schritt geht es aber um **1B**.
- *1B angetippt* — **Abheben erlaubt** — Rote Nachbarn von 1B: **2** · die Figur selbst ist rot: **+1** → 3 = ungerade. Du brauchst **ungerade**. Jetzt das Zielfeld **2B**.
- *erlaubtes, aber falsches Ziel* — **3A wäre erlaubt** — Beim Stapeln zählen **nur die Figuren im neuen Stapel** — keine Nachbarn. Rote darin: 1 = ungerade. In diesem Schritt geht es aber um **2B**.
- *Zug ausgeführt* — **Gezogen.** — Beim Stapeln zählen **nur die Figuren im neuen Stapel** — keine Nachbarn. Rote darin: 1 = ungerade.

**Nach dem Schritt**

> Rot auf Schwarz: eine rote im Stapel, ungerade — dein Zug.
>
> Der Platz, den du verlassen hast, ist jetzt frei. Von hier an gibt es leere Felder, und damit eine zweite Art zu ziehen.

### Schritt 6 — Der Gegenzug

**Erklärtext**

> Jetzt ist der Gegner dran — der **gerade** Spieler. Sieh dir an, was er tut: er nutzt das Feld, das du freigemacht hast.

**Aufgabe** — `Der Gegner zieht.`

**Erklärkasten**

- *Schritt betreten* — Tippe auf **Weiter** — dann zieht der Gegner.
- *Gegner hebt ab* — **Er hebt 1D** — Rote Nachbarn von 1D: **1** · die Figur selbst ist rot: **+1** → 2 = gerade. Er braucht **gerade**.
- *Gegner legt ab* — **Er stellt auf 1B** — Punktzahl passt (**3** auf ein 3-Punkte-Feld). Rote Nachbarn von 1B _nach_ dem Zug — Quellfeld zählt nicht mit: **3** · die Figur selbst ist rot: **+1** → 4 = gerade. Er braucht **gerade**.

**Nach dem Schritt**

> Zwei Rechnungen, beide gerade — für ihn also erlaubt.
>
> Und eine neue Regel ist dabei sichtbar geworden: auf ein **leeres** Feld darf nur eine Figur, deren **Zahl zur Punktzahl des Feldes passt**. Eine 3 auf ein 3-Punkte-Feld.

### Schritt 7 — Auf ein leeres Feld

**Erklärtext**

> Der Gegner hat 1D geräumt — ein leeres 3-Punkte-Feld. Auf 1C steht eine schwarze 3.
>
> Beim Ablegen auf ein leeres Feld zählst du die roten Nachbarn **des Zielfeldes**, und zwar so, wie es _nach_ dem Zug aussieht: das Feld, von dem du kommst, zählt nicht mit.

**Aufgabe** — `Nimm 1C und stelle sie auf 1D.`

**Erklärkasten**

- *1C angetippt* — **Abheben erlaubt** — Rote Nachbarn von 1C: **3** · die Figur selbst ist schwarz: **+0** → 3 = ungerade. Du brauchst **ungerade**. Jetzt das Zielfeld **1D**.
- *Zug ausgeführt* — **Gezogen.** — Punktzahl passt (**3** auf ein 3-Punkte-Feld). Rote Nachbarn von 1D _nach_ dem Zug — Quellfeld zählt nicht mit: **1** · die Figur selbst ist schwarz: **+0** → 1 = ungerade.

**Nach dem Schritt**

> Beide Rechnungen ungerade — dein Zug.
>
> Du kennst jetzt alles, was ein Zug braucht: **abheben** (Nachbarn zählen) und **ablegen** (Punktzahl plus Nachbarn beim leeren Feld, oder Stapelinhalt beim Stapeln).

### Schritt 8 — Noch ein Gegenzug

**Erklärtext**

> Der Gegner stapelt — diesmal Rot auf Rot.

**Aufgabe** — `Der Gegner zieht.`

**Erklärkasten**

- *Schritt betreten* — Tippe auf **Weiter** — dann zieht der Gegner.
- *Gegner hebt ab* — **Er hebt 3B** — Rote Nachbarn von 3B: **5** · die Figur selbst ist rot: **+1** → 6 = gerade. Er braucht **gerade**.
- *Gegner legt ab* — **Er stellt auf 3D** — Beim Stapeln zählen **nur die Figuren im neuen Stapel** — keine Nachbarn. Rote darin: 2 = gerade. Er braucht **gerade**.

**Nach dem Schritt**

> Zwei rote im Stapel: gerade, seine Parität.
>
> Er hat 3B geräumt. Sieh dir Spalte B an: unten stehen zwei schwarze, darüber ist jetzt eine Lücke.

### Schritt 9 — Die Dreierreihe

**Erklärtext**

> Drei gleichfarbige Figuren **direkt übereinander** in einer Spalte sind eine **Dreierreihe**. Die drei Felder werden gesperrt, und wer sie gebildet hat, bekommt einen **Bonuszug**.
>
> In Spalte B stehen 4B und 2B schwarz. Auf 3C wartet eine schwarze 1 — und 3B ist ein leeres 1-Punkte-Feld.

**Aufgabe** — `Nimm 3C und stelle sie auf 3B.`

**Erklärkasten**

- *3C angetippt* — **Abheben erlaubt** — Rote Nachbarn von 3C: **5** · die Figur selbst ist schwarz: **+0** → 5 = ungerade. Du brauchst **ungerade**. Jetzt das Zielfeld **3B**.
- *Zug ausgeführt* — **Drei in einer Reihe!** — Punktzahl passt (**1** auf ein 1-Punkte-Feld). Rote Nachbarn von 3B _nach_ dem Zug — Quellfeld zählt nicht mit: **5** · die Figur selbst ist schwarz: **+0** → 5 = ungerade. Die drei Felder sind gesperrt — und du hast einen **Bonuszug**.

**Nach dem Schritt**

> 4B, 3B, 2B — drei schwarze übereinander, gesperrt (oranger Rahmen).
>
> Dass die Figuren schwarz sind, heißt nicht, dass sie jemandem gehören. Gebaut hast du sie, also bekommst **du** den Bonuszug.

### Schritt 10 — Der Bonuszug

**Erklärtext**

> Gesperrt heißt **nicht** unbeweglich. Eine einzelne Figur auf einem gesperrten Feld sitzt fest — 4B und 3B kannst du nicht mehr anrühren.
>
> Auf 2B steht aber **dein Stapel**. Die obere Figur darfst du abheben, gesperrt hin oder her — und beim Abheben von einem Stapel gibt es **keine** Paritätsprüfung.
>
> Die rote 3 obendrauf sucht ein leeres 3-Punkte-Feld. 1C ist frei.

**Aufgabe** — `Nimm 2B und stelle die obere Figur auf 1C.`

**Erklärkasten**

- *gesperrte Einzelfigur angetippt* — **3B ist nicht hebbar** — 3B gehört zu einer gesperrten Dreierreihe. Eine **einzelne** Figur ist dort unbeweglich. In diesem Schritt geht es aber um **2B**.
- *zweite gesperrte Einzelfigur angetippt* — **4B ist nicht hebbar** — 4B gehört zu einer gesperrten Dreierreihe. Eine **einzelne** Figur ist dort unbeweglich. In diesem Schritt geht es aber um **2B**.
- *eigener Stapel angetippt* — **Abheben erlaubt** — Auf 2B steht **dein** Stapel. Die obere Figur darfst du abheben — **ohne** Paritätsprüfung. Jetzt das Zielfeld **1C**.
- *Zug ausgeführt* — **Gezogen.** — Punktzahl passt (**3** auf ein 3-Punkte-Feld). Rote Nachbarn von 1C _nach_ dem Zug — Quellfeld zählt nicht mit: **2** · die Figur selbst ist rot: **+1** → 3 = ungerade.

**Nach dem Schritt**

> Das war dein Bonuszug. Jetzt ist der Gegner wieder dran.
>
> Die Basisfigur ist unter dem Stapel liegen geblieben — die Dreierreihe steht weiter.

### Schritt 11 — Gut zu wissen

**Erklärtext**

> **Passen gibt es nicht.** Wer keinen erlaubten Zug hat, setzt aus — der andere zieht nochmals.
>
> **Wer beginnt, entscheidet der Zufall**, ebenso, wer gerade und wer ungerade spielt. Beide Paritäten sind gleichwertig. In dieser Anleitung warst du ungerade; im Spiel kann es dich genauso gut gerade treffen — dann ist jede Rechnung oben schlicht andersherum.
>
> **Remis** könnt ihr jederzeit vereinbaren. Steht dieselbe Stellung zum dritten Mal auf dem Brett, kannst du Remis _einfordern_ — das darf niemand ablehnen. Beim fünften Mal endet die Partie von selbst, ebenso nach 50 Halbzügen ohne neue Dreierreihe.
>
> **Im Spiel hilft dir dieselbe Rechnung.** Tippe eine Figur an, die sich nicht bewegen lässt: unten steht, wie viele rote gezählt wurden und welche Parität dafür nötig wäre.

**Aufgabe** — `Das war alles. Viel Vergnügen.`


---

## Bedienelemente

| Element | Text |
|---|---|
| Kopfzeile links | `COUNT · RED` |
| Kopfzeile rechts | `Schritt N von 11` |
| Knopf links | `Zurück` |
| Knopf Mitte | `Nochmal` |
| Knopf rechts, normal | `Weiter` |
| Knopf rechts, Gegenzug-Schritt | `Gegner ziehen lassen` |
| Knopf rechts, letzter Schritt | `Zum Spiel` |

## Wiederkehrende Zeilen im Erklärkasten

| Anlass | Text |
|---|---|
| Schritt betreten (Antipp- oder Zugschritt) | `Tippe das genannte Feld an.` |
| Schritt betreten (Gegenzug) | `Tippe auf **Weiter** — dann zieht der Gegner.` |
| Falsches Feld im Antipp-Schritt | `In diesem Schritt geht es um **XY**.` |
| Aufgehobene Figur wieder abgesetzt | `Figur wieder abgesetzt.` |
| Zug ausgeführt, ohne Besonderheit | `Gezogen.` + Begründung |

## Bausteine der Paritätsrechnung

Diese Sätze setzt die Anleitung zur Laufzeit zusammen. Die Zahlen kommen aus der
kanonischen Regelschicht, nicht aus einer eigenen Rechnung.

**Abheben, freie Einzelfigur**

> Rote Nachbarn von *FELD*: **n** · die Figur selbst ist rot: **+1** _(oder: ist schwarz: **+0**)_ → **Summe = gerade/ungerade**.

**Abheben, Stapel**

> Auf *FELD* steht **dein** Stapel. Die obere Figur darfst du abheben — **ohne** Paritätsprüfung.

> Auf *FELD* steht der Stapel des Gegners. Nur wer einen Stapel gebildet hat, darf ihn wieder auflösen.

**Abheben, gesperrtes Feld**

> *FELD* gehört zu einer gesperrten Dreierreihe. Eine **einzelne** Figur ist dort unbeweglich.

**Ablegen auf ein leeres Feld**

> Punktzahl passt (**n** auf ein n-Punkte-Feld). Rote Nachbarn von *FELD* _nach_ dem Zug — Quellfeld zählt nicht mit: **n** · die zurückbleibende Stapelfigur ist rot: **+1** · die Figur selbst ist rot: **+1** → **Summe = gerade/ungerade**.

**Ablegen, Punktzahl passt nicht**

> Die Figur trägt die **n**, das Feld *FELD* ist **m** Punkte wert. Auf ein leeres Feld darf nur, was zur Punktzahl passt.

**Stapeln**

> Beim Stapeln zählen **nur die Figuren im neuen Stapel** — keine Nachbarn. Rote darin: **n = gerade/ungerade**.

> Auf *FELD* steht schon ein Stapel. Mehr als zwei Figuren gehen nicht.

---

## Meldungen, die hoffentlich nie erscheinen

Die Anleitung prüft beim Laden, ob ihre Erklärungen mit der Regelschicht übereinstimmen.
Tun sie das nicht, wird **nicht** gelehrt.

**Selbsttest beim Laden fehlgeschlagen** — Brett und Text werden ausgeblendet:

> **Selbsttest fehlgeschlagen.** Diese Anleitung stimmt nicht mit der Regelschicht überein und wird deshalb nicht angezeigt:
> · *(Liste der Abweichungen)*

**Abweichung während der Bedienung** — die Anleitung hält an:

> **Die Anleitung stoppt hier.** Erklärung und Regelschicht stimmen nicht überein (*Stelle*).
> Das ist ein Fehler in der Anleitung, nicht im Spiel — bitte melden.
> Bis dahin gelten die Regeln aus dem Spiel, nicht diese Seite.

---

## Wo die Anleitung an den Regeltext des Spiels anschließt

Die kanonische Textquelle ist das Regeln-Overlay in `index.html` (dreizehn Blöcke von „Ziel"
bis „Remis"). Die Anleitung erklärt dieselben Regeln, aber in der Reihenfolge, in der sie am
Brett auftauchen, und sie lässt weg, was ein Neuling in den ersten Zügen nicht braucht.

| Block im Regeln-Overlay | in der Anleitung |
|---|---|
| Ziel | Schritt 1 |
| Brett · Figuren | Schritt 2 |
| Spieler & Parität · Wegziehen | Schritte 3–4 |
| Zugrichtung & Zugweite | Schritt 1 (nebenbei) |
| Stapeln | Schritt 5 |
| Abstellen auf leeres Feld | Schritte 6–7 |
| Dreierreihe → Bonuszug | Schritte 9–10 |
| Entstapeln | Schritt 10 (als Bonuszug), Regel im Anhang |
| Zugverzicht · Remis · Spielbeginn · Revanche | Schritt 11 |

Bewusst **nicht** in der Anleitung: die Remis-Uhr im Detail, die Wiederholungsschwellen als
Rechenregel, und alles, was das Spiel selbst anzeigt. Begründung: die fünf Neuling-Partien
vom 2.8. waren nach durchschnittlich sieben eigenen Zügen vorbei — diese Regeln erreicht
ein Anfänger in seiner ersten Partie gar nicht, und die Aufmerksamkeit fehlt dann bei der
Parität.
