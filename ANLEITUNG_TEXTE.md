# Count Red — Interaktive Spielanleitung: alle Texte

**Quelle: `anleitung.html` · Anleitung · Fassung 10 · 21.08.2026**

> Diese Datei ist **erzeugt**, nicht abgeschrieben: ein Skript bedient `anleitung.html`
> im DOM und fängt jeden Text ab, den ein Lernender wirklich zu sehen bekommt — samt
> der Markierungen, die dabei auf dem Brett stehen.
>
> **Änderungen gehören in `anleitung.html`, nicht hierher.** Danach `node texte.js` laufen lassen.

---

## Aufbau

Elf Schritte. Jeder Zug ist in **drei Teilschritte** zerlegt — abheben, ablegen, ausführen —
und wird einzeln dargestellt, auch beim Mitspieler. Der Lernende ist durchgehend
**Spieler 1 mit ungerader Parität**; Schritt 11 sagt ausdrücklich, dass es im Spiel
gespiegelt sein kann.

Im Kasten über dem Brett stehen bis zu drei Textsorten:

| Sorte | wozu |
|---|---|
| **Erklärung** | führt den Schritt ein |
| **Rechnung** | grün abgesetzt: was gezählt wird und was herauskommt |
| **Aufgabe** | blau: was jetzt zu tun ist |

Die Markierungen auf dem Brett sind mit aufgeführt:

| Markierung | Bedeutung |
|---|---|
| dünner grüner Rahmen | der Bereich, in dem gerechnet wird |
| **dick** | auf diesem Feld stehen (oder landen) zählende rote Figuren |
| **blinkt** | hier handeln — grün, wenn das Feld selbst zählende rote trägt, sonst blau |
| **blau** | hier ist gehandelt worden |

---

## Die Teilschritte


### Schritt 1 von 11 — Das Ziel

**·  abheben**

> Gewonnen hat, wer **vier gleichfarbige Figuren in einer Spalte** stehen hat — A, B, C oder D.
>
> In Spalte B stehen schon drei schwarze. Der orange Rahmen heißt: diese drei sind **gesperrt**, dazu gleich mehr. Oben auf 1B ist noch Platz.
>
> Auf 1D steht eine schwarze Figur. **Es gibt keine Zugweite und keine Zugrichtung** — jede Figur darf auf jedes Feld, auch über andere hinweg.

*Rechnung:*  Der grüne Bereich und die dicken Rahmen zeigen schon, worauf es ankommt. **Warum** ausgerechnet diese Figur ziehen darf, kommt in zwei Schritten.

*Aufgabe:*  `Tippe **1D** an.`

*Brett:*  dick: 1C, 2C, 2D · blinkt: 1D (blau)

**·  ablegen**

*Rechnung:*  Auch hier: grün ist, was zählt. Die Rechnung dazu gleich.

*Aufgabe:*  `Jetzt **1B** antippen.`

*Brett:*  dick: 1A, 1C, 2C · blinkt: 1B (blau) · blau: 1D

**·  ausgeführt**

> Vier Schwarze in Spalte B — Partie vorbei.
>
> Die Farbe war dabei egal: **die Figuren gehören keinem Spieler**. Wer die vierte setzt, gewinnt — auch wenn ein anderer die drei darunter gebaut hat.
>
> Bleibt die Frage, warum ausgerechnet _diese_ Figur ziehen durfte. Das ist die eigentliche Regel des Spiels.


### Schritt 2 von 11 — Brett und Figuren

**·  Aufgabe**

> Das ist die Ausgangsstellung: 16 Felder, 16 Figuren, alles voll.
>
> Die Punkte oben in jedem Feld sind sein **Wert**: Zeile 1 zählt 3, Zeile 2 zählt 2, Zeile 3 zählt 1, Zeile 4 zählt 0.
>
> Jede Figur trägt eine Zahl — den Wert des Feldes, auf dem sie zu Beginn steht. Die Zahl bleibt ihr, auch wenn sie sich bewegt.

*Aufgabe:*  `Tippe 2C an, um die Figur anzusehen.`

**·  angesehen**

> Rot mit der 2, auf einem Feld, das 2 Punkte wert ist.
>
> Auf die roten Figuren kommt es an — nach ihnen ist das Spiel benannt.

*Rechnung:*  2C: Figur **rot** mit der **2**, auf einem Feld, das **2** Punkte wert ist.

*Brett:*  blau: 2C


### Schritt 3 von 11 — Wer darf ziehen — die Parität

**·  Aufgabe**

> Das ist die Regel, an der alles hängt. Sie entscheidet nicht, _wohin_ eine Figur darf, sondern **ob du sie überhaupt anfassen darfst**.
>
> Zähle die **roten** Figuren auf den Nachbarfeldern; ist die Figur selbst rot, zähle sie mit. Einer der beiden Spieler zieht bei **gerader** Summe, der andere bei **ungerader**. Du bist der **ungerade**.

*Aufgabe:*  `Tippe 2B an. Das geht schief — sieh dir an, warum.`

*Brett:*  dick: 1B, 2A, 2C, 3B · blinkt: 2B (blau)

**·  angetippt**

> Vier — gerade. Die gehört dem anderen, nicht dir.
>
> Genau hier bleiben Neulinge hängen: die Figur bewegt sich einfach nicht, und ohne die Rechnung sieht das nach einem Fehler aus.

*Rechnung:*  Der grüne Bereich zeigt, worauf es jetzt ankommt: **2B und seine Nachbarn**; alles außerhalb spielt gerade keine Rolle. Dick umrandet sind die Felder mit roten Figuren — dort stehen zusammen **4**; die Figur selbst ist schwarz: **+0** → 4 = gerade. Du brauchst **ungerade**.

*Brett:*  dick: 1B, 2A, 2C, 3B


### Schritt 4 von 11 — Eine, die dir gehört

**·  Aufgabe**

> Dieselbe Rechnung, ein anderes Feld.
>
> Der dünne grüne Rahmen zeigt den Bereich, der zählt. Die dick umrandeten Felder darin sind die, auf die es ankommt — dort stehen rote Figuren.

*Aufgabe:*  `Tippe 1B an.`

*Brett:*  dick: 1B, 2A, 2C · blinkt: 1B (grün)

**·  angetippt**

> Drei — ungerade. Diese Figur darfst du nehmen.
>
> Die Parität wechselt mit jedem Zug am ganzen Brett. Wer eben noch fest saß, ist zwei Züge später frei.

*Rechnung:*  Der grüne Bereich zeigt, worauf es jetzt ankommt: **1B und seine Nachbarn**; alles außerhalb spielt gerade keine Rolle. Dick umrandet sind die Felder mit roten Figuren — dort stehen zusammen **2**, und die Figur selbst ist rot: **+1** → 3 = ungerade. Du brauchst **ungerade**.

*Brett:*  dick: 1B, 2A, 2C · blau: 1B


### Schritt 5 von 11 — Stapeln

**·  abheben**

> Zu Beginn ist jedes Feld besetzt — es gibt gar kein leeres Ziel. Bleibt nur eines: eine Figur **auf eine andere stellen**.
>
> Beim Stapeln gilt eine andere Zählung. Ein Stapel fasst höchstens zwei Figuren.

*Rechnung:*  Der grüne Bereich zeigt, worauf es jetzt ankommt: **1B und seine Nachbarn**; alles außerhalb spielt gerade keine Rolle. Dick umrandet sind die Felder mit roten Figuren — dort stehen zusammen **2**, und die Figur selbst ist rot: **+1** → 3 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Tippe **1B** an.`

*Brett:*  dick: 1B, 2A, 2C · blinkt: 1B (grün)

**·  ablegen**

*Rechnung:*  Beim Stapeln zählen **nur die beiden Figuren im neuen Stapel** — keine Nachbarn. Deshalb ist nur 2B umrandet; die blasse Figur ist die, die du trägst. Rote darin: 1 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Jetzt **2B** antippen.`

*Brett:*  dick: 2B · blinkt: 2B (grün) · blau: 1B

**·  ausgeführt**

> Rot auf Schwarz: eine rote im Stapel, ungerade — dein Zug.
>
> Der Platz, den du verlassen hast, ist jetzt frei. Von hier an gibt es leere Felder, und damit eine zweite Art zu ziehen.


### Schritt 6 von 11 — Der Mitspieler zieht

**·  abheben**

> Jetzt ist dein Mitspieler dran — der **gerade** Spieler. Er rechnet genauso, nur andersherum.
>
> Geh seinen Zug mit **Weiter** Schritt für Schritt durch.

*Rechnung:*  Der grüne Bereich zeigt, worauf es jetzt ankommt: **1D und seine Nachbarn**; alles außerhalb spielt gerade keine Rolle. Dick umrandet sind die Felder mit roten Figuren — dort stehen zusammen **1**, und die Figur selbst ist rot: **+1** → 2 = gerade. Er braucht **gerade**.

*Aufgabe:*  `Mit **Weiter** hebt er 1D ab.`

*Brett:*  dick: 1D, 2C · blinkt: 1D (grün)

**·  ablegen**

*Rechnung:*  Punktzahl passt (**3** auf ein 3-Punkte-Feld). Der grüne Bereich ist jetzt **1B mit seinen Nachbarn**; das Feld, von dem die Figur kommt, zählt nicht mit. Dick umrandet zusammen **3** rote, und die blasse Figur, die dort landen soll, ist rot: **+1** → 4 = gerade. Er braucht **gerade**.

*Aufgabe:*  `Mit **Weiter** stellt er sie auf 1B.`

*Brett:*  dick: 1B, 2A, 2B, 2C · blinkt: 1B (grün) · blau: 1D

**·  ausgeführt**

> Zwei Rechnungen, beide gerade — für ihn also erlaubt.
>
> Und eine neue Regel ist dabei sichtbar geworden: auf ein **leeres** Feld darf nur eine Figur, deren **Zahl zur Punktzahl des Feldes passt**.


### Schritt 7 von 11 — Auf ein leeres Feld

**·  abheben**

> Dein Mitspieler hat 1D geräumt — ein leeres 3-Punkte-Feld. Auf 1C steht eine schwarze 3.
>
> Beim Ablegen zählst du die roten Nachbarn **des Zielfeldes**, und zwar so, wie es _nach_ dem Zug aussieht.

*Rechnung:*  Der grüne Bereich zeigt, worauf es jetzt ankommt: **1C und seine Nachbarn**; alles außerhalb spielt gerade keine Rolle. Dick umrandet sind die Felder mit roten Figuren — dort stehen zusammen **3**; die Figur selbst ist schwarz: **+0** → 3 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Tippe **1C** an.`

*Brett:*  dick: 1B, 2B, 2C · blinkt: 1C (blau)

**·  ablegen**

*Rechnung:*  Punktzahl passt (**3** auf ein 3-Punkte-Feld). Der grüne Bereich ist jetzt **1D mit seinen Nachbarn**; das Feld, von dem die Figur kommt, zählt nicht mit. Dick umrandet zusammen **1** rote; die blasse Figur, die dort landen soll, ist schwarz: **+0** → 1 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Jetzt **1D** antippen.`

*Brett:*  dick: 2C · blinkt: 1D (blau) · blau: 1C

**·  ausgeführt**

> Beide Rechnungen ungerade — dein Zug.
>
> Du kennst jetzt alles, was ein Zug braucht: **abheben** und **ablegen**, jeweils mit der passenden Zählung.


### Schritt 8 von 11 — Noch ein Zug des Mitspielers

**·  abheben**

> Er stapelt — diesmal Rot auf Rot.

*Rechnung:*  Der grüne Bereich zeigt, worauf es jetzt ankommt: **3B und seine Nachbarn**; alles außerhalb spielt gerade keine Rolle. Dick umrandet sind die Felder mit roten Figuren — dort stehen zusammen **5**, und die Figur selbst ist rot: **+1** → 6 = gerade. Er braucht **gerade**.

*Aufgabe:*  `Mit **Weiter** hebt er 3B ab.`

*Brett:*  dick: 2A, 2B, 2C, 3B, 4A, 4C · blinkt: 3B (grün)

**·  ablegen**

*Rechnung:*  Beim Stapeln zählen **nur die beiden Figuren im neuen Stapel** — keine Nachbarn. Deshalb ist nur 3D umrandet; die blasse Figur ist die, die du trägst. Rote darin: 2 = gerade. Er braucht **gerade**.

*Aufgabe:*  `Mit **Weiter** stellt er sie auf 3D.`

*Brett:*  dick: 3D · blinkt: 3D (grün) · blau: 3B

**·  ausgeführt**

> Zwei rote im Stapel: gerade, seine Parität.
>
> Er hat 3B geräumt. Sieh dir Spalte B an: unten stehen zwei schwarze, darüber ist jetzt eine Lücke.


### Schritt 9 von 11 — Die Dreierreihe

**·  abheben**

> Drei gleichfarbige Figuren **direkt übereinander** in einer Spalte sind eine **Dreierreihe**. Die drei Felder werden gesperrt, und wer sie gebildet hat, bekommt einen **Bonuszug**.
>
> In Spalte B stehen 4B und 2B schwarz — bei einem Stapel zählt dafür die **untere** Figur. Auf 3C wartet eine schwarze 1, und 3B ist ein leeres 1-Punkte-Feld.

*Rechnung:*  Der grüne Bereich zeigt, worauf es jetzt ankommt: **3C und seine Nachbarn**; alles außerhalb spielt gerade keine Rolle. Dick umrandet sind die Felder mit roten Figuren — dort stehen zusammen **5**; die Figur selbst ist schwarz: **+0** → 5 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Tippe **3C** an.`

*Brett:*  dick: 2B, 2C, 3D, 4C · blinkt: 3C (blau)

**·  ablegen**

*Rechnung:*  Punktzahl passt (**1** auf ein 1-Punkte-Feld). Der grüne Bereich ist jetzt **3B mit seinen Nachbarn**; das Feld, von dem die Figur kommt, zählt nicht mit. Dick umrandet zusammen **5** rote; die blasse Figur, die dort landen soll, ist schwarz: **+0** → 5 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Jetzt **3B** antippen.`

*Brett:*  dick: 2A, 2B, 2C, 4A, 4C · blinkt: 3B (blau) · blau: 3C

**·  ausgeführt**

> 4B, 3B, 2B — drei schwarze übereinander, gesperrt (oranger Rahmen).
>
> Dass die Figuren schwarz sind, heißt nicht, dass sie jemandem gehören. Gebaut hast du sie, also bekommst **du** den Bonuszug.


### Schritt 10 von 11 — Der Bonuszug

**·  abheben**

> Gesperrt heißt **nicht** unbeweglich. Eine einzelne Figur auf einem gesperrten Feld sitzt fest — 4B und 3B kannst du nicht mehr anrühren.
>
> Auf 2B steht aber **dein Stapel**. Dieselbe Zählung wie beim Stapeln, nur ohne Nachbarn — und weil sie beim Bauen schon gestimmt hat, stimmt sie auch beim Auseinandernehmen.

*Rechnung:*  Beim Abheben von einem Stapel zählen **nur die Figuren im Stapel** — keine Nachbarn. Deshalb ist nur 2B umrandet. Rote darin: 1 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Tippe **2B** an.`

*Brett:*  dick: 2B · blinkt: 2B (grün)

**·  ablegen**

*Rechnung:*  Punktzahl passt (**3** auf ein 3-Punkte-Feld). Der grüne Bereich ist jetzt **1C mit seinen Nachbarn**; das Feld, von dem die Figur kommt, zählt nicht mit. Dick umrandet zusammen **2** rote, und die blasse Figur, die dort landen soll, ist rot: **+1** → 3 = ungerade. Du brauchst **ungerade**.

*Aufgabe:*  `Jetzt **1C** antippen.`

*Brett:*  dick: 1B, 1C, 2C · blinkt: 1C (grün) · blau: 2B

**·  ausgeführt**

> Das war dein Bonuszug. Jetzt ist dein Mitspieler wieder dran.
>
> Die untere Figur ist liegen geblieben — die Dreierreihe steht weiter.


### Schritt 11 von 11 — Gut zu wissen

**·  Anhang**

> **Passen gibt es nicht.** Wer keinen erlaubten Zug hat, setzt aus — der andere zieht nochmals.
>
> **Wer beginnt, entscheidet der Zufall**, ebenso, wer gerade und wer ungerade spielt. Beide Paritäten sind gleichwertig. Hier warst du ungerade; im Spiel kann es dich genauso gut gerade treffen — dann ist jede Rechnung schlicht andersherum.
>
> **Remis** könnt ihr jederzeit vereinbaren. Steht dieselbe Stellung zum dritten Mal auf dem Brett, kannst du Remis _einfordern_ — das darf niemand ablehnen. Beim fünften Mal endet die Partie von selbst, ebenso nach 50 Halbzügen ohne neue Dreierreihe.
>
> **Im Spiel hilft dir dieselbe Rechnung.** Tippe eine Figur an, die sich nicht bewegen lässt: unten steht, wie viele rote gezählt wurden und welche Parität nötig wäre.

---

## Bedienelemente

| Element | Text |
|---|---|
| Kopfzeile links | `COUNT · RED` |
| Kopfzeile rechts | `Schritt N von 11` |
| unter dem Fortschrittsbalken | `Anleitung · Fassung 10 · 21.08.2026` |
| Knopf links | `Zurück` — einen Teilschritt zurück |
| Knopf rechts | `Weiter` — einen Teilschritt vor; im letzten Schritt `Zum Spiel` |

Im Schritt des Lernenden ist **Weiter gesperrt**, bis er getippt hat. Beim Mitspieler
treibt **Weiter** die Teilschritte.

## Meldungen, die hoffentlich nie erscheinen

> **Die Regelschicht fehlt.** Diese Anleitung braucht **gembel_rules.js** … im **selben Ordner** wie diese Seite.

> **Selbsttest fehlgeschlagen.** Diese Anleitung stimmt nicht mit der Regelschicht überein und wird deshalb nicht angezeigt: …

> **Die Anleitung stoppt hier.** Erklärung und Regelschicht stimmen nicht überein (…). Das ist ein Fehler in der Anleitung, nicht im Spiel.

> **Die Anleitung konnte nicht starten.** / **Die Anleitung ist nicht gestartet.** — vom Wachhund, wenn der Programmteil gar nicht läuft.

