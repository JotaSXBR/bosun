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
  });
});
