// ═══════════════════════════════════════════════════════════════════
// gembel_rules.js — Kanonische Regelschicht für Gembel · Count Red
// ═══════════════════════════════════════════════════════════════════
//
// ARCHITEKTURPRINZIP (unveränderlich):
//   Diese Datei enthält ausschließlich Spielregeln — keine Heuristik,
//   keine KI-Logik, keine UI-Logik.
//
//   Die Heuristik (evaluate, Term 1–N) darf NIEMALS Regeln abschwächen,
//   umgehen oder außer Kraft setzen. Regelschicht und Heuristikschicht
//   sind strikt getrennt.
//
//   Skalierung der Spielstärke = reduzierte Suchtiefe oder verrauschte
//   Scores — NIEMALS lockere Regeln.
//
//   Jeder neue Heuristik-Term muss vor Einbau geprüft werden:
//   "Kann dieser Term dazu führen dass eine illegale Position bevorzugt
//    oder eine Regelprüfung umgangen wird?"
//
// VERWENDUNG:
//   Einbinden per <script src="gembel_rules.js"> — VOR dem eigenen
//   Script-Block. KEINE globalen Variablen erforderlich. Alle Funktionen
//   sind zustandslos und bekommen Board/Player als Parameter.
//
// SPIELREGELN (kanonisch, nicht verändern ohne Regelklärung):
//   - KEINE REICHWEITENREGEL: Figuren dürfen auf JEDES Feld des Bretts
//     gezogen werden. Kein Distanzfilter. Jeder Filter Math.abs(fr-tr)>1
//     oder Math.abs(fc-tc)>1 ist FALSCH und darf nicht eingebaut werden.
//   - Stripe-Match: NUR beim Ablegen auf ein LEERES Feld (canPlaceOnEmpty).
//     Beim Stapeln (canStack) und beim Abheben vom Stack (canLift) gilt
//     KEIN Stripe-Match für die bewegte Figur.
//   - Einzelstein auf gesperrtem Feld: nicht hebbar.
//   - Stapel auf gesperrtem Feld: Top-Stein hebbar wenn formedBy===player.
//   - Stapeln auf gesperrte Einzelfigur: ERLAUBT. Basisfigur bleibt,
//     neuer Stapel entsteht darüber. Entstapeln ebenfalls erlaubt.
//   - Parity beim leeren Ziel: alle roten Figuren in der Nachbarschaft des
//     Zielfeldes zählen (exkl. Quellfeld). Beim Stapeln: rote Figuren im
//     neuen Stapel zählen. Beim Abheben vom Stack: keine Paritätsprüfung.
//
// KOORDINATENSYSTEM:
//   r=0 = Z4 (unterste Reihe), r=3 = Z1 (oberste Reihe)
//   c=0 = A, c=1 = B, c=2 = C, c=3 = D
//
// API — alle Funktionen sind zustandslos (kein globaler Zustand):
//   b        = Board (4×4 Array)
//   player   = 1 oder 2
//   p1parity = 'odd' oder 'even' (Parität von Spieler 1)
//
// VERSION: 2.1 (2026-06-09) — canStack-Bugfix: Stapeln auf gesperrte Einzelfiguren erlaubt
// BUGFIX 2.1: canStack hatte fälschlich || to.locked — regelwidrig entfernt.
//   Regel: Auf JEDE Einzelfigur darf gestapelt werden, egal ob das Feld locked ist.
//   Die Basisfigur bleibt stehen, der Stapel entsteht darüber.
//   Betrifft alle Runs r7–r26 (Kiki) und alle bisherigen Spieler-KI-Versionen.
// ═══════════════════════════════════════════════════════════════════

// ── Hilfsfunktionen ────────────────────────────────────────────────

function pieceColor(r,c){ return (r+c)%2===0 ? 'red' : 'black'; }

function initBoard(){
  const b=[];
  for(let r=0;r<4;r++){
    b[r]=[];
    for(let c=0;c<4;c++)
      b[r][c]={stripe:r, piece:{color:pieceColor(r,c),stripe:r}, stack:null, locked:false};
  }
  return b;
}

function coordToLabel(r,c){
  return ({3:'1',2:'2',1:'3',0:'4'})[r]+({0:'A',1:'B',2:'C',3:'D'})[c];
}

function getMovingPiece(cell){ return cell.stack ? cell.stack.top : cell.piece; }
function getBasePiece(cell){ if(!cell.piece) return null; return cell.stack ? cell.stack.bottom : cell.piece; }

const ALL8=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

// ── Rot-Zählung ────────────────────────────────────────────────────

function countRedNeighbors(b,r,c,exR,exC){
  let n=0;
  for(const [dr,dc] of ALL8){
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>3||nc<0||nc>3) continue;
    if(exR!==undefined && nr===exR && nc===exC) continue;
    const cell=b[nr][nc];
    if(cell.stack){
      if(cell.stack.bottom.color==='red') n++;
      if(cell.stack.top.color==='red') n++;
    } else if(cell.piece && cell.piece.color==='red') n++;
  }
  return n;
}

function countRedsInStack(bot,top){ return (bot.color==='red'?1:0)+(top.color==='red'?1:0); }

// ── Paritätsprüfung ────────────────────────────────────────────────

function parityOk(n, player, p1parity){
  const p1odd = (p1parity === 'odd');
  if(player===1) return p1odd ? n%2===1 : n%2===0;
  else           return p1odd ? n%2===0 : n%2===1;
}

function parityOkFor(piece, player, p1parity){
  return parityOk(piece.color==='red' ? 1 : 0, player, p1parity);
}

// ── Zugerlaubnis-Prüfungen (Regelschicht) ──────────────────────────
//
// WICHTIG: Diese Funktionen definieren was legal ist.
// Die Heuristik darf diese Prüfungen nicht abschwächen oder umgehen.

function canLift(b, r, c, player, p1parity){
  const cell=b[r][c];
  const moving=getMovingPiece(cell);
  if(!moving) return false;
  // Stapel: nur der Stapelersteller darf den Top-Stein heben.
  if(cell.stack){ return cell.stack.formedBy===player; }
  // Einzelstein auf gesperrtem Feld: unbeweglich.
  if(cell.locked) return false;
  // Freier Einzelstein: Paritätsprüfung.
  let w=countRedNeighbors(b,r,c);
  if(moving.color==='red') w++;
  return parityOk(w, player, p1parity);
}

function canPlaceOnEmpty(b, mp, fr, fc, tr, tc, player, p1parity){
  const to=b[tr][tc];
  if(to.piece) return false;
  // Stripe-Match: Figur muss zum Zielfeld passen.
  if(mp.stripe!==to.stripe) return false;
  let w=countRedNeighbors(b,tr,tc,fr,fc);
  // Wenn Quelle ein Stapel ist: Bottom-Stein bleibt als Nachbar.
  const fromCell=b[fr][fc];
  if(fromCell.stack){
    const dr=Math.abs(fr-tr), dc=Math.abs(fc-tc);
    if(dr<=1 && dc<=1 && !(dr===0&&dc===0))
      if(fromCell.stack.bottom.color==='red') w++;
  }
  if(mp.color==='red') w++;
  return parityOk(w, player, p1parity);
}

function canStack(b, mp, tr, tc, player, p1parity){
  const to=b[tr][tc];
  // Kein Stapeln auf leere oder bereits gestapelte Felder.
  // REGEL: Stapeln auf gesperrte Einzelfiguren ist ERLAUBT — die Basisfigur
  // bleibt stehen, der neue Stapel entsteht darüber. to.locked darf hier
  // NICHT geprüft werden.
  // !! BUG-HISTORIE: bis v2.0 stand hier fälschlich || to.locked — entfernt 2026-06-09 !!
  if(!to.piece||to.stack) return false;
  return parityOk(countRedsInStack(to.piece,mp), player, p1parity);
}

function canDrop(b, fr, fc, tr, tc, player, p1parity){
  if(fr===tr&&fc===tc) return false;
  // !! KEINE REICHWEITENREGEL !!
  // Figuren dürfen auf JEDES Feld des Bretts gezogen werden.
  // Kein Distanzfilter — Math.abs(fr-tr)>1 || Math.abs(fc-tc)>1 ist FALSCH.
  const mp=getMovingPiece(b[fr][fc]);
  if(!mp) return false;
  if(!b[tr][tc].piece) return canPlaceOnEmpty(b, mp, fr, fc, tr, tc, player, p1parity);
  return canStack(b, mp, tr, tc, player, p1parity);
}

function getValidTargets(b, r, c, player, p1parity){
  const t=[];
  for(let nr=0;nr<4;nr++) for(let nc=0;nc<4;nc++)
    if(canDrop(b,r,c,nr,nc,player,p1parity)) t.push([nr,nc]);
  return t;
}

function getLegalMoves(b, player, p1parity){
  const moves=[];
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    if(canLift(b,r,c,player,p1parity)){
      const targets=getValidTargets(b,r,c,player,p1parity);
      for(const [tr,tc] of targets) moves.push({fr:r,fc:c,tr,tc});
    }
  }
  return moves;
}

function hasAnyMove(b, player, p1parity){ return getLegalMoves(b,player,p1parity).length > 0; }

// ── Zugausführung ──────────────────────────────────────────────────
// applyMove: mutiert das übergebene Board direkt (live game).
// applyMoveOn: gibt ein neues geklontes Board zurück (Minimax).

function applyMove(b, fr, fc, tr, tc, player){
  const from=b[fr][fc], to=b[tr][tc];
  const mp=getMovingPiece(from);
  if(from.stack){ from.piece=from.stack.bottom; from.stack=null; }
  else { from.piece=null; }
  if(to.piece && !to.stack){
    to.stack={bottom:to.piece, top:mp, formedBy:player};
    to.piece=to.stack.bottom;
  } else {
    mp.stripe=to.stripe;
    to.piece=mp;
  }
}

function applyMoveOn(b, fr, fc, tr, tc, player){
  const nb=cloneBoard(b);
  const from=nb[fr][fc], to=nb[tr][tc];
  const mp=from.stack ? {...from.stack.top} : {...from.piece};
  if(from.stack){ from.piece={...from.stack.bottom}; from.stack=null; }
  else { from.piece=null; }
  if(to.piece && !to.stack){
    to.stack={bottom:{...to.piece}, top:mp, formedBy:player};
    to.piece={...to.stack.bottom};
  } else {
    mp.stripe=to.stripe;
    to.piece=mp;
  }
  return nb;
}

// ── Dreier- und Vierererkennung ────────────────────────────────────

function checkThreeInRow(b, color){
  for(let c=0;c<4;c++){
    for(let rS=0;rS<=1;rS++){
      let ok=true; const pos=[];
      for(let i=0;i<3;i++){
        const r=rS+i;
        const base=getBasePiece(b[r][c]);
        if(!base||base.color!==color||base.stripe!==b[r][c].stripe){ok=false;break;}
        pos.push([r,c]);
      }
      if(ok && pos.length===3 && !pos.every(([r2,c2])=>b[r2][c2].locked)) return pos;
    }
  }
  return null;
}

function checkFourInRow(b, color){
  for(let c=0;c<4;c++){
    let ok=true; const pos=[];
    for(let r=0;r<4;r++){
      const base=getBasePiece(b[r][c]);
      if(!base||base.color!==color){ok=false;break;}
      pos.push([r,c]);
    }
    if(ok && pos.length===4) return pos;
  }
  return null;
}

function checkFourOn(b){
  for(const color of ['red','black']){
    for(let c=0;c<4;c++){
      let ok=true;
      for(let r=0;r<4;r++){
        const base=b[r][c].stack?b[r][c].stack.bottom:b[r][c].piece;
        if(!base||base.color!==color){ok=false;break;}
      }
      if(ok) return true;
    }
  }
  return false;
}

function applyLockOn(b){
  for(const color of ['red','black']){
    for(let c=0;c<4;c++){
      for(let rS=0;rS<=1;rS++){
        let ok=true; const pos=[];
        for(let i=0;i<3;i++){
          const r=rS+i;
          const cell=b[r][c];
          const base=cell.stack?cell.stack.bottom:cell.piece;
          if(!base||base.color!==color||base.stripe!==cell.stripe){ok=false;break;}
          pos.push([r,c]);
        }
        if(ok && pos.length===3 && !pos.every(([r2,c2])=>b[r2][c2].locked)){
          pos.forEach(([r2,c2])=>{b[r2][c2].locked=true;});
          return pos;
        }
      }
    }
  }
  return null;
}

// ── Board-Clone und Hash ───────────────────────────────────────────

function cloneBoard(b){
  return b.map(row=>row.map(cell=>({
    stripe: cell.stripe,
    locked: cell.locked,
    piece:  cell.piece  ? {...cell.piece}  : null,
    stack:  cell.stack  ? {
      bottom: {...cell.stack.bottom},
      top:    {...cell.stack.top},
      formedBy: cell.stack.formedBy
    } : null
  })));
}

// boardHash: formedBy wird BEWUSST NICHT gehasht (SFQJ-Bug-Fix).
// formedBy definiert nicht die Spielposition, nur wer abheben darf.
function boardHash(b, player){
  let h=player+'|';
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const cell=b[r][c];
    if(cell.stack)
      h+=`S${cell.stack.bottom.color[0]}${cell.stack.bottom.stripe}${cell.stack.top.color[0]}${cell.stack.top.stripe}`;
    else if(cell.piece)
      h+=`P${cell.piece.color[0]}${cell.piece.stripe}`;
    else h+='E';
    h+=cell.locked?'L':'_'; h+=',';
  }
  return h;
}
