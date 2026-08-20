// Sammelt ALLE Texte, die ein Lernender in anleitung.html zu sehen bekommt.
// Nicht abgeschrieben, sondern durch Bedienen der Seite eingefangen — damit die
// Textfassung nicht von der Auslieferung abweichen kann.
const fs=require('fs');
const {JSDOM}=require('jsdom');
const DIR=__dirname;

const rules=fs.readFileSync(DIR+'/gembel_rules.js','utf8');
const htmlSrc=fs.readFileSync(DIR+'/anleitung.html','utf8');
const html=htmlSrc.replace(/<script src="gembel_rules\.js[^>]*><\/script>/,'<script>'+rules+'</script>');

const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window, d=w.document;
const cell=n=>[...d.querySelectorAll('#board .cell')].find(x=>x.title===n);
const tap=n=>cell(n).onclick();
const nx=()=>d.getElementById('btn-next');

// HTML -> lesbarer Fliesstext (Auszeichnungen bleiben als **fett** erhalten)
function plain(h){
  return String(h)
    // die fette Ueberschrift im Erklaerkasten abtrennen, sonst klebt sie am Satz
    .replace(/<span class="hd">([\s\S]*?)<\/span>/gi,'**$1** — ')
    .replace(/<br\s*\/?>/gi,'\n')
    .replace(/<\/(p|div)>/gi,'\n\n')
    .replace(/<b>|<strong>/gi,'**').replace(/<\/b>|<\/strong>/gi,'**')
    .replace(/<i>|<em>/gi,'_').replace(/<\/i>|<\/em>/gi,'_')
    .replace(/<[^>]+>/g,'')
    .replace(/&middot;/g,'·').replace(/&rarr;/g,'→').replace(/&nbsp;/g,' ')
    .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&')
    .replace(/[ \t]{2,}/g,' ')                // Einrueckung aus dem Quelltext weg
    .replace(/[ \t]+\n/g,'\n').replace(/\n[ \t]+/g,'\n')
    .replace(/\n{3,}/g,'\n\n').trim();
}
const why=()=>plain(d.getElementById('why').innerHTML);
const lesson=()=>plain(d.getElementById('ltext').innerHTML);
const title=()=>d.getElementById('ltitle').textContent;
const task=()=>plain(d.getElementById('task').innerHTML);

const out=[];
const box=[];   // gesammelte Erklaerkasten-Texte je Schritt
function grab(schritt,anlass){ box.push({schritt,anlass,text:why()}); }

function stepBlock(nr){
  out.push('');
  out.push('### Schritt '+nr+' — '+title());
  out.push('');
  out.push('**Erklärtext**');
  out.push('');
  out.push(lesson().split('\n').map(l=>l?'> '+l:'>').join('\n'));
  const tk=task();
  if(tk){ out.push(''); out.push('**Aufgabe** — `'+tk+'`'); }
}
function doneBlock(){
  out.push('');
  out.push('**Nach dem Schritt**');
  out.push('');
  out.push(lesson().split('\n').map(l=>l?'> '+l:'>').join('\n'));
}
function boxBlock(nr){
  const mine=box.filter(b=>b.schritt===nr);
  if(!mine.length) return;
  out.push('');
  out.push('**Erklärkasten**');
  out.push('');
  for(const m of mine){ out.push('- *'+m.anlass+'* — '+m.text.replace(/\n/g,' ')); }
}

// ── 1 Ziel ──────────────────────────────────────────────────────────
stepBlock(1);
tap('1C'); grab(1,'falsches Feld angetippt');
tap('1D'); grab(1,'1D angetippt');
tap('1B'); grab(1,'Zug ausgeführt');
boxBlock(1); doneBlock(); nx().onclick();

// ── 2 Brett ─────────────────────────────────────────────────────────
stepBlock(2);
tap('2C'); grab(2,'2C angetippt');
boxBlock(2); doneBlock(); nx().onclick();

// ── 3 Parität nein ──────────────────────────────────────────────────
stepBlock(3);
tap('2B'); grab(3,'2B angetippt');
boxBlock(3); doneBlock(); nx().onclick();

// ── 4 Parität ja ────────────────────────────────────────────────────
stepBlock(4);
tap('1B'); grab(4,'1B angetippt');
boxBlock(4); doneBlock(); nx().onclick();

// ── 5 Stapeln ───────────────────────────────────────────────────────
stepBlock(5);
tap('4A'); grab(5,'nicht hebbare Figur angetippt');
tap('1B'); grab(5,'1B angetippt');
tap('3A'); grab(5,'erlaubtes, aber falsches Ziel');
tap('2B'); grab(5,'Zug ausgeführt');
boxBlock(5); doneBlock(); nx().onclick();

// ── 6 Gegenzug 1 ────────────────────────────────────────────────────
// Der Gegenzug laeuft in drei Bildern (hebt / legt ab / fertig). Die Momentaufnahmen
// muessen ZWISCHEN den Umschaltpunkten liegen, sonst faellt der erste Text unter den Tisch.
stepBlock(6); grab(6,'Schritt betreten');
nx().onclick();
setTimeout(()=>{ grab(6,'Gegner hebt ab'); },800);
setTimeout(()=>{ grab(6,'Gegner legt ab'); },2400);
setTimeout(()=>{
  {
    boxBlock(6); doneBlock(); nx().onclick();

    // ── 7 leeres Feld ─────────────────────────────────────────────
    stepBlock(7);
    tap('1C'); grab(7,'1C angetippt');
    tap('1D'); grab(7,'Zug ausgeführt');
    boxBlock(7); doneBlock(); nx().onclick();

    // ── 8 Gegenzug 2 ──────────────────────────────────────────────
    stepBlock(8); grab(8,'Schritt betreten');
    nx().onclick();
    setTimeout(()=>{ grab(8,'Gegner hebt ab'); },800);
    setTimeout(()=>{ grab(8,'Gegner legt ab'); },2400);
    setTimeout(()=>{
      {
        boxBlock(8); doneBlock(); nx().onclick();

        // ── 9 Dreierreihe ─────────────────────────────────────────
        stepBlock(9);
        tap('3C'); grab(9,'3C angetippt');
        tap('3B'); grab(9,'Zug ausgeführt');
        boxBlock(9); doneBlock(); nx().onclick();

        // ── 10 Bonuszug ───────────────────────────────────────────
        stepBlock(10);
        tap('3B'); grab(10,'gesperrte Einzelfigur angetippt');
        tap('4B'); grab(10,'zweite gesperrte Einzelfigur angetippt');
        tap('2B'); grab(10,'eigener Stapel angetippt');
        tap('1C'); grab(10,'Zug ausgeführt');
        boxBlock(10); doneBlock(); nx().onclick();

        // ── 11 Anhang ─────────────────────────────────────────────
        stepBlock(11);
        out.push('');
        finish();
      }
    },3600);
  }
},3600);

function finish(){
  const head=[
    '# Count Red — Interaktive Spielanleitung: alle Texte',
    '',
    '**Quelle: `anleitung.html` · Stand: Session 26 · gebaut gegen Build v108 / `gembel_rules.js` v2.1**',
    '',
    '> Diese Datei ist **erzeugt**, nicht abgeschrieben: ein Skript bedient `anleitung.html`',
    '> im DOM und fängt jeden Text ab, den ein Lernender wirklich zu sehen bekommt.',
    '> Sie kann deshalb nicht von der Auslieferung abweichen.',
    '>',
    '> **Änderungen gehören in `anleitung.html`, nicht hierher.** Diese Datei danach neu erzeugen.',
    '',
    '---',
    '',
    '## Aufbau',
    '',
    'Elf Schritte. Der Lernende ist durchgehend **Spieler 1 mit ungerader Parität** — fest,',
    'weil der Text sonst nicht „du brauchst ungerade" sagen könnte. Schritt 11 sagt ausdrücklich,',
    'dass es im echten Spiel gespiegelt sein kann.',
    '',
    'Jeder Schritt hat bis zu vier Textsorten:',
    '',
    '| Sorte | wo | wann |',
    '|---|---|---|',
    '| **Erklärtext** | Kasten über dem Brett | beim Betreten des Schritts |',
    '| **Aufgabe** | blaue Zeile darunter | solange die Aufgabe offen ist |',
    '| **Erklärkasten** | unter dem Brett | bei jedem Antippen — mit der ausgerechneten Parität |',
    '| **Nach dem Schritt** | ersetzt den Erklärtext | sobald die Aufgabe erfüllt ist |',
    '',
    'Die Zahlen im Erklärkasten stehen hier so, wie sie in der geprüften Lehrpartie wirklich',
    'erscheinen — sie sind keine Beispiele, sondern die tatsächlichen Werte.',
    '',
    '---',
    '',
    '## Die elf Schritte'
  ];

  const tail=[
    '---',
    '',
    '## Bedienelemente',
    '',
    '| Element | Text |',
    '|---|---|',
    '| Kopfzeile links | `COUNT · RED` |',
    '| Kopfzeile rechts | `Schritt N von 11` |',
    '| Knopf links | `Zurück` |',
    '| Knopf Mitte | `Nochmal` |',
    '| Knopf rechts, normal | `Weiter` |',
    '| Knopf rechts, Gegenzug-Schritt | `Gegner ziehen lassen` |',
    '| Knopf rechts, letzter Schritt | `Zum Spiel` |',
    '',
    '## Wiederkehrende Zeilen im Erklärkasten',
    '',
    '| Anlass | Text |',
    '|---|---|',
    '| Schritt betreten (Antipp- oder Zugschritt) | `Tippe das genannte Feld an.` |',
    '| Schritt betreten (Gegenzug) | `Tippe auf **Weiter** — dann zieht der Gegner.` |',
    '| Falsches Feld im Antipp-Schritt | `In diesem Schritt geht es um **XY**.` |',
    '| Aufgehobene Figur wieder abgesetzt | `Figur wieder abgesetzt.` |',
    '| Zug ausgeführt, ohne Besonderheit | `Gezogen.` + Begründung |',
    '',
    '## Bausteine der Paritätsrechnung',
    '',
    'Diese Sätze setzt die Anleitung zur Laufzeit zusammen. Die Zahlen kommen aus der',
    'kanonischen Regelschicht, nicht aus einer eigenen Rechnung.',
    '',
    '**Abheben, freie Einzelfigur**',
    '',
    '> Rote Nachbarn von *FELD*: **n** · die Figur selbst ist rot: **+1** _(oder: ist schwarz: **+0**)_ → **Summe = gerade/ungerade**.',
    '',
    '**Abheben, Stapel**',
    '',
    '> Auf *FELD* steht **dein** Stapel. Die obere Figur darfst du abheben — **ohne** Paritätsprüfung.',
    '',
    '> Auf *FELD* steht der Stapel des Gegners. Nur wer einen Stapel gebildet hat, darf ihn wieder auflösen.',
    '',
    '**Abheben, gesperrtes Feld**',
    '',
    '> *FELD* gehört zu einer gesperrten Dreierreihe. Eine **einzelne** Figur ist dort unbeweglich.',
    '',
    '**Ablegen auf ein leeres Feld**',
    '',
    '> Punktzahl passt (**n** auf ein n-Punkte-Feld). Rote Nachbarn von *FELD* _nach_ dem Zug — Quellfeld zählt nicht mit: **n** · die zurückbleibende Stapelfigur ist rot: **+1** · die Figur selbst ist rot: **+1** → **Summe = gerade/ungerade**.',
    '',
    '**Ablegen, Punktzahl passt nicht**',
    '',
    '> Die Figur trägt die **n**, das Feld *FELD* ist **m** Punkte wert. Auf ein leeres Feld darf nur, was zur Punktzahl passt.',
    '',
    '**Stapeln**',
    '',
    '> Beim Stapeln zählen **nur die Figuren im neuen Stapel** — keine Nachbarn. Rote darin: **n = gerade/ungerade**.',
    '',
    '> Auf *FELD* steht schon ein Stapel. Mehr als zwei Figuren gehen nicht.',
    '',
    '---',
    '',
    '## Meldungen, die hoffentlich nie erscheinen',
    '',
    'Die Anleitung prüft beim Laden, ob ihre Erklärungen mit der Regelschicht übereinstimmen.',
    'Tun sie das nicht, wird **nicht** gelehrt.',
    '',
    '**Selbsttest beim Laden fehlgeschlagen** — Brett und Text werden ausgeblendet:',
    '',
    '> **Selbsttest fehlgeschlagen.** Diese Anleitung stimmt nicht mit der Regelschicht überein und wird deshalb nicht angezeigt:',
    '> · *(Liste der Abweichungen)*',
    '',
    '**Abweichung während der Bedienung** — die Anleitung hält an:',
    '',
    '> **Die Anleitung stoppt hier.** Erklärung und Regelschicht stimmen nicht überein (*Stelle*).',
    '> Das ist ein Fehler in der Anleitung, nicht im Spiel — bitte melden.',
    '> Bis dahin gelten die Regeln aus dem Spiel, nicht diese Seite.',
    '',
    '---',
    '',
    '## Wo die Anleitung an den Regeltext des Spiels anschließt',
    '',
    'Die kanonische Textquelle ist das Regeln-Overlay in `index.html` (dreizehn Blöcke von „Ziel"',
    'bis „Remis"). Die Anleitung erklärt dieselben Regeln, aber in der Reihenfolge, in der sie am',
    'Brett auftauchen, und sie lässt weg, was ein Neuling in den ersten Zügen nicht braucht.',
    '',
    '| Block im Regeln-Overlay | in der Anleitung |',
    '|---|---|',
    '| Ziel | Schritt 1 |',
    '| Brett · Figuren | Schritt 2 |',
    '| Spieler & Parität · Wegziehen | Schritte 3–4 |',
    '| Zugrichtung & Zugweite | Schritt 1 (nebenbei) |',
    '| Stapeln | Schritt 5 |',
    '| Abstellen auf leeres Feld | Schritte 6–7 |',
    '| Dreierreihe → Bonuszug | Schritte 9–10 |',
    '| Entstapeln | Schritt 10 (als Bonuszug), Regel im Anhang |',
    '| Zugverzicht · Remis · Spielbeginn · Revanche | Schritt 11 |',
    '',
    'Bewusst **nicht** in der Anleitung: die Remis-Uhr im Detail, die Wiederholungsschwellen als',
    'Rechenregel, und alles, was das Spiel selbst anzeigt. Begründung: die fünf Neuling-Partien',
    'vom 2.8. waren nach durchschnittlich sieben eigenen Zügen vorbei — diese Regeln erreicht',
    'ein Anfänger in seiner ersten Partie gar nicht, und die Aufmerksamkeit fehlt dann bei der',
    'Parität.'
  ];

  const md=head.concat(out).concat(['',...tail]).join('\n')+'\n';
  fs.writeFileSync(DIR+'/ANLEITUNG_TEXTE.md',md);
  console.log('geschrieben: ANLEITUNG_TEXTE.md — '+md.split('\n').length+' Zeilen, '+md.length+' Zeichen');
}
