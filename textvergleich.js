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
melde(a.length === b.length, 'gleiche Anzahl Einheiten: ' + a.length + ' vorher, ' + b.length + ' nachher');
let abweichungen = 0;
for (let i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) {
    abweichungen++;
    if (abweichungen <= 10) console.log('      #' + i + '\n        alt: ' + JSON.stringify(a[i]) + '\n        neu: ' + JSON.stringify(b[i]));
  }
}
melde(abweichungen === 0, 'jede Einheit zeichengleich und an derselben Stelle' +
      (abweichungen ? ' \u2014 ' + abweichungen + ' Abweichungen' : ''));

console.log('\n' + (fehler ? fehler + ' PRUEFUNG(EN) GEFALLEN' : 'Text der Seite unveraendert (' + a.length + ' Einheiten)'));
process.exit(fehler ? 1 : 0);
