// ═══════════════════════════════════════════════════════════════════
// test_remis_85.js — §85 Remis-Paket: Suchwert-Basis, Invariante anbieten⇒annehmen,
//                    Timing-Fix (Angebot VOR dem KI-Zug), Cooldowns, meta.score (1.2)
// ═══════════════════════════════════════════════════════════════════
// Teil 1: Reine Entscheidungslogik (drawScoresWithin/drawScoresBand/aiDrawAcceptDecision/
//         aiDrawOfferDecision) — per Regex aus der ECHTEN countred.html extrahiert (kein Nachbau).
//         Inkl. Zufalls-Sweep der Invariante: anbieten ⇒ annehmen, für alle Parameterlagen.
// Teil 2: countred_ai_core.js (1.2): meta.score existiert, ist plausibel, Sofortsieg = 100000,
//         Spielverhalten identisch zu 1.1 (Suche unveraendert — nur Rueckgabe erweitert).
// Teil 3: Statische Verdrahtungs-Guards + Deploy-Versions-Guard.
// §101-ANPASSUNG (Session 20): Die bedingungslose Zusage am 60-%-Punkt ist ENTFERNT. Sie hatte
//   acceptLeadMax genau dann ausgehebelt, wenn es gebraucht wurde — wenn die KI vorn liegt.
//   Livebeleg 3YUE88D5: Angebot bei 30/50 Halbzügen mit +52…+80 über das ganze Fenster.
//   Die betroffenen Fälle unten sind umgedreht und um die drei realen Livelagen ergänzt.
// Aufruf: node test_remis_85.js  (countred.html, countred_ai_worker.js, gembel_rules.js,
//         countred_ai_core.js im selben Ordner)
'use strict';
const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync(__dirname + '/countred.html', 'utf8');
const worker = fs.readFileSync(__dirname + '/countred_ai_worker.js', 'utf8');

let pass = 0, fail = 0;
function ok(cond, name){
  if(cond){ pass++; console.log('  \u2713 ' + name); }
  else    { fail++; console.log('  \u2717 FAIL: ' + name); }
}

// ── Teil 1: Reine Entscheidungsfunktionen aus countred.html extrahieren ──
function extractFn(name){
  const re = new RegExp('function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}', 'm');
  const m = html.match(re);
  if(!m) throw new Error('Funktion nicht gefunden: ' + name);
  return m[0];
}
const sb = {};
vm.createContext(sb);
vm.runInContext(
  extractFn('drawScoresWithin') + '\n' + extractFn('drawScoresBand') + '\n' +
  extractFn('aiDrawAcceptDecision') + '\n' + extractFn('aiDrawOfferDecision') +
  '\n;__X={drawScoresWithin,drawScoresBand,aiDrawAcceptDecision,aiDrawOfferDecision};', sb);
const { drawScoresWithin, drawScoresBand, aiDrawAcceptDecision, aiDrawOfferDecision } = sb.__X;

// Basis-Parameter: ruhige Partie, Fenster voll, ausgeglichen, Stufe bietet an.
function P(over){
  return Object.assign({
    scores: [5,-10,0,15,-5,10], windowN: 6, leadMax: 40,
    repCount: 0, halfmoves: 10, limit: 50, noProgressFrac: 0.6,
    offers: true, band: 20, blocked: false, cooldown: false
  }, over||{});
}

console.log('\u00a785 Teil 1 \u2014 Annahme-Entscheidung (aiDrawAcceptDecision):');
ok(aiDrawAcceptDecision(P()) === true, 'ausgeglichenes volles Fenster \u2192 nimmt an');
ok(aiDrawAcceptDecision(P({scores:[-200,-180,-220,-190,-210,-250]})) === true, 'klar verlierend \u2192 nimmt an (Remis rettet den halben Punkt)');
ok(aiDrawAcceptDecision(P({scores:[60,55,70,80,65,75]})) === false, 'klar vorn (alle \u00fcber leadMax 40) \u2192 lehnt ab');
ok(aiDrawAcceptDecision(P({scores:[10,10,10,10,10,80]})) === false, 'EIN Ausrei\u00dfer \u00fcber leadMax im Fenster \u2192 lehnt ab (sah sich zuletzt vorn)');
ok(aiDrawAcceptDecision(P({scores:[10,10,10]})) === false, 'Fenster nicht voll \u2192 lehnt ab (Fr\u00fchphasen-Schutz)');
ok(aiDrawAcceptDecision(P({scores:[300,300,300,300,300,300], halfmoves:30})) === false,
   '\u00a7101: kein Fortschritt (30/50) UND klar vorn \u2192 lehnt AB (fr\u00fcher: bedingungslose Zusage)');
ok(aiDrawAcceptDecision(P({scores:[300,300,300,300,300,300], repCount:2})) === true, 'Stellung 2\u00d7 da \u2192 nimmt an (n\u00e4chste Wiederholung w\u00e4re einforderbar, \u00a760/\u00a759a)');
ok(aiDrawAcceptDecision(P({scores:[40,40,40,40,40,40]})) === true, 'exakt leadMax \u2192 nimmt an (\u2264, nicht <)');
// \u00a7101: halfmoves hat auf die ANNAHME gar keinen Einfluss mehr \u2014 nur noch repCount und das
// einseitige Wertfenster entscheiden. Der Halbzug-Z\u00e4hler bleibt reiner ANGEBOTS-Ausl\u00f6ser.
{
  let hmEgal = true;
  for(const hm of [0, 10, 29, 30, 31, 45, 49]){
    if(aiDrawAcceptDecision(P({halfmoves:hm})) !== true) hmEgal = false;                       // ausgeglichen
    if(aiDrawAcceptDecision(P({scores:[100,100,100,100,100,100], halfmoves:hm})) !== false) hmEgal = false; // klar vorn
  }
  ok(hmEgal, '\u00a7101: halfmoves \u00e4ndert die Annahme NIE (0\u201349 gepr\u00fcft) \u2014 Zusage h\u00e4ngt nur an repCount und Wertfenster');
}
ok(aiDrawAcceptDecision(P({scores:[300,300,300,300,300,300], halfmoves:49, repCount:2})) === true,
   '\u00a7101: repCount\u22652 bleibt bedingungslos \u2014 die n\u00e4chste Wiederholung w\u00e4re EINFORDERBAR (\u00a760)');

console.log('\u00a785 Teil 1 \u2014 Angebots-Entscheidung (aiDrawOfferDecision):');
ok(aiDrawOfferDecision(P()) === true, 'stabil im \u00b120-Band, volles Fenster \u2192 bietet an');
ok(aiDrawOfferDecision(P({scores:[5,-10,0,25,-5,10]})) === false, 'ein Wert au\u00dferhalb \u00b1band, kein Stillstand \u2192 bietet nicht an');
ok(aiDrawOfferDecision(P({scores:[35,30,38,32,36,34], halfmoves:30})) === true,
   'Stillstand und NICHT klar vorn (alle \u2264 leadMax 40) \u2192 bietet an (\u00a753f-Ausl\u00f6ser 1 bleibt)');
ok(aiDrawOfferDecision(P({scores:[60,55,70,80,65,75], halfmoves:30})) === false,
   '\u00a7101: Stillstand, aber klar vorn \u2192 bietet NICHT mehr an (der behobene Fall)');
ok(aiDrawOfferDecision(P({blocked:true})) === false, '\u00a753f-Riegel (nach eigenem Angebot) \u2192 kein Angebot bis Fortschritt');
ok(aiDrawOfferDecision(P({cooldown:true})) === false, '\u00a785-D-Cooldown (nach eigener Ablehnung) \u2192 kein Angebot');
ok(aiDrawOfferDecision(P({offers:false})) === false, 'Stufen-Policy offers:false (Einsteiger) \u2192 bietet nie an');
ok(aiDrawOfferDecision(P({scores:[20,-20,20,-20,20,-20]})) === true, 'exakt \u00b1band \u2192 z\u00e4hlt als stabil (\u2264)');
ok(aiDrawOfferDecision(P({scores:[0,0,0]})) === false, 'Fenster nicht voll \u2192 kein Angebot');

console.log('\u00a7101 \u2014 die drei realen Angebotsmomente aus den 1.5-Partien:');
{
  // Fenster = die letzten 6 geloggten Suchwerte vor dem jeweiligen Angebot, meister (leadMax 25),
  // halfmoves 30/50. Quelle: Firebase-Export vom 26.7.
  const M = over => P(Object.assign({leadMax:25, halfmoves:30}, over));
  ok(aiDrawOfferDecision(M({scores:[76,74,72,68,68,52]})) === false,
     '3YUE88D5 (KI klar vorn) \u2192 KEIN Angebot mehr \u2014 vorher bot sie an und Walter nahm an');
  ok(aiDrawOfferDecision(M({scores:[4,-12,-12,-26,-38,-9]})) === true,
     '7FRLMPGQ (ausgeglichen) \u2192 bietet weiterhin an (richtiges Verhalten erhalten)');
  ok(aiDrawOfferDecision(M({scores:[0,0,0,-153,-149,0]})) === true,
     'A8FGX8KZ (KI hinten) \u2192 bietet weiterhin an (Remis rettet den halben Punkt)');
  ok(aiDrawAcceptDecision(M({scores:[76,74,72,68,68,52]})) === false &&
     aiDrawAcceptDecision(M({scores:[0,0,0,-153,-149,0]})) === true,
     'dieselbe Trennung gilt f\u00fcr die ANNAHME eines Menschen-Angebots');
}

console.log('\u00a785 Teil 1 \u2014 INVARIANTE anbieten \u21d2 annehmen (Zufalls-Sweep):');
let inv = true, offered = 0;
for(let i=0;i<5000;i++){
  const n = 1 + Math.floor(Math.random()*8);
  const scores = Array.from({length:n}, ()=> Math.round((Math.random()*2-1)*400));
  const p = P({
    scores, windowN: 1+Math.floor(Math.random()*7),
    leadMax: [25,40,60,80][Math.floor(Math.random()*4)],
    repCount: Math.floor(Math.random()*4),
    halfmoves: Math.floor(Math.random()*55), limit: 50,
    offers: Math.random()<0.8, band: 20,
    blocked: Math.random()<0.3, cooldown: Math.random()<0.3
  });
  if(aiDrawOfferDecision(p)){
    offered++;
    if(!aiDrawAcceptDecision(p)){ inv = false; break; }
  }
}
ok(inv, 'in 5000 Zufallslagen: jedes Angebot w\u00e4re auch angenommen worden (' + offered + ' Angebote gepr\u00fcft)');
// Policy-Tabelle: jede anbietende Stufe muss band \u2264 acceptLeadMax erf\u00fcllen (strukturelle Absicherung der Invariante)
const polMatch = html.match(/const AI_DRAW_POLICY=\{([\s\S]*?)\};/);
const bandMatch = html.match(/const AI_DRAW_OFFER_BAND=(\d+)/);
let polOk = !!polMatch && !!bandMatch;
if(polOk){
  const band = Number(bandMatch[1]);
  const rows = [...polMatch[1].matchAll(/offers:(true|false),\s*acceptLeadMax:\s*(\d+)/g)];
  polOk = rows.length===4 && rows.every(r => r[1]==='false' || Number(r[2])>=band);
}
ok(polOk, 'AI_DRAW_POLICY: jede anbietende Stufe hat acceptLeadMax \u2265 AI_DRAW_OFFER_BAND');

// ── Teil 2: Core 1.2 — meta.score ──
console.log('\u00a785 Teil 2 \u2014 countred_ai_core.js (meta.score, Version 1.2):');
const rulesSb = {console};
vm.createContext(rulesSb);
vm.runInContext(fs.readFileSync(__dirname+'/gembel_rules.js','utf8') +
  '\n;__R={initBoard,getLegalMoves,applyMove,applyMoveOn,applyLockOn,checkFourOn,boardHash,cloneBoard,getBasePiece,getMovingPiece,canLift,canDrop,countRedNeighbors,countRedsInStack,parityOk,coordToLabel,pieceColor,getValidTargets,hasAnyMove,checkThreeInRow,checkFourInRow,canPlaceOnEmpty,canStack,parityOkFor}', rulesSb);
Object.assign(globalThis, rulesSb.__R);
const core = require('./countred_ai_core.js');
globalThis.PARITY_P1 = 'odd';
// §87-Anpassung: Die exakte Versionsnummer pinnt die jeweils AKTUELLE Suite (test_core_87).
// Diese Suite prüft das 1.2-FEATURE selbst (meta.score ab 1.2), damit sie bei künftigen
// Bumps (1.3, …) nicht fälschlich rot wird.
const verNum = parseFloat((core.HEURISTIC_VERSION.match(/countred-ai-(\d+\.\d+)/)||[])[1]);
ok(verNum >= 1.2, "HEURISTIC_VERSION ist countred-ai-\u22651.2 (score-Feature vorhanden; aktuell: "+core.HEURISTIC_VERSION+")");

const cfg = { timeBudgetMs: 400, maxDepth: 2, minDepth: 2, rankPool: 1, blockRate: 1.0, minThinkMs: 0 };
const r0 = core.pickMove(initBoard(), 1, 'odd', cfg, []);
ok(r0.move && typeof r0.meta.score === 'number' && isFinite(r0.meta.score) && Math.abs(r0.meta.score) < 100000,
   'Startstellung: meta.score ist endliche Zahl unterhalb des Mate-Bands (' + r0.meta.score + ')');
const rp = core.pickMove(initBoard(), 1, 'odd', Object.assign({}, cfg, {rankPool:3}), []);
ok(rp.move && typeof rp.meta.score === 'number', 'rankPool 3: meta.score ist der Wert des GEZOGENEN Pool-Zuges (Zahl vorhanden)');

// Sofortsieg-Fall per Zufallspartien suchen: vor jedem Zug findImmediateWin pruefen.
let tookWinChecked = false;
outer:
for(let g=0; g<300 && !tookWinChecked; g++){
  let b = initBoard(), player = 1;
  for(let hm=0; hm<60; hm++){
    const win = core.findImmediateWin(b, player, 'odd');
    if(win){
      const r = core.pickMove(b, player, 'odd', cfg, []);
      ok(r.meta.safety==='took-win' && r.meta.score===100000,
         'Sofortsieg-Stellung: safety took-win + meta.score 100000');
      tookWinChecked = true;
      break outer;
    }
    const ms = getLegalMoves(b, player, 'odd');
    if(!ms.length){ const o=player===1?2:1; if(!getLegalMoves(b,o,'odd').length) break; player=o; continue; }
    const m = ms[Math.floor(Math.random()*ms.length)];
    applyMove(b, m.fr, m.fc, m.tr, m.tc, player);
    const t = applyLockOn(b);
    if(checkFourOn(b)) break;
    let bonus=false;
    if(t && getLegalMoves(b, player, 'odd').length>0) bonus=true;
    if(!bonus) player = player===1?2:1;
  }
}
if(!tookWinChecked) ok(false, 'Sofortsieg-Stellung in 300 Zufallspartien gefunden (nicht erreicht)');
// Zugwahl-Identitaet 1.1\u21921.2: deterministischer Vergleich \u2014 gleicher Seed-Zustand, rankPool 1,
// zweimal dieselbe Stellung \u2192 identischer Zug (Suche unveraendert, nur Rueckgabe erweitert).
const a = core.pickMove(initBoard(), 1, 'odd', cfg, []);
const b2 = core.pickMove(initBoard(), 1, 'odd', cfg, []);
ok(a.move.fr===b2.move.fr && a.move.fc===b2.move.fc && a.move.tr===b2.move.tr && a.move.tc===b2.move.tc,
   'rankPool 1 deterministisch: zweimal dieselbe Stellung \u2192 identischer Zug (Spielverhalten unangetastet)');

// ── Teil 3: Verdrahtungs-Guards ──
console.log('\u00a785 Teil 3 \u2014 Verdrahtung in countred.html:');
const mta = html.match(/async function maybeTriggerAI\(\)\{[\s\S]*?\n\}/m)[0];
ok(mta.indexOf('aiShouldOfferDraw()') > -1 && mta.indexOf('aiShouldOfferDraw()') < mta.indexOf('pickMoveAsync'),
   'Angebots-Gate steht VOR der Suche (Timing-Fix A: Angebot am eigenen Zug)');
ok((mta.match(/aiShouldOfferDraw\(\)/g)||[]).length === 1 && mta.indexOf('aiShouldOfferDraw') < mta.indexOf('await nextTurn'),
   'alter Nach-nextTurn-Angebotsblock ist entfernt (nur noch das eine Gate am Anfang)');
ok(!/aiEvalHistory/.test(html) && !/function isStablyBalanced/.test(html) && !/AI_OFFER_LEAD_MIN/.test(html),
   'alte statische Bewertungs-Maschinerie restlos entfernt (nur Historien-Kommentare erlaubt)');
ok(/aiScoreHistory\.push\(res\.meta\.score\)/.test(html), 'aiScoreHistory wird aus res.meta.score gespeist (Suchwert-Basis B)');
const aad = html.match(/window\.answerAIDraw=function\(yes\)\{[\s\S]*?\n\};/m)[0];
ok(/Remis abgelehnt[\s\S]*maybeTriggerAI\(\)/.test(aad), 'answerAIDraw: nach Ablehnung zieht die KI (maybeTriggerAI)');
const odm = html.match(/window\.offerDrawMvki=function\(\)\{[\s\S]*?\n\};/m)[0];
ok(/aiWouldAcceptDraw\(\)/.test(odm) && /mvkiOfferedThisTurn/.test(odm) && /aiNoOfferBeforeLen\s*=\s*seenPositions\.length\s*\+\s*AI_OFFER_COOLDOWN_HALFMOVES/.test(odm),
   'offerDrawMvki: neue Annahme-Logik + Einmal-pro-Zug-Riegel + Ablehnungs-Cooldown D');
ok(/mvmOfferedThisTurn=false;\s*\n\s*mvkiOfferedThisTurn=false;/.test(html),
   'handleCellClick: Angebotsrecht wird beim eigenen Zug zur\u00fcckgesetzt');
ok(/aiScoreHistory=\[\];[\s\S]{0,400}aiNoOfferBeforeLen=0; mvkiOfferedThisTurn=false;/.test(html),
   'startAIGame: alle \u00a785-Zust\u00e4nde pro Partie zur\u00fcckgesetzt');
ok(/id="ai-draw-offer-overlay"[\s\S]{0,300}Max Michu bietet Remis an/.test(html),
   'KI-Angebots-Overlay sagt \u201eMax Michu\u201c (nicht mehr \u201eMitspieler\u201c)');
ok(/id="draw-offer-overlay"[\s\S]{0,300}Mitspieler bietet Remis an/.test(html),
   'MvM-Overlay unver\u00e4ndert \u201eMitspieler\u201c (Modi sauber getrennt)');
ok(/score:\s+\(meta&&typeof meta\.score==='number'\)\?Math\.round\(meta\.score\):null/.test(html),
   'Zug-Log schreibt das Kalibrierfeld score (null bei human/Altdaten; seit \u00a789a im mvkiLogEntry-Builder)');
ok(/phase!=='playing'\) return false; \/\/ \u00a774-W2-2/.test(html),
   'aiShouldOfferDraw: kein Angebot am/vorm Bonuszug (\u00a774-W2-2 sinngem\u00e4\u00df)');

console.log('\u00a785 E \u2014 Overlay-Deadlock-Fix (Neu-Men\u00fc verdr\u00e4ngt KI-Angebot):');
ok(/let aiDrawOfferPending=false;/.test(html) && /aiDrawOfferPending=true;\s*\/\/ \u00a785 E/.test(html),
   'Pending-Flag deklariert und im Angebots-Gate gesetzt');
const cnm = html.match(/window\.closeNeuMenu=function\(\)\{[\s\S]*?\n\};/m)[0];
ok(/if\(aiDrawOfferPending\) document\.getElementById\('ai-draw-offer-overlay'\)\.classList\.remove\('hidden'\)/.test(cnm),
   'closeNeuMenu stellt ein verdr\u00e4ngtes KI-Angebots-Overlay wieder her (kein Deadlock)');
ok(/window\.answerAIDraw=function\(yes\)\{\s*\n\s*aiDrawOfferPending=false;/.test(html),
   'answerAIDraw l\u00f6scht das Pending-Flag als Erstes');
const rsm = html.match(/window\.resignMvki=function\(\)\{[\s\S]*?\n\};/m)[0];
ok(/aiDrawOfferPending=false;/.test(rsm) && /ai-draw-offer-overlay'\)\.classList\.add\('hidden'\)/.test(rsm),
   'resignMvki r\u00e4umt ein offenes Angebot endg\u00fcltig ab (Aufgeben aus dem Neu-Men\u00fc)');
const abm = html.match(/window\.abortMvkiToModeMenu=function\(\)\{[\s\S]*?\n\};/m)[0];
ok(/aiDrawOfferPending=false;/.test(abm), 'abortMvkiToModeMenu: offenes Angebot verf\u00e4llt mit dem Abbruch');
ok(/mvkiOfferedThisTurn=false; aiDrawOfferPending=false;/.test(html),
   'startAIGame setzt auch das Pending-Flag pro Partie zur\u00fcck');

console.log('\u00a7101 \u2014 Quellcode-W\u00e4chter:');
{
  const acc = extractFn('aiDrawAcceptDecision');
  ok(!/halfmoves/.test(acc),
     'aiDrawAcceptDecision kennt halfmoves gar nicht mehr (die bedingungslose Zusage ist weg)');
  ok(/repCount >= 2/.test(acc) && /drawScoresWithin/.test(acc),
     'geblieben sind genau zwei Wege: einforderbare Wiederholung ODER einseitiges Wertfenster');
  ok(/noProgress/.test(extractFn('aiDrawOfferDecision')),
     'der Halbzug-Z\u00e4hler bleibt ANGEBOTS-Ausl\u00f6ser (nur die Zusage darunter wurde gesch\u00e4rft)');
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

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
