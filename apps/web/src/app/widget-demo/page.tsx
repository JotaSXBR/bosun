"use client";

import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

function Demo() {
  const t = useTranslations("widgetDemo");
  const token = useSearchParams().get("token");
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 className="text-h3 font-semibold">{t("title")}</h1>
      {token ? (
        <>
          <p className="text-ink-muted text-sm">{t("description")}</p>
          <div className="border-line space-y-2 border p-6">
            <p className="text-sm">{t("fakeContent")}</p>
            <p className="text-ink-muted text-xs">
              {t("tokenLabel", { token: token.slice(0, 12) })}
            </p>
          </div>
          <Script
            src="/widget.js"
            data-bosun-widget
            data-token={token}
            strategy="afterInteractive"
          />
        </>
      ) : (
        <p className="text-ink-muted text-sm">
          {t.rich("noToken", { code: (chunks) => <code>{chunks}</code> })}
        </p>
      )}
    </main>
  );
}

export default function WidgetDemoPage() {
  return (
    <Suspense>
      <Demo />
    </Suspense>
  );
}
