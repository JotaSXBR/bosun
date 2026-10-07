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
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { createChannelConnectionAction } from "@/server/actions/integrations";

import { PairingPanel } from "./pairing-panel";

type QrCode = { mimeType: string; data: string };

const nameField = z.string().trim().min(1, "Informe um nome").max(120);

// WAHA creds are platform-owned (env) — creating one needs only a name and
// the QR opens right away. Meta credentials stay per-connection.
const formSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("waha"),
    name: nameField,
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
  z.object({
    kind: z.literal("site_chat"),
    name: nameField,
  }),
]);

type FormValues = z.input<typeof formSchema>;

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
  const [pairing, setPairing] = useState<{ id: string; qr?: QrCode } | null>(null);

  async function onSubmit(values: FormValues) {
    const { kind, name, ...credentials } = values;
    const result = await createChannelConnectionAction(
      kind === "meta_cloud" ? { kind, name, credentials } : { kind, name },
    );
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    form.reset(
      kind === "meta_cloud"
        ? {
            kind,
            name: "",
            phoneNumberId: "",
            accessToken: "",
            appSecret: "",
            verifyToken: "",
            graphApiVersion: "",
          }
        : { kind, name: "" },
    );
    if (result.warning) toast.warning(result.warning);
    if (kind === "site_chat") {
      toast.success("Widget criado — configure e copie o snippet na lista.");
    } else if (kind === "waha") {
      if (result.status === "connected") {
        toast.success("WhatsApp conectado");
      } else {
        setPairing({ id: result.connectionId, qr: result.qrCode });
      }
    } else {
      toast.success(
        result.status === "connected" ? "Conexão criada e validada." : "Conexão criada.",
      );
    }
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
                        <option value="site_chat">Chat do site (widget)</option>
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
            {kind === "meta_cloud" && (
              <div className="grid gap-4 sm:grid-cols-2">
                {META_FIELDS.map((item) => (
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
            )}
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Criar conexão
            </Button>
          </form>
        </Form>
        {pairing && (
          <PairingPanel id={pairing.id} initialQr={pairing.qr} onDone={() => setPairing(null)} />
        )}
      </CardContent>
    </Card>
  );
}
