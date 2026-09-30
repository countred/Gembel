'use strict';
// pruef_sichtbar.js — §211 (29.9.): die Pruefung „kein sichtbarer Text ausserhalb der Textschicht"
// als gemeinsame Datei fuer test_ui_97 (Spiel, seit §207) und test_anleitung_137 (Anleitung, §211).
// Herausgeloest aus test_ui_97 OHNE Aenderung der Logik — kopiert waere sie ein Zwilling, der
// auseinanderlaeuft (P9). Die Seiten-eigenen Listen (Ausnahmen, Kennungen, Wortschatz) gibt der
// Aufrufer mit; hier steht nur, WIE geprueft wird.
//
// pruefeSichtbar(html, { erlaubt:[[RegExp, Grund]], kennungen:Set, wortschatz:Set,
//                        stillZusatz:[Aufrufname], tabellen:[Anfangszeichenkette] })
//   → { gesehen, erlaubtGesehen, befunde:[…] }
// `tabellen`: jede Tabelle beginnt mit dieser Zeichenkette und endet an der naechsten Zeile
// „};" — sie ist der erlaubte Ort fuer Wortlaut und wird durch Leerzeilen ersetzt, damit die
// Zeilennummern der Befunde auf die Seite passen.
function pruefeSichtbar(html, opt){
  opt = opt || {};
  const ERLAUBT = opt.erlaubt || [], KENNUNGEN = opt.kennungen || new Set(), WORTSCHATZ = opt.wortschatz || new Set();
  // ── Zerleger: liefert jede String- und Template-Zeichenkette mit ihrem Umfeld ──
  function zerlege(code, zeile0){
    const aus = [];
    const stapel = [];            // {art:'(' | '{' | '[', name}
    let i = 0, letztes = '';      // letztes bedeutsames Zeichen/Wort (Regex-Erkennung)
    const zeileVon = p => zeile0 + code.slice(0, p).split('\n').length - 1;
    const REGEX_VOR = /^(?:[(,=:[!&|?{};+\-*%<>~^]|return|typeof|case|else|in|of|void|delete|throw|new|)$/;
    function merke(text, anfang, ende, html){
      let vor = code.slice(0, anfang).replace(/\s+$/, ''), nach = code.slice(ende).replace(/^\s+/, '');
      aus.push({ text, zeile: zeileVon(anfang), html: html || /[<>]/.test(text), vorText: vor.slice(-40),
                 stapel: stapel.map(x => Object.assign({}, x)),
                 vorZeichen: vor.slice(-1), nachZeichen: nach.slice(0, 1),
                 vergleich: /[!=]==?$/.test(vor) || /^[!=]==?/.test(nach) });
    }
    function wort(p){ const m = code.slice(0, p).match(/([A-Za-z_$][\w$]*)\s*$/); return m ? m[1] : ''; }
    function zeichenkette(q){      // i steht auf dem Anfuehrungszeichen
      const a = i; i++; let t = '';
      while(i < code.length && code[i] !== q){
        if(code[i] === '\\'){ t += code[i+1] === 'n' ? '\n' : code[i+1]; i += 2; continue; }
        t += code[i++];
      }
      i++; merke(t, a, i, false); letztes = 'x';
    }
    function vorlage(){            // i steht auf dem Backtick
      let a = ++i, t = '';
      while(i < code.length && code[i] !== '`'){
        if(code[i] === '\\'){ t += code[i+1]; i += 2; continue; }
        if(code[i] === '$' && code[i+1] === '{'){
          merke(t, a, i, true); t = '';
          i += 2; stapel.push({ art:'${', name:'' }); lauf('}'); stapel.pop(); i++; a = i; continue;
        }
        t += code[i++];
      }
      merke(t, a, i, true); i++; letztes = 'x';
    }
    function lauf(bis){
      while(i < code.length){
        const ch = code[i];
        if(bis && ch === bis && !stapel.some((x,n) => n === stapel.length-1 && x.art !== '${')) return;
        if(ch === '/' && code[i+1] === '/'){ while(i < code.length && code[i] !== '\n') i++; continue; }
        if(ch === '/' && code[i+1] === '*'){ i = code.indexOf('*/', i+2); i = i < 0 ? code.length : i+2; continue; }
        if(ch === '"' || ch === "'"){ zeichenkette(ch); continue; }
        if(ch === '`'){ vorlage(); continue; }
        if(ch === '/' && REGEX_VOR.test(letztes)){
          i++; let klasse = false;
          while(i < code.length && (code[i] !== '/' || klasse)){
            if(code[i] === '\\') i++; else if(code[i] === '[') klasse = true; else if(code[i] === ']') klasse = false;
            i++;
          }
          i++; while(/[a-z]/.test(code[i]||'')) i++; letztes = 'x'; continue;
        }
        if(ch === '(' || ch === '[' || ch === '{'){ stapel.push({ art: ch, name: ch === '(' ? wort(i) : '' }); letztes = ch; i++; continue; }
        if(ch === ')' || ch === ']' || ch === '}'){
          if(ch === '}' && stapel.length && stapel[stapel.length-1].art === '${') return;
          stapel.pop(); letztes = ch; i++; continue;
        }
        if(/\s/.test(ch)){ i++; continue; }
        if(/[A-Za-z_$]/.test(ch)){ const m = code.slice(i).match(/^[\w$]+/)[0]; letztes = m; i += m.length; continue; }
        letztes = ch; i++;
      }
    }
    lauf('');
    return aus;
  }

  // ── Skriptteil der Auslieferung, Tabelle ausgenommen ──
  let ohneTabelle = html;
  for(const anfang of (opt.tabellen || ['const TEXTE = {'])){
    const tA = ohneTabelle.indexOf(anfang), tB = ohneTabelle.indexOf('\n};', tA);
    if(tA < 0 || tB < 0) continue;
    ohneTabelle = ohneTabelle.slice(0, tA) + ohneTabelle.slice(tA, tB + 3).replace(/[^\n]/g, '') + ohneTabelle.slice(tB + 3);
  }
  const skripte = [];
  for(const m of ohneTabelle.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g))
    skripte.push({ code: m[1], zeile0: ohneTabelle.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length });
  const alle = skripte.flatMap(s => zerlege(s.code, s.zeile0));

  // Aufrufe, deren Zeichenketten nie angezeigt werden (Konsole, Nachschlagen, DOM-Suche,
  // Speicher, Datenbankpfade, Fehlerobjekte fuer den Programmfluss).
  const STILL = new Set([...(opt.stillZusatz || []),'txt','log','warn','error','info','debug','getElementById','querySelector',
    'querySelectorAll','addEventListener','removeEventListener','getItem','setItem','removeItem','ref','child',
    'add','remove','toggle','contains','startsWith','endsWith','includes','indexOf','split','replace','matchMedia',
    'setAttribute','getAttribute','hasAttribute','removeAttribute','createElement','closest','showOverlay',
    'Worker','importScripts','fetch','join','padStart','test','match','Error','postMessage','getPropertyValue',
    'setProperty','orderByChild','replaceState','dispatchEvent','Event','CustomEvent']);
  const still = f => {
    for(let n = f.stapel.length-1; n >= 0; n--){
      const x = f.stapel[n];
      if(x.art === '(' && STILL.has(x.name)) return true;
      if(x.art === '{' || x.art === '${') return false;     // ein Objekt/Einschub dazwischen: Wert zaehlt
    }
    return false;
  };
  const befunde = [];
  let gesehen = 0, erlaubtGesehen = 0;
  for(const f of alle){
    gesehen++;
    if(still(f)) continue;
    const obj = f.stapel.length ? f.stapel[f.stapel.length-1].art : '';
    if(!f.html && f.nachZeichen === ':' && (f.vorZeichen === '{' || f.vorZeichen === ',') && obj === '{') continue; // Objektschluessel
    if(!f.html && f.vorZeichen === '[' && f.nachZeichen === ']') continue;                                         // obj['x']
    // Zuweisung an eine Eigenschaft, die nie Text ist (Klasse, Kennung, Stil, Adresse)
    if(/(className|\.id|\.type|\.href|\.src|\.cssText|style\.[A-Za-z]+)\s*\+?=\s*$/.test(f.vorText)) continue;
    // Sichtbarer Anteil: Tags und Tag-Reste heraus, Attributwerte mit Text dazu
    let t = f.text;
    const attr = [...t.matchAll(/\b(?:title|aria-label|placeholder|alt)="([^"$]+)"/g)].map(m => m[1]);
    if(f.html){
      t = t.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ')
           .replace(/^[^<>]*?>/, m => /["=]/.test(m) ? ' ' : m).replace(/<[^>]*$/, ' ');
    }
    t = t.replace(/&[a-z]+;|&#\d+;/gi, ' ');
    const teile = t.split(/\s{2,}|\n/).map(x => x.trim()).filter(Boolean).concat(attr);
    for(const x of teile){
      if(!/[A-Za-z\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df]{2,}/.test(x)) continue;
      if(/^[a-z0-9_.#:-]+$/.test(x)){                            // Kennung, Schluessel, Ereignisname …
        if(/^[a-z\u00e4\u00f6\u00fc\u00df]+$/.test(x) && WORTSCHATZ.has(x) && !KENNUNGEN.has(x) && !f.vergleich)
          befunde.push('Z.' + f.zeile + ' [WORT DER TABELLE] ' + JSON.stringify(x));   // … oder doch ein Wort
        continue;
      }
      if(/^[A-Z0-9_]+$/.test(x) || /^[a-z]+[A-Z][A-Za-z]*$/.test(x)) continue;   // KONSTANTE, camelCase
      if(/^(https?:|data:|var\(|rgba?\(|calc\(|#[0-9a-f]{3,8}\b)/i.test(x)) continue;
      if(/^[\w.\/-]+\.(html|js|jpg|png|json)([?#][\w=&.-]*)?$/.test(x)) continue;          // Dateiname, Adresse
      if(/^([a-z-]+:[^;\s]+;?)+$/.test(x)) continue;                                        // CSS-Deklaration
      if(/^["')\s]*(style|class|onclick|disabled|type|href)\b/.test(x) || /=\\?"/.test(x) || /^"\s/.test(x)) continue;
      if(f.vergleich && !/[\s\u00c4\u00d6\u00dc\u00e4\u00f6\u00fc\u00df]/.test(x)) continue;   // Vergleich auf ein Wort: Taste/Zustand
      if(ERLAUBT.some(([re]) => re.test(x))){ erlaubtGesehen++; continue; }
      befunde.push('Z.' + f.zeile + (f.vergleich ? ' [VERGLEICH]' : '') + ' ' + JSON.stringify(x));
    }
  }
  return { gesehen, erlaubtGesehen, befunde };
}
module.exports = pruefeSichtbar;
