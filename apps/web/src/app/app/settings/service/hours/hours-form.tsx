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
import { Textarea } from "@crm/design-system/components/textarea";
import { toast } from "@crm/design-system/components/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { updateOrgSettingsAction } from "@/server/actions/settings";

const formSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    offHoursMessage: z.string().trim().max(500, t("org.offHoursMax")),
  });

type FormValues = z.infer<ReturnType<typeof formSchema>>;

function OffHoursField({ form }: { form: UseFormReturn<FormValues> }) {
  const t = useTranslations("settings");
  return (
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
  );
}

export function HoursForm({ offHoursMessage }: { offHoursMessage: string | null }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: { offHoursMessage: offHoursMessage ?? "" },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateOrgSettingsAction({
      // empty means "no off-hours message" — the column is nullable
      offHoursMessage: values.offHoursMessage.trim() ? values.offHoursMessage : null,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("hours.saved"));
    router.refresh();
  }

  return (
    <Card title={t("hub.items.hours")}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <OffHoursField form={form} />
          <Button variant="primary" type="submit" disabled={form.formState.isSubmitting}>
            {t("org.submit")}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
