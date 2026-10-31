export type VoiceAudioFormat = "pcm16" | "wav" | "opus";

export type VoiceFrame = {
  bytes: Uint8Array;
  format: VoiceAudioFormat;
  sampleRateHz: number;
  capturedAt: string;
};

export type VoiceTurn = {
  id: string;
  speaker: "human" | "agent";
  transcript: string;
  startedAt: string;
  endedAt: string;
  sourceAudioHash?: string;
};

export type VoiceSessionHooks = {
  onTurn(turn: VoiceTurn): Promise<void>;
  onAudio?(frame: VoiceFrame): Promise<void>;
  onError(error: Error): Promise<void>;
};

/**
 * Provider adapters own realtime transport only. They receive a secret handle,
 * never the credential value, and cannot write directly to either memory tree.
 * Voice turns become evidence first; a Muse may then propose a memory.
 */
export interface VoiceProviderAdapter {
  readonly id: string;
  connect(input: {
    sessionId: string;
    secretHandle: string;
    instructions: string;
    hooks: VoiceSessionHooks;
  }): Promise<{ close(): Promise<void>; send(frame: VoiceFrame): Promise<void> }>;
}
