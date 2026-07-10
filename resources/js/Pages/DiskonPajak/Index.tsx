import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { DiskonPajak } from '../../Components/Placeholder/DiskonPajak';
import { RoleGuard } from '../../Components/RoleGuard';

function DiskonPajakPageInner() {
    return (
        <MainLayout>
            <Head title="DiskonPajak" />
            <DiskonPajak />
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function DiskonPajakPage() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Diskon & Pajak" allowedRoleLabel="Manager, Owner">
            <DiskonPajakPageInner />
        </RoleGuard>
    );
}
