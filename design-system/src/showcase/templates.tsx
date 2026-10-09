"use client";

import * as React from "react";

import { Button } from "../components/button";
import { IconButton } from "../components/icon-button";
import { Input } from "../components/input";
import { AppTopBar } from "../templates/app-top-bar";
import { AuthLayout } from "../templates/auth-layout";
import { CommandPalette, useCommandShortcut } from "../templates/command-palette";
import { EmptyState } from "../templates/empty-state";
import { PageHeader } from "../templates/page-header";
import { UserMenu } from "../templates/user-menu";
import { Group, Section } from "./helpers";

const MODULES = [
  { id: "home", label: "Início", icon: "house" as const },
  { id: "inbox", label: "Atendimento", icon: "inbox" as const, badge: 3 },
  { id: "deals", label: "Negócios", icon: "folder-kanban" as const },
  { id: "integrations", label: "Integrações", icon: "plug" as const },
  { id: "settings", label: "Configurações", icon: "settings" as const },
];

function PaletteDemo() {
  const [open, setOpen] = React.useState(false);
  useCommandShortcut(React.useCallback(() => setOpen(true), []));
  return (
    <>
      <Button iconLeft="search" onClick={() => setOpen(true)}>
        Abrir paleta (⌘K)
      </Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        groups={[
          {
            label: "Ações",
            items: [
              { id: "new", icon: "square-check", label: "Criar tarefa", onSelect: () => {} },
              { id: "flow", icon: "workflow", label: "Nova automação", onSelect: () => {} },
            ],
          },
          {
            label: "Módulos",
            items: [
              { id: "inbox", icon: "inbox", label: "Atendimento", onSelect: () => {} },
              { id: "deals", icon: "folder-kanban", label: "Negócios", onSelect: () => {} },
            ],
          },
        ]}
      />
    </>
  );
}

export function Templates() {
  const [module, setModule] = React.useState("inbox");
  const [filters, setFilters] = React.useState(["Fila A", "Esta semana"]);
  return (
    <Section title="Templates">
      <Group title="AppTopBar">
        <div className="border-line overflow-hidden rounded-lg border">
          <AppTopBar
            modules={MODULES}
            active={module}
            onModuleChange={setModule}
            actions={
              <>
                <IconButton icon="search" label="Buscar" />
                <IconButton icon="bell" label="Notificações" />
                <UserMenu
                  name="Marina Costa"
                  email="marina@costa.studio"
                  items={[
                    { icon: "settings", label: "Configurações" },
                    { icon: "users", label: "Equipe" },
                    { icon: "log-out", label: "Sair" },
                  ]}
                />
              </>
            }
          />
        </div>
      </Group>
      <Group title="PageHeader">
        <PageHeader
          title="Atendimento"
          tabs={["Todos", "Aguardando", "Resolvidos"]}
          filters={filters}
          onRemoveFilter={(f) => setFilters((cur) => cur.filter((x) => x !== f))}
          right={<IconButton icon="list-filter" label="Filtros" />}
        />
      </Group>
      <Group title="CommandPalette">
        <PaletteDemo />
      </Group>
      <Group title="EmptyState">
        <EmptyState
          icon="inbox"
          title="Nenhum ticket aguardando atendimento."
          body="Quando uma conversa chegar, ela aparece aqui na fila."
          action={<Button iconLeft="refresh-cw">Atualizar</Button>}
        />
      </Group>
      <Group title="AuthLayout">
        <div className="border-line h-160 overflow-hidden overflow-y-auto rounded-lg border">
          <AuthLayout>
            <div className="flex flex-col gap-4">
              <h1 className="font-display text-h2 text-ink-strong font-semibold">
                Entrar na BOSUN
              </h1>
              <Input shape="rounded" size="lg" label="E-mail" icon="at-sign" />
              <Input shape="rounded" size="lg" label="Senha" type="password" icon="lock" />
              <Button variant="primary" size="lg" fullWidth>
                Entrar
              </Button>
            </div>
          </AuthLayout>
        </div>
      </Group>
    </Section>
  );
}
