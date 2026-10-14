import { z } from "zod";

/**
 * Speech-to-text over the org's BYOK credentials. Only providers with an
 * audio surface qualify: OpenAI (Whisper REST) and OpenRouter (chat
 * completions with an `input_audio` part on an audio-capable model).
 * Anthropic credentials never reach here — the caller filters.
 */
export type SttCredential = {
  provider: "openai" | "openrouter";
  apiKey: string;
};

export type TranscribeInput = {
  audio: Uint8Array;
  /** e.g. "audio/ogg; codecs=opus" — mapped to a provider format hint. */
  mimeType?: string | undefined;
  filename?: string | undefined;
};

export class TranscriptionError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TranscriptionError";
  }
}

type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: FormData | string },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}>;

const whisperResponseSchema = z.object({ text: z.string() });

const openRouterResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullish() }) })).min(1),
});

/** OpenRouter audio-capable fallback — the cred's chat model may not take audio. */
const OPENROUTER_AUDIO_MODEL = "google/gemini-2.0-flash-001";

const OPENROUTER_FORMATS = new Set([
  "wav",
  "mp3",
  "flac",
  "aiff",
  "aac",
  "ogg",
  "m4a",
  "mpga",
  "mpeg",
  "mp4",
  "pcm16",
]);

function openRouterAudioFormat(mimeType: string | undefined, filename: string | undefined): string {
  const fromMime = mimeType?.split(";")[0]?.trim().split("/")[1];
  const fromName = filename?.split(".").pop();
  for (const candidate of [fromMime, fromName]) {
    if (candidate && OPENROUTER_FORMATS.has(candidate)) return candidate;
  }
  return "ogg"; // WhatsApp PTT default — provider rejects with a clear error if unsupported.
}

async function transcribeOpenAI(
  input: TranscribeInput,
  apiKey: string,
  fetchImpl: FetchLike,
): Promise<string> {
  const form = new FormData();
  form.append(
    "file",
    // Copy into a plain ArrayBuffer-backed view — BlobPart rejects
    // Uint8Array<ArrayBufferLike> (SharedArrayBuffer) under strict TS.
    new Blob([new Uint8Array(input.audio)], { type: input.mimeType ?? "audio/ogg" }),
    input.filename ?? "audio.ogg",
  );
  form.append("model", "whisper-1");
  const res = await fetchImpl("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) {
    throw new TranscriptionError(`OpenAI transcription failed (${res.status})`, res.status);
  }
  const parsed = whisperResponseSchema.safeParse(await res.json());
  if (!parsed.success) throw new TranscriptionError("OpenAI transcription returned no text");
  return parsed.data.text;
}

async function transcribeOpenRouter(
  input: TranscribeInput,
  apiKey: string,
  fetchImpl: FetchLike,
): Promise<string> {
  const format = openRouterAudioFormat(input.mimeType, input.filename);
  const res = await fetchImpl("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_AUDIO_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe this audio exactly as spoken, in its original language. Output only the transcription.",
            },
            {
              type: "input_audio",
              input_audio: { data: Buffer.from(input.audio).toString("base64"), format },
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    throw new TranscriptionError(`OpenRouter transcription failed (${res.status})`, res.status);
  }
  const parsed = openRouterResponseSchema.safeParse(await res.json());
  const text = parsed.success ? parsed.data.choices[0]?.message.content?.trim() : undefined;
  if (!text) throw new TranscriptionError("OpenRouter transcription returned no text");
  return text;
}

/** Transcribes audio bytes with the given credential. Throws TranscriptionError. */
export async function transcribeAudio(
  input: TranscribeInput,
  credential: SttCredential,
  fetchImpl?: FetchLike,
): Promise<{ text: string }> {
  const fetcher = fetchImpl ?? fetch;
  const text =
    credential.provider === "openai"
      ? await transcribeOpenAI(input, credential.apiKey, fetcher)
      : await transcribeOpenRouter(input, credential.apiKey, fetcher);
  return { text };
}
