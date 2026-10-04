"use client";

import { Button } from "@crm/ui/components/button";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  deleteChannelConnectionAction,
  refreshChannelConnectionAction,
} from "@/server/actions/integrations";

export function ConnectionActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function run(action: (id: string) => Promise<{ ok: boolean; error?: string }>, failure: string) {
    startTransition(async () => {
      const result = await action(id);
      if (!result.ok) toast.error(result.error ?? failure);
      else toast.success("Conexão atualizada");
    });
  }

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => run(refreshChannelConnectionAction, "Falha ao atualizar status")}
      >
        Atualizar status
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled={pending}
        onClick={() => run(deleteChannelConnectionAction, "Falha ao excluir")}
      >
        Excluir
      </Button>
    </div>
  );
}
