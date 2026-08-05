// ═══════════════════════════════════════════════════════════════════
// test_random_123.js — §123 Fehlerrate (HEURISTIC 2.2)
// ═══════════════════════════════════════════════════════════════════
// WOZU DIESER HEBEL ÜBERHAUPT EXISTIERT:
//   Alle früheren Hebel (Wertfenster §109, Eval-Jitter §114, maxDepth §111/§121) wirken
//   ausschließlich auf die POSITIONELLE Bewertung. Die TAKTISCHE Kompetenz steckt in der
//   Suche selbst und war damit unerreichbar — gemessen am 3.8.: an 60 Stellungen mit
//   vermeidbaren Verlustzügen wählte einsteiger in NULL von 240 Läufen einen davon, und
//   zwar auch mit blockRate 0,0 und auch bei Tiefe 1. Schon eine einzige Ply reicht, damit
//   negamax den Gegner-Sofortsieg als −100000 sieht; das Sicherheitsnetz ist redundant.
//   Gegen einen Anfänger ist genau das die Wand: jede seiner Drohungen wird erkannt.
//
// WOGEGEN DIESE SUITE SCHÜTZT:
//   1. Aufweichen der drei Ausnahmen. Der Zufall darf NIE einen Sofortsieg verschenken,
//      NIE einen erzwungenen Dreier übergehen und NIE in einen Verlustzug führen. Fällt
//      eine davon, wird aus „Max spielt planlos" ein sichtbarer Patzer — und genau das
//      verbietet Walters Design-Auflage.
//   2. Würfeln je Tiefen-Iteration statt je Zug. Beim Bau zuerst falsch: die effektive
//      Rate lag bei 51 % statt 30 %, weil jede Iteration ihre eigene Chance bekam.
//   3. Stilles Ausbreiten auf stärkere Stufen.
//
// Diese Suite trägt den EXAKTEN Versions-Pin (Konvention: jeweils neueste Suite).
// Aufruf: node test_random_123.js
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
const html    = fs.readFileSync(HTML_PATH, 'utf8');
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

ok(core.HEURISTIC_VERSION === 'countred-ai-2.2',
   "HEURISTIC_VERSION === 'countred-ai-2.2' (exakter Pin, neueste Suite)");

console.log('\u00a7123 \u2014 nur einsteiger tr\u00e4gt die Fehlerrate:');
ok(L.einsteiger.randomRate === 0.3, 'einsteiger randomRate 0.30 (jeder dritte Zug planlos)');
for(const k of ['fortgeschritten','stark','meister'])
  ok(!('randomRate' in L[k]), k + ': KEINE Fehlerrate');
ok(L.einsteiger.randomRate < 0.5,
   'die Rate bleibt unter 50 % \u2014 dar\u00fcber w\u00e4re es kein Spieler mehr, sondern ein W\u00fcrfel');

console.log('\u00a7123 \u2014 Quellcode-W\u00e4chter:');
ok(/const _randomRoll = \(typeof cfg\.randomRate === 'number'/.test(coreSrc),
   'der W\u00fcrfel f\u00e4llt EINMAL pro pickMove (nicht je Tiefen-Iteration)');
ok(/_base\.filter\(x => x\.v > -90000\)/.test(coreSrc),
   'Z\u00fcge im Mate-Band sind ausgeschlossen \u2014 Max l\u00e4uft nie sehenden Auges ins Messer');
ok(/_randomUsed \? 'random'/.test(coreSrc),
   "meta.safety meldet 'random' \u2014 der Hebel ist im Log abfragbar");
{
  // Reihenfolge: der Sofortsieg-Pfad muss VOR der Fehlerrate stehen.
  const codeOnly = coreSrc.replace(/\/\/[^\n]*/g, '');
  ok(codeOnly.indexOf("safety: 'took-win'") < codeOnly.indexOf('_randomRoll'),
     'der Sofortsieg-Pfad liegt VOR der Fehlerrate (Wiedereinbau-Schutz gegen Umsortieren)');
  ok(codeOnly.indexOf('cfg.forceTriple === true') < codeOnly.indexOf('if(_randomRoll)'),
     'forceTriple schr\u00e4nkt _base VOR dem Zufall ein \u2014 gew\u00fcrfelt wird dann UNTER den Dreiern');
}

console.log('\u00a7123 \u2014 die Rate stimmt:');
{
  let n = 0, r = 0;
  for(let i = 0; i < 150; i++){
    const x = core.pickMove(initBoard(), 1, 'odd', 'einsteiger', []);
    n++; if(x.meta.safety === 'random') r++;
  }
  const q = r / n;
  ok(q > 0.15 && q < 0.45,
     'gemessene Rate ' + Math.round(100*q) + ' % liegt um die konfigurierten 30 % ' +
     '(bei ' + n + ' L\u00e4ufen ist das die erwartbare Streuung)');
}

console.log('\u00a7123 \u2014 AUSNAHME 1: der Sofortsieg wird trotzdem IMMER genommen:');
{
  function lcg(x){ let s = x >>> 0; return () => (s = (s*1664525+1013904223) >>> 0) / 4294967296; }
  const rnd = lcg(123123);
  let tested = 0, missed = 0;
  for(let g = 0; g < 900 && tested < 15; g++){
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
    // Mehrfach laufen lassen: bei 30 % Rate muesste ein Leck hier auffallen.
    for(let i = 0; i < 8; i++){
      const r = core.pickMove(b, p, 'odd', 'einsteiger', []);
      const nb = applyMoveOn(b, r.move.fr, r.move.fc, r.move.tr, r.move.tc, p);
      if(!checkFourOn(nb)) missed++;
    }
  }
  ok(tested >= 12, 'Testmaterial: ' + tested + ' Stellungen mit Sofortsieg');
  ok(missed === 0, 'kein Sofortsieg verpasst in ' + (tested*8) + ' L\u00e4ufen');
}

console.log('\u00a7123 \u2014 AUSNAHME 2: der Dreier wird trotzdem IMMER genommen:');
{
  function lcg(x){ let s = x >>> 0; return () => (s = (s*1664525+1013904223) >>> 0) / 4294967296; }
  const rnd = lcg(321321);
  let tested = 0, missed = 0;
  for(let g = 0; g < 900 && tested < 12; g++){
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
    if(!alive || core.findImmediateWin(b, p, 'odd')) continue;
    const legal = getLegalMoves(b, p, 'odd');
    const tri = legal.filter(m => {
      const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, p);
      return !checkFourOn(nb) && !!applyLockOn(nb);
    });
    if(!tri.length) continue;
    tested++;
    for(let i = 0; i < 8; i++){
      const r = core.pickMove(b, p, 'odd', 'einsteiger', []);
      if(!tri.some(m => K(m) === K(r.move))) missed++;
    }
  }
  ok(tested >= 8, 'Testmaterial: ' + tested + ' Stellungen mit m\u00f6glichem Dreier');
  ok(missed === 0, 'in ' + (tested*8) + ' L\u00e4ufen immer ein Dreier gespielt \u2014 ' +
     'die Fehlerrate w\u00fcrfelt UNTER den Dreiern, nicht an ihnen vorbei');
}

console.log('\u00a7123 \u2014 AUSNAHME 3: kein Zug ins offene Messer:');
{
  function lcg(x){ let s = x >>> 0; return () => (s = (s*1664525+1013904223) >>> 0) / 4294967296; }
  const rnd = lcg(555000);
  let tested = 0, blunder = 0;
  for(let g = 0; g < 900 && tested < 15; g++){
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
    if(!alive || core.findImmediateWin(b, p, 'odd')) continue;
    const legal = getLegalMoves(b, p, 'odd');
    const bad = core.movesAllowingOpponentWin(b, p, 'odd');
    if(!bad.size || bad.size >= legal.length) continue;
    tested++;
    for(let i = 0; i < 8; i++){
      const r = core.pickMove(b, p, 'odd', 'einsteiger', []);
      if(bad.has(K(r.move))) blunder++;
    }
  }
  ok(tested >= 10, 'Testmaterial: ' + tested + ' Stellungen mit vermeidbarem Verlustzug');
  ok(blunder === 0, 'in ' + (tested*8) + ' L\u00e4ufen nie ein Verlustzug gew\u00e4hlt \u2014 ' +
     'planlos ist erlaubt, sehenden Auges verlieren nicht');
}

console.log('\u00a7123 \u2014 st\u00e4rkere Stufen unber\u00fchrt:');
{
  const cfg = Object.assign({}, L.meister, { timeBudgetMs: 1e9, minThinkMs: 0, maxDepth: 3, minDepth: 3 });
  const a = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  const b = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  ok(K(a.move) === K(b.move) && a.meta.score === b.meta.score,
     'meister weiterhin deterministisch (kein Zufall eingesickert)');
  ok(a.meta.safety !== 'random', "meister meldet nie safety 'random'");
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
  ok(parseInt(vRules,10) >= 100, 'Cache-Bust auf v\u2265100 hochgez\u00e4hlt (Kern ge\u00e4ndert \u2192 Pflicht)');
}

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
