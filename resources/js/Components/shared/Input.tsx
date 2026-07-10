import { type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { useTenantSettings } from '../Shared';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    error?: string;
    label?: string;
    hint?: string;
};

/**
 * Input component — dark-mode & light-mode responsive with error state support.
 */
export function Input({ className = '', error, label, hint, id, ...props }: InputProps) {
    const { screenMode } = useTenantSettings();
    const isLight = screenMode === 'terang';
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className={`block text-xs font-semibold ml-0.5 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}
                >
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    'w-full border rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2',
                    isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 hover:border-slate-400 shadow-xs'
                        : 'bg-white/[0.03] hover:bg-white/[0.05] text-slate-100 placeholder:text-slate-500',
                    error
                        ? isLight
                            ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20'
                            : 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                        : isLight
                          ? 'focus:border-blue-600 focus:ring-blue-600/20'
                          : 'border-white/10 focus:border-emerald-500 focus:ring-emerald-500/20',
                    className,
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-500 ml-0.5 font-medium">{error}</p>}
            {hint && !error && (
                <p className={`text-xs ml-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{hint}</p>
            )}
        </div>
    );
}
