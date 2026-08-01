// ═══════════════════════════════════════════════════════════════════
// test_jitter_114.js — §114 Eval-Jitter (Hebel 3, HEURISTIC 1.9)
// ═══════════════════════════════════════════════════════════════════
// WOGEGEN DIESE SUITE SCHÜTZT:
//   1. Verrutschen des Jitters an die WURZEL. Dort wäre er fast dasselbe wie das Wertfenster
//      (§109) — Max wüsste weiter, welcher Zug der beste ist, und wählte nur anders. Der
//      Zweck ist das Gegenteil: Max soll sich VERSCHÄTZEN und seinem falschen Urteil dann
//      konsequent folgen (Maia-Lehre). Deshalb sitzt er am BLATT, in negamax bei depth===0.
//   2. Verlust der Antisymmetrie. evaluate(b,1) === -evaluate(b,2) ist Kernregel 6. Der
//      Stellungsschlüssel wird mit FESTEM Spieler gebildet, das Vorzeichen kommt erst danach.
//      Wer den Schlüssel wieder aus boardHash(b, player) bildet, bricht das still.
//   3. Jitter im MATE-BAND. Ein verjitterter Gewinnwert könnte Max einen Vierer übersehen
//      lassen — genau der sichtbare Patzer, den Walters Design-Auflage verbietet.
//   4. Würfeln je Aufruf statt je Zug. Alpha-Beta braucht konsistente Blattwerte INNERHALB
//      einer Suche; sonst hängt das Ergebnis von der Suchreihenfolge ab. Umgekehrt darf der
//      Jitter NICHT über die ganze Partie eingefroren sein — Walters Einwand: Max wirkte
//      sonst eindimensional. Richtig ist: frischer Seed je pickMove, innerhalb der Suche fest.
//   5. Stilles Anschalten. Solange keine Stufe kalibriert ist, trägt KEINE das Feld
//      jitterAmp — der Kern rechnet dann bit-identisch wie 1.8.
//
// Diese Suite trägt den EXAKTEN Versions-Pin (Konvention: jeweils neueste Suite).
// Aufruf: node test_jitter_114.js
'use strict';
const fs = require('fs');
const vm = require('vm');

const html    = fs.readFileSync(__dirname + '/countred.html', 'utf8');
const worker  = fs.readFileSync(__dirname + '/countred_ai_worker.js', 'utf8');
const coreSrc = fs.readFileSync(__dirname + '/countred_ai_core.js', 'utf8');

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
const L = core.SKILL_LEVELS;
const K = m => m.fr+','+m.fc+','+m.tr+','+m.tc;
const BASE = { timeBudgetMs: 1e9, maxDepth: 3, minDepth: 3, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };

ok(core.HEURISTIC_VERSION === 'countred-ai-1.9',
   "HEURISTIC_VERSION === 'countred-ai-1.9' (exakter Pin, neueste Suite)");

console.log('\u00a7114 \u2014 Quellcode-W\u00e4chter (der Jitter sitzt am BLATT, nicht an der Wurzel):');
ok(/if\(depth===0\)\{[\s\S]{0,260}_jitterOf\(b, player\)/.test(coreSrc),
   'der Jitter wird im Blattzweig von negamax addiert (depth===0)');
ok(/Math\.abs\(v\) < 90000\) \? v \+ _jitterOf/.test(coreSrc),
   'nur unterhalb des Mate-Bands \u2014 Gewinn- und Verlustwerte bleiben unverjittert');
ok(/const key = boardHash\(b, P1\);/.test(coreSrc),
   'Stellungsschl\u00fcssel mit FESTEM Spieler (sonst bricht die Antisymmetrie)');
ok(/return player === P1 \? j : -j;/.test(coreSrc),
   'das Vorzeichen kommt erst nach dem Schl\u00fcssel aus `player`');
ok(/_jitterSeed = \(typeof cfg\.jitterSeed === 'number'\)/.test(coreSrc) &&
   /Math\.random\(\) \* 4294967296/.test(coreSrc),
   'frischer Seed je pickMove, per cfg.jitterSeed einfrierbar (Messstand/Suiten)');
ok(!/function evaluate\(b, forPlayer\)\{[\s\S]{0,4000}_jitterOf/.test(coreSrc),
   'evaluate() selbst bleibt unber\u00fchrt und zustandslos (Kernregel 6)');
ok(/eindimensional/.test(coreSrc) && /Maia/.test(coreSrc),
   'Begr\u00fcndung samt Walters Einwand steht als Kommentar an der Fundstelle');

console.log('\u00a7114 \u2014 Antisymmetrie des Jitters selbst:');
{
  let worst = 0, n = 0;
  core._setJitterForTest(60, 20260801);
  const seeds = [1, 777, 20260801, 4242];
  for(const s of seeds){
    core._setJitterForTest(60, s);
    let b = initBoard();
    for(let k = 0; k < 6; k++){
      const j1 = core._jitterOf(b, 1), j2 = core._jitterOf(b, 2);
      worst = Math.max(worst, Math.abs(j1 + j2)); n++;
      if(Math.abs(j1) > 60) worst = Infinity;
      const mv = getLegalMoves(b, 1, 'odd');
      if(!mv.length) break;
      b = applyMoveOn(b, mv[0].fr, mv[0].fc, mv[0].tr, mv[0].tc, 1);
      applyLockOn(b);
    }
  }
  core._setJitterForTest(0, 0);
  ok(n >= 20 && worst === 0,
     'jitter(b,1) + jitter(b,2) === 0 in ' + n + ' Stellungen \u00fcber ' + seeds.length + ' Seeds');
  core._setJitterForTest(45, 99);
  const b0 = initBoard();
  ok(Math.abs(core._jitterOf(b0, 1)) <= 45, 'der Betrag bleibt innerhalb der Amplitude');
  core._setJitterForTest(0, 0);
  ok(core._jitterOf(b0, 1) === 0, 'Amplitude 0 \u2192 exakt 0 (der Jitter ist wirklich aus)');
}

console.log('\u00a7114 \u2014 Verhalten:');
{
  const a = core.pickMove(initBoard(), 1, 'odd', Object.assign({}, BASE, {jitterAmp:60, jitterSeed:777}), []);
  const b = core.pickMove(initBoard(), 1, 'odd', Object.assign({}, BASE, {jitterAmp:60, jitterSeed:777}), []);
  ok(K(a.move) === K(b.move) && a.meta.score === b.meta.score,
     'fester jitterSeed \u2192 reproduzierbar (Messstand und Suiten k\u00f6nnen damit rechnen)');

  const d1 = core.pickMove(initBoard(), 1, 'odd', BASE, []);
  const d2 = core.pickMove(initBoard(), 1, 'odd', BASE, []);
  ok(K(d1.move) === K(d2.move) && d1.meta.score === d2.meta.score,
     'OHNE jitterAmp weiterhin deterministisch (meister unangetastet)');

  const seen = new Set();
  for(let i = 0; i < 12; i++){
    const r = core.pickMove(initBoard(), 1, 'odd', Object.assign({}, BASE, {jitterAmp:60}), []);
    seen.add(K(r.move));
  }
  ok(seen.size >= 2,
     'freier Seed streut \u00fcber Z\u00fcge hinweg (' + seen.size + ' verschiedene Z\u00fcge in 12 L\u00e4ufen) \u2014 ' +
     'kein eingefrorener Irrtum');

  const s1 = core.pickMove(initBoard(), 1, 'odd', Object.assign({}, BASE, {jitterAmp:60, jitterSeed:1}), []);
  const s2 = core.pickMove(initBoard(), 1, 'odd', Object.assign({}, BASE, {jitterAmp:60, jitterSeed:2}), []);
  ok(typeof s1.meta.score === 'number' && typeof s2.meta.score === 'number',
     'verschiedene Seeds liefern beide g\u00fcltige Ergebnisse');
}

console.log('\u00a7114 \u2014 MATE-BAND: der Sofortsieg wird auch bei starkem Jitter genommen:');
{
  function lcg(s){ let x = s >>> 0; return () => (x = (x*1664525+1013904223) >>> 0) / 4294967296; }
  const rnd = lcg(4242);
  let tested = 0, missed = 0;
  for(let g = 0; g < 500 && tested < 12; g++){
    let b = initBoard(), p = 1, alive = true;
    const plies = 6 + Math.floor(rnd()*14);
    for(let k = 0; k < plies; k++){
      const mv = getLegalMoves(b, p, 'odd');
      if(!mv.length || checkFourOn(b)){ alive = false; break; }
      const m = mv[Math.floor(rnd()*mv.length)];
      b = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, p);
      const t = applyLockOn(b);
      if(checkFourOn(b)){ alive = false; break; }
      if(!t) p = p === 1 ? 2 : 1;
    }
    if(!alive || !core.findImmediateWin(b, p, 'odd')) continue;
    tested++;
    const r = core.pickMove(b, p, 'odd', Object.assign({}, BASE, {jitterAmp:200}), []);
    const nb = applyMoveOn(b, r.move.fr, r.move.fc, r.move.tr, r.move.tc, p);
    if(!checkFourOn(nb)) missed++;
  }
  ok(tested >= 10, 'Testmaterial: ' + tested + ' Stellungen mit Sofortsieg');
  ok(missed === 0,
     'kein Sofortsieg verpasst, obwohl die Amplitude (200) das Bewertungsband weit \u00fcbersteigt');
}

console.log('\u00a7114 \u2014 noch keine Stufe tr\u00e4gt den Jitter (erst messen, dann setzen):');
for(const k of Object.keys(L))
  ok(!('jitterAmp' in L[k]), k + ': kein jitterAmp \u2014 der Wert wird erst kalibriert');

console.log('\u00a7114 \u2014 Architektur unber\u00fchrt:');
{
  let selfOk = true;
  try { globalThis.PARITY_P1='odd';  core.antisymmetrySelfTest('odd');
        globalThis.PARITY_P1='even'; core.antisymmetrySelfTest('even'); }
  catch(e){ selfOk = false; }
  globalThis.PARITY_P1 = 'odd';
  ok(selfOk, 'Antisymmetrie-Selbsttest besteht f\u00fcr odd UND even');
  const cfg = { timeBudgetMs: 1e9, maxDepth: 2, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };
  const r49 = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves: 49, limit: 50});
  ok(r49.move && r49.meta.score === 0, '\u00a791-Uhr unver\u00e4ndert (1 Halbzug vor der Automatik \u2192 score 0)');
}

console.log('Deploy-Guard \u2014 Cache-Bust synchron + Build-Marker:');
{
  const vRules  = (html.match(/gembel_rules\.js\?v=(\d+)/)||[])[1];
  const vCore   = (html.match(/countred_ai_core\.js\?v=(\d+)/)||[])[1];
  const vWorker = (html.match(/countred_ai_worker\.js\?v=(\d+)/)||[])[1];
  const vMarker = (html.match(/Build v(\d+)/)||[])[1];
  const vImport = worker.match(/importScripts\('gembel_rules\.js\?v=(\d+)', 'countred_ai_core\.js\?v=(\d+)'\)/);
  ok(!!vRules && vRules===vCore && vCore===vWorker && vWorker===vMarker &&
     !!vImport && vImport[1]===vRules && vImport[2]===vRules,
     'alle 4 Ladepfade + Build-Marker identisch (v'+vRules+')');
  ok(parseInt(vRules,10) >= 94, 'Cache-Bust auf v\u226594 hochgez\u00e4hlt (Kern ge\u00e4ndert \u2192 Pflicht, sonst \u00a751-Mischversion)');
}

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
