"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, CircleDot, CloudSun, History, Link2, RotateCcw, Scissors, Sparkles, X } from "lucide-react";

type LinkStage = "idle" | "proposed" | "active";
const humanLeaves = [{ x:34,y:35,label:"Why this film matters"},{x:60,y:23,label:"A promise I want preserved"},{x:73,y:45,label:"What I noticed at 02:14"}];
const agentLeaves = [{x:39,y:26,label:"The pause changed the meaning"},{x:66,y:36,label:"A question I chose to carry"},{x:27,y:48,label:"My first interpretation"}];

function Tree({ owner }: { owner: "human" | "agent" }) {
  const isHuman = owner === "human";
  const leaves = isHuman ? humanLeaves : agentLeaves;
  return <div className={`tree-scene ${isHuman ? "human-tree" : "agent-tree"}`}>
    <div className="weather weather-one" /><div className="weather weather-two" />
    <svg viewBox="0 0 100 100" aria-label={`${owner} memory tree`}>
      <path className="tree-shadow" d="M47 92 C42 77 46 63 48 51 C45 38 34 30 26 21 M49 51 C57 39 67 31 78 23 M48 63 C35 57 25 51 18 43 M50 62 C62 58 74 51 82 41" />
      <path className="tree-trunk" d="M47 92 C42 77 46 63 48 51 C45 38 34 30 26 21 M49 51 C57 39 67 31 78 23 M48 63 C35 57 25 51 18 43 M50 62 C62 58 74 51 82 41" />
      <path className="root-line" d="M48 88 C34 91 27 96 19 97 M49 89 C58 94 72 95 82 98 M47 87 C42 94 41 97 41 100" />
      {leaves.map((leaf,index)=><g key={leaf.label} className="memory-leaf"><circle cx={leaf.x} cy={leaf.y} r={index===2?5.2:4.2}/><circle className="leaf-glint" cx={leaf.x-1.2} cy={leaf.y-1.4} r="1"/></g>)}
      <g className="bud"><circle cx={isHuman?83:19} cy="40" r="3.5"/><circle cx={isHuman?85:17} cy="36" r="2.2"/></g>
    </svg>
    <div className="tree-caption"><p>{isHuman?"Owned by you":"Authored by your Muse"}</p><strong>{isHuman?"Human Tree":"Agent Tree"}</strong><span>{isHuman?"Your memories stay yours.":"Its reflections stay its own."}</span></div>
    <div className="fixture-tag">SYNTHETIC FIXTURE</div>
  </div>;
}

export default function Home() {
  const [stage,setStage]=useState<LinkStage>("idle");
  const [proposal,setProposal]=useState<"open"|"accepted"|"rejected">("open");
  const [receipt,setReceipt]=useState<"hidden"|"applied"|"undone">("hidden");
  const status=useMemo(()=>stage==="active"?"Both accepted · link active":stage==="proposed"?"Human accepted · Muse deciding":"No memories are shared by default",[stage]);
  return <main className="grove-shell">
    <header className="topbar"><a href="#grove" className="brand"><span className="brand-mark"><Sparkles size={16}/></span><span>Memory Grove</span></a><div className="prototype-pill"><CircleDot size={13}/> live provenance prototype</div><button className="quiet-button"><History size={15}/> Event history</button></header>
    <section className="hero-copy"><p className="eyebrow">Memory that asks before it connects.</p><h1>Two minds. Two histories.<br/><em>One consented grove.</em></h1><p className="lede">Your memories and your agent’s reflections remain independently authored. When both choose to connect, the evidence between them lights up.</p></section>
    <section id="grove" className={`grove-grid stage-${stage}`}>
      <article className="tree-panel"><Tree owner="human"/></article>
      <article className="consent-panel">
        <div className="grove-label"><Link2 size={14}/> Consent Grove</div><div className="branch-line branch-left"/><div className="branch-line branch-right"/>
        <button className="evidence-orb" onClick={()=>stage==="idle"&&setStage("proposed")}><span className="orb-core">{stage==="active"?<Check size={24}/>:<Link2 size={22}/>}</span><span>{stage==="idle"?"Propose link":stage==="proposed"?"Awaiting Muse":"Shared evidence"}</span></button>
        <p className="consent-status">{status}</p>
        <div className="evidence-card"><span className="timecode">02:14–02:31</span><div><strong>Meaningful video span</strong><small>source hash · frame · transcript</small></div></div>
        {stage==="proposed"&&<div className="decision-card"><p><span>Muse proposal</span>Link only the interpretation and video span?</p><div className="scope-row"><span>✓ interpretation</span><span>✓ evidence</span><span>— private notes</span></div><div className="decision-actions"><button onClick={()=>setStage("idle")}><X size={14}/> Decline</button><button className="accept" onClick={()=>setStage("active")}><Check size={14}/> Accept scope</button></div></div>}
        {stage==="active"&&<div className="birth-card"><Sparkles size={16}/><div><strong>Link birth certificate</strong><small>proposed by human · accepted by both · private notes excluded</small></div></div>}
      </article>
      <article className="tree-panel"><Tree owner="agent"/></article>
    </section>
    <section className="proof-strip">
      <article className="proof-card"><div className="proof-icon gardener"><Scissors size={18}/></div><div className="proof-copy"><span>Gardener proposal</span><strong>These two leaves may describe the same moment.</strong><small>No change happens without your decision.</small></div>{proposal==="open"?<div className="card-actions"><button onClick={()=>setProposal("rejected")}><X size={14}/></button><button onClick={()=>setProposal("accepted")}><Check size={14}/></button></div>:<div className={`resolved ${proposal}`}>{proposal==="accepted"?"Approved":"Left separate"}</div>}</article>
      <article className="proof-card"><div className="proof-icon receipt"><History size={18}/></div><div className="proof-copy"><span>Compression with a receipt</span><strong>{receipt==="hidden"?"Shorten a long memory without hiding the loss.":receipt==="applied"?"Kept 3 details · omitted 2":"Original restored as a new revision"}</strong><small>{receipt==="applied"?"Nothing was silently erased.":"Every transformation remains reconstructable."}</small></div>{receipt==="hidden"&&<button className="text-action" onClick={()=>setReceipt("applied")}>Compress <ArrowRight size={14}/></button>}{receipt==="applied"&&<button className="text-action" onClick={()=>setReceipt("undone")}><RotateCcw size={14}/> Undo</button>}{receipt==="undone"&&<div className="resolved accepted">Undo recorded</div>}</article>
      <article className="proof-card"><div className="proof-icon weather-icon"><CloudSun size={18}/></div><div className="proof-copy"><span>Chosen weather</span><strong>Purple rain moving upward. One judgmental cloud.</strong><small>Expression, never an inferred mood label.</small></div></article>
    </section>
    <footer><span>Built around bilateral consent, visible provenance, and reversible change.</span><span>Muse Spark · provider-neutral memory core</span></footer>
  </main>;
}
