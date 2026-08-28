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

// §147: die Schriftgroessen stehen seit v116 als Skala in :root. Wer eine Groesse pruefen
// will, muss sie AUFLOESEN — sonst prueft man den Variablennamen statt der Zahl. Der Helfer
// liest die Skala aus der Auslieferung, damit kein zweiter Wert gepflegt werden muss.
const SKALA = {};
// \u00a7151: NUR der erste :root-Block. Seit es eine mobile Ueberschreibung gibt, wuerde ein
// Suchlauf ueber die ganze Datei den Grundwert mit dem Mobilwert ueberschreiben — und dann
// pruefte man am Ende zwei Mal dieselbe Zahl gegeneinander.
function skalaAus(text){
  const i = text.indexOf(':root{');
  const roh = i < 0 ? '' : text.slice(i, text.indexOf('}', i));
  const o = {};
  for(const m of (roh.match(/--fs-[a-z]+:\s*[0-9.]+px/g) || []))
    o[m.split(':')[0].trim()] = parseFloat(m.split(':')[1]);
  return o;
}
Object.assign(SKALA, skalaAus(html));
// px-Wert einer Deklaration, egal ob Literal oder Variable
function px(text){
  if(text == null) return null;
  const v = String(text).match(/var\(\s*(--fs-[a-z]+)\s*\)/);
  if(v) return SKALA[v[1]] != null ? SKALA[v[1]] : null;
  const z = String(text).match(/([0-9.]+)px/);
  return z ? Number(z[1]) : null;
}

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
{
  const regel = (html.match(/\.legal-link\{[^}]*\}/)||[''])[0];
  const g = px((regel.match(/font-size:[^;]+/)||[''])[0]);
  ok(g !== null && g >= 12 && /text-decoration:underline/.test(html),
     '\u00a7127: mindestens 12px und unterstrichen (gemessen ' + g + 'px) \u2014 mit 10.5px war die Zeile auf dem Rechner unsichtbar');
}
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
ok(/'impressum-overlay','datenschutz-overlay'/.test(html),
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

console.log('\u00a7144 \u2014 Startmen\u00fc: DREI Kn\u00f6pfe, gestapelt, neue Reihenfolge:');
{
  const menu = html.match(/<p>Wie m\u00f6chtest du spielen\?<\/p>[\s\S]*?<\/div>/)[0];
  ok(/class="card-col"/.test(menu) && !/class="card-row"/.test(menu),
     'card-col statt card-row \u2014 alle Kn\u00f6pfe gleich breit, untereinander (wie die Stufen, \u00a795)');
  const btns = menu.match(/<button[\s\S]*?<\/button>/g) || [];
  // \u00a7144 (Walter, 27.8.): aus zwei Knoepfen werden drei. Das kippt \u00a7139 (bewusst kein
  // dritter big-btn) und die \u00a7134-Reihenfolge \u2014 beides bewusst, beides im Startmenue-
  // Kommentar begruendet. Geprueft wird die REIHENFOLGE, weil genau sie die Betonung traegt:
  // die Anleitung zuerst, der gesperrte Modus zuletzt.
  ok(btns.length === 3, 'genau DREI Kn\u00f6pfe im Startmen\u00fc (' + btns.length + ' gefunden)');
  ok(/Interaktive Spielanleitung/.test(btns[0]||'') && /anleitung\.html\?v=/.test(btns[0]||''),
     '„Interaktive Spielanleitung" steht OBEN und f\u00fchrt mit ?v= auf die Anleitung');
  ok(/Gegen Max Michu/.test(btns[1]||''),
     '„Gegen Max Michu" steht in der MITTE');
  ok(/Mit Code zu zweit/.test(btns[2]||'') && /id="btn-mvm"/.test(btns[2]||''),
     '„Mit Code zu zweit" steht UNTEN und tr\u00e4gt die Kennung f\u00fcr die Sperre');
  ok(!/Neu hier\?/.test(html) && !/class="anleitung-link"/.test(html) && !/^\.anleitung-link\{/m.test(html),
     'die alte „Neu hier?"-Zeile ist restlos entfernt — Text, Markup und Stilregel (der Kommentar darf sie nennen)');
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

console.log('\u00a7144 \u2014 Markierknopf AUSGEH\u00c4NGT, nicht entfernt:');
// \u00a7144 (Walter, 27.8.): der Knopf verwirrt Testpersonen oder erzeugt unnoetige Rueckfragen.
// Walter braucht ihn selbst weiter, deshalb muss der Rueckweg EIN Schalter sein. Geprueft wird
// deshalb nicht \u201eweg\u201c, sondern \u201eausgehaengt und vollstaendig wieder einhaengbar\u201c \u2014 dasselbe
// Muster wie showMarkedGames() seit \u00a7134.
ok(!/markieren \(f\u00fcr Analyse\)/.test(html),
   'die Entwicklerbeschriftung „markieren (f\u00fcr Analyse)" ist raus (beide Stellen)');
ok(/const MARK_UI\s*=\s*false;/.test(html),
   'MARK_UI steht auf false \u2014 der Knopf wird nicht ausgeliefert');
ok((html.match(/\$\{MARK_UI \? `<button[^`]*markMvkiPosition\(\)[^`]*`\s*:\s*''\}/g)||[]).length === 2,
   'BEIDE Men\u00fczust\u00e4nde (laufend/beendet) h\u00e4ngen am selben Schalter');
ok((html.match(/📌 Hier stimmt(e)? was nicht/g)||[]).length === 2,
   'beide Beschriftungen stehen weiter im Quelltext (Wiedereinbau ohne Neuformulierung)');
ok((html.match(/onclick="closeNeuMenu\(\);markMvkiPosition\(\)"/g)||[]).length === 2,
   'die Funktion dahinter ist unver\u00e4ndert dieselbe');
ok(/window\.markMvkiPosition=|async function markMvkiPosition|function markMvkiPosition/.test(html) &&
   /games_countred_marks/.test(html),
   'Schreibweg nach games_countred_marks unangetastet \u2014 keine Regelarbeit n\u00f6tig, keine Daten verloren');

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
console.log('\u00a7142 \u2014 Kartenbreiten:');
{
  // Die vier Karten mit langem Fliesstext gehoeren zusammen und muessen breit sein
  // (Zeilenlaenge, s. Kommentar in index.html). Die Dialogkarten bleiben schmal.
  const breiteVon = id => {
    const i = html.indexOf('id="'+id+'"');
    if(i < 0) return null;
    const m = html.slice(i, i+400).match(/width:min\((\d+)px,\s*(\d+)vw\)/);
    return m ? {px:Number(m[1]), vw:Number(m[2])} : null;
  };
  const lang  = ['impressum-overlay','datenschutz-overlay','marks-overlay','regeln-overlay'];
  const kurz  = ['mode-overlay','neu-overlay','ai-setup-overlay'];
  const werte = lang.map(breiteVon);
  ok(werte.every(x => x && x.px === 560),
     'die vier Fliesstext-Karten tragen 560px: ' + lang.map((n,i)=>n+'='+(werte[i]?werte[i].px:'?')).join(', '));
  ok(werte.every(x => x && x.vw >= 90),
     'auf dem Telefon greift weiterhin die Prozentbreite (\u2265 90vw)');
  // 75 Zeichen je Zeile sind das obere Ende des gut Lesbaren — darueber wird es schlechter,
  // nicht besser. Die Grenze steht hier, damit "noch breiter" nicht unbemerkt passiert.
  ok(werte.every(x => x && x.px <= 640),
     'keine Fliesstext-Karte ueber 640px \u2014 laengere Zeilen lesen sich SCHLECHTER');
  // Die Dialogkarten tragen KEINE eigene Breite — sie erben die schmale Grundbreite aus
  // `.card`. Genau das ist die Trennlinie: wer Fliesstext zeigt, setzt sich breiter; wer
  // zwei Knoepfe zeigt, laesst es. Geprueft wird deshalb beides.
  // Schriftgroesse: Breite allein macht nichts lesbarer. Die drei Karten mit echtem
  // Fliesstext tragen dieselbe Groesse, und sie ist nicht mehr die alte 13px.
  const schriftVon = id => {
    const i = html.indexOf('id="'+id+'"');
    if(i < 0) return null;
    // §147: die Groesse kann Literal ODER var(--fs-xx) sein — beides aufloesen.
    const m2 = html.slice(i, i+1400).match(/font-size:([^;]+);line-height:1\.6/);
    return m2 ? px(m2[1]) : null;
  };
  const textKarten = ['impressum-overlay','datenschutz-overlay','regeln-overlay'];
  const groessen = textKarten.map(schriftVon);
  ok(groessen.every(g => g !== null && g >= 14),
     'der Fliesstext ist mindestens 14px gross: ' +
     textKarten.map((n,i)=>n+'='+groessen[i]).join(', '));
  ok(new Set(groessen).size === 1,
     'alle drei Fliesstext-Karten tragen dieselbe Schriftgroesse');

  const grund = (html.match(/\.card\{[^}]*width:min\((\d+)px/)||[])[1];
  ok(Number(grund) <= 360, 'die Grundbreite der Karten bleibt schmal (' + grund + 'px)');
  ok(kurz.every(id => breiteVon(id) === null),
     'die Dialogkarten setzen keine eigene Breite und erben die schmale: ' +
     kurz.filter(id => breiteVon(id) !== null).join(', ') || 'alle erben');
}

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
  ok(/Gesperrt hei\u00dft: Diese Figur l\u00e4sst sich nicht mehr bewegen/.test(html),
     'Regeltext sagt, was gesperrt heisst (canLift: locked \u2192 false)');
  // Und ebenso, was es NICHT heisst. "Gesperrt" liest sich sonst als "hier geht gar
  // nichts mehr" — dabei erlaubt canStack das Stapeln auf die gesperrte Figur, und
  // canLift gibt dem Stapelbauer die obere Figur wieder her.
  ok(/Auf sie darf aber weiterhin gestapelt werden/.test(html),
     'Regeltext: auf die gesperrte Figur darf gestapelt werden');
  ok(/obere Figur eines so gebildeten Stapels darf auch wieder heruntergenommen werden/.test(html),
     'Regeltext: die obere Figur darf wieder heruntergenommen werden');
  // §140-Sprachregelung: gesperrt ist die FIGUR, nicht das Feld. Auf eine gesperrte
  // Basis-Figur darf gestapelt werden — wer vom „gesperrten Feld" spricht, behauptet
  // das Gegenteil und widerspricht canStack.
  ok(!/gesperrte[snm]? Feld|Felder werden gesperrt|gesperrten Feldern/.test(sicht),
     'kein "gesperrtes Feld" \u2014 gesperrt ist die Basis-Figur, das Feld bleibt bespielbar');
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

console.log('\u00a7144 \u2014 Freischaltung des Zwei-Personen-Modus:');
{
  // Die Sperre ist KEIN Betrugsschutz (client-autoritativ, s. Kommentar im Kern-Block) und
  // darf deshalb auch nicht so geprueft werden. Geprueft wird, dass sie (a) niemanden
  // aussperrt, den sie nicht aussperren soll, (b) bei kaputtem Speicher NICHT oeffnet und
  // (c) in einem Schritt vollstaendig abschaltbar ist.
  ok(/const MVM_GATE\s*=\s*true;/.test(html), 'MVM_GATE steht auf true (Sperre ausgeliefert)');
  ok(/const GATE_NEED\s*=\s*3;/.test(html), 'Schwelle: 3 Punkte');

  // Walters Schwelle als Konto: 3x Einsteiger ODER 2x Fortgeschritten ODER 1x Meister.
  const pts = html.match(/const GATE_WIN_POINTS\s*=\s*\{([^}]*)\}/);
  ok(!!pts, 'GATE_WIN_POINTS vorhanden');
  if(pts){
    const g = k => parseFloat((pts[1].match(new RegExp(k+':\\s*([0-9.]+)'))||[])[1]);
    ok(g('einsteiger')*3 === 3 && g('fortgeschritten')*2 === 3 && g('meister')*1 === 3,
       'die drei genannten Wege ergeben exakt die Schwelle (3x1, 2x1,5, 1x3)');
    ok(g('einsteiger') < g('fortgeschritten') && g('fortgeschritten') < g('meister'),
       'die Punkte steigen mit der Spielst\u00e4rke (sonst w\u00e4re die schw\u00e4chere Stufe der schnellere Weg)');
  }

  // \u00a7136-Belegregel: die Gutschrift MUSS an der Stelle sitzen, an der die Partie geloggt wird.
  // Sonst gibt es Freischaltungen ohne Datensatz und Walter kann nichts nachrechnen.
  const fin = html.match(/async function finalizeMvkiGame[\s\S]*?await update/);
  ok(!!fin && /gateAward\(aiSkill\)/.test(fin[0]),
     'die Gutschrift steht in finalizeMvkiGame \u2014 zu jeder Freischaltung geh\u00f6rt ein geloggter Datensatz');
  ok((html.match(/gateAward\(/g)||[]).length === 2,
     'gateAward hat genau EINEN Aufrufer (Definition + Aufruf) \u2014 keine zweite Z\u00e4hlstelle');
  ok(/if\(winner && winner===myPlayer\) gateAward/.test(html),
     'nur ein echter Sieg des Menschen z\u00e4hlt (Remis kommt als null, Aufgeben als aiPlayer)');

  // Der gesperrte Knopf muss ANTIPPBAR bleiben \u2014 sonst kommt niemand an den Erkl\u00e4rtext.
  // \u00a7148 (Walters Befund, 27.8.): die Sperre lag auf dem Startmen\u00fc-Knopf \u2014 und der ist die
  // T\u00fcr zu BEIDEM. Ein Eingeladener mit 0 Punkten kam dadurch nicht an das Codefeld, obwohl
  // Quelltext und Handover „nur das Er\u00f6ffnen ist gesperrt\" behaupteten. Gepr\u00fcft wird jetzt
  // die ABSICHT, nicht die Zeile, die ich geschrieben habe.
  ok(/id="btn-mvm" onclick="showLobby\(\)"/.test(html),
     'die Lobby steht JEDEM offen \u2014 der Startmen\u00fc-Knopf ist nicht mehr gesperrt');
  ok(/id="btn-create" onclick="tryCreateRoom\(\)"/.test(html),
     'die Sperre sitzt am Knopf \u201eRaum erstellen\u201c');
  ok(/onclick="showJoinScreen\(\)"/.test(html) && !/tryJoin|gateOpen\(\)[^;]*showJoinScreen/.test(html),
     '\u201eBeitreten\u201c ist an KEINE Bedingung gekn\u00fcpft (Walters Vorgabe: Eingeladene brauchen keine Punkte)');
  ok(!/id="btn-create"[^>]*disabled/.test(html),
     'der gesperrte Knopf ist nicht disabled (er f\u00fchrt zum Erkl\u00e4rtext, statt nichts zu tun)');
  ok(/window\.tryCreateRoom = function\(\)\{ if\(gateOpen\(\)\) createRoom\(\); else openGateInfo\(\); \}/.test(html),
     'Antippen f\u00fchrt entweder ins Erstellen oder in die Erkl\u00e4rung \u2014 nie ins Leere');
  ok(/id="gate-score"[^>]*onclick="openGateInfo\(\)"/.test(html),
     'die Punktezeile ist anklickbar \u2014 auch nach der Freischaltung noch der Weg zum \u00dcbertragungscode');
  ok(/title = open \? '' : GATE_TIP/.test(html) && /3\u00d7 Einsteiger, 2\u00d7 Fortgeschritten oder 1\u00d7 Meister/.test(html),
     '\u00dcberfahren erkl\u00e4rt die Bedingung (Rechner), Antippen ebenfalls (Telefon kennt kein Hover)');

  // \u00a7127-Lehre: inline-onclick sucht im GLOBALEN Scope. Modul-interne Funktionen sind dort
  // nicht sichtbar \u2014 genau daran ist die \u00a7126-Fusszeile einmal gescheitert.
  for(const fn of ['tryCreateRoom','openGateInfo','redeemGateCode'])
    ok(new RegExp('window\\.'+fn+'\\s*=').test(html),
       fn + ' h\u00e4ngt an window (\u00a7127: inline-onclick erreicht Modul-Funktionen sonst nicht)');
  ok(/'impressum-overlay','datenschutz-overlay','gate-overlay'\]/.test(html),
     'gate-overlay steht in der Overlay-Liste (sonst schlie\u00dft es sich nicht sauber)');

  // Ein kaputter oder fremder Speicherstand darf NIE mehr erlauben als ein leerer.
  ok(/if\(o\.c !== gateSig\(p,von\)\)\{[\s\S]{0,220}return \{ p:0, von:\{\} \};/.test(html),
     'Pr\u00fcfsumme passt nicht \u2192 Stand f\u00e4llt auf NULL zur\u00fcck, nicht auf freigeschaltet');
  ok(/catch\(e\)\{ return \{ p:0, von:\{\} \}; \}/.test(html),
     'gesperrter Speicher (privater Modus) sperrt ebenfalls, statt zu \u00f6ffnen');
  ok(!/gateState\.u\b/.test(html),
     '\u00a7148: kein zweites Freischalt-Flag mehr \u2014 offen ist, wer die Schwelle erreicht (eine Quelle)');

  // \u00dcbertragungscode: Walters Bauart \u2014 individuell gestempelt, \u00fcberall einl\u00f6sbar,
  // aber OHNE Kennungs\u00fcbernahme (\u00a7124 bleibt intakt: eine Kennung = ein Browserprofil).
  ok(/return k \+ '-' \+ t \+ '-' \+ gateHash/.test(html),
     'der Code tr\u00e4gt die Kennung des ausstellenden Ger\u00e4ts');
  ok(!/localStorage\.setItem\('countred_pkey'[\s\S]{0,200}gateReadCode|gateReadCode[\s\S]{0,400}countred_pkey/.test(html),
     'das Einl\u00f6sen \u00fcberschreibt die eigene Kennung NICHT (kein Zusammenwachsen, Walters Entscheid)');
  ok(/if\(PLAYER_KEY && r\.key === PLAYER_KEY\)/.test(html),
     'der eigene Code auf dem eigenen Ger\u00e4t wird abgewiesen (w\u00e4re eine Verdopplung)');
  ok(/const vorher = gateSumme\(\), alt = gateState\.von\[r\.key\] \|\| 0;/.test(html) &&
     /if\(r\.p > alt\)\{ gateState\.von\[r\.key\] = r\.p;/.test(html),
     '\u00a7148: je Aussteller EIN Eintrag \u2014 anheben statt addieren');

  // Der Schalter muss allein gen\u00fcgen. Geprueft wird die ZWEITE Stellung im vm: MVM_GATE=false
  // muss gateOpen() bedingungslos wahr machen, auch bei leerem Punktestand.
  const src = ['MVM_GATE','GATE_NEED'].map(n => (html.match(new RegExp('const '+n+'[^;]*;'))||[''])[0]).join('\n');
  const fn  = (html.match(/function gateOpen\(\)\{[^}]*\}/)||[''])[0];
  ok(!!fn, 'gateOpen() als eigene Funktion vorhanden (eine Stelle entscheidet)');
  if(fn){
    const vmod = require('vm');
    // §148: gateOpen() rechnet ueber gateSumme() — die Funktion muss mit in den vm.
    const summe = (html.match(/function gateSumme\(\)\{[\s\S]*?\n\}/)||[''])[0];
    const mk = gate => {
      const ctx = {};
      vmod.createContext(ctx);
      vmod.runInContext('let gateState={p:0,von:{}};\n' +
                        src.replace(/const MVM_GATE\s*=\s*true;/, 'const MVM_GATE = '+gate+';') +
                        '\n' + summe + '\n' + fn + '\n;__O=gateOpen();', ctx);
      return ctx.__O;
    };
    ok(mk(true) === false, 'MVM_GATE=true, 0 Punkte \u2192 gesperrt');
    ok(mk(false) === true, 'MVM_GATE=false \u2192 offen wie vor v113, ohne jeden weiteren Eingriff');
  }
}

console.log('\u00a7144 \u2014 VERHALTEN: die Mechanik wird wirklich gefahren (\u00a7136, nicht nur gelesen):');
{
  // Die Funktionen werden aus der AUSLIEFERUNG geloest und im vm mit einem Speicher-Ersatz
  // betrieben. Quelltextmuster oben pruefen die Absicht \u2014 hier laeuft sie.
  // \u26a0\ufe0f `let gateState` lebt im vm-SKRIPTBEREICH, nicht auf dem Kontextobjekt: von aussen
  // gelesen bekaeme man eine tote Kopie. Deshalb geht der Zugriff ueber Getter/Setter.
  const vmod = require('vm');
  const block = (html.match(/const MVM_GATE[\s\S]*?function gateReadCode\(txt\)\{[\s\S]*?\n\}/)||[])[0];
  ok(!!block, 'der \u00a7144-Block ist als Ganzes aus der Auslieferung l\u00f6sbar');
  if(block){
    let store = {};
    const ctx = { PLAYER_KEY:'BWpirSxjlz5b', console:{warn(){},log(){}},
      localStorage:{ getItem:k => (k in store ? store[k] : null), setItem:(k,v)=>{ store[k]=String(v); } },
      document:{ getElementById:()=>null } };
    vmod.createContext(ctx);
    vmod.runInContext(block + '\nfunction gateRefresh(){}' +
      '\n;__G={gateLoad,gateSave,gateOpen,gateAward,gateMakeCode,gateReadCode,' +
      'gateSumme,gateStandSatz,get p(){return gateState.p}, set st(v){gateState=v},' +
      'gutschrift(k,w){const a=gateState.von[k]||0; if(w>a){gateState.von[k]=w; gateSave();}}};', ctx);
    const G = ctx.__G;

    G.st = { p:0, von:{} };
    ok(G.gateOpen() === false, 'frischer Browser, 0 Punkte \u2192 gesperrt');
    G.gateAward('einsteiger'); G.gateAward('einsteiger');
    ok(G.p === 2 && !G.gateOpen(), 'zwei Einsteiger-Siege = 2 Punkte \u2192 weiter gesperrt');
    G.gateAward('einsteiger');
    ok(G.p === 3 && G.gateOpen(), 'dritter Einsteiger-Sieg \u2192 offen (Walters Weg 1)');
    G.st = { p:0, von:{} }; G.gateAward('fortgeschritten'); G.gateAward('fortgeschritten');
    ok(G.p === 3 && G.gateOpen(), 'zwei Fortgeschritten-Siege \u2192 offen (Walters Weg 2)');
    G.st = { p:0, von:{} }; G.gateAward('meister');
    ok(G.p === 3 && G.gateOpen(), 'ein Meister-Sieg \u2192 offen (Walters Weg 3)');
    G.st = { p:0, von:{} }; G.gateAward('einsteiger'); G.gateAward('fortgeschritten');
    ok(G.p === 2.5 && !G.gateOpen(), 'gemischt 1 + 1,5 = 2,5 \u2192 noch gesperrt (kein Rundungsgeschenk)');

    // Ein kaputter Stand darf NIE mehr erlauben als ein leerer \u2014 hier wirklich nachgefahren.
    store['countred_gate'] = JSON.stringify({ p:99, von:{}, c:'FAELSCH' });
    G.st = G.gateLoad();
    ok(G.p === 0 && !G.gateOpen(), 'gef\u00e4lschte Pr\u00fcfsumme \u2192 Stand f\u00e4llt auf NULL, nicht auf offen');
    store['countred_gate'] = '{kaputt';
    G.st = G.gateLoad();
    ok(!G.gateOpen(), 'kaputter JSON \u2192 gesperrt statt Absturz');

    // \u00dcbertragungscode: Walters Bauart, an echten Zeichenketten gefahren.
    G.st = { p:3, u:false };
    const code = G.gateMakeCode();
    ok(/^BWpirSxjlz5b-30-[0-9A-Z]{7}$/.test(code),
       'Code tr\u00e4gt Kennung des Ausstellers und Punkte\u00d710 (' + code + ')');
    ok((G.gateReadCode(code)||{}).p === 3, 'der eigene Code wird gelesen');
    ok(G.gateReadCode(code.slice(0,-1) + 'X') === null, 'ein ver\u00e4ndertes Zeichen macht den Code ung\u00fcltig');
    ok(G.gateReadCode('BWpirSxjlz5b-99-' + code.split('-')[2]) === null,
       'hochgesetzte Punktzahl f\u00e4llt durch die Pr\u00fcfsumme');
    ok(G.gateReadCode('  ' + code + '  ') !== null, 'Leerzeichen beim Kopieren schaden nicht');
    ok(G.p === 3, 'das Ausstellen \u00e4ndert den eigenen Stand nicht');

    // \u00a7148: Gutschriftenbuch \u2014 addieren, aber je Aussteller nur einmal, und ohne Kreis.
    G.st = { p:2, von:{} };
    ok(!G.gateOpen(), 'zwei selbst erspielte Punkte: gesperrt');
    G.gutschrift('BBBBBBBBBBBB', 1);
    ok(G.gateSumme() === 3 && G.gateOpen(),
       'ein Code \u00fcber 1 Punkt bringt die Summe auf 3 \u2014 TEILPUNKTE z\u00e4hlen mit');
    G.gutschrift('BBBBBBBBBBBB', 1);
    ok(G.gateSumme() === 3, 'derselbe Aussteller nochmal \u2192 keine Ver\u00e4nderung (nur einmal einl\u00f6sbar)');
    G.gutschrift('CCCCCCCCCCCC', 1);
    ok(G.gateSumme() === 4, 'ein DRITTES Ger\u00e4t tr\u00e4gt bei \u2014 und es gibt KEINEN Deckel bei 3');
    G.gutschrift('BBBBBBBBBBBB', 2.5);
    ok(G.gateSumme() === 5.5, 'sp\u00e4terer Code desselben Ger\u00e4ts HEBT den Eintrag an (1 \u2192 2,5), addiert ihn nicht');
    // Der Code darf nur die SELBST erspielten Punkte tragen — sonst entsteht ein Kreis:
    // A schickt an B, B zur\u00fcck an A, und A schreibt seine eigenen Punkte erneut gut.
    const eigen = G.gateReadCode(G.gateMakeCode());
    ok(eigen.p === 2 && G.gateSumme() === 5.5,
       'der ausgestellte Code tr\u00e4gt nur die eigenen 2 Punkte, nicht die Summe 5,5 (kein Kreis)');
    ok(G.gateStandSatz() === 'Du hast 5,5 Punkte.',
       'freigeschaltet: Stand ohne Schwelle \u2014 „' + G.gateStandSatz() + '\u201c');
    G.st = { p:1, von:{} };
    ok(G.gateStandSatz() === 'Du hast 1 von 3 Punkten.',
       'gesperrt: Stand mit Schwelle \u2014 „' + G.gateStandSatz() + '\u201c');
    // Die Pruefsumme muss das Buch mittragen und darf nicht an der Schluesselreihenfolge haengen.
    G.st = { p:1, von:{ 'ZZZZZZZZZZZZ':1.5, 'YYYYYYYYYYYY':1 } };
    G.gateSave();
    const nachLaden = (G.st = G.gateLoad(), G.gateSumme());
    ok(nachLaden === 3.5, 'Stand mit mehreren Gutschriften \u00fcbersteht das Neuladen (' + nachLaden + ')');
  }
}

console.log('\u00a7145 \u2014 Wortlaut der Freischalttexte (Walters Fassung, 27.8.):');
{
  // \u00a7140-Wortlautregel: ein Wort je Sache. Die Texte hier sind Walters eigene Formulierung
  // \u2014 wer sie umschreibt, soll darueber stolpern, nicht sie nebenbei verlieren.
  ok(/Um jemand zum Spiel mit dir einzuladen, brauchst du 3 Punkte:/.test(html),
     'Einleitung nennt den ZWECK (jemanden einladen), nicht die Sperre');
  ok((html.match(/Sieg gegen Max Michu <strong>/g)||[]).length === 3,
     'alle drei Zeilen nennen \u201eMax Michu\u201c \u2014 der Name aus dem Startmen\u00fc, nicht nur die Stufe');
  ok(/Einladen darfst du danach jeden\./.test(html),
     'der Satz, dass Eingeladene selbst keine Punkte brauchen, steht da');
  ok(/Willst du deinen Punktestand auf ein anderes Ger\u00e4t mitnehmen\?/.test(html),
     '\u00dcbertragungscode ist als Frage eingef\u00fchrt, nicht als Technik');
  ok(/Der Code ist nicht korrekt\. Bitte vollst\u00e4ndigen Code eingeben\./.test(html),
     'Fehlermeldung im Wortlaut');
  // \u00a7148: die Erfolgsmeldung nennt jetzt den NEUEN GESAMTSTAND, nicht mehr den Wert des
  // Codes \u2014 seit die Punkte addiert werden, ist der Codewert allein keine Auskunft mehr.
  ok(/'Code erfolgreich \u00fcbertragen\. ' : 'Dieser Code war schon eingel\u00f6st\. '\)\s*\+ gateStandSatz\(\)/.test(html),
     'Erfolgs- und Wiederholungsmeldung nennen beide den neuen Gesamtstand');
  ok(/'Du hast ' \+ gateNum\(t\) \+ ' Punkte\.'/.test(html) &&
     /'Du hast ' \+ gateNum\(t\) \+ ' von ' \+ GATE_NEED \+ ' Punkten\.'/.test(html),
     '\u00a7148 zwei St\u00e4nde: mit Schwelle solange gesperrt, ohne Schwelle danach (Walters Score)');
  ok((html.match(/function gateStandSatz\(\)/g)||[]).length === 1 &&
     (html.match(/gateStandSatz\(\)/g)||[]).length >= 4,
     'der Standsatz steht an EINER Stelle und wird \u00fcberall von dort gelesen (\u00a7140)');
  // \u00a7145: der Datenschutztext ist genauer geworden \u2014 die Kennung bindet an den BROWSER,
  // nicht an eine Person (zwei Browser auf einem Ger\u00e4t haben zwei Kennungen; Beleg: die
  // zweite Kennung wWyMlHiLHJhg am 6.8.). Das bestreitet den Personenbezug NICHT, es
  // beschreibt den Zweck zutreffend \u2014 anders als der \u00a7136-Satz, der genau das tat.
  ok(/Partien aus demselben Browser zusammenzuf\u00fchren/.test(html) &&
     !/Partien derselben Person zusammenzuf\u00fchren/.test(html),
     'Datenschutz: \u201eaus demselben Browser\u201c statt \u201ederselben Person\u201c');
}

console.log('\u00a7147 \u2014 Typo-Skala (Boden 12px, keine Sondergr\u00f6\u00dfen):');
{
  // Vorher: 20 verschiedene Groessen in 72 Deklarationen. Diese Gruppe haelt fest, dass es
  // dabei nicht wieder losgeht \u2014 eine neue Zwischengroesse faellt sofort auf.
  ok(Object.keys(SKALA).length === 7,
     'genau SIEBEN Stufen in :root (gefunden: ' + Object.keys(SKALA).join(' ') + ')');
  ok(SKALA['--fs-xs'] >= 12,
     'die kleinste Stufe liegt bei mindestens 12px (gemessen ' + SKALA['--fs-xs'] + 'px)');
  {
    // \u00a7149: --fs-read ist KEINE Stufe der Leiter, sondern eine eigene Achse f\u00fcr Lesetext.
    // Die sechs Bedien-Stufen m\u00fcssen weiter streng steigen; --fs-read wird getrennt gepr\u00fcft.
    const leiter = ['--fs-xs','--fs-sm','--fs-md','--fs-lg','--fs-xl','--fs-xxl'].map(k => SKALA[k]);
    ok(leiter.every((v,i) => i === 0 || v > leiter[i-1]),
       'die sechs Bedien-Stufen steigen streng an (' + leiter.join(' < ') + ')');
    ok(SKALA['--fs-read'] >= 16,
       'Lesetext ist mindestens 16px \u2014 Browser-Standard (gemessen ' + SKALA['--fs-read'] + 'px)');
    ok(SKALA['--fs-read'] > SKALA['--fs-md'],
       'Lesetext ist gr\u00f6\u00dfer als der Oberfl\u00e4chentext (' + SKALA['--fs-read'] + ' > ' + SKALA['--fs-md'] + ')');
  }
  // Literale duerfen nur noch Titelgroessen sein. Alles darunter gehoert in die Skala \u2014
  // genau dort sassen die 9- und 10-px-Stellen, die niemand mehr lesen konnte.
  {
    const lit = (html.match(/font-size:\s*([0-9.]+)px/g) || []).map(x => parseFloat(x.split(':')[1]));
    const klein = lit.filter(v => v < 24);
    ok(klein.length === 0,
       'kein Lesetext mehr als festes px \u2014 alles unter 24px l\u00e4uft \u00fcber die Skala' +
       (klein.length ? ' (gefunden: ' + [...new Set(klein)].join(', ') + 'px)' : ''));
    ok(lit.every(v => v >= 24),
       'die verbliebenen Literale sind Titelgr\u00f6\u00dfen (' + [...new Set(lit)].sort((a,b)=>a-b).join(' ') + 'px)');
  }
  ok((html.match(/font-size:var\(--fs-/g) || []).length >= 60,
     'die Skala wird wirklich benutzt (' + (html.match(/font-size:var\(--fs-/g)||[]).length + ' Deklarationen)');
  // Der Anleitung ihre eigene Skala \u2014 sie ist eine eigene Seite mit eigenem :root.
  {
    const anl = fs.existsSync(__dirname + '/anleitung.html')
      ? fs.readFileSync(__dirname + '/anleitung.html', 'utf8') : '';
    const anlSkala = skalaAus(anl);
    ok(JSON.stringify(anlSkala) === JSON.stringify(SKALA),
       'anleitung.html tr\u00e4gt DIESELBE Skala \u2014 sonst sieht die Anleitung anders aus als das Spiel');
    const anlLit = (anl.match(/font-size:\s*([0-9.]+)px/g) || []).map(x => parseFloat(x.split(':')[1]));
    ok(anlLit.length === 0, 'die Anleitung hat gar keine festen Gr\u00f6\u00dfen mehr');
    // \u00a7151: die mobile Lesegroesse muss in BEIDEN Dateien gleich sein — sonst liest sich
    // die Anleitung auf dem Telefon anders als die Regeln im Spiel.
    const mob = t => (t.match(/@media \(max-width:520px\)\{:root\{ --fs-read: ([0-9.]+)px/)||[])[1];
    ok(!!mob(html) && mob(html) === mob(anl),
       'mobile Lesegr\u00f6\u00dfe in beiden Dateien gleich (' + mob(html) + 'px)');
    ok(parseFloat(mob(html)) > SKALA['--fs-read'],
       'mobil gr\u00f6\u00dfer als auf dem Rechner (' + mob(html) + ' > ' + SKALA['--fs-read'] + ')');
  }
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
