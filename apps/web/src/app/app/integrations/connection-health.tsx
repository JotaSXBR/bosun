"use client";

import type { ConnectionHealth } from "@crm/core/integrations";
import { useEffect, useState } from "react";

import { connectionHealthAction } from "@/server/actions/integrations";

const WARNING_LABELS: Record<string, string> = {
  reachout_timelock: "Timelock de contato ativo (anti-ban)",
  message_capping: "Limite de mensagens atingido (anti-ban)",
};

/**
 * Live health strip under each connection row — paired number, WAHA
 * server version (for update checks) and restriction warnings. Fetches
 * once on mount; a hard failure renders nothing (status badge already
 * communicates trouble).
 */
export function ConnectionHealth({ id, kind }: { id: string; kind: string }) {
  const [health, setHealth] = useState<ConnectionHealth | null>(null);

  useEffect(() => {
    if (kind !== "waha") return; // health endpoints are WAHA-only today
    let cancelled = false;
    void connectionHealthAction(id).then((result) => {
      if (!cancelled && result.ok) setHealth(result.health);
    });
    return () => {
      cancelled = true;
    };
  }, [id, kind]);

  if (!health?.session && !health?.server) return null;

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {health.session?.phone && <span>Número: {health.session.phone}</span>}
      {health.session?.pushName && <span>Conta: {health.session.pushName}</span>}
      {health.server && (
        <span>
          WAHA {health.server.version} ({health.server.engine})
        </span>
      )}
      {health.session?.warnings.map((warning) => (
        <span key={warning} className="text-amber-700">
          {WARNING_LABELS[warning] ?? warning}
        </span>
      ))}
    </div>
  );
}
