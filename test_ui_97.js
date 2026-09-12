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
// §177: einige Verhaltensproben laufen asynchron (die echten async-Funktionen im vm). Ihre
// Prüfungen werden hier gesammelt; die Summenzeile steht erst, wenn alle abgeschlossen sind.
const SPAET = [];
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
// §172 (9.9.) hat diese Pruefung ANGEPASST (Entscheid Walter): das MvM-Schlussbild traegt jetzt
// zusaetzlich `wegHinweis`. Die §97b-Absicht bleibt gewahrt — verboten ist eine DAUERHAFTE
// Zusatzzeile; der Hinweis ist bedingt und verschwindet, sobald ein Nochmal moeglich ist.
ok((html.match(/winArea\.innerHTML = bannerHtml \+ rematchBtn;/g)||[]).length === 1,
   'MvKI-Schlussbild besteht weiterhin nur aus Banner + \u201eNochmal\u201c-Button');
ok(/winArea\.innerHTML = bannerHtml \+ \(\(hindernis && hindernis\.endgueltig\) \? '' : rematchBtn\) \+ wegHinweis;/.test(html) &&
   /const wegHinweis = hindernis/.test(html) && /\n\s*: '';/.test(html),
   'MvM-Schlussbild: der \u00a7172-Hinweis ist BEDINGT (leer, sobald ein Nochmal m\u00f6glich ist)')
;
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

// \u00a7156 \u2014 DIE KURZFASSUNG WIRD GEGEN DEN CODE GEHALTEN, nicht gegen sich selbst.
// BEFUND 31.8. (Negativkontrolle): die Zusage liess sich auf „Name, E-Mail-Adresse,
// Geraetedaten UND DER SPIELVERLAUF werden nicht erhoben" verfaelschen — nachweislich falsch,
// denn test_obs_99 prueft genau diesen Schreibweg — und ALLE 172 Pruefungen blieben gruen.
// Zeile 199 macht es bei den Cookies richtig vor (&& !/googletagmanager/); hier fehlte der
// Abgleich. Eine gepinnte Zeichenfolge ist kein Abgleich mit dem Verhalten.
{
  // Die KURZFASSUNG isolieren — der Langtext darf und soll die Kennzahlen benennen.
  const kurz = (html.match(/Kurz gesagt[\s\S]{0,700}?Was gespeichert wird/) || [''])[0];
  ok(kurz.length > 100, 'Kurzfassung im Datenschutztext gefunden (Anker „Kurz gesagt")');

  // 1. Wenn perfMs geloggt wird, darf die Kurzfassung Geraetedaten NICHT ausschliessen.
  //    \u00a7155-Entscheid: perfMs bleibt (deviceBenchMs liegt im eingefrorenen Kern, die
  //    Kontrollvariable ist die Stoerfaktor-Absicherung aus \u00a799) — also faellt das Wort.
  const perfGeloggt = /perfMs: \(typeof devicePerfMs==='number'\)/.test(html);
  ok(!perfGeloggt || !/Ger\u00e4tedaten werden nicht erhoben/.test(kurz),
     'Kurzfassung schliesst keine Ger\u00e4tedaten aus, solange perfMs geschrieben wird (perfMs geloggt: '+perfGeloggt+')');

  // 2. Und der Langtext MUSS sie dann benennen — sonst ist der Wegfall oben eine Luecke.
  ok(!perfGeloggt || /technische Kennzahlen/.test(html),
     'der Langtext benennt die technischen Kennzahlen, solange perfMs geschrieben wird');

  // 3. Was die Kurzfassung ausschliesst, darf nirgends erhoben werden: kein Eingabefeld fuer
  //    Name oder E-Mail. Das einzige Eingabefeld der Seite ist das Codefeld (\u00a7144).
  ok(!/type=["']email["']/.test(html) && !/autocomplete=["'](name|email)["']/.test(html),
     'kein Eingabefeld fuer Name oder E-Mail \u2014 die Zusage deckt sich mit dem Formularbestand');

  // 4. Wiedereinbau-Schutz: der Spielverlauf DARF nicht als „nicht erhoben" auftauchen.
  ok(!/Spielverlauf[^.]{0,80}werden nicht erhoben/.test(kurz),
     'die Kurzfassung behauptet NICHT, der Spielverlauf werde nicht erhoben (Negativkontrolle 31.8.)');
}

// \u00a7157 \u2014 DIE PFLICHTANGABEN NACH ART. 13. Der Text war inhaltlich richtig, aber als
// Pflichtinformation unvollstaendig: Rechtsgrundlage, berechtigte Interessen, Speicherdauer,
// Widerspruchsrecht, Beschwerderecht und die vollstaendigen Betroffenenrechte fehlten.
// ⚠️ ALLE Pruefungen dieser Gruppe laufen gegen den ISOLIERTEN Overlay-Text, nicht gegen die
//    ganze Datei. Der Quelltextkommentar ueber dem Overlay nennt dieselben Woerter (er begruendet
//    ja die Aenderung) — eine Suche ueber `html` waere gruen geworden, ohne dass ein einziges
//    Wort beim Nutzer ankommt. Dieselbe Falle wie \u00a7156, eine Ebene weiter.
console.log('\u00a7157 \u2014 Datenschutz: Pflichtangaben nach Art. 13:');
{
  const ds = (html.match(/id="datenschutz-overlay"[\s\S]*?Schlie\u00dfen<\/button>/) || [''])[0];
  ok(ds.length > 1000, 'Datenschutz-Overlay isoliert (' + ds.length + ' Zeichen)');

  ok(/Art\. 6 Abs\. 1 lit\. f/.test(ds),
     'die Rechtsgrundlage ist benannt (Art. 6 Abs. 1 lit. f \u2014 Art. 13 Abs. 1 lit. c)');
  ok(/berechtigtes Interesse/.test(ds) && /Spielst\u00e4rke der\s+Computergegner einzustellen/.test(ds),
     'die berechtigten Interessen stehen KONKRET da, nicht als Formel (Art. 13 Abs. 1 lit. d)');
  ok(/Wie lange/.test(ds) && /solange sie f\u00fcr diese Auswertung/.test(ds),
     'die Speicherdauer ist angegeben (Art. 13 Abs. 2 lit. a)');
  ok(/Art\. 21 DSGVO/.test(ds) && /widersprechen/.test(ds),
     'das Widerspruchsrecht ist benannt \u2014 bei lit. f zwingend (Art. 13 Abs. 2 lit. b)');
  ok(/Aufsichtsbeh\u00f6rde beschweren/.test(ds) && /Landesamt f\u00fcr Datenschutzaufsicht/.test(ds),
     'Beschwerderecht samt zust\u00e4ndiger Beh\u00f6rde (Art. 13 Abs. 2 lit. d)');
  ok(/Berichtigung/.test(ds) && /Einschr\u00e4nkung der Verarbeitung/.test(ds) &&
     /Daten\u00fcbertragbarkeit/.test(ds),
     'die Betroffenenrechte sind vollst\u00e4ndig, nicht nur Auskunft und L\u00f6schung');

  // DRITTLAND \u2014 BEIDE Garantien, und das ist kein Schmuck: der DPF-Angemessenheitsbeschluss
  // steht unter gerichtlicher Ueberpruefung. Ein Text mit nur einer Garantie waere bei einem
  // Wegfall von einem Tag auf den anderen falsch. Wer eine herausnimmt, wird hier rot.
  ok(/Data Privacy Framework/.test(ds) && /Standardvertragsklauseln/.test(ds) &&
     /Art\. 46 Abs\. 2 lit\. c/.test(ds),
     'Drittland: BEIDE Garantien genannt (DPF und SCC) \u2014 nicht nur eine');
  ok(!/kann es zu einer \u00dcbermittlung in Drittl\u00e4nder\s+kommen/.test(ds),
     'der pauschale Drittland-Satz ist nicht zur\u00fcck (Wiedereinbau-Schutz)');

  // ROLLENTRENNUNG: fuer das IP-Protokoll ist GitHub eigener Verantwortlicher. Die fruehere
  // Pauschale „beide sind Auftragsverarbeiter" war an dieser Stelle sachlich falsch.
  ok(/IP-Adresse/.test(ds) && /GitHub selbst verantwortlich/.test(ds),
     'die IP-Protokollierung durch GitHub Pages ist benannt, mit der richtigen Rolle');

  // WIEDEREINBAU-SCHUTZ, dritte Stufe nach \u00a7136 und \u00a7156. Beide Male war es dieselbe
  // Klasse Fehler: eine Zusage, die der Code nicht haelt. Hier: ausgewertet wird nach
  // playerKey, und bei einer Handvoll bekannter Testspieler IST der Browser die Person.
  ok(!/keine Auswertung einzelner Personen/.test(ds),
     'die Zusage „keine Auswertung einzelner Personen" ist nicht zur\u00fcck (Wiedereinbau-Schutz)');
  ok(!/anonym/i.test(ds),
     'die Kennung wird nirgends als anonym bezeichnet \u2014 eine Online-Kennung ist es nicht');

  // An perfMs GEKOPPELT, nicht an den Wortlaut \u2014 exakt wie die \u00a7156-Pruefung eine Ebene
  // darueber: wer den Rechentest ausbaut, darf den Absatz streichen und bleibt gruen.
  const perfGeloggt2 = /perfMs: \(typeof devicePerfMs==='number'\)/.test(html);
  ok(!perfGeloggt2 || /wie schnell dein Ger\u00e4t\s+rechnet/.test(ds),
     'der Rechentest ist beim Namen genannt, solange perfMs geschrieben wird (perfMs geloggt: '+perfGeloggt2+')');
}

// \u00a7184b (12.9.) \u2014 DER ZWEI-PERSONEN-MODUS KOMMT IM TEXT VOR, und zwar gekoppelt an den
// Code, nicht an den Wortlaut. Bis v143 beschrieb der Text nur den Weg gegen Max Michu; dass
// beim Spiel zu zweit ein RAUM auf dem Server entsteht und JEDER mit dem Code mitlesen kann
// (Regeln v109: `rooms`/`games_mp` auf `.read: true`), stand nirgends.
console.log('\u00a7184b \u2014 Datenschutz: Zwei-Personen-Modus:');
{
  const ds = (html.match(/id="datenschutz-overlay"[\s\S]*?Schlie\u00dfen<\/button>/) || [''])[0];
  const mvm = (ds.match(/Zwei Personen \u00fcber einen Code[\s\S]*?<\/div>/) || [''])[0];
  ok(mvm.length > 300, 'der Absatz zum Zwei-Personen-Modus steht im Overlay (' + mvm.length + ' Zeichen)');
  ok(/Wer den Code\s*<\/strong>?[\s\S]{0,40}kennt, kann den Raum mitlesen/.test(mvm.replace(/<[^>]+>/g,' ').replace(/\s+/g,' '))
     || /kennt, kann den Raum mitlesen/.test(mvm),
     'die Mitlesbarkeit \u00fcber den Raumcode ist ausgesprochen, nicht umschrieben');

  // TEXT GEGEN CODE, beide Fristen. Wer die Konstanten aendert, wird hier rot — genau die
  // Klasse Pruefung, die \u00a7126 fuer die Cookie-Zusage und \u00a7156 fuer die Kennung macht.
  const zweiStunden = /const maxIdle = 2\*60\*60\*1000;/.test(html);
  ok(!zweiStunden || /zwei Stunden ohne Lebenszeichen/.test(mvm),
     'die Zwei-Stunden-Frist im Text deckt sich mit cleanupOldRooms (maxIdle gefunden: '+zweiStunden+')');
  const dreissigTage = /serverNow\(\) - 30\*24\*60\*60\*1000/.test(html);
  ok(!dreissigTage || /nach 30 Tagen/.test(mvm),
     'die 30-Tage-Frist im Text deckt sich mit cleanupOldGames (cutoff gefunden: '+dreissigTage+')');
  // Die Fristen sind BEWUSST als Aufraeumarbeit beschrieben, nicht als Zusage: beide Laeufe
  // sind fire-and-forget mit stummem catch. Ein Text, der Loeschung VERSPRICHT, waere mehr,
  // als der Code haelt — dieselbe Klasse Fehler wie \u00a7136 und \u00a7156.
  ok(/einen st\u00e4ndig laufenden L\u00f6schdienst auf dem\s+Server gibt es bisher nicht/.test(mvm),
     'der Text verspricht keinen Loeschdienst, den es nicht gibt (ToDo 33)');

  // Die Zusage „keine Kennung in diesen Partien" MUSS am Code haengen. PLAYER_KEY darf nur
  // in die drei nicht lesbaren games_countred*-Knoten geschrieben werden — steht er je in
  // einem rooms/games_mp-Aufruf, ist der Satz falsch und diese Pruefung faellt.
  const schreibstellen = html.match(/(?:set|update|remove|push)\(ref\(db,[^;]*?\{[^;]*?playerKey/g) || [];
  const heikel = (html.match(/(?:set|update)\(ref\(db,\s*`(rooms|games_mp)\/[\s\S]{0,600}?\)/g) || [])
                   .filter(b => /playerKey|PLAYER_KEY/.test(b));
  ok(heikel.length === 0,
     'kein PLAYER_KEY in einem rooms/games_mp-Schreibaufruf (' + schreibstellen.length +
     ' Kennungs-Schreibstellen gepr\u00fcft, heikel: ' + heikel.length + ')');
  ok(/keine Kennung wird dabei nicht gespeichert|Eine Kennung wird dabei nicht gespeichert/.test(mvm),
     'der Text sagt genau das, was der Code h\u00e4lt: in diesen Partien keine Kennung');
}

// \u00a7184a (12.9.) \u2014 RECHTSFUSSZEILE IN anleitung.html. Die Anleitung ist eine EIGENE Seite
// unter countred.com/anleitung.html; \u00a7 5 DDG verlangt das Impressum "staendig verfuegbar",
// also je Seite. Bis Fassung 54 fuehrte von dort kein Weg dorthin — am 12.9. am Live-Stand
// geprueft (Suche nach "Impressum" fand nur einen Kommentar).
// ⚠️ Diese Gruppe prueft die ANLEITUNG, liegt aber in dieser Suite, weil hier der ganze
//    Rechtsteil steht und die Drift-Pruefung BEIDE Dateien gegeneinander braucht.
console.log('\u00a7184a \u2014 Rechtsfu\u00dfzeile auch in der Anleitung:');
{
  const anlPath = __dirname + '/anleitung.html';
  ok(fs.existsSync(anlPath), 'anleitung.html liegt im Ordner');
  const anl = fs.existsSync(anlPath) ? fs.readFileSync(anlPath, 'utf8') : '';
  const foot = (anl.match(/<div id="legal-footer">[\s\S]*?<\/div>/) || [''])[0];
  ok(foot.length > 0, 'anleitung.html tr\u00e4gt eine Fu\u00dfzeile #legal-footer');
  ok(/>Impressum<\/a>/.test(foot) && />Datenschutz<\/a>/.test(foot),
     'beide Beschriftungen stehen darin');
  ok((foot.match(/<a href="index\.html">/g) || []).length === 2,
     'beide sind echte Verweise auf index.html \u2014 dort liegen die Texte');
  // DRIFT-SCHUTZ, der eigentliche Grund fuer die Verweis-Loesung: eine zweite Kopie der
  // Rechtstexte in der Anleitung liefe zwangsläufig auseinander (Erkenntnis L8/N), und ein
  // veraltetes Impressum ist schlimmer als eines, das einen Klick weiter liegt.
  // ⚠️ GEGEN DEN SICHTBAREN STAND, nicht gegen die Datei: die Begruendung im Stylesheet nennt
  // „\u00a7 5 DDG" und „?legal=" selbst — beim ersten Lauf faerbten genau diese beiden
  // Pruefungen deshalb ROT, an meinen eigenen Kommentaren. Dieselbe Falle wie \u00a7157, nur
  // von der anderen Seite: dort war ein Kommentar zu Unrecht GRUEN, hier zu Unrecht ROT.
  const anlSicht = anl.replace(/<!--[\s\S]*?-->/g, ' ')
                      .replace(/\/\*[\s\S]*?\*\//g, ' ')
                      .replace(/^\s*\/\/.*$/gm, ' ');
  ok(!/\u00a7 5 DDG/.test(anlSicht) && !/Guldeinstr/.test(anlSicht) &&
     !/Landesamt f\u00fcr Datenschutzaufsicht/.test(anlSicht) && !/Art\. 6 Abs\. 1 lit\. f/.test(anlSicht),
     'KEINE zweite Kopie der Rechtstexte in der Anleitung (Drift-Schutz)');
  // Kein `?legal=`-Parameter: index.html wertet location.search/hash NIRGENDS aus, und das
  // ist eine gemessene Eigenschaft der Angriffsflaeche (Pruefung 6.8.), keine Zufaelligkeit.
  ok(!/location\.search/.test(html) && !/location\.hash/.test(html) && !/\?legal=/.test(anlSicht),
     'der Weg l\u00e4uft ohne Adress-Parameter \u2014 index.html wertet search/hash weiter nirgends aus');
  // Die Fusszeile muss den AUSFALL ueberleben: bail() blendet lesson, board-area, nav und bar
  // aus. Stuende legal-footer in dieser Liste, waere das Impressum genau dann weg, wenn die
  // Seite kaputt ist.
  const bail = (anl.match(/\['lesson','board-area','nav','bar'\]/) || [''])[0];
  ok(bail.length > 0 && !/legal-footer/.test(bail),
     'die Fu\u00dfzeile bleibt sichtbar, wenn die Anleitung ausf\u00e4llt (bail blendet sie nicht aus)');
  // Sie darf das Brett nicht rechnerisch verschieben: #board-area ist das wachsende Element,
  // groesse() MISST dessen clientHeight. Die Fusszeile ist deshalb flex:0 0 auto.
  ok(/#legal-footer\{flex:0 0 auto/.test(anl) && /const h=area\.clientHeight/.test(anl),
     'flex:0 0 auto, und die Brettgr\u00f6\u00dfe wird weiter gemessen statt gerechnet');
}

console.log('\u00a7159 \u2014 Urheberrechtsvermerk:');
{
  // \u00a7159 (7.9.): Bis v125 stand in KEINER ausgelieferten Datei ein Rechtevermerk — nur
  // zwei Herkunftss\u00e4tze in Flie\u00dftext ("Das Spiel stammt von \u2026"). Das ist eine Angabe zur
  // Herkunft, keine Rechteberuehmung. \u00a7 10 UrhG knuepft die Urhebervermutung an die
  // Bezeichnung "in der ueblichen Weise" auf den Stuecken selbst — bei Software also an den
  // Dateikopf. Diese Gruppe haelt beides fest: den sichtbaren Absatz und die Dateikoepfe.
  //
  // Geprueft wird gegen das ISOLIERTE Overlay, nicht gegen die Datei (\u00a7157-Lehre): der
  // Kopfvermerk steht als Kommentar in derselben Datei und wuerde jede Suche ueber `html`
  // gruen faerben, ohne dass beim Nutzer ein Wort ankommt.
  const imp = html.match(/id="impressum-overlay"[\s\S]*?Schlie\u00dfen<\/button>/)[0];
  ok(/Urheberrecht/.test(imp) && /\u00a9 1998\u20132026 Walter Rehm/.test(imp) &&
     /Alle Rechte vorbehalten/.test(imp),
     'der Urheberrechtsvermerk steht SICHTBAR im Impressum');
  // Ein Vermerk, der mehr beansprucht als das Gesetz gibt, ist im Streit schwaecher, nicht
  // staerker: Spielregeln und Spielideen sind urheberrechtlich frei. Der Absatz nennt
  // deshalb Code, Texte und Gestaltung — und darf die Regeln NICHT beanspruchen.
  const absatz = (imp.match(/<strong[^>]*>Urheberrecht<\/strong>[\s\S]*?<\/div>/)||[''])[0];
  ok(absatz.length > 0 && !/Spielidee|Spielregel/.test(absatz),
     'der Vermerk beansprucht die Spielregeln nicht (nur Code, Texte, Gestaltung)');

  const VERMERK = /Count Red \u00b7 \u00a9 1998\u20132026 Walter Rehm \u00b7 Alle Rechte vorbehalten/;
  ok(VERMERK.test(html.split('\n').slice(0,4).join('\n')),
     'index.html traegt den Vermerk im Dateikopf');

  // Nachbardateien: EIN Ergebnis je Datei, ob sie danebenliegt oder nicht — sonst haengt
  // die Pruefungszahl am Ordnerinhalt (\u00a7158-Lehre, s. Handover Abschnitt 8).
  for(const f of ['anleitung.html','gembel_rules.js','countred_ai_core.js','countred_ai_worker.js']){
    const pfad = __dirname + '/' + f;
    if(!fs.existsSync(pfad)) { ok(true, f + ' liegt nicht daneben (uebersprungen)'); continue; }
    const kopf = fs.readFileSync(pfad,'utf8').split('\n').slice(0,4).join('\n');
    ok(VERMERK.test(kopf), f + ' traegt den Vermerk im Dateikopf');
  }

  const lic = __dirname + '/LICENSE';
  if(!fs.existsSync(lic)) ok(true, 'LICENSE liegt nicht daneben (uebersprungen)');
  else {
    const L = fs.readFileSync(lic,'utf8');
    ok(/Walter Rehm/.test(L) && /Alle Rechte vorbehalten/.test(L) && /KEINER\s+Open-Source-Lizenz/.test(L),
       'LICENSE nennt den Rechteinhaber und stellt klar, dass keine Open-Source-Lizenz gilt');
  }
}

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

console.log('\u00a7168 \u2014 kein Bedienweg wartet auf das Netz:');
{
  // Walters Livebefund zu v130/v131: bleibt B offline und tippt „Sofort abbrechen", passiert
  // nichts Bleibendes — das Brett blitzt auf, die Tafel kommt zurueck, und so springt es hin
  // und her. Ursache: finalizeOppAbort wartete auf drei Netzschreibungen (Forensik,
  // meta/aborted, remove), bevor es handleDisconnect erreichte. Ohne Leitung loesen die nie
  // auf. Eine Sackgasse ohne Ausweg.
  const fo = html.match(/function finalizeOppAbort\(msg, reason\)\{[\s\S]*?\n\}/)[0];
  ok(!/^\s*async function finalizeOppAbort/.test(html.match(/\n\s*(async )?function finalizeOppAbort/)[0]),
     '\u00a7168: finalizeOppAbort ist nicht mehr async \u2014 es gibt nichts mehr zu erwarten');
  ok(!/await /.test(fo),
     '\u00a7168: im Abbruchweg steht KEIN await mehr (' + ((fo.match(/await /g)||[]).length) + ' gefunden)');
  const iLog   = fo.indexOf('logMvmAbort(');
  const iLokal = fo.indexOf('handleDisconnect(');
  const iSchreib = fo.indexOf("update(wasRoom,{'meta/aborted':true");
  ok(iLog > -1 && iLokal > iLog,
     '\u00a7168: der Forensik-Datensatz wird VOR dem Aufr\u00e4umen gebaut (cleanup nullt roomCode und myRole)');
  ok(iLokal > -1 && iSchreib > iLokal,
     '\u00a7168: erst lokal abschlie\u00dfen, dann schreiben \u2014 nicht umgekehrt');
  // ⚠️ Anker offen gefasst: §170 hat `meta/abortedBy` ergaenzt — die woertliche Fassung haette
  // hier einen Fehlschlag erzeugt, obwohl die Absicht (best effort, kein await) erfuellt ist.
  ok(/update\(wasRoom,\{'meta\/aborted':true[^}]*\}\)\.catch\(\(\)=>\{\}\);/.test(fo) &&
     /remove\(wasRoom\)\.catch\(\(\)=>\{\}\);/.test(fo),
     '\u00a7168: die Schreibungen laufen best effort und halten niemanden auf');
  ok(/if\(wasRole==='host'\) remove\(wasRoom\)/.test(fo),
     '\u00a7168: nur der Host l\u00f6scht den Raum (Host-Recht, wasRole VOR cleanup gesichert)');
  ok(/const eigene = \(EIGENE_PRAESENZ_AN && selbstOffline\);/.test(html) &&
     /Partie verlassen \u2014 deine Verbindung war unterbrochen\./.test(html),
     '\u00a7168: bei EIGENER Unterbrechung sagt die Meldung das auch');
}

console.log('\u00a7170 \u2014 Angebotsrecht und ehrliche Abbruchmeldung:');
{
  // Walters Screenshot (9.9.): B war Gast, hatte im ALTEN Raum Remis angeboten, trat einem NEUEN
  // Raum bei — und fand dort vor dem ersten Zug den ausgegrauten Knopf „Remis angeboten (warte
  // auf deinen Zug)". Ursache: `mvmOfferedThisTurn` wurde nur in den beiden HOST-Startroutinen
  // zurueckgesetzt; der Gast durchlaeuft die nie.
  const cl = html.match(/function cleanup\(removeRoom=true\)\{[\s\S]*?\n\}/)[0];
  ok(/mvmOfferedThisTurn=false;/.test(cl),
     '\u00a7170: cleanup setzt das Angebotsrecht zur\u00fcck (gilt auch f\u00fcr den Gast)');
  const ars = html.match(/function applyRemoteState\(state\)\{[\s\S]*?\u00a772g/)[0];
  ok(/if\(state\.gameGen > mvmGameGen\)\{[\s\S]{0,400}?mvmOfferedThisTurn=false;/.test(ars),
     '\u00a7170: eine neue Partie im selben Raum (Nochmal) setzt es beim Gast ebenfalls zur\u00fcck');
  // Die beiden Startroutinen des Hosts duerfen es weiterhin selbst tun.
  ok((html.match(/mvmOfferedThisTurn=false;/g)||[]).length >= 4,
     '\u00a7170: die bisherigen R\u00fccksetzstellen bleiben erhalten');

  // Ehrliche Abbruchmeldung.
  ok(/'meta\/abortedBy':wasRole\|\|null/.test(html),
     '\u00a7170: beim Abbruch wird festgehalten, WER abgebrochen hat');
  const at = html.match(/function abbruchText\(data\)\{[\s\S]*?\n\}/)[0];
  ok(/wer!==myRole/.test(at) && /Mitspieler hat die Partie beendet/.test(at),
     '\u00a7170: war es der Mitspieler, sagt die Meldung das auch');
  ok(!/handleAbortReturn\('Verbindung zu lange unterbrochen \u2014 der Raum wurde aufgel\u00f6st\.'\)/.test(html),
     '\u00a7170: keine Aufrufstelle nagelt den alten Einheitstext mehr fest');
  ok((html.match(/handleAbortReturn\(abbruchText\(data\)\)/g)||[]).length >= 3,
     '\u00a7170: alle R\u00fcckkehr- und Listener-Wege nutzen denselben Text-Entscheider');
}

console.log('\u00a7174 \u2014 der Rueckl\u00e4ufer wartet nicht mehr auf das Netz:');
{
  // Walters Befund (9.9.): „Keine Antwort" blieb stehen, nachdem die Verbindung zurueck war und
  // das Nochmal bestaetigt wurde. Ursache: `await update(...)` im Rueckl\u00e4ufer loest ohne Leitung
  // nicht auf, und `rematchWaitTimer` war schon genullt — der Zeitgeber wurde unk\u00fcndbar.
  const sw = html.match(/function startRematchWaitTimeout\(\)\{[\s\S]*?\n\}/)[0];
  ok(!/await/.test(sw),
     '\u00a7174: im R\u00fcckl\u00e4ufer steht KEIN await mehr (\u00a7168-Regel: nichts wartet auf das Netz)');
  ok(/const meineEpoche=rematchWaitEpoch;/.test(sw) &&
     /if\(meineEpoche!==rematchWaitEpoch\) return;/.test(sw),
     '\u00a7174: eine Epoche entwertet sp\u00e4te R\u00fcckl\u00e4ufer \u2014 auch unk\u00fcndbare');
  const st = html.match(/function stopRematchWaitTimeout\(\)\{[\s\S]*?\n\}/)[0];
  ok(/rematchWaitEpoch\+\+;/.test(st),
     '\u00a7174: das Abr\u00e4umen z\u00e4hlt die Epoche hoch');
  ok(/if\(phase!=='finished'\) return;/.test(sw),
     '\u00a7174: keine Absage in eine bereits laufende neue Partie hinein');
  ok(sw.indexOf("if(phase!=='finished') return;") < sw.indexOf('Keine Antwort'),
     '\u00a7174: der Riegel steht VOR der Meldung');
  ok(/selbstOffline\)\{[\s\S]{0,220}?Deine Verbindung ist unterbrochen \u2014 die Anfrage konnte nicht zugestellt werden/.test(sw),
     '\u00a7174: ohne eigene Leitung sagt die Meldung die Wahrheit, statt den Mitspieler zu beschuldigen');
}

console.log('\u00a7173 \u2014 der Anziehende wird aus dem Raum bestimmt:');
{
  // Walters Regel: beim Nochmal beginnt der VERLIERER. Der Tausch wird nur vom HOST gerechnet,
  // und er las bis v136 die LOKALE Variable `lastKnownWinner`. Hatte ausgerechnet der Host das
  // Ende der Vorpartie nicht gesehen (Neuladen, Unterbrechung), stand dort `undefined`, und der
  // Zweig „Draw or unknown: swap" griff — dann konnte der SIEGER beginnen.
  const hs = html.match(/window\.hostStartNew=async function\(\)\{[\s\S]*?\n\};/)[0];
  ok(/let lastWinner=lastKnownWinner;/.test(hs) && /const vorSnap=await get\(roomRef\);/.test(hs),
     '\u00a7173: der Sieger wird aus dem Raum gelesen, die lokale Variable ist nur noch R\u00fcckfall');
  ok(/vorSt\.phase==='finished' && Number\(vorSt\.gameGen\)===mvmGameGen/.test(hs),
     '\u00a7173: gelesen wird NUR die eben beendete Partie (Phase und Generation m\u00fcssen passen)');
  ok(/vorSt\.winner===undefined \|\| vorSt\.winner===null\) \? null :/.test(hs),
     '\u00a7173: ein FEHLENDES winner-Feld gilt als Remis (Firebase speichert keine null-Werte)');
  ok(/catch\(e\)\{[\s\S]{0,200}?\u00a7173: Sieger nicht aus dem Raum lesbar/.test(hs),
     '\u00a7173: schl\u00e4gt das Lesen fehl, gilt der lokale Stand \u2014 kein Abbruch des Nochmal');
  // §164-Regel: zwischen dem Setzen des Zustands und dem Schreiben darf kein await liegen.
  const iAwait = hs.lastIndexOf('await get(roomRef)');
  const iSetzen = hs.indexOf("phase='playing';");
  ok(iAwait > -1 && iSetzen > iAwait,
     '\u00a7173: das Lesen steht VOR jeder Zustands\u00e4nderung (\u00a7164-Regel eingehalten)');
}

console.log('\u00a7172 \u2014 die Absage steht vor dem Tipp:');
{
  // Walters Screenshots (9.9., 10:34/10:35): „Nochmal" stand voll eingefaerbt da, obwohl die App
  // schon wusste, dass der Mitspieler weg ist — der Tipp brachte nur die Absage.
  // §177 hat das Kriterium in EINE Funktion gelegt (neueRundeUnmoeglich) — die Absicht von §172
  // bleibt: das Schlussbild prüft die Präsenz, und zwar mit demselben Kriterium wie die Sperre.
  const nru = (html.match(/function neueRundeUnmoeglich\(\)\{[\s\S]*?\n\}/)||[''])[0];
  ok(/const hindernis = neueRundeUnmoeglich\(\);/.test(html) &&
     /presenceIsStale\(serverNow\(\), oppLastSeen, PRESENCE_STALE_MS\)/.test(nru),
     '\u00a7172: das Schlussbild pr\u00fcft die Pr\u00e4senz des Mitspielers');
  // ⚠️ DASSELBE Kriterium wie die Sperre in requestRematch — sonst laufen Anzeige und Sperre
  // auseinander und der Hinweis luegt in die eine oder andere Richtung.
  const rr = html.match(/window\.requestRematch=async function\(\)\{[\s\S]*?\n\};/)[0];
  ok(/const hindernis = neueRundeUnmoeglich\(\);/.test(rr),
     '\u00a7172: Anzeige und Sperre benutzen dasselbe Kriterium');
  ok(/winArea\.innerHTML = bannerHtml \+ \(\(hindernis && hindernis\.endgueltig\) \? '' : rematchBtn\)/.test(html),
     '\u00a7172: der Hinweis steht im Schlussbild, nicht erst als Antwort');
  // §172-Kleinlösung, seit §179 nur noch für den VORLÄUFIGEN Fall: dort bleibt der Knopf tippbar
  // (kein disabled, kein Dauergrau, wenn der Mitspieler zurückkommt). Im endgültigen Fall ist er
  // ganz weg — geprüft in der §179-Gruppe.
  const rb = html.match(/const rematchBtn = `[\s\S]*?`;/)[0];
  ok(!/disabled/.test(rb) && /onclick="requestRematch\(\)"/.test(rb),
     '\u00a7172: der Knopf bleibt tippbar \u2014 kein Dauergrau nach R\u00fcckkehr des Mitspielers');
  // Keine gestapelten Anfragen.
  ok(/if\(rematchWaitTimer\)\{[\s\S]{0,200}?Anfrage l\u00e4uft bereits/.test(rr),
     '\u00a7172: eine laufende Anfrage wird nicht durch weitere Tipps verl\u00e4ngert');
  ok(rr.indexOf('if(rematchWaitTimer)') < rr.indexOf("update(roomRef,{'meta/rematchFrom':myRole})"),
     '\u00a7172: der Riegel steht VOR dem Schreiben');
}

console.log('\u00a7171 \u2014 abgebrochene R\u00e4ume bleiben nicht liegen:');
{
  // Walters Befund (9.9.): Raum 63SYG stand mit `meta/aborted:true` UND `phase:"playing"` in der
  // Datenbank. Loeschen ist Host-Recht — bricht der GAST ab, setzt er nur das Flag, und der Raum
  // liegt bis zum Lazy-Cleanup (zwei Stunden) herum.
  const har = html.match(/function handleAbortReturn\(msg\)\{[\s\S]*?\n\}/)[0];
  ok(/if\(roomRef && myRole==='host'\)\{ remove\(roomRef\)\.catch/.test(har),
     '\u00a7171: der Host l\u00f6scht den abgebrochenen Raum, sobald er das Flag liest');
  ok(har.indexOf('remove(roomRef)') < har.indexOf('handleDisconnect('),
     '\u00a7171: das L\u00f6schen steht VOR handleDisconnect \u2014 danach ist roomRef genullt');
  ok(/remove\(roomRef\)\.catch\(\(\)=>\{\}\)/.test(har),
     '\u00a7171: fire-and-forget \u2014 ohne Netz bleibt es beim Lazy-Cleanup');

  // Beitritt in einen toten Raum verhindern.
  const jr = html.match(/window\.joinRoom=async function\(\)\{[\s\S]*?\n\};/)[0];
  const iAbort = jr.indexOf("rv.meta && rv.meta.aborted===true");
  const iGuest = jr.indexOf('const guestAlive');
  ok(iAbort > -1 && iGuest > iAbort,
     '\u00a7171: ein abgebrochener Raum wird beim Beitreten abgewiesen (vor der Voll-Pr\u00fcfung)');
  ok(/Dieser Raum wurde abgebrochen\./.test(jr),
     '\u00a7171: die Abweisung sagt, WARUM \u2014 nicht nur „nicht gefunden\"');
}

console.log('\u00a7169 \u2014 kein Zombie-Brett, keine Herzschl\u00e4ge ohne Leitung:');
{
  // Walters Befund (9.9.): der Mac zeigte „Remis angeboten — warte auf Mitspieler…" ueber einer
  // Stellung, deren Raum der Client laengst verloren hatte (Konsole: „kein Raum mehr"). cleanup()
  // raeumte den inneren Zustand, aber nichts auf dem Bildschirm.
  const cl = html.match(/function cleanup\(removeRoom=true\)\{[\s\S]*?\n\}/)[0];
  // ⚠️ Anker offen: §170 hat zwischen `phase='waiting'` und `entwerteAnzeige()` das Zuruecksetzen
  // des Angebotsrechts eingefuegt. Geprueft wird die ABSICHT — cleanup entwertet die Anzeige —,
  // nicht die Nachbarschaft zweier Zeilen.
  ok(/phase='waiting';/.test(cl) && /entwerteAnzeige\(\);/.test(cl),
     '\u00a7169: cleanup entwertet auch die ANZEIGE, nicht nur den inneren Zustand');
  const ea = html.match(/function entwerteAnzeige\(\)\{[\s\S]*?\n\}/)[0];
  ok(/setLog\(''\);/.test(ea) && /render\(\)/.test(ea),
     '\u00a7169: Statuszeile leeren und neu zeichnen');
  ok(!/board\s*=\s*initBoard\(\)/.test(ea) && !/innerHTML\s*=\s*''/.test(ea),
     '\u00a7169: die Stellung bleibt stehen — geleert wird sie NICHT (Entscheid Walter)');
  ok(/try\{ render\(\)/.test(ea),
     '\u00a7169: ein Fehler beim Zeichnen darf das Aufr\u00e4umen nicht abbrechen');

  // Herzschlaege: nicht schreiben, solange die eigene Leitung weg ist.
  const hb = html.match(/function startHeartbeat\(\)\{[\s\S]*?\n\}/)[0];
  const iGuard = hb.indexOf('if(EIGENE_PRAESENZ_AN && selbstOffline) return;');
  const iWrite = hb.indexOf('update(roomRef,{[field]:serverTimestamp()})');
  ok(iGuard > -1 && iWrite > iGuard,
     '\u00a7169: ohne eigene Leitung wird kein Herzschlag geschrieben (keine Salve beim Wiederverbinden)');
}

console.log('\u00a7166 \u2014 R\u00fcckkehr des Hosts nach dem Remis:');
{
  // Walters Livetest zu v129: B (Gast) nimmt an und geht ins Men\u00fc; A (Host) kommt aus dem
  // Flugmodus zur\u00fcck und sieht das Remis NIE. Zwei Ursachen, beide hier festgehalten.

  // (1) Die eigene Ausfall-Tafel braucht einen EIGENEN Merker. Sie hing am Aufr\u00e4umen des
  //     Gegner-Countdowns — der bei §163 nie gesetzt wird. Also blieb sie stehen.
  ok(/let eigenerAusfallSichtbar = false;/.test(html) &&
     /function clearEigenenAusfall\(\)\{/.test(html),
     '\u00a7166: die eigene Ausfall-Tafel hat einen eigenen Zustand und eine eigene R\u00e4umung');
  const pt = html.match(/function presenceTick\(\)\{[\s\S]*?\n\}/)[0];
  ok(/if\(eigenerAusfallSichtbar\) clearEigenenAusfall\(\);\s*\/\/ \u00a7166: auch die eigene Tafel/.test(pt) &&
     /if\(eigenerAusfallSichtbar\) clearEigenenAusfall\(\);\s*\/\/ \u00a7166: eigene Leitung ist zur\u00fcck/.test(pt),
     '\u00a7166: sie wird in BEIDEN Richtungen ger\u00e4umt (Partie vorbei / Leitung zur\u00fcck)');
  // §181 hat die Sofort-Räumung ERSETZT: die Tafel bleibt stehen (nur mit anderem Text), bis der
  // Stand bekannt ist — sonst lag das alte Brett einen Netz-Umlauf lang offen. Die §166-Absicht
  // bleibt: im Rückkehr-Zweig wird die Tafel SOFORT angefasst, nicht dem nächsten Tick überlassen.
  ok(/selbstOffline=false;[\s\S]{0,900}?if\(roomRef && myRole\) zeigeStandWirdGeprueft\(\);\s*\n\s*else clearEigenenAusfall\(\);/.test(html),
     '\u00a7166: beim Zur\u00fcckkommen sofort, nicht erst beim n\u00e4chsten Tick');
  const ce = html.match(/function clearEigenenAusfall\(\)\{[\s\S]*?\n\}/)[0];
  ok(/if\(oppOfflineSince===null\)\{/.test(ce),
     '\u00a7166: ein laufender ECHTER Gegner-Countdown wird dabei nicht weggewischt');

  // (2) Der Weggang des Gastes darf nicht am eigenen Altstand gemessen werden.
  const gd = html.match(/async function handleGuestDeparture\(data\)\{[\s\S]*?\n\}/)[0];
  ok(/const fertig = \(data\.state && data\.state\.phase==='finished'\) \|\| phase==='finished';/.test(gd),
     '\u00a7166: der RAUM entscheidet, ob die Partie fertig ist \u2014 nicht die lokale phase');
  ok(/if\(fertig\)\{/.test(gd) && !/if\(phase==='finished'\)\{\n    setLog/.test(gd),
     '\u00a7166: die alte Abfrage auf die lokale phase ist ersetzt');
  ok(/if\(fertig\)\{[\s\S]{0,300}?applyRemoteState\(data\.state\)/.test(gd),
     '\u00a7166: der beendete Zustand wird angewendet, nicht nur gemeldet');

  // (3) Der Rueckkehr-Pfad muss an jedem Ausstieg sagen, warum.
  const rp = html.match(/async function raumRueckkehrPruefen\(\)\{[\s\S]*?\n\}/)[0];
  const zeilen = (rp.match(/console\.(log|warn)\('\u00a7162 R\u00fcckkehr/g)||[]).length;
  ok(zeilen >= 5, '\u00a7166: jeder Ausstieg des R\u00fcckkehr-Pfads protokolliert seinen Grund (' + zeilen + ' Stellen)');
  ok(/if\(!roomRef \|\| !myRole\)\{ console\.log\('\u00a7162 R\u00fcckkehr: kein Raum mehr/.test(rp),
     '\u00a7166: auch der fr\u00fcheste Ausstieg meldet sich (der fehlte in der v129-Runde)');
}

console.log('\u00a7164/\u00a7165 \u2014 Remis-Annahme geht nicht mehr verloren:');
{
  // Walters Livetest (7.9.) und der Raum Q65KV beweisen den Hergang: `state/lastMove/drawReason`
  // = "beide einverstanden" UND `state/phase` = "playing" — aus DERSELBEN Schreibung. Zwischen
  // `phase='finished'` und `pushState` lag ein `await`; darin hat der eigene Listener
  // `phase` aus dem alten Raumzustand zurueckgesetzt.
  const ad = html.match(/window\.answerDraw=async function\(yes\)\{[\s\S]*?\n\};/)[0];
  const iPhase = ad.indexOf("phase='finished';");
  const iPush  = ad.indexOf('await pushState(null);');
  const iFlag  = ad.indexOf("'meta/drawAcceptedBy':myRole");
  ok(iPhase > -1 && iPush > iPhase && iFlag > iPush,
     '\u00a7164: erst phase, dann pushState, DANN das Signal \u2014 kein await im Fenster dazwischen');
  ok(!/phase='finished';[\s\S]{0,400}?await update\([\s\S]{0,80}?\)[\s\S]{0,80}?await pushState/.test(ad),
     '\u00a7164: zwischen phase und pushState steht kein await mehr');

  // Kein Rueckwaertsgang — und der Waechter muss VOR dem Generations-Guard stehen, weil der
  // mvmGameGen hochsetzt.
  const ars = html.match(/function applyRemoteState\(state\)\{[\s\S]*?\u00a772k GENERATIONS-GUARD/)[0];
  ok(/phase==='finished' && state\.phase!=='finished'/.test(ars),
     '\u00a7164: eine beendete Partie wird von einem Schnappschuss nicht wieder er\u00f6ffnet');
  ok(/state\.gameGen>mvmGameGen\)\)\{/.test(ars),
     '\u00a7164: ein Nochmal mit h\u00f6herer Generation darf es weiterhin (sonst h\u00e4ngt das Rematch)');

  // Host-autoritative Annahme, Signal erst danach loeschen.
  const acc = html.match(/if\(data\.meta && data\.meta\.drawAcceptedBy\)\{[\s\S]*?\n    \}/)[0];
  const iEnde = acc.indexOf('await pushState(null);');
  const iClear= acc.indexOf("'meta/drawAcceptedBy':null");
  ok(/myRole==='host' && \(phase==='playing'\|\|phase==='bonus'\)/.test(acc) && iEnde > -1,
     '\u00a7164: der HOST beendet die Partie selbst, wenn sie noch l\u00e4uft (wie bei drawClaim)');
  ok(iEnde > -1 && iClear > iEnde,
     '\u00a7164: das Signal wird ERST NACH dem Schreiben gel\u00f6scht \u2014 sonst ist es verbraucht');

  // pushState nicht mehr stumm.
  const ps = html.match(/async function pushState\(winner=null\)\{[\s\S]*?\n\}/)[0];
  ok(/try\{[\s\S]*?await update\(roomRef,\{state\}\);[\s\S]*?\}catch\(e\)\{[\s\S]*?console\.error/.test(ps),
     '\u00a7164: eine gescheiterte Zustands-Schreibung verschwindet nicht mehr spurlos');

  // §167: der WIEDERKEHR-Schalter ist weg — es gibt nichts mehr zu unterscheiden. §182 hat einen
  // Parameter für die ÜBERSCHRIFT ergänzt; das ist reine Anzeige und kein Verhaltensschalter.
  ok(/function handleDisconnect\(msg, titel\)\{/.test(html) &&
     !/function handleDisconnect\([^)]*(retry|reconnect|wiederkehr|canRetry)/i.test(html),
     '\u00a7167: handleDisconnect braucht keinen Wiederkehr-Schalter mehr');
  ok(/letzterBlickAufDenRaum\(wasRoom, wasPlayer\)/.test(html),
     '\u00a7162-B bleibt: der letzte Blick in den Raum ist unber\u00fchrt');

  // §165: die Querformat-Sperre darf den Rechner nicht mehr treffen.
  ok(/@media \(orientation:landscape\) and \(max-height:520px\) and \(pointer:coarse\)\{/.test(html),
     '\u00a7165: die Querformat-Tafel gilt nur f\u00fcr Ber\u00fchrungsger\u00e4te (Konsole am Rechner st\u00f6rt nicht mehr)');
}

console.log('\u00a7162/\u00a7163 \u2014 Verbindungsabbruch: Ergebnis geht nicht mehr verloren:');
{
  // Walters Befund (7.9.): bricht die Verbindung waehrend eines Remisangebots ab, sieht der
  // ANBIETER nicht, dass angenommen wurde — nur Verlassen und neu Beitreten half. Ursache:
  // cleanup() haengt den Raum-Zuhoerer ab und nullt roomRef; danach kommt nichts mehr an.
  // Geprueft wird die MECHANIK, nicht der Wortlaut der Meldungen.

  // §162-B: der letzte Blick muss die Bezeichner sichern, BEVOR cleanup() sie nullt.
  // ⚠️ Signatur bewusst offen (msg[^)]*): §164 hat den Parameter `wiederkehr` ergänzt, und die
  // festgenagelte Fassung ließ die Suite mit einem TypeError abstürzen statt mit einem Fehlschlag.
  const hd = html.match(/function handleDisconnect\(msg[^)]*\)\{[\s\S]*?\n\}/)[0];
  ok(hd.indexOf('const wasRoom=roomRef') > -1 &&
     hd.indexOf('const wasRoom=roomRef') < hd.indexOf('cleanup(false)'),
     'handleDisconnect sichert Raum, Rolle und Spielernummer VOR dem Aufr\u00e4umen');
  ok(/letzterBlickAufDenRaum\(wasRoom, wasPlayer\)/.test(hd),
     '\u00a7162-B: der letzte Blick auf den Raum ist angeh\u00e4ngt');
  ok(/st\.phase!=='finished'\) return;/.test(html) && /Die Partie ist beendet: /.test(html),
     '\u00a7162-B: ein beendetes Spiel ersetzt die Abbruchmeldung durch das Ergebnis');

  // Das Ergebnis-Wort als VERHALTEN pruefen (reine Funktion, wie bei istWartung in §132).
  const teil = html.match(/function ergebnisSatz\(st, wasPlayer\)\{[\s\S]*?\n\}/)[0];
  const c = {}; require('vm').createContext(c);
  require('vm').runInContext(teil + '\n;__e=ergebnisSatz;', c);
  const e = c.__e;
  ok(/^Unentschieden \(beide einverstanden\)$/.test(e({winner:null,lastMove:{drawReason:'beide einverstanden'}},1)) &&
     e({winner:null},1) === 'Unentschieden' &&
     e({winner:1},1) === 'Du hast gewonnen' &&
     e({winner:2},1) === 'Mitspieler hat gewonnen',
     'ergebnisSatz benennt Remis mit Grund, eigenen Sieg und fremden Sieg richtig');

  // §167 (7.9.): „Erneut verbinden" ist AUSGEBAUT. Seit §163 fuehrt die eigene Unterbrechung
  // nicht mehr auf die Abbruchtafel; uebrig blieben nur Wege mit TOTEM Raum, auf denen der
  // Knopf nicht wirken konnte (Walters Gegenprobe 4 zu v130). Diese Pruefung haelt fest, dass
  // er weg ist — samt Mechanik, damit keine Leiche zurueckbleibt.
  ok(!/dc-reconnect/.test(html) && !/wiederVerbinden/.test(html) && !/merkeRaumFuerWiederkehr/.test(html),
     '\u00a7167: der wirkungslose Wiedereinstiegs-Knopf ist samt Mechanik ausgebaut');
  const dcT = html.match(/id="dc-overlay">[\s\S]*?<\/div>/)[0];
  ok((dcT.match(/<button/g)||[]).length===1 && /Zur\u00fcck zur Auswahl/.test(dcT),
     '\u00a7167: auf der Abbruchtafel steht genau EIN Knopf, und der f\u00fchrt ins Men\u00fc');

  // §162: der Rueckkehr-Pfad ist benannt und wird aus DREI Richtungen gerufen.
  ok(/async function raumRueckkehrPruefen\(\)\{/.test(html),
     '\u00a7162: der R\u00fcckkehr-Pfad ist eine benannte Funktion (vorher anonym im visibilitychange)');
  ok((html.match(/raumRueckkehrPruefen\(\)/g)||[]).length >= 3,
     '\u00a7162: er wird aus mehreren Richtungen gerufen (Definition + Hintergrund + \u00a7163)');

  // §163: eigene Verbindung.
  ok(/onValue\(ref\(db,'\.info\/connected'\)/.test(html),
     '\u00a7163: die EIGENE Verbindung wird \u00fcberwacht (.info/connected)');
  // ⚠️ Der Schalter darf AUF BEIDEN Stellungen gruen sein: der Rueckzieher ist eine
  // vorgesehene Bedienung (Walters Auflage), kein Fehler. Geprueft wird, dass es ihn gibt
  // und dass der Zuhoerer wirklich daran haengt — der STAND steht im Meldungstext.
  const schalter = html.match(/const EIGENE_PRAESENZ_AN = (true|false);/);
  ok(!!schalter && /if\(EIGENE_PRAESENZ_AN\)\{\s*\n\s*onValue\(ref\(db,'\.info\/connected'\)/.test(html),
     '\u00a7163 h\u00e4ngt an einem Schalter — ein R\u00fcckzieher ist eine Zeile (steht auf ' +
     (schalter ? schalter[1] : '?') + ')');
  const pt = html.match(/function presenceTick\(\)\{[\s\S]*?\n\}/)[0];
  ok(pt.indexOf('selbstOffline){ zeigeEigenenAusfall(); return;') > -1 &&
     pt.indexOf('selbstOffline){ zeigeEigenenAusfall(); return;') < pt.indexOf('presenceIsStale('),
     '\u00a7163: ohne eigene Leitung wird der Gegner NICHT beurteilt (kein Countdown, kein Abbruch)');
  ok(/oppOfflineSince=serverNow\(\);\s*\n\s*oppAbortDeadline=oppOfflineSince\+OPP_ABORT_GRACE_MS;/.test(html),
     '\u00a7163: nach eigener R\u00fcckkehr bekommt der Gegner eine frische Frist');
}

console.log('\u00a7161 \u2014 Startbildschirm haengt nicht am Netz:');
{
  // \u00a7161 (7.9.): Bis v126 stand `showOverlay('mode-overlay'); render();` HINTER
  // `await get(ref(db,'config'))`. Der Startbildschirm wartete damit auf einen Netz-Umlauf
  // zur Datenbank — sichtbar als aufblitzende Brettmaske aus dem statischen HTML.
  // Geprueft wird die REIHENFOLGE, nicht der Wortlaut: das Menue muss VOR dem Lesen stehen.
  // ⚠️ Die Anker muessen CODE treffen, nicht Prosa: der §161-Kommentar darueber zitiert
  // `await get(ref(db,'config'))` im Fliesstext, und eine Suche danach findet zuerst den
  // KOMMENTAR — die Pruefung fiel damit, obwohl der Code stimmte (§157-Klasse, hier im
  // eigenen Wachhund). Deshalb Anker mit Code-Umgebung, die in Prosa nicht vorkommt.
  const iMenue = html.indexOf("\nshowOverlay('mode-overlay');\nrender();\n(async()=>{");
  const iLesen = html.indexOf("const snap = await get(ref(db,'config'));");
  ok(iMenue > -1 && iLesen > -1 && iMenue < iLesen,
     'das Men\u00fc wird gezeigt, BEVOR das Wartungsflag gelesen wird');
  // Die Sperre muss trotzdem greifen: die Wartungstafel wird weiterhin gezeigt, und
  // showOverlay() blendet dabei alles andere aus — auch ein bereits offenes Men\u00fc.
  ok(/istWartung\(wert\)\)\{[\s\S]*?showOverlay\('maintenance-overlay'\)/.test(html),
     '\u00a7132 greift weiterhin \u2014 das Wartungsflag legt die Tafel \u00fcber das Men\u00fc');
  ok(/'maintenance-overlay'/.test(html.match(/function showOverlay\(id\)\{[\s\S]*?\}/)[0]),
     'showOverlay blendet beim Wechsel auch das Men\u00fc aus (maintenance-overlay in der Liste)');
  // Vorverbindungen: die Adressen muessen zu dem passen, was wirklich geladen wird.
  const hosts = ['https://www.gstatic.com',
                 'https://gembel-multiplayer-default-rtdb.europe-west1.firebasedatabase.app'];
  for(const h of hosts)
    ok(new RegExp('<link rel="preconnect" href="' + h.replace(/[.\/]/g,'\\$&') + '"').test(html),
       'preconnect auf ' + h.replace('https://','') );
  ok(/import \{ initializeApp \} from "https:\/\/www\.gstatic\.com\//.test(html) &&
     /databaseURL: "https:\/\/gembel-multiplayer-default-rtdb\.europe-west1\.firebasedatabase\.app"/.test(html),
     'die vorverbundenen Adressen sind auch die, die geladen werden (sonst ist preconnect wirkungslos)');
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

console.log('\u00a7177 \u2014 Remis-Angebot, Verlassen als Aufgabe, kein Warten auf das Netz:');
{
  const vm = require('vm');
  const fn = (re, name) => { const m = html.match(re); if(!m){ ok(false, '\u00a7177: '+name+' nicht gefunden'); return ''; } return m[0]; };

  // ── A. Das Remis-Angebot gilt nur in einer laufenden Partie ─────────────────────────
  // Walters Befund (11.9.) und der Nachbau dazu: A bietet an, zieht, gewinnt mit einem Vierer —
  // B sah das Angebot über seiner Niederlage, „Einverstanden\" schrieb winner:null.
  const rag = fn(/function remisAngebotGilt\(data\)\{[\s\S]*?\n\}/, 'remisAngebotGilt');
  if(rag){
    const t = (raum, lokal) => { const c = { phase: lokal }; vm.createContext(c);
      vm.runInContext(rag + '\n;__r=remisAngebotGilt(' + JSON.stringify(raum===null?{}:{state:{phase:raum}}) + ');', c); return c.__r; };
    ok(t('playing','playing')===true && t('bonus','bonus')===true && t('playing','bonus')===true,
       '\u00a7177: in einer laufenden Partie gilt das Angebot (auch im Bonuszug)');
    ok(t('finished','playing')===false && t('finished','finished')===false,
       '\u00a7177: steht im RAUM ein Ende, gilt es nicht mehr \u2014 auch wenn die lokale phase noch l\u00e4uft');
    ok(t('playing','finished')===false, '\u00a7177: h\u00e4lt der \u00a7164-W\u00e4chter lokal \u201efinished\u201c, gilt es auch nicht');
    ok(t(null,'playing')===false, '\u00a7177: ohne Spielzustand im Raum kein Angebot');
  }
  const ovH = (html.match(/!!\(data\.meta && data\.meta\.drawOffer\) && remisAngebotGilt\(data\)/g)||[]).length;
  ok(ovH === 2, '\u00a7177: BEIDE Zuh\u00f6rer zeigen das Remis-Overlay nur, solange das Angebot gilt (' + ovH + ' Stellen)');
  const ownSet = (html.match(/eigenesRemisSetzen\(angebot[HG] && data\.meta\.drawOffer===myRole\);/g)||[]).length;
  ok(ownSet === 2, '\u00a7177: beide Zuh\u00f6rer leiten das EIGENE offene Angebot aus dem Raum ab');

  // answerDraw: der Riegel steht VOR dem Setzen des Endes und schreibt keinen Zustand.
  const ad = fn(/window\.answerDraw=async function\(yes\)\{[\s\S]*?\n\};/, 'answerDraw');
  const iRiegel = ad.indexOf("if(phase!=='playing' && phase!=='bonus'){");
  ok(iRiegel > -1 && iRiegel < ad.indexOf("phase='finished';"),
     '\u00a7177: answerDraw pr\u00fcft die Phase, BEVOR es ein Ende setzt');
  const riegelTeil = iRiegel > -1 ? ad.slice(iRiegel, ad.indexOf('return;', iRiegel)) : '';
  ok(riegelTeil && !/pushState/.test(riegelTeil) && !/drawAcceptedBy|drawDeclined/.test(riegelTeil),
     '\u00a7177: der Riegel schreibt weder Zustand noch Signal \u2014 er r\u00e4umt nur das Angebot');

  // VERHALTEN: die echte answerDraw- und pushState-Fassung aus der Auslieferung im vm.
  const ps = fn(/async function pushState\(winner=null\)\{[\s\S]*?\n\}/, 'pushState');
  const lauf = async (phaseVorher) => {
    const writes = [];
    const c = { window:{}, console:{log(){},warn(){},error(){}}, roomRef:{}, myRole:'guest', myPlayer:2,
      mvmMoveSeq:5, mvmGameGen:1, mvmHostParityGen1:'odd', PARITY_P1:'odd', board:[[{}]], currentPlayer:2,
      phase:phaseVorher, winCells:[[0,0],[1,1],[2,2],[3,3]], pendingLastMove:null,
      boardToFirebase:()=>'B', update:async(r,o)=>{ writes.push(JSON.parse(JSON.stringify(o))); },
      setLog(){}, document:{ getElementById:()=>({ classList:{ add(){}, remove(){} } }) } };
    vm.createContext(c);
    vm.runInContext(ps + '\n' + ad.replace('window.answerDraw=', 'answerDraw=') + '\n;this.__a=answerDraw;', c);
    await c.__a(true);
    return writes;
  };
  if(ad && ps){
    SPAET.push(lauf('finished').then(w => {
      ok(!w.some(x => x.state), '\u00a7177 VERHALTEN: Annahme eines stehengebliebenen Angebots nach einem Sieg schreibt KEINEN Zustand (bis v138: winner:null)');
    }));
    SPAET.push(lauf('playing').then(w => {
      const st = (w.find(x => x.state)||{}).state;
      ok(!!st && st.phase==='finished' && st.winner===null && st.lastMove && st.lastMove.drawReason==='beide einverstanden',
         '\u00a7177 VERHALTEN: in laufender Partie wirkt die Annahme weiterhin (Remis, beide einverstanden)');
    }));
  }

  // Jedes Partieende nimmt ein offenes Angebot mit — VOR der Zustandsschreibung, ohne Wartezeit.
  const iClr = ps.indexOf("if(phase==='finished') update(roomRef,{'meta/drawOffer':null}).catch(()=>{});");
  ok(iClr > -1 && iClr < ps.indexOf('await update(roomRef,{state});'),
     '\u00a7177: pushState r\u00e4umt bei jedem Ende das Angebot, und zwar vor dem Ergebnis');

  // Der Anbieter sieht sein Angebot dauerhaft; das Anbieten wartet nicht auf das Netz.
  const od = fn(/window\.offerDraw=async function\(\)\{[\s\S]*?\n\};/, 'offerDraw');
  ok(od && !/await/.test(od.replace(/\/\/.*$/gm,'')) && od.indexOf('eigenesRemisSetzen(true);') > -1 &&
     od.indexOf('eigenesRemisSetzen(true);') < od.indexOf("update(roomRef,{'meta/drawOffer':myRole})"),
     '\u00a7177: Anbieten zeigt sofort und schreibt danach \u2014 kein await');
  const su = fn(/function updateStatusUI\(\)\{[\s\S]*?\n\}/, 'updateStatusUI');
  ok(/eigenesRemisOffen\) \? '<br>🤝 Remis angeboten'/.test(su) && (su.match(/\$\{angebotZeile\}/g)||[]).length === 2,
     '\u00a7177: die Statusanzeige tr\u00e4gt das offene Angebot als eigene Zeile (am Zug und nicht am Zug)');
  ok(/\} else if\(eigenesRemisOffen\)\{[\s\S]{0,300}?disabled[\s\S]{0,120}?Remis angeboten \u2014 wartet auf Antwort/.test(html),
     '\u00a7177: im Men\u00fc ist \u201eRemis anbieten\u201c gesperrt, solange das eigene Angebot steht');

  // ── B. Neue Runde nur nach dem Ende ────────────────────────────────────────────────
  const imSpiel = (html.match(/\} else if\(inGame\)\{[\s\S]*?\n  \} else \{\n    showLobby\(\); return;/)||[''])[0];
  ok(imSpiel && !/requestRematch\(\)/.test(imSpiel) && !/Neu anfragen</.test(imSpiel),
     '\u00a7177: das Men\u00fc der LAUFENDEN Partie hat kein \u201eNeu anfragen\u201c mehr');
  const rr = fn(/window\.requestRematch=async function\(\)\{[\s\S]*?\n\};/, 'requestRematch');
  ok(rr.indexOf("if(phase!=='finished') return;") > -1 &&
     rr.indexOf("if(phase!=='finished') return;") < rr.indexOf("update(roomRef,{'meta/rematchFrom':myRole})"),
     '\u00a7177: requestRematch schreibt nur nach dem Ende (Riegel vor dem Schreiben)');
  ok((html.match(/data\.meta\.rematchFrom && data\.state && data\.state\.phase==='finished'\)\{/g)||[]).length === 2,
     '\u00a7177: beide Zuh\u00f6rer zeigen eine Nochmal-Anfrage nur nach dem Ende');

  // ── C. Verlassen während der Partie zählt als Aufgabe ──────────────────────────────
  ok(/onclick="verlassenFragen\(\)">\$\{myRole==='host'\?'Raum aufl\u00f6sen':'Verlassen'\}<\/button>/.test(imSpiel),
     '\u00a7177: \u201eVerlassen\u201c/\u201eRaum aufl\u00f6sen\u201c in der laufenden Partie fragt erst nach');
  // §180 hat den isFinished-Block laenger gemacht (Hindernis-Abfrage) — die Absicht bleibt:
  // nach dem Ende fuehrt „Raum verlassen" direkt in leaveRoom, ohne die Aufgabe-Rueckfrage.
  // ⚠️ ANKER: `if(isFinished){` steht ZWEIMAL in der Datei (MvKI-Menü als `} else if(...)`).
  // Der MvM-Block ist der am Zeilenanfang eingerueckte — sonst spannt der Treffer ueber beide.
  const fin = (html.match(/\n  if\(isFinished\)\{[\s\S]*?\n  \} else if\(inGame\)\{/)||[''])[0];
  ok(/onclick="leaveRoom\(\)">Raum verlassen</.test(fin) && !/verlassenFragen/.test(fin),
     '\u00a7177: nach dem Ende ist Verlassen einfach Verlassen (ohne R\u00fcckfrage)');
  const vf = fn(/window\.verlassenFragen=function\(\)\{[\s\S]*?\n\};/, 'verlassenFragen');
  ok(vf.indexOf("'Das z\u00e4hlt als Aufgabe \u2014 die Partie endet f\u00fcr beide.'") > -1 &&
     vf.indexOf("'Das z\u00e4hlt als Aufgabe \u2014 dein Mitspieler gewinnt.'") > -1 &&
     vf.indexOf("'Raum aufl\u00f6sen?'") > -1 && vf.indexOf("'Partie verlassen?'") > -1,
     '\u00a7177: Wortlaut der R\u00fcckfrage wie vereinbart (Host und Gast)');
  ok(/big-btn primary[^>]*onclick="closeNeuMenu\(\)">\u21a9 Zur\u00fcck zum Brett/.test(vf) &&
     !/primary[^>]*verlassenAlsAufgabe/.test(vf),
     '\u00a7177 (\u00a779): blau ist der harmlose R\u00fcckweg, nicht das Verlassen');
  ok(/^window\.verlassenFragen=/m.test(html) && /^window\.verlassenAlsAufgabe=/m.test(html),
     '\u00a7177 (\u00a7127): beide Funktionen h\u00e4ngen an window \u2014 inline-onclick findet sie im Modul');

  const va = fn(/window\.verlassenAlsAufgabe=function\(\)\{[\s\S]*?\n\};/, 'verlassenAlsAufgabe');
  ok(va.indexOf("const laeuft = (phase==='playing' || phase==='bonus');") > -1 &&
     va.indexOf('leaveRoom()') > -1 && va.indexOf("myRole!=='host'") > -1,
     '\u00a7177: beim Tipp wird die Phase erneut gepr\u00fcft; der Gast meldet sich nur ab (der Host schreibt)');
  ok(!/await/.test(va.replace(/\/\/.*$/gm,'')) && va.indexOf('cleanup(false);') > -1 &&
     va.indexOf('cleanup(false);') < va.indexOf('setTimeout(') && /RAUM_AUFLOESEN_VERZUG_MS\)/.test(va),
     '\u00a7177: Aufl\u00f6sen wartet nicht auf das Netz; der Raum wird verz\u00f6gert gel\u00f6scht');

  // VERHALTEN: Host löst eine laufende Partie auf.
  if(va && ps){
    const writes = [], ablauf = []; let timer = null;
    const c = { window:{}, console:{log(){},warn(){},error(){}}, roomRef:{id:'R'}, myRole:'host', myPlayer:1,
      mvmMoveSeq:3, mvmGameGen:1, mvmHostParityGen1:'odd', PARITY_P1:'odd', board:[[{}]], currentPlayer:2,
      phase:'playing', winCells:[], pendingLastMove:null, RAUM_AUFLOESEN_VERZUG_MS:4000,
      boardToFirebase:()=>'B',
      update:(r,o)=>{ writes.push(JSON.parse(JSON.stringify(o))); ablauf.push('write'); return Promise.resolve(); },
      remove:(r)=>{ ablauf.push('remove:'+r.id); return Promise.resolve(); },
      cleanup(){ ablauf.push('cleanup'); c.roomRef=null; c.myRole=null; c.phase='waiting'; },
      showModeMenu(){ ablauf.push('menu'); }, leaveRoom(){ ablauf.push('leaveRoom'); },
      setTimeout:(f,ms)=>{ timer={f,ms}; ablauf.push('timer:'+ms); } };
    vm.createContext(c);
    vm.runInContext(ps + '\n' + va.replace('window.verlassenAlsAufgabe=', 'verlassenAlsAufgabe=') + '\n;verlassenAlsAufgabe();', c);
    const st = (writes.find(x => x.state)||{}).state;
    ok(!!st && st.phase==='finished' && st.winner===2 && st.lastMove.resignedBy===1 && st.lastMove.verlassen==='host',
       '\u00a7177 VERHALTEN: der Host schreibt seine Aufgabe (Gast gewinnt, verlassen:host)');
    ok(writes.length && writes[0]['meta/drawOffer']===null, '\u00a7177 VERHALTEN: ein offenes Angebot wird zuerst ger\u00e4umt');
    ok(ablauf.indexOf('menu') > -1 && ablauf.indexOf('menu') < ablauf.indexOf('timer:4000') && !ablauf.some(x=>x.startsWith('remove')),
       '\u00a7177 VERHALTEN: der Host ist sofort im Men\u00fc, gel\u00f6scht wird erst nach der Frist');
    if(timer) timer.f();
    // §181: nach der Frist wird NICHT mehr gelöscht, sondern als beendet markiert — sonst
    // erfährt ein abwesender Gast nie, was geschehen ist. Der Bezug ist weiter der gesicherte.
    const marker = writes.find(w => w['meta/aborted']===true);
    ok(!!marker && marker['meta/abortedBy']==='host' && marker['meta/abortReason']==='verlassen' &&
       !ablauf.some(x=>x.startsWith('remove')),
       '\u00a7181 VERHALTEN: nach der Frist tr\u00e4gt der ALTE Raum das Abbruch-Flag \u2014 und wird NICHT gel\u00f6scht');
  }

  // leaveRoom: kein await, lokal zuerst, Schreibungen über den gesicherten Bezug.
  const lr = fn(/window\.leaveRoom=function\(\)\{[\s\S]*?\n\};/, 'leaveRoom (nicht mehr async)');
  ok(lr && !/await/.test(lr.replace(/\/\/.*$/gm,'')) && lr.indexOf('cleanup(false);') < lr.indexOf('update(wasRoom,') &&
     /remove\(wasRoom\)/.test(lr) && /update\(wasRoom,\{guest:null, guestSeen:null\}\)/.test(lr),
     '\u00a7177: Verlassen r\u00e4umt lokal auf und schreibt DANACH ohne Wartezeit');
  ok(!/window\.leaveRoom=async/.test(html), '\u00a7177: leaveRoom ist nicht mehr async');

  // Der Host wertet den Weggang des Gastes in laufender Partie als Aufgabe.
  const gd = fn(/async function handleGuestDeparture\(data\)\{[\s\S]*?\n\}/, 'handleGuestDeparture');
  const sonst = gd.slice(gd.lastIndexOf('} else {'));
  ok(!/handleDisconnect\(/.test(sonst), '\u00a7177: der Weggang in laufender Partie f\u00fchrt nicht mehr auf die Abbruchtafel');
  ok(sonst.indexOf('applyRemoteState(data.state)') > -1 && sonst.indexOf('applyRemoteState(data.state)') < sonst.indexOf("phase='finished';"),
     '\u00a7177 (\u00a7166): erst den Raum \u00fcbernehmen, dann das Ende setzen \u2014 kein Altstand \u00fcber dem letzten Zug');
  if(gd && ps){
    const writes = [];
    const c = { window:{}, console:{log(){},warn(){},error(){}}, roomRef:{}, myRole:'host', myPlayer:1,
      hostGameStarted:true, mitspielerGegangen:false, mvmMoveSeq:3, mvmGameGen:1, mvmHostParityGen1:'odd',
      PARITY_P1:'odd', board:'ALT', currentPlayer:1, phase:'playing', winCells:[], pendingLastMove:null,
      boardToFirebase:b=>b, update:(r,o)=>{ writes.push(JSON.parse(JSON.stringify(o))); return Promise.resolve(); },
      applyRemoteState(st){ c.board=st.board; c.phase=st.phase; c.currentPlayer=st.currentPlayer; },
      handleDisconnect(){ c.abbruch=true; }, clearOppOffline(){}, stopRematchWaitTimeout(){}, setLog(){}, render(){},
      document:{ getElementById:()=>({ classList:{ add(){}, remove(){} } }) } };
    vm.createContext(c);
    vm.runInContext(ps + '\n' + gd + '\n;this.__g=handleGuestDeparture;', c);
    SPAET.push(c.__g({ guest:null, meta:{}, state:{ board:'NEU', phase:'playing', currentPlayer:1 } }).then(() => {
      const st = (writes.find(x => x.state)||{}).state;
      ok(!c.abbruch && !!st && st.winner===1 && st.lastMove.resignedBy===2 && st.lastMove.verlassen==='guest',
         '\u00a7177 VERHALTEN: Gast verl\u00e4sst \u2192 der Host schreibt die Aufgabe des Gastes, keine Abbruchtafel');
      ok(!!st && st.board==='NEU', '\u00a7177 VERHALTEN: geschrieben wird die Stellung AUS DEM RAUM, nicht der Altstand');
      ok(c.mitspielerGegangen===true, '\u00a7177 VERHALTEN: danach gilt der Mitspieler als gegangen (kein Nochmal)');
    }));
  }

  // Meldungen und Tafeltext für den, der bleibt.
  ok(/if\(!iResigned && weg\) satz='Mitspieler hat den Raum verlassen';/.test(html) &&
     !/das z\u00e4hlt als Aufgabe'/.test(html) && !/aufgegeben und den Raum aufgel\u00f6st/.test(html),
     '\u00a7179: EIN Wortlaut f\u00fcr beide Rollen \u2014 \u201eMitspieler hat den Raum verlassen\u201c');
  ok(/if\(!data\)\{handleDisconnect\(raumEndeText \|\| 'Raum nicht mehr vorhanden\.', 'Partie beendet'\);return;\}/.test(html),
     '\u00a7177: verschwindet der Raum danach, nennt die Tafel des Gastes den Grund');

  // Ein Entscheider für „neue Runde möglich?\" — mit dem Weggang als erstem Grund.
  const nr = fn(/function neueRundeUnmoeglich\(\)\{[\s\S]*?\n\}/, 'neueRundeUnmoeglich');
  if(nr){
    const t = (weg, lastSeen) => { const c = { mitspielerGegangen:weg, oppLastSeen:lastSeen, PRESENCE_STALE_MS:12000,
      serverNow:()=>100000, presenceIsStale:(now,ls,ms)=> ls===null || now-ls>ms }; vm.createContext(c);
      vm.runInContext(nr + '\n;__n=neueRundeUnmoeglich();', c); return c.__n; };
    const rWeg = t(true, 99999), rFrisch = t(false, 99999), rAlt = t(false, 50000);
    ok(!!rWeg && rWeg.endgueltig === true && /nicht m\u00f6glich/.test(rWeg.text),
       '\u00a7177 VERHALTEN: Mitspieler gegangen \u2192 sofort \u201ekeine neue Runde\u201c (nicht erst nach 12 s), und ENDG\u00dcLTIG');
    ok(rFrisch === null, '\u00a7177 VERHALTEN: Mitspieler da und frisch \u2192 Nochmal m\u00f6glich');
    ok(!!rAlt && rAlt.endgueltig === false && /nicht mehr verbunden/.test(rAlt.text),
       '\u00a7177 VERHALTEN: Herzschlag abgestanden \u2192 Verbindungshinweis, aber VORL\u00c4UFIG (Knopf bleibt)');
    ok(!/verlassen|verbunden/.test(rWeg.text),
       '\u00a7179: der endg\u00fcltige Hinweis nennt den Grund NICHT \u2014 er steht schon als Meldung dar\u00fcber');
  }
  ok(/eigenesRemisOffen=false; mitspielerGegangen=false; raumEndeText=null;/.test(html),
     '\u00a7177 (\u00a7170-Lehre): cleanup setzt alle drei Zust\u00e4nde zur\u00fcck \u2014 sie wandern nicht in den n\u00e4chsten Raum');

  // ── D. Eigener Fehler aus §170: Rückkehr in einen verschwundenen Raum ───────────────
  const rp = fn(/async function raumRueckkehrPruefen\(\)\{[\s\S]*?\n\}/, 'raumRueckkehrPruefen');
  const vorDecl = rp.slice(rp.indexOf('if(!snap.exists()){'), rp.indexOf('const data=snap.val();'));
  ok(vorDecl.length > 0 && !/\bdata\b/.test(vorDecl.replace(/\/\/.*$/gm,'')),
     '\u00a7177: vor `const data` wird `data` nicht mehr benutzt (bis v138 ReferenceError \u2192 Dauer-\u201eVerbindung wird wiederhergestellt\u201c)');
}


console.log('\u00a7179 \u2014 ein Wortlaut, und der Nochmal-Knopf verschwindet, wenn er nichts mehr kann:');
{
  const vm = require('vm');
  // Walters Screenshots (12.9., 10:01): der Gast hatte die laufende Partie verlassen. Der Host sah
  // „Mitspieler hat die Partie verlassen — das zählt als Aufgabe“, darunter „Nochmal“ und
  // darunter fast denselben Satz noch einmal. Ein Tipp auf den Knopf schrieb den Satz ZUSÄTZLICH
  // in die Meldungszeile — dieselbe Aussage dreimal auf einem Bildschirm.
  const wa = (html.match(/winArea\.innerHTML = bannerHtml \+[^;]*;/)||[''])[0];
  ok(/\(hindernis && hindernis\.endgueltig\) \? '' : rematchBtn/.test(wa),
     '\u00a7179: bei einem endg\u00fcltigen Hindernis steht KEIN Nochmal-Knopf im Schlussbild');

  // VERHALTEN: das Schlussbild einmal mit dem echten Ausdruck aus der Auslieferung bauen.
  const bauen = (hindernis) => {
    const c = { bannerHtml:'[BANNER]', rematchBtn:'[KNOPF]', hindernis:hindernis,
                winArea:{innerHTML:''} };
    vm.createContext(c);
    vm.runInContext("const wegHinweis = hindernis ? '[HINWEIS:'+hindernis.text+']' : '';\n" + wa, c);
    return c.winArea.innerHTML;
  };
  const endg = bauen({endgueltig:true,  text:'Eine neue Runde ist nicht m\u00f6glich.'});
  const vorl = bauen({endgueltig:false, text:'Mitspieler ist nicht mehr verbunden \u2014 eine neue Runde ist gerade nicht m\u00f6glich.'});
  const frei = bauen(null);
  ok(endg.indexOf('[KNOPF]') === -1 && endg.indexOf('[HINWEIS:') > -1,
     '\u00a7179 VERHALTEN: Mitspieler hat den Raum verlassen \u2192 nur Banner und Hinweis');
  ok(vorl.indexOf('[KNOPF]') > -1 && vorl.indexOf('[HINWEIS:') > -1,
     '\u00a7179 VERHALTEN: nur der Herzschlag fehlt \u2192 Knopf UND Hinweis (\u00a7172-Kleinl\u00f6sung bleibt)');
  ok(frei.indexOf('[KNOPF]') > -1 && frei.indexOf('[HINWEIS:') === -1,
     '\u00a7179 VERHALTEN: nichts im Weg \u2192 nur Banner und Knopf');

  // Der Wortlaut steht genau EINMAL im Code, und der Hinweis wiederholt ihn nicht.
  // Nur die ausgelieferten Zeichenketten zaehlen, nicht die Kommentare, die den Wortlaut nennen.
  const satzStellen = (html.replace(/\/\/.*$/gm,'').match(/Mitspieler hat den Raum verlassen/g)||[]).length;
  ok(satzStellen === 6,
     '\u00a7179: der Satz steht an genau sechs Stellen (Aufgabe- und Weggang-Meldung, Tafeltext, \u00a7181-Abbruchtext in zwei Rollen, \u00a7182-Abschlusstafel) \u2014 gefunden: ' + satzStellen);
  const nru2 = (html.match(/function neueRundeUnmoeglich\(\)\{[\s\S]*?\n\}/)||[''])[0];
  ok(/endgueltig:true,\s*text:'Eine neue Runde ist nicht m\u00f6glich\.'/.test(nru2),
     '\u00a7179: der endg\u00fcltige Hinweis ist EIN kurzer Satz ohne Begr\u00fcndung');
  ok(/raumEndeText='Mitspieler hat den Raum verlassen \u2014 du hast gewonnen\.';/.test(html),
     '\u00a7179: die Tafel nach dem Aufl\u00f6sen tr\u00e4gt denselben Wortlaut');
  // Die Weggang-Meldung des Hosts darf nicht zusätzlich zur Aufgabe-Meldung stehen (§177-Riegel).
  const gd2 = (html.match(/async function handleGuestDeparture\(data\)\{[\s\S]*?\n\}/)||[''])[0];
  ok(/if\(!\(lmG && lmG\.verlassen==='guest'\)\)/.test(gd2),
     '\u00a7179: bei \u201eGast verlassen\u201c steht der Satz nur einmal (kein zweiter setLog)');
}


console.log('\u00a7180 \u2014 das Men\u00fc wei\u00df dasselbe wie das Schlussbild, und die Absage steht einmal:');
{
  const vm = require('vm');
  // Walters Screenshots (12.9., 10:43 und 10:50): §179 hatte den Nochmal-Knopf nur im SCHLUSSBILD
  // entfernt. Im Menü „Spiel beendet" stand „Nochmal anfragen" weiter; der Tipp schrieb die
  // Absage zusätzlich in die Meldungszeile — derselbe Satz zweimal auf einem Bildschirm.
  const fin2 = (html.match(/\n  if\(isFinished\)\{[\s\S]*?\n  \} else if\(inGame\)\{/)||[''])[0];
  ok(/const hindernisM = neueRundeUnmoeglich\(\);/.test(fin2) &&
     /const endgueltigM = !!\(hindernisM && hindernisM\.endgueltig\);/.test(fin2),
     '\u00a7180: das Men\u00fc \u201eSpiel beendet\u201c liest denselben Entscheider wie Schlussbild und Sperre');

  // VERHALTEN: den echten Ausdruck aus der Auslieferung dreimal bauen.
  const tmpl = (fin2.match(/btnsEl\.innerHTML=`[\s\S]*?`;/)||[''])[0];
  const bauen = (hind) => {
    const c = { btnsEl:{innerHTML:''}, neueRundeUnmoeglich:()=>hind };
    vm.createContext(c);
    vm.runInContext(fin2.slice(fin2.indexOf('const hindernisM')).split('btnsEl.innerHTML=')[0] + tmpl, c);
    return c.btnsEl.innerHTML;
  };
  const mEnd = bauen({endgueltig:true,  text:'Eine neue Runde ist nicht m\u00f6glich.'});
  const mVor = bauen({endgueltig:false, text:'Mitspieler ist nicht mehr verbunden \u2014 eine neue Runde ist gerade nicht m\u00f6glich.'});
  const mFrei = bauen(null);
  ok(mEnd.indexOf('Nochmal anfragen') === -1,
     '\u00a7180 VERHALTEN: Mitspieler hat den Raum verlassen \u2192 kein \u201eNochmal anfragen\u201c im Men\u00fc');
  ok(mVor.indexOf('Nochmal anfragen') > -1 && mFrei.indexOf('Nochmal anfragen') > -1,
     '\u00a7180 VERHALTEN: vorl\u00e4ufiges Hindernis oder keines \u2192 \u201eNochmal anfragen\u201c bleibt');
  // Walters Vorgabe: dann trägt „Raum verlassen" die Betonung — der Weg ins Obermenü.
  const primaerVor = (t) => {
    const m = t.match(/<button class="big-btn primary"[^>]*>([^<]*)</);
    return m ? m[1].replace(/\s+/g,' ').trim() : null;
  };
  ok(primaerVor(mEnd) === 'Raum verlassen',
     '\u00a7180 VERHALTEN: im endg\u00fcltigen Fall ist \u201eRaum verlassen\u201c der blaue Knopf');
  ok(primaerVor(mVor) === 'Weiterschauen' && primaerVor(mFrei) === 'Weiterschauen',
     '\u00a7180 VERHALTEN: sonst bleibt \u201eWeiterschauen\u201c blau (Zustand wie vor \u00a7180)');
  ok((mEnd.match(/class="big-btn primary"/g)||[]).length === 1 &&
     (mVor.match(/class="big-btn primary"/g)||[]).length === 1,
     '\u00a7180 VERHALTEN: immer genau EIN blauer Knopf \u2014 keine zwei Betonungen (\u00a7134)');
  ok(mEnd.indexOf('Weiterschauen') > -1 && mEnd.indexOf('Raum verlassen') > -1,
     '\u00a7180 VERHALTEN: \u201eWeiterschauen\u201c bleibt erreichbar (Endbrett ansehen)');

  // Die Sperre schweigt: der Satz steht schon unter dem Banner.
  const rr180 = (html.match(/window\.requestRematch=async function\(\)\{[\s\S]*?\n\};/)||[''])[0];
  // ⚠️ Kommentare abziehen: der Kommentar NENNT `setLog` (was früher dort stand) — ohne das
  // würde die Pruefung am eigenen Erklaertext scheitern statt am Code (dieselbe Falle wie §179).
  const riegel = rr180.slice(rr180.indexOf('if(hindernis){'), rr180.indexOf('return;', rr180.indexOf('if(hindernis){')))
                      .replace(/\/\/.*$/gm,'');
  ok(riegel.length > 0 && !/setLog/.test(riegel) && /console\.log/.test(riegel),
     '\u00a7180: die Nochmal-Sperre schreibt keine Meldung mehr \u2014 der Hinweis steht im Schlussbild');
}


console.log('\u00a7181 \u2014 der Abwesende erf\u00e4hrt den Grund, und das Brett blitzt nicht auf:');
{
  const vm = require('vm');
  // Walters zweiter Versuch (12.9.): Gast im Flugmodus, während der Host die laufende Partie
  // auflöst. Beim Zurückkommen: „Verbindung unterbrochen / Raum nicht mehr vorhanden" — ohne
  // Grund und ohne Ergebnis, und davor blitzte kurz das alte Brett auf.

  // (A) Der Raum wird markiert, nicht gelöscht — sonst ist der Grund unauffindbar.
  const va181 = (html.match(/window\.verlassenAlsAufgabe=function\(\)\{[\s\S]*?\n\};/)||[''])[0];
  ok(/'meta\/aborted':true,'meta\/abortedBy':'host','meta\/abortReason':'verlassen'/.test(va181) &&
     !/remove\(wasRoom\)/.test(va181),
     '\u00a7181: der Host markiert den Raum als beendet, statt ihn zu l\u00f6schen');

  // (B) abbruchText unterscheidet Verlassen von abgelaufener Frist — VERHALTEN, beide Rollen.
  const at = (html.match(/function abbruchText\(data\)\{[\s\S]*?\n\}/)||[''])[0];
  const t181 = (meta, rolle) => {
    const c = { myRole: rolle }; vm.createContext(c);
    vm.runInContext(at + '\n;__t=abbruchText(' + JSON.stringify({meta:meta}) + ');', c);
    return c.__t;
  };
  ok(/verlassen/.test(t181({aborted:true,abortedBy:'host',abortReason:'verlassen'}, 'guest')) &&
     !/unterbrochen/.test(t181({aborted:true,abortedBy:'host',abortReason:'verlassen'}, 'guest')),
     '\u00a7181 VERHALTEN: Gast liest \u201eMitspieler hat den Raum verlassen\u201c \u2014 keine erfundene Unterbrechung');
  ok(/^Du hast/.test(t181({aborted:true,abortedBy:'host',abortReason:'verlassen'}, 'host')),
     '\u00a7181 VERHALTEN: wer selbst gegangen ist, liest es in der eigenen Form');
  ok(/unterbrochen/.test(t181({aborted:true,abortedBy:'host'}, 'guest')) &&
     /unterbrochen/.test(t181({aborted:true}, 'guest')),
     '\u00a7181 VERHALTEN: ein echter Frist-Abbruch beh\u00e4lt seinen Text (\u00a775-W3-A unber\u00fchrt)');

  // (C) Das Brett bleibt verdeckt, bis der Stand bekannt ist.
  ok(/function zeigeStandWirdGeprueft\(\)\{[\s\S]{0,400}?standWirdGeprueft=true;/.test(html) &&
     /Der Stand wird gepr\u00fcft/.test(html),
     '\u00a7181: es gibt einen Zwischenzustand \u201eStand wird gepr\u00fcft\u201c auf derselben Tafel');
  const pt181 = (html.match(/function presenceTick\(\)\{[\s\S]*?\n\}/)||[''])[0];
  const iGuard = pt181.indexOf('if(standWirdGeprueft) return;');
  const iClear = pt181.indexOf('if(eigenerAusfallSichtbar) clearEigenenAusfall();     //');
  const iSelbst = pt181.indexOf('if(EIGENE_PRAESENZ_AN && selbstOffline){ zeigeEigenenAusfall(); return; }');
  ok(iGuard > -1 && iGuard < iClear,
     '\u00a7181: der Pr\u00e4senz-Tick r\u00e4umt die Tafel im Pr\u00fcf-Fenster NICHT weg (sonst blitzt das Brett nach 1 s)');
  ok(iSelbst > -1 && iSelbst < iGuard,
     '\u00a7181: f\u00e4llt die Leitung im Pr\u00fcf-Fenster wieder aus, gewinnt die eigene Ausfalltafel');
  // Kein Hängen: die Räumung setzt den Merker zurück, und jeder Ausgang räumt.
  ok(/function clearEigenenAusfall\(\)\{[\s\S]{0,300}?standWirdGeprueft=false;/.test(html),
     '\u00a7181: clearEigenenAusfall setzt den Merker zur\u00fcck \u2014 EIN Ausgang f\u00fcr beide Zust\u00e4nde');
  const rp181 = (html.match(/async function raumRueckkehrPruefen\(\)\{[\s\S]*?\n\}/)||[''])[0];
  ok((rp181.match(/clearEigenenAusfall\(\);/g)||[]).length === 2 &&
     /\}catch\(e\)\{[\s\S]*?clearEigenenAusfall\(\);/.test(rp181),
     '\u00a7181: ger\u00e4umt wird im Erfolgsfall UND im catch \u2014 niemand bleibt in \u201ewird gepr\u00fcft\u201c h\u00e4ngen');
  const iWeiter = rp181.indexOf('clearEigenenAusfall();');
  ok(iWeiter > rp181.indexOf('applyRemoteState(data.state);'),
     '\u00a7181: aufgedeckt wird erst, NACHDEM der frische Zustand angewandt ist');
  ok(/standWirdGeprueft=false;   \/\/ \u00a7181: ohne Raum gibt es nichts zu pr\u00fcfen/.test(html),
     '\u00a7181 (\u00a7170-Lehre): cleanup setzt den Merker mit zur\u00fcck');
}


console.log('\u00a7182 \u2014 die Abschlusstafel nennt den Grund und tr\u00e4gt die richtige \u00dcberschrift:');
{
  const vm = require('vm');
  // Walters Befund (12.9.): über „Mitspieler hat den Raum verlassen. Du hast gewonnen." stand
  // weiter „Verbindung unterbrochen" — und der letzte Blick (§162-B) überschrieb den Grund mit
  // dem allgemeinen „Die Partie ist beendet: … wegen der Unterbrechung …".
  ok(/<h2 id="dc-title">/.test(html) &&
     /function setzeAbschlussTafel\(titel, text\)\{[\s\S]{0,400}?dc-title[\s\S]{0,200}?dc-msg/.test(html),
     '\u00a7182: \u00dcberschrift und Text der Tafel kommen aus EINER Funktion');

  // VERHALTEN: der echte letzte Blick gegen einen Raum mit und ohne Grund.
  const lb = (html.match(/async function letzterBlickAufDenRaum\(wasRoom, wasPlayer\)\{[\s\S]*?\n\}/)||[''])[0];
  const es = (html.match(/function ergebnisSatz\(st, wasPlayer\)\{[\s\S]*?\n\}/)||[''])[0];
  const blick = async (meta) => {
    const tafel = {titel:'Verbindung unterbrochen', text:'Mitspieler hat den Raum verlassen \u2014 die Partie ist beendet.'};
    const c = { console:{log(){},warn(){}}, tafel,
      setzeAbschlussTafel:(t,x)=>{ tafel.titel=t; tafel.text=x; },
      get:async()=>({exists:()=>true, val:()=>({meta:meta, state:{phase:'finished', winner:2}})}) };
    vm.createContext(c);
    vm.runInContext(es + '\n' + lb + '\n;this.__b=letzterBlickAufDenRaum;', c);
    await c.__b({}, 2);
    return tafel;
  };
  SPAET.push(blick({aborted:true, abortedBy:'host', abortReason:'verlassen'}).then(t => {
    ok(t.titel === 'Partie beendet',
       '\u00a7182 VERHALTEN: die \u00dcberschrift lautet \u201ePartie beendet\u201c, nicht \u201eVerbindung unterbrochen\u201c');
    ok(/^Mitspieler hat den Raum verlassen\. Du hast gewonnen\.$/.test(t.text),
       '\u00a7182 VERHALTEN: der GRUND steht vorn, das Ergebnis dahinter \u2014 und kein Wort \u00fcber die Leitung');
  }));
  SPAET.push(blick({}).then(t => {
    ok(/Die Partie ist beendet: Du hast gewonnen/.test(t.text) && /Unterbrechung/.test(t.text),
       '\u00a7182 VERHALTEN: ist der Grund NICHT bekannt, bleibt der bisherige Satz (\u00a7162-B unber\u00fchrt)');
    ok(t.titel === 'Partie beendet',
       '\u00a7182 VERHALTEN: auch dann geht es um das Ende der Partie, nicht um die Leitung');
  }));

  // Die Wege, auf denen das Ende feststeht, setzen die Überschrift mit.
  const har = (html.match(/function handleAbortReturn\(msg\)\{[\s\S]*?\n\}/)||[''])[0];
  ok(/'Partie beendet'\);/.test(har),
     '\u00a7182: die Abbruch-R\u00fcckkehr tr\u00e4gt die \u00dcberschrift \u201ePartie beendet\u201c');
  // Und die Voreinstellung bleibt, wo die Leitung wirklich das Thema ist.
  const hd = (html.match(/function handleDisconnect\(msg, titel\)\{[\s\S]*?\n\}/)||[''])[0];
  ok(/titel\|\|'Verbindung unterbrochen'/.test(hd),
     '\u00a7182: ohne Angabe bleibt es bei \u201eVerbindung unterbrochen\u201c (alle \u00fcbrigen Wege unver\u00e4ndert)');
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

Promise.all(SPAET).then(() => {
  console.log('');
  console.log(pass + '/' + (pass+fail) + ' Tests bestanden' + (fail ? ' \u2014 ' + fail + ' FEHLGESCHLAGEN' : ''));
  process.exit(fail ? 1 : 0);
}, e => { console.log('  \u2717 FAIL: sp\u00e4te Pr\u00fcfung abgest\u00fcrzt \u2014 ' + (e && e.message)); process.exit(1); });
