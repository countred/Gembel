// ═══════════════════════════════════════════════════════════════════
// test_stufen_109.js — §109 Hebel 1: Wertfenster + Softmax, kalibrierte Stufen (HEURISTIC 1.7)
// ═══════════════════════════════════════════════════════════════════
// WOGEGEN DIESE SUITE SCHÜTZT:
//   1. Rückfall auf Top-k-uniform. rankPool wählte gleichverteilt aus den besten k — der
//      drittbeste Zug kam gleich oft wie der beste, egal ob 2 oder 200 Punkte schlechter
//      (Livebeleg 6XDY5WCE). Das Wertfenster koppelt die Wahl an den Wertabstand.
//   2. Abschalten des Wurzel-Alpha bei gesetztem Fenster. Das war die erste Fassung und kostete
//      Faktor 4 an Rechenzeit — live hätte die Absenkung dann teils aus verlorener SUCHTIEFE
//      gestammt statt aus dem Fenster. Richtig ist: Alpha um die Fensterbreite SENKEN.
//   3. Auseinanderlaufende Zeitbudgets. Alle Stufen haben dasselbe Budget, sonst erreicht eine
//      schwache Stufe in der Eröffnung weniger Tiefe als meister und die Kalibrierung stimmt
//      nicht mehr mit dem Livespiel überein (§92).
//   4. Entfernen von `stark`. Bewusst unsichtbar, aber Altpartien tragen den Schlüssel.
//
// KALIBRIERUNG (feste Tiefe 5, je 32 Partien gegen meister, gepaart über acht Eröffnungen):
//   einsteiger 26,6 % · fortgeschritten 40,6 % · meister 50 % (Referenz).
//
// Diese Suite trägt den EXAKTEN Versions-Pin (Konvention: jeweils neueste Suite).
// Aufruf: node test_stufen_109.js
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

// §111-Anpassung: der EXAKTE Pin wandert per Konvention in die jeweils NEUESTE Suite
// (jetzt test_dreier_111). Diese Suite prüft das §109-FEATURE selbst — das gibt es ab 1.7.
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.7, "HEURISTIC_VERSION ist countred-ai-\u22651.7 (\u00a7109-Fenster vorhanden; aktuell: "+core.HEURISTIC_VERSION+")");

console.log('\u00a7109 \u2014 kalibrierte Fensterwerte:');
// §121-NACHZUG: einsteiger wurde nach den ersten ECHTEN Anfaengerdaten deutlich abgesenkt
// (0:5 bei sieben Zuegen je Partie). Fenster 250/60 statt 110/30.
ok(L.einsteiger.poolWindow === 250 && L.einsteiger.poolTemp === 60,
   'einsteiger: Fenster 250 / Temp 60 (\u00a7121-Absenkung nach den Neuling-Partien)');
ok(L.stark.poolWindow === 30 && L.stark.poolTemp === 10,
   'stark: Fenster 30 / Temp 10 \u2014 die 40,6-%-Konfiguration, \u00a7122 von fortgeschritten hierher ger\u00fcckt');
// §122-NACHZUG: die Stufen sind gerückt. fortgeschritten trägt jetzt die Konfiguration,
// die bis v97 einsteiger hieß (gemessen 7,8 %, Walter 6:6:1 über 13 Partien).
ok(L.fortgeschritten.poolWindow === 110 && L.fortgeschritten.poolTemp === 30,
   'fortgeschritten: Fenster 110 / Temp 30 (gemessen 7,8 %, \u00a7122 von einsteiger hierher ger\u00fcckt)');
ok(!('poolWindow' in L.meister), 'meister hat KEIN Fenster \u2014 spielt immer den besten Zug');
ok(L.einsteiger.poolWindow > L.fortgeschritten.poolWindow,
   'Reihenfolge stimmt: das breitere Fenster geh\u00f6rt zur schw\u00e4cheren Stufe');
// §122: die STUFENLEITER-Tabelle über SKILL_LEVELS ist die einzige Übersicht — sie muss da sein.
ok(/STUFENLEITER — Stand/.test(coreSrc) && /einsteiger\s+2\s+250\/60/.test(coreSrc),
   'die Stufenleiter-Tabelle steht im Kern und nennt die aktuellen Werte');
// §121-NACHZUG: Walters Leitplanke „hoechstens 110" hatte GENAU EINEN Grund — ein breiteres
// Fenster macht einen Dreier ueberstimmbar, und ein liegengelassener Dreier ist der sichtbarste
// Patzer. forceTriple (§111) verhindert das seit v91 strukturell, die Grenze ist damit
// hinfaellig. Geprueft wird jetzt die BEDINGUNG statt der Zahl: wer ein Fenster ueber dem
// Dreier-Bonus faehrt, muss forceTriple tragen. (Die namensunabhaengige Fassung dieser Regel
// steht in test_dreier_111 und gilt fuer ALLE Stufen.)
ok(L.einsteiger.poolWindow <= 80 || L.einsteiger.forceTriple === true,
   'Fenster > Dreier-Bonus nur MIT forceTriple (Fenster ' + L.einsteiger.poolWindow + ')');

console.log('\u00a7109 \u2014 rankPool ist stillgelegt:');
for(const k of Object.keys(L))
  ok(L[k].rankPool === 1, k + ': rankPool 1 (das Fenster hat den Top-k-Pool abgel\u00f6st)');

console.log('\u00a7109 \u2014 einheitliches Zeitbudget (sonst kommt Tiefe als zweiter Hebel dazu, \u00a792):');
{
  const b = Object.keys(L).map(k => L[k].timeBudgetMs);
  ok(new Set(b).size === 1, 'alle Stufen haben dasselbe Budget (' + b[0] + ' ms)');
  // §111-NACHZUG: diese Behauptung stammt aus §109 und war dort richtig — die Absenkung sollte
  // AUSSCHLIESSLICH aus dem Fenster kommen. §111 hat sie bewusst aufgehoben: einsteiger rechnet
  // jetzt nur noch bis Tiefe 3, weil das Fenster innerhalb von Walters Leitplanke (≤110) nicht
  // genug hergibt. Geprüft wird deshalb ab jetzt die neue Absicht — Tiefe ist ein ERLAUBTER,
  // aber ausdrücklich einsteiger-EXKLUSIVER Hebel.
  // §122: nach dem Rücken rechnet fortgeschritten auf Tiefe 3. Geprüft wird die ORDNUNG
  // der Leiter statt fester Zahlen — das überlebt das nächste Rücken.
  ok(L.meister.maxDepth === 5 && L.stark.maxDepth === 5,
     'meister und stark auf maxDepth 5');
  ok(L.einsteiger.maxDepth <= L.fortgeschritten.maxDepth &&
     L.fortgeschritten.maxDepth <= L.stark.maxDepth &&
     L.stark.maxDepth <= L.meister.maxDepth,
     'die Tiefen sind \u00fcber die Leiter aufsteigend (' +
     [L.einsteiger, L.fortgeschritten, L.stark, L.meister].map(x => x.maxDepth).join(' \u2264 ') + ')');
  ok(L.einsteiger.poolWindow > L.fortgeschritten.poolWindow &&
     L.fortgeschritten.poolWindow > L.stark.poolWindow && !('poolWindow' in L.meister),
     'die Fenster werden \u00fcber die Leiter enger und verschwinden bei meister (' +
     L.einsteiger.poolWindow + ' > ' + L.fortgeschritten.poolWindow + ' > ' + L.stark.poolWindow + ' > kein Fenster)');
  ok(L.einsteiger.maxDepth < L.meister.maxDepth,
     'einsteiger rechnet flacher als meister (§121: maxDepth ' + L.einsteiger.maxDepth + ')');
  const mins = Object.keys(L).map(k => L[k].minDepth);
  ok(new Set(mins).size === 1, 'minDepth bei allen Stufen gleich (' + mins[0] + ')');
  ok(L.einsteiger.maxDepth >= L.einsteiger.minDepth,
     '\u00a7121: maxDepth ' + L.einsteiger.maxDepth + ' \u2265 minDepth ' + L.einsteiger.minDepth +
     ' (bei Tiefe 2 fallen beide zusammen \u2014 die Suche darf nicht unter minDepth rutschen)');
}

console.log('\u00a7109 \u2014 Wurzel-Alpha wird GESENKT, nicht abgeschaltet:');
ok(/const useRootAlpha = _poolOn \? true : \(cfg\.rankPool === 1\);/.test(coreSrc),
   'bei gesetztem Fenster bleibt das Wurzel-Alpha aktiv');
ok(/localBest - margin - poolSlack/.test(coreSrc),
   'Alpha um die Fensterbreite gesenkt (poolSlack)');
ok(/poolSlack - \(_poolOn \? 1e-6 : 0\)/.test(coreSrc),
   'zus\u00e4tzliches Epsilon f\u00fcr den Grenzfall \u2014 ohne das f\u00e4llt ein Zug GENAU auf der Fenstergrenze low');
ok(/Math\.exp\(-\(top - x\.v\) \/ temp\)/.test(coreSrc),
   'Softmax koppelt die Wahrscheinlichkeit an den Wertabstand (nicht mehr gleichverteilt)');

console.log('\u00a7109 \u2014 `stark` bleibt (Wiedereinbau-Schutz):');
ok(!!L.stark, "SKILL_LEVELS enth\u00e4lt weiterhin 'stark' \u2014 Altpartien tragen den Schl\u00fcssel im Log");
ok(/STARK \(\u00a7122: war bis v97 `fortgeschritten`\) \u2014 GEPARKT, NICHT ENTFERNEN/.test(coreSrc),
   'Begr\u00fcndung steht als Kommentar an der Zeile');
ok(!/startAIGame\('stark'\)/.test(html), "'stark' wird weiterhin NICHT angeboten (unsichtbar)");

console.log('\u00a7109 \u2014 Verhalten:');
{
  // Tiefe 2 gen\u00fcgt: gepr\u00fcft wird, DASS das Fenster streut, nicht wie stark.
  const base = { timeBudgetMs: 1e9, maxDepth: 2, minDepth: 2, minThinkMs: 0, blockRate: 1.0 };
  const meister = Object.assign({}, base, { rankPool: 1 });
  const a = core.pickMove(initBoard(), 1, 'odd', meister, []);
  const b = core.pickMove(initBoard(), 1, 'odd', meister, []);
  ok(a.move.fr===b.move.fr && a.move.fc===b.move.fc && a.move.tr===b.move.tr && a.move.tc===b.move.tc
     && a.meta.score===b.meta.score,
     'ohne Fenster weiterhin deterministisch (meister unangetastet)');

  const weich = Object.assign({}, base, { rankPool: 1, poolWindow: 110, poolTemp: 30 });
  const seen = new Set();
  for(let i=0;i<24;i++){
    const r = core.pickMove(initBoard(), 1, 'odd', weich, []);
    seen.add(r.move.fr+','+r.move.fc+','+r.move.tr+','+r.move.tc);
  }
  ok(seen.size >= 2, 'mit Fenster variiert die Zugwahl wirklich (' + seen.size + ' verschiedene Z\u00fcge in 24 L\u00e4ufen)');

  const eng = Object.assign({}, base, { rankPool: 1, poolWindow: 1, poolTemp: 1 });
  const seenEng = new Set();
  for(let i=0;i<12;i++){
    const r = core.pickMove(initBoard(), 1, 'odd', eng, []);
    seenEng.add(r.move.fr+','+r.move.fc+','+r.move.tr+','+r.move.tc);
  }
  ok(seenEng.size <= seen.size,
     'ein enges Fenster streut weniger als ein breites (' + seenEng.size + ' gegen ' + seen.size + ')');

  let selfOk = true;
  try { core.antisymmetrySelfTest('odd'); globalThis.PARITY_P1='even'; core.antisymmetrySelfTest('even'); }
  catch(e){ selfOk = false; }
  globalThis.PARITY_P1='odd';
  ok(selfOk, 'Antisymmetrie-Selbsttest besteht f\u00fcr odd UND even (evaluate() unber\u00fchrt)');
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
  ok(parseInt(vRules,10) >= 99, 'Cache-Bust auf v\u226599 hochgez\u00e4hlt (Kern ge\u00e4ndert \u2192 Pflicht, sonst \u00a751-Mischversion)');
}

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
