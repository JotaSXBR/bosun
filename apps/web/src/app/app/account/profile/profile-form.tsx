"use client";

import { Avatar } from "@crm/design-system/components/avatar";
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
import { Label } from "@crm/design-system/components/label";
import { toast } from "@crm/design-system/components/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateProfileAction } from "@/server/actions/account";

interface Labels {
  photo: string;
  photoHint: string;
  upload: string;
  name: string;
  email: string;
  submit: string;
  saved: string;
}

const formSchema = z.object({ name: z.string().trim().min(2).max(80) });

function useAvatarUpload() {
  const tVal = useTranslations("validation");
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/avatar", { method: "POST", body });
      if (!res.ok) {
        toast.error(tVal("avatarUploadFailed"));
        return;
      }
      router.refresh();
    } finally {
      setUploading(false);
    }
  }
  return { uploading, upload };
}

function AvatarUpload({
  name,
  image,
  labels,
}: {
  name: string;
  image: string | null;
  labels: Labels;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useAvatarUpload();

  return (
    <div className="flex items-center gap-4">
      <Avatar src={image ?? undefined} name={name} size="xl" />
      <div className="space-y-2">
        <input
          ref={fileRef}
          id="avatar-file"
          name="avatar"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          data-testid="avatar-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
        <Button variant="secondary" onClick={() => fileRef.current?.click()} loading={uploading}>
          {labels.upload}
        </Button>
        <p className="text-ink-muted text-xs">{labels.photoHint}</p>
      </div>
    </div>
  );
}

function useProfileSubmit(savedLabel: string) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const submit = (name: string) =>
    startTransition(async () => {
      const result = await updateProfileAction({ name });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(savedLabel);
      router.refresh();
    });
  return { isPending, submit };
}

export function ProfileForm({
  name,
  email,
  image,
  labels,
}: {
  name: string;
  email: string;
  image: string | null;
  labels: Labels;
}) {
  const { isPending, submit } = useProfileSubmit(labels.saved);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name },
  });

  return (
    <Card title={labels.photo}>
      <AvatarUpload name={name} image={image} labels={labels} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => submit(v.name))} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{labels.name}</FormLabel>
                <FormControl>
                  <Input shape="rounded" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <Label htmlFor="profile-email">{labels.email}</Label>
            <Input id="profile-email" shape="rounded" value={email} disabled />
          </FormItem>
          <Button variant="primary" type="submit" loading={isPending}>
            {labels.submit}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
