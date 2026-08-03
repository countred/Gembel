// ═══════════════════════════════════════════════════════════════════
// test_obs_99.js — §99 Instrumentierung (Schritt 0 vor dem Testrelease)
// ═══════════════════════════════════════════════════════════════════
// ZWECK: Jeder Befund dieser Session (H5, H6, H7) entstand durch OFFLINE-Nachrechnung — rund
// elf Sekunden je Wurzelsuche. Das skaliert nicht auf hunderte Testrelease-Partien. §99 schreibt
// deshalb mit, was die Suche ohnehin schon weiß, und macht die Befunde zu Datenbankabfragen.
//
// HARTE ANFORDERUNG: §99 darf die ZUGWAHL NICHT ändern. Sonst wären die 14 bereits gespielten
// 1.5-Partien entwertet. HEURISTIC_VERSION bleibt darum ausdrücklich 1.5.
// (Nachgewiesen zusätzlich per A/B gegen die vorherige 1.5: 100 Stellungen, 100× identischer
//  Zug, Score und Tiefe.)
//
// Aufruf: node test_obs_99.js
'use strict';
const fs = require('fs');
const vm = require('vm');

const html   = fs.readFileSync(__dirname + '/countred.html', 'utf8');
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

console.log('\u00a799 \u2014 kein Versionssprung (die 1.5-Partien m\u00fcssen vergleichbar bleiben):');
// §107-Anpassung: der EXAKTE Versions-Pin wandert per Konvention in die jeweils NEUESTE Suite
// (jetzt test_hoheit_107). Diese Suite prüft die §99-FELDER selbst — die gibt es ab 1.5.
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.5,
   "HEURISTIC_VERSION ist countred-ai-≥1.5 (§99-Felder vorhanden; aktuell: "+core.HEURISTIC_VERSION+")");

// ── Deterministische Stellungen (gesetzter Zufall) ──
function lcg(seed){ let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function positions(count, parity, minPlies){
  const rnd = lcg(20260726), out = [];
  for(let a = 0; a < 500 && out.length < count; a++){
    globalThis.PARITY_P1 = parity;
    let b = initBoard(), p = 1, alive = true;
    const plies = minPlies + Math.floor(rnd() * 8);
    for(let k = 0; k < plies; k++){
      const mv = getLegalMoves(b, p, parity);
      if(!mv.length || checkFourOn(b)){ alive = false; break; }
      const m = mv[Math.floor(rnd() * mv.length)];
      b = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, p);
      const t = applyLockOn(b);
      if(checkFourOn(b)){ alive = false; break; }
      if(!t) p = p === 1 ? 2 : 1;
    }
    if(alive && getLegalMoves(b, p, parity).length >= 2) out.push({b, p, parity});
  }
  return out;
}

const cfg1 = { timeBudgetMs: 1e9, maxDepth: 3, minDepth: 3, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };
const cfg3 = { timeBudgetMs: 1e9, maxDepth: 3, minDepth: 3, rankPool: 3, blockRate: 1.0, minThinkMs: 0 };

console.log('\u00a799 \u2014 Felder und ihre Bedeutung (rankPool 1, mit Wurzel-Alpha):');
{
  let n = 0, tookWin = 0, badField = 0, badBonus = 0, badExact = 0, badRank = 0, badPrev = 0, withPrev = 0;
  for(const parity of ['odd','even']) for(const pos of positions(14, parity, 6)){
    globalThis.PARITY_P1 = parity;
    const r = core.pickMove(pos.b, pos.p, parity, cfg1, []);
    const m = r.meta; n++;
    for(const f of ['raw','prevBest','sec','rank','nRoot','nSkip','exact'])
      if(!(f in m)) badField++;
    if(m.safety === 'took-win'){ tookWin++; if(m.exact !== null || m.depth !== 0) badExact++; continue; }
    const d = m.score - m.raw;                       // 0 oder genau der Dreier-Bonus
    if(!(Math.abs(d) < 1e-9 || Math.abs(d - 80) < 1e-9)) badBonus++;
    // §120: ohne Fenster (hier: cfg1) bleibt exact false — Wurzel-Alpha an, sec/rank sind
    // Schranken. Mit Fenster meldet exact seit §120 true, das prüft der Block weiter unten.
    if(m.exact !== false) badExact++;
    if(m.rank !== 1) badRank++;                       // ohne Pool ist der gew\u00e4hlte Zug immer Rang 1
    if(typeof m.prevBest === 'number'){ withPrev++; if(!(m.prevBest < m.score + 1e-9)) badPrev++; }
    if(!(m.nRoot >= 1 && m.nSkip >= 0 && m.nSkip < m.nRoot)) badField++;
  }
  ok(n >= 20, 'Testmaterial: ' + n + ' Stellungen gerechnet (davon ' + tookWin + '\u00d7 Sofortsieg)');
  ok(badField === 0, 'alle sieben Felder vorhanden und plausibel (nRoot \u2265 1, 0 \u2264 nSkip < nRoot)');
  ok(badBonus === 0, 'score \u2212 raw ist immer 0 oder exakt der Dreier-Bonus 80 (macht H5 abfragbar)');
  ok(badExact === 0, 'exact===false bei rankPool 1; bei Sofortsieg exact===null und depth===0');
  ok(badRank === 0, 'rank===1 bei rankPool 1');
  ok(withPrev > 0 && badPrev === 0,
     'prevBest ist der \u00fcberbotene Wert und liegt unter score (' + withPrev + ' F\u00e4lle gepr\u00fcft)');
}

console.log('\u00a7120 \u2014 mit WERTFENSTER sind sec/rank ebenfalls belastbar:');
{
  // Bis §120 stand exact auf `!useRootAlpha` und war deshalb bei JEDER ausgelieferten Stufe
  // false — das Flag war strukturell tot (375 Live-Züge, kein einziges true). Richtig ist:
  // bei gesetztem Fenster wird die Wurzel-Alpha um poolSlack GESENKT, jeder Zug innerhalb
  // des Fensters bekommt damit einen exakten Wert.
  const cfgW = { timeBudgetMs: 1e9, maxDepth: 3, minDepth: 3, rankPool: 1, blockRate: 1.0,
                 minThinkMs: 0, poolWindow: 110, poolTemp: 30 };
  let n = 0, badExact = 0, badSec = 0, mitRang2 = 0;
  for(const parity of ['odd','even']) for(const pos of positions(8, parity, 6)){
    globalThis.PARITY_P1 = parity;
    const m = core.pickMove(pos.b, pos.p, parity, cfgW, []).meta;
    if(m.safety === 'took-win') continue;
    n++;
    if(m.exact !== true) badExact++;
    if(m.rank > 1){ mitRang2++; if(typeof m.sec !== 'number') badSec++; }
  }
  ok(n >= 8, 'Testmaterial: ' + n + ' Stellungen mit Fenster gerechnet');
  ok(badExact === 0, 'exact===true bei gesetztem poolWindow \u2014 das Flag ist nicht mehr tot');
  ok(badSec === 0, 'sec ist gesetzt, sobald ein anderer als der beste Zug gespielt wurde (' +
     mitRang2 + ' F\u00e4lle)');
  ok(/exact:    \(!useRootAlpha\) \|\| _poolOn/.test(fs.readFileSync(__dirname+'/countred_ai_core.js','utf8')),
     'die Regel steht im Kern: exact = kein Wurzel-Alpha ODER Fenster gesetzt');
}

console.log('\u00a799 \u2014 rankPool > 1: sec und rank werden zu echten Werten:');
{
  let n = 0, badExact = 0, badRank = 0, badSec = 0;
  for(const parity of ['odd','even']) for(const pos of positions(10, parity, 6)){
    globalThis.PARITY_P1 = parity;
    const r = core.pickMove(pos.b, pos.p, parity, cfg3, []);
    const m = r.meta;
    if(m.safety === 'took-win') continue;
    n++;
    if(m.exact !== true) badExact++;                       // kein Wurzel-Alpha ⇒ Werte exakt
    if(!(m.rank >= 1 && m.rank <= 3)) badRank++;           // gew\u00e4hlt wird aus den Top 3
    if(m.rank > 1 && !(typeof m.sec === 'number')) badSec++;
  }
  ok(n >= 10, 'Testmaterial: ' + n + ' Stellungen mit Pool gerechnet');
  ok(badExact === 0, 'exact===true bei rankPool 3 \u2014 sec/rank sind hier auswertbar');
  ok(badRank === 0, 'rank liegt zwischen 1 und rankPool (macht die Pool-Verteilung abfragbar)');
  ok(badSec === 0, 'sec ist gesetzt, sobald ein anderer als der beste Zug gespielt wurde');
}

console.log('\u00a799 \u2014 Ger\u00e4te-Benchmark:');
{
  globalThis.PARITY_P1 = 'even';          // absichtlich abweichend: der Benchmark rechnet mit 'odd'
  const t0 = Date.now();
  const ms = core.deviceBenchMs();
  const wall = Date.now() - t0;
  ok(typeof ms === 'number' && ms >= 0 && ms <= wall + 5,
     'deviceBenchMs() liefert eine Millisekundenzahl (' + ms + ' ms auf dieser Maschine)');
  ok(globalThis.PARITY_P1 === 'even', 'der Benchmark stellt PARITY_P1 danach wieder her (kein Seiteneffekt)');
  globalThis.PARITY_P1 = 'odd';
  const src = fs.readFileSync(__dirname + '/countred_ai_core.js', 'utf8');
  const benchSrc = src.match(/function deviceBenchMs[\s\S]{0,900}/)[0];
  ok(/maxDepth: 1, minDepth: 1, rankPool: 1, blockRate: 1\.0/.test(benchSrc) && /BENCH_REPS/.test(benchSrc),
     'feste, ger\u00e4teunabh\u00e4ngige Last (Tiefe 1 \u00d7 BENCH_REPS, kein Pool, kein Zufall)');
  ok(/Aufwaermlauf/.test(benchSrc), 'ein Aufw\u00e4rmlauf vor der Messung (sonst misst man den JIT mit)');
  // Kommentare ausblenden, sonst schl\u00e4gt der eigene Erl\u00e4uterungstext an.
  const codeOnly = src.replace(/\/\/[^\n]*/g, '');
  ok(!/navigator|userAgent|screen\./.test(codeOnly), 'keine Ger\u00e4tekennung im KERN-CODE \u2014 gemessen wird nur Tempo');
}

console.log('\u00a799 \u2014 Verdrahtung in countred.html:');
for(const f of ['raw','prevBest','sec','rank','nRoot','nSkip','exact'])
  ok(new RegExp('^\\s*'+f+':\\s+\\(meta&&typeof meta\\.'+f, 'm').test(html),
     'mvkiLogEntry schreibt `' + f + '`');
ok(/measureDevicePerfOnce\(\);\s+\/\/ \u00a799/.test(html), 'startAIGame st\u00f6\u00dft den Ger\u00e4te-Benchmark an');
ok(/if\(devicePerfMs !== null\) return;/.test(html), 'Benchmark l\u00e4uft nur EINMAL pro Sitzung');
ok(/setTimeout\(\(\) => \{|setTimeout\(\(\)=>\{/.test(html.match(/function measureDevicePerfOnce[\s\S]{0,400}/)[0]),
   'Benchmark l\u00e4uft verz\u00f6gert (der Mensch ist nach dem Start am Zug)');
ok(/perfMs: \(typeof devicePerfMs==='number'\) \? devicePerfMs : null/.test(html),
   'perfMs wird ins Partie-Ergebnis geschrieben (Stratifizierung nach Rechenleistung)');
ok(!/navigator\.userAgent/.test(html), 'kein userAgent im Log \u2014 nur die gemessene Rechenzeit');

console.log('\u00a7124 \u2014 anonyme Zufallskennung:');
ok(/localStorage\.getItem\('countred_pkey'\)/.test(html) &&
   /localStorage\.setItem\('countred_pkey', k\)/.test(html),
   'der Schl\u00fcssel wird EINMAL erzeugt und im Browser behalten');
ok(/getRandomValues/.test(html),
   'aus dem Krypto-Zufall erzeugt \u2014 keine Zeit- oder Ger\u00e4tekomponente, aus der sich etwas ableiten lie\u00dfe');
ok(/playerKey: PLAYER_KEY/.test(html),
   'playerKey steht im _meta-Kopf (deckt auch abgebrochene Partien ab, \u00a789b)');
ok(!/navigator\.userAgent/.test(html) && !/screen\.width/.test(html) && !/navigator\.platform/.test(html),
   'weiterhin KEINE Ger\u00e4tekennung \u2014 nur die Zufallskennung und die gemessene perfMs (\u00a799)');
{
  // Reihenfolge: die Konstante muss VOR ihrer Verwendung stehen, sonst ReferenceError
  // beim ersten Partiestart (temporal dead zone bei const).
  ok(html.indexOf('const PLAYER_KEY') < html.indexOf('playerKey: PLAYER_KEY'),
     'PLAYER_KEY ist deklariert, bevor startAIGame es liest');
  const fn = html.match(/function getPlayerKey\(\)\{[\s\S]*?\n\}/)[0];
  ok(/catch\(e\)\{[\s\S]*return null;/.test(fn),
     'gesperrter Speicher (privater Modus) liefert null statt eines Absturzes');
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
  ok(parseInt(vRules,10) >= 84, 'auf v\u226584 hochgez\u00e4hlt (der Kern hat sich ge\u00e4ndert)');
}

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
