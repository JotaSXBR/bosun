// transcribeAudio — provider fan-out over BYOK credentials (fake fetch).
import { describe, expect, it } from "vitest";

import { transcribeAudio, TranscriptionError } from "./transcribe";

type Call = {
  url: string;
  init?: { method?: string; headers?: Record<string, string>; body?: FormData | string };
};

function fakeFetch(responder: (call: Call) => { status?: number; json?: unknown }) {
  const calls: Call[] = [];
  const fetchImpl = (url: string, init?: Call["init"]) => {
    calls.push({ url, init });
    const res = responder({ url, init });
    return Promise.resolve({
      ok: (res.status ?? 200) < 400,
      status: res.status ?? 200,
      json: () => Promise.resolve(res.json),
      text: () => Promise.resolve(JSON.stringify(res.json)),
    });
  };
  return { fetchImpl, calls };
}

const audio = new Uint8Array([1, 2, 3]);

describe("transcribeAudio", () => {
  it("openai → whisper-1 multipart with the audio blob", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({ json: { text: "oi tudo bem" } }));
    const result = await transcribeAudio(
      { audio, mimeType: "audio/ogg; codecs=opus", filename: "ptt.ogg" },
      { provider: "openai", apiKey: "sk-test" },
      fetchImpl,
    );
    expect(result.text).toBe("oi tudo bem");
    expect(calls[0]?.url).toBe("https://api.openai.com/v1/audio/transcriptions");
    expect(calls[0]?.init?.headers?.Authorization).toBe("Bearer sk-test");
    const form = calls[0]?.init?.body as FormData;
    expect(form.get("model")).toBe("whisper-1");
    expect((form.get("file") as File).name).toBe("ptt.ogg");
  });

  it("openrouter → chat completions with input_audio base64", async () => {
    const { fetchImpl, calls } = fakeFetch(() => ({
      json: { choices: [{ message: { content: "  transcript aqui  " } }] },
    }));
    const result = await transcribeAudio(
      { audio, mimeType: "audio/ogg; codecs=opus" },
      { provider: "openrouter", apiKey: "or-test" },
      fetchImpl,
    );
    expect(result.text).toBe("transcript aqui");
    expect(calls[0]?.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    const rawBody = calls[0]?.init?.body;
    if (typeof rawBody !== "string") throw new Error("expected JSON string body");
    const body = JSON.parse(rawBody) as {
      model: string;
      messages: { content: { type: string; input_audio?: { data: string; format: string } }[] }[];
    };
    const audioPart = body.messages[0]?.content.find((p) => p.type === "input_audio");
    expect(audioPart?.input_audio?.format).toBe("ogg");
    expect(Buffer.from(audioPart!.input_audio!.data, "base64")).toEqual(Buffer.from(audio));
  });

  it("throws TranscriptionError on provider failure", async () => {
    const { fetchImpl } = fakeFetch(() => ({ status: 401, json: {} }));
    await expect(
      transcribeAudio({ audio }, { provider: "openai", apiKey: "bad" }, fetchImpl),
    ).rejects.toBeInstanceOf(TranscriptionError);
  });

  it("throws when the response carries no text", async () => {
    const { fetchImpl } = fakeFetch(() => ({ json: { choices: [] } }));
    await expect(
      transcribeAudio({ audio }, { provider: "openrouter", apiKey: "k" }, fetchImpl),
    ).rejects.toBeInstanceOf(TranscriptionError);
  });
});
