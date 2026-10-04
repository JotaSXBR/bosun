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
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createChannelConnectionAction } from "@/server/actions/integrations";

const nameField = z.string().trim().min(1, "Informe um nome").max(120);

const formSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("waha"),
    name: nameField,
    baseUrl: z.url("Informe uma URL válida"),
    apiKey: z.string().min(1, "Obrigatório"),
    webhookHmacKey: z.string().min(1, "Obrigatório"),
    session: z.string().optional(),
  }),
  z.object({
    kind: z.literal("meta_cloud"),
    name: nameField,
    phoneNumberId: z.string().min(1, "Obrigatório"),
    accessToken: z.string().min(1, "Obrigatório"),
    appSecret: z.string().min(1, "Obrigatório"),
    verifyToken: z.string().min(1, "Obrigatório"),
    graphApiVersion: z.string().optional(),
  }),
]);

type FormValues = z.input<typeof formSchema>;

const WAHA_FIELDS = [
  { name: "baseUrl", label: "URL base do WAHA", placeholder: "http://localhost:3001" },
  { name: "apiKey", label: "API key", placeholder: "" },
  { name: "webhookHmacKey", label: "Webhook HMAC key", placeholder: "" },
  { name: "session", label: "Sessão (opcional)", placeholder: "default" },
] as const;

const META_FIELDS = [
  { name: "phoneNumberId", label: "Phone number ID", placeholder: "" },
  { name: "accessToken", label: "Access token", placeholder: "" },
  { name: "appSecret", label: "App secret", placeholder: "" },
  { name: "verifyToken", label: "Verify token", placeholder: "" },
  { name: "graphApiVersion", label: "Graph API version (opcional)", placeholder: "v26.0" },
] as const;

export function NewConnectionForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { kind: "waha", name: "" },
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const fields = kind === "waha" ? WAHA_FIELDS : META_FIELDS;

  async function onSubmit(values: FormValues) {
    const { kind, name, ...credentials } = values;
    const result = await createChannelConnectionAction({ kind, name, credentials });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Conexão criada. Configure o webhook no provedor.");
    form.reset(
      kind === "waha"
        ? { kind, name: "", baseUrl: "", apiKey: "", webhookHmacKey: "", session: "" }
        : {
            kind,
            name: "",
            phoneNumberId: "",
            accessToken: "",
            appSecret: "",
            verifyToken: "",
            graphApiVersion: "",
          },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova conexão</CardTitle>
        <CardDescription>Conecte uma conta WAHA ou Meta Cloud</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <FormControl>
                      <select
                        className="border-input h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs"
                        {...field}
                      >
                        <option value="waha">WAHA (WhatsApp)</option>
                        <option value="meta_cloud">Meta Cloud API</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="WhatsApp principal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((item) => (
                <FormField
                  key={`${kind}-${item.name}`}
                  control={form.control}
                  name={item.name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{item.label}</FormLabel>
                      <FormControl>
                        <Input placeholder={item.placeholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Criar conexão
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
