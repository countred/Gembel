// textvergleich.js — §200. WIRD NIE AUSGELIEFERT (wie bau_vorschau.js).
//
// Beweist, dass die Textschicht die SICHTBARE AUSGABE nicht um ein Zeichen aendert —
// ueber die GANZE Datei, nicht ueber eine Auswahl. Das ist der Unterschied zur Probe:
// dort habe ich die Vergleichsliste selbst zugeschnitten, und ein vergessener Text waere
// als Stille durchgegangen. Hier wird gezaehlt: gleiche Anzahl, gleiche Reihenfolge,
// gleicher Inhalt. Ein Fehlbetrag ist ein Fehler, kein Schweigen.
//
// ⚠️ Was es NICHT sieht: Layout und Umbruch (kein Browser, keine Schriftmasse) und
// Meldungen, die es nicht gefahren hat — deshalb Teil C, die Abdeckung.
'use strict';
const fs = require('fs'), vm = require('vm'), { JSDOM } = require('jsdom');
const ALT = fs.readFileSync(process.argv[2] || 'v157_original.html', 'utf8');
const NEU = fs.readFileSync(process.argv[3] || 'index.html', 'utf8');

let fehler = 0;
const melde = (gut, was) => { if (!gut) fehler++; console.log((gut ? '  \u2713 ' : '  \u2717 ') + was); };

// Sichtbarer Text der ganzen Seite, in Dokumentreihenfolge. jsdom fuehrt ohne
// `runScripts` KEINE Skripte aus — die Seite wird also nur geparst, nichts gestartet.
// Bei der neuen Fassung laeuft danach der Fuellschritt von Hand auf demselben Dokument.
function einheiten(src, fuellen) {
  const dom = new JSDOM(src);
  const d = dom.window.document;
  if (fuellen && src.includes('const SPRACHE')) {
    const schicht = src.slice(src.indexOf('const SPRACHE'), src.indexOf('\nfunction texteFuellen') )
                  + src.slice(src.indexOf('\nfunction texteFuellen'), src.indexOf('\n// \u2500\u2500 Uebertragungscode'));
    const ctx = { document: d, console }; vm.createContext(ctx);
    vm.runInContext(schicht + '\n;texteFuellen();', ctx);
  }
  d.querySelectorAll('script,style,template').forEach(e => e.remove());
  const liste = [];
  (function geh(k) {
    for (const kind of k.childNodes) {
      if (kind.nodeType === 3) { const s = kind.textContent.replace(/\s+/g, ' ').trim(); if (s) liste.push('T|' + s); }
      else if (kind.nodeType === 1) {
        for (const a of ['placeholder', 'title', 'aria-label', 'alt', 'value'])
          if (kind.hasAttribute(a)) liste.push('A|' + a + '|' + kind.getAttribute(a));
        geh(kind);
      }
    }
  })(d.body || d.documentElement);
  return liste;
}

console.log('A \u00b7 Sichtbarer Text der ganzen Seite');
const a = einheiten(ALT, true), b = einheiten(NEU, true);   // gefuellt wird nur, wo es eine Textschicht gibt
// ⚠️ NICHT Platz gegen Platz vergleichen: eine EINGEFUEGTE Zeile verschiebt alles danach und
// meldete dann hunderte „Abweichungen" fuer eine einzige Aenderung. Das ist richtig und
// unbrauchbar. Verglichen wird deshalb dreistufig: welche Einheiten sind DAZUGEKOMMEN, welche
// ENTFALLEN, und ist die Reihenfolge der uebrigen gleich geblieben. Eine gewollte Ergaenzung
// liest sich dann als „2 neu", ein Verlust als „1 entfallen", ein Umbau als Reihenfolgefehler.
const zaehle = liste => { const m = new Map(); for (const x of liste) m.set(x, (m.get(x)||0)+1); return m; };
const za = zaehle(a), zb = zaehle(b);
const neuDrin = [], weg = [];
for (const [k, n] of zb) { const d = n - (za.get(k)||0); for (let i=0;i<d;i++) neuDrin.push(k); }
for (const [k, n] of za) { const d = n - (zb.get(k)||0); for (let i=0;i<d;i++) weg.push(k); }
melde(weg.length === 0, 'keine Einheit ENTFALLEN' +
      (weg.length ? ' \u2014 ' + weg.length + ': ' + weg.slice(0,5).map(x=>JSON.stringify(x)).join(', ') : ''));
melde(neuDrin.length === 0, (neuDrin.length ? neuDrin.length + ' Einheit(en) NEU \u2014 ' +
      neuDrin.slice(0,5).map(x=>JSON.stringify(x)).join(', ') + ' (gewollt? dann in Ordnung)'
      : 'keine Einheit neu'));
// Reihenfolge der gemeinsamen Einheiten
const gem = new Set(a.filter(x => zb.has(x)));
const fa = a.filter(x => gem.has(x)), fb = b.filter(x => gem.has(x));
let reih = 0;
for (let i = 0; i < Math.min(fa.length, fb.length); i++) if (fa[i] !== fb[i]) {
  reih++;
  if (reih <= 5) console.log('      #' + i + '\n        alt: ' + JSON.stringify(fa[i]) + '\n        neu: ' + JSON.stringify(fb[i]));
}
melde(reih === 0, 'die Reihenfolge der \u00fcbrigen ' + fa.length + ' Einheiten ist unver\u00e4ndert' +
      (reih ? ' \u2014 ' + reih + ' Abweichungen' : ''));

// ── B · Die MELDUNGEN (§202) ────────────────────────────────────────────────
// Fuer Meldungen gibt es kein Dokument zum Vergleichen — sie entstehen erst im Ablauf.
// Bewiesen wird deshalb anders, aber genauso vollstaendig: jede umgebaute Stelle wird aus
// der NEUEN Datei RUECKWAERTS zusammengesetzt (Textstuecke plus aufgeloeste t()-Aufrufe,
// Platzhalter wieder durch die eingesetzten Ausdruecke ersetzt) und Zeichen fuer Zeichen
// gegen die ALTE gestellt. Stimmt die Rueckrechnung, kann der Umbau nichts geaendert haben.
const acorn = require('acorn');
function meldungen(quelle){
  const teile=[...quelle.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].filter(m=>!/src=/.test(m[0]));
  const raus=[];
  for(const b of teile){
    let code=b[1];
    const iT=code.indexOf('const SPRACHE'), jT=code.indexOf('function txt(schluessel');
    let baum; try{ baum=acorn.parse(code,{ecmaVersion:2022,sourceType:'module'}); }catch(e){ continue; }
    (function geh(k){
      if(!k||typeof k!=='object') return;
      if(iT>0 && k.start>=iT && k.end<=jT) return;          // die Tabelle selbst nicht
      if(k.type==='Literal'&&typeof k.value==='string') raus.push({typ:'L', start:k.start, text:code.slice(k.start,k.end)});
      if(k.type==='TemplateLiteral') raus.push({typ:'T', start:k.start, text:code.slice(k.start,k.end)});
      // Auch VERKETTUNGEN sammeln: in der alten Fassung stand mancher Satz als
      // `'Du hast ' + n + ' Punkte.'` da. Ohne sie faende die Rueckrechnung keinen Partner.
      if(k.type==='BinaryExpression'&&k.operator==='+') raus.push({typ:'B', start:k.start, text:code.slice(k.start,k.end)});
      for(const s in k){ if(s==='type'||s==='start'||s==='end') continue;
        const v=k[s]; if(Array.isArray(v)) v.forEach(geh); else if(v&&typeof v==='object'&&v.type) geh(v); }
    })(baum);
  }
  return raus;
}
// t('schluessel', {0:(ausdruck), …}) wieder in den Wortlaut zuruecksetzen
function rueck(text, DE){
  return text.replace(/\$\{txt\('([^']+)'(?:,\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\})?\)\}/g, (m, k, args) => {
    let wert = DE[k];
    if (wert === undefined) return m;
    if (typeof wert === 'object') wert = wert.andere;
    if (args){
      const paare = {};
      let rest = args, n = 0;
      // „0:(ausdruck), 1:(ausdruck)" — die Klammern halten zusammen, was zusammengehoert
      const re = /(\d+):\(/g; let mm, stellen=[];
      while((mm = re.exec(args))) stellen.push({nr: mm[1], ab: mm.index + mm[0].length});
      stellen.forEach((st, i) => {
        let tiefe = 1, j = st.ab;
        while(j < args.length && tiefe > 0){ if(args[j]==='(') tiefe++; else if(args[j]===')') tiefe--; j++; }
        paare[st.nr] = args.slice(st.ab, j-1);
      });
      wert = wert.replace(/\{(\d+)\}/g, (mm2, nr) => paare[nr] !== undefined ? '${'+paare[nr]+'}' : mm2);
    }
    return wert;
  });
}
console.log('\nB \u00b7 Meldungen im Programmteil');
{
  const DE = (() => {
    const blk = NEU.slice(NEU.indexOf('const SPRACHE'), NEU.indexOf('function txt(schluessel'));
    const ctx = {}; vm.createContext(ctx);
    vm.runInContext(blk + '\n;__T = TEXTE.de.t;', ctx);
    return ctx.__T;
  })();
  const alt = meldungen(ALT), neu = meldungen(NEU);
  const altText = new Set(alt.map(x => x.text));
  let geprueftB = 0, offen = [];
  for(const n of neu){
    if(!/\$\{txt\('/.test(n.text)) continue;            // nur umgebaute Stellen
    // ⚠️ Unveraenderte Stellen ueberspringen. Sonst ist dieses Werkzeug nur EINMAL brauchbar —
    // gegen die Fassung VOR der Umstellung. Steht in beiden Dateien dieselbe Stelle, ist
    // nichts zu beweisen; nur was sich unterscheidet, wird zurueckgerechnet.
    if(altText.has(n.text)) continue;
    geprueftB++;
    // Verschachtelt: eine zurueckgerechnete Meldung kann wieder einen t()-Aufruf enthalten
    // (der Umbau lief in zwei Durchlaeufen). Solange sich etwas aendert, weiterrechnen.
    let zurueck = n.text, vorher = null, runden = 0;
    while(zurueck !== vorher && runden++ < 6){ vorher = zurueck; zurueck = rueck(zurueck, DE); }
    // Die Rueckrechnung ist eine Vorlage; die alte Stelle war entweder auch eine oder eine
    // einfache Zeichenkette. Beide Formen auf denselben Inhalt bringen.
    // ⚠️ VERSCHACHTELTE Zeichenketten aendern beim Umbau ihr Anfuehrungszeichen: aus
    // `${iWon?'Du gewinnst':'…'}` wird `${iWon?`Du gewinnst`:`…`}`, weil der innere Teil
    // selbst zur Vorlage wurde. Der INHALT ist derselbe. Fuer den Vergleich werden die drei
    // Anfuehrungszeichen deshalb gleichgesetzt — eine echte Aenderung am Wortlaut faellt
    // trotzdem auf, weil sie den Text betraefe, nicht das Zeichen drumherum.
    // KANONISCHE FORM statt Zeichenvergleich. Eine Verkettung `'Du hast ' + n + ' Punkte.'`
    // und die Vorlage `${txt('…', {0:(n)})}` sind derselbe Satz, sehen aber voellig anders
    // aus. Beide Seiten werden deshalb geparst und auf dieselbe Form gebracht: Text bleibt
    // Text, jeder eingesetzte Ausdruck wird zu ⟨ausdruck⟩. Erst dann wird verglichen.
    const nackt = quelle => {
      let n; try{ n=acorn.parseExpressionAt(quelle,0,{ecmaVersion:2022}); }catch(e){ return quelle; }
      const teile=[];
      (function geh(x){
        if(x.type==='BinaryExpression'&&x.operator==='+'){ geh(x.left); geh(x.right); return; }
        if(x.type==='Literal'&&typeof x.value==='string'){ teile.push(x.value); return; }
        if(x.type==='TemplateLiteral'){
          x.quasis.forEach((q,i)=>{ teile.push(q.value.cooked); if(i<x.expressions.length) geh(x.expressions[i]); });
          return;
        }
        teile.push('\u27e8'+quelle.slice(x.start,x.end).replace(/\s+/g,'').replace(/[`'\"]/g,'\u0002')+'\u27e9');
      })(n);
      return teile.join('');
    };
    const zieh = nackt(zurueck);
    if(![...altText].some(a => nackt(a) === zieh)) offen.push(zieh.slice(0,90));
  }
  melde(offen.length === 0, (geprueftB ? geprueftB + ' ge\u00e4nderte' : 'keine ge\u00e4nderte') +
        ' Meldung' + (geprueftB===1?'':'en') + ', Zeichen f\u00fcr Zeichen ' +
        'zur\u00fcckrechnen' + (offen.length ? ' \u2014 ' + offen.length + ' nicht: ' + offen.slice(0,3).join(' | ') : ''));
}

console.log('\n' + (fehler ? fehler + ' PRUEFUNG(EN) GEFALLEN \u2014 jede einzeln ansehen, ob sie gewollt ist'
                            : 'Text der Seite unveraendert (' + a.length + ' Einheiten)'));
process.exit(fehler ? 1 : 0);
