"use client";

import { Button } from "@crm/ui/components/button";
import { Input } from "@crm/ui/components/input";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  connectChannelConnectionAction,
  requestPairingCodeAction,
} from "@/server/actions/integrations";

type QrCode = { mimeType: string; data: string };

/** WAHA rotates the QR ~every 20s; polling re-fetches it on the same tick. */
const POLL_MS = 15_000;

/**
 * Pairing panel for WAHA connections — shows the rotating QR (auto-refresh
 * via the connect action) plus the "conectar com número" pairing-code flow.
 * Stops polling once the session connects.
 */
export function PairingPanel({
  id,
  initialQr,
  onDone,
}: {
  id: string;
  initialQr?: QrCode;
  onDone: () => void;
}) {
  const [qr, setQr] = useState<QrCode | undefined>(initialQr);
  const [status, setStatus] = useState("connecting");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState<string>();
  const [pending, setPending] = useState(false);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      const result = await connectChannelConnectionAction(id);
      if (cancelled || !result.ok) return;
      setStatus(result.status);
      if (result.qrCode) setQr(result.qrCode);
      if (result.status === "connected") {
        toast.success("WhatsApp conectado");
        done.current();
      }
    };
    const timer = setInterval(() => void poll(), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [id]);

  async function requestCode() {
    setPending(true);
    const result = await requestPairingCodeAction(id, phone);
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setCode(result.code);
  }

  return (
    <div className="bg-muted/40 space-y-4 rounded-md border p-4" data-testid="pairing-panel">
      <div className="flex flex-col items-start gap-4 sm:flex-row">
        <div className="flex h-48 w-48 shrink-0 items-center justify-center rounded-md bg-white">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL, not a remote image
            <img
              src={`data:${qr.mimeType};base64,${qr.data}`}
              alt="QR code do WhatsApp"
              className="h-44 w-44"
            />
          ) : (
            <span className="text-muted-foreground px-4 text-center text-xs">
              {status === "connecting" ? "Gerando QR…" : "QR indisponível — use o código"}
            </span>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <p className="font-medium">Conectar pelo QR</p>
          <p className="text-muted-foreground">
            WhatsApp → Aparelhos conectados → Conectar aparelho. O código se atualiza sozinho.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Ou conecte com número de telefone</p>
        <div className="flex gap-2">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
            placeholder="5511999998888"
            inputMode="numeric"
            className="max-w-52"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || !phone}
            onClick={requestCode}
          >
            Gerar código
          </Button>
        </div>
        {code && (
          <p className="text-sm">
            Digite no WhatsApp (Conectar com número):{" "}
            <span className="font-mono text-lg font-semibold tracking-wider">{code}</span>
          </p>
        )}
      </div>
    </div>
  );
}
