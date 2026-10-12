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
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateOrgSettingsAction } from "@/server/actions/settings";

const formSchema = (t: ReturnType<typeof useTranslations>) =>
  z.object({
    timezone: z.string().trim().min(1, t("org.timezoneRequired")).max(64),
  });

type FormValues = z.infer<ReturnType<typeof formSchema>>;

export function GeneralForm({ timezone }: { timezone: string }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema(t)),
    defaultValues: { timezone },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateOrgSettingsAction({ timezone: values.timezone });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(t("general.saved"));
    router.refresh();
  }

  return (
    <Card title={t("org.timezone")}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("org.timezone")}</FormLabel>
                <FormControl>
                  <Input shape="rounded" placeholder="America/Sao_Paulo" {...field} />
                </FormControl>
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
