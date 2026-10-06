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
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { updateOrgSettingsAction } from "@/server/actions/settings";

const formSchema = z.object({
  ticketReopenWindowHours: z
    .string()
    .trim()
    .refine((v) => /^\d+$/.test(v), "Informe um número inteiro")
    .refine((v) => Number(v) >= 1, "Mínimo de 1 hora")
    .refine((v) => Number(v) <= 168, "Máximo de 168 horas"),
  offHoursMessage: z.string().trim().max(500, "Máximo de 500 caracteres"),
  timezone: z.string().trim().min(1, "Informe o fuso horário").max(64),
  locale: z.string().trim().min(2).max(16),
});

type FormValues = z.infer<typeof formSchema>;

export function SettingsForm({
  settings,
  canEdit,
}: {
  settings: OrganizationSettingsRow;
  canEdit: boolean;
}) {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
    toast.success("Configurações salvas.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organização</CardTitle>
        <CardDescription>
          Preferências de atendimento aplicadas a toda a organização.
        </CardDescription>
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
                    <FormLabel>Janela de reabertura (horas)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={168} disabled={!canEdit} {...field} />
                    </FormControl>
                    <FormDescription>
                      Tempo em que um ticket resolvido pode ser reaberto (1–168).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuso horário</FormLabel>
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
                    <FormLabel>Idioma</FormLabel>
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
                  <FormLabel>Mensagem fora do horário</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Estamos fora do horário de atendimento. Voltamos {proximo_atendimento}."
                      disabled={!canEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Use {"{proximo_atendimento}"} para indicar o próximo horário de atendimento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canEdit && (
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Salvar configurações
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
