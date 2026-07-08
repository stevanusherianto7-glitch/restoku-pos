import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { StafShift } from "../../Components/Placeholder/StafShift";
import { RoleGuard } from "../../Components/RoleGuard";

function StafShiftPageInner() {
  return (
    <MainLayout>
      <Head title="StafShift" />
      <StafShift />
    </MainLayout>
  );
}


// --- Role Guard Wrapper -------------------------------------------------------
export default function StafShiftPage() {
  return (
    <RoleGuard allowedRoles={["manager","owner"]} pageName="Shift Kerja" allowedRoleLabel="Manager, Owner">
      <StafShiftPageInner />
    </RoleGuard>
  );
}