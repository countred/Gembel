// ═══════════════════════════════════════════════════════════════════
// test_anleitung_137.js — Pruefsuite fuer anleitung.html
// ═══════════════════════════════════════════════════════════════════
// Stand: Fassung 11 (§139, Walters Umbau auf neun Schritte).
//
// GRUNDSATZ (aus §138 gelernt, zweimal derselbe Rahmen bei 100 gruenen
// Pruefungen): Erwartungen werden AUSGERECHNET, nicht hingeschrieben.
// Wo eine Zahl im Test steht, muss sie aus der Regelschicht oder aus dem
// Quelltext stammen — sonst prueft der Test nur sich selbst.
//
// Bloecke:
//   A  Struktur und Quelltext (keine fremden Ladewege, Fassung, Dauern)
//   B  Durchklick durch ALLE Teilschritte im DOM (braucht jsdom)
//   C  Negativkontrollen: sieben Regelmutationen, jede muss auffallen
//   D  Ausfallverhalten: fehlende Regelschicht, Wachhund, Vorschau
//   E  Geometrie des Bereichsrahmens fuer vier Brettgroessen
//
// Aufruf:  node test_anleitung_137.js
// ═══════════════════════════════════════════════════════════════════
const fs=require('fs'), path=require('path');
const D=__dirname;
const RULES=fs.readFileSync(path.join(D,'gembel_rules.js'),'utf8');
const HTML =fs.readFileSync(path.join(D,'anleitung.html'),'utf8');

// Quelltext ohne Kommentare — sonst schlagen Pruefungen auf Woerter an, die nur
// in der Dokumentation stehen ("kein Firebase", "countred_ai_core.js wird NICHT geladen").
const ohneKommentar = HTML.replace(/<!--[\s\S]*?-->/g,'').replace(/^\s*\/\/[^\n]*/gm,'')
                          .replace(/\/\*[\s\S]*?\*\//g,'');

let ok=0, bad=0; const fehler=[];
function pruef(name, bedingung, zusatz){
  if(bedingung) ok++;
  else { bad++; fehler.push(name+(zusatz?'  ['+zusatz+']':'')); }
}
function block(n){ console.log('\n── '+n+' '+'─'.repeat(Math.max(0,58-n.length))); }

// ── Die Seite ohne DOM laden: nur Modell und Regeln ────────────────
function ladeModell(regeln){
  const code=[...HTML.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).pop();
  return new Function('window','document','console',
    'return (function(){'+(regeln||RULES)+'\n'+code+
    '\nreturn {PHASES,STEPS,textTeile,selfTest,boardFor,amZug,markAnheben,markAbsetzen,'+
    'ANL_FASSUNG,ABFLUG_MS,ANKUNFT_MS,ABFLUG_MIT_MS,ANKUNFT_MIT_MS,GITTER_LUECKE,RAHMEN_LUFT,'+
    'canLift,canDrop,initBoard,CELL,fromSpec,ZIELSPEC,DREIERSPEC,BONUSSPEC};})()')(
    {addEventListener(){}},{getElementById:()=>null,addEventListener(){}},{log(){},error(){}});
}
const M=ladeModell();

// ═══════════════════════════════════════════════════════════════════
block('A · Struktur und Quelltext');
// ═══════════════════════════════════════════════════════════════════
pruef('A1 Regelschicht wird per <script src> geladen', /<script src="gembel_rules\.js/.test(HTML));
pruef('A2 keine Regelkopie im Quelltext', !/function canLift\s*\(/.test(HTML));
pruef('A3 kein Firebase', !/firebase/i.test(ohneKommentar));
pruef('A4 kein Browser-Speicher', !/localStorage|sessionStorage|document\.cookie/.test(HTML));
pruef('A5 keine KI', !/countred_ai/.test(ohneKommentar));
pruef('A6 keine externe Quelle', !/https?:\/\/(?!www\.w3\.org)/.test(HTML.replace(/<!--[\s\S]*?-->/g,'')));
pruef('A7 Fassungsstempel vorhanden', /Anleitung · Fassung \d+ · \d\d\.\d\d\.\d{4}/.test(M.ANL_FASSUNG), M.ANL_FASSUNG);
pruef('A8 Fassung ist hochgezaehlt (>=24)', parseInt(M.ANL_FASSUNG.match(/Fassung (\d+)/)[1],10)>=24);
pruef('A9 Wachhund steht in einem EIGENEN Skriptblock',
  /__anlGestartet\s*=\s*false[\s\S]*?<\/script>\s*(<!--[\s\S]*?-->\s*)?<script src="gembel_rules/.test(HTML));
pruef('A10 ALL8 wird nicht neu deklariert', !/const ALL8/.test(HTML));
pruef('A11 neun Schritte', M.STEPS.length===9, 'sind '+M.STEPS.length);
pruef('A12 Schrittfolge wie vereinbart',
  M.STEPS.map(s=>s.id).join(',')==='ziel,beginn,erlaubnis,stapelbilden,aufloesen,leerfeld,dreier,bonus,rest',
  M.STEPS.map(s=>s.id).join(','));

// Dauern: Code und Stylesheet muessen uebereinstimmen — sonst laeuft der Zug
// gegen die Animation.
function cssDauer(klasse){
  const m=HTML.match(new RegExp('\\.cell\\.'+klasse+'\\{animation:blitz ([0-9.]+)s'));
  return m ? Math.round(parseFloat(m[1])*1000) : null;
}
pruef('A13 Abflugdauer Code = CSS',            cssDauer('abflug')===M.ABFLUG_MS, cssDauer('abflug')+' vs '+M.ABFLUG_MS);
pruef('A14 Ankunftsdauer Code = CSS',          cssDauer('ankunft')===M.ANKUNFT_MS, cssDauer('ankunft')+' vs '+M.ANKUNFT_MS);
pruef('A15 Abflugdauer Mitspieler Code = CSS', cssDauer('abflug-mit')===M.ABFLUG_MIT_MS, cssDauer('abflug-mit')+' vs '+M.ABFLUG_MIT_MS);
pruef('A16 Ankunftsdauer Mitspieler Code = CSS',cssDauer('ankunft-mit')===M.ANKUNFT_MIT_MS, cssDauer('ankunft-mit')+' vs '+M.ANKUNFT_MIT_MS);
// Walters Auflage: der fremde Zug muss LANGSAMER laufen als der eigene.
pruef('A17 Mitspielerzug laeuft langsamer als der eigene',
  M.ABFLUG_MIT_MS>M.ABFLUG_MS && M.ANKUNFT_MIT_MS>M.ANKUNFT_MS);
const cssGap=(HTML.match(/#board\{[^}]*gap:(\d+)px/)||[])[1];
pruef('A18 Gitterluecke Code = CSS', Number(cssGap)===M.GITTER_LUECKE, cssGap+' vs '+M.GITTER_LUECKE);
pruef('A19 Selbsttest ist gruen', M.selfTest().length===0, M.selfTest().join(' | '));

// Walters Wortlaut: "anheben"/"absetzen", "Dreier" — nicht die alten Woerter.
const sichtbar=ohneKommentar;
pruef('A20 kein "abheben" mehr im sichtbaren Text', !/abheben|abzuheben/i.test(sichtbar));
pruef('A21 kein "ablegen" mehr im sichtbaren Text', !/ablegen|abzulegen/i.test(sichtbar));
pruef('A22 kein "Dreierreihe" mehr im sichtbaren Text', !/Dreierreihe/.test(sichtbar));
pruef('A23 kein "Gegner" mehr im sichtbaren Text', !/Gegner/.test(sichtbar));
// §140-Wortlaut: EIN Wort je Sache, in Anleitung, Regeltext und Meldungen gleich.
pruef('A23b kein "Halbzug" mehr im sichtbaren Text', !/Halbzug|Halbzüge/.test(sichtbar));
pruef('A23c kein "Rematch"/"Revanche" mehr im sichtbaren Text', !/Rematch|Revanche/.test(sichtbar));
// §140: gesperrt ist die FIGUR, nicht das Feld — sonst widerspricht der Text canStack.
pruef('A23d kein "gesperrtes Feld" im sichtbaren Text',
  !/gesperrte[snm]? Feld|Felder werden gesperrt/.test(sichtbar));
// "Gesperrt" allein liest sich als "hier geht gar nichts mehr". Die Anleitung muss
// beides nennen: stapeln bleibt erlaubt, und die obere Figur kommt wieder herunter.
// Am MODELL pruefen, nicht am Quelltext: die Saetze sind dort ueber mehrere
// String-Teile verteilt, ein Regex auf die Datei findet sie nur zufaellig.
{
  const alleTexte = M.STEPS.map(s => (s.intro||'') +
    s.aktionen.map(x => (x.text||'')+(x.vorher||'')+(x.nachher||'')).join(' ')).join(' ');
  // §141: es gibt genau EINEN sichtbaren Ausfalltext, und zwar ueberall denselben —
// auch im Wachhund, der in einem eigenen Skriptblock liegt und die Konstante nicht sieht.
{
  const saetze=[...HTML.matchAll(/<b>Die Anleitung [^<]*<\/b>/g)].map(x=>x[0]);
  pruef('A43 nur ein einziger sichtbarer Ausfallsatz',
    saetze.length>0 && new Set(saetze).size===1, [...new Set(saetze)].join(' | '));
  pruef('A44 die alten Ausfalltexte sind weg',
    !/Selbsttest fehlgeschlagen\.<|Die Anleitung stoppt hier|Die Regelschicht fehlt\.<|ist nicht gestartet/.test(HTML));
  pruef('A45 die Diagnose geht in die Konsole',
    /console\.error\('anleitung\.html: '\+String\(diagnose\)/.test(HTML));
}
pruef('A23e die Anleitung sagt, was trotz Sperrung erlaubt bleibt',
    /Stapeln darauf bleibt erlaubt/.test(alleTexte) &&
    /obere Figur darfst du auch wieder herunternehmen/.test(alleTexte));
}

// Die Zuege des Mitspielers: genau zwei, und beide dort, wo Walter sie wollte.
const mitZuege=[];
M.STEPS.forEach(s=>s.aktionen.forEach(function(a){
  if(a.actor===2) mitZuege.push(s.id+':'+a.von+'->'+a.nach);
  if(a.zugDanach && a.zugDanach.actor===2) mitZuege.push(s.id+':'+a.zugDanach.von+'->'+a.zugDanach.nach);
}));
pruef('A24 genau zwei Mitspielerzuege', mitZuege.length===2, mitZuege.join(', '));
pruef('A25 Mitspielerzuege an der richtigen Stelle',
  mitZuege.join(',')==='aufloesen:1D->2C,bonus:3D->3C', mitZuege.join(','));

// Welche Aktionen OHNE gruene Erklaerungsmarkierungen laufen, ist eine Absprache,
// keine Ableitung — also wird sie hier festgehalten und nicht aus dem Modell gelesen.
// (Lehre aus Fassung 8: sonst prueft der Test nur, was ohnehin dasteht.)
const rohSoll=['ziel:1D->1B','beginn:1B->4D','aufloesen:1D->2C','bonus:3D->3C'];
const rohIst=[];
M.STEPS.forEach(s=>s.aktionen.forEach(function(a){
  if(a.roh) rohIst.push(s.id+':'+a.von+'->'+a.nach);
  if(a.zugDanach && a.zugDanach.roh) rohIst.push(s.id+':'+a.zugDanach.von+'->'+a.zugDanach.nach);
}));
pruef('A26 genau die vereinbarten Aktionen sind roh',
  rohIst.join(',')===rohSoll.join(','), rohIst.join(',')||'keine');

// Walters Fassung-12-Auflagen, die man sonst still verlieren kann.
pruef('A27 kein gruener Balken mehr an der Rechnung', !/border-left:3px solid var\(--gruen\)/.test(HTML));
pruef('A28 kein wide-Modus mehr', !/classList\.toggle\('wide'/.test(HTML));
const aufgaben=[];
for(let i=0;i<M.PHASES.length;i++) for(const v of ['vor','nach']){
  const a=M.textTeile(i,v); if(a.aufgabe) aufgaben.push(a.aufgabe);
}
pruef('A29 blaue Anweisungen tragen keine Fettung', !aufgaben.some(x=>/<b>/.test(x)),
  (aufgaben.find(x=>/<b>/.test(x))||'').slice(0,60));
pruef('A30 "nicht" ist in den Rechnungen fett', (function(){
  const B=M.initBoard();
  return /<b>nicht<\/b> anheben/.test(M.markAnheben(B,1,2,1).text);      // 3C: gerade
})());
// Der Kasten ist ueberall gleich hoch — also darf keine Seite ausgenommen sein.
pruef('A31 Kastenhoehe misst alle Seiten', !/if\(STEPS\[PHASES\[i\]\.si\]\.nurText\) continue;/.test(HTML));
// Genau zwei Mitspielerzuege, beide in EINEM Schritt.
pruef('A32 Mitspielerzuege haengen an einer Seite, statt eine eigene zu bekommen',
  M.STEPS.every(s=>s.aktionen.every(a=>a.actor!==2)));
// Walters Regel: keine Seite, auf der nur animiert wird.
// §139: der Ausgang ins Spiel.
pruef('A38 es gibt einen Ausgang ins Spiel', /id="btn-exit"/.test(HTML));
pruef('A39 der Ausgang wird VOR der Regelschicht-Pruefung verdrahtet', (function(){
  // Anker ist der CODE, nicht der Meldungstext: der Text hat sich mit §141 geaendert,
  // und die Pruefung schlug fehl, obwohl die Reihenfolge stimmte.
  const i=HTML.indexOf("getElementById('btn-exit')");
  const j=HTML.indexOf('const fehlt=noetig.filter');
  return i>0 && j>0 && i<j;
})());
// Der fuenfte Ladeweg: die Anleitung laedt die Regelschicht selbst, und index.html
// verlinkt sie mit ?v=. Beide muessen auf demselben Stand stehen wie das Spiel — sonst
// mischt der Browser eine alte Regelschicht in die Anleitung (§51-Klasse).
{
  const vAnl=(HTML.match(/gembel_rules\.js\?v=(\d+)/)||[])[1];
  pruef('A40 die Anleitung traegt einen Cache-Bust', !!vAnl, String(vAnl));
  const ipath=path.join(D,'index.html');
  if(fs.existsSync(ipath)){
    const ih=fs.readFileSync(ipath,'utf8');
    const vSpiel=(ih.match(/gembel_rules\.js\?v=(\d+)/)||[])[1];
    const vLink =(ih.match(/anleitung\.html\?v=(\d+)/)||[])[1];
    pruef('A41 derselbe Stand wie das Spiel', vAnl===vSpiel, vAnl+' gegen '+vSpiel);
    pruef('A42 index.html verlinkt die Anleitung mit demselben ?v=', vLink===vAnl, vLink+' gegen '+vAnl);
  } else pruef('A41 index.html liegt nicht daneben (uebersprungen)', true);
}
pruef('A37 jede Antipp-Seite zeigt ihre Rechnung sofort', (function(){
  for(let i=0;i<M.PHASES.length;i++){
    if(M.PHASES[i].p!=='tap') continue;
    if(!M.textTeile(i,'nach').rechnung) return false;
  }
  return true;
})());
pruef('A33 keine Ausfuehrungsseite ohne eigenen Text',
  M.PHASES.every(function(p){
    if(p.p!=='exec') return true;
    return !!M.STEPS[p.si].aktionen[p.ai].nachher;
  }));
// Erspielbarkeit: Aufbauten, die aus Zuegen bestehen, muessen als ZUGFOLGE
// hinterlegt sein — nur die kann der Selbsttest nachrechnen.
pruef('A36 kein Aufbau baut die Stellung von Hand aus applyMove',
  !/setup:function\(\)\{[\s\S]{0,400}?applyMove/.test(HTML));
pruef('A34 kein "Reihe" mehr im sichtbaren Text', !/\bReihe\b/.test(sichtbar));
pruef('A35 "Gut zu wissen" ohne Fettung', (function(){
  const s=M.STEPS[M.STEPS.length-1];
  return s.aktionen.every(a=>!/<b>/.test(a.text||''));
})());

// ═══════════════════════════════════════════════════════════════════
block('B · Durchklick durch alle Teilschritte');
// ═══════════════════════════════════════════════════════════════════
let JSDOM=null;
try { JSDOM=require('jsdom').JSDOM; } catch(e){ JSDOM=null; }

async function durchklick(){
  const html=HTML.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,'<script>'+RULES+'</script>');
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
  const d=dom.window.document;
  const warte=ms=>new Promise(r=>setTimeout(r,ms));
  const zelle=n=>[...d.querySelectorAll('#board .cell')].find(x=>x.title===n);
  const next=()=>d.getElementById('btn-next');
  const back=()=>d.getElementById('btn-back');
  const txt =()=>d.getElementById('ltext').textContent;
  const hat =(n,k)=>{ const z=zelle(n); return !!z && z.classList.contains(k); };

  await warte(60);
  pruef('B1 Seite ist gestartet (kein Wachhund-Alarm)',
    d.getElementById('meldung').style.display!=='block', d.getElementById('meldung').textContent.slice(0,90));
  pruef('B2 Fassungsstempel steht in der Seite', /Fassung 24/.test(d.getElementById('fassung').textContent));

  const langsam=Math.max(M.ANKUNFT_MIT_MS, M.ANKUNFT_MS)+200;
  let gesehen=0, sieger=0;

  for(let i=0;i<M.PHASES.length;i++){
    const ph=M.PHASES[i], s=M.STEPS[ph.si], a=s.aktionen[ph.ai];
    const wo=s.id+'/'+ph.p+'#'+i;
    gesehen++;

    pruef('B· Ausgang ins Spiel ist da ('+wo+')',
      !!d.getElementById('btn-exit') && d.getElementById('btn-exit').offsetParent!==undefined);
    pruef('B· Schrittnummer stimmt ('+wo+')',
      d.getElementById('stepno').textContent==='Schritt '+(ph.si+1)+' von 9');

    // Roh-Aktionen zeigen KEINE gruenen Erklaerungsmarkierungen.
    if(a.roh && (ph.p==='lift'||ph.p==='drop'||(ph.p==='exec'&&a.einSchritt))){
      pruef('B· roh: keine gruenen Felder ('+wo+')', d.querySelectorAll('#board .cell.zaehlt').length===0);
      pruef('B· roh: kein Bereichsrahmen ('+wo+')', d.getElementById('bereich').style.display==='none');
      pruef('B· roh: keine Rechnung im Text ('+wo+')', !d.querySelector('#ltext .rechnung'));
    }
    if(!a.roh && (ph.p==='lift'||ph.p==='drop'||ph.p==='fail'||ph.p==='tap')){
      const b=M.boardFor(i);
      const m = ph.p==='tap'  ? M.markAnheben(b,M.CELL[a.feld][0],M.CELL[a.feld][1],1)
              : ph.p==='lift' ? M.markAnheben(b,M.CELL[a.von][0],M.CELL[a.von][1],a.actor)
              : M.markAbsetzen(b,M.CELL[a.von][0],M.CELL[a.von][1],M.CELL[a.nach][0],M.CELL[a.nach][1],a.actor);
      if(m.bereich){
        pruef('B· Bereichsrahmen sichtbar ('+wo+')', d.getElementById('bereich').style.display==='block');
        pruef('B· gruene Felder = gerechnete ('+wo+')',
          d.querySelectorAll('#board .cell.zaehlt').length===m.zaehlt.length,
          d.querySelectorAll('#board .cell.zaehlt').length+' vs '+m.zaehlt.length);
      }
    }

    // Weiter-Knopf: beim Lernenden gesperrt, bis er getippt hat.
    if((ph.p==='lift'||ph.p==='drop') && a.actor===1)
      pruef('B· Weiter gesperrt, bis getippt ist ('+wo+')', next().disabled===true);
    if((ph.p==='lift'||ph.p==='drop') && a.actor===2)
      pruef('B· Weiter treibt den Mitspielerzug ('+wo+')', next().disabled===false);

    // Handeln
    if(ph.p==='tap'){
      const b=M.boardFor(i), p=M.CELL[a.feld];
      const erlaubt=M.canLift(b,p[0],p[1],1,'odd');
      zelle(a.feld).onclick();
      pruef('B· Rechnung erscheint sofort nach dem Tippen ('+wo+')',
        !!d.querySelector('#ltext .rechnung'));
      pruef('B· Urteil im Text stimmt ('+wo+')',
        /Du darfst nicht anheben/.test(txt())!==erlaubt, txt().slice(0,80));
      pruef('B· blaue Markierung nur bei erlaubtem Anheben ('+wo+')', hat(a.feld,'getan')===erlaubt);
      pruef('B· Weiter frei nach dem Tippen ('+wo+')', next().disabled===false);
      next().onclick();
    }
    else if(ph.p==='lift'){
      if(a.actor===1){ zelle(a.von).onclick(); } else { next().onclick(); }
    }
    else if(ph.p==='drop'){
      if(a.actor===1) zelle(a.nach).onclick(); else next().onclick();
      if(!a.nachher){                       // Zug laeuft auf DIESER Seite zu Ende
        await warte(langsam);
        pruef('B· Zug ist auf der Absetzseite gelaufen ('+wo+')', next().disabled===false);
        if(i<M.PHASES.length-1) next().onclick();
      }
    }
    else if(ph.p==='fail'){
      pruef('B· Fehlzug: Quellfeld ist blau markiert ('+wo+')', hat(a.von,'getan'));
      zelle(a.nach).onclick();
      pruef('B· Fehlzug: Ablehnung steht im Text ('+wo+')', /darfst nicht/.test(txt()), txt().slice(0,90));
      pruef('B· Fehlzug: blaue Markierung ist weg ('+wo+')', !hat(a.von,'getan'));
      pruef('B· Fehlzug: Weiter ist frei ('+wo+')', next().disabled===false);
      next().onclick();
    }
    else if(ph.p==='exec'){
      await warte(langsam);
      const vier=d.querySelectorAll('#board .cell.sieg').length;
      if(a.erwartet==='sieg'){ sieger++; pruef('B· Vierer ist markiert ('+wo+')', vier===4, 'markiert: '+vier); }
      else pruef('B· kein Siegrahmen ohne Sieg ('+wo+')', vier===0);
      if(a.nachher) pruef('B· Schlusstext erscheint ('+wo+')', txt().length>10);
      pruef('B· Weiter frei nach dem Zug ('+wo+')', next().disabled===false);
      if(i<M.PHASES.length-1) next().onclick();
    }
    else if(ph.p==='zeigen' || ph.p==='lesen'){
      pruef('B· Seite ist lesbar ('+wo+')', txt().length>20);
      if(ph.p==='zeigen')
        pruef('B· Zeigeseite hat einen Bereichsrahmen ('+wo+')',
          d.getElementById('bereich').style.display==='block');
      if(a.blass) pruef('B· blasse Figuren stehen auf dem Brett ('+wo+')',
        d.querySelectorAll('#board .figure.getragen').length>=a.blass.length);
      pruef('B· Seite verlangt kein Tippen ('+wo+')', next().disabled===false);
      if(a.zugDanach){
        next().onclick();                    // erster Druck: der Zug laeuft hier ab
        if(a.zugDanach.erwartet==='sieg'){
          // Der Siegrahmen darf erst NACH dem blauen Blinken kommen — sonst ist der
          // zweite Teil des Zuges nicht zu sehen (Walters Befund, Fassung 13).
          await warte(M.ABFLUG_MIT_MS+150);
          pruef('B· Ankunft blinkt, bevor der Vierer erscheint ('+wo+')',
            d.querySelectorAll('#board .cell.sieg').length===0 &&
            d.getElementById('board').getAttribute('data-sieg')==='wartet');
        }
        await warte(langsam+M.ANKUNFT_MIT_MS+300);
        pruef('B· Zug lief auf derselben Seite ('+wo+')',
          d.getElementById('stepno').textContent==='Schritt '+(ph.si+1)+' von 9');
        if(a.zugDanach.erwartet==='sieg'){
          sieger++;
          pruef('B· Vierer erst nach dem Blinken markiert ('+wo+')',
            d.querySelectorAll('#board .cell.sieg').length===4,
            'markiert: '+d.querySelectorAll('#board .cell.sieg').length);
        }
        pruef('B· Schlusstext steht da ('+wo+')', txt().length>20);
      }
      if(i<M.PHASES.length-1) next().onclick();
    }
    await warte(5);
  }

  pruef('B3 alle Teilschritte durchlaufen', gesehen===M.PHASES.length, gesehen+' von '+M.PHASES.length);
  pruef('B4 zwei Siegstellungen gezeigt', sieger===2, 'sind '+sieger);
  pruef('B5 letzter Knopf fuehrt ins Spiel', next().textContent==='Zum Spiel');

  // Rueckwaerts: muss ohne Sperre durchlaufen und darf nichts halb tun.
  let schritte=0;
  while(!back().disabled && schritte<M.PHASES.length+5){ back().onclick(); schritte++; await warte(5); }
  pruef('B6 Zurueck laeuft bis zum Anfang durch', schritte===M.PHASES.length-1, 'ging '+schritte+' zurueck');
  pruef('B7 wieder bei Schritt 1', d.getElementById('stepno').textContent==='Schritt 1 von 9');
  dom.window.close();
}

// ═══════════════════════════════════════════════════════════════════
block('C · Negativkontrollen: sieben Regelmutationen');
// ═══════════════════════════════════════════════════════════════════
// Jede Mutation lockert oder verdreht EINE Regel. Der Selbsttest der Anleitung
// muss jede davon bemerken — sonst prueft er nichts.
const MUTATIONEN=[
  ['Reichweitenregel eingebaut',
    /function canDrop\(b, fr, fc, tr, tc, player, p1parity\)\{\n  if\(fr===tr&&fc===tc\) return false;/,
    'function canDrop(b, fr, fc, tr, tc, player, p1parity){\n  if(fr===tr&&fc===tc) return false;\n  if(Math.abs(fr-tr)>1||Math.abs(fc-tc)>1) return false;'],
  ['Stripe-Match abgeschaltet',
    /if\(mp\.stripe!==to\.stripe\) return false;/, ''],
  ['Paritaet beim Anheben abgeschaltet',
    /return parityOk\(w, player, p1parity\);\n\}/, 'return true;\n}'],
  ['Stapelparitaet abgeschaltet',
    /return parityOk\(countRedsInStack\(to\.piece,mp\), player, p1parity\);/, 'return true;'],
  ['gesperrte Einzelfigur wieder beweglich',
    /if\(cell\.locked\) return false;/, ''],
  ['Stapelhoheit abgeschaltet',
    /if\(cell\.stack\)\{ return cell\.stack\.formedBy===player; \}/, 'if(cell.stack){ return true; }'],
  ['dritte Figur im Stapel erlaubt',
    /if\(!to\.piece\|\|to\.stack\) return false;/, 'if(!to.piece) return false;']
];
MUTATIONEN.forEach(function(mu){
  const [name, suchen, ersetzen]=mu;
  if(!suchen.test(RULES)){ pruef('C· Mutation "'+name+'" liess sich nicht setzen', false, 'Muster nicht gefunden'); return; }
  const kaputt=RULES.replace(suchen, ersetzen);
  pruef('C· Mutation greift wirklich ("'+name+'")', kaputt!==RULES);
  let err;
  try { err=ladeModell(kaputt).selfTest(); }
  catch(e){ err=['Ausnahme: '+e.message]; }
  pruef('C· "'+name+'" wird erkannt', err.length>0, 'Selbsttest blieb still');
});

// ═══════════════════════════════════════════════════════════════════
block('D · Ausfallverhalten');
// ═══════════════════════════════════════════════════════════════════
if(JSDOM){
  // D1 · ohne Regelschicht muss die Seite es SAGEN, nicht leer bleiben.
  const ohne=new JSDOM(HTML.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,''),
    {runScripts:'dangerously',pretendToBeVisual:true});
  const dm=ohne.window.document.getElementById('meldung');
  pruef('D1 fehlende Regelschicht wird gemeldet', dm && dm.style.display==='block');
  // §141: der Lernende sieht NUR diesen einen Satz — keine Dateinamen, keine Diagnose.
  pruef('D2 die Meldung ist genau der eine Satz',
    dm && dm.textContent.trim()==='Die Anleitung konnte nicht starten.', dm && dm.textContent.trim().slice(0,90));
  pruef('D2b die Meldung nennt KEINE Diagnose',
    dm && !/gembel_rules|Selbsttest|canLift|Regelschicht/.test(dm.textContent), dm && dm.textContent.slice(0,90));
  pruef('D3 Brett und Knoepfe sind dann ausgeblendet',
    ohne.window.document.getElementById('board-area').style.display==='none');
  pruef('D4b der Ausgang ins Spiel bleibt auch im Fehlerfall bedienbar',
    typeof ohne.window.document.getElementById('btn-exit').onclick === 'function');
  pruef('D4 der Fassungsstempel bleibt sichtbar',
    ohne.window.document.getElementById('fassung').style.display!=='none');
  ohne.window.close();
} else {
  pruef('D· uebersprungen (kein jsdom)', true);
}
// D5 · die Vorschaufassung muss baubar und eigenstaendig sein.
const bau=path.join(D,'bau_vorschau.js');
if(fs.existsSync(bau)){
  const tag=/<script src="gembel_rules\.js[^>]*><\/script>/;
  pruef('D5 bau_vorschau.js findet die Einbindung', tag.test(HTML));
  const vorschau=HTML.replace(tag,'<script>'+RULES+'</script>');
  pruef('D6 Vorschau braucht keine Nachbardatei', !/^<script src="gembel_rules/m.test(vorschau));
  pruef('D7 Vorschau enthaelt die Regelschicht', /function canLift/.test(vorschau));
} else pruef('D5 bau_vorschau.js liegt nicht daneben (uebersprungen)', true);

// ═══════════════════════════════════════════════════════════════════
block('E · Geometrie des Bereichsrahmens');
// ═══════════════════════════════════════════════════════════════════
// Der Rahmen wird als CSS-calc in Prozent gesetzt. Hier wird der Ausdruck fuer
// vier Brettgroessen ausgewertet und gegen das Gittermodell gehalten — die Lehre
// aus Fassung 8: pruefen, WO etwas landet, nicht nur, WAS markiert ist.
const g=M.GITTER_LUECKE, luft=M.RAHMEN_LUFT;
function rechneCalc(ausdruck, gesamt){
  const m=ausdruck.match(/calc\(\((.+?) - (\d+)px\) \/ 4 \* ([\d.]+) \+ (-?[\d.]+)px\)/);
  if(!m) return null;
  return (gesamt - Number(m[2]))/4*Number(m[3]) + Number(m[4]);
}
[240,320,400,460].forEach(function(breite){
  const feld=(breite-3*g)/4;
  // Beispiel: Bereich um 1B (r=3,c=1) samt Nachbarn → Spalten 0..2, Zeilen 2..3
  const c0=0, c1=2, r0=2, r1=3, zeileOben=3-r1;
  const links = rechneCalc('calc((100% - '+(3*g)+'px) / 4 * '+c0+' + '+(g*c0-luft)+'px)', breite);
  const weite = rechneCalc('calc((100% - '+(3*g)+'px) / 4 * '+(c1-c0+1)+' + '+(g*(c1-c0)+2*luft)+'px)', breite);
  const oben  = rechneCalc('calc((100% - '+(3*g)+'px) / 4 * '+zeileOben+' + '+(g*zeileOben-luft)+'px)', breite);
  const sollLinks = c0*(feld+g)-luft;
  const sollWeite = (c1-c0+1)*feld + (c1-c0)*g + 2*luft;
  const sollOben  = zeileOben*(feld+g)-luft;
  pruef('E· Rahmen links stimmt bei '+breite+'px', Math.abs(links-sollLinks)<0.01, links+' vs '+sollLinks);
  pruef('E· Rahmen breit stimmt bei '+breite+'px', Math.abs(weite-sollWeite)<0.01, weite+' vs '+sollWeite);
  pruef('E· Rahmen oben stimmt bei '+breite+'px',  Math.abs(oben-sollOben)<0.01,  oben+' vs '+sollOben);
  // Der Rahmen darf nicht ueber das Brett hinausragen.
  pruef('E· Rahmen bleibt im Brett bei '+breite+'px', links>=-luft-0.01 && links+weite<=breite+luft+0.01);
});

// ═══════════════════════════════════════════════════════════════════
(async function(){
  if(JSDOM){ try { await durchklick(); } catch(e){ pruef('B· Durchklick abgebrochen', false, e.message); } }
  else { console.log('\n⚠ jsdom fehlt — Block B uebersprungen. Mit  npm i jsdom  nachinstallieren.'); }
  console.log('\n'+'═'.repeat(62));
  if(bad){ console.log('FEHLER ('+bad+'):'); fehler.forEach(f=>console.log(' · '+f)); }
  console.log((bad?'✗':'✓')+'  '+ok+' von '+(ok+bad)+' Pruefungen bestanden');
  process.exit(bad?1:0);
})();
