// Phone-number sign-up/sign-in without SMS.
// A phone number is turned into a deterministic internal address so the
// account system can store it, but users only ever see their number.

export const PHONE_EMAIL_DOMAIN = "phone.zyrafit.app";

/** Keep digits only; a leading + is preserved as a country prefix. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function isValidPhoneNumber(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= 7 && digits.length <= 15;
}

export function phoneToEmail(raw: string): string {
  return `${normalizePhone(raw)}@${PHONE_EMAIL_DOMAIN}`;
}

export function formatPhoneDisplay(raw: string): string {
  const digits = normalizePhone(raw);
  return digits ? `+${digits}` : "";
}
