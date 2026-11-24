import { FAKE_STORE_RESOURCES } from './FakeStore/FakeStoreApi';

/** Todos los recursos CRUD que se pueden usar desde los features. */
export const RESOURCES = [...FAKE_STORE_RESOURCES, 'gorest-users'] as const;
export type ResourceName = (typeof RESOURCES)[number];
