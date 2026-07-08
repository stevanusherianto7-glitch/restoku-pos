import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { DashboardInventory } from "../../Components/Inventory/DashboardInventory";
import { RoleGuard } from "../../Components/RoleGuard";

function DashboardInventoryPageInner() {
  return (
    <MainLayout>
      <Head title="DashboardInventory" />
      <DashboardInventory />
    </MainLayout>
  );
}


// --- Role Guard Wrapper -------------------------------------------------------
export default function DashboardInventoryPage() {
  return (
    <RoleGuard allowedRoles={["manager","owner"]} pageName="Dasbor Inventaris" allowedRoleLabel="Manager, Owner">
      <DashboardInventoryPageInner />
    </RoleGuard>
  );
}