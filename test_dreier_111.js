// ═══════════════════════════════════════════════════════════════════
// test_dreier_111.js — §111 einsteiger-Paket (HEURISTIC 1.8):
//   (a) maxDepth 3 für einsteiger — GRADUELLE Skalierung
//   (b) forceTriple — DIREKTE Manipulation (Dreier-Vorrang), die erste im Projekt
// ═══════════════════════════════════════════════════════════════════
// WOGEGEN DIESE SUITE SCHÜTZT:
//   1. Stilles Verschwinden des Dreier-Vorrangs. Auslöser war Walters Beobachtung, dass ein
//      liegengelassener Dreier gegenüber einem Einsteiger befremdlich wirkt. Mechanisch möglich
//      ist das, weil poolWindow 110 BREITER ist als DREIER_FORM_BONUS 80 — ein Dreier, der nur
//      durch seinen Bonus vorne liegt, ist per Konstruktion überstimmbar.
//   2. Ausweitung der Manipulation auf andere Stufen. Walter-Auflage, wörtlich: „Max verhält
//      sich ja bei Meister auch nicht gleich. Dort haben wir im Gegenteil mühsam das
//      Dreierverhalten definiert und wir müssen bitte sehr darauf achten, dass wir da nichts
//      verlieren." forceTriple steht deshalb NUR in der einsteiger-Zeile.
//   3. Verlust der §61b-1-Bonuszug-Ausnahme im Sicherheitsnetz. Sie ist der Grund, warum
//      Walters Ausnahme („außer der Gegner käme unmittelbar zum Vierer") in der Praxis fast
//      leer ist: nach einem Dreier zieht derselbe Spieler nochmal, der Gegner ist gar nicht
//      dran. Gemessen an 681 Zufallsstellungen mit Dreierzug: NULL Fälle, in denen ein Dreier
//      dem Gegner den Sofortsieg gibt. Die Klausel bleibt trotzdem — als Netz für die tiefere
//      Widerlegung (Mate-Band), die es sehr wohl gibt (42 Fälle in 1547 Stellungen).
//   4. Prüfung auf Fail-Low-Schranken. Die Verlust-Prüfung fußt auf dem Mate-Band; eine
//      Schranke ist eine OBERE Grenze des wahren Wertes, ein verlorener Dreier könnte damit
//      durchrutschen. Deshalb suchen dreierbildende Wurzelzüge unter forceTriple mit vollem
//      Fenster.
//
// Diese Suite trägt den EXAKTEN Versions-Pin (Konvention: jeweils neueste Suite).
// Aufruf: node test_dreier_111.js
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

// §114-Anpassung: der EXAKTE Pin wandert per Konvention in die jeweils NEUESTE Suite
// (jetzt test_jitter_114). Diese Suite prüft das §111/§113-PAKET selbst — das gibt es ab 1.8.
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.8, "HEURISTIC_VERSION ist countred-ai-\u22651.8 (\u00a7111-Paket vorhanden; aktuell: "+core.HEURISTIC_VERSION+")");

console.log('\u00a7111 \u2014 der Eingriff steht NUR bei einsteiger:');
ok(L.einsteiger.forceTriple === true, 'einsteiger tr\u00e4gt forceTriple: true');
for(const k of ['meister','fortgeschritten','stark'])
  ok(!('forceTriple' in L[k]), k + ': KEIN forceTriple (Walter-Auflage: meister unber\u00fchrt)');
ok(L.einsteiger.maxDepth === 3, 'einsteiger maxDepth 3 (graduelle Skalierung)');
for(const k of ['meister','fortgeschritten','stark'])
  ok(L[k].maxDepth === 5, k + ': maxDepth unver\u00e4ndert 5');

console.log('\u00a7113 \u2014 k\u00fcnstliche Denkzeit (minThinkMs) tr\u00e4gt jetzt die Animation:');
ok(L.einsteiger.minThinkMs === 1000,
   'einsteiger minThinkMs 1000 (war 600; bei Tiefe 3 ist die Suche im Median in 80 ms fertig, ' +
   'die Wartezeit ist die sichtbare Blau-Phase)');
ok(L.fortgeschritten.minThinkMs === 700 && L.stark.minThinkMs === 800 && L.meister.minThinkMs === 900,
   'fortgeschritten 700 / stark 800 / meister 900 unver\u00e4ndert \u2014 die rechnen auf Tiefe 5 lang genug');

console.log('\u00a7113 \u2014 das Einsteiger-PAKET h\u00e4lt zusammen (auch unter anderem Stufennamen):');
{
  // Diese Pr\u00fcfungen h\u00e4ngen bewusst NICHT am Namen \u201eeinsteiger\u201c. Zieht die Konfiguration
  // eines Tages auf eine andere Stufe um, wandern die Auflagen mit — und ein neu gebauter,
  // schw\u00e4cherer einsteiger erbt sie nicht versehentlich halb.
  const DREIER_FORM_BONUS = Number((coreSrc.match(/const DREIER_FORM_BONUS\s*=\s*(\d+)/)||[])[1]);
  ok(DREIER_FORM_BONUS === 80, 'DREIER_FORM_BONUS aus dem Kern gelesen (' + DREIER_FORM_BONUS + ')');
  const keys = Object.keys(L);

  const mitFenster = keys.filter(k => typeof L[k].poolWindow === 'number');
  const zuBreit = mitFenster.filter(k => L[k].poolWindow > DREIER_FORM_BONUS);
  ok(zuBreit.every(k => L[k].forceTriple === true),
     'jede Stufe mit Fenster > ' + DREIER_FORM_BONUS + ' tr\u00e4gt forceTriple (sonst ist der Dreier ' +
     '\u00fcberstimmbar) \u2014 betrifft: ' + (zuBreit.join(', ') || 'keine'));
  const mitFlagg = keys.filter(k => L[k].forceTriple === true);
  ok(mitFlagg.every(k => typeof L[k].poolWindow === 'number' && L[k].poolWindow > DREIER_FORM_BONUS),
     'umgekehrt tr\u00e4gt KEINE Stufe forceTriple ohne den Grund daf\u00fcr (Walter: die direkte ' +
     'Manipulation soll m\u00f6glichst die einzige bleiben)');
  ok(mitFlagg.length === 1, 'genau EINE Stufe tr\u00e4gt das Paket (' + mitFlagg.join(', ') + ')');

  const flach = keys.filter(k => L[k].maxDepth <= 3);
  ok(flach.every(k => L[k].minThinkMs >= 1000),
     'jede Stufe mit maxDepth \u2264 3 hat minThinkMs \u2265 1000 (sonst zieht Max ohne sichtbare ' +
     'Animation) \u2014 betrifft: ' + (flach.join(', ') || 'keine'));
  ok(flach.length === 1 && flach[0] === mitFlagg[0],
     'flache Tiefe und forceTriple sitzen auf DERSELBEN Stufe \u2014 das Paket ist nicht auseinandergefallen');
}

console.log('\u00a7111 \u2014 Quellcode-W\u00e4chter:');
ok(/cfg\.forceTriple === true/.test(coreSrc) && /tripleSet\.has\(_key\(x\.m\)\) && x\.v > -90000/.test(coreSrc),
   'Dreier-Vorrang vorhanden, Ausschluss \u00fcber das Mate-Band (\u2265 \u221290000)');
ok(/DIREKTE MANIPULATION/.test(coreSrc) && /Walter/.test(coreSrc),
   'Begr\u00fcndung steht als Kommentar an der Fundstelle (Walter-Auflage: gut dokumentieren)');
ok(/EINSTEIGER-PAKET \u2014 bitte als EINHEIT behandeln/.test(coreSrc) &&
   /WENN DIESE STUFE UMZIEHT/.test(coreSrc),
   'der Erkl\u00e4rkasten \u00fcber der einsteiger-Zeile steht samt Umzugs-Warnung');
ok(/const _exactTriple = \(cfg\.forceTriple === true\) && !!triple;/.test(coreSrc) &&
   /useRootAlpha && !_exactTriple/.test(coreSrc),
   'dreierbildende Wurzelz\u00fcge suchen unter forceTriple mit vollem Fenster (keine Schranken)');
ok(/if\(bonusMoves\.length > 0\) continue;/.test(coreSrc),
   '\u00a761b-1-Bonuszug-Ausnahme im Sicherheitsnetz unangetastet (Dreier-Tempo)');
ok(/const margin = triple \? DREIER_FORM_BONUS : 0;/.test(coreSrc) &&
   /const marginIn = \(triple \? DREIER_FORM_BONUS : 0\);/.test(coreSrc),
   '\u00a7F2/\u00a796-Margen unver\u00e4ndert (das m\u00fchsam definierte Dreierverhalten bleibt)');
ok(/negamax\(nb, depth\+1, aWin, Infinity, player, bonus/.test(coreSrc),
   '\u00a7105-Bonuszug-Extension unver\u00e4ndert');

// ── deterministisches Stellungsmaterial ──
function lcg(seed){ let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function isTripleMove(b, p, parity, m){
  const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, p);
  if(checkFourOn(nb)) return false;
  return !!applyLockOn(nb);
}
// exakter Wurzelwert (volles Fenster) — dieselbe Bonus-/Margen-Logik wie die Wurzel in pickMove
function rootVal(b, p, parity, m, depth){
  const opp = p === 1 ? 2 : 1;
  const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, p);
  if(checkFourOn(nb)) return 100000;
  const t = applyLockOn(nb);
  const bonus = t ? (getLegalMoves(nb, p, parity).length > 0 ? p : null) : null;
  const branch = new Set([boardHash(b, p)]); branch.add(boardHash(nb, bonus ? p : opp));
  // §105: der Bonuszweig sucht an der WURZEL mit depth+1 (der Bonuszug verbraucht keine Ply).
  // Wer das hier vergisst, misst Dreierzüge eine Ply zu flach und hält das Ergebnis für einen
  // Fehler der Suche — genau diese Falle hat beim Bau dieser Suite einmal zugeschnappt.
  let v = bonus ? core.negamax(nb, depth+1, -Infinity, Infinity, p, bonus, branch, Infinity, Infinity)
                : -core.negamax(nb, depth, -Infinity, Infinity, opp, null, branch, Infinity, Infinity);
  if(t && Math.abs(v) < 90000) v += 80;
  return v;
}
function positionsWithTriple(count, parity, seed){
  const rnd = lcg(seed), out = [];
  for(let a = 0; a < 900 && out.length < count; a++){
    globalThis.PARITY_P1 = parity;
    let b = initBoard(), p = 1, alive = true;
    const plies = 6 + Math.floor(rnd() * 12);
    for(let k = 0; k < plies; k++){
      const mv = getLegalMoves(b, p, parity);
      if(!mv.length || checkFourOn(b)){ alive = false; break; }
      const m = mv[Math.floor(rnd() * mv.length)];
      b = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, p);
      const t = applyLockOn(b);
      if(checkFourOn(b)){ alive = false; break; }
      if(!t) p = p === 1 ? 2 : 1;
    }
    if(!alive || core.findImmediateWin(b, p, parity)) continue;
    const legal = getLegalMoves(b, p, parity);
    if(legal.length < 3) continue;
    if(!legal.some(m => isTripleMove(b, p, parity, m))) continue;
    out.push({b, p, parity});
  }
  return out;
}
const EINSTEIGER = Object.assign({}, L.einsteiger, { timeBudgetMs: 1e9, minThinkMs: 0 });
const MEISTER    = Object.assign({}, L.meister,    { timeBudgetMs: 1e9, minThinkMs: 0 });

console.log('\u00a7111 \u2014 HAUPTREGEL: einsteiger nimmt jeden nicht verlierenden Dreier mit:');
{
  let nPos = 0, nRuns = 0, viol = 0, forcedAgainstSearch = 0, illegal = 0;
  for(const parity of ['odd','even']){
    for(const pos of positionsWithTriple(6, parity, 20260731)){
      globalThis.PARITY_P1 = parity;
      const legal = getLegalMoves(pos.b, pos.p, parity);
      const tri = legal.filter(m => isTripleMove(pos.b, pos.p, parity, m));
      const safe = tri.filter(m => rootVal(pos.b, pos.p, parity, m, EINSTEIGER.maxDepth) > -90000);
      if(!safe.length) continue;                       // Ausnahmefall, eigener Block unten
      const best = Math.max(...legal.map(m => rootVal(pos.b, pos.p, parity, m, EINSTEIGER.maxDepth)));
      nPos++;
      for(let i = 0; i < 8; i++){
        const r = core.pickMove(pos.b, pos.p, parity, EINSTEIGER, []);
        nRuns++;
        const played = r.move;
        if(!canLift(pos.b, played.fr, played.fc, pos.p, parity) ||
           !canDrop(pos.b, played.fr, played.fc, played.tr, played.tc, pos.p, parity)) illegal++;
        const isTri = safe.some(m => m.fr===played.fr && m.fc===played.fc && m.tr===played.tr && m.tc===played.tc);
        if(!isTri) viol++;
        else if(rootVal(pos.b, pos.p, parity, played, EINSTEIGER.maxDepth) < best - 1e-9) forcedAgainstSearch++;
      }
    }
  }
  ok(nPos >= 6, 'Testmaterial: ' + nPos + ' Stellungen mit sicherem Dreier');
  ok(illegal === 0, 'jeder gelieferte Zug ist regelkonform (canLift + canDrop, ' + nRuns + ' L\u00e4ufe)');
  ok(viol === 0, 'in ALLEN ' + nRuns + ' L\u00e4ufen wurde ein Dreier gespielt (Abweichungen: ' + viol + ')');
  ok(forcedAgainstSearch > 0,
     'der Vorrang greift wirklich: ' + forcedAgainstSearch + ' L\u00e4ufe gegen das Suchurteil ' +
     '(w\u00e4re das 0, w\u00e4re die Regel wirkungslos und der Test wertlos)');
}

console.log('\u00a7111 \u2014 AUSNAHME: ein Dreier im Mate-Band wird NICHT genommen:');
{
  const ANCHORS = [{"parity": "odd", "player": 2, "board": [[{"stripe": 0, "locked": false, "piece": null, "stack": null}, {"stripe": 0, "locked": false, "piece": null, "stack": null}, {"stripe": 0, "locked": false, "piece": {"color": "red", "stripe": 0}, "stack": {"bottom": {"color": "red", "stripe": 0}, "top": {"color": "red", "stripe": 0}, "formedBy": 2}}, {"stripe": 0, "locked": false, "piece": null, "stack": null}], [{"stripe": 1, "locked": false, "piece": {"color": "black", "stripe": 1}, "stack": {"bottom": {"color": "black", "stripe": 1}, "top": {"color": "black", "stripe": 1}, "formedBy": 2}}, {"stripe": 1, "locked": false, "piece": {"color": "red", "stripe": 1}, "stack": null}, {"stripe": 1, "locked": false, "piece": null, "stack": null}, {"stripe": 1, "locked": false, "piece": null, "stack": null}], [{"stripe": 2, "locked": false, "piece": {"color": "red", "stripe": 2}, "stack": {"bottom": {"color": "red", "stripe": 2}, "top": {"color": "red", "stripe": 1}, "formedBy": 2}}, {"stripe": 2, "locked": false, "piece": {"color": "black", "stripe": 2}, "stack": null}, {"stripe": 2, "locked": false, "piece": {"color": "red", "stripe": 2}, "stack": {"bottom": {"color": "red", "stripe": 2}, "top": {"color": "black", "stripe": 3}, "formedBy": 1}}, {"stripe": 2, "locked": false, "piece": {"color": "black", "stripe": 2}, "stack": {"bottom": {"color": "black", "stripe": 2}, "top": {"color": "red", "stripe": 3}, "formedBy": 1}}], [{"stripe": 3, "locked": false, "piece": {"color": "black", "stripe": 3}, "stack": {"bottom": {"color": "black", "stripe": 3}, "top": {"color": "black", "stripe": 0}, "formedBy": 2}}, {"stripe": 3, "locked": false, "piece": null, "stack": null}, {"stripe": 3, "locked": false, "piece": null, "stack": null}, {"stripe": 3, "locked": false, "piece": {"color": "red", "stripe": 3}, "stack": {"bottom": {"color": "red", "stripe": 3}, "top": {"color": "black", "stripe": 0}, "formedBy": 1}}]], "losing": [{"m": {"fr": 2, "fc": 0, "tr": 1, "tc": 2}, "v": -100002}]}, {"parity": "odd", "player": 1, "board": [[{"stripe": 0, "locked": false, "piece": {"color": "red", "stripe": 0}, "stack": {"bottom": {"color": "red", "stripe": 0}, "top": {"color": "black", "stripe": 0}, "formedBy": 1}}, {"stripe": 0, "locked": false, "piece": {"color": "black", "stripe": 0}, "stack": null}, {"stripe": 0, "locked": false, "piece": null, "stack": null}, {"stripe": 0, "locked": false, "piece": null, "stack": null}], [{"stripe": 1, "locked": false, "piece": {"color": "black", "stripe": 1}, "stack": {"bottom": {"color": "black", "stripe": 1}, "top": {"color": "red", "stripe": 2}, "formedBy": 1}}, {"stripe": 1, "locked": true, "piece": {"color": "red", "stripe": 1}, "stack": {"bottom": {"color": "red", "stripe": 1}, "top": {"color": "black", "stripe": 3}, "formedBy": 1}}, {"stripe": 1, "locked": true, "piece": {"color": "black", "stripe": 1}, "stack": null}, {"stripe": 1, "locked": false, "piece": {"color": "red", "stripe": 1}, "stack": {"bottom": {"color": "red", "stripe": 1}, "top": {"color": "black", "stripe": 2}, "formedBy": 1}}], [{"stripe": 2, "locked": false, "piece": null, "stack": null}, {"stripe": 2, "locked": true, "piece": {"color": "red", "stripe": 2}, "stack": null}, {"stripe": 2, "locked": true, "piece": {"color": "black", "stripe": 2}, "stack": null}, {"stripe": 2, "locked": false, "piece": null, "stack": null}], [{"stripe": 3, "locked": false, "piece": null, "stack": null}, {"stripe": 3, "locked": true, "piece": {"color": "red", "stripe": 3}, "stack": {"bottom": {"color": "red", "stripe": 3}, "top": {"color": "red", "stripe": 0}, "formedBy": 2}}, {"stripe": 3, "locked": true, "piece": {"color": "black", "stripe": 3}, "stack": null}, {"stripe": 3, "locked": false, "piece": {"color": "red", "stripe": 3}, "stack": null}]], "losing": [{"m": {"fr": 1, "fc": 0, "tr": 2, "tc": 3}, "v": -100002}]}];
  ok(ANCHORS.length >= 2, 'Ankerstellungen eingebettet (' + ANCHORS.length + ')');
  let viol = 0, runs = 0;
  for(const A of ANCHORS){
    globalThis.PARITY_P1 = A.parity;
    // Anker-Vorbedingung mitpr\u00fcfen: der Dreier ist wirklich im Mate-Band, sonst pr\u00fcft der
    // Test nichts (Stellung k\u00f6nnte durch einen sp\u00e4teren Bewertungswechsel harmlos werden).
    const v = rootVal(A.board, A.player, A.parity, A.losing[0].m, 3);
    ok(v <= -90000, 'Anker ' + A.parity + '/Spieler ' + A.player + ': Dreier ist verlierend (Wert ' + v + ')');
    for(let i = 0; i < 12; i++){
      const r = core.pickMove(A.board, A.player, A.parity, EINSTEIGER, []);
      runs++;
      if(A.losing.some(x => x.m.fr===r.move.fr && x.m.fc===r.move.fc && x.m.tr===r.move.tr && x.m.tc===r.move.tc)) viol++;
    }
  }
  ok(viol === 0, 'der verlierende Dreier wurde in ' + runs + ' L\u00e4ufen nie gespielt (Abweichungen: ' + viol + ')');
  globalThis.PARITY_P1 = 'odd';
}

console.log('\u00a7111 \u2014 meister UNBER\u00dcHRT (die Kernauflage):');
{
  let nondet = 0, notBest = 0, n = 0;
  for(const parity of ['odd','even']){
    for(const pos of positionsWithTriple(4, parity, 20260731)){
      globalThis.PARITY_P1 = parity;
      const cfg = Object.assign({}, MEISTER, { maxDepth: 3, minDepth: 3 });
      const a = core.pickMove(pos.b, pos.p, parity, cfg, []);
      const b = core.pickMove(pos.b, pos.p, parity, cfg, []);
      n++;
      if(!(a.move.fr===b.move.fr && a.move.fc===b.move.fc && a.move.tr===b.move.tr &&
           a.move.tc===b.move.tc && a.meta.score===b.meta.score)) nondet++;
      // meister folgt weiterhin GENAU dem Suchurteil: der gew\u00e4hlte Zug tr\u00e4gt den Bestwert.
      const vals = getLegalMoves(pos.b, pos.p, parity).map(m => rootVal(pos.b, pos.p, parity, m, 3));
      const best = Math.max(...vals);
      const vPlayed = rootVal(pos.b, pos.p, parity, a.move, 3);
      if(Math.abs(vPlayed - best) > 1e-9) notBest++;
    }
  }
  ok(n >= 4, 'Testmaterial meister: ' + n + ' Stellungen');
  ok(nondet === 0, 'meister weiterhin deterministisch (Zug + Score, ' + n + ' Stellungen)');
  ok(notBest === 0, 'meister spielt weiterhin GENAU den bestbewerteten Zug \u2014 kein Dreier-Vorrang, ' +
     'kein Fenster (Abweichungen: ' + notBest + ')');
  globalThis.PARITY_P1 = 'odd';
}

console.log('\u00a7111 \u2014 Architektur unber\u00fchrt:');
{
  let selfOk = true;
  try { globalThis.PARITY_P1='odd';  core.antisymmetrySelfTest('odd');
        globalThis.PARITY_P1='even'; core.antisymmetrySelfTest('even'); }
  catch(e){ selfOk = false; }
  globalThis.PARITY_P1 = 'odd';
  ok(selfOk, 'Antisymmetrie-Selbsttest besteht f\u00fcr odd UND even (evaluate() unangetastet, Kernregel 6)');
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
  ok(parseInt(vRules,10) >= 95, 'Cache-Bust auf v\u226595 hochgez\u00e4hlt (Kern ge\u00e4ndert \u2192 Pflicht, sonst \u00a751-Mischversion)');
}

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
