"use client";

import { Button } from "@crm/ui/components/button";
import { Input } from "@crm/ui/components/input";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateWidgetConfigAction } from "@/server/actions/integrations";

import { CopyButton } from "./copy-button";

type WidgetConfigShape = {
  welcomeText?: string;
  accentColor?: string;
  position?: "left" | "right";
};

/** site_chat connection extras: embed snippet + widget config + demo link. */
export function WidgetPanel({
  connectionId,
  webhookToken,
  origin,
  config,
  canManage,
}: {
  connectionId: string;
  webhookToken: string;
  origin: string;
  config: WidgetConfigShape;
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [welcomeText, setWelcomeText] = useState(config.welcomeText ?? "");
  const [accentColor, setAccentColor] = useState(config.accentColor ?? "");
  const [position, setPosition] = useState<"left" | "right">(config.position ?? "right");

  const snippet = `<script src="${origin}/widget.js" data-bosun-widget data-token="${webhookToken}" async></script>`;

  function save() {
    startTransition(async () => {
      const result = await updateWidgetConfigAction(connectionId, {
        welcomeText: welcomeText || undefined,
        accentColor: accentColor || undefined,
        position,
      });
      if (result.ok) toast.success("Widget salvo");
      else toast.error(result.error);
    });
  }

  return (
    <div className="space-y-3" data-testid="widget-panel">
      <div className="flex items-center gap-2">
        <code className="bg-muted flex-1 truncate rounded px-2 py-1 text-xs">{snippet}</code>
        <CopyButton value={snippet} />
      </div>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <Link href={`/widget-demo?token=${webhookToken}`} className="underline" target="_blank">
          Abrir página de demonstração
        </Link>
      </div>
      {canManage && (
        <div className="grid gap-3 sm:grid-cols-5 sm:items-end">
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground text-xs">Mensagem de boas-vindas</span>
            <Input
              value={welcomeText}
              onChange={(e) => setWelcomeText(e.target.value)}
              placeholder="Olá! Como podemos ajudar?"
              maxLength={200}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground text-xs">Cor de destaque</span>
            <Input
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#ff6600"
              maxLength={32}
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground text-xs">Posição</span>
            <select
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
              value={position}
              onChange={(e) => setPosition(e.target.value as "left" | "right")}
            >
              <option value="right">Direita</option>
              <option value="left">Esquerda</option>
            </select>
          </label>
          <Button type="button" size="sm" disabled={pending} onClick={save}>
            Salvar widget
          </Button>
        </div>
      )}
    </div>
  );
}
