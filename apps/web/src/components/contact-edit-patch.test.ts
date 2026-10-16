import { describe, expect, it } from "vitest";

import { changedProfileFields, type ProfileForm } from "./contact-edit-patch";

const base: ProfileForm = {
  displayName: "Maria",
  email: "maria@example.com",
  phone: "",
  company: "Acme",
  jobTitle: "",
  birthday: "",
  address: "",
  urls: "https://acme.test",
  notes: "",
};
const edit = (patch: Partial<ProfileForm>): ProfileForm => ({ ...base, ...patch });

describe("changedProfileFields", () => {
  it("returns nothing when nothing changed", () => {
    expect(changedProfileFields(base, edit({}))).toEqual({});
  });

  it("sends only the field that changed, so untouched fields are never overwritten", () => {
    expect(changedProfileFields(base, edit({ jobTitle: "Diretora" }))).toEqual({
      jobTitle: "Diretora",
    });
  });

  it("never sends the name of a contact that has none, when it was not edited", () => {
    const nameless = { ...base, displayName: "" };
    expect(changedProfileFields(nameless, { ...nameless, company: "Nova" })).toEqual({
      company: "Nova",
    });
  });

  it("trims text and ignores whitespace-only differences", () => {
    expect(changedProfileFields(base, edit({ email: " maria@example.com " }))).toEqual({});
    expect(changedProfileFields(base, edit({ jobTitle: "  Diretora  " }))).toEqual({
      jobTitle: "Diretora",
    });
  });

  it("clears a field by sending an empty string", () => {
    expect(changedProfileFields(base, edit({ company: "" }))).toEqual({ company: "" });
    expect(changedProfileFields(base, edit({ company: "   " }))).toEqual({ company: "" });
  });

  it("splits urls one per line, drops blanks and CRLF, and clears with an empty list", () => {
    expect(
      changedProfileFields(base, edit({ urls: "https://acme.test\r\n\n https://acme.test/x " })),
    ).toEqual({ urls: ["https://acme.test", "https://acme.test/x"] });
    expect(changedProfileFields(base, edit({ urls: "" }))).toEqual({ urls: [] });
    expect(changedProfileFields(base, edit({ urls: " https://acme.test \n" }))).toEqual({});
  });
});
