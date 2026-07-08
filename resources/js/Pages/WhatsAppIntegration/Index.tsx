import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { WhatsAppIntegration } from "../../Components/Settings/WhatsAppIntegration";
import { RoleGuard } from "../../Components/RoleGuard";

function WhatsAppIntegrationPageInner() {
  return (
    <MainLayout>
      <Head title="WhatsAppIntegration" />
      <WhatsAppIntegration />
    </MainLayout>
  );
}


// --- Role Guard Wrapper -------------------------------------------------------
export default function WhatsAppIntegrationPage() {
  return (
    <RoleGuard allowedRoles={["manager","owner"]} pageName="WhatsApp Integration" allowedRoleLabel="Manager, Owner">
      <WhatsAppIntegrationPageInner />
    </RoleGuard>
  );
}