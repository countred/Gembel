// ═══════════════════════════════════════════════════════════════════
// test_ui_97.js — §97 Oberflächen-Paket (Kosmetik + zwei Timing-Punkte)
// ═══════════════════════════════════════════════════════════════════
// Quellcode-Wächter für Änderungen, die sich sonst nur im Live-Klick zeigen. Der wichtigste
// Punkt ist KEINE Kosmetik: die Stufen-ANZEIGE wurde groß geschrieben, der SCHLÜSSEL muss
// klein bleiben — SKILL_LEVELS, AI_DRAW_POLICY, das Firebase-Feld `skillLevel` und das
// Replay-Werkzeug lesen ihn so. Diese Suite hält genau das fest.
// Aufruf: node test_ui_97.js   (index.html im selben Ordner)
'use strict';
const fs = require('fs');
// §134: Die Startdatei heisst seit v98 index.html. Diese Suite las bis v106 `countred.html`
// — je nach Ordnerinhalt brach sie entweder ab ODER pruefte eine ALTE Kopie und meldete
// gruen, waehrend die Auslieferung ungeprueft blieb. Beides ist schlimmer als ein Fehlschlag.
// Liegt die Altdatei noch daneben, wird ausdruecklich gewarnt.
const HTML_PATH = __dirname + '/index.html';
if(fs.existsSync(__dirname + '/countred.html'))
  console.log('  \u26a0\ufe0f  countred.html liegt noch im Ordner \u2014 ALTKOPIE, wird NICHT geprueft.');
const html = fs.readFileSync(HTML_PATH, 'utf8');

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
  // §125-NACHZUG: §97 hatte die Bedenkzeit auf 3200–5200 VERLÄNGERT, weil die Suche
  // damals kurz war und das Angebot sonst überging. Seit §121/§123 dauert ein normaler
  // Zug rund 1900 ms — die lange Pause kündigte das Angebot dadurch an (Walter, 3.8.).
  // Geprüft wird jetzt das BLEIBENDE Ziel: deutlich über jeder normalen Zugpause, aber
  // nicht so lang, dass sie das Angebot verrät.
  ok(lo >= 1800 && lo <= 3000 && hi > lo,
     'Bedenkzeit vor dem Angebot im Zielband (' + lo + '\u2013' + hi + ' ms)');
  ok(lo > 900, 'Angebot dauert l\u00e4nger als jede normale Zugpause (900 ms Bonusfall)');
  ok(hi - lo >= 500, 'die Spanne bleibt breit genug, damit die Pause nicht immer gleich wirkt (' + (hi-lo) + ' ms)');
}

console.log('\u00a798 \u2014 Meldungs-Toggle f\u00fcr ALLE Erkl\u00e4rungsf\u00e4lle:');
{
  // Quellcode-W\u00e4chter: der Zweig „Figur ist hebbar" darf lastFailCell NUR noch beim echten
  // Aktivieren l\u00f6schen. Das unbedingte `lastFailCell=null;` davor war der Fehler.
  ok(/if\(targets\.length>0\)\{selected=\[r,c\];validTargets=targets;lastFailCell=null;setLog\(''\);\}\s*\n\s*else explainOrToggle\(r,c,'keine Zielfelder'\);/.test(html),
     'hebbare Figur ohne Zielfeld geht durch explainOrToggle (kein unbedingtes Zur\u00fccksetzen mehr)');
  ok(/\} else \{\s*\n\s*explainOrToggle\(r,c,''\);\s*\n\s*\}/.test(html),
     'nicht hebbare Figur geht durch dieselbe Funktion (eine Stelle statt zwei)');

  // Verhaltenstest: die Toggle-Funktion wird aus der Auslieferung herausgel\u00f6st und mit
  // Attrappen f\u00fcr setLog/debugLog gefahren \u2014 pr\u00fcft die Semantik, nicht nur den Wortlaut.
  const src = (html.match(/function explainOrToggle\(r,c,extra\)\{[\s\S]*?\n\}/)||[])[0];
  ok(!!src, 'explainOrToggle l\u00e4sst sich aus der Auslieferung herausl\u00f6sen');
  if(src){
    const vm2 = require('vm');
    const ctx = { lastFailCell:null, log:null, calls:[],
                  setLog(h){ ctx.log = h; },
                  debugLog(r,c,extra){ ctx.calls.push([r,c,extra]); ctx.log = 'MELDUNG '+r+','+c; } };
    vm2.createContext(ctx);
    vm2.runInContext(src, ctx);
    const tap = (r,c,extra) => vm2.runInContext('explainOrToggle('+r+','+c+',"'+(extra||'')+'")', ctx);
    tap(1,2);            const s1 = ctx.log;
    tap(1,2);            const s2 = ctx.log;
    tap(1,2);            const s3 = ctx.log;
    ok(s1 === 'MELDUNG 1,2' && s2 === '' && s3 === 'MELDUNG 1,2',
       '1. Tipp erkl\u00e4rt \u2192 2. Tipp blendet aus \u2192 3. Tipp erkl\u00e4rt wieder');
    ctx.lastFailCell = null; ctx.log = null;
    tap(1,2); tap(3,0);
    ok(ctx.log === 'MELDUNG 3,0' && ctx.lastFailCell.join() === '3,0',
       'Tipp auf eine ANDERE Zelle erkl\u00e4rt sofort (kein Ausblenden)');
    ctx.calls.length = 0; ctx.lastFailCell = null;
    tap(2,2,'keine Zielfelder');
    ok(ctx.calls.length === 1 && ctx.calls[0][2] === 'keine Zielfelder',
       'der Zusatz „keine Zielfelder" wird unver\u00e4ndert durchgereicht');
  }
}

console.log('\u00a7126 \u2014 kein Tracking, rechtliche Fu\u00dfzeile:');
ok(!/googletagmanager|gtag\('config'|dataLayer/.test(html),
   'Google Analytics ist restlos entfernt (kein gtag, kein dataLayer, kein Skript-Einbindung)');
ok(/function trackEvent\(name,params\)\{\s*\/\* absichtlich leer/.test(html),
   'trackEvent bleibt als leere H\u00fclle \u2014 die sechs Aufrufstellen mussten nicht angefasst werden');
ok(/\u00a7126[\s\S]{0,700}WER ES WIEDER EINBAUEN WILL/.test(html),
   'die Begr\u00fcndung samt Warnung steht im Dateikopf (Wiedereinbau-Schutz)');
ok(/id="legal-footer"/.test(html) &&
   /getElementById\('impressum-overlay'\)\.classList\.remove\('hidden'\)/.test(html) &&
   /getElementById\('datenschutz-overlay'\)\.classList\.remove\('hidden'\)/.test(html),
   'Fu\u00dfzeile mit Impressum und Datenschutz im Startmen\u00fc');
// §127: die Links MUESSEN ohne Funktionsaufruf auskommen. Der Hauptblock ist ein Modul —
// dort deklarierte Funktionen sind nicht global, inline-onclick findet sie NICHT. Genau
// daran sind die Links in §126 gescheitert (sichtbar, aber tot).
ok(!/onclick="showOverlay\(/.test(html) && !/onclick="hideOverlay\(/.test(html),
   'kein inline-onclick auf Modul-interne Funktionen (\u00a7127-Fehler: showOverlay/hideOverlay waren nicht global)');
{
  const foot = html.match(/<div id="legal-footer">[\s\S]*?<\/div>/)[0];
  ok(/<button type="button" class="legal-link"/.test(foot),
     'echte <button>-Elemente statt <span> \u2014 tastaturbedienbar und sichtbar klickbar');
}
ok(/\.legal-link\{[^}]*font-size:12px/.test(html) && /text-decoration:underline/.test(html),
   '\u00a7127: 12px und unterstrichen \u2014 mit 10.5px in --text3 war die Zeile auf dem Rechner unsichtbar');
// §128: zwei gleichzeitig sichtbare Overlays waren der zweite Fehler — auf dem Telefon
// gewann das spätere DOM-Element, auf dem Rechner nicht (backdrop-filter erzeugt einen
// eigenen Stacking-Context). Beide Absicherungen müssen stehen.
{
  const foot = html.match(/<div id="legal-footer">[\s\S]*?<\/div>/)[0];
  ok((foot.match(/getElementById\('mode-overlay'\)\.classList\.add\('hidden'\)/g)||[]).length === 2,
     'beide Links blenden das Startmen\u00fc aus, bevor sie ihr Overlay zeigen');
  ok(/#impressum-overlay, #datenschutz-overlay\{z-index:200;\}/.test(html),
     'beide Rechts-Overlays liegen per z-index \u00fcber den \u00fcbrigen (zweite Absicherung)');
  // Direkt im ganzen Dokument suchen: das Schliessen-Muster ist eindeutig genug, und ein
  // Ausschnitts-Regex ueber verschachtelte <div> ist fehleranfaellig (erster Versuch schlug
  // genau daran fehl — er endete vor dem Button).
  for(const id of ['impressum','datenschutz']){
    const muster = new RegExp("getElementById\\('" + id +
      "-overlay'\\)\\.classList\\.add\\('hidden'\\);document\\.getElementById\\('mode-overlay'\\)\\.classList\\.remove\\('hidden'\\)");
    ok(muster.test(html),
       id + ': Schlie\u00dfen holt das Startmen\u00fc zur\u00fcck (sonst steht der Nutzer vor einem leeren Bildschirm)');
  }
}
ok(/'impressum-overlay','datenschutz-overlay'\]/.test(html),
   'beide Overlays stehen in der Overlay-Liste (sonst schlie\u00dfen sie sich nicht sauber)');
ok(/@media \(max-width:520px\)\{ #legal-footer/.test(html),
   'mobile Feinjustierung vorhanden, ohne den Rechner zu verschieben (Walters Auflage)');
// Der Datenschutztext MUSS zum tatsaechlichen Verhalten passen — sonst ist er schlimmer als keiner.
ok(/setzt keine Cookies/.test(html) && !/googletagmanager/.test(html),
   'die Zusage „keine Cookies" deckt sich mit dem Code (kein Analytics eingebunden)');
ok(/zuf\u00e4llige Kennung/.test(html) && /countred_pkey/.test(html),
   'die Zusage zur Zufallskennung deckt sich mit \u00a7124 (playerKey wirklich vorhanden)');
// \u00a7136: der Text darf nicht MEHR zusagen, als der Code haelt. Eine pseudonyme Kennung ist
// nach DSGVO ein personenbezogenes Datum — die Kurzfassung „es wird nichts erfasst, woraus sich
// eine Person bestimmen laesst" stand gegen den Absatz zwei Zeilen darunter, der genau so eine
// Kennung beschreibt. Beide Pruefungen zusammen halten die Kurzfassung ehrlich.
ok(!/nichts erfasst, woraus sich eine Person bestimmen/.test(html),
   'keine Absolut-Zusage zur Anonymitaet mehr (Wiedereinbau-Schutz)');
ok(/werden nicht erhoben/.test(html) && /Spielverlauf und eine zuf\u00e4llige Kennung/.test(html),
   'die Kurzfassung benennt konkret, was NICHT und was DOCH gespeichert wird');

console.log('\u00a7133 \u2014 Impressum vollst\u00e4ndig (keine Platzhalter mehr):');
{
  // Ein Impressum mit eckigen Klammern ist schlimmer als keines — es sieht aus wie eines,
  // erf\u00fcllt aber nichts. Diese Pr\u00fcfung f\u00e4ngt ein Ausliefern mit Restplatzhaltern ab.
  const platzhalter = html.match(/\[(Vor- und Nachname|Stra\u00dfe und Hausnummer|PLZ und Ort|adresse@example\.de|Datum)\]/g);
  ok(!platzhalter, 'keine Platzhalter mehr im Impressum/Datenschutz' +
     (platzhalter ? ' \u2014 offen: ' + platzhalter.join(', ') : ''));
  const imp = html.match(/id="impressum-overlay"[\s\S]*?Schlie\u00dfen<\/button>/)[0];
  ok(/Guldeinstr/.test(imp) && /80339/.test(imp) && /M\u00fcnchen/.test(imp),
     'ladungsf\u00e4hige Anschrift steht im Impressum (\u00a7 5 DDG verlangt sie, eine E-Mail allein gen\u00fcgt nicht)');
  ok(/mailto:info@countred\.com/.test(imp),
     'E-Mail als anklickbarer mailto-Link');
  ok(/Verantwortlich f\u00fcr den Inhalt/.test(imp) && /Walter Rehm, Anschrift wie oben/.test(imp),
     'inhaltlich Verantwortlicher benannt');
  // \u00a7136: KEIN festes Datum mehr pruefen. Jede Textaenderung zieht das Datum mit, ein
  // gepflegter Erwartungswert waere beim naechsten Mal wieder falsch. Geprueft wird die FORM.
  ok(/Stand: \d{1,2}\. (Januar|Februar|M\u00e4rz|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}/.test(html),
     'die Datenschutzerkl\u00e4rung tr\u00e4gt ein Datum in lesbarer Form');
}

console.log('\u00a7132 \u2014 Wartungsflag:');
{
  ok(/get\(ref\(db,'config'\)\)/.test(html),
     'der GANZE config-Knoten wird gelesen \u2014 sonst sieht man nicht, was Firebase liefert');
  ok(/const WARTUNG_WAHR = \[true, 'true', 1, '1', 'on', 'yes', 'ja', 'offline', 'wartung'\]/.test(html),
     'mehrere Schreibweisen gelten als aktiv (der harte ===true war der Fehler)');
  ok(/console\.warn\('\u00a7132 Wartungsflag NICHT lesbar/.test(html),
     'der catch-Block schweigt nicht mehr \u2014 fehlende Leserechte sahen fr\u00fcher aus wie „Flag steht auf false"');
  ok(/\u00a7132 config gelesen:/.test(html) && /kein Feld `maintenance` unter config/.test(html),
     'beide Diagnosef\u00e4lle melden sich in der Konsole (Knoten fehlt / Feld fehlt)');
  // Die Erkennung selbst als VERHALTEN pruefen, nicht nur als Wortlaut.
  const teil = html.match(/const WARTUNG_WAHR = \[[\s\S]*?const istWartung = v => WARTUNG_WAHR\.some\(w =>[\s\S]*?\);/)[0];
  const c = {}; require('vm').createContext(c);
  require('vm').runInContext(teil + '\n;__f=istWartung;', c);
  const f = c.__f;
  ok(f(true) && f('true') && f('TRUE') && f(' true ') && f('on') && f(1) && f('offline'),
     'true, "true", "TRUE", " true ", "on", 1 und "offline" sperren das Spiel');
  ok(!f(false) && !f('false') && !f('off') && !f(0) && !f('') && !f(null) && !f(undefined),
     'false, "false", "off", 0, leer, null und undefined sperren NICHT');
  ok(!f('vielleicht') && !f('maintenance'),
     'unbekannte Werte sperren NICHT \u2014 ein Tippfehler darf das Spiel nicht stilllegen');
}

console.log('\u00a7134 \u2014 Startmen\u00fc: zwei Kn\u00f6pfe, gestapelt, feste Reihenfolge:');
{
  const menu = html.match(/<p>Wie m\u00f6chtest du spielen\?<\/p>[\s\S]*?<\/div>/)[0];
  ok(/class="card-col"/.test(menu) && !/class="card-row"/.test(menu),
     'card-col statt card-row \u2014 beide Kn\u00f6pfe gleich breit, untereinander (wie die Stufen, \u00a795)');
  const btns = menu.match(/<button[\s\S]*?<\/button>/g) || [];
  ok(btns.length === 2, 'genau ZWEI Kn\u00f6pfe im Startmen\u00fc (' + btns.length + ' gefunden)');
  ok(/Mit Code zu zweit/.test(btns[0]||''),
     '„Mit Code zu zweit" steht OBEN (Walters Vorgabe: die Leute sollen das Spiel weitertragen)');
  ok(/Gegen Max Michu/.test(btns[1]||''),
     '„Gegen Max Michu" steht darunter');
  // KEINE VORAUSWAHL: .big-btn.primary und .big-btn:hover setzen dieselben drei Eigenschaften —
  // ein hervorgehobener Knopf ist von einem überfahrenen nicht zu unterscheiden. Im Startmenü
  // heißt blau deshalb ausschließlich „unter dem Zeiger", wie in allen Untermenüs.
  ok(!btns.some(b => /primary/.test(b)),
     'KEIN Knopf ist vorausgewählt — blau bleibt der Hover-Zustand (Walter, 5.8.)');
  // Auf die KNÖPFE prüfen, nicht auf den Menü-Ausschnitt: der Erläuterungskommentar daneben
  // nennt showMarkedGames absichtlich weiter (Hinweis zum Wiedereinhängen).
  ok(!btns.some(b => /showMarkedGames/.test(b)),
     'kein Einstieg mehr in „Markierte Partien" \u2014 Entwicklerwerkzeug, kein Testspielerknopf');
}
ok(/window\.showMarkedGames=async function/.test(html) && /id="marks-overlay"/.test(html),
   'showMarkedGames und marks-overlay bleiben im Quelltext \u2014 wieder einh\u00e4ngbar ohne Neubau');

console.log('\u00a7134 \u2014 Marker in Freundessprache:');
ok(!/markieren \(f\u00fcr Analyse\)/.test(html),
   'die Entwicklerbeschriftung „markieren (f\u00fcr Analyse)" ist raus (beide Stellen)');
ok((html.match(/📌 Hier stimmt(e)? was nicht/g)||[]).length === 2,
   'beide Men\u00fczust\u00e4nde (laufend/beendet) tragen die neue Beschriftung');
ok((html.match(/onclick="closeNeuMenu\(\);markMvkiPosition\(\)"/g)||[]).length === 2,
   'die Funktion dahinter ist unver\u00e4ndert dieselbe');

console.log('\u00a7134 \u2014 sichtbare Test-Kennung:');
{
  ok(/<div id="test-key" class="hidden">Test-Kennung: <span id="test-key-val"><\/span><\/div>/.test(html),
     'Zeile steht im Startmen\u00fc, anf\u00e4nglich verborgen');
  ok(/#test-key\.hidden\{display:none;\}/.test(html),
     '.hidden ist F\u00dcR DIESES ELEMENT definiert \u2014 die Klasse ist in dieser Datei NICHT global');
  ok(/if\(PLAYER_KEY\)\{[\s\S]{0,240}_tk\.classList\.remove\('hidden'\)/.test(html),
     'die Zeile wird nur eingeblendet, wenn es wirklich eine Kennung gibt (privater Modus: bleibt weg)');
  ok(html.indexOf('id="test-key"') < html.indexOf("getElementById('test-key')"),
     'das Element steht im Dokument, bevor das Skript es sucht');
}

// ═══════════════════════════════════════════════════════════════════
// §140 — WORTLAUT-WAECHTER: ein Wort je Sache, in Regeltext, Meldungen und Anleitung
// gleich. Die drei Texte sind dreimal dasselbe Regelwerk; laufen die Woerter
// auseinander, lernt ein Neuling die Anleitung und findet sie im Spiel nicht wieder.
// Geprueft wird der SICHTBARE Text (Kommentare und Bezeichner ausgeblendet) — die
// internen Namen halfmoves/HALFMOVE_DRAW_LIMIT bleiben ausdruecklich, die Suiten pinnen sie.
// ═══════════════════════════════════════════════════════════════════
console.log('\u00a7140 \u2014 Wortlaut:');
{
  const sicht = html.replace(/<!--[\s\S]*?-->/g,'')
                    .replace(/^\s*\/\/[^\n]*/gm,'')
                    .replace(/\/\*[\s\S]*?\*\//g,'');
  ok(!/Dreierreihe/.test(sicht), 'kein "Dreierreihe" \u2014 es hei\u00dft "Drei in einer Spalte", kurz "Dreier"');
  ok(!/Halbzug|Halbz\u00fcge/.test(sicht), 'kein "Halbzug" \u2014 es hei\u00dft "Zug"');
  ok(!/Revanche/.test(sicht), 'kein "Revanche" \u2014 es hei\u00dft "Nochmal" (so steht es auf dem Knopf)');
  ok(!/Wegziehen|Abstellen auf/.test(sicht), 'kein "Wegziehen"/"Abstellen" \u2014 es hei\u00dft "Anheben"/"Absetzen"');
  ok(!/Entstapeln/.test(sicht), 'kein "Entstapeln" \u2014 es hei\u00dft "Stapel aufl\u00f6sen"');
  // Vollstaendigkeit: die vier Regeln, die beim Abgleich gefehlt haben.
  ok(/Eine Einzelfigur auf einem gesperrten Feld ist unbeweglich/.test(html),
     'Regeltext nennt die unbewegliche Einzelfigur auf gesperrtem Feld (canLift: locked \u2192 false)');
  ok(/nur die Top-Figur, nie der Stapel als Ganzes/.test(html),
     'Regeltext nennt: bewegt wird nur die Top-Figur');
  ok(/Ist kein Bonuszug m\u00f6glich, zieht der Mitspieler/.test(html),
     'Regeltext nennt den Fall "kein Bonuszug m\u00f6glich"');
  ok(/Bei einem Stapel z\u00e4hlt die Basis, nicht die Figur darauf/.test(html),
     'Regeltext nennt beim ZIEL, dass die Basis z\u00e4hlt (checkFourInRow liest getBasePiece)');
  // §140-Fund 3: der regelwidrige locked-Zweig darf nicht zurueckkehren.
  ok(!/targetCell\.locked\)\{setLog/.test(html),
     'dropFailLog hat KEINEN locked-Zweig mehr \u2014 auf gesperrte Einzelfiguren darf gestapelt werden (canStack v2.1)');
}

console.log('Deploy-Guard \u2014 Cache-Bust synchron + Build-Marker:');
{
  const vRules  = (html.match(/gembel_rules\.js\?v=(\d+)/)||[])[1];
  const vCore   = (html.match(/countred_ai_core\.js\?v=(\d+)/)||[])[1];
  const vWorker = (html.match(/countred_ai_worker\.js\?v=(\d+)/)||[])[1];
  const vMarker = (html.match(/Build v(\d+)/)||[])[1];
  ok(!!vRules && vRules===vCore && vCore===vWorker && vWorker===vMarker,
     'html-seitig alle Versionsangaben identisch (v'+vRules+')');
  // §139 — FUENFTER LADEWEG: anleitung.html laedt die Regelschicht selbst und wird aus
  // index.html mit ?v= verlinkt. Diese Suite prueft nur die html-Seite (kein Worker),
  // also auch hier nur die html-seitigen Angaben.
  const anlPath = __dirname + '/anleitung.html';
  ok(fs.existsSync(anlPath), 'anleitung.html liegt im Ordner (seit \u00a7139 Teil der Auslieferung)');
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
