# ═══════════════════════════════════════════════════════════════════
# NACHTRAG für HANDOVER_HISTORIE.md — Session 22 (§114 bis §133)
# ═══════════════════════════════════════════════════════════════════
# Diesen Block ans ENDE von HANDOVER_HISTORIE.md anhängen (die Datei ist append-only).
# Die Historie selbst lag mir nicht lesbar vor, deshalb kommt der Nachtrag separat.

## §114 — Eval-Jitter (Hebel 3), HEURISTIC 1.9

Ausgangsfrage: Wertfenster (§109) sitzt an der WURZEL — Max weiß dort, welcher Zug der beste
ist, und spielt trotzdem einen anderen. Der Jitter sitzt am BLATT: Max bewertet Stellungen
falsch und folgt seinem falschen Urteil konsequent. Das ist die Maia-Lehre — ein Mensch irrt
in der EINSCHÄTZUNG, nicht in der Auswahl.

Erste Fassung sah einen über die ganze Partie festen, aus dem Stellungs-Hash abgeleiteten
Jitter vor. **Walters Einwand:** das mache Max berechenbar und eindimensional. Der Einwand
war berechtigt und führte zur besseren Lösung: Alpha-Beta braucht konsistente Blattwerte nur
INNERHALB einer Suche, nicht über die Partie. Also ein frischer Seed je `pickMove`,
`cfg.jitterSeed` friert ihn für Messstand und Suiten ein.

Umsetzung: `_jitterOf(b, player)` im Blattzweig von `negamax` (depth===0), neben der
§91-Uhr-Dämpfung. `evaluate()` bleibt unberührt und zustandslos. Stellungsschlüssel über
`boardHash(b, P1)` mit FESTEM Spieler, Vorzeichen erst danach aus `player` → Antisymmetrie
exakt (geprüft: jitter(b,1)+jitter(b,2)===0 an 24 Stellungen über 4 Seeds). Jitter greift nur
unterhalb 90000 — das Mate-Band bleibt frei, sonst könnte Max einen Vierer übersehen.

Neue Suite `test_jitter_114.js`, trägt den exakten Versions-Pin.

## §116 — meta.best und der Remis-Riegel, Build v94

Anlass: Walters Beobachtung an RF6HLE9F, Max nehme bei einsteiger zu schnell Remis an.

Geprüft über alle 116 Partien: 27 Remis, davon 3 einsteiger-Partien unter 1.8. Alle drei mit
durchgehend negativen Scores UND hohen Rängen (rank≥2 in 6/6, 4/6, 5/6 Zügen). Unter meister
steht rank immer auf 1 — dort tritt das Muster gar nicht auf.

Mechanismus: `aiScoreHistory.push(res.meta.score)` speiste die Remis-Entscheidung mit dem Wert
des GEZOGENEN Zuges. Seit §109 ist das bei Fenster-Stufen nicht mehr der Bestwert der Wurzel.

EHRLICHE EINSCHRÄNKUNG: die gemessene Verzerrung lag bei 20–70 Punkten, nicht bei der vollen
Fensterbreite. In allen drei Fällen war Max auch korrigiert noch hinten und hätte bei
`acceptLeadMax` 80 genauso angenommen. Der Mechanismus ist real, erklärt die beobachteten
Fälle aber nicht allein.

Damit zwei getrennte Fragen: (a) technisch — die Logik liest eine verzerrte Größe; (b) Design
— soll eine schwache Stufe überhaupt annehmen? **Walters Entscheid:** einsteiger nimmt NIE an,
ab fortgeschritten erlaubt.

Umsetzung: neues meta-Feld `best` über die äußere Variable `bestRootValue` (localBest lebt nur
in der Tiefenschleife). Neues Feld `accepts` in `AI_DRAW_POLICY`, Riegel in
`aiWouldAcceptDraw` VOR der Bewertung — `aiDrawAcceptDecision` bleibt eine reine Funktion.

⚠️ Die accepts-Regel hängt am NAMEN der Stufe, das Spielstärke-Paket an der KONFIGURATION.
Beim Umzug wandert nur letzteres mit.

Dazu das VERBRAUCHER-REGISTER der meta-Felder im Kopf von countred_ai_core.js.
`test_remis_85` von 44 auf 57 Prüfungen — erstmals mit Verdrahtungs-Prüfungen.

## §117 / §119 — Jitter und Uhr, gebaut und zurückgenommen

§117 dämpfte den Jitter mit `drawClockFactor`, aus der Sorge, er könne kurz vor der
Remis-Automatik die gegen null geschrumpfte Bewertung dominieren. Ohne Beleg, dass das eintritt.

Die Messung zeigte das Gegenteil (gleicher Seed 20260727, nur der Kern verschieden):
ungedämpft 3 Siege : 24 bei 5 Remis, gedämpft 8 : 9 bei 15 Remis. Die Dämpfung hatte den Hebel
praktisch abgeschaltet.

§119 nimmt sie zurück. Die MESSUNG steht als Begründung an der Fundstelle im Kern, dazu ein
Wiedereinbau-Schutz in der Suite. Der Schutz, auf den es ankommt, bleibt: bei `clockLeft <= 0`
gibt der Knoten hart 0 zurück, ungejittert.

Die Invariante aus §117 bleibt: eine Stufe mit `jitterAmp` darf kein Remis ANNEHMEN, weil auch
`best` aus verjitterten Blättern stammt.

## §118 — Messstand: drei Zahlen statt einer

Jitter ±160 ergab 56,3 % — scheinbar stärker als der ungestörte Gegner. Auflösung: 16 von 32
Partien remis, und jedes Remis zählt einen halben Punkt.

`selfplay_118.js` weist seither Punktquote, Siegquote über die ENTSCHIEDENEN Partien und
Remisanteil getrennt aus, dazu die gepaarte Auswertung je Eröffnung. Ab 40 % Remisanteil warnt
der Lauf ausdrücklich davor, die Punktquote als Stärkemaß zu lesen.

## §120 — exact richtiggestellt

`exact` stand auf `!useRootAlpha` und war dadurch in ALLEN 375 geloggten Zügen false — seit
§109 hat jede Stufe entweder ein Fenster oder rankPool 1. Das Flag war strukturell tot.

Richtig ist: bei gesetztem Fenster wird die Wurzel-Alpha um `poolSlack` GESENKT, jeder Zug
innerhalb des Fensters bekommt damit einen exakten Wert. Neue Regel: `(!useRootAlpha) || _poolOn`.
Empirisch bestätigt an 38 Live-Zügen mit rank ≥ 2: null Verstöße gegen die Fenstergrenze.

## §121 — Neuling-Absenkung, HEURISTIC 2.0

Erstmals lagen Daten eines echten Anfängers vor: fünf Partien, 0:5, nach durchschnittlich
SIEBEN eigenen Zügen vorbei, eine nach einem einzigen. Er verpasste weder Sofortsiege noch
Dreier — er kam gar nicht erst in solche Stellungen. Dieselbe Stufe stand gegen Walter bei 7:6:3.

Konsequenz: keine Feinjustierung um Prozente, sondern alle Hebel gleichzeitig. einsteiger auf
maxDepth 2, poolWindow 250/60, jitterAmp 80.

Walters Leitplanke „Fenster höchstens 110" wurde dabei aufgehoben — sie hatte genau einen Grund
(ein breiteres Fenster macht den Dreier überstimmbar), und `forceTriple` deckt den seit §111 ab.
`test_stufen_109` prüft jetzt die BEDINGUNG statt der Zahl.

⚠️ VERSION 2.0 STATT 1.10 — zwingend, weil `parseFloat('1.10')` 1.1 ergibt.

## §122 — Stufen gerückt, HEURISTIC 2.1

einsteiger(alt) → fortgeschritten · fortgeschritten(alt) → stark · die §121-Stufe wird die neue
einsteiger. `stark` bleibt geparkt und unsichtbar.

Dazu die STUFENLEITER-TABELLE über `SKILL_LEVELS` — auf Walters Wunsch gegen den
Überblicksverlust. Je Stufe Tiefe, Fenster, Jitter, forceTriple, gemessene Quote mit Datum,
sichtbar ja/nein, plus der Warnhinweis, dass die Prozente nur eine der zwei Achsen sind.

Die Invariante „genau EINE Stufe trägt das Paket" wurde zu „mindestens eine, aber NICHT meister
und stark". Die Tiefen- und Fensterprüfungen hängen jetzt an der ORDNUNG der Leiter statt an
festen Zahlen — das übersteht das nächste Rücken.

## §123 — Fehlerrate, HEURISTIC 2.2

Walters Befund: einsteiger spielt immer noch zu gut, er müsse sich konzentrieren, um nicht zu
verlieren. Frage: ist die Stufe richtig verdrahtet?

Verdrahtung geprüft und in Ordnung (depth 2, zehn verschiedene Züge in zehn Aufrufen). Der Grund
liegt tiefer: ALLE bisherigen Hebel wirken auf die POSITIONELLE Bewertung. Drei taktische Regeln
laufen daran vorbei — an 200 Zufallsstellungen ist die Zugwahl in rund 26 % der Fälle taktisch
vorbestimmt.

Ein erster Vorschlag (blockRate senken) wurde VOR dem Bauen gemessen und verworfen: an 60
Stellungen mit vermeidbaren Verlustzügen wählte die Stufe in NULL von 240 Läufen einen davon —
auch bei blockRate 0,0 und bei Tiefe 1. Das Sicherheitsnetz ist redundant zur Suche.

Gebaut wurde stattdessen `randomRate`: mit dieser Wahrscheinlichkeit spielt Max einen BELIEBIGEN
Zug. Drei Ausnahmen halten Walters Design-Auflage: Sofortsieg-Pfad liegt VOR dem Schalter,
`forceTriple` schränkt `_base` vorher ein (gewürfelt wird unter den Dreiern), Mate-Band
ausgeschlossen. `meta.safety` meldet `'random'`.

EIGENFEHLER: der Würfel fiel zuerst je Tiefen-Iteration statt je Zug — effektive Rate 51 % statt
30 %. Aufgefallen beim Nachmessen.

Neue Suite `test_random_123.js`, trägt den exakten Pin. Walter nach dem Livespiel: „fühlt sich
sehr gut an."

## §124 bis §133 — Testrelease-Vorbereitung

- **§124** Build v100: anonyme Zufallskennung `playerKey`. Anlass: die Partien mehrerer
  Testspieler wären sonst nicht auseinanderzuhalten. 12 Zeichen aus `getRandomValues`, kein
  userAgent, keine Gerätekennung. PLAYER_KEY steht weit oben, sonst ReferenceError.
- **§125** Build v101: mobiles Layout, Remis-Bedenkzeit 2000–3000 ms, `minThinkMs` überall 1000.
- **§126** Build v102: **GA4 entfernt** — die Seite setzt keine Cookies und braucht keine
  Einwilligung. Rechtliche Fußzeile mit zwei Overlays.
- **§127/§128** Builds v103/v104: die Fußzeile war doppelt kaputt (inline-onclick auf
  Modul-interne Funktionen; unsichtbare Schriftgröße), dann öffneten die Links auf dem Laptop
  nicht (Stacking-Context durch `backdrop-filter`).
- **§129**: Firebase-Regeln von „alles offen" auf ein tragfähiges Modell. Blaze eingerichtet.
- **§130/§131**: Replay-Generalüberholung, drei Fehlversuche, `sigcheck.js` als Werkzeug daraus.
  Zwei Modi, `best`, `safety: 'random'`, `skillInfo`.
- **§132** Build v105: Wartungsflag repariert und diagnostizierbar.
- **§133** Build v106: Impressum ausgefüllt. Domain `countred.com` live.

## Infrastruktur-Meilensteine dieser Session

- Das Spiel läuft unter **https://countred.com** (Apex-Domain, HTTPS).
- Die Startdatei heißt **`index.html`**, nicht mehr `countred.html`.
- **Firebase-Regeln scharf**: die 7698 Kiki-Altpartien sind nicht mehr öffentlich löschbar.
- **Blaze** aktiv mit Warn-Mail ab 5 €.
- Das Cloud Data Processing Addendum ist automatisch Bestandteil der Vereinbarung — kein
  separater Abschluss nötig (eine frühere gegenteilige Aussage wurde korrigiert).
