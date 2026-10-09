"use client";

import * as React from "react";

import { Tabs } from "../components/tabs";
import { Wordmark } from "../components/wordmark";
import { ComponentesA } from "./componentes-a";
import { ComponentesB } from "./componentes-b";
import { Fundamentos } from "./fundamentos";

export function Showcase() {
  const [theme, setTheme] = React.useState("escuro");
  const body = (
    <div className="flex flex-col gap-12">
      <Fundamentos />
      <ComponentesA />
      <ComponentesB />
    </div>
  );
  return (
    <div
      data-theme={theme === "claro" ? "light" : "dark"}
      className="bg-page text-ink min-h-screen font-sans"
    >
      <header className="max-w-page mx-auto flex items-center justify-between gap-6 px-8 py-6">
        <div className="flex items-baseline gap-3">
          <Wordmark size="md" />
          <span className="text-ui text-ink-muted">Design system</span>
        </div>
        <Tabs
          variant="pill"
          items={[
            { value: "escuro", label: "Escuro" },
            { value: "claro", label: "Claro" },
            { value: "lado", label: "Lado a lado" },
          ]}
          value={theme}
          onChange={setTheme}
        />
      </header>
      <main className="max-w-page mx-auto px-8 pb-24">
        {theme === "lado" ? (
          <div className="grid grid-cols-2 gap-6">
            <div data-theme="dark" className="bg-page text-ink rounded-xl p-6">
              {body}
            </div>
            <div data-theme="light" className="bg-page text-ink rounded-xl p-6">
              {body}
            </div>
          </div>
        ) : (
          body
        )}
      </main>
    </div>
  );
}
