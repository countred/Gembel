// ═══════════════════════════════════════════════════════════════════
// bau_vorschau.js — erzeugt anleitung_vorschau.html
// ═══════════════════════════════════════════════════════════════════
// Die Vorschaufassung ist eine EINZELNE Datei: gembel_rules.js ist hineinkopiert,
// damit sie sich auf dem Telefon oeffnen laesst, wo eine heruntergeladene HTML-Datei
// ihre Nachbardatei nicht holen kann.
//
// ⚠️ SIE WIRD NIE AUSGELIEFERT und NIE VON HAND BEARBEITET. Sie ist ein Erzeugnis
//    aus anleitung.html + gembel_rules.js und wird nach jeder Aenderung neu gebaut.
//    Ausgeliefert wird das Paar, nicht die Vorschau — sonst haette countred.com zwei
//    Regelquellen, und genau das ist der Driftfall, den die Anleitung vermeiden soll.
// ═══════════════════════════════════════════════════════════════════
const fs=require('fs');
const D=__dirname;
const rules=fs.readFileSync(D+'/gembel_rules.js','utf8');
const html=fs.readFileSync(D+'/anleitung.html','utf8');

const tag=/<script src="gembel_rules\.js[^>]*><\/script>/;
if(!tag.test(html)){ console.error('FEHLER: die Einbindung von gembel_rules.js ist in anleitung.html nicht auffindbar.'); process.exit(1); }

const banner=`
<div style="max-width:460px;margin:0 auto 10px;padding:9px 12px;border-radius:12px;
     border:1px solid #ba7517;background:#faeeda;color:#7a4c0a;font:500 12px/1.5 system-ui;">
  <b>Vorschaufassung.</b> Einzelne Datei zum Ansehen auf dem Telefon — die Regelschicht ist
  hier hineinkopiert. Ausgeliefert wird <b>anleitung.html</b> zusammen mit
  <b>gembel_rules.js</b>, nicht diese Datei.
</div>`;

let out = html
  .replace(tag, '<script>\n/* ── HINEINKOPIERT aus gembel_rules.js — NICHT hier bearbeiten ── */\n'+rules+'\n</script>')
  .replace('<div id="app">', banner+'\n<div id="app">')
  .replace('<title>Count Red · Anleitung</title>', '<title>Count Red · Anleitung (Vorschau)</title>');

fs.writeFileSync(D+'/anleitung_vorschau.html', out);
console.log('geschrieben: anleitung_vorschau.html — '+out.length+' Zeichen (eine Datei, keine Nachbardatei noetig)');
