import { SettingsStubPage } from "../../stub-page";

export const dynamic = "force-dynamic";

export default function OrganizationAuditPage() {
  return <SettingsStubPage itemKey="audit" icon="history" permission={{ audit: ["read"] }} />;
}
