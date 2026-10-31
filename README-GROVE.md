# Memory Grove

Working implementation for the Meta Global AI Developer Hackathon 2026.

## Product claim

Memory Grove is a bilateral, provenance-bearing memory ecosystem. A Human Tree
and Agent Tree retain separate authorship. Either party may propose a link, but
the Consent Grove illuminates an orb only after both independently accept a
shared scope. Memory transformations produce loss receipts and undo creates a
new revision instead of rewriting history.

## Current foundation

- provider-neutral TypeScript memory domain
- append-only, hash-chained `GroveEvent` contract
- reconstructable Human Tree, Consent Grove, and Agent Tree projections
- bilateral/narrowable consent links
- immutable evidence spans
- loss receipts with event-sourced undo
- scoped Gardener proposals
- agent-chosen, free-composition weather
- Cloudflare D1/Drizzle ledger schema
- authenticated `GET`/`POST /api/grove/events` route that owns sequencing and hashing
- server-side domain validation before an event reaches durable storage
- provider-neutral realtime voice adapter contract; voice becomes evidence first
- leaf-shaped voice chat with editable dictation drafts and optional spoken replies
- versioned memory bundle with full provenance, native export, dry-run import,
  duplicate detection, and conflict quarantine
- OpenHuman-inspired observe → reflect → evaluate → revise learning loop that
  still ends in a reviewable proposal
- provider-neutral video semantic search adapter for UpRock VSS timestamp spans
- projection tests covering consent, undo, and ledger continuity

The local preview uses a fixed demo identity. A deployed Site scopes every
stream to the authenticated ChatGPT user headers. Model/API credentials are not
accepted by this endpoint and must never be written into events, evidence, or
repository files.

Provider imports are proposals, not authority. A dry run classifies every record
as proposed, duplicate, conflict, or invalid. Promotion into either tree requires
explicit review. Exports contain no API keys or secret handles.

## Meta center

Muse Spark 1.3 will be the default resident Muse and will return structured
reflection and memory-proposal actions through Meta Model API. The ledger and
tree projection remain model-independent so users can connect another Muse
through a bounded adapter without surrendering continuity.

## Verified deadline

Project submission is due **November 4, 2026 at 9:00 PM ET**. November 9 is the
closing ceremony and winner announcement.
