import type { PanelProps } from '../types';

export default function Sidebar(props: PanelProps) {
    const { activeTab, onTabChange, saveStatus, allTabs, tabIcons, tabLabels, isLight } = props;

    return (
        <aside className="flex md:flex-col gap-2 md:gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {allTabs.map((tab) => {
                const IconComponent = tabIcons[tab];
                const isActive = activeTab === tab;
                const isSaved = saveStatus === 'saved' && isActive;
                return (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={[
                            'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all shrink-0 w-full text-left',
                            isActive
                                ? isLight
                                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20'
                                    : 'bg-white/10 text-white shadow-lg shadow-black/20 border border-white/10'
                                : isLight
                                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  : 'bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/5',
                        ].join(' ')}
                    >
                        <IconComponent
                            className={`size-5 ${isActive && !isLight ? 'text-[var(--color-primary)]' : isLight && isActive ? 'text-white' : ''}`}
                        />
                        <span className="hidden sm:inline">{tabLabels[tab]}</span>
                        {isSaved && <span className="ml-auto size-2 rounded-full bg-emerald-400 animate-pulse" />}
                    </button>
                );
            })}
        </aside>
    );
}
