// ═══════════════════════════════════════════════════════════════════
// countred_ai_core.js — Produkt-KI-Kern für CountRed (Mensch vs. KI)
// ═══════════════════════════════════════════════════════════════════
//
// HERKUNFT: evaluate + Achse-B-Terme + negamax transplantiert aus Kiki 3.2a
//   (HANDOVER §40b, Wegentscheidung B). Kikis evaluate ist EXAKT antisymmetrisch
//   (Selbsttest §40c: 3655 Stellungen, max |eval(1)+eval(2)| = 0).
//
// NEU (dieser Kern): Skalierungsschicht nach HANDOVER §37 — Iterative Deepening
//   mit ZEITBUDGET (adaptive Tiefe) statt fester Tiefe. Plus taktisches
//   Sicherheitsnetz (§37f) und flexible Config-Schnittstelle (§37.3).
//
// ARCHITEKTURPRINZIP (§gembel_rules.js): Diese Datei enthält KEINE Regellogik.
//   Alle Regelfunktionen (canLift/canDrop/getLegalMoves/applyMoveOn/applyLockOn/
//   checkFourOn/boardHash/cloneBoard) kommen aus gembel_rules.js (extern, §38b).
//   Die Heuristik darf Regeln NIE abschwächen. Skalierung = Tiefe/Zeit, nie Regeln.
//
// PARITÄT: PARITY_P1 wird pro Spiel extern gesetzt (Parität wechselt je Spiel, §38d).
//   evaluate(b, forPlayer) ist parametrisiert; funktioniert für beide Paritäten.
//
// STATUS: KI-Kern, framework-frei, testbar. NOCH OHNE Firebase/UI/Multiplayer —
//   die kommen bei der Zusammenführung (§38b).
// ═══════════════════════════════════════════════════════════════════

'use strict';

// §61a/§65a-BUGFIX: Diese Konstante fehlte — finalizeMvkiGame() in countred.html referenziert
// sie beim Aufbau des games_countred/-Log-Eintrags. Ohne sie warf jeder Spielende-Pfad einen
// ReferenceError VOR dem await/.catch → still als unhandled rejection verschluckt → KEIN einziges
// MvKI-Ergebnis wurde je geloggt. Muss auch in module.exports (Node-Tests/Analyse).
const HEURISTIC_VERSION = 'countred-ai-1.9';
// §F-VERSIONSHISTORIE: 1.0 → 1.1 (12.7.): §F2 (Wurzel-Alpha-Fenster mit Dreier-Marge statt
// bonus-verfälschter Latte) + §F3 (ID-Sortierung auch bei aktivem Sicherheitsnetz) ändern die
// Zugwahl/Suchreihenfolge bei rankPool 1 bzw. in taktischen Stellungen → Kalibrierdaten aus
// 1.0 und 1.1 nicht mischen (Standing Rule Firebase-Versionierung).
// 1.1 → 1.2 (18.7., §85 Remis-Paket): meta.score NEU — der Suchwert des tatsächlich gewählten
// Zuges (aus KI-Sicht; bei rankPool>1 der Wert des Pool-Zuges, nicht localBest; bei Sofortsieg
// 100000). Grundlage für das Remis-Verhalten in countred.html (aiScoreHistory statt statischer
// evaluate()-Momentaufnahme) und neues Kalibrierfeld 'score' in games_countred_moves/.
// SPIELVERHALTEN IDENTISCH zu 1.1: keine Änderung an Suche, Bewertung oder Zugwahl — 1.1- und
// 1.2-Partien dürfen ausnahmsweise gemischt ausgewertet werden; der Bump macht nur das neue
// Feld versioniert sichtbar (Standing Rule).
// 1.2 → 1.3 (18.7., §87 — Rest des Review-1er-Pakets): ÄNDERT DIE ZUGWAHL — Kalibrierdaten
// aus 1.2 und 1.3 NICHT mischen. Drei Bausteine:
//  1C  Wurzel-Wiederholung: Ein Wurzelzug, dessen Zielstellung bereits in pathSet liegt
//      (reale Partiehistorie + aktuelle Stellung), wird wie in negamax (R31) mit
//      REP_DRAW_SCORE bewertet statt voll durchsucht. Schloss die Blindstelle, dass eine
//      GEWINNENDE KI am Root ahnungslos in die 5. Wiederholung (Zwangsremis, §56/§77) oder
//      die 3. (Einforderungsrecht des Menschen, §60) laufen konnte; eine VERLIERENDE KI
//      findet die Rettungs-Wiederholung jetzt auch am Root.
//  1I  colHasThreat: Eine Spalte mit n>=3, deren Restfeld mit einem STAPEL versiegelt ist,
//      zählt nicht mehr als Drohung (Abgleich mit dem R32-SIEGFELD-VETO in evaluate) —
//      ihre Stapel fließen damit regulär in asingleControl (W_SINGLE) ein.
//  (1H Bewertungs-Cache: GEBAUT, GEMESSEN, VERWORFEN — Sackgasse, s. HANDOVER_ERKENNTNISSE:
//      Blatt-Transpositionsquote nur 12–25 %, Faktor 0.88x/1.01x bei Tiefe 3/4 (Median aus 3,
//      getrennte Prozesse, identische Seed-Stellungen). doubleThreatJS ist nur in Doppel-
//      drohungs-KANDIDATEN-Stellungen teuer; normal dominieren parityCtrl/asingleControl
//      (~11–20 µs/evaluate). Künftige Beschleunigung müsste eine echte Transpositionstabelle
//      für SUCHWERTE mit Bound-Flags sein — größerer, eigener Schritt.)
// 1.3 → 1.4 (18.7., §91 Remis-Uhr — Blindstelle 1 aus dem §90-Katalog): Die Suche kennt jetzt
//      den 50-Halbzug-Zähler. pickMove nimmt optional drawClock={halfmoves,limit}; die Uhr
//      läuft im Suchbaum mit (jeder Halbzug −1, DREIER resettet auf limit), abgelaufene Uhr
//      = harter Remiswert 0 am Knoten, und die Blattbewertung wird in den letzten
//      DRAW_CLOCK_SOFT Halbzügen linear gegen 0 gedämpft (Schach-Praxis 50-Züge-Skalierung).
//      LIVE-BELEG der Blindstelle: LQLVG5CT (meister) stand 25 KI-Züge konstant bei +218…225
//      und lief ins no-progress-Remis. OHNE drawClock-Parameter ist 1.4 zugwahl-identisch zu
//      1.3 (Uhr=∞, Faktor=1) — live wird aber IMMER mit Uhr gespielt → Kalibrierdaten aus
//      1.3 und 1.4 NICHT mischen. evaluate() selbst bleibt unverändert & zustandslos
//      (Kernregel 5); die Dämpfung ist ein symmetrischer Faktor am Blattaufruf → Antisymmetrie
//      unberührt, Selbsttest bleibt scharf.
// 1.4 -> 1.5 (25.7., §96 — Dreier-Marge am INNEREN Knoten): SUCHFEHLER behoben, AENDERT DIE
//      ZUGWAHL -> Kalibrierdaten aus 1.4 und 1.5 NICHT mischen. negamax addierte
//      DREIER_FORM_BONUS nach der Kindsuche (valB = val + 80), suchte das Kind aber gegen das
//      unverschobene Fenster (alpha, beta). Dreier-bildende Kinder gingen dadurch fail-low,
//      und die lockere Fail-Soft-Schranke + 80 wurde im Elternknoten wie ein exakter Wert
//      behandelt. FOLGE: der Suchwert war FENSTERABHAENGIG — dieselbe Stellung lieferte je nach
//      Alpha unterschiedliche Werte, und die Zugwahl konnte auf einen Zug fallen, den die
//      Bewertung bei korrekter Rechnung nicht fuer den besten haelt.
//      BELEG (Referenz = derselbe Kern OHNE Pruning, also wahrer Minimax-Wert):
//        Tiefe 3, 49 reale Stellungen aus 1.4/meister — VORHER 12 Stellungen / 26 Zugwerte
//        abweichend, 1 falsche Zugwahl; NACHHER 0 / 0 / 0.
//        Tiefe 5, 9HEYHDSX i=11 — VORHER 4 von 9 Zugwerten falsch (80 statt 79, 84 statt 78,
//        76 statt 77, 79 statt 73) und falsche Zugwahl (4C->4A statt 1A->4D); NACHHER alle
//        neun Werte exakt, Zugwahl identisch zur Referenz.
//      Die §F2-Marge am ROOT bleibt unveraendert noetig (dort dieselbe Ursache, dort schon in
//      1.1 behoben). KOSTEN 1,00x (Median 65 vs 66 ms bei Tiefe 3). evaluate(), Regelschicht,
//      Antisymmetrie und die §91-Uhr sind UNBERUEHRT.
//      WICHTIG fuer Auswertungen: die in 1.2-1.4 geloggten `score`-Werte koennen ueberhoeht
//      sein (sie reproduzieren die Produktionslogik exakt, aber die war nicht wertneutral).
//      Score-Verlaeufe aus 1.2-1.4 nicht als exakte Suchwerte lesen.
// DAUERSCHUTZ: test_margin_96.js vergleicht die Suche gegen eine pruning-freie Referenz, die
//      zur Testlaufzeit aus DIESER Datei erzeugt wird — ein Rueckfall faellt sofort auf.
// 1.7 → 1.8 (31.7., §111 einsteiger-Paket): ZWEI Aenderungen, BEIDE ausschliesslich an der
//      Stufe `einsteiger`. meister, fortgeschritten und stark sind UNBERUEHRT — nachgewiesen
//      per Bit-Identitaetslauf (42 Stellungen, Zug UND score, 1.7 gegen 1.8, null Abweichungen).
//      (a) maxDepth 3 statt 5 (GRADUELLE Skalierung). Gemessen: Tiefe 4 gegen Tiefe 3 = 83,3 %,
//          eine Ply ist rund 33 Punkte wert — der einzige Hebel mit gemessener Muskelkraft.
//          Nebeneffekt: das 2500-ms-Budget bindet bei Tiefe 3 kaum noch, die bis 1.7
//          UNFREIWILLIGE Tiefenstreuung (live nur 75 % Tiefe 5 statt 97 %) wird dadurch zu
//          einer kontrollierten Groesse.
//      (b) forceTriple (DIREKTE Manipulation — Walter-Auflage: gut dokumentieren, moeglichst
//          die einzige ihrer Art). Siehe den ausfuehrlichen Block an der Fundstelle in pickMove.
//      MISCH-REGEL: einsteiger-Partien aus 1.7 und 1.8 NICHT mischen. meister- und
//      fortgeschritten-Partien sind ueber 1.7/1.8 hinweg poolbar (wie schon 1.6/1.7).
// 1.8 -> 1.9 (1.8., §114 Eval-Jitter, Hebel 3): negamax addiert am BLATT einen aus
//      (Seed, Stellung) abgeleiteten Rauschwert. Greift NUR bei gesetztem cfg.jitterAmp —
//      ohne das Feld rechnet der Kern bit-identisch wie 1.8 (an 42 Stellungen geprueft).
//      Ausfuehrliche Begruendung im Kasten bei _jitterOf. Vorerst traegt KEINE Stufe das
//      Feld: der Mechanismus steht, der Wert wird erst gemessen (Walters Grundsatz — nie
//      unterhalb der real gespielten Tiefe entscheiden, K1).
// v95 -> v96 (1.8.): §119 nimmt §117 zurueck (Jitter NICHT von der Uhr daempfen — gemessen
//      schaedlich, s. Kommentar an der Fundstelle). §120 stellt das `exact`-Flag richtig:
//      bei gesetztem Fenster sind sec/rank belastbar, das Flag meldet das jetzt.
//      Beides ohne Wirkung auf die Zugwahl bei Stufen ohne jitterAmp — KEIN HEURISTIC-Bump.
// v94 -> v95 (1.8., §117): (a) Jitter wird von der §91-Uhr mitgedaempft — vorher haette er
//      kurz vor der Remis-Automatik die Bewertung dominiert; (b) neue Invariante in
//      test_jitter_114: eine Stufe mit jitterAmp darf kein Remis ANNEHMEN, weil auch `best`
//      aus verjitterten Blaettern stammt und die Lageeinschaetzung damit verrauscht ist.
//      Beides ohne Wirkung, solange keine Stufe jitterAmp traegt — KEIN HEURISTIC-Bump.
// v91 -> v92 (31.7., §113): einsteiger minThinkMs 600 -> 1000. KEIN HEURISTIC-Bump —
//      minThinkMs steuert ausschliesslich die Wanduhr vor dem Erscheinen des Zuges und
//      beruehrt die Zugwahl mit keinem Zeichen. HEURISTIC bleibt 'countred-ai-1.8',
//      einsteiger-Partien aus v91 und v92 sind daher POOLBAR. Begruendung s. Kasten
//      ueber der einsteiger-Zeile in SKILL_LEVELS.
// ═══════════════════════════════════════════════════════════════════
// VERBRAUCHER-REGISTER der meta-Felder (§116) — VOR JEDER AENDERUNG LESEN
// ═══════════════════════════════════════════════════════════════════
//   Wer eine dieser Bedeutungen aendert, aendert damit ALLE genannten Leser mit. Genau das
//   ist einmal passiert: §109 hat das Wertfenster eingefuehrt und damit `score` von „Bestwert
//   der Wurzel" zu „Wert des gewaehlten Zuges" gemacht. Die Remis-Logik in countred.html las
//   weiter `score`, hielt Max fuer schlechter als er stand und nahm Remis an, die er nicht
//   haette annehmen muessen (Livebeleg RF6HLE9F). Aufgefallen ist es erst Wochen spaeter, weil
//   test_remis_85 die Entscheidungsfunktion mit SYNTHETISCHEN Werten prueft — die Rechnung war
//   korrekt, nur die Zuleitung falsch.
//
//   FELD       BEDEUTUNG                                  GELESEN VON
//   score      Wert des GEWAEHLTEN Zuges                   Zug-Log (Analyse), Replay
//   best       Wert des BESTEN Zuges (Lagebeurteilung)     aiScoreHistory → Remis-Logik (§116)
//   raw        score ohne DREIER_FORM_BONUS                Zug-Log, H5-Abfrage
//   prevBest   ueberbotener Wert                           Zug-Log
//   sec        zweitbester Wurzelwert                      Zug-Log, Fenster-Pruefungen
//   rank       Rang des gewaehlten Zuges                   Zug-Log, Fenster-Pruefungen
//   depth/ms/budgetHit  Suchaufwand                        Zug-Log, Tiefenauswertung
//   safety     'took-win' | 'blocked' | 'none'             Zug-Log
//
//   ⚠️ §117/§119-VORBEHALT: traegt eine Stufe `jitterAmp`, stammen score UND best aus VERJITTERTEN
//   Blaettern. `best` ist dann zwar weiterhin der beste Zug DIESER Suche, aber keine saubere
//   Lagebeurteilung mehr. Eine solche Stufe darf deshalb kein Remis annehmen (Invariante in
//   test_jitter_114) — oder braeuchte eine zweite, ungejitterte Bewertung.
//
//   PRUEFFRAGE bei jedem Eingriff: „Welche bisher gueltige Gleichung wird dadurch ungueltig?"
//   Vor §109 galt score === best. Heute gilt das nur noch fuer Stufen ohne Fenster.
// ═══════════════════════════════════════════════════════════════════
// §65f-BUGFIX: countred_ai_core.js ist ein KLASSISCHES Script, der Hauptcode in countred.html
// ein MODUL. Ein top-level `const` eines klassischen Scripts landet im globalen LEXIKALISCHEN
// Environment — auf das ein Modul NICHT zugreift (Module lesen undeklarierte Namen von globalThis).
// Deshalb war HEURISTIC_VERSION im Modul-Block unsichtbar (Versions-Log zeigte "UNDEFINED", und
// finalizeMvkiGame hätte weiterhin geworfen). Fix wie bei PARITY_P1: explizit auf globalThis legen.
if(typeof globalThis!=='undefined'){ globalThis.HEURISTIC_VERSION = HEURISTIC_VERSION; }

// ── §37.3 Config-Schnittstelle (alle Hebel als Parameter → Um-Entscheidung = Config-Wechsel) ──
// §37d-ORIGINALBUDGETS (11.7. wiederhergestellt, §61a/§65a). Zuvor liefen versehentlich noch die
// §44-Notlösungswerte (radikal gesenkt für UI-Thread-Testbarkeit) — der Web Worker (§49) macht
// die vollen Budgets wieder möglich, aber SKILL_LEVELS war nie zurückgesetzt worden. "Meister"
// lief dadurch mit ~12 % Budget und einer Tiefe weniger; jede darauf gebaute Kalibrierung wäre
// wertlos gewesen.
// ⚠️ RISIKO-VERMERK (Walter-Entscheid 11.7., minDepth 2 statt 1): minDepth 2 garantiert Tiefe 2
// OHNE Zeitschranke (Intra-Tiefen-Abbruch greift erst bei depth>minDepth, §61e-8). Auf Altgeräten
// kann das zusammen mit findImmediateWin+movesAllowingOpponentWin den Haupt-Thread-Timeout reißen
// → aiWorkerBroken-Kaskade (§61e-4). Beim Kalibrieren/Testen auf schwachen Geräten beobachten;
// ggf. harte Wanduhr-Obergrenze auch für minDepth-Tiefen nachrüsten (§61e-8-Fix).
// §109 STUFEN (1.7): Die Absenkung kommt aus dem WERTFENSTER — nicht mehr aus rankPool und
// ausdrücklich nicht aus der Suchtiefe. Deshalb haben ALLE Stufen dasselbe Zeitbudget: sonst
// erreichte eine schwache Stufe in der Eröffnung weniger Tiefe als meister, und die Absenkung
// käme dort teils aus verlorener Tiefe statt aus dem Fenster — genau der §92-Störfaktor, den
// die Kalibrierung nicht kennt. 2500 ms ist der Mittelweg: die Eröffnung ist für alle gleich
// gekappt, die Wartezeit gegenüber den früheren 5000 ms halbiert.
//   poolWindow — wie weit hinter dem besten Zug ein Zug noch in Frage kommt (harte Grenze).
//                Leitplanke: höchstens ~110, denn 80 ist ein ganzer Dreier-Bonus. Breiter wäre
//                nicht mehr „vertretbar anders", sondern ein sichtbarer Patzer.
//   poolTemp   — wie oft die schlechteren gewählt werden. ACHTUNG, nicht monoton: 0 bedeutet
//                GLEICHVERTEILUNG im Fenster (schwächste Einstellung), kleine Werte sind fast
//                greedy, große nähern sich wieder der Gleichverteilung.
// GEMESSEN (feste Tiefe 5, je 32 Partien gegen meister, gepaart über acht Eröffnungen):
//   einsteiger 26,6 % · fortgeschritten 40,6 % · meister 50 % (Referenz).
//   Faustregel: rund 50 Fensterpunkte entsprechen 9 Ergebnispunkten.
// rankPool steht überall auf 1: durch das Fenster ist der alte Top-k-Pool wirkungslos, und ein
// wirkungsloser Parameter führt beim nächsten Mal jemanden in die Irre.
const SKILL_LEVELS = {
  // ┌─ EINSTEIGER-PAKET — bitte als EINHEIT behandeln ─────────────────────────────────┐
  // │ Diese Stufe traegt vier Abweichungen, die AUFEINANDER aufbauen. Wer eine davon   │
  // │ aendert, entfernt oder auf eine andere Stufe kopiert, muss die anderen mitdenken.│
  // │ Die Pruefungen in test_dreier_111.js halten das fest — auch fuer den Fall, dass  │
  // │ diese Konfiguration eines Tages unter einem ANDEREN Stufennamen laeuft.          │
  // │                                                                                  │
  // │ 1. poolWindow 110 / poolTemp 30 (§109) — die eigentliche Absenkung.              │
  // │ 2. forceTriple (§111) — FOLGT AUS 1: das Fenster ist mit 110 breiter als der      │
  // │    DREIER_FORM_BONUS von 80, ein Dreier waere sonst per Konstruktion              │
  // │    ueberstimmbar. Grund ist Wirkung, nicht Staerke (Walter: ein liegengelassener  │
  // │    Dreier wirkt gegenueber einem Einsteiger befremdlich). Bei fortgeschritten mit │
  // │    Fenster 30 tritt der Fall kaum auf — deshalb steht das Flag NUR hier.          │
  // │ 3. maxDepth 3 (§111) — graduelle Absenkung. Gemessen 7,8 % gegen meister.         │
  // │ 4. minThinkMs 1000 (§113) — FOLGT AUS 3: bei Tiefe 3 ist die Suche im Median in   │
  // │    80 ms fertig (bei Tiefe 5 waren es 1570 ms). minThinkMs traegt seither die     │
  // │    SICHTBARE Zuganimation: die Wartezeit fliesst in countred.html als Phase A in  │
  // │    animateAIMove, also in das blaue Aufheben. Mit den alten 600 ms zog Max        │
  // │    „fast zu schnell" (Walter) und die Animation ging unter. Die Stufen mit        │
  // │    Tiefe 5 brauchen das nicht — dort dauert die Suche selbst lang genug.          │
  // │                                                                                  │
  // │ WENN DIESE STUFE UMZIEHT (z. B. einsteiger -> fortgeschritten): alle vier Werte   │
  // │ wandern GEMEINSAM mit. Ein neuer, schwaecherer einsteiger braucht dann eigene     │
  // │ Werte — nicht die hier stehenden teilen.                                         │
  // └──────────────────────────────────────────────────────────────────────────────────┘
  einsteiger:      { timeBudgetMs: 2500, maxDepth: 3, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 1000, poolWindow: 110, poolTemp: 30, forceTriple: true },
  fortgeschritten: { timeBudgetMs: 2500, maxDepth: 5, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 700, poolWindow:  30, poolTemp: 10 },
  // stark: NICHT ENTFERNEN. Die Stufe wird nirgends angeboten (countred.html ruft nur einsteiger,
  // fortgeschritten und meister) und ist bewusst unsichtbar — sie muss aber in der Konfiguration
  // bleiben: Altpartien tragen skillLevel:"stark" im _meta-Kopf und im Meta-Eintrag und müssen im
  // Replay und in jeder Auswertung ladbar bleiben; AI_DRAW_POLICY führt denselben Schlüssel
  // (test_remis_85 prüft auf vier Zeilen). Unkalibriert, kein Fenster.
  stark:           { timeBudgetMs: 2500, maxDepth: 5, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 800 },
  meister:         { timeBudgetMs: 2500, maxDepth: 5, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 900 },
};

// Zeitquelle: performance.now im Browser, Date.now sonst. Injizierbar für Tests.
const _now = (typeof performance !== 'undefined' && performance.now)
  ? () => performance.now()
  : () => Date.now();

// ── §37f Taktisches Sicherheitsnetz (harte Schicht, tiefenunabhängig, ~0 ms, 1-Ply) ──
// Läuft VOR der Budget-Suche. Regelschicht bleibt strikt.
// (a) eigener 1-Zug-Sieg → immer nehmen. (b) Gegner-1-Zug-Sieg → aus Pool ausschließen
//     (mit Wahrscheinlichkeit blockRate; Einsteiger darf gelegentlich verpassen).
function findImmediateWin(b, player, p1parity){
  for(const m of getLegalMoves(b, player, p1parity)){
    const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
    if(checkFourOn(nb)) return m;
  }
  return null;
}
function movesAllowingOpponentWin(b, player, p1parity){
  // Menge der eigenen Züge, nach denen der Gegner sofort gewinnen kann.
  const opp = player === P1 ? P2 : P1;
  const bad = new Set();
  for(const m of getLegalMoves(b, player, p1parity)){
    const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
    if(checkFourOn(nb)) continue; // das ist ein eigener Sieg, nicht schlecht
    const triple = applyLockOn(nb);
    // §61b-1/§65b: BONUSZUG-AUSNAHME. Bildet dieser Zug einen Dreier, zieht PLAYER laut Regel
    // nochmal — der Gegner ist gar nicht dran. Vorher stand hier toter Code
    // (`checkFourOn(nb) ? null : null`), sodass dreier-bildende Züge fälschlich auf Gegner-
    // Sofortsieg geprüft und bei blockRate 1.0 deterministisch gefiltert wurden — das Dreier-
    // Tempo (Kernmechanismus) wurde systematisch sabotiert (§48e-Sorge, Referenz Q84Y).
    // Korrektur: existiert nach dem Dreier ein Bonuszug, prüfen wir NICHT den Gegner-Sofortsieg
    // für diesen Zug (der Spieler kann mit dem Bonuszug reagieren/gewinnen). Nur wenn KEIN
    // Bonuszug existiert (Dreier ohne Folgemove), gilt der reguläre Check.
    if(triple){
      const bonusMoves = getLegalMoves(nb, player, p1parity);
      if(bonusMoves.length > 0) continue; // Bonuszug existiert → dieser Zug ist nicht "bad"
    }
    if(findImmediateWin(nb, opp, p1parity)) bad.add(m.fr+','+m.fc+','+m.tr+','+m.tc);
  }
  return bad;
}

// ── §37 Iterative Deepening mit Zeitbudget ──
// Rechnet Tiefe für Tiefe (1,2,3…) bis Budget erreicht oder maxDepth; behält den
// besten Zug der letzten VOLLSTÄNDIG abgeschlossenen Tiefe. minDepth wird notfalls
// über das Budget hinaus garantiert. Gibt {move, meta} zurück (§37.3, §37h-Logging).
function pickMove(board, player, p1parity, config, seenPositions, drawClock){
  const cfg = (typeof config === 'string') ? SKILL_LEVELS[config] : config;
  if(!cfg) throw new Error('pickMove: unbekannte Config/Stufe');
  // §114: Jitter-Zustand fuer DIESEN Zug setzen. Frischer Seed je Aufruf (s. Kasten bei
  // _jitterOf); cfg.jitterSeed friert ihn fuer Messstand/Suiten ein. Ohne cfg.jitterAmp
  // ist der Jitter aus und der Kern rechnet bit-identisch wie vor §114.
  _jitterAmp  = (typeof cfg.jitterAmp === 'number' && cfg.jitterAmp > 0) ? cfg.jitterAmp : 0;
  _jitterSeed = (typeof cfg.jitterSeed === 'number')
    ? (cfg.jitterSeed >>> 0)
    : ((Math.random() * 4294967296) >>> 0);
  // §91 Remis-Uhr: drawClock={halfmoves,limit} optional — fehlt er (Tests, Alt-Aufrufer), ist
  // die Uhr ∞ und 1.4 verhält sich exakt wie 1.3. clockLimit ist der Reset-Wert nach Dreier.
  const clockLimit = (drawClock && typeof drawClock.limit==='number') ? drawClock.limit : Infinity;
  const clock0 = (drawClock && typeof drawClock.halfmoves==='number' && clockLimit!==Infinity)
    ? Math.max(0, clockLimit - drawClock.halfmoves) : Infinity;
  // §61b-3/§F4: PARITY_P1-Doppelquelle absichern. pickMove nimmt p1parity als PARAMETER
  // (→ getLegalMoves/findImmediateWin), aber negamax()/evaluate() lesen die GLOBALE PARITY_P1.
  // Weichen beide ab, entsteht eine STILLE Schere: Wurzel-Legalität unter Parität A,
  // Blattbewertung unter Parität B — keine Exception, nur falsche Züge. Fail-fast:
  // fehlt die Globale, wird sie aus dem Parameter gesetzt (Node-Tests werden dadurch
  // selbsttragend); widerspricht sie ihm, ist das ein Aufruffehler → sofort werfen.
  if(typeof globalThis!=='undefined'){
    if(typeof globalThis.PARITY_P1==='undefined') globalThis.PARITY_P1 = p1parity;
    else if(globalThis.PARITY_P1!==p1parity)
      throw new Error('pickMove: p1parity-Parameter ('+p1parity+') != globale PARITY_P1 ('+globalThis.PARITY_P1+')');
  }
  const t0 = _now();
  let legal = getLegalMoves(board, player, p1parity);
  if(legal.length === 0) return { move: null, meta: { reason: 'no-moves' } };

  // ── §37f (a): eigener Sofortsieg → immer nehmen ──
  const win = findImmediateWin(board, player, p1parity);
  if(win) return { move: win, meta: { safety: 'took-win', depth: 0, ms: _now()-t0, score: 100000,
    best: 100000, // §116: bei Sofortsieg sind score und best per Definition gleich
    raw: 100000, prevBest: null, sec: null, rank: 1, nRoot: null, nSkip: null, exact: null } }; // §85: Sofortsieg = Mate-Wert

  // ── §37f (b): Gegner-Sofortsieg-Züge markieren (Ausschluss je blockRate) ──
  const badMoves = movesAllowingOpponentWin(board, player, p1parity);
  const blockActive = Math.random() < cfg.blockRate; // Einsteiger: gelegentlich AUS
  const isBad = (m) => badMoves.has(m.fr+','+m.fc+','+m.tr+','+m.tc);

  // pathSet für Wiederholungserkennung: reale Partiehistorie (seenPositions) einspeisen
  const pathSet = new Set();
  if(seenPositions) for(const h of seenPositions) pathSet.add(h);
  pathSet.add(boardHash(board, player));

  // ── Iterative Deepening ──
  let obs = null;   // §99: Beobachtungsdaten der letzten vollstaendigen Tiefe (s.u.)
  let bestMove = legal[0], bestScore = null, reachedDepth = 0, budgetHit = false; // §85: bestScore = Suchwert des GEWAEHLTEN Zuges (letzte vollstaendige Tiefe)
  // §116: bestRootValue = Suchwert des BESTEN Wurzelzuges derselben Tiefe. localBest lebt nur
  // INNERHALB der Tiefenschleife, deshalb hier aussen mitgefuehrt. Beide werden am selben Ort
  // gesetzt, damit score und best garantiert aus derselben abgeschlossenen Iteration stammen.
  let bestRootValue = null;
  const opp = player === P1 ? P2 : P1;

  for(let depth = 1; depth <= cfg.maxDepth; depth++){
    let localBest = -Infinity, localMove = null;
    const scored = [];
    const skipped = []; // §F3: vom Sicherheitsnetz gefilterte Züge — für die ID-Sortierung merken
    let aborted = false;
    // §61e-5/§65e: Wurzel-Alpha nur bei rankPool===1 (stark/meister). Bei rankPool>1 brauchen
    // wir ECHTE Scores für ALLE Züge (Pool-Auswahl), da darf Alpha nicht kürzen → dann volles
    // Fenster.
    // §F2 (Korrektur zu §65e): Die Pruning-Latte ist localBest — aber localBest kann den
    // POST-HOC addierten DREIER_FORM_BONUS enthalten, den die Suche selbst nie liefert.
    // Deshalb: (a) Fenster für dreier-bildende Kandidaten um die Bonus-Marge absenken, sonst
    // fallen Züge ins Fail-Low, die mit ihrem eigenen +Bonus konkurrenzfähig wären;
    // (b) scored-Werte von Fail-Low-Zügen sind nur Schranken (Fail-Soft) — für die Zugwahl
    // unerheblich (sie können localBest beweisbar nicht schlagen), für die ID-Sortierung
    // eine tolerierte Unschärfe.
    // Soundness: Nicht-Dreier-Kandidat exakt für v > localBest (Fenster localBest,+∞);
    // Dreier-Kandidat exakt für raw > localBest−BONUS ⇔ raw+BONUS > localBest. Alles darunter
    // kann die Zugwahl nicht ändern.
    // §109 Hebel 1: das Wertfenster braucht EXAKTE Wurzelwerte — mit unverändertem Wurzel-Alpha
    // wären die Werte der Nicht-Bestzüge Fail-Low-Schranken, und das Fenster würde auf
    // Phantomwerte reagieren (gemessen: im Schnitt 6 Phantom-Gleichstände je Stellung).
    // §109b: DESHALB wird das Alpha nicht ABGESCHALTET (das kostete Faktor 4 an Rechenzeit und
    // hätte live über das Zeitbudget Tiefe gekostet), sondern um die FENSTERBREITE gesenkt.
    // Beweis der Verhaltensgleichheit: ein Zug fällt nur dann low, wenn sein echter Wert
    // <= localBest − margin − poolWindow ist; dann liegt er ohnehin AUSSERHALB des Fensters und
    // wird von der Auswahl verworfen. Jeder Zug INNERHALB des Fensters kommt exakt zurück.
    // Da localBest während der Schleife nur steigt, gilt das auch für früh gesuchte Züge.
    const _poolOn   = (typeof cfg.poolWindow === 'number');
    const poolSlack = _poolOn ? cfg.poolWindow : 0;
    const useRootAlpha = _poolOn ? true : (cfg.rankPool === 1);
    // §99 INSTRUMENTIERUNG (reine Beobachtung — aendert KEINE Zugwahl, KEIN Versionsbump).
    //   rawByMove : Suchwert VOR DREIER_FORM_BONUS, je Zug. Macht H5 abfragbar
    //               (Bonus entscheidet gegen das Suchurteil), ohne Offline-Nachrechnung.
    //   prevByMove: der localBest, den DIESER Zug ueberboten hat. Wichtig: localBest ist immer
    //               der EXAKTE Wert eines real gesuchten Zuges (er lag in seinem Fenster) —
    //               anders als die scored-Werte der Fail-Low-Zuege, die nur Schranken sind.
    //               Damit ist raw < prevBest ein SAUBERER Vergleich zweier exakter Werte, auch
    //               unter Wurzel-Alpha. Er findet H5-Faelle nur, wenn die bessere Alternative
    //               VOR dem gewaehlten Zug lag — dank ID-Sortierung ist das der Normalfall,
    //               aber die Zaehlung bleibt eine UNTERGRENZE.
    const rawByMove = new Map(), prevByMove = new Map();
    // §111: welche Wurzelzüge bilden einen Dreier? Wird nur unter cfg.forceTriple ausgewertet,
    // aber immer gefüllt — die Menge ist winzig und der Zweig bleibt dadurch frei von
    // Sonderfällen. Ohne forceTriple hat sie KEINE Wirkung (meister-Pfad unberührt).
    const tripleSet = new Set();
    const _key = m => m.fr+','+m.fc+','+m.tr+','+m.tc;
    for(const m of legal){
      // Sicherheitsnetz: Gegner-Sieg-ermöglichende Züge meiden, solange es Alternativen gibt
      if(blockActive && isBad(m) && badMoves.size < legal.length){ skipped.push(m); continue; }
      // INTRA-TIEFEN-ABBRUCH (Notlösung §44): wenn das Budget schon während dieser Tiefe
      // reißt UND minDepth bereits vollständig gerechnet wurde, brich ab und BEHALTE das
      // Ergebnis der letzten VOLLSTÄNDIGEN Tiefe (bestMove von depth-1). Verhindert, dass
      // eine teure Tiefe den UI-Thread sekundenlang blockiert.
      if(depth > cfg.minDepth && (_now() - t0) >= cfg.timeBudgetMs){ aborted = true; break; }
      const nb = applyMoveOn(board, m.fr, m.fc, m.tr, m.tc, player);
      if(checkFourOn(nb)){ rawByMove.set(_key(m),100000); prevByMove.set(_key(m), localBest===-Infinity?null:localBest);
        localBest = 100000; localMove = m; scored.push({m, v: 100000}); break; }
      const triple = applyLockOn(nb);
      if(triple) tripleSet.add(_key(m)); // §111
      const bonus = triple ? (getLegalMoves(nb, player, p1parity).length > 0 ? player : null) : null;
      const nextPlayer = bonus ? player : opp;
      const nbHash = boardHash(nb, nextPlayer);
      // §87-1C: WURZEL-Wiederholung — dieselbe R31-Semantik wie in negamax, die am Root bisher
      // FEHLTE: liegt die Zielstellung schon in pathSet (reale Partiehistorie inkl. aktueller
      // Stellung), ist der Zug eine Wiederholung → Remiswert statt Vollsuche. Vorher wurde ein
      // solcher Zug mit vollem Suchwert bewertet: eine gewinnende KI konnte in die 5. (Zwangs-
      // remis) bzw. 3. Wiederholung (Einforderungsrecht) hineinziehen, eine verlierende fand
      // die rettende Wiederholung am Root nicht. KEIN Regelverstoß: reine Bewertung, keine
      // Zugfilterung. (triple ist hier immer null: Locks sind innerhalb einer Partie monoton —
      // eine wiederholte Stellung hat identische Locks, applyLockOn findet nichts Neues.)
      if(pathSet.has(nbHash)){
        const v = REP_DRAW_SCORE;
        scored.push({m, v}); rawByMove.set(_key(m), v);
        if(v > localBest){ prevByMove.set(_key(m), localBest===-Infinity?null:localBest); localBest = v; localMove = m; }
        continue;
      }
      // §91 Remis-Uhr am Root: dieser Halbzug verbraucht 1 (DREIER resettet auf clockLimit).
      // Läuft die Uhr damit ab, ist die Zielstellung per §56-Automatik REMIS → Wert 0, keine
      // Vollsuche. (Viererreihe schlägt die Uhr — der Sieg-Fall wurde oben bereits abgefangen,
      // exakt wie nextTurn() erst den Sieg und dann die Automatik prüft.)
      const childClock = triple ? clockLimit : (clock0===Infinity ? Infinity : clock0 - 1);
      if(childClock <= 0){
        const v = 0;
        scored.push({m, v}); rawByMove.set(_key(m), v);
        if(v > localBest){ prevByMove.set(_key(m), localBest===-Infinity?null:localBest); localBest = v; localMove = m; }
        continue;
      }
      const branchSet = new Set(pathSet); branchSet.add(nbHash);
      // §61e-5/§F2: Suchfenster (localBest − Dreier-Marge, +∞) statt (−∞,+∞). −∞−BONUS = −∞
      // in JS, daher kein Sonderfall für den ersten Zug nötig.
      const margin = triple ? DREIER_FORM_BONUS : 0;
      // §109b: das zusätzliche Epsilon ist NICHT Kosmetik. Ohne es fällt ein Zug, dessen echter
      // Wert GENAU auf der Fenstergrenze liegt, gegen alpha low und verschwindet aus der Auswahl,
      // während er mit abgeschaltetem Alpha noch drin wäre (Filter prüft <=). Gemessen: 2 von 32
      // Stellungen wichen dadurch ab, bis das Epsilon drin war.
      // §111: unter forceTriple entscheidet das MATE-BAND darüber, ob ein Dreier genommen wird.
      // Diese Prüfung darf nicht auf einer Fail-Low-Schranke fußen: eine Schranke ist eine OBERE
      // Grenze des wahren Wertes, ein in Wahrheit verlorener Dreier könnte damit über −90000
      // landen und durchrutschen. Deshalb bekommen genau diese wenigen Züge das volle Fenster.
      // Kosten: dreierbildende Wurzelzüge sind selten (live rund 6 % der KI-Züge haben überhaupt
      // einen), und die Stufe rechnet nur bis Tiefe 3.
      const _exactTriple = (cfg.forceTriple === true) && !!triple;
      const aWin = (useRootAlpha && !_exactTriple)
        ? (localBest - margin - poolSlack - (_poolOn ? 1e-6 : 0))
        : -Infinity;
      let v = bonus
        ? negamax(nb, depth+1, aWin, Infinity, player, bonus, branchSet, childClock, clockLimit)   // §105: Bonuszug kostet keine Ply
        : -negamax(nb, depth, -Infinity, -aWin, opp, null, branchSet, childClock, clockLimit);
      const vRaw = v;                                    // §99: vor dem Bonus festhalten
      if(triple && Math.abs(v) < 90000) v += DREIER_FORM_BONUS;
      scored.push({m, v}); rawByMove.set(_key(m), vRaw);
      if(v > localBest){ prevByMove.set(_key(m), localBest===-Infinity?null:localBest); localBest = v; localMove = m; }
    }
    // Bei Abbruch mitten in der Tiefe: diese unvollständige Tiefe NICHT übernehmen
    // (bestMove bleibt auf dem Ergebnis der letzten vollständigen Tiefe).
    if(aborted){ budgetHit = true; break; }
    if(localMove){
      // ── §111 DREIER-VORRANG (cfg.forceTriple) ────────────────────────────────
      // WALTER-AUFLAGE, wörtlich: „Alle Dreier, außer die, bei denen der Gegner unmittelbar zu
      // einem Vierer käme, sollte Max Michu mitnehmen." Begründung ist NICHT Spielstärke,
      // sondern WIRKUNG: ein liegengelassener Dreier ist für einen Einsteiger der sichtbarste
      // denkbare Patzer und widerspricht der Design-Auflage, dass der Mensch nicht gewinnen
      // soll, weil Max Offensichtliches liegen lässt.
      //
      // WARUM DAS ÜBERHAUPT NÖTIG IST: poolWindow ist bei einsteiger 110, DREIER_FORM_BONUS
      // ist 80. Das Fenster ist damit BREITER als der gesamte Dreier-Bonus — ein Dreier, der
      // nur durch seinen Bonus vorne liegt, ist per Konstruktion überstimmbar. Bei
      // fortgeschritten (Fenster 30) tritt der Fall kaum auf, deshalb trägt nur einsteiger
      // das Flag.
      //
      // ⚠️ DIES IST EINE DIREKTE MANIPULATION — die erste im Projekt. Walters Grundsatz lautet:
      // jede GRADUELLE Skalierung ist besser, und sie soll möglichst die einzige ihrer Art
      // bleiben. Wer hier etwas anbaut, prüfe zuerst, ob ein Regler dasselbe leistet.
      //
      // ABGRENZUNG (bewusst etwas strenger als „unmittelbar"): ausgeschlossen wird jeder Dreier,
      // dessen SUCHWERT im Mate-Band liegt (≤ −90000) — das deckt den unmittelbaren Gegen-Vierer
      // ab und zusätzlich den, der ein, zwei Züge später erzwungen wird. Strenger heißt hier
      // sicherer und wirkt nie wie ein Patzer.
      // Bleibt kein Dreier übrig, läuft die normale Auswahl (Fenster/Softmax) über ALLE Züge.
      // Bleibt mehr als einer, entscheidet das Fenster INNERHALB der Dreier-Menge.
      // Die Werte dieser Züge sind exakt (s. _exactTriple oben), die Prüfung fußt also nicht
      // auf Schranken. Der §99-Beobachtungsblock bleibt unverändert: `rank` wird weiterhin
      // gegen ALLE Wurzelzüge gebildet und zeigt damit, wie weit der erzwungene Dreier vom
      // Suchurteil abweicht — genau die Zahl, die man später auswerten will.
      let _base = scored;
      if(cfg.forceTriple === true){
        const _tri = scored.filter(x => tripleSet.has(_key(x.m)) && x.v > -90000);
        if(_tri.length) _base = _tri;
      }
      // rankPool: aus den Top-k Zügen wählen (Feinjustierung untere Stufen, §37d)
      if(typeof cfg.poolWindow === 'number'){
        // ── §109 HEBEL 1: Wertfenster + Softmax statt Top-k-uniform ──────────────
        // Top-k-uniform ignoriert den WERTABSTAND: der drittbeste Zug wird gleich oft
        // gespielt wie der beste, egal ob er 2 oder 200 Punkte schlechter ist. Livebeleg
        // 6XDY5WCE: 4×Rang 1, 6×Rang 2, 4×Rang 3, praktisch gleichverteilt.
        // Hier stattdessen: nur Züge innerhalb von poolWindow Punkten hinter dem Besten
        // kommen überhaupt in Frage, und innerhalb des Fensters fällt die Wahrscheinlichkeit
        // exponentiell mit dem Abstand (Temperatur poolTemp).
        //   poolWindow  → WIE SCHLECHT darf ein Zug höchstens sein (harte Grenze)
        //   poolTemp    → WIE OFT werden schlechtere gewählt (weiche Gewichtung)
        // poolTemp <= 0 ⇒ Gleichverteilung im Fenster (nur die harte Grenze wirkt).
        // Der Reiz gegenüber rankPool: in scharfen Stellungen, wo der beste Zug weit vorne
        // liegt, schrumpft das Fenster von selbst auf einen Zug — die Stufe spielt dort
        // korrekt und irrt nur dort, wo es wirklich mehrere vertretbare Züge gibt.
        _base.sort((a,b) => b.v - a.v);   // §111: _base === scored, außer der Dreier-Vorrang griff
        const top = _base[0].v;
        const cand = _base.filter(x => (top - x.v) <= cfg.poolWindow);
        const temp = (typeof cfg.poolTemp === 'number') ? cfg.poolTemp : 0;
        let pick;
        if(temp > 0){
          const w = cand.map(x => Math.exp(-(top - x.v) / temp));
          const sum = w.reduce((a,b) => a+b, 0);
          let r = Math.random() * sum, i = 0;
          while(i < w.length - 1 && r > w[i]){ r -= w[i]; i++; }
          pick = cand[i];
        } else {
          pick = cand[Math.floor(Math.random() * cand.length)];
        }
        bestMove = pick.m;
        bestScore = pick.v; bestRootValue = localBest; // §116
      } else if(cfg.rankPool > 1){
        _base.sort((a,b) => b.v - a.v);
        const pool = _base.slice(0, Math.min(cfg.rankPool, _base.length));
        const pick = pool[Math.floor(Math.random() * pool.length)];
        bestMove = pick.m;
        bestScore = pick.v; bestRootValue = localBest; // §85 / §116
      } else if(_base !== scored){
        // §111: forceTriple OHNE Fenster. Kommt in keiner ausgelieferten Stufe vor, muss aber
        // definiert sein — sonst wäre das Flag von der Fenster-Einstellung abhängig.
        _base.sort((a,b) => b.v - a.v);
        bestMove = _base[0].m;
        bestScore = _base[0].v; bestRootValue = localBest; // §116
      } else {
        bestMove = localMove;
        bestScore = localBest; bestRootValue = localBest; // §85 / §116
      }
      // §99: Kennzahlen der zuletzt VOLLSTAENDIG gerechneten Tiefe einfrieren.
      const _sorted = scored.slice().sort((a,b) => b.v - a.v);
      const _bk = _key(bestMove);
      obs = {
        raw:      rawByMove.has(_bk) ? rawByMove.get(_bk) : bestScore,
        prevBest: prevByMove.has(_bk) ? prevByMove.get(_bk) : null,
        sec:      _sorted.length > 1 ? _sorted[1].v : null,
        rank:     _sorted.findIndex(x => _key(x.m) === _bk) + 1,
        nRoot:    legal.length,
        nSkip:    skipped.length,
        // §120 (1.8.): `exact` meldet, ob sec/rank belastbare WERTE sind oder blosse
        // Fail-Low-Schranken. Bis hierher stand `!useRootAlpha` — und weil seit §109 JEDE
        // Stufe entweder ein Fenster oder rankPool 1 hat, war useRootAlpha immer true und
        // exact damit in ALLEN 375 geloggten Zuegen false. Das Flag war strukturell tot.
        // Richtig ist: bei gesetztem Fenster wird die Wurzel-Alpha um poolSlack GESENKT,
        // also bekommt jeder Zug INNERHALB des Fensters einen exakten Wert; nur Zuege
        // ausserhalb gehen fail-low, und die sortiert derselbe Schwellwert ohnehin aus.
        // Empirisch bestaetigt an 38 Live-Zuegen mit rank >= 2: null Verstoesse gegen die
        // Fenstergrenze, groesster Abstand sec-score 44 (bei Fenster 110).
        exact:    (!useRootAlpha) || _poolOn
      };
      reachedDepth = depth;
      // §61e-6/§65e/§F3: ID-Zugsortierung. Die scored-Liste dieser Tiefe nach Wert sortieren
      // und legal in DIESER Reihenfolge für die nächste Tiefe durchlaufen → bester Vortiefen-
      // Zug zuerst → frühe Alpha-Cuts. §F3-Korrektur: vorher galt scored.length===legal.length —
      // sobald das Sicherheitsnetz auch nur einen Zug filterte, fiel die Sortierung aus, und
      // zwar genau in taktischen Stellungen (wo sie am meisten bringt). Jetzt zählen die
      // gefilterten Züge mit und werden hinten angehängt (die Filterentscheidung fällt pro
      // Tiefe ohnehin neu über isBad — die Reihenfolge darf sie nicht verlieren).
      // Bedingung weiterhin: kein Intra-Tiefen-Abbruch und kein früher Sieg-Break (sonst
      // ist scored unvollständig und die Sortierung würde Züge verlieren).
      if(scored.length + skipped.length === legal.length){
        scored.sort((a,b) => b.v - a.v);
        legal = scored.map(s => s.m).concat(skipped);
      }
    }
    const elapsed = _now() - t0;
    // Abbruch: Budget erreicht UND Mindesttiefe erfüllt
    if(elapsed >= cfg.timeBudgetMs && depth >= cfg.minDepth){ budgetHit = true; break; }
  }

  return {
    move: bestMove,
    meta: {
      depth: reachedDepth,
      ms: _now() - t0,
      budgetHit,
      safety: (blockActive && badMoves.size > 0) ? 'blocked' : 'none',
      rankPool: cfg.rankPool,
      score: bestScore, // §85 (ab 1.2): Suchwert des GEWAEHLTEN Zuges aus Sicht des Ziehenden
      // §116: Suchwert des BESTEN Zuges — was die Suche fuer richtig haelt, unabhaengig davon,
      // was die Stufe daraus macht. Bei meister identisch zu `score`; bei Fenster-/forceTriple-
      // Stufen liegt `best` darueber. Wer die LAGE beurteilen will, nimmt best, nicht score.
      // (Anlass: die Remis-Logik las bis v93 `score` und hielt Max deshalb fuer schlechter,
      //  als seine Stellung war — s. Verbraucher-Register im Dateikopf.)
      best: bestRootValue,
      // §99: Beobachtung ohne Wirkung. raw + prevBest sind unter JEDER Stufe exakt;
      // sec + rank nur wenn exact===true (rankPool>1, also ohne Wurzel-Alpha).
      raw:      obs ? obs.raw      : null,
      prevBest: obs ? obs.prevBest : null,
      sec:      obs ? obs.sec      : null,
      rank:     obs ? obs.rank     : null,
      nRoot:    obs ? obs.nRoot    : null,
      nSkip:    obs ? obs.nSkip    : null,
      exact:    obs ? obs.exact    : null,
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// KI-HERZ (transplantiert aus Kiki 3.2a — HANDOVER §40b)
// ═══════════════════════════════════════════════════════════════════
// ── Konstanten (aus Kiki 3.2a übernommen) ──
const P1 = 1, P2 = 2;
const STACK_WEIGHT = 1;
const W_PARITY = 4;   // Achse-B: Paritätsverfügbarkeit freier Figuren
const W_SINGLE = 3;   // Achse-B: Stapelbesitz drohungsfreie Spalten
const W_DOUBLE = 150; // Achse-B: unblockbare Doppeldrohung
const DREIER_FORM_BONUS = 80;
const REP_DRAW_SCORE = 0;   // Wiederholung = Remiswert (Contempt)
// §91: Remis-Uhr. Innerhalb der letzten DRAW_CLOCK_SOFT Halbzüge vor dem Zwangsremis wird die
// Blattbewertung linear gegen 0 gedämpft — die überlegene Seite verliert dadurch ihren
// statischen Vorsprung, WENN sie keinen Dreier erzwingt (der die Uhr resettet), und priorisiert
// den Dreier von selbst; die unterlegene Seite spielt auf Zeit. Feinwert, beim Testen justierbar.
const DRAW_CLOCK_SOFT = 16;
function drawClockFactor(clockLeft){
  if(clockLeft===Infinity) return 1;
  return Math.max(0, Math.min(1, clockLeft / DRAW_CLOCK_SOFT));
}
// PARITY_P1 wird EXTERN gesetzt (pro Spiel, da Parität wechselt — §38d).

function makesRunJS(rows, k){
  for(let s=0;s<=4-k;s++){
    let ok=true;
    for(let i=0;i<k;i++) if(!rows.includes(s+i)){ok=false;break;}
    if(ok) return true;
  }
  return false;
}

function colBaseRows(b,c,color){
  const out=[];
  for(let r=0;r<4;r++){
    const base=getBasePiece(b[r][c]);
    if(base&&base.color===color) out.push(r);
  }
  return out;
}

function colHasThreat(b,c,p1parity){
  for(const color of ['red','black']){
    const br=colBaseRows(b,c,color), n=br.length;
    if(n>=3){
      // §87-1I (R32-Abgleich): Trägt das Restfeld einen STAPEL, ist die Spalte VERSIEGELT —
      // die Basis unter dem Stapel bleibt stehen, die Reihe ist keine Drohung. evaluate()
      // behandelt genau diesen Fall seit R32 mit dem Siegfeld-Veto (±80); colHasThreat meldete
      // ihn trotzdem als Drohung und schloss die Spalte damit fälschlich aus asingleControl aus.
      // Ein EINZELSTEIN auf dem Restfeld bleibt dagegen Drohung (latent: er kann wegziehen).
      for(let r=0;r<4;r++) if(!br.includes(r) && !b[r][c].stack) return true;
    }
    if(n===2){
      for(let t=0;t<4;t++){
        if(br.includes(t)) continue;
        if(!b[t][c].piece && makesRunJS(br.concat([t]),3)) return true;
      }
    }
  }
  return false;
}

function parityCtrlJS(b,ai,p1parity){
  const hum = ai===1?2:1; let oa=0,oh=0;
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const cell=b[r][c];
    if(cell.stack||!cell.piece) continue;
    const la=canLift(b,r,c,ai,p1parity), lh=canLift(b,r,c,hum,p1parity);
    if(la&&!lh) oa++; else if(lh&&!la) oh++;
  }
  return oa-oh;
}

function asingleControlJS(b,ai,p1parity){
  let val=0;
  for(let c=0;c<4;c++){
    if(colHasThreat(b,c,p1parity)) continue;
    for(let r=0;r<4;r++)
      if(b[r][c].stack) val += (b[r][c].stack.formedBy===ai)?1:-1;
  }
  return val;
}

function canCompleteJS(b,tgt,c,color,party,p1parity){
  for(let sr=0;sr<4;sr++) for(let sc=0;sc<4;sc++){
    if(sr===tgt&&sc===c) continue;
    const cell=b[sr][sc];
    const mp=cell.stack?cell.stack.top:cell.piece;
    if(!mp||mp.color!==color||mp.stripe!==tgt) continue;
    if(canLift(b,sr,sc,party,p1parity)&&canDrop(b,sr,sc,tgt,c,party,p1parity)) return true;
  }
  return false;
}

function doubleThreatJS(b,ai,p1parity){
  let val=0;
  for(let c=0;c<4;c++) for(const color of ['red','black']){
    const br=colBaseRows(b,c,color);
    if(br.length!==2) continue;
    const tt=[];
    for(let t=0;t<4;t++) if(!br.includes(t)&&!b[t][c].piece&&makesRunJS(br.concat([t]),3)) tt.push(t);
    if(tt.length<2) continue;
    for(const party of [1,2]){
      const compl=tt.filter(t=>canCompleteJS(b,t,c,color,party,p1parity));
      if(compl.length<2) continue;
      const defender = party===1?2:1;
      let blockable=false;
      for(const m of getLegalMoves(b,defender,p1parity)){
        const nb=applyMoveOn(b,m.fr,m.fc,m.tr,m.tc,defender);
        let anyStill=false;
        for(const t of compl) if(!nb[t][c].piece && canCompleteJS(nb,t,c,color,party,p1parity)){anyStill=true;break;}
        if(!anyStill){blockable=true;break;}
      }
      if(!blockable) val += (party===ai)?1:-1;
    }
  }
  return val;
}


// ── §107: Paritätshoheit über Vierer-Spalten mit ZWEI leeren Feldern ──────
// Erfasst das Endspielmotiv aus AG8VAPGM: ein Spieler kann beide leeren Zellen
// einer sonst einfarbigen Spalte mit ZWEI VERSCHIEDENEN Figuren besetzen, die
// beide Tops SEINER EIGENEN Stapel sind. Solche Figuren sind unantastbar (auf
// einen Stapel darf nicht gestapelt werden) und ohne Paritätsprüfung hebbar
// (canLift auf Stapel prüft nur formedBy). Die Reihenfolge wird durchgespielt:
// das Setzen der ersten Figur verändert die Rot-Nachbarzählung der zweiten,
// wenn die Siegfarbe rot ist.
// GATE: nur wenn irgendwo gesperrt ist — vorher gibt es das Thema nicht, und so
// bleibt die Eröffnung (wo das Zeitbudget bindet) unbelastet. Gemessene Kosten 1,05×.
// BELEGLAGE: Mechanik aus der Regelschicht hergeleitet; das Muster trat in 8 von
// 245 realen Stellungen auf und der meldende Spieler gewann in 7 davon. Ein
// STÄRKENACHWEIS im Selbstspiel liegt NICHT vor — das Muster entsteht dort in nur
// 1 von 40 Partien, weil die KI es gegen sich selbst nicht aufbaut. Aufnahme
// erfolgte auf Mechanik, nicht auf Messung.
const W_HOHEIT = 300;

function _hoheitEigeneTops(b, stripe, color, P){
  const out=[];
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const cell=b[r][c];
    if(cell.stack && cell.stack.formedBy===P){
      const t=cell.stack.top;
      if(t.stripe===stripe && t.color===color) out.push({r,c});
    }
  }
  return out;
}

function _hoheitFuer(b, P, p1parity){
  let gefunden=0;
  for(let c=0;c<4;c++){
    let col=null; const leer=[]; let ok=true;
    for(let r=0;r<4;r++){
      const cell=b[r][c];
      const base=cell.stack?cell.stack.bottom:cell.piece;
      if(!base){ leer.push(r); continue; }
      if(col===null) col=base.color;
      else if(base.color!==col){ ok=false; break; }
    }
    if(!ok || col===null || leer.length!==2) continue;
    const [ra,rb]=leer;
    let treffer=false;
    for(const [t1,t2] of [[ra,rb],[rb,ra]]){
      for(const k1 of _hoheitEigeneTops(b,t1,col,P)){
        if(!canLift(b,k1.r,k1.c,P,p1parity)) continue;
        if(!canDrop(b,k1.r,k1.c,t1,c,P,p1parity)) continue;
        const nb=applyMoveOn(b,k1.r,k1.c,t1,c,P);
        for(const k2 of _hoheitEigeneTops(b,t2,col,P)){
          if(k2.r===k1.r && k2.c===k1.c) continue;
          if(!canLift(nb,k2.r,k2.c,P,p1parity)) continue;
          if(canDrop(nb,k2.r,k2.c,t2,c,P,p1parity)){ treffer=true; break; }
        }
        if(treffer) break;
      }
      if(treffer) break;
    }
    if(treffer) gefunden++;
  }
  return gefunden;
}

// Antisymmetrisch by construction: Differenz zweier spielerneutraler Zählungen.
function hoheitJS(b, ai, p1parity){
  let gesperrt=false;
  for(let r=0;r<4 && !gesperrt;r++) for(let c=0;c<4;c++) if(b[r][c].locked){ gesperrt=true; break; }
  if(!gesperrt) return 0;
  const geg = ai===P1 ? P2 : P1;
  return _hoheitFuer(b,ai,p1parity) - _hoheitFuer(b,geg,p1parity);
}

function evaluate(b, forPlayer){
  const AI_=forPlayer, HUMAN_=forPlayer===P1?P2:P1;
  let score=0;

  // ── Term V+: Spalten-Analyse mit Figurenkontrolle ────────────────
  const ALL8v=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  for(let c=0;c<4;c++){
    for(const color of['red','black']){

      const baseRows=[];
      for(let r=0;r<4;r++){
        const base=b[r][c].stack?b[r][c].stack.bottom:b[r][c].piece;
        if(base&&base.color===color) baseRows.push(r);
      }
      const n=baseRows.length;
      if(n===0) continue;

      // ── n≥3: Gewinnfeld-Analyse ──────────────────────────────────
      if(n>=3){
        const emptyRow=[0,1,2,3].find(r=>!baseRows.includes(r));
        if(emptyRow===undefined) continue;

        // SCHRITT 1: Direkte Platzierbarkeit (Abstellen)
        // R32 PHANTOM-FIX: Eine Basis entsteht NUR auf leerem Feld.
        // canDrop auf besetztes Siegfeld waere Stapeln = keine Vollendung.
        const siegfeldFrei = !b[emptyRow][c].piece;
        let aiCanPlace=false, humCanPlace=false;
        for(let fr=0;fr<4&&!(aiCanPlace&&humCanPlace);fr++){
          for(let fc=0;fc<4&&!(aiCanPlace&&humCanPlace);fc++){
            if(fr===emptyRow&&fc===c) continue;
            const cell=b[fr][fc];
            const mp=cell.stack?cell.stack.top:cell.piece;
            if(!mp||mp.color!==color||mp.stripe!==emptyRow) continue;
            if(siegfeldFrei&&!aiCanPlace&&canLift(b,fr,fc,AI_,PARITY_P1)&&canDrop(b,fr,fc,emptyRow,c,AI_,PARITY_P1)) aiCanPlace=true;
            if(siegfeldFrei&&!humCanPlace&&canLift(b,fr,fc,HUMAN_,PARITY_P1)&&canDrop(b,fr,fc,emptyRow,c,HUMAN_,PARITY_P1)) humCanPlace=true;
          }
        }

        // SCHRITT 2: Figurenkontrolle (Aufnehmen)
        // Aktiv = Top in eigenem Stapel | Passiv = Bottom in eigenem Stapel
        // Vorübergehend = freie Figur hebbar
        let aiActive=0, aiPassive=0, humActive=0, humPassive=0;
        for(let fr=0;fr<4;fr++){
          for(let fc=0;fc<4;fc++){
            if(fr===emptyRow&&fc===c) continue;
            const cell=b[fr][fc];
            const mp=cell.stack?cell.stack.top:cell.piece;
            if(mp&&mp.color===color&&mp.stripe===emptyRow){
              if(cell.stack){
                if(cell.stack.formedBy===AI_) aiActive++;
                else humActive++;
              } else if(!cell.locked){
                if(canLift(b,fr,fc,AI_,PARITY_P1)) aiActive+=0.4;
                if(canLift(b,fr,fc,HUMAN_,PARITY_P1)) humActive+=0.4;
              }
            }
            if(cell.stack){
              const bot=cell.stack.bottom;
              if(bot&&bot.color===color&&bot.stripe===emptyRow){
                if(cell.stack.formedBy===AI_) aiPassive++;
                else humPassive++;
              }
            }
          }
        }

        // SCHRITT 3: Paritätsstabilität Nachbarschaft
        let stableAI=0, stableHUM=0;
        for(const [dr,dc] of ALL8v){
          const nr=emptyRow+dr, nc=c+dc;
          if(nr<0||nr>3||nc<0||nc>3) continue;
          const ncell=b[nr][nc];
          if(ncell.locked) continue;
          if(ncell.stack){
            if(ncell.stack.formedBy===AI_) stableAI++;
            else stableHUM++;
          }
        }
        const stabilityAdv=stableAI-stableHUM;

        // SCHRITT 4: Score
        // R30: Grundwert 'score += 150' ENTFERNT (nicht antisymmetrisch).
        // R32 SIEGFELD-VETO: versiegeltes Siegfeld (Stapel) -> Spalte keine
        // Drohung, Schluessel exklusiv beim Stapelbildner. Kontroll-/
        // Stabilitaetsterme entfallen fuer diese Spalte.
        const sfCell=b[emptyRow][c];
        if(sfCell.piece&&sfCell.stack){
          score += (sfCell.stack.formedBy===AI_ ? 80 : -80);
        } else if(aiCanPlace&&!humCanPlace){
          score += 300;
        } else if(humCanPlace&&!aiCanPlace){
          score -= 300;
        } else if(!aiCanPlace&&!humCanPlace){
          const aiCtrl=aiActive+aiPassive*0.6;
          const humCtrl=humActive+humPassive*0.6;
          if(aiCtrl>humCtrl+0.3){
            score += aiActive>=1 ? 200 : 120;
          } else if(humCtrl>aiCtrl+0.3){
            score -= humActive>=1 ? 200 : 120;
          } else {
            score += stabilityAdv*15;
          }
        } else {
          score += stabilityAdv*10;
        }
      }

      // ── n=2: Dreier-Potential ────────────────────────────────────
      if(n===2){
        const freeRows=[0,1,2,3].filter(r=>!baseRows.includes(r));
        for(const targetRow of freeRows){
          if(b[targetRow][c].piece) continue; // R32 PHANTOM-FIX: Basis nur auf leerem Feld
          // R34 KONSEKUTIVITÄTS-FIX: Nur werten, wenn {baseRows ∪ targetRow} einen
          // Block von 3 direkt aufeinanderfolgenden Reihen enthält. Sonst entsteht
          // KEIN regelkonformer Dreier (checkThreeInRow/applyLockOn verlangen
          // Konsekutivität) — Bewertung wäre ein Phantom-Dreier.
          const rowsSet=[...baseRows,targetRow];
          const makesTriple=[0,1].some(s=>[0,1,2].every(i=>rowsSet.includes(s+i)));
          if(!makesTriple) continue;
          let aiCanPlace=false, humCanPlace=false;
          let aiHasActive=false, humHasActive=false;
          for(let fr=0;fr<4;fr++){
            for(let fc=0;fc<4;fc++){
              if(fr===targetRow&&fc===c) continue;
              const cell=b[fr][fc];
              const mp=cell.stack?cell.stack.top:cell.piece;
              if(!mp||mp.color!==color||mp.stripe!==targetRow) continue;
              if(canLift(b,fr,fc,AI_,PARITY_P1)&&canDrop(b,fr,fc,targetRow,c,AI_,PARITY_P1)){
                aiCanPlace=true;
                if(cell.stack&&cell.stack.formedBy===AI_) aiHasActive=true;
              }
              if(canLift(b,fr,fc,HUMAN_,PARITY_P1)&&canDrop(b,fr,fc,targetRow,c,HUMAN_,PARITY_P1)){
                humCanPlace=true;
                if(cell.stack&&cell.stack.formedBy===HUMAN_) humHasActive=true;
              }
            }
          }
          if(aiCanPlace&&!humCanPlace)  score += aiHasActive ? 90 : 60;
          else if(humCanPlace&&!aiCanPlace) score -= humHasActive ? 90 : 60;
        }
      }
    }
  }

  // ── Ebene 5: Paritätskontrolle ────────────────────────────────────
  // Rote Top-Figuren in eigenen Stapeln = direkte Kontrolle über Parität-Kontext.
  // ANGEPASST: Schwellenwert statt Maximum — 1-2 rote Tops gut, mehr bringt nichts.
  // Datenbasis: "alle rot" korreliert NEGATIV mit Sieg (−16% vs. +33% bei r9).
  // Freie rote Figuren = verfügbar für beide, leicht negativ für AI.
  // REGEL: Figuren gehören keinem Spieler — nur Stapel haben formedBy.
  let aiRedTops=0, humRedTops=0, freeRed=0;
  let aiStacks=0, humStacks=0;
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const cell=b[r][c];
    if(cell.stack){
      if(cell.stack.formedBy===AI_)  aiStacks++;
      else                           humStacks++;
      if(cell.stack.top.color==='red'){
        if(cell.stack.formedBy===AI_) aiRedTops++;
        else humRedTops++;
      }
    } else if(cell.piece&&cell.piece.color==='red') freeRed++;
  }
  // Schwellenwert: max 2 rote Tops werden belohnt (cap bei 2)
  score += (Math.min(aiRedTops,2) - Math.min(humRedTops,2)) * 20;
  // R30: 'score -= freeRed * 3' ENTFERNT (nicht antisymmetrisch).
  // freeRed-Zaehlung bleibt fuer Debug/Statistik erhalten.
  void freeRed;

  // ── Ebene 8: Stapel-Kontrolle ─────────────────────────────────────
  // Paritätsspezifisch: STACK_WEIGHT unterscheidet sich je nach Konfiguration.
  // Daten: even-KI profitiert stärker von Stapel-Vorteil (Ø +2.47 bei Sieg)
  //        als odd-KI (Ø +0.18). Gewicht entsprechend kalibriert.
  // Paritätsblind: zählt nur formedBy, kein canLift/canDrop.
  // KEIN Regelverstoß: reine Strukturbewertung.
  score += (aiStacks - humStacks) * STACK_WEIGHT;

  // ── NEUE ACHSE-B-TERME (V+ Erweiterung) ──────────────────────────
  score += parityCtrlJS(b, AI_, PARITY_P1) * W_PARITY;
  score += asingleControlJS(b, AI_, PARITY_P1) * W_SINGLE;
  score += doubleThreatJS(b, AI_, PARITY_P1) * W_DOUBLE;
  score += hoheitJS(b, AI_, PARITY_P1) * W_HOHEIT;          // §107

  return score;
}

// ── §114 EVAL-JITTER (Hebel 3) ─────────────────────────────────────────────────────
// ZWECK: Die schwachen Stufen sollen sich VERSCHAETZEN, nicht bloss schlechter waehlen.
//   Das Wertfenster (§109) sitzt an der WURZEL: Max weiss dort, welcher Zug der beste ist,
//   und spielt trotzdem manchmal einen anderen. Der Jitter sitzt am BLATT: Max bewertet
//   Stellungen falsch und folgt seinem falschen Urteil dann konsequent. Das ist die
//   Maia-Lehre — ein Mensch irrt in der EINSCHAETZUNG, nicht in der Auswahl.
//
// WARUM DER SEED PRO ZUG NEU GEZOGEN WIRD (Walters Einwand, 31.7.):
//   Alpha-Beta braucht KONSISTENTE Blattwerte innerhalb EINER Suche — wuerfelte man je
//   Aufruf, lieferte dieselbe Stellung in zwei Suchzweigen verschiedene Werte und das
//   Ergebnis haenge von der Suchreihenfolge ab. Konsistenz ist also PFLICHT, aber nur
//   innerhalb eines Zuges. Ein ueber die ganze Partie fester Jitter waere darueber hinaus
//   „eindimensional" (Walter): Max haette immer denselben eingefrorenen Irrtum. Deshalb:
//   ein frischer Seed je pickMove-Aufruf, innerhalb der Suche eingefroren.
//   cfg.jitterSeed setzt den Seed fest — NUR fuer Messstand und Suiten (Reproduzierbarkeit).
//
// ANTISYMMETRIE (Kernregel 6): evaluate(b,1) === -evaluate(b,2) muss weiter gelten. Der
//   Stellungsschluessel wird deshalb mit FESTEM Spieler 1 gebildet (boardHash haengt sonst
//   vom Spieler ab), und das Vorzeichen kommt erst danach aus `player`. Beide Seiten sehen
//   damit denselben Betrag mit umgekehrtem Vorzeichen — der Selbsttest prueft das.
//
// MATE-BAND BLEIBT UNANGETASTET: ein verjitterter Gewinn-/Verlustwert koennte Max einen
//   Vierer uebersehen lassen — genau der sichtbare Patzer, den Walters Design-Auflage
//   verbietet. Der Jitter greift nur unterhalb von 90000.
let _jitterAmp = 0;      // 0 = aus. Wird je pickMove aus cfg.jitterAmp gesetzt.
let _jitterSeed = 0;

// 32-Bit-Mischfunktion ueber den Stellungsschluessel; deterministisch fuer (Seed, Stellung).
function _jitterOf(b, player){
  if(_jitterAmp <= 0) return 0;
  const key = boardHash(b, P1);            // fester Spieler → spielerunabhaengiger Schluessel
  let h = _jitterSeed ^ 0x9e3779b9;
  for(let i = 0; i < key.length; i++){
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;    // FNV-artig, danach noch einmal mischen
  }
  h ^= h >>> 15; h = Math.imul(h, 0x2545f491) >>> 0; h ^= h >>> 13;
  const u = (h >>> 0) / 4294967296;        // [0,1)
  const j = (u * 2 - 1) * _jitterAmp;      // [-amp, +amp)
  return player === P1 ? j : -j;           // Antisymmetrie
}

function negamax(b, depth, alpha, beta, activePlayer, bonusPlayer, pathSet, clockLeft, clockLimit){
  const player = bonusPlayer || activePlayer;
  const opp = player===P1 ? P2 : P1;
  if(clockLeft===undefined){ clockLeft=Infinity; clockLimit=Infinity; } // Alt-Aufrufer (Tests): Uhr aus

  if(checkFourOn(b)) return -100000 - depth; // previous move won → bad for current player (§12b: Mate-Band ±100000 gehärtet)
  // §91: abgelaufene Remis-Uhr = Zwangsremis (§56) — NACH dem Vierer-Check (Sieg schlägt Uhr).
  if(clockLeft <= 0) return 0;

  // §91: Blatt-Dämpfung — symmetrischer Faktor, evaluate() selbst bleibt zustandslos (Kernregel 5).
  if(depth===0){
    const v = evaluate(b, player) * drawClockFactor(clockLeft);
    // §114: Jitter NUR unterhalb des Mate-Bands (s. Kasten oben). evaluate() bleibt unberuehrt.
    // §119 (1.8.): Der Jitter wird NICHT von der Uhr gedaempft — §117 hatte das eingebaut und
    // ist ZURUECKGENOMMEN. Begruendung damals: der Jitter koennte kurz vor der Remis-Automatik
    // die gegen null geschrumpfte Bewertung dominieren. Das war eine VERMUTUNG ohne Beleg.
    // Gemessen (gleicher Seed 20260727, Tiefe 5, nur der Kern verschieden): ohne Daempfung
    // 3 Siege : 24 bei 5 Remis, mit Daempfung 8 : 9 bei 15 Remis. Die Daempfung hat den Hebel
    // praktisch abgeschaltet und die Remis verdreifacht — sie kostete genau dort Wirkung, wo
    // ein schwacher Spieler Fehler machen soll (zaehe Partien nahe der Uhr).
    // Der Schutz, auf den es ankommt, bleibt ohnehin: bei clockLeft <= 0 gibt der Knoten oben
    // hart 0 zurueck, ungejittert. LEHRE: keine Absicherung gegen ein Problem bauen, das sich
    // in keiner Messung gezeigt hat.
    return (Math.abs(v) < 90000) ? v + _jitterOf(b, player) : v;
  }

  const moves = getLegalMoves(b, player, PARITY_P1);
  if(moves.length===0){
    const om = getLegalMoves(b, opp, PARITY_P1);
    if(om.length===0) return 0;
    // opponent plays again — negate because perspective flips
    // §91: KEIN ausgeführter Halbzug → Uhr unverändert (der Zähler zählt nur echte Züge, §56).
    return -negamax(b, depth-1, -beta, -alpha, opp, null, pathSet, clockLeft, clockLimit);
  }

  let best = -Infinity;
  for(const m of moves){
    const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
    if(checkFourOn(nb)) return 100000 + depth; // immediate win for current player (§12b: Mate-Band ±100000 gehärtet)
    const triple = applyLockOn(nb);
    const bonus = triple ? (getLegalMoves(nb, player, PARITY_P1).length > 0 ? player : null) : null;

    // ── Spielbewusste Wiederholung (Ebene 7, R31) ────────────────────
    // pathSet enthaelt: alle Stellungen der realen Partie (positionHistory)
    // + die Vorfahren-Stellungen dieses Suchastes. Ein Treffer bedeutet:
    // dieser Zug wiederholt eine bekannte Stellung -> Remiswert 0.
    // KEIN Regelverstoss: reine Bewertung, keine Zugfilterung.
    const nextPlayer = bonus ? player : opp;
    const nbHash = boardHash(nb, nextPlayer);
    if(pathSet.has(nbHash)){
      // R31: Stellung kam im Suchpfad ODER in der realen Partie bereits vor.
      // Bewertung als Remis (0) statt Pauschal-Malus: die unterlegene Seite
      // waehlt die Wiederholung von selbst, die ueberlegene meidet sie.
      best = Math.max(best, REP_DRAW_SCORE);
      alpha = Math.max(alpha, REP_DRAW_SCORE);
      if(beta <= alpha) break;
      continue;
    }
    pathSet.add(nbHash);
    // §91: Halbzug verbraucht 1 Uhr-Einheit; DREIER resettet auf clockLimit. Ablauf erledigt
    // der Entry-Check der Rekursion (nach dem Vierer-Check — Sieg schlägt Uhr).
    const childClock = triple ? clockLimit : (clockLeft===Infinity ? Infinity : clockLeft - 1);
    // §96 DREIER-MARGE AM INNEREN KNOTEN (Fensterfehler, der die Suche wertverfaelschend machte):
    // Unten wird valB = val + DREIER_FORM_BONUS gebildet, das Kind wurde aber gegen das
    // UNVERSCHOBENE Fenster (alpha, beta) gesucht. Ein dreier-bildendes Kind ging dadurch
    // fail-low, obwohl es MIT seinem eigenen +80 ueber alpha gelegen haette — die lockere
    // Fail-Soft-Schranke plus 80 landete als scheinbar exakter Wert im Elternknoten.
    // Exakt dieselbe Korrektur steht seit §F2 am ROOT (dort als `margin`); an den inneren
    // Knoten fehlte sie. Richtig ist der Massstabswechsel: das Kind sucht im val-Massstab,
    // der Elternknoten vergleicht im valB-Massstab = val + BONUS. Also Fenster um BONUS senken.
    // Soundness: Kind exakt fuer alpha-BONUS < val < beta-BONUS  <=>  alpha < val+BONUS < beta.
    // KOSTEN: keine (gemessen 1,00x) — das Fenster wird verschoben, nicht geoeffnet.
    const marginIn = (triple ? DREIER_FORM_BONUS : 0);
    const alphaIn  = (alpha === -Infinity) ? -Infinity : alpha - marginIn;
    const betaIn   = (beta  ===  Infinity) ?  Infinity : beta  - marginIn;
    const val = bonus
      ? negamax(nb, depth,   alphaIn, betaIn, player, bonus, pathSet, childClock, clockLimit)      // §105: Bonuszug kostet keine Ply
      : -negamax(nb, depth-1, -betaIn, -alphaIn, opp, null, pathSet, childClock, clockLimit);
    pathSet.delete(nbHash);
    // SCHRITT 1: Bilden einer Dreierreihe (dieser Zug von `player`) wird direkt in
    // der Zugbewertung honoriert — Urheber ist `player` (Schleifenkontext).
    let valB = val;
    // FIX R33 (Mate-Bonus-Defekt): Bonus NICHT auf bereits verlorene/gewonnene
    // Knoten addieren, sonst sieht ein spaeterer Verlust schlechter aus als ein
    // sofortiger. Schwelle 90000 (§12b-gehaertet): Terminalwerte liegen bei
    // |val|>=100000; evaluate() bleibt <1000. Schwelle mitgezogen mit Mate-Band.
    if(triple && Math.abs(val) < 90000) valB += DREIER_FORM_BONUS;

    best = Math.max(best, valB);
    alpha = Math.max(alpha, valB);
    if(beta <= alpha) break;
  }
  return best;
}
// ═══════════════════════════════════════════════════════════════════
// ANTISYMMETRIE-SELBSTTEST (§40c — bleibt verbaut, sperrt bei Verletzung)
// ═══════════════════════════════════════════════════════════════════
function antisymmetrySelfTest(p1parity){
  const prev = (typeof PARITY_P1 !== 'undefined') ? PARITY_P1 : undefined;
  // §61b-2/§F4: evaluate() liest die GLOBALE PARITY_P1, die Zugerzeugung unten den PARAMETER
  // p1parity. Ohne Gleichschaltung testete der Test eine Chimäre (Züge unter Parität A,
  // Bewertung unter Parität B) und konnte „bestanden" für eine nie gespielte Konfiguration
  // melden. Fix: Globale für die Testdauer auf die Testparität setzen, danach über `prev`
  // restaurieren (prev war seit §40c deklariert, aber nie benutzt — Rest der nie fertig
  // gebauten Save/Restore-Logik).
  if(typeof globalThis!=='undefined') globalThis.PARITY_P1 = p1parity;
  try {
  let worst = 0, tested = 0;
  for(let g=0; g<60; g++){
    let tb = initBoard(); let p = P1;
    for(let mv=0; mv<40; mv++){
      const ms = getLegalMoves(tb, p, p1parity);
      if(!ms.length){ p = (p===P1?P2:P1); if(!getLegalMoves(tb,p,p1parity).length) break; continue; }
      const m = ms[Math.floor(Math.random()*ms.length)];
      applyMove(tb, m.fr, m.fc, m.tr, m.tc, p);
      const t = applyLockOn(tb);
      if(checkFourOn(tb)) break;
      const d = Math.abs(evaluate(tb, P1) + evaluate(tb, P2));
      if(d > worst) worst = d;
      tested++;
      if(!t) p = (p===P1?P2:P1);
    }
  }
  if(worst > 1e-9){
    throw new Error('ANTISYMMETRIE VERLETZT (Δ='+worst+') — KI-Kern gesperrt. Heuristik prüfen!');
  }
  return { tested, worst };
  } finally {
    // Globale IMMER restaurieren — auch im Sperr-Fall (throw), sonst hinterließe der Test
    // eine fremde Parität im laufenden Prozess.
    if(typeof globalThis!=='undefined') globalThis.PARITY_P1 = prev;
  }
}

// ── Export (Node-Test + spätere Einbindung) ──
// ═══════════════════════════════════════════════════════════════════
// §99 GERAETE-BENCHMARK — feste, identische Last auf jedem Geraet.
// Die Spielstaerke haengt ueber timeBudgetMs an der Rechenleistung (§92-Befund: die Stufen
// trennen sich ueber das Budget nicht; H7: in der Eroeffnung reisst meister das Budget und
// rechnet nur Tiefe 4, wo die Zugwahl nachweislich kippt). Im Testrelease spielt derselbe
// „meister" auf schneller und langsamer Hardware unterschiedlich stark — ein Stoerfaktor,
// der mit dem SPIELER korreliert. Diese Zahl macht ihn auswertbar.
// Bewusst KEIN userAgent, keine Bildschirmdaten: gemessen wird genau das, worauf es ankommt,
// und sonst nichts.
const BENCH_REPS = 5;   // gemessene Wiederholungen (nach einem Aufwaermlauf)
function deviceBenchMs(){
  // Last: Tiefe 1 ab Startbrett, mehrfach. Warum genau das:
  //   - deterministisch und ueberall identisch (kein Zufall, rankPool 1, blockRate 1.0),
  //   - laeuft durch den ECHTEN Suchpfad (cloneBoard, applyMoveOn, boardHash, evaluate),
  //   - klein genug fuer den Hintergrund: rund 150 ms auf einem schnellen Rechner.
  // Tiefe 2 waere mit ~900 ms zu teuer, ein reiner evaluate()-Zaehler zu unrepraesentativ.
  const cfg = { timeBudgetMs: 1e9, maxDepth: 1, minDepth: 1, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };
  const prev = globalThis.PARITY_P1;
  globalThis.PARITY_P1 = 'odd';
  try {
    pickMove(initBoard(), P1, 'odd', cfg, []);      // Aufwaermlauf, nicht gemessen (JIT)
    const t = _now();
    for(let i = 0; i < BENCH_REPS; i++) pickMove(initBoard(), P1, 'odd', cfg, []);
    return Math.round(_now() - t);
  } finally { globalThis.PARITY_P1 = prev; }
}

if(typeof module !== 'undefined' && module.exports){
  module.exports = { pickMove, evaluate, negamax, antisymmetrySelfTest, SKILL_LEVELS, deviceBenchMs,
    HEURISTIC_VERSION,
    parityCtrlJS, asingleControlJS, doubleThreatJS,
    colHasThreat, // §87: für Node-Tests (1I-Einheit)
    hoheitJS, // §107: für Node-Tests (Gate, Antisymmetrie, AG8VAPGM-Anker)
    drawClockFactor, DRAW_CLOCK_SOFT, // §91: für Node-Tests (Uhr-Dämpfung)
    findImmediateWin, movesAllowingOpponentWin,
    _jitterOf, _setJitterForTest: (amp, seed) => { _jitterAmp = amp; _jitterSeed = seed >>> 0; } }; // §114
}
