"use client";

import { Button } from "@crm/design-system/components/button";
import { Card } from "@crm/design-system/components/card";
import { toast } from "@crm/design-system/components/toast";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { acceptInvitationAction } from "@/server/actions/members";

interface Labels {
  title: string;
  description: string;
  accept: string;
  accepted: string;
}

/** Invalid/expired/wrong-email state — rendered by the page. */
export function InvalidInvitation({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <div className="space-y-2 p-2 text-center">
        <h1 className="font-display text-h3 text-ink-strong font-semibold">{title}</h1>
        <p className="text-ink-muted text-sm">{body}</p>
      </div>
    </Card>
  );
}

export function AcceptInvitationCard({
  invitationId,
  labels,
}: {
  invitationId: string;
  organizationName: string;
  labels: Labels;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const result = await acceptInvitationAction({ invitationId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(labels.accepted);
      router.push("/app");
      router.refresh();
    });
  }

  return (
    <Card>
      <div className="space-y-4 p-2">
        <h1 className="font-display text-h2 text-ink-strong font-semibold">{labels.title}</h1>
        <p className="text-ink-muted text-md">{labels.description}</p>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isPending}
          onClick={accept}
          data-testid="accept-invitation"
        >
          {labels.accept}
        </Button>
      </div>
    </Card>
  );
}
