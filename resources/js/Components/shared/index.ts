// ─── Shared Components Barrel Export ─────────────────────────────────────────
// The single import point for all shared design system primitives.
//
// Usage:
//   import { Button, Input, Badge, Glass, Screen } from '../../Components/shared';

export { Button } from './Button';
export { Input } from './Input';
export { Badge, toneMap, cardToneMap } from './Badge';
export { Glass } from './Glass';
export { Screen } from './Screen';
export { ErrorBoundary } from './ErrorBoundary';

// Re-export types only
export type { ButtonProps } from './Button';
export type { InputProps } from './Input';
export type { Tone } from './Badge';
