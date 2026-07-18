/**
 * Auth feature — public API barrel.
 *
 * Export only what other parts of the app should consume.
 * Add exports here as the feature grows.
 */

export { default as AuthPage } from './components/AuthPage';
export { useLogin, useLogout } from './hooks/useAuth';
export * from './utils/authSchemas';
