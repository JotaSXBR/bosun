"use client";

import type { OrganizationSettingsRow } from "@crm/core/organizations";
import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@crm/ui/components/form";
import { Input } from "@crm/ui/components/input";
import { Textarea } from "@crm/ui/components/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateOrgSettingsAction } from "@/server/actions/settings";

const formSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    ticketReopenWindowHours: z
      .string()
      .trim()
      .refine((v) => /^\d+$/.test(v), t("org.integerRequired"))
      .refine((v) => Number(v) >= 1, t("org.minHour"))
      .refine((v) => Number(v) <= 168, t("org.maxHours")),
    offHoursMessage: z.string().trim().max(500, t("org.offHoursMax")),
    timezone: z.string().trim().min(1, t("org.timezoneRequired")).max(64),
    locale: z.string().trim().min(2).max(16),
  });

type FormValues = z.infer<ReturnType<typeof formSchema>>;

export function SettingsForm({
  settings,
  canEdit,
}: {
  settings: OrganizationSettingsRow;
  canEdit: boolean;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: {
      ticketReopenWindowHours: String(settings.ticketReopenWindowHours),
      offHoursMessage: settings.offHoursMessage ?? "",
      timezone: settings.timezone,
      locale: settings.locale,
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateOrgSettingsAction({
      ticketReopenWindowHours: Number(values.ticketReopenWindowHours),
      // empty means "no off-hours message" — the column is nullable
      offHoursMessage: values.offHoursMessage.trim() ? values.offHoursMessage : null,
      timezone: values.timezone,
      locale: values.locale,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("org.saved"));
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("org.title")}</CardTitle>
        <CardDescription>{t("org.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ticketReopenWindowHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("org.reopenWindow")}</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={168} disabled={!canEdit} {...field} />
                    </FormControl>
                    <FormDescription>{t("org.reopenWindowHint")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("org.timezone")}</FormLabel>
                    <FormControl>
                      <Input placeholder="America/Sao_Paulo" disabled={!canEdit} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("org.locale")}</FormLabel>
                    <FormControl>
                      <Input placeholder="pt-BR" disabled={!canEdit} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="offHoursMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("org.offHours")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t("org.offHoursPlaceholder", {
                        proximo_atendimento: "{proximo_atendimento}",
                      })}
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("org.offHoursHint", { proximo_atendimento: "{proximo_atendimento}" })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canEdit && (
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {t("org.submit")}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
