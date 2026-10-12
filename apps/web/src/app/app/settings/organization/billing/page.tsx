import { SettingsStubPage } from "../../stub-page";

export const dynamic = "force-dynamic";

export default function OrganizationBillingPage() {
  return <SettingsStubPage itemKey="billing" icon="gauge" permission={{ billing: ["read"] }} />;
}
