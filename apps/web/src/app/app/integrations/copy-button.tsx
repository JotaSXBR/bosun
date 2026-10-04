"use client";

import { Button } from "@crm/ui/components/button";
import { toast } from "sonner";

export function CopyButton({ value }: { value: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard
          .writeText(value)
          .then(() => toast.success("URL copiada"))
          .catch(() => toast.error("Não foi possível copiar."));
      }}
    >
      Copiar
    </Button>
  );
}
