// Rechnet das Layout mit echten Bildschirmmaßen nach: passt alles ohne Scrollen auf
// den Schirm? Die Kastenhoehe wird zur Laufzeit GEMESSEN (laengster Text aller
// Teilschritte); hier wird sie aus der Zeichenzahl geschaetzt, um zu sehen, ob der
// Deckel greift und wie viel Brett uebrig bleibt.
const fs=require('fs');
const rules=fs.readFileSync(__dirname+'/gembel_rules.js','utf8');
const html=fs.readFileSync(__dirname+'/anleitung.html','utf8');
const code=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).pop();
const api=new Function('window','document','console',
  'return (function(){'+rules+'\n'+code+'\nreturn {PHASES,STEPS,textTeile};})()')(
  {addEventListener(){}},{getElementById:()=>null,addEventListener(){}},{log(){},error(){}});

let maxZeichen=0, wo='';
for(let i=0;i<api.PHASES.length;i++){
  // Reine Textschritte bleiben aussen vor — sie duerfen die Seite fuellen.
  if(api.STEPS[api.PHASES[i].si].nurText) continue;
  for(const v of ['vor','nach']){
    const t=api.textTeile(i,v);
    const n=((t.html||'')+(t.rechnung||'')+(t.aufgabe||'')).replace(/<[^>]+>/g,'').length;
    if(n>maxZeichen){ maxZeichen=n; wo=api.STEPS[api.PHASES[i].si].id+'/'+api.PHASES[i].p; }
  }
}
console.log('laengster Teilschritt-Text: '+maxZeichen+' Zeichen ('+wo+')\n');

const schirme=[
  ['iPhone SE',            375, 667],
  ['iPhone 15',            393, 852],
  ['iPhone 15 Pro Max',    430, 932],
  ['iPad hochkant',        820,1180],
  ['Safari klein',         900, 620],
  ['Safari gross',        1440, 900],
  ['Safari sehr flach',   1440, 500]
];
const PAD=12, GAP=8, KOPF=17, BALKEN=4, STEMPEL=13, KNOEPFE=41, LUECKEN=5;
const TITEL=26, ZEILE=20, PADK=24;         // Ueberschrift, Zeilenhoehe, Innenabstand
let eng=0;
for(const [name,w,h] of schirme){
  const innenW=Math.min(w-2*PAD, 460), innenH=h-2*PAD;
  const proZeile=Math.max(20, Math.floor((innenW-26)/7.1));   // ~7,1 px je Zeichen bei 13,5 px
  const zeilen=Math.ceil(maxZeichen/proZeile)+3;              // Absaetze und Abstaende
  const gemessen=TITEL+zeilen*ZEILE+PADK;
  const deckel=Math.round(h*0.60);
  let kasten=Math.min(gemessen, deckel);
  const fest=KOPF+BALKEN+STEMPEL+KNOEPFE+LUECKEN*GAP;
  const minBrett=Math.min(260, Math.round(h*0.34));
  const fehlt=minBrett-(innenH-fest-kasten);
  if(fehlt>0) kasten=Math.max(120, kasten-fehlt);      // Brett hat Vorrang
  const gedeckelt=gemessen>kasten;
  const rest=innenH-(fest+kasten);
  const seite=Math.max(120, Math.min(innenW-20, rest-20));
  const feld=(seite-18)/4;
  if(rest<150) eng++;
  console.log((name+'                    ').slice(0,20)
    +(w+'x'+h+'        ').slice(0,11)
    +'Kasten '+String(Math.round(kasten)).padStart(3)+'px'+(gedeckelt?' (gedeckelt!)':'            ')
    +' | Brett '+String(Math.round(seite)).padStart(3)+'px'
    +' | Feld '+String(Math.round(feld)).padStart(3)+'px'
    +(rest<150?'  ⚠ eng':''));
}
console.log('\nFigur ist 24 px. Gedeckelt heisst: der Text muss dort scrollen.');
console.log(eng? eng+' Schirm(e) mit wenig Platz.' : 'Auf allen geprueften Schirmen genug Platz.');
