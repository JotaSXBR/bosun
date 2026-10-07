"use client";

import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { Suspense } from "react";

function Demo() {
  const token = useSearchParams().get("token");
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-10">
      <h1 className="text-2xl font-semibold">Widget demo</h1>
      {token ? (
        <>
          <p className="text-muted-foreground text-sm">
            Página simulando o site do cliente — o balão no canto carrega o widget embarcável com a
            conexão informada.
          </p>
          <div className="border-border space-y-2 border p-6">
            <p className="text-sm">Conteúdo do site do cliente…</p>
            <p className="text-muted-foreground text-xs">token: {token.slice(0, 12)}…</p>
          </div>
          <Script
            src="/widget.js"
            data-bosun-widget
            data-token={token}
            strategy="afterInteractive"
          />
        </>
      ) : (
        <p className="text-muted-foreground text-sm">
          Informe <code>?token=&lt;webhookToken-da-conexão-site_chat&gt;</code> na URL — o token
          aparece em <code>/app/integrations</code> no snippet do widget.
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
