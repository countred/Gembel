// Sammelt ALLE Texte, die ein Lernender in anleitung.html zu sehen bekommt —
// durch Bedienen der Seite, nicht durch Abschreiben. Damit kann die Textfassung
// nicht von der Auslieferung abweichen.
//
// Fassung 11: die Teilschritte werden nicht mehr von Hand aufgezaehlt, sondern
// aus PHASES gelesen und generisch bedient. Ein neuer Schritt in anleitung.html
// landet dadurch automatisch in ANLEITUNG_TEXTE.md — vorher musste man diese
// Datei mitpflegen und konnte es vergessen.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const D=__dirname;
const rules=fs.readFileSync(D+'/gembel_rules.js','utf8');
const htmlSrc=fs.readFileSync(D+'/anleitung.html','utf8');
const html=htmlSrc.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,'<script>'+rules+'</script>');

// Modell ohne DOM laden — daraus kommt die Phasenliste.
const code=[...htmlSrc.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).pop();
const M=new Function('window','document','console',
  'return (function(){'+rules+'\n'+code+'\nreturn {PHASES,STEPS};})()')(
  {addEventListener(){}},{getElementById:()=>null,addEventListener(){}},{log(){},error(){}});

const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const d=dom.window.document;
const zelle=n=>[...d.querySelectorAll('#board .cell')].find(x=>x.title===n);
const nx=()=>d.getElementById('btn-next');
const warte=ms=>new Promise(r=>setTimeout(r,ms));

function plain(h){
  return String(h)
    .replace(/<div class="rechnung">/gi,'\n@@RECHNUNG@@')
    .replace(/<div class="aufgabe">/gi,'\n@@AUFGABE@@')
    .replace(/<br\s*\/?>/gi,'\n').replace(/<\/(p|div)>/gi,'\n\n')
    .replace(/<b>|<strong>/gi,'**').replace(/<\/b>|<\/strong>/gi,'**')
    .replace(/<i>|<em>/gi,'_').replace(/<\/i>|<\/em>/gi,'_')
    .replace(/<[^>]+>/g,'')
    .replace(/&middot;/g,'·').replace(/&rarr;/g,'→').replace(/&nbsp;/g,' ')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
    .replace(/[ \t]{2,}/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n')
    .replace(/\n{3,}/g,'\n\n').trim();
}
const out=[];
function schnappschuss(marke){
  const titel=d.getElementById('ltitle').textContent;
  const nr=d.getElementById('stepno').textContent;
  const roh=plain(d.getElementById('ltext').innerHTML);
  const teile=roh.split(/@@(RECHNUNG|AUFGABE)@@/);
  let erz=teile[0].trim(), rech='', auf='';
  for(let i=1;i<teile.length;i+=2){
    if(teile[i]==='RECHNUNG') rech=teile[i+1].trim(); else auf=teile[i+1].trim();
  }
  // Auf reinen Textseiten ist das Brett ausgeblendet — die Zellen stehen zwar noch
  // im DOM, gehoeren aber nicht ins Protokoll.
  const ohneBrett=d.getElementById('board-area').style.display==='none';
  const dick=ohneBrett?[]:[...d.querySelectorAll('#board .cell.zaehlt')].map(c=>c.title).sort();
  const blink=ohneBrett?[]:[...d.querySelectorAll('#board .cell.tippen')]
    .map(c=>c.title+(c.classList.contains('zaehlt')?' (grün)':' (blau)'));
  const getan=ohneBrett?[]:[...d.querySelectorAll('#board .cell.getan')].map(c=>c.title);
  const sieg =ohneBrett?[]:[...d.querySelectorAll('#board .cell.sieg')].map(c=>c.title);
  const sperr=ohneBrett?[]:[...d.querySelectorAll('#board .cell.gesperrt')].map(c=>c.title).sort();
  out.push({nr,titel,marke,erz,rech,auf,dick,blink,getan,sieg,sperr});
}

const MARKE={lesen:'lesen', zeigen:'zeigen', tap:'antippen', lift:'anheben', drop:'absetzen',
             fail:'abgelehnt', exec:'ausgeführt'};

(async()=>{
  await warte(60);
  if(d.getElementById('meldung').style.display==='block'){
    console.error('AUSFALL: '+d.getElementById('meldung').textContent.slice(0,200)); process.exit(1);
  }
  const langsam=3000;
  for(let i=0;i<M.PHASES.length;i++){
    const ph=M.PHASES[i], s=M.STEPS[ph.si], a=s.aktionen[ph.ai];
    // Bei 'exec' erst NACH der Animation schauen — davor stuende die Stellung
    // vor dem Zug im Protokoll, und der Teilschritt kaeme doppelt vor.
    if(ph.p!=='exec') schnappschuss(MARKE[ph.p]);
    if(ph.p==='tap'){
      zelle(a.feld).onclick(); schnappschuss('erklärt'); nx().onclick();
    } else if(ph.p==='lift'){
      if(a.actor===1) zelle(a.von).onclick(); else nx().onclick();
    } else if(ph.p==='drop'){
      if(a.actor===1) zelle(a.nach).onclick(); else nx().onclick();
    } else if(ph.p==='fail'){
      zelle(a.nach).onclick(); schnappschuss('erklärt'); nx().onclick();
    } else if(ph.p==='exec'){
      await warte(langsam); schnappschuss('ausgeführt');
      if(i<M.PHASES.length-1) nx().onclick();
    } else if(ph.p==='lesen' || ph.p==='zeigen'){
      if(i<M.PHASES.length-1) nx().onclick();
    }
    await warte(5);
  }
  schreibe();
})().catch(e=>{ console.error('AUSNAHME:',e.message); process.exit(1); });

function schreibe(){
  const fassung=(htmlSrc.match(/const ANL_FASSUNG\s*=\s*'([^']+)'/)||[])[1];
  const L=[];
  L.push('# Count Red — Interaktive Spielanleitung: alle Texte','');
  L.push('**Quelle: `anleitung.html` · '+fassung+'**','');
  L.push('> Diese Datei ist **erzeugt**, nicht abgeschrieben: ein Skript bedient `anleitung.html`');
  L.push('> im DOM und fängt jeden Text ab, den ein Lernender wirklich zu sehen bekommt — samt');
  L.push('> der Markierungen, die dabei auf dem Brett stehen.','>');
  L.push('> **Änderungen gehören in `anleitung.html`, nicht hierher.** Danach `node texte.js` laufen lassen.','');
  L.push('---','','## Aufbau','');
  L.push('Neun Schritte. Ein eigener Zug ist in **drei Teilschritte** zerlegt — anheben, absetzen,');
  L.push('ausführen. Der Lernende ist durchgehend **Spieler 1 mit ungerader Parität**;');
  L.push('Schritt 9 sagt ausdrücklich, dass es im Spiel gespiegelt sein kann.','');
  L.push('Der Mitspieler zieht nur zweimal: am Ende von Schritt 5, damit ein leeres Feld entsteht,');
  L.push('und am Ende von Schritt 8, wo er den unklugen Bonuszug bestraft. Beide Male läuft');
  L.push('sein Zug **langsamer** ab — und auf **einen** Weiter-Druck, nicht in Teilschritten.','');
  L.push('Im Kasten über dem Brett stehen bis zu drei Textsorten:','');
  L.push('| Sorte | wozu |','|---|---|');
  L.push('| **Erklärung** | führt den Schritt oder die Aktion ein |');
  L.push('| **Rechnung** | grün abgesetzt: was gezählt wird und was herauskommt |');
  L.push('| **Aufgabe** | blau: was jetzt zu tun ist |','');
  L.push('Die Markierungen auf dem Brett sind mit aufgeführt:','');
  L.push('| Markierung | Bedeutung |','|---|---|');
  L.push('| dünner grüner Rahmen | der Bereich, in dem gerechnet wird |');
  L.push('| **dick** | auf diesem Feld stehen (oder landen) zählende rote Figuren |');
  L.push('| **blinkt** | hier handeln — grün, wenn das Feld selbst zählende rote trägt, sonst blau |');
  L.push('| **blau** | hier ist gehandelt worden |');
  L.push('| **gesperrt** | Feld eines Dreiers (oranger Rahmen) |');
  L.push('| **Sieg** | die vier Felder der Siegspalte |','');
  L.push('In den Schritten 1 und 2 sowie bei den Zügen des Mitspielers fehlen die grünen');
  L.push('Markierungen bewusst: dort wird noch nichts gerechnet.','');
  L.push('---','','## Die Teilschritte','');
  let letzte='';
  for(const s of out){
    if(s.nr!==letzte){ L.push('','### '+s.nr+' — '+s.titel,''); letzte=s.nr; }
    L.push('**·  '+s.marke+'**','');
    if(s.erz){ L.push(s.erz.split('\n').map(x=>x?'> '+x:'>').join('\n'),''); }
    if(s.rech){ L.push('*Rechnung:*  '+s.rech.replace(/\n/g,' '),''); }
    if(s.auf){ L.push('*Aufgabe:*  `'+s.auf.replace(/\n/g,' ')+'`',''); }
    const m=[];
    if(s.dick.length)  m.push('dick: '+s.dick.join(', '));
    if(s.blink.length) m.push('blinkt: '+s.blink.join(', '));
    if(s.getan.length) m.push('blau: '+s.getan.join(', '));
    if(s.sperr.length) m.push('gesperrt: '+s.sperr.join(', '));
    if(s.sieg.length)  m.push('Sieg: '+s.sieg.join(', '));
    if(m.length) L.push('*Brett:*  '+m.join(' · '),'');
  }
  L.push('---','','## Bedienelemente','');
  L.push('| Element | Text |','|---|---|');
  L.push('| Kopfzeile links | `COUNT · RED` |');
  L.push('| Kopfzeile rechts | `Schritt N von 9` |');
  L.push('| unter dem Fortschrittsbalken | `'+fassung+'` |');
  L.push('| Knopf links | `Zurück` — einen Teilschritt zurück |');
  L.push('| Knopf rechts | `Weiter` — einen Teilschritt vor; im letzten Schritt `Zum Spiel` |','');
  L.push('Im Schritt des Lernenden ist **Weiter gesperrt**, bis er getippt hat. Beim Mitspieler');
  L.push('treibt **Weiter** die Teilschritte.','');
  L.push('## Meldungen, die hoffentlich nie erscheinen','');
  L.push('> **Die Regelschicht fehlt.** Diese Anleitung braucht **gembel_rules.js** … im **selben Ordner** wie diese Seite.','');
  L.push('> **Selbsttest fehlgeschlagen.** Diese Anleitung stimmt nicht mit der Regelschicht überein und wird deshalb nicht angezeigt: …','');
  L.push('> **Die Anleitung stoppt hier.** Erklärung und Regelschicht stimmen nicht überein (…). Das ist ein Fehler in der Anleitung, nicht im Spiel.','');
  L.push('> **Die Anleitung konnte nicht starten.** / **Die Anleitung ist nicht gestartet.** — vom Wachhund, wenn der Programmteil gar nicht läuft.','');
  const md=L.join('\n')+'\n';
  fs.writeFileSync(D+'/ANLEITUNG_TEXTE.md',md);
  console.log('geschrieben: ANLEITUNG_TEXTE.md — '+md.split('\n').length+' Zeilen, '+out.length+' Teilschritte erfasst');
}
