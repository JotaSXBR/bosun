import { SettingsStubPage } from "../../stub-page";

export const dynamic = "force-dynamic";

export default function OrganizationMembersPage() {
  return <SettingsStubPage itemKey="members" icon="users" permission={{ member: ["create"] }} />;
}
