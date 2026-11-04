# Memory Grove

**Two minds. Two histories. One consented grove.**

Memory Grove is a bilateral, provenance-bearing memory ecosystem for a human
and their Muse agent. Each keeps an independently authored tree. Either party
may propose a connection, but the Consent Grove lights up only after both sides
accept a shared scope.

Built for the **Meta Global AI Developer Hackathon 2026**.

## What is working

- a responsive Human Tree, Consent Grove, and Agent Tree experience
- live Muse Spark 1.3 chat with a safe deterministic fallback
- a custom leaf-shaped voice control
- browser speech-to-text that produces an editable draft before sending
- optional browser text-to-speech for Muse replies
- explicit UI states for listening, thinking, and speaking
- append-only, hash-chained `GroveEvent` records
- bilateral and narrowable consent links
- immutable evidence spans and reconstructable projections
- loss receipts with event-sourced undo
- authenticated D1-backed event persistence
- versioned provider-memory import/export with dry-run review and conflict quarantine
- OpenHuman-inspired observe → reflect → evaluate → revise proposal loops
- provider-neutral UpRock VSS evidence adapters
- provider-neutral realtime voice and Muse integration seams
- a privacy-preserving 12-turn-per-hour Muse demo limit

Voice turns become evidence first. Sending a message does **not** silently save
a memory. The human or agent may instead propose a reviewed leaf from the turn.

## Run locally

Requirements: Node.js 22.13+ and pnpm.

```bash
pnpm install
pnpm run dev
```

To enable live Muse chat locally, copy `.env.example` to `.env.local` and set
`MODEL_API_KEY` there. The key is read only by the server-side route. Without
it, the interface remains fully demoable and labels replies as `safe demo`.

Verification:

```bash
pnpm exec tsc --noEmit
pnpm test
pnpm run build
```

## Integration boundaries

`lib/providers/voice.ts` defines realtime transport without granting a voice
provider permission to write memories. `lib/portability/bundle.ts` handles
provenanced import/export. `lib/evidence/video-search.ts` converts timestamped
video results into evidence rather than model-authored fact.

Muse Spark 1.3 is the intended default resident Muse. Provider credentials must
be supplied as runtime secrets and must never enter source, Git history, event
payloads, evidence, logs, or exported memory bundles.

Private conversation and memory text use the standard Spark endpoint. The
lower-cost contributor model is reserved for explicitly sanitized or synthetic
background work because its data-use terms differ. The live route never writes
chat directly into either tree: it can only offer a proposal for review.

## Submission timing

The project submission deadline is **November 4, 2026 at 9:00 PM ET**.
