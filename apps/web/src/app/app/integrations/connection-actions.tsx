"use client";

import { Button } from "@crm/ui/components/button";
import { toast } from "@crm/ui/components/toast";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

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
  const t = useTranslations("integrations");
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
        toast.success(t("actions.connected"));
      } else if (kind === "waha") {
        // Connecting/pending → open the pairing panel (QR + phone code).
        setPairing({ qr: result.qrCode });
      } else {
        toast.info(t("actions.statusInfo", { status: result.status }));
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
      else toast.success(t("actions.deleted"));
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {kind !== "site_chat" && (
          <Button variant="primary" type="button" size="sm" disabled={pending} onClick={connect}>
            {status === "connected" ? t("actions.reconnect") : t("actions.connect")}
          </Button>
        )}
        {kind === "waha" && status === "connected" && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("restart", t("actions.sessionRestarted"))}
            >
              {t("actions.restart")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("stop", t("actions.sessionStopped"))}
            >
              {t("actions.stop")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("logout", t("actions.deviceUnpaired"))}
            >
              {t("actions.unpair")}
            </Button>
          </>
        )}
        {kind === "waha" && (status === "error" || status === "disconnected") && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("restart", t("actions.sessionRestartedQr"))}
            >
              {t("actions.restart")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() => lifecycle("logout", t("actions.deviceUnpaired"))}
            >
              {t("actions.unpair")}
            </Button>
          </>
        )}
        <Button type="button" variant="danger" size="sm" disabled={pending} onClick={remove}>
          {t("actions.delete")}
        </Button>
      </div>
      {pairing && <PairingPanel id={id} initialQr={pairing.qr} onDone={() => setPairing(null)} />}
    </div>
  );
}
