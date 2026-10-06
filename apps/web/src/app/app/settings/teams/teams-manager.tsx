"use client";

import type { OrgMember } from "@crm/core/organizations";
import type { TeamWithMembers } from "@crm/core/teams";
import { Button } from "@crm/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@crm/ui/components/card";
import { Input } from "@crm/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@crm/ui/components/select";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { TeamsActionResult } from "@/server/actions/teams";
import {
  addTeamMemberAction,
  createTeamAction,
  deleteTeamAction,
  removeTeamMemberAction,
  updateTeamAction,
} from "@/server/actions/teams";

type Run = (action: Promise<TeamsActionResult>, success?: string, onSuccess?: () => void) => void;

export function TeamsManager({
  teams,
  members,
  canManage,
}: {
  teams: TeamWithMembers[];
  members: OrgMember[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3366ff");

  const run: Run = (action, success, onSuccess) =>
    startTransition(async () => {
      const result = await action;
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (success) toast.success(success);
      onSuccess?.();
      router.refresh();
    });

  const submitNew = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    run(createTeamAction({ name: trimmed, color }), "Equipe criada.", () => setName(""));
  };

  return (
    <div className="space-y-4">
      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle>Nova equipe</CardTitle>
            <CardDescription>Setores de atendimento (Vendas, Suporte…).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <label htmlFor="new-team-name" className="text-sm font-medium">
                  Nome
                </label>
                <Input
                  id="new-team-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vendas"
                  maxLength={100}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="new-team-color" className="text-sm font-medium">
                  Cor
                </label>
                <input
                  id="new-team-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="border-input block h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
                />
              </div>
              <Button disabled={pending || !name.trim()} onClick={submitNew}>
                Criar equipe
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Equipes</CardTitle>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma equipe ainda.</p>
          ) : (
            <ul className="space-y-4" data-testid="team-list">
              {teams.map((team) => (
                <TeamRow
                  key={team.id}
                  team={team}
                  members={members}
                  canManage={canManage}
                  pending={pending}
                  run={run}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamRow({
  team,
  members,
  canManage,
  pending,
  run,
}: {
  team: TeamWithMembers;
  members: OrgMember[];
  canManage: boolean;
  pending: boolean;
  run: Run;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(team.name);
  const [editColor, setEditColor] = useState(team.color ?? "#3366ff");

  const saveEdit = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    run(
      updateTeamAction({ teamId: team.id, name: trimmed, color: editColor }),
      "Equipe salva.",
      () => setEditing(false),
    );
  };

  const remove = () => {
    if (
      !window.confirm(
        `Excluir a equipe "${team.name}"? Conversas atribuídas a ela ficam sem setor.`,
      )
    ) {
      return;
    }
    run(deleteTeamAction(team.id), "Equipe excluída.");
  };

  return (
    <li className="space-y-3 border-b pb-4 last:border-0">
      <div className="flex items-center justify-between gap-4">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              type="color"
              value={editColor}
              onChange={(e) => setEditColor(e.target.value)}
              aria-label="Cor da equipe"
              className="border-input block h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
            />
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={100}
              aria-label="Nome da equipe"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-4 w-4 rounded-full border"
              style={{ backgroundColor: team.color ?? "transparent" }}
              aria-hidden
            />
            <span className="font-medium">{team.name}</span>
          </div>
        )}
        {canManage && (
          <div className="flex shrink-0 items-center gap-2">
            {editing ? (
              <>
                <Button size="sm" disabled={pending || !editName.trim()} onClick={saveEdit}>
                  Salvar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setEditing(false)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => {
                  setEditName(team.name);
                  setEditColor(team.color ?? "#3366ff");
                  setEditing(true);
                }}
              >
                Editar
              </Button>
            )}
            <Button size="sm" variant="destructive" disabled={pending} onClick={remove}>
              Excluir
            </Button>
          </div>
        )}
      </div>

      <TeamMembers
        team={team}
        members={members}
        canManage={canManage}
        pending={pending}
        run={run}
      />
    </li>
  );
}

function TeamMembers({
  team,
  members,
  canManage,
  pending,
  run,
}: {
  team: TeamWithMembers;
  members: OrgMember[];
  canManage: boolean;
  pending: boolean;
  run: Run;
}) {
  const [newMember, setNewMember] = useState("");
  // Viewers can never work a ticket — no point offering them as members.
  const candidates = members.filter(
    (m) => m.role !== "viewer" && !team.memberUserIds.includes(m.userId),
  );
  const nameOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.name ?? "Usuário removido";

  const addMember = () => {
    if (!newMember) return;
    run(addTeamMemberAction({ teamId: team.id, userId: newMember }), undefined, () =>
      setNewMember(""),
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {team.memberUserIds.length === 0 && (
        <span className="text-muted-foreground text-sm">Sem membros.</span>
      )}
      {team.memberUserIds.map((userId) => (
        <span
          key={userId}
          className="bg-muted inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
        >
          {nameOf(userId)}
          {canManage && (
            <button
              type="button"
              aria-label={`Remover ${nameOf(userId)}`}
              className="hover:text-destructive"
              disabled={pending}
              onClick={() => run(removeTeamMemberAction({ teamId: team.id, userId }))}
            >
              ×
            </button>
          )}
        </span>
      ))}
      {canManage && candidates.length > 0 && (
        <div className="flex items-center gap-1">
          <Select value={newMember} onValueChange={setNewMember} disabled={pending}>
            <SelectTrigger className="h-8 w-44" aria-label={`Adicionar membro em ${team.name}`}>
              <SelectValue placeholder="Adicionar membro…" />
            </SelectTrigger>
            <SelectContent>
              {candidates.map((m) => (
                <SelectItem key={m.userId} value={m.userId}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" disabled={pending || !newMember} onClick={addMember}>
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
}
