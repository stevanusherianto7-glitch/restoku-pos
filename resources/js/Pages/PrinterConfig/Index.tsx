import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { PrinterConfig } from '../../Components/Settings/PrinterConfig';
import { RoleGuard } from '../../Components/RoleGuard';

function PrinterConfigPageInner() {
    return (
        <MainLayout>
            <Head title="PrinterConfig" />
            <PrinterConfig />
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function PrinterConfigPage() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Printer Config" allowedRoleLabel="Manager, Owner">
            <PrinterConfigPageInner />
        </RoleGuard>
    );
}
