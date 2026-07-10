import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { StokOpname } from '../../Components/Placeholder/StokOpname';
import { RoleGuard } from '../../Components/RoleGuard';

function StokOpnamePageInner() {
    return (
        <MainLayout>
            <Head title="StokOpname" />
            <StokOpname />
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function StokOpnamePage() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Stock Opname" allowedRoleLabel="Manager, Owner">
            <StokOpnamePageInner />
        </RoleGuard>
    );
}
