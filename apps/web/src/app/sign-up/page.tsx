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
import { IconButton } from "@crm/ui/components/icon-button";
import { Input } from "@crm/ui/components/input";
import { toast } from "@crm/ui/components/toast";
import { AuthLayout } from "@crm/ui/templates/auth-layout";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const t = useTranslations("auth.signUp");
  const tl = useTranslations("auth.layout");
  const tVal = useTranslations("validation");
  const tc = useTranslations("common");
  const tAuth = useTranslations("auth");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const formSchema = z.object({
    name: z.string().min(2, tVal("nameMin")),
    email: z.email(tVal("invalidEmail")),
    password: z.string().min(8, tVal("passwordMin")),
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message ?? t("error"));
      return;
    }
    router.push("/onboarding");
    router.refresh();
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
                <FormLabel>{tc("name")}</FormLabel>
                <FormControl>
                  <Input shape="rounded" size="lg" icon="user" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tc("email")}</FormLabel>
                <FormControl>
                  <Input
                    shape="rounded"
                    size="lg"
                    type="email"
                    icon="at-sign"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tc("password")}</FormLabel>
                <FormControl>
                  <Input
                    shape="rounded"
                    size="lg"
                    type={showPassword ? "text" : "password"}
                    icon="lock"
                    autoComplete="new-password"
                    trailing={
                      <IconButton
                        size="sm"
                        variant="ghost"
                        icon={showPassword ? "eye-off" : "eye"}
                        label={tAuth(showPassword ? "hidePassword" : "showPassword")}
                        onClick={() => setShowPassword((v) => !v)}
                        className="-mr-2"
                      />
                    }
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
          <p className="text-ink-muted text-center text-sm">
            {t("hasAccount")}{" "}
            <Link href="/sign-in" className="underline">
              {t("signInLink")}
            </Link>
          </p>
        </form>
      </Form>
    </AuthLayout>
  );
}
