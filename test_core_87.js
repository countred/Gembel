// ═══════════════════════════════════════════════════════════════════
// test_core_87.js — §87 Rest-1er-Paket (HEURISTIC 1.3):
//   1C Wurzel-Wiederholung remisbewertet · 1I colHasThreat/versiegelte Spalte
//   1G Antisymmetrie-Selbsttest im Sync-Fallback · 1H als gemessene Sackgasse dokumentiert
// Aufruf: node test_core_87.js (index.html, countred_ai_worker.js, gembel_rules.js,
//         countred_ai_core.js im selben Ordner)
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

// Regelschicht global bereitstellen (wie im Browser), dann Core laden.
const rb = {console};
vm.createContext(rb);
vm.runInContext(fs.readFileSync(__dirname+'/gembel_rules.js','utf8') +
  '\n;__R={initBoard,getLegalMoves,applyMove,applyMoveOn,applyLockOn,checkFourOn,boardHash,cloneBoard,getBasePiece,getMovingPiece,canLift,canDrop,countRedNeighbors,countRedsInStack,parityOk,parityOkFor,coordToLabel,pieceColor,getValidTargets,hasAnyMove,checkThreeInRow,checkFourInRow,canPlaceOnEmpty,canStack}', rb);
Object.assign(globalThis, rb.__R);
const core = require('./countred_ai_core.js');
globalThis.PARITY_P1 = 'odd';

// §91-Anpassung: exakter Versions-Pin wandert per Konvention in die jeweils NEUESTE Suite
// (aktuell test_clock_91). Diese Suite prüft die 1.3-FEATURES selbst (1C/1I unten).
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.3, "HEURISTIC_VERSION ist countred-ai-\u22651.3 (1C/1I-Features; aktuell: "+core.HEURISTIC_VERSION+")");

// ── 1C: Wurzel-Wiederholung ──
console.log('\u00a787-1C \u2014 Wurzel-Wiederholung wird remisbewertet:');
const cfg = { timeBudgetMs: 800, maxDepth: 2, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };
// Startbrett: ALLE Nachfolgestellungen als \u201ebereits gesehen\u201c einspeisen \u2192 jeder Wurzelzug ist
// eine Wiederholung \u2192 der beste erreichbare Wert MUSS REP_DRAW_SCORE (0) sein.
// (Auf dem vollen Startbrett formt kein Zug einen Dreier \u2192 nextPlayer ist immer der Gegner.)
{
  const b0 = initBoard();
  const seenAll = [];
  for(const m of getLegalMoves(b0, 1, 'odd')){
    const nb = applyMoveOn(b0, m.fr, m.fc, m.tr, m.tc, 1);
    seenAll.push(boardHash(nb, 2));
  }
  const rRep = core.pickMove(b0, 1, 'odd', cfg, seenAll);
  ok(rRep.move && rRep.meta.score === 0, 'alle Wurzelzuege wiederholen \u2192 meta.score === REP_DRAW_SCORE (0)');
  const rFree = core.pickMove(b0, 1, 'odd', cfg, []);
  ok(typeof rFree.meta.score === 'number' && rFree.meta.score !== 0,
     'Kontrolle ohne Historie: Suchwert \u2260 0 (' + rFree.meta.score + ') \u2014 die 0 oben kam wirklich von 1C');
  // Gerichteter Fall: NUR die Zielstellung des vorher besten Zuges als gesehen markieren \u2192
  // die KI weicht aus (waehlt einen anderen Zug) ODER akzeptiert bewusst den Remiswert 0.
  const nbBest = applyMoveOn(b0, rFree.move.fr, rFree.move.fc, rFree.move.tr, rFree.move.tc, 1);
  const rAvoid = core.pickMove(b0, 1, 'odd', cfg, [boardHash(nbBest, 2)]);
  const sameMove = rAvoid.move.fr===rFree.move.fr && rAvoid.move.fc===rFree.move.fc
                && rAvoid.move.tr===rFree.move.tr && rAvoid.move.tc===rFree.move.tc;
  ok(!sameMove || rAvoid.meta.score===0,
     'markierter Bestzug wird gemieden (neuer Zug: score '+rAvoid.meta.score+') oder bewusst als Remis (0) gewaehlt');
  ok(!sameMove ? rAvoid.meta.score>=0 : true,
     'Ausweichzug ist nie schlechter als der Remiswert (score \u2265 0)');
}

// ── 1H: gebaut, gemessen, VERWORFEN (Sackgasse) ──
console.log('\u00a787-1H \u2014 Bewertungs-Cache: dokumentierte Sackgasse (nicht ausgeliefert):');
const coreSrc = fs.readFileSync(__dirname+'/countred_ai_core.js','utf8');
ok(!/evaluateCached|_evalCache/.test(coreSrc),
   'kein Bewertungs-Cache im Core (Messung: Trefferquote 12\u201325 %, Faktor 0.88x\u20131.01x \u2192 verworfen)');
ok(/1H Bewertungs-Cache: GEBAUT, GEMESSEN, VERWORFEN/.test(coreSrc),
   'Sackgasse in der Versionshistorie dokumentiert (Wiedereinbau-Schutz)');
// Selbsttest der echten evaluate() muss fuer beide Paritaeten weiter bestehen (deckt auch 1I ab).
let selfOk = true;
try { core.antisymmetrySelfTest('odd'); globalThis.PARITY_P1='even'; core.antisymmetrySelfTest('even'); }
catch(e){ selfOk = false; }
globalThis.PARITY_P1='odd';
ok(selfOk, 'Antisymmetrie-Selbsttest besteht fuer odd UND even (1.3 inkl. 1I-Aenderung)');

// ── 1I: colHasThreat / versiegelte Spalte ──
console.log('\u00a787-1I \u2014 colHasThreat: Versiegelung (R32-Abgleich):');
{
  function mk(){ return initBoard(); }
  function redBase(b,r,c){ b[r][c].piece={color:'red',stripe:b[r][c].stripe}; b[r][c].stack=null; }
  // Spalte 0: Reihen 0-2 rote Basen; Restfeld (Reihe 3) variieren.
  const bOpen = mk(); [0,1,2].forEach(r=>redBase(bOpen,r,0)); bOpen[3][0].piece=null; bOpen[3][0].stack=null;
  ok(core.colHasThreat(bOpen,0,'odd') === true, 'Restfeld LEER \u2192 Drohung (unveraendert)');
  const bSingle = mk(); [0,1,2].forEach(r=>redBase(bSingle,r,0));
  bSingle[3][0].piece={color:'black',stripe:3}; bSingle[3][0].stack=null;
  ok(core.colHasThreat(bSingle,0,'odd') === true, 'Restfeld EINZELSTEIN \u2192 weiterhin Drohung (latent: kann wegziehen)');
  const bSealed = mk(); [0,1,2].forEach(r=>redBase(bSealed,r,0));
  bSealed[3][0].stack={bottom:{color:'black',stripe:3},top:{color:'red',stripe:1},formedBy:1};
  bSealed[3][0].piece=bSealed[3][0].stack.bottom;
  ok(core.colHasThreat(bSealed,0,'odd') === false, 'Restfeld VERSIEGELT (Stapel) \u2192 KEINE Drohung mehr (der 1I-Fix)');
  ok(core.asingleControlJS(bSealed,1,'odd') !== 0, 'versiegelte Spalte flie\u00dft jetzt in asingleControl ein (Stapel z\u00e4hlt)');
  // n=2-Zweig unberuehrt: zwei Basen + passendes leeres Konsekutivfeld bleibt Drohung.
  const b2 = mk(); [0,1].forEach(r=>redBase(b2,r,0)); b2[2][0].piece=null; b2[2][0].stack=null;
  ok(core.colHasThreat(b2,0,'odd') === true, 'n=2-Potentialzweig unveraendert (Drohung erkannt)');
}

// ── Determinismus-Regression ──
{
  const a = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  const b = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  ok(a.move.fr===b.move.fr && a.move.fc===b.move.fc && a.move.tr===b.move.tr && a.move.tc===b.move.tc
     && a.meta.score===b.meta.score,
     'rankPool 1 deterministisch: identischer Zug + Score bei zweifachem Aufruf');
}

// ── 1G: Selbsttest im Sync-Fallback (Verdrahtung) ──
console.log('\u00a787-1G \u2014 Sync-Fallback:');
ok(/const syncAntisymDone=\{\};/.test(html), 'Zustand syncAntisymDone deklariert');
const fb = html.match(/Fallback auf synchrone Berechnung[\s\S]{0,1900}?res=pickMove\(board, aiPlayer, PARITY_P1, aiSkill, seenPositions[\s\S]{0,120}?\);/);
ok(!!fb && /antisymmetrySelfTest\(PARITY_P1\)/.test(fb[0]) && /aiThinking=false; return;/.test(fb[0]),
   'Fallback: Selbsttest laeuft VOR dem synchronen pickMove und sperrt bei Verletzung sichtbar');

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
