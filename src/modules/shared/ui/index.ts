// Single point of entry for every generic/shared component in the app —
// nothing outside this folder should build its own modal, popover, toast,
// input, or badge. Split into files by statefulness (see modal.tsx/popover.tsx/
// toast.tsx vs. the rest) so importing this barrel doesn't force 'use client'
// onto Server Components that only need the static primitives/badge/fields.
export * from './primitives';
export * from './badge';
export * from './fields';
export * from './modal';
export * from './popover';
export * from './toast';
