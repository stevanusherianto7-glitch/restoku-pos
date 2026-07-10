import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { RefundVoidManager } from '../../Components/POS/RefundVoidManager';
import { RoleGuard } from '../../Components/RoleGuard';

function RefundVoidManagerPageInner() {
    return (
        <MainLayout>
            <Head title="RefundVoidManager" />
            <RefundVoidManager />
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function RefundVoidManagerPage() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Refund & Void" allowedRoleLabel="Manager, Owner">
            <RefundVoidManagerPageInner />
        </RoleGuard>
    );
}
