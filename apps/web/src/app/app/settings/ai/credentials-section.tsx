"use client";

import type { LlmCredentialPublic } from "@crm/core/ai";
import { Badge } from "@crm/ui/components/badge";
import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteLlmCredentialAction } from "@/server/actions/ai";

import { CredentialCreateForm } from "./credential-form";

export function CredentialsSection({
  credentials,
  canManage,
}: {
  credentials: LlmCredentialPublic[];
  canManage: boolean;
}) {
  const t = useTranslations("settings.ai.credentials");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const remove = (cred: LlmCredentialPublic) => {
    if (!window.confirm(t("deleteConfirm", { label: cred.label ?? cred.id }))) return;
    startTransition(async () => {
      const result = await deleteLlmCredentialAction(cred.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("deleted"));
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {credentials.length === 0 ? (
          <p className="text-muted-foreground text-sm" data-testid="credentials-empty">
            {t("empty")}
          </p>
        ) : (
          <ul className="space-y-2" data-testid="credential-list">
            {credentials.map((cred) => (
              <li
                key={cred.id}
                className="flex items-center justify-between gap-3 border-b pb-2 last:border-0"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{cred.provider}</Badge>
                  <span className="font-medium">{cred.label ?? t("unlabeled")}</span>
                  <span className="text-muted-foreground">{cred.model}</span>
                  <span className="text-muted-foreground text-xs">
                    {t("priority")} {cred.priority}
                  </span>
                  {cred.zdr && <Badge variant="secondary">ZDR</Badge>}
                  {cred.status !== "active" && (
                    <Badge variant="secondary">{t("statusDisabled")}</Badge>
                  )}
                </div>
                {canManage && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => remove(cred)}
                  >
                    {t("remove")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManage && <CredentialCreateForm />}
      </CardContent>
    </Card>
  );
}
