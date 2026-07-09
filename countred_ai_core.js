// ═══════════════════════════════════════════════════════════════════
// countred_ai_core.js — Produkt-KI-Kern für CountRed (Mensch vs. KI)
// ═══════════════════════════════════════════════════════════════════
//
// HERKUNFT: evaluate + Achse-B-Terme + negamax transplantiert aus Kiki 3.2a
//   (HANDOVER §40b, Wegentscheidung B). Kikis evaluate ist EXAKT antisymmetrisch
//   (Selbsttest §40c: 3655 Stellungen, max |eval(1)+eval(2)| = 0).
//
// NEU (dieser Kern): Skalierungsschicht nach HANDOVER §37 — Iterative Deepening
//   mit ZEITBUDGET (adaptive Tiefe) statt fester Tiefe. Plus taktisches
//   Sicherheitsnetz (§37f) und flexible Config-Schnittstelle (§37.3).
//
// ARCHITEKTURPRINZIP (§gembel_rules.js): Diese Datei enthält KEINE Regellogik.
//   Alle Regelfunktionen (canLift/canDrop/getLegalMoves/applyMoveOn/applyLockOn/
//   checkFourOn/boardHash/cloneBoard) kommen aus gembel_rules.js (extern, §38b).
//   Die Heuristik darf Regeln NIE abschwächen. Skalierung = Tiefe/Zeit, nie Regeln.
//
// PARITÄT: PARITY_P1 wird pro Spiel extern gesetzt (Parität wechselt je Spiel, §38d).
//   evaluate(b, forPlayer) ist parametrisiert; funktioniert für beide Paritäten.
//
// STATUS: KI-Kern, framework-frei, testbar. NOCH OHNE Firebase/UI/Multiplayer —
//   die kommen bei der Zusammenführung (§38b).
// ═══════════════════════════════════════════════════════════════════

'use strict';

// ── §37.3 Config-Schnittstelle (alle Hebel als Parameter → Um-Entscheidung = Config-Wechsel) ──
// Vier Stufen aus §37d. Startwerte (MOBIL-Ziel, echte Rechenzeit vor künstl. Denkzeit).
// Werte in Kommentaren [ ] = beim Testen final.
const SKILL_LEVELS = {
  // NOTLÖSUNG §44 (7. Juli): Budgets radikal gesenkt + minDepth=1, damit pickMove den
  // UI-Thread nie lange blockiert und die MvKI-LOGIK (Bonuszug/Regeln/Animation) testbar wird.
  // Das opfert Spielstärke bewusst. Echte Budgets (§37d) kommen zurück, sobald die KI-Suche
  // im Web Worker läuft (dann blockiert sie den UI-Thread nicht mehr). Werte hier = Testwerte.
  einsteiger:      { timeBudgetMs: 150, maxDepth: 3, minDepth: 1, rankPool: 3, blockRate: 0.8, minThinkMs: 500 },
  fortgeschritten: { timeBudgetMs: 250, maxDepth: 3, minDepth: 1, rankPool: 2, blockRate: 1.0, minThinkMs: 500 },
  stark:           { timeBudgetMs: 400, maxDepth: 4, minDepth: 1, rankPool: 1, blockRate: 1.0, minThinkMs: 500 },
  meister:         { timeBudgetMs: 600, maxDepth: 4, minDepth: 1, rankPool: 1, blockRate: 1.0, minThinkMs: 500 },
};
// ── ORIGINAL-Budgets (§37d, für Web-Worker-Version wiederherstellen) ──
// einsteiger 800/maxD5/minD2/rank3/block.8 · fortgeschritten 1500/5/2/2/1 ·
// stark 3000/5/2/1/1 · meister 5000/5/2/1/1 · alle minThink 600-900

// Zeitquelle: performance.now im Browser, Date.now sonst. Injizierbar für Tests.
const _now = (typeof performance !== 'undefined' && performance.now)
  ? () => performance.now()
  : () => Date.now();

// ── §37f Taktisches Sicherheitsnetz (harte Schicht, tiefenunabhängig, ~0 ms, 1-Ply) ──
// Läuft VOR der Budget-Suche. Regelschicht bleibt strikt.
// (a) eigener 1-Zug-Sieg → immer nehmen. (b) Gegner-1-Zug-Sieg → aus Pool ausschließen
//     (mit Wahrscheinlichkeit blockRate; Einsteiger darf gelegentlich verpassen).
function findImmediateWin(b, player, p1parity){
  for(const m of getLegalMoves(b, player, p1parity)){
    const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
    if(checkFourOn(nb)) return m;
  }
  return null;
}
function movesAllowingOpponentWin(b, player, p1parity){
  // Menge der eigenen Züge, nach denen der Gegner sofort gewinnen kann.
  const opp = player === P1 ? P2 : P1;
  const bad = new Set();
  for(const m of getLegalMoves(b, player, p1parity)){
    const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
    if(checkFourOn(nb)) continue; // das ist ein eigener Sieg, nicht schlecht
    applyLockOn(nb);
    // Bonuszug? Wenn dieser Zug einen Dreier bildet, zieht player nochmal — dann
    // ist der Gegner nicht dran. Konservativ: nur prüfen wenn KEIN Bonus.
    const triple = checkFourOn(nb) ? null : null; // (Vierer schon oben behandelt)
    if(findImmediateWin(nb, opp, p1parity)) bad.add(m.fr+','+m.fc+','+m.tr+','+m.tc);
  }
  return bad;
}

// ── §37 Iterative Deepening mit Zeitbudget ──
// Rechnet Tiefe für Tiefe (1,2,3…) bis Budget erreicht oder maxDepth; behält den
// besten Zug der letzten VOLLSTÄNDIG abgeschlossenen Tiefe. minDepth wird notfalls
// über das Budget hinaus garantiert. Gibt {move, meta} zurück (§37.3, §37h-Logging).
function pickMove(board, player, p1parity, config, seenPositions){
  const cfg = (typeof config === 'string') ? SKILL_LEVELS[config] : config;
  if(!cfg) throw new Error('pickMove: unbekannte Config/Stufe');
  const t0 = _now();
  const legal = getLegalMoves(board, player, p1parity);
  if(legal.length === 0) return { move: null, meta: { reason: 'no-moves' } };

  // ── §37f (a): eigener Sofortsieg → immer nehmen ──
  const win = findImmediateWin(board, player, p1parity);
  if(win) return { move: win, meta: { safety: 'took-win', depth: 0, ms: _now()-t0 } };

  // ── §37f (b): Gegner-Sofortsieg-Züge markieren (Ausschluss je blockRate) ──
  const badMoves = movesAllowingOpponentWin(board, player, p1parity);
  const blockActive = Math.random() < cfg.blockRate; // Einsteiger: gelegentlich AUS
  const isBad = (m) => badMoves.has(m.fr+','+m.fc+','+m.tr+','+m.tc);

  // pathSet für Wiederholungserkennung: reale Partiehistorie (seenPositions) einspeisen
  const pathSet = new Set();
  if(seenPositions) for(const h of seenPositions) pathSet.add(h);
  pathSet.add(boardHash(board, player));

  // ── Iterative Deepening ──
  let bestMove = legal[0], reachedDepth = 0, budgetHit = false;
  const opp = player === P1 ? P2 : P1;

  for(let depth = 1; depth <= cfg.maxDepth; depth++){
    let localBest = -Infinity, localMove = null;
    const scored = [];
    let aborted = false;
    for(const m of legal){
      // Sicherheitsnetz: Gegner-Sieg-ermöglichende Züge meiden, solange es Alternativen gibt
      if(blockActive && isBad(m) && badMoves.size < legal.length) continue;
      // INTRA-TIEFEN-ABBRUCH (Notlösung §44): wenn das Budget schon während dieser Tiefe
      // reißt UND minDepth bereits vollständig gerechnet wurde, brich ab und BEHALTE das
      // Ergebnis der letzten VOLLSTÄNDIGEN Tiefe (bestMove von depth-1). Verhindert, dass
      // eine teure Tiefe den UI-Thread sekundenlang blockiert.
      if(depth > cfg.minDepth && (_now() - t0) >= cfg.timeBudgetMs){ aborted = true; break; }
      const nb = applyMoveOn(board, m.fr, m.fc, m.tr, m.tc, player);
      if(checkFourOn(nb)){ localBest = 100000; localMove = m; scored.push({m, v: 100000}); break; }
      const triple = applyLockOn(nb);
      const bonus = triple ? (getLegalMoves(nb, player, p1parity).length > 0 ? player : null) : null;
      const nextPlayer = bonus ? player : opp;
      const nbHash = boardHash(nb, nextPlayer);
      const branchSet = new Set(pathSet); branchSet.add(nbHash);
      let v = bonus
        ? negamax(nb, depth, -Infinity, Infinity, player, bonus, branchSet)
        : -negamax(nb, depth, -Infinity, Infinity, opp, null, branchSet);
      if(triple && Math.abs(v) < 90000) v += DREIER_FORM_BONUS;
      scored.push({m, v});
      if(v > localBest){ localBest = v; localMove = m; }
    }
    // Bei Abbruch mitten in der Tiefe: diese unvollständige Tiefe NICHT übernehmen
    // (bestMove bleibt auf dem Ergebnis der letzten vollständigen Tiefe).
    if(aborted){ budgetHit = true; break; }
    if(localMove){
      // rankPool: aus den Top-k Zügen wählen (Feinjustierung untere Stufen, §37d)
      if(cfg.rankPool > 1){
        scored.sort((a,b) => b.v - a.v);
        const pool = scored.slice(0, Math.min(cfg.rankPool, scored.length));
        bestMove = pool[Math.floor(Math.random() * pool.length)].m;
      } else {
        bestMove = localMove;
      }
      reachedDepth = depth;
    }
    const elapsed = _now() - t0;
    // Abbruch: Budget erreicht UND Mindesttiefe erfüllt
    if(elapsed >= cfg.timeBudgetMs && depth >= cfg.minDepth){ budgetHit = true; break; }
  }

  return {
    move: bestMove,
    meta: {
      depth: reachedDepth,
      ms: _now() - t0,
      budgetHit,
      safety: (blockActive && badMoves.size > 0) ? 'blocked' : 'none',
      rankPool: cfg.rankPool,
    }
  };
}

// ═══════════════════════════════════════════════════════════════════
// KI-HERZ (transplantiert aus Kiki 3.2a — HANDOVER §40b)
// ═══════════════════════════════════════════════════════════════════
// ── Konstanten (aus Kiki 3.2a übernommen) ──
const P1 = 1, P2 = 2;
const STACK_WEIGHT = 1;
const W_PARITY = 4;   // Achse-B: Paritätsverfügbarkeit freier Figuren
const W_SINGLE = 3;   // Achse-B: Stapelbesitz drohungsfreie Spalten
const W_DOUBLE = 150; // Achse-B: unblockbare Doppeldrohung
const DREIER_FORM_BONUS = 80;
const REP_DRAW_SCORE = 0;   // Wiederholung = Remiswert (Contempt)
// PARITY_P1 wird EXTERN gesetzt (pro Spiel, da Parität wechselt — §38d).

function makesRunJS(rows, k){
  for(let s=0;s<=4-k;s++){
    let ok=true;
    for(let i=0;i<k;i++) if(!rows.includes(s+i)){ok=false;break;}
    if(ok) return true;
  }
  return false;
}

function colBaseRows(b,c,color){
  const out=[];
  for(let r=0;r<4;r++){
    const base=getBasePiece(b[r][c]);
    if(base&&base.color===color) out.push(r);
  }
  return out;
}

function colHasThreat(b,c,p1parity){
  for(const color of ['red','black']){
    const br=colBaseRows(b,c,color), n=br.length;
    if(n>=3){
      for(let r=0;r<4;r++) if(!br.includes(r)) return true; // emptyRow existiert
    }
    if(n===2){
      for(let t=0;t<4;t++){
        if(br.includes(t)) continue;
        if(!b[t][c].piece && makesRunJS(br.concat([t]),3)) return true;
      }
    }
  }
  return false;
}

function parityCtrlJS(b,ai,p1parity){
  const hum = ai===1?2:1; let oa=0,oh=0;
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const cell=b[r][c];
    if(cell.stack||!cell.piece) continue;
    const la=canLift(b,r,c,ai,p1parity), lh=canLift(b,r,c,hum,p1parity);
    if(la&&!lh) oa++; else if(lh&&!la) oh++;
  }
  return oa-oh;
}

function asingleControlJS(b,ai,p1parity){
  let val=0;
  for(let c=0;c<4;c++){
    if(colHasThreat(b,c,p1parity)) continue;
    for(let r=0;r<4;r++)
      if(b[r][c].stack) val += (b[r][c].stack.formedBy===ai)?1:-1;
  }
  return val;
}

function canCompleteJS(b,tgt,c,color,party,p1parity){
  for(let sr=0;sr<4;sr++) for(let sc=0;sc<4;sc++){
    if(sr===tgt&&sc===c) continue;
    const cell=b[sr][sc];
    const mp=cell.stack?cell.stack.top:cell.piece;
    if(!mp||mp.color!==color||mp.stripe!==tgt) continue;
    if(canLift(b,sr,sc,party,p1parity)&&canDrop(b,sr,sc,tgt,c,party,p1parity)) return true;
  }
  return false;
}

function doubleThreatJS(b,ai,p1parity){
  let val=0;
  for(let c=0;c<4;c++) for(const color of ['red','black']){
    const br=colBaseRows(b,c,color);
    if(br.length!==2) continue;
    const tt=[];
    for(let t=0;t<4;t++) if(!br.includes(t)&&!b[t][c].piece&&makesRunJS(br.concat([t]),3)) tt.push(t);
    if(tt.length<2) continue;
    for(const party of [1,2]){
      const compl=tt.filter(t=>canCompleteJS(b,t,c,color,party,p1parity));
      if(compl.length<2) continue;
      const defender = party===1?2:1;
      let blockable=false;
      for(const m of getLegalMoves(b,defender,p1parity)){
        const nb=applyMoveOn(b,m.fr,m.fc,m.tr,m.tc,defender);
        let anyStill=false;
        for(const t of compl) if(!nb[t][c].piece && canCompleteJS(nb,t,c,color,party,p1parity)){anyStill=true;break;}
        if(!anyStill){blockable=true;break;}
      }
      if(!blockable) val += (party===ai)?1:-1;
    }
  }
  return val;
}

function evaluate(b, forPlayer){
  const AI_=forPlayer, HUMAN_=forPlayer===P1?P2:P1;
  let score=0;

  // ── Term V+: Spalten-Analyse mit Figurenkontrolle ────────────────
  const ALL8v=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

  for(let c=0;c<4;c++){
    for(const color of['red','black']){

      const baseRows=[];
      for(let r=0;r<4;r++){
        const base=b[r][c].stack?b[r][c].stack.bottom:b[r][c].piece;
        if(base&&base.color===color) baseRows.push(r);
      }
      const n=baseRows.length;
      if(n===0) continue;

      // ── n≥3: Gewinnfeld-Analyse ──────────────────────────────────
      if(n>=3){
        const emptyRow=[0,1,2,3].find(r=>!baseRows.includes(r));
        if(emptyRow===undefined) continue;

        // SCHRITT 1: Direkte Platzierbarkeit (Abstellen)
        // R32 PHANTOM-FIX: Eine Basis entsteht NUR auf leerem Feld.
        // canDrop auf besetztes Siegfeld waere Stapeln = keine Vollendung.
        const siegfeldFrei = !b[emptyRow][c].piece;
        let aiCanPlace=false, humCanPlace=false;
        for(let fr=0;fr<4&&!(aiCanPlace&&humCanPlace);fr++){
          for(let fc=0;fc<4&&!(aiCanPlace&&humCanPlace);fc++){
            if(fr===emptyRow&&fc===c) continue;
            const cell=b[fr][fc];
            const mp=cell.stack?cell.stack.top:cell.piece;
            if(!mp||mp.color!==color||mp.stripe!==emptyRow) continue;
            if(siegfeldFrei&&!aiCanPlace&&canLift(b,fr,fc,AI_,PARITY_P1)&&canDrop(b,fr,fc,emptyRow,c,AI_,PARITY_P1)) aiCanPlace=true;
            if(siegfeldFrei&&!humCanPlace&&canLift(b,fr,fc,HUMAN_,PARITY_P1)&&canDrop(b,fr,fc,emptyRow,c,HUMAN_,PARITY_P1)) humCanPlace=true;
          }
        }

        // SCHRITT 2: Figurenkontrolle (Aufnehmen)
        // Aktiv = Top in eigenem Stapel | Passiv = Bottom in eigenem Stapel
        // Vorübergehend = freie Figur hebbar
        let aiActive=0, aiPassive=0, humActive=0, humPassive=0;
        for(let fr=0;fr<4;fr++){
          for(let fc=0;fc<4;fc++){
            if(fr===emptyRow&&fc===c) continue;
            const cell=b[fr][fc];
            const mp=cell.stack?cell.stack.top:cell.piece;
            if(mp&&mp.color===color&&mp.stripe===emptyRow){
              if(cell.stack){
                if(cell.stack.formedBy===AI_) aiActive++;
                else humActive++;
              } else if(!cell.locked){
                if(canLift(b,fr,fc,AI_,PARITY_P1)) aiActive+=0.4;
                if(canLift(b,fr,fc,HUMAN_,PARITY_P1)) humActive+=0.4;
              }
            }
            if(cell.stack){
              const bot=cell.stack.bottom;
              if(bot&&bot.color===color&&bot.stripe===emptyRow){
                if(cell.stack.formedBy===AI_) aiPassive++;
                else humPassive++;
              }
            }
          }
        }

        // SCHRITT 3: Paritätsstabilität Nachbarschaft
        let stableAI=0, stableHUM=0;
        for(const [dr,dc] of ALL8v){
          const nr=emptyRow+dr, nc=c+dc;
          if(nr<0||nr>3||nc<0||nc>3) continue;
          const ncell=b[nr][nc];
          if(ncell.locked) continue;
          if(ncell.stack){
            if(ncell.stack.formedBy===AI_) stableAI++;
            else stableHUM++;
          }
        }
        const stabilityAdv=stableAI-stableHUM;

        // SCHRITT 4: Score
        // R30: Grundwert 'score += 150' ENTFERNT (nicht antisymmetrisch).
        // R32 SIEGFELD-VETO: versiegeltes Siegfeld (Stapel) -> Spalte keine
        // Drohung, Schluessel exklusiv beim Stapelbildner. Kontroll-/
        // Stabilitaetsterme entfallen fuer diese Spalte.
        const sfCell=b[emptyRow][c];
        if(sfCell.piece&&sfCell.stack){
          score += (sfCell.stack.formedBy===AI_ ? 80 : -80);
        } else if(aiCanPlace&&!humCanPlace){
          score += 300;
        } else if(humCanPlace&&!aiCanPlace){
          score -= 300;
        } else if(!aiCanPlace&&!humCanPlace){
          const aiCtrl=aiActive+aiPassive*0.6;
          const humCtrl=humActive+humPassive*0.6;
          if(aiCtrl>humCtrl+0.3){
            score += aiActive>=1 ? 200 : 120;
          } else if(humCtrl>aiCtrl+0.3){
            score -= humActive>=1 ? 200 : 120;
          } else {
            score += stabilityAdv*15;
          }
        } else {
          score += stabilityAdv*10;
        }
      }

      // ── n=2: Dreier-Potential ────────────────────────────────────
      if(n===2){
        const freeRows=[0,1,2,3].filter(r=>!baseRows.includes(r));
        for(const targetRow of freeRows){
          if(b[targetRow][c].piece) continue; // R32 PHANTOM-FIX: Basis nur auf leerem Feld
          // R34 KONSEKUTIVITÄTS-FIX: Nur werten, wenn {baseRows ∪ targetRow} einen
          // Block von 3 direkt aufeinanderfolgenden Reihen enthält. Sonst entsteht
          // KEIN regelkonformer Dreier (checkThreeInRow/applyLockOn verlangen
          // Konsekutivität) — Bewertung wäre ein Phantom-Dreier.
          const rowsSet=[...baseRows,targetRow];
          const makesTriple=[0,1].some(s=>[0,1,2].every(i=>rowsSet.includes(s+i)));
          if(!makesTriple) continue;
          let aiCanPlace=false, humCanPlace=false;
          let aiHasActive=false, humHasActive=false;
          for(let fr=0;fr<4;fr++){
            for(let fc=0;fc<4;fc++){
              if(fr===targetRow&&fc===c) continue;
              const cell=b[fr][fc];
              const mp=cell.stack?cell.stack.top:cell.piece;
              if(!mp||mp.color!==color||mp.stripe!==targetRow) continue;
              if(canLift(b,fr,fc,AI_,PARITY_P1)&&canDrop(b,fr,fc,targetRow,c,AI_,PARITY_P1)){
                aiCanPlace=true;
                if(cell.stack&&cell.stack.formedBy===AI_) aiHasActive=true;
              }
              if(canLift(b,fr,fc,HUMAN_,PARITY_P1)&&canDrop(b,fr,fc,targetRow,c,HUMAN_,PARITY_P1)){
                humCanPlace=true;
                if(cell.stack&&cell.stack.formedBy===HUMAN_) humHasActive=true;
              }
            }
          }
          if(aiCanPlace&&!humCanPlace)  score += aiHasActive ? 90 : 60;
          else if(humCanPlace&&!aiCanPlace) score -= humHasActive ? 90 : 60;
        }
      }
    }
  }

  // ── Ebene 5: Paritätskontrolle ────────────────────────────────────
  // Rote Top-Figuren in eigenen Stapeln = direkte Kontrolle über Parität-Kontext.
  // ANGEPASST: Schwellenwert statt Maximum — 1-2 rote Tops gut, mehr bringt nichts.
  // Datenbasis: "alle rot" korreliert NEGATIV mit Sieg (−16% vs. +33% bei r9).
  // Freie rote Figuren = verfügbar für beide, leicht negativ für AI.
  // REGEL: Figuren gehören keinem Spieler — nur Stapel haben formedBy.
  let aiRedTops=0, humRedTops=0, freeRed=0;
  let aiStacks=0, humStacks=0;
  for(let r=0;r<4;r++) for(let c=0;c<4;c++){
    const cell=b[r][c];
    if(cell.stack){
      if(cell.stack.formedBy===AI_)  aiStacks++;
      else                           humStacks++;
      if(cell.stack.top.color==='red'){
        if(cell.stack.formedBy===AI_) aiRedTops++;
        else humRedTops++;
      }
    } else if(cell.piece&&cell.piece.color==='red') freeRed++;
  }
  // Schwellenwert: max 2 rote Tops werden belohnt (cap bei 2)
  score += (Math.min(aiRedTops,2) - Math.min(humRedTops,2)) * 20;
  // R30: 'score -= freeRed * 3' ENTFERNT (nicht antisymmetrisch).
  // freeRed-Zaehlung bleibt fuer Debug/Statistik erhalten.
  void freeRed;

  // ── Ebene 8: Stapel-Kontrolle ─────────────────────────────────────
  // Paritätsspezifisch: STACK_WEIGHT unterscheidet sich je nach Konfiguration.
  // Daten: even-KI profitiert stärker von Stapel-Vorteil (Ø +2.47 bei Sieg)
  //        als odd-KI (Ø +0.18). Gewicht entsprechend kalibriert.
  // Paritätsblind: zählt nur formedBy, kein canLift/canDrop.
  // KEIN Regelverstoß: reine Strukturbewertung.
  score += (aiStacks - humStacks) * STACK_WEIGHT;

  // ── NEUE ACHSE-B-TERME (V+ Erweiterung) ──────────────────────────
  score += parityCtrlJS(b, AI_, PARITY_P1) * W_PARITY;
  score += asingleControlJS(b, AI_, PARITY_P1) * W_SINGLE;
  score += doubleThreatJS(b, AI_, PARITY_P1) * W_DOUBLE;

  return score;
}

function negamax(b, depth, alpha, beta, activePlayer, bonusPlayer, pathSet){
  const player = bonusPlayer || activePlayer;
  const opp = player===P1 ? P2 : P1;

  if(checkFourOn(b)) return -100000 - depth; // previous move won → bad for current player (§12b: Mate-Band ±100000 gehärtet)

  if(depth===0) return evaluate(b, player);

  const moves = getLegalMoves(b, player, PARITY_P1);
  if(moves.length===0){
    const om = getLegalMoves(b, opp, PARITY_P1);
    if(om.length===0) return 0;
    // opponent plays again — negate because perspective flips
    return -negamax(b, depth-1, -beta, -alpha, opp, null, pathSet);
  }

  let best = -Infinity;
  for(const m of moves){
    const nb = applyMoveOn(b, m.fr, m.fc, m.tr, m.tc, player);
    if(checkFourOn(nb)) return 100000 + depth; // immediate win for current player (§12b: Mate-Band ±100000 gehärtet)
    const triple = applyLockOn(nb);
    const bonus = triple ? (getLegalMoves(nb, player, PARITY_P1).length > 0 ? player : null) : null;

    // ── Spielbewusste Wiederholung (Ebene 7, R31) ────────────────────
    // pathSet enthaelt: alle Stellungen der realen Partie (positionHistory)
    // + die Vorfahren-Stellungen dieses Suchastes. Ein Treffer bedeutet:
    // dieser Zug wiederholt eine bekannte Stellung -> Remiswert 0.
    // KEIN Regelverstoss: reine Bewertung, keine Zugfilterung.
    const nextPlayer = bonus ? player : opp;
    const nbHash = boardHash(nb, nextPlayer);
    if(pathSet.has(nbHash)){
      // R31: Stellung kam im Suchpfad ODER in der realen Partie bereits vor.
      // Bewertung als Remis (0) statt Pauschal-Malus: die unterlegene Seite
      // waehlt die Wiederholung von selbst, die ueberlegene meidet sie.
      best = Math.max(best, REP_DRAW_SCORE);
      alpha = Math.max(alpha, REP_DRAW_SCORE);
      if(beta <= alpha) break;
      continue;
    }
    pathSet.add(nbHash);
    const val = bonus
      ? negamax(nb, depth-1, alpha, beta, player, bonus, pathSet)
      : -negamax(nb, depth-1, -beta, -alpha, opp, null, pathSet);
    pathSet.delete(nbHash);
    // SCHRITT 1: Bilden einer Dreierreihe (dieser Zug von `player`) wird direkt in
    // der Zugbewertung honoriert — Urheber ist `player` (Schleifenkontext).
    let valB = val;
    // FIX R33 (Mate-Bonus-Defekt): Bonus NICHT auf bereits verlorene/gewonnene
    // Knoten addieren, sonst sieht ein spaeterer Verlust schlechter aus als ein
    // sofortiger. Schwelle 90000 (§12b-gehaertet): Terminalwerte liegen bei
    // |val|>=100000; evaluate() bleibt <1000. Schwelle mitgezogen mit Mate-Band.
    if(triple && Math.abs(val) < 90000) valB += DREIER_FORM_BONUS;

    best = Math.max(best, valB);
    alpha = Math.max(alpha, valB);
    if(beta <= alpha) break;
  }
  return best;
}
// ═══════════════════════════════════════════════════════════════════
// ANTISYMMETRIE-SELBSTTEST (§40c — bleibt verbaut, sperrt bei Verletzung)
// ═══════════════════════════════════════════════════════════════════
function antisymmetrySelfTest(p1parity){
  const prev = (typeof PARITY_P1 !== 'undefined') ? PARITY_P1 : undefined;
  // PARITY_P1 muss gesetzt sein, damit getLegalMoves etc. funktionieren
  let worst = 0, tested = 0;
  for(let g=0; g<60; g++){
    let tb = initBoard(); let p = P1;
    for(let mv=0; mv<40; mv++){
      const ms = getLegalMoves(tb, p, p1parity);
      if(!ms.length){ p = (p===P1?P2:P1); if(!getLegalMoves(tb,p,p1parity).length) break; continue; }
      const m = ms[Math.floor(Math.random()*ms.length)];
      applyMove(tb, m.fr, m.fc, m.tr, m.tc, p);
      const t = applyLockOn(tb);
      if(checkFourOn(tb)) break;
      const d = Math.abs(evaluate(tb, P1) + evaluate(tb, P2));
      if(d > worst) worst = d;
      tested++;
      if(!t) p = (p===P1?P2:P1);
    }
  }
  if(worst > 1e-9){
    throw new Error('ANTISYMMETRIE VERLETZT (Δ='+worst+') — KI-Kern gesperrt. Heuristik prüfen!');
  }
  return { tested, worst };
}

// ── Export (Node-Test + spätere Einbindung) ──
if(typeof module !== 'undefined' && module.exports){
  module.exports = { pickMove, evaluate, negamax, antisymmetrySelfTest, SKILL_LEVELS,
    parityCtrlJS, asingleControlJS, doubleThreatJS,
    findImmediateWin, movesAllowingOpponentWin };
}
