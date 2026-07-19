import { Head } from '@inertiajs/react';
import { useCustomerViewData } from '../../Hooks/useCustomerViewData';
import { buildTheme } from '../../lib/customerViewTheme';
import { HelpCircleIcon } from '../../Components/icons';
import { MenuDetailSheet } from './components/MenuDetailSheet';
import { CartPanel } from './components/CartPanel';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { MenuItemCard } from './components/MenuItemCard';
import { WelcomeModal } from './components/WelcomeModal';
import { AppHeader } from './components/AppHeader';
import { ReservationPanel } from './components/ReservationPanel';
import { GalleryPanel } from './components/GalleryPanel';
import { StatusPanel } from './components/StatusPanel';
import { FloatingCheckout } from './components/FloatingCheckout';

export interface MenuItem {
    id: number;
    name: string;
    price: number;
    category: string;
    image?: string;
    photo_url?: string;
    description?: string;
    isPopular?: boolean;
    rating?: number;
    cookTime?: string;
    servings?: string;
    steps?: string[];
    combo?: string;
    reviews?: { name: string; text: string; rating: number }[];
}

export default function CustomerView() {
    const data = useCustomerViewData();
    const { activeTheme, isDarkTheme, modalStyle, headerBg, headerBorder } = buildTheme(
        data.screenMode,
        data.tenantLayout,
    );

    return (
        <div className={activeTheme.outer}>
            <Head title={`E-Menu - ${data.outletName}`} />

            <style>{`
                @keyframes rsPulseRing{0%{box-shadow:0 0 0 0 rgba(255,91,53,.55)}70%{box-shadow:0 0 0 8px rgba(255,91,53,0)}100%{box-shadow:0 0 0 0 rgba(255,91,53,0)}}
                @keyframes rsPulseDone{0%{box-shadow:0 0 0 0 rgba(15,138,77,.45)}70%{box-shadow:0 0 0 6px rgba(15,138,77,0)}100%{box-shadow:0 0 0 0 rgba(15,138,77,0)}}
                .rs-step-on{animation:rsPulseRing 1.4s infinite}
                .rs-step-done{animation:rsPulseDone 1.8s infinite}
                @media (prefers-reduced-motion: reduce){.rs-step-on,.rs-step-done{animation:none}}
            `}</style>

            <AppHeader
                appStage={data.appStage}
                headerBg={headerBg}
                headerBorder={headerBorder}
                activeTheme={activeTheme}
                outletName={data.outletName}
                tableNumber={data.tableNumber}
                isNanoBanana={data.isNanoBanana}
                activeTab={data.activeTab}
                setActiveTab={data.setActiveTab}
                cartTotalItems={data.cartTotalItems}
                categories={data.categories}
                activeCategory={data.activeCategory}
                setActiveCategory={data.setActiveCategory}
                searchQuery={data.searchQuery}
                setSearchQuery={data.setSearchQuery}
                renderLogo={data.renderLogo}
            />

            {data.appStage !== 'app' && (
                <WelcomeModal
                    stage={data.appStage}
                    onStageChange={data.setAppStage}
                    outletName={data.outletName}
                    tenantImage={data.tenantImage}
                    isOutletOpen={data.isOutletOpen}
                    outletScheduleMsg={data.outletScheduleMsg}
                    tableNumber={data.tableNumber}
                    orderType={data.orderType}
                    setOrderType={data.setOrderType}
                    isNanoBanana={data.isNanoBanana}
                    isDarkTheme={isDarkTheme}
                />
            )}

            {data.activeTab === 'menu' && (
                <main className="flex-1 px-4 pb-28 space-y-4 overflow-y-auto">
                    {data.filteredItems.length > 0 ? (
                        data.filteredItems.map((item) => (
                            <MenuItemCard
                                key={item.id}
                                item={item}
                                isNanoBanana={data.isNanoBanana}
                                qty={data.cart[item.id] ?? 0}
                                onOpenDetail={data.setDetailItem}
                                onAdd={data.addToCart}
                                onRemove={data.removeFromCart}
                            />
                        ))
                    ) : (
                        <div className="py-16 text-center text-slate-500">
                            <HelpCircleIcon className="size-12 mx-auto text-slate-600 mb-3" />
                            <p className="text-sm font-semibold">Menu tidak tersedia</p>
                            <p className="text-xs text-slate-500 mt-1">Cari hidangan yang lain.</p>
                        </div>
                    )}
                </main>
            )}

            {data.activeTab === 'cart' && (
                <CartPanel
                    outletSlug={data.outletSlug}
                    tableNumber={data.tableNumber}
                    outletGeo={data.outletGeo}
                    onVerified={(token: string) => {
                        data.setVerifyToken(token);
                        data.setGuestVerified(true);
                    }}
                    cartTotalItems={data.cartTotalItems}
                    cart={data.cart}
                    menuItems={data.menuItems}
                    addToCart={data.addToCart}
                    removeFromCart={data.removeFromCart}
                    orderType={data.orderType}
                    setOrderType={data.setOrderType}
                    chefNotes={data.chefNotes}
                    setChefNotes={data.setChefNotes}
                    cartTotalPrice={data.cartTotalPrice}
                    setActiveTab={data.setActiveTab}
                />
            )}

            <ReservationPanel
                reservationSuccess={data.reservationSuccess}
                setReservationSuccess={data.setReservationSuccess}
                rName={data.rName}
                setRName={data.setRName}
                rPhone={data.rPhone}
                setRPhone={data.setRPhone}
                rDate={data.rDate}
                setRDate={data.setRDate}
                rTime={data.rTime}
                setRTime={data.setRTime}
                rGuests={data.rGuests}
                setRGuests={data.setRGuests}
                rType={data.rType}
                setRType={data.setRType}
                rNotes={data.rNotes}
                setRNotes={data.setRNotes}
                isSubmittingR={data.isSubmittingR}
                handleReservationSubmit={data.handleReservationSubmit}
                setActiveTab={data.setActiveTab}
            />

            <GalleryPanel setActiveTab={data.setActiveTab} />

            <StatusPanel
                orders={data.orders}
                activeOrderId={data.activeOrderId}
                orderHasFood={data.orderHasFood}
                orderHasDrink={data.orderHasDrink}
                orderDrinkServed={data.orderDrinkServed}
                orderFoodServed={data.orderFoodServed}
                setActiveTab={data.setActiveTab}
            />

            <FloatingCheckout
                cartTotalItems={data.cartTotalItems}
                orderSuccess={data.orderSuccess}
                guestVerified={data.guestVerified}
                cartTotalPrice={data.cartTotalPrice}
                handleCheckout={data.handleCheckout}
            />

            {data.orderSuccess && (
                <OrderTrackingModal
                    orderStatus={data.orderStatus}
                    orderTone={data.orderTone}
                    tableNumber={data.tableNumber}
                    activeOrderId={data.activeOrderId}
                    onClose={() => {
                        data.setOrderSuccess(false);
                        data.setCart({});
                        data.setActiveTab('menu');
                    }}
                />
            )}

            {data.detailItem && (
                <MenuDetailSheet
                    item={data.detailItem}
                    outletName={data.outletName}
                    onClose={() => data.setDetailItem(null)}
                    onAdd={data.addToCart}
                />
            )}
        </div>
    );
}
