import { router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { LandingPage as LandingPageComponent } from '../../Components/LandingPage';

export default function LandingPage() {
    return (
        <>
            <Head title="Restoku - Sistem Restoran Modern" />
            <LandingPageComponent 
                onEnter={() => router.visit('/login')} 
                onEnterOwner={() => router.visit('/owner/login')} 
            />
        </>
    );
}
