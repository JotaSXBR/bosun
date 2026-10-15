"use client";

import { Button } from "@crm/design-system/components/button";
import { Dialog } from "@crm/design-system/components/dialog";
import { Input } from "@crm/design-system/components/input";
import { Label } from "@crm/design-system/components/label";
import { Textarea } from "@crm/design-system/components/textarea";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { updateContactProfileAction } from "@/server/actions/contacts";

type EditableContact = {
  id: string;
  displayName: string | null;
  channelUserId: string;
  metadata: Record<string, unknown>;
};

type FormState = Record<
  | "displayName"
  | "email"
  | "phone"
  | "company"
  | "jobTitle"
  | "birthday"
  | "address"
  | "urls"
  | "notes",
  string
>;

function initialForm(contact: EditableContact): FormState {
  const str = (key: string) => {
    const v = contact.metadata[key];
    return typeof v === "string" ? v : "";
  };
  const urls = contact.metadata.urls;
  return {
    displayName: contact.displayName ?? "",
    email: str("email"),
    phone: str("phone"),
    company: str("company"),
    jobTitle: str("jobTitle"),
    birthday: str("birthday"),
    address: str("address"),
    urls: Array.isArray(urls) ? urls.filter((u) => typeof u === "string").join("\n") : "",
    notes: str("notes"),
  };
}

/** Row action for /app/contacts: edits the whole profile; empty fields clear. */
export function EditContactButton({ contact }: { contact: EditableContact }) {
  const t = useTranslations("contacts.edit");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setFormState] = useState<FormState>(() => initialForm(contact));
  const [pending, startTransition] = useTransition();
  const setForm = (patch: Partial<FormState>) => setFormState((prev) => ({ ...prev, ...patch }));

  function openDialog() {
    setFormState(initialForm(contact));
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      const { urls, ...rest } = form;
      const result = await updateContactProfileAction({
        contactId: contact.id,
        ...rest,
        urls: urls
          .split("\n")
          .map((u) => u.trim())
          .filter(Boolean),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(t("saved"));
      setOpen(false);
      router.refresh();
    });
  }

  const field = (key: keyof FormState, label: string, props: { maxLength: number }) => (
    <div className="space-y-1.5">
      <Label htmlFor={`edit-${key}`}>{label}</Label>
      <Input
        shape="rounded"
        id={`edit-${key}`}
        value={form[key]}
        onChange={(e) => setForm({ [key]: e.target.value })}
        {...props}
      />
    </div>
  );

  const area = (key: keyof FormState, label: string, hint?: string) => (
    <div className="space-y-1.5">
      <Label htmlFor={`edit-${key}`}>{label}</Label>
      <Textarea
        id={`edit-${key}`}
        rows={3}
        value={form[key]}
        onChange={(e) => setForm({ [key]: e.target.value })}
      />
      {hint && <p className="text-ink-muted text-xs">{hint}</p>}
    </div>
  );

  return (
    <>
      <Button variant="ghost" size="sm" onClick={openDialog}>
        {t("button")}
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("title")}
        footer={
          <Button variant="primary" onClick={submit} loading={pending}>
            {t("submit")}
          </Button>
        }
      >
        <div className="space-y-4">
          {field("displayName", t("name"), { maxLength: 120 })}
          {field("email", t("email"), { maxLength: 200 })}
          {field("phone", t("phone"), { maxLength: 32 })}
          {field("company", t("company"), { maxLength: 120 })}
          {field("jobTitle", t("jobTitle"), { maxLength: 120 })}
          {field("birthday", t("birthday"), { maxLength: 10 })}
          {area("address", t("address"))}
          {area("urls", t("urls"), t("urlsHint"))}
          {area("notes", t("notes"))}
        </div>
      </Dialog>
    </>
  );
}
