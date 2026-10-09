"use client";

import { Button } from "@crm/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@crm/ui/components/form";
import { Input } from "@crm/ui/components/input";
import { toast } from "@crm/ui/components/toast";
import { AuthLayout } from "@crm/ui/templates/auth-layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { createOrganization } from "@/server/actions/organization";

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tl = useTranslations("auth.layout");
  const formSchema = z.object({
    name: z.string().trim().min(2, t("orgNameMin")).max(80),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await createOrganization(values);
    if (!result.ok) {
      toast.error(result.error);
    }
    // on success the server action redirects to /app
  }

  return (
    <AuthLayout
      lead={tl("lead")}
      payoff={tl("payoff")}
      nodes={tl.raw("nodes") as [string, string, string, string]}
    >
      <div className="mb-4">
        <h1 className="font-display text-h2 text-ink-strong font-semibold">{t("title")}</h1>
        <p className="text-ink-muted text-md mt-2">{t("description")}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("orgName")}</FormLabel>
                <FormControl>
                  <Input
                    shape="rounded"
                    size="lg"
                    placeholder={t("orgNamePlaceholder")}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            variant="primary"
            type="submit"
            size="lg"
            fullWidth
            loading={form.formState.isSubmitting}
          >
            {t("submit")}
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}
