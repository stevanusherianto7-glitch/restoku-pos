import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { CashierSession } from '../../Components/POS/CashierSession';
import { RoleGuard } from '../../Components/RoleGuard';

function CashierSessionPageInner() {
    return (
        <MainLayout>
            <Head title="CashierSession" />
            <CashierSession />
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function CashierSessionPage() {
    return (
        <RoleGuard
            allowedRoles={['kasir', 'manager', 'owner']}
            pageName="Sesi Kasir"
            allowedRoleLabel="Kasir, Manager, Owner"
        >
            <CashierSessionPageInner />
        </RoleGuard>
    );
}
