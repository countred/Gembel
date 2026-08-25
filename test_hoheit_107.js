// ═══════════════════════════════════════════════════════════════════
// test_hoheit_107.js — §105 Bonuszug-Extension + §107 Paritätshoheit (HEURISTIC 1.6)
// ═══════════════════════════════════════════════════════════════════
// §105: negamax verbrauchte für den BONUSZUG nach einem Dreier eine Ply wie für einen
//   Gegnerzug. Eine Dreier-Linie enthielt dadurch bei gleicher Nenn-Tiefe eine
//   GEGNERANTWORT WENIGER — die Widerlegung des Dreiers lag hinter dem Horizont.
//   Gemessen: 7 von 7 dreierbildenden Wurzelzügen verlieren bei einer Ply mehr an Wert
//   (Median −94), nicht dreierbildende 8 von 48. Selbstspiel bei der real gespielten
//   Tiefe 5, 80 Partien über zwei Seeds: 56,25 %, gepaart 9 Eröffnungen dafür / 0 dagegen.
//
// §107: Endspielmotiv aus AG8VAPGM. Ein Spieler kann beide leeren Zellen einer sonst
//   einfarbigen Spalte mit zwei VERSCHIEDENEN Figuren besetzen, die beide Tops SEINER
//   EIGENEN Stapel sind — unantastbar (auf Stapel darf nicht gestapelt werden) und ohne
//   Paritätsprüfung hebbar (canLift auf Stapel prüft nur formedBy).
//   BELEGLAGE EHRLICH: Mechanik aus der Regelschicht hergeleitet, Trefferbilanz 7 von 8
//   in echten Partien — ein STÄRKENACHWEIS im Selbstspiel liegt NICHT vor, weil die KI
//   das Muster gegen sich selbst nur in 1 von 40 Partien überhaupt herstellt.
//
// Diese Suite trägt den EXAKTEN Versions-Pin (Konvention: jeweils neueste Suite).
// Aufruf: node test_hoheit_107.js
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

// \u00a7109-Anpassung: exakter Pin wandert in test_stufen_109. \u00a7105/\u00a7107 gibt es ab 1.6.
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.6, "HEURISTIC_VERSION ist countred-ai-\u22651.6 (\u00a7105/\u00a7107 vorhanden; aktuell: "+core.HEURISTIC_VERSION+")");

const ANCHOR = {"parity":"odd","hz19":[[{"stripe":0,"piece":{"color":"red","stripe":0},"stack":null,"locked":false},{"stripe":0,"piece":{"color":"black","stripe":0},"stack":{"bottom":{"color":"black","stripe":0},"top":{"color":"red","stripe":1},"formedBy":1},"locked":false},{"stripe":0,"piece":{"color":"red","stripe":0},"stack":{"bottom":{"color":"red","stripe":0},"top":{"color":"black","stripe":1},"formedBy":1},"locked":true},{"stripe":0,"piece":null,"stack":null,"locked":false}],[{"stripe":1,"piece":null,"stack":null,"locked":false},{"stripe":1,"piece":null,"stack":null,"locked":false},{"stripe":1,"piece":{"color":"red","stripe":1},"stack":null,"locked":true},{"stripe":1,"piece":null,"stack":null,"locked":false}],[{"stripe":2,"piece":null,"stack":null,"locked":false},{"stripe":2,"piece":{"color":"black","stripe":2},"stack":{"bottom":{"color":"black","stripe":2},"top":{"color":"red","stripe":2},"formedBy":1},"locked":false},{"stripe":2,"piece":{"color":"red","stripe":2},"stack":{"bottom":{"color":"red","stripe":2},"top":{"color":"red","stripe":3},"formedBy":2},"locked":true},{"stripe":2,"piece":{"color":"black","stripe":2},"stack":{"bottom":{"color":"black","stripe":2},"top":{"color":"black","stripe":0},"formedBy":2},"locked":false}],[{"stripe":3,"piece":null,"stack":null,"locked":false},{"stripe":3,"piece":null,"stack":null,"locked":false},{"stripe":3,"piece":{"color":"black","stripe":3},"stack":{"bottom":{"color":"black","stripe":3},"top":{"color":"red","stripe":3},"formedBy":1},"locked":false},{"stripe":3,"piece":{"color":"black","stripe":3},"stack":{"bottom":{"color":"black","stripe":3},"top":{"color":"black","stripe":1},"formedBy":2},"locked":false}]],"hz5":[[{"stripe":0,"piece":null,"stack":null,"locked":false},{"stripe":0,"piece":{"color":"black","stripe":0},"stack":{"bottom":{"color":"black","stripe":0},"top":{"color":"black","stripe":0},"formedBy":2},"locked":false},{"stripe":0,"piece":{"color":"red","stripe":0},"stack":{"bottom":{"color":"red","stripe":0},"top":{"color":"black","stripe":1},"formedBy":1},"locked":false},{"stripe":0,"piece":null,"stack":null,"locked":false}],[{"stripe":1,"piece":{"color":"black","stripe":1},"stack":null,"locked":false},{"stripe":1,"piece":{"color":"red","stripe":1},"stack":{"bottom":{"color":"red","stripe":1},"top":{"color":"red","stripe":0},"formedBy":2},"locked":false},{"stripe":1,"piece":null,"stack":null,"locked":false},{"stripe":1,"piece":{"color":"red","stripe":1},"stack":null,"locked":false}],[{"stripe":2,"piece":null,"stack":null,"locked":false},{"stripe":2,"piece":{"color":"black","stripe":2},"stack":{"bottom":{"color":"black","stripe":2},"top":{"color":"red","stripe":2},"formedBy":1},"locked":false},{"stripe":2,"piece":{"color":"red","stripe":2},"stack":null,"locked":false},{"stripe":2,"piece":{"color":"black","stripe":2},"stack":null,"locked":false}],[{"stripe":3,"piece":{"color":"black","stripe":3},"stack":null,"locked":false},{"stripe":3,"piece":{"color":"red","stripe":3},"stack":null,"locked":false},{"stripe":3,"piece":{"color":"black","stripe":3},"stack":null,"locked":false},{"stripe":3,"piece":{"color":"red","stripe":3},"stack":null,"locked":false}]]};

console.log('\u00a7105 \u2014 Bonuszug verbraucht keine Ply:');
ok(/negamax\(nb, depth\+1, aWin, Infinity, player, bonus/.test(coreSrc),
   'Wurzel: Bonuszweig sucht mit depth+1 (gleich viele Gegnerantworten wie der Normalzweig)');
ok(/negamax\(nb, depth,\s+alphaIn, betaIn, player, bonus/.test(coreSrc),
   'negamax: Bonuskind sucht mit depth statt depth-1');
ok(/-negamax\(nb, depth-1, -betaIn, -alphaIn, opp, null/.test(coreSrc),
   'der GEGNER-Zweig verbraucht weiterhin eine Ply (sonst terminiert nichts mehr)');
{
  // Terminierung: Sperrungen sind innerhalb einer Linie monoton, die Zahl der Bonus-Ereignisse
  // ist dadurch beschraenkt. Gepruef wird an einer Stellung MIT Sperrung und dreierbildenden
  // Zuegen \u2014 dort greift die Extension wirklich, nicht auf dem leeren Startbrett.
  const cfg = { timeBudgetMs: 1e9, maxDepth: 4, minDepth: 4, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };
  const t0 = Date.now();
  globalThis.PARITY_P1 = ANCHOR.parity;
  const r = core.pickMove(ANCHOR.hz19, 2, ANCHOR.parity, cfg, []);
  globalThis.PARITY_P1 = 'odd';
  ok(!!r.move && isFinite(r.meta.score) && Date.now()-t0 < 60000,
     'Tiefe 4 auf gesperrter Stellung terminiert (' + (Date.now()-t0) + ' ms) \u2014 keine unbeschr\u00e4nkte Rekursion');
}

console.log('\u00a7107 \u2014 Gate und Antisymmetrie:');
{
  const b0 = initBoard();
  ok(core.hoheitJS(b0, 1, 'odd') === 0 && core.hoheitJS(b0, 2, 'odd') === 0,
     'Startbrett ohne Sperrung \u2192 Term liefert 0 (Gate h\u00e4lt die Er\u00f6ffnung frei)');
  let selfOk = true;
  try { core.antisymmetrySelfTest('odd'); globalThis.PARITY_P1='even'; core.antisymmetrySelfTest('even'); }
  catch(e){ selfOk = false; }
  globalThis.PARITY_P1='odd';
  ok(selfOk, 'Antisymmetrie-Selbsttest besteht f\u00fcr odd UND even (Kernregel 6, Term als Differenz gebaut)');
}

console.log('\u00a7107 \u2014 Anker aus AG8VAPGM (Walters Gewinnplan):');
{
  globalThis.PARITY_P1 = ANCHOR.parity;
  const hz5 = ANCHOR.hz5, hz19 = ANCHOR.hz19;
  // Walter ist Spieler 2; P1 ist ungerade, Walter also GERADE.
  ok(core.hoheitJS(hz5, 1, ANCHOR.parity) === 0 && core.hoheitJS(hz5, 2, ANCHOR.parity) === 0,
     'Halbzug 5: Term schweigt (kein fertiger Aufbau) \u2014 kein Rauschen');
  ok(core.hoheitJS(hz19, 2, ANCHOR.parity) > 0,
     'Halbzug 19: Term meldet f\u00fcr Spieler 2 (gerade) \u2014 der Aufbau, mit dem Walter gewann');
  ok(core.hoheitJS(hz19, 1, ANCHOR.parity) < 0,
     'derselbe Anker aus Sicht der KI: negativ (Antisymmetrie am realen Brett)');
  ok(core.hoheitJS(hz19, 1, ANCHOR.parity) === -core.hoheitJS(hz19, 2, ANCHOR.parity),
     'hoheitJS(b,1) + hoheitJS(b,2) === 0 auf der Ankerstellung');
  globalThis.PARITY_P1 = 'odd';
}

console.log('\u00a7108 \u2014 einsteiger: blockRate zur\u00fcck auf 1.0:');
ok(core.SKILL_LEVELS.einsteiger.blockRate === 1.0,
   'blockRate 1.0 \u2014 0.8 war messbar wirkungslos (32,8 % gegen meister mit UND ohne) und war der falsche Hebel');
// \u00a7109-NACHZUG: bis 1.6 leistete rankPool 3 die gesamte Absenkung (gemessen 32,8 % gegen
// meister, mit und ohne blockRate). Seit 1.7 kommt sie aus dem WERTFENSTER, rankPool steht
// \u00fcberall auf 1. Die Fensterwerte selbst pr\u00fcft test_stufen_109.
ok(core.SKILL_LEVELS.einsteiger.rankPool === 1,
   'rankPool stillgelegt \u2014 die Absenkung kommt seit \u00a7109 aus dem Wertfenster');

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

  ok(parseInt(vRules,10) >= 88, 'Cache-Bust auf v\u226588 hochgez\u00e4hlt (Kern ge\u00e4ndert \u2192 Pflicht, sonst \u00a751-Mischversion)');
}

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
