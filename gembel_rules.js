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
//   Alle Dateien (gembel_ai_u*, gembel_ai_g*, gembel_kiki_*, gembel.html,
//   gembel_replay.html) binden diese Datei per <script src="gembel_rules.js">
//   ein — kein Copy-Paste der Regellogik.
//
// SPIELREGELN (kanonisch, nicht verändern ohne Regelklärung):
//   - KEINE REICHWEITENREGEL: Figuren dürfen auf jedes Feld des Bretts gezogen
//     werden. Es gibt keine Distanzbeschränkung. Jeder Filter der Züge auf
//     "benachbarte Felder" einschränkt ist FALSCH.
//   - Stripe-Match: Nur beim Ablegen auf ein LEERES Feld (canPlaceOnEmpty).
//     Beim Stapeln (canStack) und beim Abheben vom Stack (canLift) gilt KEIN
//     Stripe-Match für die bewegte Figur.
//   - Einzelstein auf gesperrtem Feld: nicht hebbar (canLift gibt false).
//   - Stapel auf gesperrtem Feld: Top-Stein hebbar wenn formedBy===currentPlayer.
//   - Parity: gezählt werden alle roten Figuren in der Nachbarschaft des
//     ZIELFELDES (bei leerem Ziel) bzw. rote Figuren im neuen Stapel (beim
//     Stapeln). Beim Abheben keine Paritätsprüfung für Stack-Owner.
//
//   - `board`         : globales 4×4-Spielfeld (Array of Arrays)
//   - `currentPlayer` : 1 oder 2
//   - `PARITY_P1`     : 'odd' oder 'even' — Parität von Spieler 1
//
// KOORDINATENSYSTEM:
//   r=0 = Z4 (unterste Reihe), r=3 = Z1 (oberste Reihe)
//   c=0 = A, c=1 = B, c=2 = C, c=3 = D
//
// VERSION: 1.0 (2026-06-02)
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

function countRedNeighbors(r,c,exR,exC){
  let n=0;
  for(const [dr,dc] of ALL8){
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>3||nc<0||nc>3) continue;
    if(exR!==undefined && nr===exR && nc===exC) continue;
    const cell=board[nr][nc];
    if(cell.stack){
      if(cell.stack.bottom.color==='red') n++;
      if(cell.stack.top.color==='red') n++;
    } else if(cell.piece && cell.piece.color==='red') n++;
  }
  return n;
}

function countRedsInStack(b,t){ return (b.color==='red'?1:0)+(t.color==='red'?1:0); }

// ── Paritätsprüfung ────────────────────────────────────────────────
// PARITY_P1 ist extern definiert ('odd' oder 'even').
// parityOk(n, player): true wenn Rot-Summe n zur Parität von player passt.

function parityOk(n,p){
  const p1NeedsOdd = (PARITY_P1 === 'odd');
  if(p===1) return p1NeedsOdd ? n%2===1 : n%2===0;
  else       return p1NeedsOdd ? n%2===0 : n%2===1;
}

// parityOkFor(piece, player): Hilfsfunktion für freeRed-Bewertung in evaluate.
function parityOkFor(piece, player){
  return parityOk(piece.color==='red' ? 1 : 0, player);
}

// ── Zugerlaubnis-Prüfungen (Regelschicht) ──────────────────────────
//
// WICHTIG: Diese Funktionen definieren was legal ist.
// Die Heuristik darf diese Prüfungen nicht abschwächen oder umgehen.

function canLift(r,c){
  const cell=board[r][c];
  const moving=getMovingPiece(cell);
  if(!moving) return false;
  // Stapel: nur der Stapelersteller darf den Top-Stein heben.
  if(cell.stack){ return cell.stack.formedBy===currentPlayer; }
  // Einzelstein auf gesperrtem Feld: unbeweglich.
  if(cell.locked) return false;
  // Freier Einzelstein: Paritätsprüfung.
  let w=countRedNeighbors(r,c);
  if(moving.color==='red') w++;
  return parityOk(w, currentPlayer);
}

function canPlaceOnEmpty(mp,fr,fc,tr,tc){
  const to=board[tr][tc];
  if(to.piece) return false;
  // Stripe-Match: Figur muss zum Zielfeld passen.
  if(mp.stripe!==to.stripe) return false;
  let w=countRedNeighbors(tr,tc,fr,fc);
  // Wenn Quelle ein Stapel ist: Bottom-Stein bleibt als Nachbar.
  const fromCell=board[fr][fc];
  if(fromCell.stack){
    const dr=Math.abs(fr-tr), dc=Math.abs(fc-tc);
    if(dr<=1 && dc<=1 && !(dr===0&&dc===0))
      if(fromCell.stack.bottom.color==='red') w++;
  }
  if(mp.color==='red') w++;
  return parityOk(w, currentPlayer);
}

function canStack(mp,tr,tc){
  const to=board[tr][tc];
  // Kein Stapeln auf leere, bereits gestapelte oder gesperrte Felder.
  if(!to.piece||to.stack||to.locked) return false;
  return parityOk(countRedsInStack(to.piece,mp), currentPlayer);
}

function canDrop(fr,fc,tr,tc){
  if(fr===tr&&fc===tc) return false;
  // !! KEINE REICHWEITENREGEL !!
  // Figuren dürfen auf JEDES Feld des Bretts gezogen werden — nicht nur auf
  // benachbarte Felder. Es gibt keine Distanzbeschränkung in Gembel.
  // Eine frühere fehlerhafte Implementierung hatte Math.abs(fr-tr)>1 ||
  // Math.abs(fc-tc)>1 als Filter in getLegalMoves — das war FALSCH und wurde
  // entfernt. Diese Anmerkung verhindert dass der Fehler erneut eingebaut wird.
  const mp=getMovingPiece(board[fr][fc]);
  if(!mp) return false;
  if(!board[tr][tc].piece) return canPlaceOnEmpty(mp,fr,fc,tr,tc);
  return canStack(mp,tr,tc);
}

function getValidTargets(r,c){
  const t=[];
  for(let nr=0;nr<4;nr++) for(let nc=0;nc<4;nc++)
    if(canDrop(r,c,nr,nc)) t.push([nr,nc]);
  return t;
}

function getLegalMoves(player){
  const saved=currentPlayer; currentPlayer=player;
  const moves=[];
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    if(canLift(r,c)){
      const targets=getValidTargets(r,c);
      for(const [tr,tc] of targets) moves.push({fr:r,fc:c,tr,tc});
    }
  }
  currentPlayer=saved;
  return moves;
}

function hasAnyMove(player){ return getLegalMoves(player).length > 0; }

// ── Zugausführung (live board, mutierend) ──────────────────────────

function applyMove(fr,fc,tr,tc,player){
  const from=board[fr][fc], to=board[tr][tc];
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

// ── Dreier- und Vierererkennung (live board) ───────────────────────

function checkThreeInRow(color){
  for(let c=0;c<4;c++){
    for(let rS=0;rS<=1;rS++){
      let ok=true; const pos=[];
      for(let i=0;i<3;i++){
        const r=rS+i;
        const base=getBasePiece(board[r][c]);
        if(!base||base.color!==color||base.stripe!==board[r][c].stripe){ok=false;break;}
        pos.push([r,c]);
      }
      if(ok && pos.length===3 && !pos.every(([r2,c2])=>board[r2][c2].locked)) return pos;
    }
  }
  return null;
}

function checkFourInRow(color){
  for(let c=0;c<4;c++){
    let ok=true; const pos=[];
    for(let r=0;r<4;r++){
      const base=getBasePiece(board[r][c]);
      if(!base||base.color!==color){ok=false;break;}
      pos.push([r,c]);
    }
    if(ok && pos.length===4) return pos;
  }
  return null;
}

// ── Board-Clone und Hash (für Minimax) ────────────────────────────

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

// boardHash / boardHashOn:
// formedBy wird BEWUSST NICHT gehasht (SFQJ-Bug-Fix, ai-u-1.4):
// formedBy bestimmt nur wer abheben darf, definiert nicht die Spielposition.
// Positionsidentität wird vollständig durch Farbe, Stripe und locked erfasst.

function boardHash(){
  let h=currentPlayer+'|';
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const cell=board[r][c];
    if(cell.stack)
      h+=`S${cell.stack.bottom.color[0]}${cell.stack.bottom.stripe}${cell.stack.top.color[0]}${cell.stack.top.stripe}`;
    else if(cell.piece)
      h+=`P${cell.piece.color[0]}${cell.piece.stripe}`;
    else h+='E';
    h+=cell.locked?'L':'_'; h+=',';
  }
  return h;
}

function boardHashOn(b){
  let h=currentPlayer+'|';
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

// ── Minimax-Hilfsfunktionen (auf geklontem Board) ──────────────────

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

function legalMovesOn(b, player){
  const savedBoard=board, savedPlayer=currentPlayer;
  board=b; currentPlayer=player;
  const moves=getLegalMoves(player);
  board=savedBoard; currentPlayer=savedPlayer;
  return moves;
}
