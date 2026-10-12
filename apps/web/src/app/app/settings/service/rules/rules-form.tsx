"use client";

import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useForm } from "react-hook-form";
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
  });

type FormValues = z.infer<ReturnType<typeof formSchema>>;

export function RulesForm({ ticketReopenWindowHours }: { ticketReopenWindowHours: number }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: { ticketReopenWindowHours: String(ticketReopenWindowHours) },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateOrgSettingsAction({
      ticketReopenWindowHours: Number(values.ticketReopenWindowHours),
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("rules.saved"));
    router.refresh();
  }

  return (
    <Card title={t("hub.items.rules")}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="ticketReopenWindowHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("org.reopenWindow")}</FormLabel>
                <FormControl>
                  <Input shape="rounded" type="number" min={1} max={168} {...field} />
                </FormControl>
                <FormDescription>{t("org.reopenWindowHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button variant="primary" type="submit" disabled={form.formState.isSubmitting}>
            {t("org.submit")}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
