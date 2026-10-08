"use client";

import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@crm/ui/components/card";
import { Input } from "@crm/ui/components/input";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";

import { saveSetupEmailAction } from "@/server/actions/setup";

/**
 * Minimal e-mail provider form for the first-run wizard. Secrets are sent
 * raw (first save — nothing to preserve); the server stores them encrypted.
 */
export function SetupForm() {
  const t = useTranslations("setup");
  const tc = useTranslations("common");
  const router = useRouter();
  const [provider, setProvider] = useState("resend");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const str = (key: string) => {
      const v = fd.get(key);
      return typeof v === "string" ? v : "";
    };
    const smtpPort = str("smtpPort");
    const values: Record<string, unknown> = {
      provider,
      from: str("from"),
      resendApiKey: str("resendApiKey"),
      smtp: {
        host: str("smtpHost"),
        port: smtpPort === "" ? "" : Number(smtpPort),
        user: str("smtpUser"),
        password: str("smtpPassword"),
        secure: fd.has("smtpSecure"),
      },
    };
    setPending(true);
    const result = await saveSetupEmailAction(values);
    setPending(false);
    if (result.ok) {
      router.push("/app");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="setup-provider">
              {t("provider")}
            </label>
            <select
              id="setup-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
            >
              <option value="console">{t("consoleOption")}</option>
              <option value="resend">resend</option>
              <option value="smtp">smtp</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="setup-from">
              {t("from")}
            </label>
            <Input id="setup-from" name="from" placeholder={t("fromPlaceholder")} />
          </div>

          {provider === "resend" && (
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="setup-resend-key">
                {t("resendKey")}
              </label>
              <Input
                id="setup-resend-key"
                name="resendApiKey"
                type="password"
                autoComplete="new-password"
                placeholder="re_..."
              />
            </div>
          )}

          {provider === "smtp" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="setup-smtp-host">
                  {t("host")}
                </label>
                <Input id="setup-smtp-host" name="smtpHost" placeholder="smtp.exemplo.com" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="setup-smtp-port">
                  {t("port")}
                </label>
                <Input id="setup-smtp-port" name="smtpPort" type="number" placeholder="587" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="setup-smtp-user">
                  {t("user")}
                </label>
                <Input id="setup-smtp-user" name="smtpUser" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="setup-smtp-password">
                  {tc("password")}
                </label>
                <Input
                  id="setup-smtp-password"
                  name="smtpPassword"
                  type="password"
                  autoComplete="new-password"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  name="smtpSecure"
                  type="checkbox"
                  className="border-input h-4 w-4 rounded border"
                />
                {t("tls")}
              </label>
            </div>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? tc("saving") : t("submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
