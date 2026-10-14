"use client";

// WhatsApp-style audio bubble: play/pause, elapsed/total time and a
// playback-speed cycler (1× → 1.5× → 2×). The native <audio> element has
// no speed affordance, so the chrome is custom.
import { Icon } from "@crm/design-system/components/icon";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

const SPEEDS = [1, 1.5, 2] as const;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ src, durationHint }: { src: string; durationHint?: number }) {
  const t = useTranslations("message");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  // MediaRecorder webm blobs carry no duration metadata (el.duration is
  // Infinity). Discovering it by seeking works — but the seek must run on
  // a detached probe element: doing it on the visible <audio> can wedge
  // it in a seeking+muted state where play() never resolves.
  useEffect(() => {
    if (durationHint != null && Number.isFinite(durationHint) && durationHint > 0) return;
    const probe = document.createElement("audio");
    probe.preload = "metadata";
    probe.muted = true;
    let settled = false;
    const settle = () => {
      if (settled || !Number.isFinite(probe.duration)) return;
      settled = true;
      setDuration(probe.duration);
    };
    probe.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(probe.duration)) settle();
      else probe.currentTime = 1e7;
    });
    probe.addEventListener("timeupdate", settle);
    probe.src = src;
    return () => {
      probe.removeAttribute("src");
      probe.load();
    };
  }, [src, durationHint]);

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]!;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  return (
    <div className="flex w-64 max-w-full items-center gap-2" data-testid="audio-player">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setElapsed(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d)) setDuration(d);
        }}
        onEnded={() => setElapsed(0)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("audioPause") : t("audioPlay")}
        className="bg-ink-on-signal/20 flex size-8 shrink-0 items-center justify-center rounded-full"
      >
        <Icon name={playing ? "pause" : "play"} className="size-4" />
      </button>
      <span className="min-w-9 text-xs tabular-nums">
        {formatTime(playing || elapsed > 0 ? elapsed : duration || (durationHint ?? 0))}
      </span>
      <button
        type="button"
        onClick={cycleSpeed}
        aria-label={t("audioSpeed")}
        className="bg-ink-on-signal/20 rounded-xs px-1.5 py-0.5 text-xs font-medium tabular-nums"
      >
        {speed}×
      </button>
    </div>
  );
}
