// ═══════════════════════════════════════════════════════════════════
// test_anleitung_137.js — Pruefsuite fuer anleitung.html
// ═══════════════════════════════════════════════════════════════════
//
// Gegenstand: die interaktive Spielanleitung. Drei Bloecke:
//   A · Selbsttest der Anleitung gegen die kanonische Regelschicht
//       (dieselbe Funktion, die auch im Browser beim Laden laeuft)
//   B · Durchklick im DOM — jede Station wird wirklich bedient
//       (§136-Belegregel: Quelltext lesen prueft die Absicht, nicht den Vollzug)
//   C · Negativkontrolle — sechs Regelaenderungen, die alle auffallen muessen
//
// ⚠️ Block B braucht `jsdom`. Ist es nicht installiert, wird B UEBERSPRUNGEN
//    und die Suite meldet das laut. Eine uebersprungene Pruefung ist keine
//    bestandene. Installieren mit:  npm install jsdom
//
// ⚠️ Diese Suite hat KEINEN Deploy-Guard auf den Build-Marker, weil
//    anleitung.html den Kern nicht laedt. Sobald der Einstiegsknopf in
//    index.html steht, gehoert der ?v=-Pfad dieser Datei in den Guard der
//    uebrigen Suiten (dann sind es FUENF Ladewege, nicht vier).
//
// Aufruf:  node test_anleitung_137.js
// ═══════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const DIR = __dirname;

let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) { pass++; } else { fail++; console.log('  ROT  ' + name); } };
const head = s => console.log('\n' + s);

const rulesSrc = fs.readFileSync(path.join(DIR, 'gembel_rules.js'), 'utf8');
const htmlSrc  = fs.readFileSync(path.join(DIR, 'anleitung.html'), 'utf8');
const pageCode = [...htmlSrc.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).pop();

// Die Verbots-Pruefungen unten duerfen nicht am KOMMENTAR haengenbleiben: der Kopf von
// anleitung.html nennt countred_ai_core.js, new Worker() und Firebase ausdruecklich —
// als Begruendung, warum sie NICHT vorkommen. Geprueft wird deshalb der Code ohne
// Kommentare. (Reine Textsuche, wird nie ausgefuehrt.)
const stripComments = src => src
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');
const liveHtml = stripComments(htmlSrc);
const liveCode = stripComments(pageCode);

// ── Block A · Selbsttest und Struktur ──────────────────────────────
head('A · Selbsttest und Struktur');

const api = new Function('return (function(){ ' + rulesSrc + '\n' + pageCode +
  '\nreturn {selfTest, STEPS, CELL, LEARNER, OPPONENT, PARITY, explainLift, explainDrop, doMove, fromSpec, ZIELSPEC, canLift, canDrop, initBoard, cloneBoard, getLegalMoves, applyMove, applyMoveOn, checkFourInRow, applyLockOn, countRedsInStack, parityOk}; })()')();

const errs = api.selfTest();
t('A1  Selbsttest ist gruen (' + errs.length + ' Meldungen)', errs.length === 0);
if (errs.length) errs.forEach(e => console.log('       ' + e));

t('A2  elf Schritte', api.STEPS.length === 11);
t('A3  jeder Schritt hat Titel, Text und Modus',
  api.STEPS.every(s => s.title && s.text && ['move','tap','auto','read'].includes(s.mode)));
t('A4  jeder Zug-Schritt nennt Quell- und Zielfeld',
  api.STEPS.filter(s => s.mode === 'move' || s.mode === 'auto').every(s => api.CELL[s.from] && api.CELL[s.to]));
t('A5  jeder Antipp-Schritt nennt ein gueltiges Feld',
  api.STEPS.filter(s => s.mode === 'tap').every(s => api.CELL[s.tap]));
t('A6  genau zwei geskriptete Gegenzuege',
  api.STEPS.filter(s => s.mode === 'auto').length === 2);
t('A7  der Lernende zieht mindestens fuenfmal selbst',
  api.STEPS.filter(s => s.mode === 'move').length >= 5);

// Die Anleitung darf den eingefrorenen Kern nicht anfassen.
t('A8  laedt gembel_rules.js', /<script src="gembel_rules\.js/.test(htmlSrc));
t('A9  laedt countred_ai_core.js NICHT', !/countred_ai_core\.js/.test(liveHtml));
t('A10 laedt keinen Worker', !/new Worker\(/.test(liveHtml));
t('A11 keine Firebase-Einbindung', !/firebase/i.test(liveHtml));
t('A12 kein Browser-Speicher', !/localStorage|sessionStorage|document\.cookie/.test(liveHtml));
t('A13 keine externen Quellen', !/(src|href)\s*=\s*["']https?:/i.test(liveHtml));
t('A14 kein eval, kein new Function im Auslieferungscode',
  !/\beval\s*\(/.test(liveCode) && !/new Function\s*\(/.test(liveCode));

// Kein Regelduplikat: die Anleitung darf keine eigene Zugpruefung mitbringen.
t('A15 definiert canLift/canDrop/canStack NICHT selbst',
  !/function\s+(canLift|canDrop|canStack|canPlaceOnEmpty|parityOk|countRedNeighbors)\s*\(/.test(liveCode));
t('A16 keine Reichweitenregel im Anleitungscode',
  !/Math\.abs\(\s*fr\s*-\s*tr\s*\)\s*>\s*1|Math\.abs\(\s*fc\s*-\s*tc\s*\)\s*>\s*1/.test(liveCode));
t('A17 Cache-Bust-Parameter vorhanden', /gembel_rules\.js\?v=\d+/.test(htmlSrc));

// Die Ziel-Stellung, an der Schritt 1 haengt.
const z = api.fromSpec(api.ZIELSPEC, api.LEARNER);
const wins = api.getLegalMoves(z, api.LEARNER, api.PARITY).filter(m => {
  const nb = api.applyMoveOn(z, m.fr, m.fc, m.tr, m.tc, api.LEARNER);
  return api.checkFourInRow(nb, 'black') || api.checkFourInRow(nb, 'red');
});
t('A18 Ziel-Stellung: genau ein Siegzug', wins.length === 1);
t('A19 Ziel-Stellung: kein Vierer steht schon', !(api.checkFourInRow(z,'black') || api.checkFourInRow(z,'red')));
t('A20 Ziel-Stellung: keine offene Dreierreihe', !api.applyLockOn(api.cloneBoard(z)));

// A21-A22 · STAPEL-INVARIANTE. canStack prueft die Paritaet der Roten im neuen Stapel,
// also legt der Stapelinhalt fest, WER ihn gebildet haben kann. Von Hand gesetzte
// Stellungen koennen das verletzen und waeren dann unerreichbar — genau das war der
// Fall, bevor der Stapel der Ziel-Stellung dem Lernenden zugeordnet wurde.
function stapelTreu(brett) {
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const st = brett[r][c].stack; if (!st) continue;
    const n = api.countRedsInStack ? api.countRedsInStack(st.bottom, st.top)
            : (st.bottom.color === 'red' ? 1 : 0) + (st.top.color === 'red' ? 1 : 0);
    if (!api.parityOk(n, st.formedBy, api.PARITY)) return false;
  }
  return true;
}
t('A21 Ziel-Stellung haelt die Stapel-Invariante', stapelTreu(z));
{
  // ueber die ganze Lehrpartie mitfuehren
  let bb = null, alleTreu = true;
  for (const st of api.STEPS) {
    if (st.setup !== 'keep') bb = st.setup().board;
    if (!bb) continue;
    if (!stapelTreu(bb)) alleTreu = false;
    if (st.mode === 'move' || st.mode === 'auto') {
      const [fr, fc] = api.CELL[st.from], [tr, tc] = api.CELL[st.to];
      const pl = st.mode === 'move' ? api.LEARNER : api.OPPONENT;
      if (api.canDrop(bb, fr, fc, tr, tc, pl, api.PARITY)) api.applyMove(bb, fr, fc, tr, tc, pl);
      api.applyLockOn(bb);
      if (!stapelTreu(bb)) alleTreu = false;
    }
  }
  t('A22 jede Stellung der Lehrpartie haelt die Stapel-Invariante', alleTreu);
}

// ── Block B · Durchklick im DOM ────────────────────────────────────
head('B · Durchklick im DOM');
let JSDOM = null;
try { ({ JSDOM } = require('jsdom')); } catch (e) { /* nicht installiert */ }

function blockB(done) {
  if (!JSDOM) {
    console.log('  UEBERSPRUNGEN — jsdom fehlt. `npm install jsdom`, dann erneut laufen lassen.');
    console.log('  ⚠️ Eine uebersprungene Pruefung ist keine bestandene.');
    return done(true);
  }
  // Eine kaputte Anleitung sperrt sich selbst (Selbsttest) — dann ist das Brett gar
  // nicht da. Die Suite muss das als ROT melden, nicht mit einer Ausnahme abbrechen.
  const guard = (label, fn) => { try { fn(); } catch (e) {
    fail++; console.log('  ROT  ' + label + ' — Ausnahme: ' + e.message);
    console.log('       (typisch, wenn der Selbsttest die Seite gesperrt hat)');
    return false; } return true; };
  const html = htmlSrc.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,
    '<script>' + rulesSrc + '</script>');
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  const d = dom.window.document;
  const cell = n => [...d.querySelectorAll('#board .cell')].find(x => x.title === n);
  const tap = n => cell(n).onclick();
  const why = () => d.getElementById('why').textContent.trim();
  const cls = () => d.getElementById('why').className;
  const nx  = () => d.getElementById('btn-next');
  const step = () => d.getElementById('stepno').textContent;
  const lesson = () => d.getElementById('ltext').textContent;

  if (d.getElementById('selftest').style.display === 'block') {
    fail++; console.log('  ROT  B1  Selbsttest hat die Seite gesperrt — Block B nicht durchfuehrbar');
    return done(false);
  }
  t('B1  Selbsttest hat die Seite nicht gesperrt', true);
  t('B2  Brett hat 16 Felder', d.querySelectorAll('#board .cell').length === 16);

  if (!guard('B3..B23 (Schritte 1-5)', () => {
  t('B3  Start bei Schritt 1', /Schritt 1 von 11/.test(step()));
  tap('1C');
  t('B4  falscher Tipp beendet den Schritt nicht', nx().disabled);
  t('B5  falscher Tipp nennt das richtige Feld', /1D/.test(why()));
  tap('1D'); tap('1B');
  t('B6  Siegzug beendet Schritt 1', !nx().disabled);
  t('B7  Siegmeldung erscheint', /gewonnen/i.test(why()));
  t('B8  Vierer wird markiert', d.querySelectorAll('#board .cell.win-row').length === 4);
  nx().onclick();

  t('B9  Schritt 2 erreicht', /Schritt 2 von 11/.test(step()));
  t('B10 Siegmarkierung nicht ins Startbrett geschleppt', d.querySelectorAll('#board .cell.win-row').length === 0);
  tap('2C');
  t('B11 Feld ansehen schaltet frei', !nx().disabled);
  t('B12 Figur und Feldwert werden benannt', /rot/.test(why()) && /Punkte/.test(why()));
  nx().onclick();

  tap('2B');
  t('B13 2B wird als nicht hebbar abgelehnt', cls() === 'no');
  t('B14 die Summe steht im Text', /gerade/.test(why()));
  t('B15 Nachbarschaft ist hervorgehoben', d.querySelectorAll('#board .cell.nb').length > 0);
  t('B16 gezaehlte rote Nachbarn sind markiert', d.querySelectorAll('#board .cell.nb-counted').length === 4);
  t('B17 Hervorhebung bleibt nach dem Schritt stehen', !nx().disabled && d.querySelectorAll('#board .cell.nb').length > 0);
  nx().onclick();

  tap('1B');
  t('B18 1B wird als hebbar bestaetigt', cls() === 'ok');
  nx().onclick();

  tap('1B'); tap('3A');
  t('B19 erlaubtes, aber nicht verlangtes Ziel beendet den Schritt nicht', nx().disabled);
  t('B20 Hinweis auf das verlangte Ziel', /2B/.test(why()));
  tap('2B');
  t('B21 Stapelzug wird angenommen', !nx().disabled);
  t('B22 Stapelregel wird erklaert', /Stapel/.test(why()));
  nx().onclick();

  t('B23 Gegenzug-Schritt hat eigene Knopfbeschriftung', /Gegner ziehen lassen/.test(nx().textContent));
  nx().onclick();
  })) return done(false);
  setTimeout(() => {
    if (!guard('B24..B26', () => {
    t('B24 erster Gegenzug abgeschlossen', !nx().disabled);
    t('B25 Leerfeldregel wird erklaert', /Punktzahl|leeres/i.test(lesson()));
    nx().onclick();

    tap('1C'); tap('1D');
    t('B26 Zug auf leeres Feld angenommen', !nx().disabled);
    nx().onclick();

    nx().onclick();
    })) return done(false);
    setTimeout(() => {
      if (!guard('B27..B43', () => {
      t('B27 zweiter Gegenzug abgeschlossen', !nx().disabled);
      nx().onclick();

      tap('3C'); tap('3B');
      t('B28 Dreierzug angenommen', !nx().disabled);
      t('B29 Dreiermeldung erscheint', /Drei in einer Reihe/.test(why()));
      t('B30 Bonuszug wird angekuendigt', /Bonuszug/.test(why()));
      t('B31 drei Felder werden gesperrt dargestellt', d.querySelectorAll('#board .cell.locked-row').length === 3);
      nx().onclick();

      tap('3B');
      t('B32 gesperrte Einzelfigur wird abgelehnt', cls() === 'no');
      t('B33 Sperrung wird als Grund genannt', /gesperrt/.test(why()));
      tap('2B');
      t('B34 eigener Stapel auf gesperrtem Feld ist hebbar', cls() === 'ok');
      tap('1C');
      t('B35 Bonuszug angenommen', !nx().disabled);
      nx().onclick();

      t('B36 Anhang erreicht', /Schritt 11 von 11/.test(step()));
      t('B37 Anhang fuehrt ins Spiel', /Zum Spiel/.test(nx().textContent));
      t('B38 Remis steht im Anhang', /Remis/.test(lesson()));
      t('B39 Paritaetswechsel steht im Anhang', /gerade/.test(lesson()));

      d.getElementById('btn-back').onclick();
      t('B40 Zurueck landet auf Schritt 10', /Schritt 10 von 11/.test(step()));
      t('B41 Zurueck rekonstruiert die Sperrung', d.querySelectorAll('#board .cell.locked-row').length === 3);
      tap('2B'); tap('1C');
      t('B42 rekonstruierte Stellung ist spielbar', !nx().disabled);
      d.getElementById('btn-again').onclick();
      t('B43 Nochmal setzt den Schritt zurueck', nx().disabled);
      })) return done(false);
      done(false);
    }, 3400);
  }, 3400);
}

// ── Block C · Negativkontrolle ─────────────────────────────────────
function blockC() {
  head('C · Negativkontrolle — jede Regelaenderung muss auffallen');
  const run = mutated => {
    try {
      return new Function('return (function(){' + mutated + '\n' + pageCode + '\nreturn selfTest();})()')();
    } catch (e) { return ['Ausnahme: ' + e.message]; }
  };
  const mut = [
    ['C1  unveraendert bleibt gruen', rulesSrc, 0],
    ['C2  v2.0-canStack-Bug faellt auf',
      rulesSrc.replace('if(!to.piece||to.stack) return false;', 'if(!to.piece||to.stack||to.locked) return false;'), 1],
    ['C3  eingebaute Reichweitenregel faellt auf',
      rulesSrc.replace('const mp=getMovingPiece(b[fr][fc]);\n  if(!mp) return false;',
        'if(Math.abs(fr-tr)>1||Math.abs(fc-tc)>1) return false;\n  const mp=getMovingPiece(b[fr][fc]);\n  if(!mp) return false;'), 1],
    ['C4  vertauschte Paritaet faellt auf',
      rulesSrc.replace("const p1odd = (p1parity === 'odd');", "const p1odd = (p1parity !== 'odd');"), 1],
    ['C5  abgeschaltetes Stripe-Match faellt auf',
      rulesSrc.replace('if(mp.stripe!==to.stripe) return false;', 'if(false) return false;'), 1],
    ['C6  aufgeweichte Dreiererkennung faellt auf',
      rulesSrc.replace("if(!base||base.color!==color||base.stripe!==cell.stripe){ok=false;break;}", "if(!base){ok=false;break;}"), 1],
    ['C7  entfallene Stapelhoheit faellt auf',
      rulesSrc.replace('if(cell.stack){ return cell.stack.formedBy===player; }', 'if(cell.stack){ return true; }'), 1],
    ['C8  entfallene Stapel-Paritaet faellt auf',
      rulesSrc.replace('return parityOk(countRedsInStack(to.piece,mp), player, p1parity);', 'return true;'), 1]
  ];
  for (const [name, src, wantErr] of mut) {
    const e = run(src);
    t(name, wantErr ? e.length > 0 : e.length === 0);
  }
}

// ── Block D · Ausfallverhalten und Vorschaufassung ─────────────────
function blockD() {
  head('D · Ausfallverhalten und Vorschaufassung');
  if (!JSDOM) { console.log('  UEBERSPRUNGEN — jsdom fehlt.'); return; }

  // D1-D3 · Fehlt gembel_rules.js, MUSS dastehen was fehlt. Eine leere Seite ist
  // die schlechteste Fehlermeldung — genau der Befund vom Telefon.
  const ohne = htmlSrc.replace(/<script src="gembel_rules\.js[^>]*><\/script>/, '');
  const dz = new JSDOM(ohne, { runScripts: 'dangerously', pretendToBeVisual: true }).window.document;
  const kasten = dz.getElementById('selftest');
  t('D1  ohne Regelschicht erscheint eine Meldung', kasten.style.display === 'block');
  t('D2  die Meldung nennt gembel_rules.js', /gembel_rules\.js/.test(kasten.textContent));
  t('D3  ohne Regelschicht wird das Brett ausgeblendet',
    dz.getElementById('board-area').style.display === 'none' &&
    dz.getElementById('nav').style.display === 'none');

  // D4-D7 · Die Vorschaufassung (eine Datei, fuers Telefon).
  const vpath = path.join(DIR, 'anleitung_vorschau.html');
  if (!fs.existsSync(vpath)) {
    fail++; console.log('  ROT  D4  anleitung_vorschau.html fehlt — `node bau_vorschau.js` laufen lassen');
    return;
  }
  const vor = fs.readFileSync(vpath, 'utf8');
  const dv = new JSDOM(vor, { runScripts: 'dangerously', pretendToBeVisual: true }).window.document;
  t('D4  Vorschau laeuft ohne Nachbardatei',
    dv.getElementById('selftest').style.display !== 'block' &&
    dv.querySelectorAll('#board .cell').length === 16);
  t('D5  Vorschau ist als solche gekennzeichnet', /Vorschaufassung/.test(vor));
  // Eine veraltete Vorschau ist ein Driftpunkt — sie muss Zeichen fuer Zeichen aus
  // dem aktuellen Paar stammen.
  const vorCode = [...vor.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  t('D6  Vorschau enthaelt die aktuelle Regelschicht',
    vorCode.some(c => c.indexOf(rulesSrc) >= 0));
  t('D7  Vorschau enthaelt den aktuellen Seitencode',
    vorCode.some(c => c === pageCode));
  // Vorsicht: gembel_rules.js nennt im eigenen Kopfkommentar seine Einbindung. Geprueft
  // wird deshalb das Geruest OHNE Skriptinhalte — es darf gar keine externe Quelle geben.
  const geruest = vor.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g, '<script></script>');
  t('D8  Vorschau laedt gar keine externe Datei', !/<script[^>]*\bsrc=/.test(geruest));
}

// ── Lauf ───────────────────────────────────────────────────────────
blockB(skipped => {
  blockC();
  blockD();
  console.log('\n' + '═'.repeat(58));
  console.log('  test_anleitung_137:  ' + pass + ' gruen, ' + fail + ' rot' + (skipped ? '  (Block B uebersprungen)' : ''));
  console.log('═'.repeat(58));
  process.exit(fail ? 1 : 0);
});
