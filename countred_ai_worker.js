// ═══════════════════════════════════════════════════════════════════
// countred_ai_worker.js — Web-Worker-Hülle für die KI-Suche (§47)
// ═══════════════════════════════════════════════════════════════════
//
// HERKUNFT: HANDOVER §47 (Web-Worker-Bauplan). Ersetzt den synchronen
//   pickMove-Aufruf im UI-Thread (Notlösung §45) durch einen Hintergrund-
//   Thread, damit die KI-Suche mit vollen §37d-Budgets rechnen kann, ohne
//   Klicks/Animationen im Hauptfenster einzufrieren.
//
// ARCHITEKTURPRINZIP: Diese Datei enthält KEINE eigene Logik — sie lädt
//   nur die bestehenden, framework-freien Kern-Dateien per importScripts
//   und leitet Aufträge/Ergebnisse per postMessage weiter. Regel- und
//   Heuristikschicht bleiben unverändert (gembel_rules.js / countred_ai_core.js).
//
// PFAD-HINWEIS (§47c Punkt 4): importScripts lädt relativ zum Pfad DIESER
//   Datei. gembel_rules.js und countred_ai_core.js müssen im selben
//   Verzeichnis liegen wie countred_ai_worker.js (wie auch schon countred.html
//   sie per <script src> aus dem selben Verzeichnis lädt).
//   Bei file://-Öffnen (lokaler Test ohne Server) blockieren manche Browser
//   Worker-Skripte — dann lokal per `python3 -m http.server` testen. Auf
//   Walters Setup (GitHub Pages, https) ist das unkritisch.
//
// PROTOKOLL:
//   Haupt-Thread → Worker:  { id, board, player, p1parity, skill, seenPositions, drawClock }
//     drawClock (§91): {halfmoves, limit} — Remis-Uhr für die Suche; optional (fehlt → Uhr ∞).
//   Worker → Haupt-Thread:  { id, res }              bei Erfolg (res = pickMove-Rückgabe)
//                            { id, error: <string> }  bei Fehler (z.B. Antisymmetrie-Sperre)
//   Der Haupt-Thread ordnet Antworten per `id` einem laufenden Auftrag zu und verwirft
//   veraltete Antworten selbst (Job-Tracking lebt in countred.html, §47c Punkt 6) —
//   dieser Worker muss dafür nichts wissen, er beantwortet einfach jede Anfrage.
// ═══════════════════════════════════════════════════════════════════

'use strict';

// §61e-3/§65e: Cache-Busting-Query (?v=NN) synchron zur Startdatei halten (dort v123).
// §134-NAMENSHINWEIS: Die Startdatei heisst seit v98 index.html, NICHT mehr countred.html.
// Die Kommentare unten nennen stellenweise noch den alten Namen — gemeint ist immer index.html.
// Sonst kann der Worker alte Kern-/Regeldateien aus dem Cache laden, während das Hauptfenster
// neue nutzt — gemischte Versionen (§51-Klasse).
importScripts('gembel_rules.js?v=123', 'countred_ai_core.js?v=123');

// §61b-2/§F4: Antisymmetrie-Selbsttest VERDRAHTEN. Der Kern-Kommentar („bleibt verbaut, sperrt
// bei Verletzung") stimmte bis 12.7. nicht — die Funktion wurde nirgends aufgerufen, die Sperre
// sperrte nichts. Jetzt: einmalig pro Parität beim ERSTEN Auftrag (lazy, ~50–150 ms im Worker,
// blockiert den UI-Thread nicht). Bei Verletzung wirft pickMove-vorgelagert der Test → die
// Antwort geht als { id, error } zurück — exakt der im Protokoll-Kopf seit §47 dokumentierte
// Fall „Antisymmetrie-Sperre". countred.html respektiert die Sperre im Fallback-Pfad
// (kein synchrones Weiterspielen mit kaputter Heuristik, s. maybeTriggerAI §F4).
const _antisymTestDone = {};

self.onmessage = function(e){
  const { id, board, player, p1parity, skill, seenPositions, drawClock } = e.data; // §91: Uhr durchreichen
  try {
    // PARITY_P1 wird vom KI-Kern als GLOBAL erwartet (siehe countred_ai_core.js
    // evaluate()/negamax()) — im Worker-Scope ist `self` das globale Objekt,
    // genau wie `window.PARITY_P1` im Haupt-Thread (countred.html §42d-Kommentar).
    self.PARITY_P1 = p1parity;
    if(!_antisymTestDone[p1parity]){
      antisymmetrySelfTest(p1parity); // wirft bei Verletzung → Sperre (s.o.); restauriert PARITY_P1 selbst
      _antisymTestDone[p1parity] = true;
    }
    const res = pickMove(board, player, p1parity, skill, seenPositions, drawClock);
    self.postMessage({ id, res });
  } catch(err){
    self.postMessage({ id, error: String((err && err.message) || err) });
  }
};
