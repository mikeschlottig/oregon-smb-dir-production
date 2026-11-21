/**
 * A US phone number as people read it: "(541) 310-1523". The listing data stores "(541) 3101523" (P20, 2026-11-21:
 * shown that way on every listing page). Anything that is not a 10-digit US number is returned unchanged.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : phone.trim();
}

/** The `tel:` form of the same number: "+15413101523". */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const ten = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return ten.length === 10 ? `tel:+1${ten}` : `tel:${phone.trim()}`;
}
