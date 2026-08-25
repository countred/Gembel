// ═══════════════════════════════════════════════════════════════════
// test_margin_96.js — §96 Dreier-Marge am INNEREN Knoten (HEURISTIC 1.5)
// ═══════════════════════════════════════════════════════════════════
// WOGEGEN DIESE SUITE SCHÜTZT: negamax addierte DREIER_FORM_BONUS NACH der Kindsuche
// (valB = val + 80), suchte das Kind aber gegen das UNVERSCHOBENE Fenster (alpha, beta).
// Dreier-bildende Kinder gingen dadurch fail-low, und die lockere Fail-Soft-Schranke + 80
// wurde im Elternknoten wie ein exakter Wert behandelt. Folge: der Suchwert war
// FENSTERABHÄNGIG — dieselbe Stellung lieferte je nach Alpha unterschiedliche Werte, und die
// Zugwahl konnte auf einen Zug fallen, den die Bewertung bei korrekter Rechnung nicht für den
// besten hält (gemessen: Tiefe 3, 49 reale Stellungen → 12 Stellungen / 26 Zugwerte falsch,
// 1 falsche Zugwahl; Tiefe 5, 9HEYHDSX i=11 → 4 von 9 Zugwerten falsch).
//
// PRÜFPRINZIP: Die REFERENZ wird zur Laufzeit aus der ausgelieferten countred_ai_core.js
// erzeugt, indem beide `if(beta <= alpha) break;` entfernt werden — also derselbe Kern OHNE
// jedes Pruning und damit der wahre Minimax-Wert. Ein Rückfall (Marge entfernt, neuer Term
// hinter dem Fenster addiert, Fenster falsch verschoben) fällt sofort auf, ohne dass jemand
// erwartete Zahlen pflegen muss.
//
// Aufruf: node test_margin_96.js
//   (index.html, countred_ai_worker.js, gembel_rules.js, countred_ai_core.js im selben Ordner)
'use strict';
const fs = require('fs');
const vm = require('vm');

const rulesSrc = fs.readFileSync(__dirname + '/gembel_rules.js', 'utf8');
const coreSrc  = fs.readFileSync(__dirname + '/countred_ai_core.js', 'utf8');
// §134: Die Startdatei heisst seit v98 index.html. Diese Suite las bis v106 `countred.html`
// — je nach Ordnerinhalt brach sie entweder ab ODER pruefte eine ALTE Kopie und meldete
// gruen, waehrend die Auslieferung ungeprueft blieb. Beides ist schlimmer als ein Fehlschlag.
// Liegt die Altdatei noch daneben, wird ausdruecklich gewarnt.
const HTML_PATH = __dirname + '/index.html';
if(fs.existsSync(__dirname + '/countred.html'))
  console.log('  \u26a0\ufe0f  countred.html liegt noch im Ordner \u2014 ALTKOPIE, wird NICHT geprueft.');
const html     = fs.readFileSync(HTML_PATH, 'utf8');
const worker   = fs.readFileSync(__dirname + '/countred_ai_worker.js', 'utf8');

let pass = 0, fail = 0;
function ok(cond, name){
  if(cond){ pass++; console.log('  \u2713 ' + name); }
  else    { fail++; console.log('  \u2717 FAIL: ' + name); }
}

// ── Regelschicht global bereitstellen (wie im Browser), dann Core laden ──
const RULES_EXPORT = '\n;__R={initBoard,getLegalMoves,applyMove,applyMoveOn,applyLockOn,checkFourOn,boardHash,cloneBoard,getBasePiece,getMovingPiece,canLift,canDrop,countRedNeighbors,countRedsInStack,parityOk,parityOkFor,coordToLabel,pieceColor,getValidTargets,hasAnyMove,checkThreeInRow,checkFourInRow,canPlaceOnEmpty,canStack}';
const rb = {console};
vm.createContext(rb);
vm.runInContext(rulesSrc + RULES_EXPORT, rb);
Object.assign(globalThis, rb.__R);
const core = require('./countred_ai_core.js');
globalThis.PARITY_P1 = 'odd';

// §107-Anpassung: exakter Pin wandert in test_hoheit_107. Die §96-Marge gibt es ab 1.5.
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.5, "HEURISTIC_VERSION ist countred-ai-≥1.5 (§96-Marge vorhanden; aktuell: "+core.HEURISTIC_VERSION+")");

// ── REFERENZ: derselbe Kern, aber ohne Alpha-Beta-Abbruch ──
const PRUNE_LINE = /^\s*if\(beta <= alpha\) break;\s*$/gm;
const nPrune = (coreSrc.match(PRUNE_LINE) || []).length;
ok(nPrune === 2, 'Referenzbau: genau 2 Pruning-Zeilen im Kern gefunden (sonst greift die Referenz daneben) \u2014 gefunden: ' + nPrune);
const refSrc = coreSrc.replace(PRUNE_LINE, '    /* [Referenz] Pruning entfernt */');
const refCtx = {console};
vm.createContext(refCtx);
vm.runInContext(rulesSrc + RULES_EXPORT + '\n' + refSrc + '\n;__REF={negamax, evaluate};', refCtx);
const ref = refCtx.__REF;

// ── Quellcode-Wächter: beide Margen müssen im Kern stehen ──
console.log('\u00a796 \u2014 Quellcode-W\u00e4chter (Marge innen UND am Root):');
ok(/const marginIn = \(triple \? DREIER_FORM_BONUS : 0\);/.test(coreSrc),
   'innere Marge vorhanden (marginIn)');
// §105-Anpassung: die Tiefenangabe des BONUSKINDES ist seit 1.6 `depth` statt `depth-1`
// (Bonuszug verbraucht keine Ply). Geprüft wird hier die FENSTERVERSCHIEBUNG — das ist der
// Gegenstand von §96 —, nicht die Tiefe. Deshalb ist die Tiefe im Muster flexibel.
ok(/negamax\(nb, depth[^,]*,\s*alphaIn, betaIn, player, bonus/.test(coreSrc) &&
   /-negamax\(nb, depth-1, -betaIn, -alphaIn, opp, null/.test(coreSrc),
   'beide Kindaufrufe suchen gegen das VERSCHOBENE Fenster');
ok(/const margin = triple \? DREIER_FORM_BONUS : 0;/.test(coreSrc),
   '\u00a7F2-Marge am Root unver\u00e4ndert vorhanden (dieselbe Ursache, dort seit 1.1 behoben)');

// ── Deterministische Stellungen erzeugen (gesetzter Zufall, kein Math.random) ──
// Gesucht sind Stellungen, in denen ein Wurzelzug einen DREIER bildet — nur dort kann der
// Fensterfehler ueberhaupt wirken. Alles andere waere ein Test ohne Testgegenstand.
function lcg(seed){ let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function makePositions(count, parity){
  const rnd = lcg(20260725), out = [];
  for(let attempt = 0; attempt < 400 && out.length < count; attempt++){
    globalThis.PARITY_P1 = parity;
    let b = initBoard(), player = 1;
    const plies = 3 + Math.floor(rnd() * 10);
    let alive = true;
    for(let k = 0; k < plies; k++){
      const mv = getLegalMoves(b, player, parity);
      if(mv.length === 0 || checkFourOn(b)){ alive = false; break; }
      const m = mv[Math.floor(rnd() * mv.length)];
      b = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
      const triple = applyLockOn(b);
      if(checkFourOn(b)){ alive = false; break; }
      if(!triple) player = player === 1 ? 2 : 1;      // Dreier = Bonuszug, gleicher Spieler
    }
    if(!alive) continue;
    const legal = getLegalMoves(b, player, parity);
    if(legal.length < 3) continue;
    // Nur Stellungen mit mindestens einem dreier-bildenden Wurzelzug behalten.
    let hasTriple = false;
    for(const m of legal){
      const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
      if(!checkFourOn(nb) && applyLockOn(nb)){ hasTriple = true; break; }
    }
    if(hasTriple) out.push({b, player, parity});
  }
  return out;
}

// ── Wurzelwerte einer Stellung: einmal mit Kern, einmal mit Referenz ──
// mode 'full'   : jeder Kandidat mit vollem Fenster  (exakter Wert)
// mode 'window' : Produktions-Muster — Alpha waechst mit dem bisher besten Wert (mit Root-Marge)
function rootValues(engine, p, depth, mode){
  const DREIER = 80, opp = p.player === 1 ? 2 : 1;
  const pathSet = new Set([boardHash(p.b, p.player)]);
  const out = []; let best = -Infinity;
  for(const m of getLegalMoves(p.b, p.player, p.parity)){
    const nb = applyMoveOn(p.b, m.fr, m.fc, m.tr, m.tc, p.player);
    if(checkFourOn(nb)){ out.push({m, v: 100000}); best = Math.max(best, 100000); continue; }
    const triple = applyLockOn(nb);
    const bonus = triple ? (getLegalMoves(nb, p.player, p.parity).length > 0 ? p.player : null) : null;
    const nbHash = boardHash(nb, bonus ? p.player : opp);
    if(pathSet.has(nbHash)){ out.push({m, v: 0}); best = Math.max(best, 0); continue; }
    const branch = new Set(pathSet); branch.add(nbHash);
    const margin = triple ? DREIER : 0;
    const aWin = (mode === 'window' && best !== -Infinity) ? best - margin : -Infinity;
    let v = bonus
      ? engine.negamax(nb, depth, aWin, Infinity, p.player, bonus, branch, Infinity, Infinity)
      : -engine.negamax(nb, depth, -Infinity, -aWin, opp, null, branch, Infinity, Infinity);
    if(triple && Math.abs(v) < 90000) v += DREIER;
    out.push({m, v});
    if(v > best) best = v;
  }
  return out;
}
const bestOf = a => a.reduce((x, y) => y.v > x.v ? y : x);
const same = (x, y) => x.m.fr === y.m.fr && x.m.fc === y.m.fc && x.m.tr === y.m.tr && x.m.tc === y.m.tc;

console.log('\u00a796 \u2014 Wertgleichheit mit der pruning-freien Referenz (Tiefe 3):');
for(const parity of ['odd', 'even']){
  const positions = makePositions(6, parity);
  ok(positions.length >= 4, 'Testmaterial ' + parity + ': ' + positions.length +
     ' Stellungen mit dreier-bildendem Wurzelzug erzeugt');
  let badVals = 0, badMove = 0, checked = 0;
  for(const p of positions){
    globalThis.PARITY_P1 = parity;
    refCtx.PARITY_P1 = parity;                 // die Referenz liest ihre EIGENE Globale
    const vCore = rootValues(core, p, 3, 'full');
    const vRef  = rootValues(ref,  p, 3, 'full');
    const mRef  = new Map(vRef.map(x => [x.m.fr + ',' + x.m.fc + ',' + x.m.tr + ',' + x.m.tc, x.v]));
    for(const x of vCore){
      checked++;
      if(Math.abs(x.v - mRef.get(x.m.fr + ',' + x.m.fc + ',' + x.m.tr + ',' + x.m.tc)) > 1e-9) badVals++;
    }
    if(!same(bestOf(vCore), bestOf(vRef))) badMove++;
  }
  ok(badVals === 0, parity + ': alle ' + checked + ' Wurzelwerte exakt wie ohne Pruning (Abweichungen: ' + badVals + ')');
  ok(badMove === 0, parity + ': Zugwahl identisch zur Referenz in allen Stellungen (Abweichungen: ' + badMove + ')');
}

console.log('\u00a796 \u2014 Fensterunabh\u00e4ngigkeit (die eigentliche Kerneigenschaft):');
{
  // Der Wert des GEWAEHLTEN Zuges darf nicht davon abhaengen, ob mit oder ohne Wurzel-Alpha
  // gesucht wurde. Genau das war vor 1.5 verletzt (80 vs 79, 84 vs 78, …).
  let bad = 0, n = 0;
  for(const parity of ['odd', 'even']){
    for(const p of makePositions(5, parity)){
      globalThis.PARITY_P1 = parity;
      const f = bestOf(rootValues(core, p, 3, 'full'));
      const w = bestOf(rootValues(core, p, 3, 'window'));
      n++;
      if(Math.abs(f.v - w.v) > 1e-9 || !same(f, w)) bad++;
    }
  }
  ok(bad === 0, 'volles Fenster \u2261 Produktions-Alpha bei Zug UND Wert (' + n + ' Stellungen, Abweichungen: ' + bad + ')');
}

console.log('\u00a796 \u2014 Architektur unber\u00fchrt (evaluate, Antisymmetrie, \u00a791-Uhr):');
{
  let selfOk = true;
  try { globalThis.PARITY_P1 = 'odd';  core.antisymmetrySelfTest('odd');
        globalThis.PARITY_P1 = 'even'; core.antisymmetrySelfTest('even'); }
  catch(e){ selfOk = false; }
  globalThis.PARITY_P1 = 'odd';
  ok(selfOk, 'Antisymmetrie-Selbsttest besteht f\u00fcr odd UND even (evaluate() unver\u00e4ndert, Kernregel 6)');

  const cfg = { timeBudgetMs: 800, maxDepth: 2, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };
  const a = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  const b = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  ok(a.move.fr === b.move.fr && a.move.fc === b.move.fc && a.move.tr === b.move.tr &&
     a.move.tc === b.move.tc && a.meta.score === b.meta.score,
     'rankPool 1 weiterhin deterministisch (Zug + Score identisch)');

  const r49 = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves: 49, limit: 50});
  ok(r49.move && r49.meta.score === 0, '\u00a791 harte Uhr unver\u00e4ndert: 1 Halbzug vor der Automatik \u2192 score 0');
  const noClock = core.pickMove(initBoard(), 1, 'odd', cfg, []);
  const fresh   = core.pickMove(initBoard(), 1, 'odd', cfg, [], {halfmoves: 0, limit: 50});
  ok(noClock.meta.score === fresh.meta.score && noClock.meta.score !== 0,
     '\u00a791 Frische-Uhr-Identit\u00e4t unver\u00e4ndert (score ' + noClock.meta.score + ')');
  ok(/if\(clockLeft <= 0\) return 0;/.test(coreSrc) &&
     coreSrc.indexOf('checkFourOn(b)) return -100000') < coreSrc.indexOf('if(clockLeft <= 0) return 0;'),
     '\u00a791 Knoten-Reihenfolge unver\u00e4ndert: Vierer-Check VOR Uhr-Check');
}

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

ok(parseInt(vRules,10) >= 83, 'Cache-Bust auf v\u226583 hochgez\u00e4hlt (Kern wurde ge\u00e4ndert \u2192 Pflicht, sonst \u00a751-Mischversion)');

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
