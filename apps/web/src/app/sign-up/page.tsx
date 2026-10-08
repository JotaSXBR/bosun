"use client";

import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@crm/ui/components/form";
import { Input } from "@crm/ui/components/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const t = useTranslations("auth.signUp");
  const tVal = useTranslations("validation");
  const tc = useTranslations("common");
  const router = useRouter();
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
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tc("name")}</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
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
                      <Input type="email" autoComplete="email" {...field} />
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
                      <Input type="password" autoComplete="new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {t("submit")}
              </Button>
              <p className="text-muted-foreground text-center text-sm">
                {t("hasAccount")}{" "}
                <Link href="/sign-in" className="underline">
                  {t("signInLink")}
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  );
}
