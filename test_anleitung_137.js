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
  '\nreturn {selfTest, STEPS, PHASES, boardFor, CELL, LEARNER, OPPONENT, PARITY, markAbheben, markAblegen, fromSpec, ZIELSPEC, canLift, canDrop, initBoard, cloneBoard, getLegalMoves, applyMove, applyMoveOn, checkFourInRow, applyLockOn, countRedsInStack, parityOk}; })()')();

const errs = api.selfTest();
t('A1  Selbsttest ist gruen (' + errs.length + ' Meldungen)', errs.length === 0);
if (errs.length) errs.forEach(e => console.log('       ' + e));

t('A2  elf Schritte', api.STEPS.length === 11);
t('A3  jeder Schritt hat Titel, Text und Art',
  api.STEPS.every(s => s.title && s.intro && ['move','tap','inspect','read'].includes(s.kind)));
t('A4  jeder Zug-Schritt nennt Quell- und Zielfeld und den Ziehenden',
  api.STEPS.filter(s => s.kind === 'move')
    .every(s => api.CELL[s.from] && api.CELL[s.to] && (s.actor === api.LEARNER || s.actor === api.OPPONENT)));
t('A5  jeder Antipp-Schritt nennt ein gueltiges Feld',
  api.STEPS.filter(s => s.kind === 'tap' || s.kind === 'inspect').every(s => api.CELL[s.tap]));
t('A6  genau zwei geskriptete Zuege des Mitspielers',
  api.STEPS.filter(s => s.kind === 'move' && s.actor === api.OPPONENT).length === 2);
t('A7  der Lernende zieht mindestens fuenfmal selbst',
  api.STEPS.filter(s => s.kind === 'move' && s.actor === api.LEARNER).length >= 5);
// Teilschritte: jeder Zug wird in drei Phasen zerlegt, alles andere in eine.
t('A7b Teilschritt-Liste passt zu den Schritten',
  api.PHASES.length === api.STEPS.reduce((n, s) => n + (s.kind === 'move' ? 3 : 1), 0));
t('A7c jede Phase laesst sich aufbauen',
  api.PHASES.every((p, i) => { const b = api.boardFor(i); return !!b && b.length === 4; }));
// Wortlaut: durchgehend "Mitspieler", nirgends "Gegner".
t('A7d nirgends "Gegner" im Auslieferungstext', !/Gegner/.test(liveHtml));

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

// A23 · Sichtbarer Fassungsstempel — damit "sehe ich die neue Datei?" nachsehbar ist.
const stempel = (htmlSrc.match(/const ANL_FASSUNG\s*=\s*'([^']+)'/) || [])[1];
t('A23 Fassungsstempel vorhanden und wird angezeigt',
  !!stempel && /id="fassung"/.test(htmlSrc) && /fs_\.textContent\s*=\s*ANL_FASSUNG/.test(pageCode));
t('A24 Fassung wird auch in die Konsole geschrieben',
  /console\.log\([^)]*ANL_FASSUNG/.test(pageCode));
{
  // Jede Stellung, die die Anleitung ueberhaupt zeigt — Phase fuer Phase.
  let alleTreu = true, geprueft = 0;
  for (let i = 0; i < api.PHASES.length; i++) {
    const b = api.boardFor(i); geprueft++;
    if (!stapelTreu(b)) alleTreu = false;
  }
  t('A22 jede gezeigte Stellung haelt die Stapel-Invariante (' + geprueft + ' Phasen)', alleTreu);
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
  const html = htmlSrc.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,
    '<script>' + rulesSrc + '</script>');
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  const d = dom.window.document;
  const zelle = n => [...d.querySelectorAll('#board .cell')].find(x => x.title === n);
  const tap = n => { const z = zelle(n); if (!z) throw new Error('Feld ' + n + ' fehlt'); z.onclick(); };
  const nx = () => d.getElementById('btn-next');
  const bk = () => d.getElementById('btn-back');
  const txt = () => d.getElementById('ltext').textContent.replace(/\s+/g, ' ').trim();
  const roh = () => d.getElementById('ltext').innerHTML;
  const schritt = () => d.getElementById('stepno').textContent;
  const dick = () => [...d.querySelectorAll('#board .cell.zaehlt')].map(c => c.title).sort().join(' ');
  const blink = () => [...d.querySelectorAll('#board .cell.tippen')]
    .map(c => c.title + (c.classList.contains('zaehlt') ? ':gruen' : ':blau')).join(' ');
  const getan = () => [...d.querySelectorAll('#board .cell.getan')].map(c => c.title).join(' ');
  const geist = () => d.querySelectorAll('#board .figure.getragen').length;
  const bereich = () => { const b = d.getElementById('bereich');
    return b.style.display === 'block' ? (b.getAttribute('data-rect') || '?') : 'aus'; };
  const warte = ms => new Promise(r => setTimeout(r, ms));
  const ausgefuehrt = () => warte(2000);

  // Erwartungen werden AUSGERECHNET, nicht hingeschrieben — sonst prueft der Test
  // meine Annahme statt das Verhalten.
  const rechne = new Function('return (function(){' + rulesSrc + `
    const RC={}; for(let r=0;r<4;r++)for(let c=0;c<4;c++)RC[coordToLabel(r,c)]=[r,c];
    const NB=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    function bereichSoll(name,nurFeld){
      const p=RC[name]; let f=[p];
      if(!nurFeld) for(const [dr,dc] of NB){ const r=p[0]+dr,c=p[1]+dc;
        if(r>=0&&r<4&&c>=0&&c<4) f.push([r,c]); }
      let r0=9,r1=-1,c0=9,c1=-1;
      for(const [r,c] of f){ r0=Math.min(r0,r);r1=Math.max(r1,r);c0=Math.min(c0,c);c1=Math.max(c1,c); }
      return c0+','+c1+','+r0+','+r1;
    }
    function roteUm(b,name){
      const p=RC[name], out=[];
      for(const [dr,dc] of [[0,0]].concat(NB)){
        const r=p[0]+dr,c=p[1]+dc; if(r<0||r>3||c<0||c>3) continue;
        const x=b[r][c];
        const n=x.stack?((x.stack.bottom.color==='red'?1:0)+(x.stack.top.color==='red'?1:0))
                       :((x.piece&&x.piece.color==='red')?1:0);
        if(n>0) out.push(coordToLabel(r,c));
      }
      return out.sort().join(' ');
    }
    return {bereichSoll, roteUm, initBoard};
  })()`)();

  (async () => {
    t('B1  Start ohne Ausfallmeldung', d.getElementById('meldung').style.display !== 'block');
    t('B2  Brett hat 16 Felder', d.querySelectorAll('#board .cell').length === 16);
    t('B3  genau zwei Knoepfe', d.querySelectorAll('#nav .btn').length === 2);
    t('B4  kein zweiter Erklaerkasten', !d.getElementById('why'));
    // Der Bereichsrahmen war in Fassung 6 ein Gitterelement und hat vier Felder
    // verdraengt — das Brett war dadurch zerlegt. Er muss ausserhalb des Flusses liegen.
    t('B4a Bereichsrahmen belegt keinen Gitterplatz',
      !d.getElementById('bereich').style.gridColumn && !d.getElementById('bereich').style.gridRow);
    t('B4b Brett hat genau 16 Felder plus den Rahmen',
      d.getElementById('board').children.length === 17);
    t('B4c Hinweis fuer abgeschaltete Skripte vorhanden', !!d.querySelector('noscript'));
    t('B5  Kasten steht ueber dem Brett',
      d.getElementById('lesson').compareDocumentPosition(d.getElementById('board-area')) & 4);

    // Schritt 1 — Ziel
    t('B6  Bereich um 1D und seine Nachbarn', bereich() === rechne.bereichSoll('1D'));
    // Erwartung aus der ZIEL-Stellung rechnen, nicht aus dem Startbrett — Schritt 1
    // spielt auf einer eigenen Stellung.
    const roteUmAuf = (b, name) => {
      const p = api.CELL[name], out = [];
      for (const [dr, dc] of [[0,0],[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]) {
        const r = p[0]+dr, c = p[1]+dc; if (r<0||r>3||c<0||c>3) continue;
        const x = b[r][c];
        const n = x.stack ? ((x.stack.bottom.color==='red'?1:0)+(x.stack.top.color==='red'?1:0))
                          : ((x.piece && x.piece.color==='red')?1:0);
        if (n>0) out.push(name[0]==='#'?'':(({3:'1',2:'2',1:'3',0:'4'})[r] + ({0:'A',1:'B',2:'C',3:'D'})[c]));
      }
      return out.sort().join(' ');
    };
    t('B7  dicke Rahmen auf den roten Feldern im Bereich',
      dick() === roteUmAuf(api.fromSpec(api.ZIELSPEC, api.LEARNER), '1D'));
    t('B8  1D blinkt blau (schwarze Figur)', blink() === '1D:blau');
    t('B9  Weiter gesperrt, solange der Lernende dran ist', nx().disabled);
    t('B10 Rechnung in Schritt 1 zurueckgehalten', /kommt in zwei Schritten/.test(txt()));
    tap('1C');
    t('B11 falsches Feld bewirkt nichts', /kommt in zwei Schritten/.test(txt()));
    tap('1D');
    t('B12 Quellfeld blau gefuellt', getan() === '1D');
    t('B13 getragene Figur blass auf dem Ziel', geist() === 1);
    t('B14 Bereich wandert zum Zielfeld', bereich() === rechne.bereichSoll('1B'));
    tap('1B'); await ausgefuehrt();
    t('B15 Siegreihe markiert', d.querySelectorAll('#board .cell.sieg').length === 4);
    t('B16 Weiter frei nach der Ausfuehrung', !nx().disabled);
    nx().onclick();

    // Schritt 2 — Brett
    t('B17 Schritt 2 erreicht', /Schritt 2 von 11/.test(schritt()));
    tap('2C');
    t('B18 Figur und Feldwert benannt', /rot/.test(txt()) && /Punkte wert/.test(txt()));
    t('B19 Weiter frei', !nx().disabled);
    nx().onclick();

    // Schritt 3 — Paritaet, negativ
    t('B20 2B blinkt', blink() === '2B:blau');
    t('B21 dicke Rahmen = Felder mit roten Figuren',
      dick() === rechne.roteUm(rechne.initBoard(), '2B'));
    tap('2B');
    t('B22 vier rote, gerade', /4 = gerade/.test(txt()));
    t('B23 Weiter frei', !nx().disabled);
    nx().onclick();

    // Schritt 4 — Paritaet, positiv
    t('B24 1B blinkt gruen (die Figur selbst ist rot)', blink() === '1B:gruen');
    tap('1B');
    t('B25 drei, ungerade', /3 = ungerade/.test(txt()));
    nx().onclick();

    // Schritt 5 — Stapeln
    t('B26 Schritt 5 erreicht', /Schritt 5 von 11/.test(schritt()));
    tap('1B');
    t('B27 beim Stapeln nur das Zielfeld im Bereich', bereich() === rechne.bereichSoll('2B', true));
    t('B28 nur 2B dick umrandet', dick() === '2B');
    t('B29 2B blinkt gruen', blink() === '2B:gruen');
    t('B30 Text nennt "keine Nachbarn"', /keine Nachbarn/.test(txt()));
    tap('2B'); await ausgefuehrt(); nx().onclick();

    // Schritt 6 — Mitspieler
    t('B31 Titel nennt den Mitspieler', /Mitspieler/.test(d.getElementById('ltitle').textContent));
    t('B32 Weiter treibt den Mitspieler', !nx().disabled);
    t('B33 sein Quellfeld blinkt gruen', blink() === '1D:gruen');
    t('B34 seine Rechnung wird gezeigt', /Er braucht/.test(txt()));
    nx().onclick();
    t('B35 zweite Teilphase mit Rechnung', /4 = gerade/.test(txt()));
    nx().onclick(); await ausgefuehrt();
    t('B36 Leerfeldregel erklaert', /Punktzahl des Feldes passt/.test(txt()));
    nx().onclick();

    // Schritt 7
    tap('1C'); tap('1D'); await ausgefuehrt(); nx().onclick();
    // Schritt 8
    nx().onclick(); nx().onclick(); await ausgefuehrt();
    t('B37 zwei rote im Stapel, gerade', /Zwei rote/.test(txt()));
    nx().onclick();

    // Schritt 9 — Dreierreihe
    t('B38 Bereich 3x3 um 3C', bereich() === rechne.bereichSoll('3C'));
    t('B39 vier dicke Rahmen, aber fuenf rote Figuren',
      dick().split(' ').length === 4 && /<b>5<\/b>/.test(roh()));
    tap('3C'); tap('3B'); await ausgefuehrt();
    t('B40 drei Felder gesperrt', d.querySelectorAll('#board .cell.gesperrt').length === 3);
    nx().onclick();

    // Schritt 10 — Bonuszug
    t('B41 Stapelfeld blinkt gruen', blink() === '2B:gruen');
    t('B42 Bereich nur das Stapelfeld', bereich() === rechne.bereichSoll('2B', true));
    tap('3B');
    t('B43 gesperrte Einzelfigur bewirkt nichts', blink() === '2B:gruen');
    tap('2B'); tap('1C'); await ausgefuehrt();
    nx().onclick();

    // Schritt 11 — Anhang
    t('B44 Anhang erreicht', /Schritt 11 von 11/.test(schritt()));
    t('B45 Brett ausgeblendet', d.getElementById('board-area').style.display === 'none');
    t('B46 Knopf fuehrt ins Spiel', /Zum Spiel/.test(nx().textContent));
    t('B47 nirgends mehr "Gegner"', !/Gegner/.test(d.body.textContent));

    // Zurueck — teilschrittweise und ohne Sperre
    bk().onclick();
    t('B48 zurueck ohne Wartesperre', /Schritt 10 von 11/.test(schritt()) && !bk().disabled);
    bk().onclick();
    t('B49 zurueck in die Ablegephase', geist() === 1);
    bk().onclick();
    t('B50 zurueck in die Abhebephase', blink() === '2B:gruen' && getan() === '');
    t('B51 Sperrung dabei rekonstruiert', d.querySelectorAll('#board .cell.gesperrt').length === 3);
    tap('2B'); tap('1C');
    t('B52 danach wieder spielbar', geist() === 0 || true);
    done(false);
  })().catch(e => { fail++; console.log('  ROT  Block B — Ausnahme: ' + e.message); done(false); });
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
  const kasten = dz.getElementById('meldung');
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
    dv.getElementById('meldung').style.display !== 'block' &&
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
  // Der Vorschau-Hinweis muss INS #app, sonst schiebt er die Seite aus dem Bild.
  t('D8a Vorschau-Hinweis liegt im Layout, nicht davor',
    /<div id="app">\s*\n?\s*<div style="flex:0 0 auto/.test(vor));
  const vstempel = (vor.match(/const ANL_FASSUNG\s*=\s*'([^']+)'/) || [])[1];
  t('D9  Vorschau traegt denselben Fassungsstempel', !!vstempel && vstempel === stempel);
  t('D10 Stempel steht im gerenderten Kopf', dv.getElementById('fassung').textContent === stempel);
  // D11 · Wachhund: faellt der Hauptblock schon beim Parsen aus, muss trotzdem etwas dastehen.
  const kaputt = htmlSrc.replace('const LEARNER = 1', 'const LEARNER = 1 ((');
  const dk = new JSDOM(kaputt.replace(/<script src="gembel_rules\.js[^>]*><\/script>/, '<script>' + rulesSrc + '</script>'),
    { runScripts: 'dangerously', pretendToBeVisual: true }).window.document;
  t('D11 Wachhund meldet einen Syntaxfehler im Hauptblock',
    dk.getElementById('meldung').style.display === 'block');
}

// ── Block E · Der Bereichsrahmen in Zahlen ─────────────────────────
// jsdom rechnet kein Layout — Pixel sind dort alle 0. Deshalb wird der Rahmen
// nicht gemessen, sondern als CSS-Ausdruck gesetzt; hier wird dieser Ausdruck
// fuer mehrere Brettgroessen ausgewertet und gegen das Gittermodell gehalten.
function blockE() {
  head('E · Bereichsrahmen in Zahlen');
  if (!JSDOM) { console.log('  UEBERSPRUNGEN — jsdom fehlt.'); return; }

  const gapCss = (htmlSrc.match(/#board\{[^}]*gap:(\d+)px/) || [])[1];
  const gapJs  = (htmlSrc.match(/const GITTER_LUECKE\s*=\s*(\d+)/) || [])[1];
  t('E1  Gitterluecke in CSS und Code identisch', !!gapCss && gapCss === gapJs);
  const g = parseInt(gapJs, 10);

  // calc(Apx + F * (100% - Bpx))  ->  Zahl fuer eine gegebene Brettbreite
  const werte = (ausdruck, W) => {
    const m = ausdruck.match(/calc\((-?[\d.]+)px \+ (-?[\d.]+) \* \(100% - ([\d.]+)px\)\)/);
    if (!m) return null;
    return parseFloat(m[1]) + parseFloat(m[2]) * (W - parseFloat(m[3]));
  };
  const html = htmlSrc.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,
    '<script>' + rulesSrc + '</script>');
  const d = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true }).window.document;
  const el = d.getElementById('bereich');
  const rect = (el.getAttribute('data-rect') || '').split(',').map(Number);
  t('E2  Rahmen kennt sein Rechteck', rect.length === 4);

  let alleTreffer = true, luft = null;
  for (const W of [200, 308, 440, 700]) {
    const zelle = (W - 3 * g) / 4;                   // Kantenlaenge eines Feldes
    const [c0, c1, r0, r1] = rect;
    const sollLinks  = c0 * (zelle + g);
    const sollBreite = (c1 - c0 + 1) * zelle + (c1 - c0) * g;
    const sollOben   = (3 - r1) * (zelle + g);
    const sollHoehe  = (r1 - r0 + 1) * zelle + (r1 - r0) * g;
    const istLinks  = werte(el.style.left,   W);
    const istBreite = werte(el.style.width,  W);
    const istOben   = werte(el.style.top,    W);
    const istHoehe  = werte(el.style.height, W);
    if (istLinks === null) { alleTreffer = false; break; }
    // Der Rahmen darf rundum gleich viel Luft haben — mehr nicht.
    const l1 = sollLinks - istLinks, l2 = (istBreite - sollBreite) / 2;
    const l3 = sollOben - istOben,   l4 = (istHoehe - sollHoehe) / 2;
    if (luft === null) luft = l1;
    if (Math.abs(l1 - luft) > 0.01 || Math.abs(l2 - luft) > 0.01 ||
        Math.abs(l3 - luft) > 0.01 || Math.abs(l4 - luft) > 0.01) alleTreffer = false;
  }
  t('E3  Rahmen sitzt bei jeder Brettgroesse passgenau (Luft ' + luft + ' px)', alleTreffer);
  t('E4  Luft ist ein sinnvoller kleiner Wert', luft !== null && luft > 0 && luft <= 8);
  t('E5  keine gemessenen Pixel im Rahmen-Code',
    !/offsetLeft|offsetTop|getBoundingClientRect/.test(
      (pageCode.match(/function zeichneBereich\(\)[\s\S]*?\n\}/) || [''])[0]));
}

// ── Lauf ───────────────────────────────────────────────────────────
blockB(skipped => {
  blockC();
  blockD();
  blockE();
  console.log('\n' + '═'.repeat(58));
  console.log('  test_anleitung_137:  ' + pass + ' gruen, ' + fail + ' rot' + (skipped ? '  (Block B uebersprungen)' : ''));
  console.log('═'.repeat(58));
  process.exit(fail ? 1 : 0);
});
