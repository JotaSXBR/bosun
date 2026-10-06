"use client";

import { Button } from "@crm/ui/components/button";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  connectChannelConnectionAction,
  connectionLifecycleAction,
  deleteChannelConnectionAction,
} from "@/server/actions/integrations";

import { PairingPanel } from "./pairing-panel";

type QrCode = { mimeType: string; data: string };

export function ConnectionActions({
  id,
  kind,
  status,
}: {
  id: string;
  kind: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [pairing, setPairing] = useState<{ qr?: QrCode } | null>(null);

  function connect() {
    startTransition(async () => {
      const result = await connectChannelConnectionAction(id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.status === "connected") {
        setPairing(null);
        toast.success("WhatsApp conectado");
      } else if (kind === "waha") {
        // Connecting/pending → open the pairing panel (QR + phone code).
        setPairing({ qr: result.qrCode });
      } else {
        toast.info(`Status: ${result.status}`);
      }
    });
  }

  function lifecycle(action: "stop" | "restart" | "logout", label: string) {
    startTransition(async () => {
      const result = await connectionLifecycleAction(id, action);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (action === "logout" || action === "stop") setPairing(null);
      toast.success(label);
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteChannelConnectionAction(id);
      if (!result.ok) toast.error(result.error);
      else toast.success("Conexão excluída");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={connect}>
          {status === "connected" ? "Reconectar" : "Conectar"}
        </Button>
        {kind === "waha" && status === "connected" && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("restart", "Sessão reiniciada")}
            >
              Reiniciar sessão
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("stop", "Sessão parada")}
            >
              Parar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("logout", "Aparelho despareado")}
            >
              Desparear
            </Button>
          </>
        )}
        <Button type="button" variant="destructive" size="sm" disabled={pending} onClick={remove}>
          Excluir
        </Button>
      </div>
      {pairing && <PairingPanel id={id} initialQr={pairing.qr} onDone={() => setPairing(null)} />}
    </div>
  );
}
