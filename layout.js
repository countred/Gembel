// Die jsdom-Pruefungen sagen nichts ueber PIXEL. Hier wird das Layout mit echten
// Maßen nachgerechnet: passt alles ohne Scrollen auf den Schirm, und wie gross
// wird das Brett? (Reine Rechnung nach den CSS-Regeln der Datei.)
const fs=require('fs');
const html=fs.readFileSync(__dirname+'/anleitung.html','utf8');
const kasten=(html.match(/#lesson\{[^}]*height:clamp\(([^)]+)\)/)||[])[1];
console.log('Kastenhoehe (CSS):', kasten);
const [minS,relS,maxS]=kasten.split(',').map(x=>x.trim());
const minH=parseFloat(minS), rel=parseFloat(relS)/100, maxH=parseFloat(maxS);

const schirme=[
  ['iPhone SE',            375, 667],
  ['iPhone 15',            393, 852],
  ['iPhone 15 Pro Max',    430, 932],
  ['iPad hochkant',        820,1180],
  ['Safari klein',         900, 620],
  ['Safari gross',        1440, 900],
  ['Safari sehr flach',   1440, 500]
];
const PAD=12, GAP=8;
// feste Anteile: Kopf 17 + Balken 4 + Fassung 13 + Kasten + Knoepfe 41, dazu 5 Luecken
const KOPF=17, BALKEN=4, STEMPEL=13, KNOEPFE=41, LUECKEN=5;
let warn=0;
for(const [name,w,h] of schirme){
  const innenH=h-2*PAD, innenW=Math.min(w-2*PAD, 460);
  const kastenH=Math.max(minH, Math.min(rel*h, maxH));
  const rest=innenH-(KOPF+BALKEN+STEMPEL+kastenH+KNOEPFE+LUECKEN*GAP);
  const seite=Math.max(120, Math.min(innenW-20, rest-20));
  const feld=(seite-3*6)/4;
  const eng = rest<140;
  if(eng) warn++;
  console.log(
    (name+'                 ').slice(0,20),
    (w+'x'+h+'      ').slice(0,10),
    'Kasten '+Math.round(kastenH)+'px',
    '| Brettflaeche '+Math.round(rest)+'px',
    '| Brett '+Math.round(seite)+'px',
    '| Feld '+Math.round(feld)+'px',
    (eng?'  ⚠ eng':'')
  );
}
console.log('\nFigur ist 24 px — Feldgroesse sollte deutlich darueber liegen.');
console.log(warn? warn+' Schirm(e) mit wenig Platz fuers Brett.' : 'Auf allen geprueften Schirmen genug Platz.');
