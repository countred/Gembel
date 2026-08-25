// ═══════════════════════════════════════════════════════════════════
// test_clock_91.js — §91 Remis-Uhr (HEURISTIC 1.4): die Suche kennt den 50-Halbzug-Zähler
// ═══════════════════════════════════════════════════════════════════
// Blindstelle 1 aus dem §90-Katalog; Live-Beleg LQLVG5CT (meister, 25 Züge konstant +218…225 →
// no-progress-Zwangsremis). Prüft: harte Uhr (Ablauf ⇒ Remiswert 0), Frische-Uhr-Identität zu
// 1.3 (ohne/mit voller Uhr identische Zugwahl), Dämpfungsfaktor, Antisymmetrie, Verdrahtung.
// Aufruf: node test_clock_91.js
'use strict';
const fs = require('fs');
const vm = require('vm');

// §134: Die Startdatei heisst seit v98 index.html. Diese Suite las bis v106 `countred.html`
// — je nach Ordnerinhalt brach sie entweder ab ODER pruefte eine ALTE Kopie und meldete
// gruen, waehrend die Auslieferung ungeprueft blieb. Beides ist schlimmer als ein Fehlschlag.
// Liegt die Altdatei noch daneben, wird ausdruecklich gewarnt.
const HTML_PATH = __dirname + '/index.html';
if(fs.existsSync(__dirname + '/countred.html'))
  console.log('  \u26a0\ufe0f  countred.html liegt noch im Ordner \u2014 ALTKOPIE, wird NICHT geprueft.');
const html = fs.readFileSync(HTML_PATH, 'utf8');
const worker = fs.readFileSync(__dirname + '/countred_ai_worker.js', 'utf8');

let pass = 0, fail = 0;
function ok(cond, name){
  if(cond){ pass++; console.log('  \u2713 ' + name); }
  else    { fail++; console.log('  \u2717 FAIL: ' + name); }
}

const rb = {console};
vm.createContext(rb);
vm.runInContext(fs.readFileSync(__dirname+'/gembel_rules.js','utf8') +
  '\n;__R={initBoard,getLegalMoves,applyMove,applyMoveOn,applyLockOn,checkFourOn,boardHash,cloneBoard,getBasePiece,getMovingPiece,canLift,canDrop,countRedNeighbors,countRedsInStack,parityOk,parityOkFor,coordToLabel,pieceColor,getValidTargets,hasAnyMove,checkThreeInRow,checkFourInRow,canPlaceOnEmpty,canStack}', rb);
Object.assign(globalThis, rb.__R);
const core = require('./countred_ai_core.js');
globalThis.PARITY_P1 = 'odd';

// §96-Anpassung, hier nachgeholt: der exakte Pin gehört in die jeweils NEUESTE Suite.
// Diese Suite prüft die §91-UHR selbst — die gibt es ab 1.4. (Der harte 1.4-Pin stand hier
// noch und lief seit dem 1.5-Bump rot, ohne dass es auffiel.)
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.4, "HEURISTIC_VERSION ist countred-ai-≥1.4 (§91-Uhr vorhanden; aktuell: "+core.HEURISTIC_VERSION+")");

const cfg = { timeBudgetMs: 800, maxDepth: 2, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };

console.log('\u00a791 \u2014 harte Uhr:');
// Startbrett: kein Zug kann einen Dreier formen (volles Brett, nur Stapelzuege, Basen unveraendert)
// → bei halfmoves=49/50 verbraucht JEDER Wurzelzug die letzte Einheit → alles Remiswert 0.
{
  const r49 = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves:49, limit:50});
  ok(r49.move && r49.meta.score === 0,
     '1 Halbzug vor der Automatik, kein Dreier erreichbar \u2192 meta.score exakt 0 (Remiswert)');
  const r45 = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves:45, limit:50});
  ok(typeof r45.meta.score === 'number' && Math.abs(r45.meta.score) < 60,
     '5 Halbz\u00fcge vor der Automatik: Blatt-D\u00e4mpfung dr\u00fcckt den Wert Richtung 0 (score '+r45.meta.score+')');
}

console.log('\u00a791 \u2014 Frische-Uhr-Identit\u00e4t zu 1.3 (Kompatibilit\u00e4t):');
{
  const noClock = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  const fresh   = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves:0, limit:50});
  ok(noClock.move.fr===fresh.move.fr && noClock.move.fc===fresh.move.fc &&
     noClock.move.tr===fresh.move.tr && noClock.move.tc===fresh.move.tc &&
     noClock.meta.score===fresh.meta.score && noClock.meta.score!==0,
     'volle Uhr (0/50, Blatt weit \u00fcber SOFT) \u2261 ohne Uhr: identischer Zug + Score ('+noClock.meta.score+')');
}

console.log('\u00a791 \u2014 drawClockFactor (reine Funktion):');
ok(core.drawClockFactor(Infinity) === 1, '\u221e \u2192 1 (Uhr aus)');
ok(core.drawClockFactor(core.DRAW_CLOCK_SOFT) === 1 && core.drawClockFactor(core.DRAW_CLOCK_SOFT+10) === 1,
   '\u2265 SOFT ('+core.DRAW_CLOCK_SOFT+') \u2192 1 (keine D\u00e4mpfung fern der Uhr)');
ok(core.drawClockFactor(core.DRAW_CLOCK_SOFT/2) === 0.5, 'SOFT/2 \u2192 0.5 (linear)');
ok(core.drawClockFactor(0) === 0 && core.drawClockFactor(-3) === 0, '\u22640 \u2192 0 (geklemmt)');

console.log('\u00a791 \u2014 Architektur-Wahrung:');
let selfOk = true;
try { core.antisymmetrySelfTest('odd'); globalThis.PARITY_P1='even'; core.antisymmetrySelfTest('even'); }
catch(e){ selfOk = false; }
globalThis.PARITY_P1='odd';
ok(selfOk, 'Antisymmetrie-Selbsttest odd+even besteht (evaluate() selbst unver\u00e4ndert, Kernregel 5)');
{
  const a = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves:30, limit:50});
  const b = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves:30, limit:50});
  ok(a.move.fr===b.move.fr && a.move.fc===b.move.fc && a.move.tr===b.move.tr && a.move.tc===b.move.tc
     && a.meta.score===b.meta.score, 'deterministisch auch mit tickender Uhr (rankPool 1)');
}
const coreSrc = fs.readFileSync(__dirname+'/countred_ai_core.js','utf8');
ok(/if\(clockLeft <= 0\) return 0;/.test(coreSrc) && coreSrc.indexOf('checkFourOn(b)) return -100000') < coreSrc.indexOf('if(clockLeft <= 0) return 0;'),
   'Knoten-Reihenfolge: Vierer-Check VOR Uhr-Check (Sieg schl\u00e4gt Uhr, wie nextTurn)');
// §119-NACHZUG: §117 hatte den Faktor in `damp` ausgelagert, weil der Jitter ihn mittragen
// sollte. §119 hat das zurueckgenommen (gemessen schaedlich), der Ausdruck steht wieder direkt
// am Blattaufruf. Geprueft wird das Wesentliche: die Daempfung sitzt AM BLATTAUFRUF,
// evaluate() selbst bleibt zustandslos — und der Jitter traegt sie AUSDRUECKLICH NICHT.
ok(/evaluate\(b, player\) \* drawClockFactor\(clockLeft\)/.test(coreSrc) &&
   !/function evaluate\(b, forPlayer\)\{[\s\S]{0,4000}drawClockFactor/.test(coreSrc),
   'Daempfung als Faktor AM BLATTAUFRUF — evaluate() bleibt zustandslos');
ok(!/_jitterOf\(b, player\) \* damp/.test(coreSrc),
   '\u00a7119: der Jitter traegt die Daempfung NICHT (Wiedereinbau-Schutz gegen \u00a7117)');
ok(/clockLeft, clockLimit\)/.test(coreSrc.match(/opponent plays again[\s\S]{0,300}/)[0]),
   'Kein-Zug-Zweig reicht die Uhr UNVER\u00c4NDERT durch (kein ausgef\u00fchrter Halbzug)');

console.log('\u00a791 \u2014 Verdrahtung (html + Worker):');
ok(/pickMoveAsync\(board, aiPlayer, PARITY_P1, aiSkill, seenPositions,\s*\n\s*\{halfmoves: halfmovesSinceTriple, limit: HALFMOVE_DRAW_LIMIT\}\)/.test(html),
   'maybeTriggerAI \u00fcbergibt den REALEN Z\u00e4hler-Stand (Worker-Pfad)');
ok(/res=pickMove\(board, aiPlayer, PARITY_P1, aiSkill, seenPositions,\s*\n\s*\{halfmoves: halfmovesSinceTriple, limit: HALFMOVE_DRAW_LIMIT\}\)/.test(html),
   'Sync-Fallback \u00fcbergibt die Uhr ebenfalls');
ok(/postMessage\(\{id, board, player, p1parity, skill, seenPositions, drawClock\}\)/.test(html),
   'Worker-Protokoll um drawClock erweitert (Sende-Seite)');
ok(/const \{ id, board, player, p1parity, skill, seenPositions, drawClock \} = e\.data;/.test(worker) &&
   /pickMove\(board, player, p1parity, skill, seenPositions, drawClock\)/.test(worker),
   'Worker reicht drawClock an pickMove durch (Empfangs-Seite)');

console.log('Deploy-Guard \u2014 Cache-Bust synchron + Build-Marker:');
const vRules  = (html.match(/gembel_rules\.js\?v=(\d+)/)||[])[1];
const vCore   = (html.match(/countred_ai_core\.js\?v=(\d+)/)||[])[1];
const vWorker = (html.match(/countred_ai_worker\.js\?v=(\d+)/)||[])[1];
const vMarker = (html.match(/Build v(\d+)/)||[])[1];
const vImport = worker.match(/importScripts\('gembel_rules\.js\?v=(\d+)', 'countred_ai_core\.js\?v=(\d+)'\)/);
ok(!!vRules && vRules===vCore && vCore===vWorker && vWorker===vMarker &&
   !!vImport && vImport[1]===vRules && vImport[2]===vRules,
   'alle 4 Ladepfade + Build-Marker identisch (v'+vRules+')');
// §139 — FUENFTER LADEWEG: anleitung.html ist eine eigene Seite mit eigenem
// <script src="gembel_rules.js?v=NN"> und wird aus index.html mit ?v= verlinkt.
// Der Guard hat bis v108 nur vier Wege verglichen; die Anleitung waere still auf
// einer alten Regelschicht gelaufen und haette dann etwas anderes gelehrt, als das
// Spiel tut — genau der Fall, gegen den ihr Selbsttest gebaut ist.
{
  const anlPath = __dirname + '/anleitung.html';
  ok(fs.existsSync(anlPath),
     'anleitung.html liegt im Ordner (seit \u00a7139 Teil der Auslieferung)');
  if(fs.existsSync(anlPath)){
    const anl      = fs.readFileSync(anlPath, 'utf8');
    const vAnl     = (anl.match(/gembel_rules\.js\?v=(\d+)/)||[])[1];
    const vAnlLink = (html.match(/anleitung\.html\?v=(\d+)/)||[])[1];
    ok(vAnl === vRules && vAnlLink === vRules,
       'anleitung.html: Regelschicht (v'+vAnl+') und Verweis aus index.html (v'+vAnlLink+
       ') auf demselben Stand wie das Spiel (v'+vRules+')');
  }
}


console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
