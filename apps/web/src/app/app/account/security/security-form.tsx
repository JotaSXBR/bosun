"use client";

import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@crm/design-system/components/form";
import { Input } from "@crm/design-system/components/input";
import { toast } from "@crm/design-system/components/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { changePasswordAction, revokeSessionAction } from "@/server/actions/account";

interface SessionRow {
  token: string;
  current: boolean;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

interface Labels {
  password: string;
  currentPassword: string;
  newPassword: string;
  submit: string;
  changed: string;
  sessions: string;
  sessionsHint: string;
  thisDevice: string;
  revoke: string;
  revoked: string;
}

function passwordSchema(t: ReturnType<typeof useTranslations>) {
  return z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, t("passwordMin")).max(128),
  });
}

type PasswordForm = UseFormReturn<z.infer<ReturnType<typeof passwordSchema>>>;

function PasswordInputs({ form, labels }: { form: PasswordForm; labels: Labels }) {
  return (
    <>
      {(["currentPassword", "newPassword"] as const).map((name) => (
        <FormField
          key={name}
          control={form.control}
          name={name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{labels[name]}</FormLabel>
              <FormControl>
                <Input
                  shape="rounded"
                  type="password"
                  icon="lock"
                  autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </>
  );
}

function PasswordCard({ labels }: { labels: Labels }) {
  const tVal = useTranslations("validation");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<ReturnType<typeof passwordSchema>>>({
    resolver: zodResolver(passwordSchema(tVal)),
    defaultValues: { currentPassword: "", newPassword: "" },
  });

  function onSubmit(values: z.infer<ReturnType<typeof passwordSchema>>) {
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      form.reset();
      toast.success(labels.changed);
      router.refresh();
    });
  }

  return (
    <Card title={labels.password}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <PasswordInputs form={form} labels={labels} />
          <Button variant="primary" type="submit" loading={isPending}>
            {labels.submit}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

function SessionsCard({ sessions, labels }: { sessions: SessionRow[]; labels: Labels }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function revoke(token: string) {
    startTransition(async () => {
      const result = await revokeSessionAction({ token });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(labels.revoked);
      router.refresh();
    });
  }

  return (
    <Card title={labels.sessions} subtitle={labels.sessionsHint}>
      <ul className="divide-line-subtle divide-y">
        {sessions.map((s) => (
          <li key={s.token} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-ink-strong truncate text-sm">
                {s.userAgent ?? "—"}
                {s.current && (
                  <span className="text-ink-muted ml-2 text-xs">({labels.thisDevice})</span>
                )}
              </p>
              <p className="text-ink-muted text-xs">
                {new Date(s.createdAt).toLocaleString()}
                {s.ipAddress ? ` · ${s.ipAddress}` : ""}
              </p>
            </div>
            {!s.current && (
              <Button
                variant="secondary"
                size="sm"
                disabled={isPending}
                onClick={() => revoke(s.token)}
              >
                {labels.revoke}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function SecurityForm({ sessions, labels }: { sessions: SessionRow[]; labels: Labels }) {
  return (
    <div className="space-y-6">
      <PasswordCard labels={labels} />
      <SessionsCard sessions={sessions} labels={labels} />
    </div>
  );
}
