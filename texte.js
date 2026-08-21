// Sammelt ALLE Texte, die ein Lernender in anleitung.html zu sehen bekommt —
// durch Bedienen der Seite, nicht durch Abschreiben. Damit kann die Textfassung
// nicht von der Auslieferung abweichen.
const fs=require('fs'); const {JSDOM}=require('jsdom');
const D=__dirname;
const rules=fs.readFileSync(D+'/gembel_rules.js','utf8');
const htmlSrc=fs.readFileSync(D+'/anleitung.html','utf8');
const html=htmlSrc.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,'<script>'+rules+'</script>');
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const d=dom.window.document;
const zelle=n=>[...d.querySelectorAll('#board .cell')].find(x=>x.title===n);
const tap=n=>zelle(n).onclick();
const nx=()=>d.getElementById('btn-next');
const warte=ms=>new Promise(r=>setTimeout(r,ms));
const nachZug=()=>warte(2000);

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
  const dick=[...d.querySelectorAll('#board .cell.zaehlt')].map(c=>c.title).sort();
  const blink=[...d.querySelectorAll('#board .cell.tippen')]
    .map(c=>c.title+(c.classList.contains('zaehlt')?' (grün)':' (blau)'));
  const getan=[...d.querySelectorAll('#board .cell.getan')].map(c=>c.title);
  out.push({nr,titel,marke,erz,rech,auf,dick,blink,getan});
}

(async()=>{
  // Schritt 1
  schnappschuss('abheben'); tap('1D');
  schnappschuss('ablegen'); tap('1B'); await nachZug();
  schnappschuss('ausgeführt'); nx().onclick();
  // Schritt 2
  schnappschuss('Aufgabe'); tap('2C'); schnappschuss('angesehen'); nx().onclick();
  // Schritt 3
  schnappschuss('Aufgabe'); tap('2B'); schnappschuss('angetippt'); nx().onclick();
  // Schritt 4
  schnappschuss('Aufgabe'); tap('1B'); schnappschuss('angetippt'); nx().onclick();
  // Schritt 5
  schnappschuss('abheben'); tap('1B'); schnappschuss('ablegen'); tap('2B'); await nachZug();
  schnappschuss('ausgeführt'); nx().onclick();
  // Schritt 6 (Mitspieler)
  schnappschuss('abheben'); nx().onclick(); schnappschuss('ablegen'); nx().onclick(); await nachZug();
  schnappschuss('ausgeführt'); nx().onclick();
  // Schritt 7
  schnappschuss('abheben'); tap('1C'); schnappschuss('ablegen'); tap('1D'); await nachZug();
  schnappschuss('ausgeführt'); nx().onclick();
  // Schritt 8 (Mitspieler)
  schnappschuss('abheben'); nx().onclick(); schnappschuss('ablegen'); nx().onclick(); await nachZug();
  schnappschuss('ausgeführt'); nx().onclick();
  // Schritt 9
  schnappschuss('abheben'); tap('3C'); schnappschuss('ablegen'); tap('3B'); await nachZug();
  schnappschuss('ausgeführt'); nx().onclick();
  // Schritt 10
  schnappschuss('abheben'); tap('2B'); schnappschuss('ablegen'); tap('1C'); await nachZug();
  schnappschuss('ausgeführt'); nx().onclick();
  // Schritt 11
  schnappschuss('Anhang');
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
  L.push('Elf Schritte. Jeder Zug ist in **drei Teilschritte** zerlegt — abheben, ablegen, ausführen —');
  L.push('und wird einzeln dargestellt, auch beim Mitspieler. Der Lernende ist durchgehend');
  L.push('**Spieler 1 mit ungerader Parität**; Schritt 11 sagt ausdrücklich, dass es im Spiel');
  L.push('gespiegelt sein kann.','');
  L.push('Im Kasten über dem Brett stehen bis zu drei Textsorten:','');
  L.push('| Sorte | wozu |','|---|---|');
  L.push('| **Erklärung** | führt den Schritt ein |');
  L.push('| **Rechnung** | grün abgesetzt: was gezählt wird und was herauskommt |');
  L.push('| **Aufgabe** | blau: was jetzt zu tun ist |','');
  L.push('Die Markierungen auf dem Brett sind mit aufgeführt:','');
  L.push('| Markierung | Bedeutung |','|---|---|');
  L.push('| dünner grüner Rahmen | der Bereich, in dem gerechnet wird |');
  L.push('| **dick** | auf diesem Feld stehen (oder landen) zählende rote Figuren |');
  L.push('| **blinkt** | hier handeln — grün, wenn das Feld selbst zählende rote trägt, sonst blau |');
  L.push('| **blau** | hier ist gehandelt worden |','');
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
    if(m.length) L.push('*Brett:*  '+m.join(' · '),'');
  }
  L.push('---','','## Bedienelemente','');
  L.push('| Element | Text |','|---|---|');
  L.push('| Kopfzeile links | `COUNT · RED` |');
  L.push('| Kopfzeile rechts | `Schritt N von 11` |');
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
