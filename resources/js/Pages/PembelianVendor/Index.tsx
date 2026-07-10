import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { PembelianVendor } from '../../Components/Placeholder/PembelianVendor';
import { RoleGuard } from '../../Components/RoleGuard';

function PembelianVendorPageInner() {
    return (
        <MainLayout>
            <Head title="PembelianVendor" />
            <PembelianVendor />
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function PembelianVendorPage() {
    return (
        <RoleGuard
            allowedRoles={['manager', 'owner']}
            pageName="Supplier & Pembelian"
            allowedRoleLabel="Manager, Owner"
        >
            <PembelianVendorPageInner />
        </RoleGuard>
    );
}
