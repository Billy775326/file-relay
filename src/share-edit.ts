import type { ShareEditBase, ShareRules } from './store';

export const MAX_PICKUP_COUNT = 2_147_483_647;
export const MAX_EXPIRY_TIME = 253_402_300_799_999; // 9999-12-31, Unix milliseconds.
export function validShareRules(value: unknown): value is ShareRules {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as ShareRules;
  return Number.isSafeInteger(v.pickupCount) &&
    v.pickupCount >= 0 && v.pickupCount <= MAX_PICKUP_COUNT &&
    (v.maxPickups === null || (Number.isSafeInteger(v.maxPickups) && v.maxPickups >= 1 && v.maxPickups <= MAX_PICKUP_COUNT)) &&
    (v.expireAt === null || (Number.isSafeInteger(v.expireAt) && v.expireAt >= 0 && v.expireAt <= MAX_EXPIRY_TIME));
}
export function validShareBase(value: unknown): value is ShareEditBase {
  return validShareRules(value) && typeof (value as ShareEditBase).id === 'string' &&
    (value as ShareEditBase).id.length > 0 && (value as ShareEditBase).id.length <= 64;
}
