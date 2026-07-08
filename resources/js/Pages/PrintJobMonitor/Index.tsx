import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { PrintJobMonitor } from "../../Components/Settings/PrintJobMonitor";
import { RoleGuard } from "../../Components/RoleGuard";

function PrintJobMonitorPageInner() {
  return (
    <MainLayout>
      <Head title="PrintJobMonitor" />
      <PrintJobMonitor />
    </MainLayout>
  );
}


// --- Role Guard Wrapper -------------------------------------------------------
export default function PrintJobMonitorPage() {
  return (
    <RoleGuard allowedRoles={["manager","owner"]} pageName="Antrean Cetak" allowedRoleLabel="Manager, Owner">
      <PrintJobMonitorPageInner />
    </RoleGuard>
  );
}