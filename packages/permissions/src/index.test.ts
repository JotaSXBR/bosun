import { describe, expect, it } from "vitest";

import { hasPermission, isOrgRole, ORG_ROLES } from "./index";

describe("isOrgRole", () => {
  it("accepts known roles and rejects others", () => {
    for (const role of ORG_ROLES) {
      expect(isOrgRole(role)).toBe(true);
    }
    expect(isOrgRole("superadmin")).toBe(false);
    expect(isOrgRole("")).toBe(false);
  });
});

describe("hasPermission", () => {
  it("owner can do everything", () => {
    expect(
      hasPermission("owner", {
        organization: ["update", "delete"],
        member: ["create", "update", "delete"],
        invitation: ["create", "cancel"],
        audit: ["read"],
      }),
    ).toBe(true);
  });

  it("admin can do everything except organization:delete", () => {
    expect(hasPermission("admin", { organization: ["update"] })).toBe(true);
    expect(hasPermission("admin", { organization: ["delete"] })).toBe(false);
    expect(hasPermission("admin", { member: ["delete"] })).toBe(true);
    expect(hasPermission("admin", { audit: ["read"] })).toBe(true);
  });

  it("manager can only read audit and create invitations", () => {
    expect(hasPermission("manager", { audit: ["read"] })).toBe(true);
    expect(hasPermission("manager", { invitation: ["create"] })).toBe(true);
    expect(hasPermission("manager", { invitation: ["cancel"] })).toBe(false);
    expect(hasPermission("manager", { member: ["create"] })).toBe(false);
    expect(hasPermission("manager", { organization: ["update"] })).toBe(false);
  });

  it("agent has no permissions in the matrix", () => {
    expect(hasPermission("agent", { audit: ["read"] })).toBe(false);
    expect(hasPermission("agent", { invitation: ["create"] })).toBe(false);
    expect(hasPermission("agent", {})).toBe(true);
  });

  it("every member can read integrations and messaging", () => {
    for (const role of ORG_ROLES) {
      expect(hasPermission(role, { integrations: ["read"] })).toBe(true);
      expect(hasPermission(role, { messaging: ["read"] })).toBe(true);
    }
  });

  it("only owner/admin/manager can manage integrations", () => {
    for (const role of ["owner", "admin", "manager"] as const) {
      expect(hasPermission(role, { integrations: ["manage"] })).toBe(true);
    }
    expect(hasPermission("agent", { integrations: ["manage"] })).toBe(false);
  });

  it("only owner/admin can read billing (finance)", () => {
    for (const role of ["owner", "admin"] as const) {
      expect(hasPermission(role, { billing: ["read"] })).toBe(true);
    }
    expect(hasPermission("manager", { billing: ["read"] })).toBe(false);
    expect(hasPermission("agent", { billing: ["read"] })).toBe(false);
    expect(hasPermission("viewer", { billing: ["read"] })).toBe(false);
  });

  it("only owner/admin/manager can manage teams; everyone can read", () => {
    for (const role of ["owner", "admin", "manager"] as const) {
      expect(hasPermission(role, { teams: ["manage"] })).toBe(true);
    }
    expect(hasPermission("agent", { teams: ["manage"] })).toBe(false);
    expect(hasPermission("viewer", { teams: ["manage"] })).toBe(false);
    for (const role of ORG_ROLES) {
      expect(hasPermission(role, { teams: ["read"] })).toBe(true);
    }
  });

  it("viewer is read-only: sees everything, changes nothing, no billing", () => {
    const reads = [
      { audit: ["read"] },
      { integrations: ["read"] },
      { messaging: ["read"] },
      { teams: ["read"] },
    ] as const;
    for (const check of reads) {
      expect(hasPermission("viewer", check)).toBe(true);
    }
    const writes = [
      { billing: ["read"] },
      { organization: ["update"] },
      { member: ["create"] },
      { invitation: ["create"] },
      { integrations: ["manage"] },
      { teams: ["manage"] },
    ] as const;
    for (const check of writes) {
      expect(hasPermission("viewer", check)).toBe(false);
    }
  });
});
