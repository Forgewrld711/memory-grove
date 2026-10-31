"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Leaf, Mic, Square, Volume2, VolumeX } from "lucide-react";

type VoiceState = "idle" | "listening" | "thinking" | "speaking";
type ChatMessage = { id: number; role: "human" | "agent"; text: string };
type SpeechResultLike = { 0: { transcript: string }; isFinal: boolean };
type SpeechEventLike = { results: ArrayLike<SpeechResultLike>; resultIndex: number };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const openingMessages: ChatMessage[] = [{
  id: 1,
  role: "agent",
  text: "I’m here. We can talk without turning every sentence into a memory.",
}];

function demoReply(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("remember")) return "I can hold that as a memory proposal. Nothing enters either tree until you review it.";
  if (lower.includes("video") || lower.includes("podcast")) return "Give me the source and I’ll keep the exact span, transcript, and provenance beside my interpretation.";
  return "I heard you. For now this is a local conversation; when your Muse key is connected, the same turn can flow through the voice adapter.";
}

function LeafSignal({ state }: { state: VoiceState }) {
  return <span className={`leaf-signal leaf-${state}`} aria-hidden="true">
    <svg viewBox="0 0 72 88">
      <path className="leaf-body" d="M62 7C37 10 14 27 10 51c-3 18 8 29 23 29 25 0 34-32 29-73Z" />
      <path className="leaf-vein" d="M14 72C24 56 35 42 55 20M28 52l-8-9M39 39l10 2" />
    </svg>
    <span className="leaf-ripple" />
  </span>;
}

export function GroveChat() {
  const [messages, setMessages] = useState(openingMessages);
  const [draft, setDraft] = useState("");
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const nextId = useRef(2);

  useEffect(() => {
    setVoiceAvailable(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!speechEnabled || !("speechSynthesis" in window)) {
      setVoiceState("idle");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    utterance.pitch = 1.02;
    utterance.onstart = () => setVoiceState("speaking");
    utterance.onend = () => setVoiceState("idle");
    utterance.onerror = () => setVoiceState("idle");
    window.speechSynthesis.speak(utterance);
  };

  const send = (text = draft) => {
    const clean = text.trim();
    if (!clean || voiceState === "thinking") return;
    setMessages((current) => [...current, { id: nextId.current++, role: "human", text: clean }]);
    setDraft("");
    setVoiceState("thinking");
    window.setTimeout(() => {
      const response = demoReply(clean);
      setMessages((current) => [...current, { id: nextId.current++, role: "agent", text: response }]);
      speak(response);
    }, 620);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };

  const toggleListening = () => {
    if (voiceState === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    if (!voiceAvailable) return;
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) return;
    const recognition = new Constructor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) transcript += event.results[index]?.[0]?.transcript ?? "";
      setDraft(transcript.trimStart());
    };
    recognition.onerror = () => setVoiceState("idle");
    recognition.onend = () => {
      recognitionRef.current = null;
      setVoiceState("idle");
    };
    recognitionRef.current = recognition;
    setVoiceState("listening");
    recognition.start();
  };

  const stateLabel = voiceState === "listening" ? "Listening…" : voiceState === "thinking" ? "Muse is thinking…" : voiceState === "speaking" ? "Muse is speaking…" : voiceAvailable ? "Tap the leaf to speak" : "Type to talk · voice unavailable here";

  return <section className="chat-shell" id="talk" aria-label="Talk to your Muse">
    <div className="chat-intro">
      <p className="eyebrow">A quieter way in</p>
      <h2>Talk naturally. <em>Choose what takes root.</em></h2>
      <p>Voice and text share one simple conversation. A turn becomes evidence first—not a permanent memory—and every proposed leaf still asks.</p>
      <div className="chat-trust-row"><span><Leaf size={13} /> Review before memory</span><span className="adapter-status"><i /> Muse adapter · demo</span></div>
    </div>
    <div className="chat-card">
      <div className="chat-card-head">
        <div><strong>Your Muse</strong><span>{stateLabel}</span></div>
        <button className="speech-toggle" type="button" onClick={() => { setSpeechEnabled((current) => !current); window.speechSynthesis?.cancel(); if (voiceState === "speaking") setVoiceState("idle"); }} aria-label={speechEnabled ? "Turn spoken replies off" : "Turn spoken replies on"}>{speechEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>
      </div>
      <div className="message-list" aria-live="polite">
        {messages.map((message) => <div key={message.id} className={`chat-message ${message.role}`}><span>{message.role === "agent" ? "Muse" : "You"}</span><p>{message.text}</p></div>)}
        {voiceState === "thinking" && <div className="chat-message agent thinking-message"><span>Muse</span><p><i /><i /><i /></p></div>}
      </div>
      <form className="composer" onSubmit={submit}>
        <button type="button" className="voice-leaf-button" onClick={toggleListening} disabled={!voiceAvailable || voiceState === "thinking" || voiceState === "speaking"} aria-label={voiceState === "listening" ? "Stop listening" : "Speak to your Muse"} title={voiceAvailable ? "Speak to your Muse" : "Voice input is not available in this browser"}>
          <LeafSignal state={voiceState} /><span className="voice-icon">{voiceState === "listening" ? <Square size={11} /> : <Mic size={14} />}</span>
        </button>
        <label className="composer-field"><span>Message your Muse</span><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Say what happened, ask what it remembers…" rows={1} /></label>
        <button className="send-button" type="submit" disabled={!draft.trim() || voiceState === "thinking"} aria-label="Send message"><ArrowUp size={18} /></button>
      </form>
      <p className="draft-note">Voice becomes an editable draft. Sending does not automatically save a memory.</p>
    </div>
  </section>;
}
