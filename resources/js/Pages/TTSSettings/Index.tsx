import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { TTSSettings } from '../../Components/Settings/TTSSettings';
import { RoleGuard } from '../../Components/RoleGuard';

function TTSSettingsPageInner() {
    return (
        <MainLayout>
            <Head title="TTSSettings" />
            <TTSSettings />
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function TTSSettingsPage() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Pengaturan TTS" allowedRoleLabel="Manager, Owner">
            <TTSSettingsPageInner />
        </RoleGuard>
    );
}
