// ═══════════════════════════════════════════════════════════════════
// test_ui_97.js — §97 Oberflächen-Paket (Kosmetik + zwei Timing-Punkte)
// ═══════════════════════════════════════════════════════════════════
// Quellcode-Wächter für Änderungen, die sich sonst nur im Live-Klick zeigen. Der wichtigste
// Punkt ist KEINE Kosmetik: die Stufen-ANZEIGE wurde groß geschrieben, der SCHLÜSSEL muss
// klein bleiben — SKILL_LEVELS, AI_DRAW_POLICY, das Firebase-Feld `skillLevel` und das
// Replay-Werkzeug lesen ihn so. Diese Suite hält genau das fest.
// Aufruf: node test_ui_97.js   (countred.html im selben Ordner)
'use strict';
const fs = require('fs');
const html = fs.readFileSync(__dirname + '/countred.html', 'utf8');

let pass = 0, fail = 0;
function ok(cond, name){
  if(cond){ pass++; console.log('  \u2713 ' + name); }
  else    { fail++; console.log('  \u2717 FAIL: ' + name); }
}

console.log('\u00a797 \u2014 Beschriftungen:');
ok(/>🤖 Gegen Max Michu<\/button>/.test(html) && !/Spiele gegen Max Michu/.test(html),
   'Startmen\u00fc: „Gegen Max Michu" (ohne „Spiele")');
ok(/onclick="showNeuMenu\(\)">☰ Optionen<\/button>/.test(html) && !/>☰ Men\u00fc</.test(html),
   'Werkzeugleiste: „\u2630 Optionen" statt „\u21ba Neu"');
// Auf die AUSGEGEBENE Auszeichnung pruefen, nicht auf den Fliesstext: der Quelltext erwaehnt
// die entfernte Zeile weiterhin im Kommentar (Wiedereinbau-Schutz).
ok(!/>oder \u21ba Neu f\u00fcr weitere Optionen/.test(html) && !/>oder ☰ Optionen/.test(html),
   'Schlussbild ohne Zusatzzeile „oder \u2630 Optionen \u2026" (in BEIDEN Modi entfernt)');
ok((html.match(/winArea\.innerHTML = bannerHtml \+ rematchBtn;/g)||[]).length === 2,
   'Schlussbild besteht in beiden Modi nur noch aus Banner + „Nochmal"-Button');
ok(/\u21ba Neu \(anderer Modus\/Stufe\)/.test(html),
   '„\u21ba Neu (anderer Modus/Stufe)" im Men\u00fc bleibt \u2014 das startet wirklich etwas Neues');

console.log('\u00a797 \u2014 Stufen-Anzeige gro\u00df, Schl\u00fcssel klein:');
ok(/const SKILL_LABEL=\{einsteiger:'Einsteiger'/.test(html) && /function skillLabel\(/.test(html),
   'skillLabel() vorhanden (reine Anzeigeabbildung)');
ok(/🔄 Nochmal \(\$\{skillLabel\(aiSkill\)\}\)/.test(html),
   '„Nochmal (Meister)" nutzt skillLabel, nicht den Rohschl\u00fcssel');
for(const key of ['einsteiger','fortgeschritten','meister']){
  ok(new RegExp("startAIGame\\('"+key+"'\\)").test(html),
     'startAIGame \u00fcbergibt weiterhin den KLEINEN Schl\u00fcssel \u2018'+key+'\u2019 (Logs/Kern-Config)');
}
ok(/skillLevel: aiSkill/.test(html),
   'Firebase-Feld skillLevel schreibt weiterhin den Rohschl\u00fcssel (Altpartien bleiben vergleichbar)');
ok(/AI_DRAW_POLICY\[aiSkill\]/.test(html),
   'AI_DRAW_POLICY wird weiterhin mit dem Rohschl\u00fcssel indiziert');

console.log('\u00a797 \u2014 Schlussbild zentriert:');
ok(/#win-area\{text-align:center;\}/.test(html),
   '#win-area zentriert (deckt „Nochmal"-Button UND die Zeile darunter ab, beide Modi)');

console.log('\u00a797 \u2014 Timing: Mensch kann nicht ziehen:');
ok(/const AI_HUMAN_BLOCKED_PAUSE=(\d+);/.test(html) &&
   parseInt(html.match(/const AI_HUMAN_BLOCKED_PAUSE=(\d+);/)[1],10) >= 2000,
   'AI_HUMAN_BLOCKED_PAUSE \u2265 2000 ms (Lesezeit f\u00fcr die Meldung)');
ok(/if\(gameMode==='mvki' && justMoved===aiPlayer\) aiHumanBlockedPause=true;/.test(html),
   'Flag wird genau im Kein-Zug-Zweig von nextTurn gesetzt');
ok(/const blockedPause=aiHumanBlockedPause; aiHumanBlockedPause=false;/.test(html),
   'Flag wird in maybeTriggerAI EINMALIG verbraucht (kein Dauerzustand)');
ok(/blockedPause \? AI_HUMAN_BLOCKED_PAUSE : \(isBonus \? 900 : 450\)/.test(html),
   'lange Pause ersetzt die normale Vorzugs-Pause; Bonus- und Normalfall unver\u00e4ndert');
ok(/window\.startAIGame=function\(skill='fortgeschritten'\)\{\s*\n\s*aiHumanBlockedPause=false;/.test(html),
   'Flag wird beim Partiestart zur\u00fcckgesetzt (kein \u00dcberhang in die n\u00e4chste Partie)');

console.log('\u00a797 \u2014 Timing: Remis-Angebot:');
{
  const lo = parseInt((html.match(/const AI_DRAW_OFFER_DELAY_MIN=(\d+);/)||[])[1], 10);
  const hi = parseInt((html.match(/const AI_DRAW_OFFER_DELAY_MAX=(\d+);/)||[])[1], 10);
  ok(lo >= 3000 && hi > lo, 'Bedenkzeit vor dem Angebot verl\u00e4ngert (' + lo + '\u2013' + hi + ' ms)');
  ok(lo > 900, 'Angebot dauert deutlich l\u00e4nger als jede normale Zugpause (900 ms Bonusfall)');
}

console.log('Deploy-Guard \u2014 Cache-Bust synchron + Build-Marker:');
{
  const vRules  = (html.match(/gembel_rules\.js\?v=(\d+)/)||[])[1];
  const vCore   = (html.match(/countred_ai_core\.js\?v=(\d+)/)||[])[1];
  const vWorker = (html.match(/countred_ai_worker\.js\?v=(\d+)/)||[])[1];
  const vMarker = (html.match(/Build v(\d+)/)||[])[1];
  ok(!!vRules && vRules===vCore && vCore===vWorker && vWorker===vMarker,
     'html-seitig alle Versionsangaben identisch (v'+vRules+')');
}

console.log('');
console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
process.exit(fail ? 1 : 0);
