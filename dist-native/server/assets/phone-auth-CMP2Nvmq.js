import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
import { s as supabase } from "./router-L3bJVu16.js";
const lovableAuth = createLovableAuth();
const lovable = {
  auth: {
    signInWithOAuth: async (provider, opts) => {
      const result = await lovableAuth.signInWithOAuth(provider, {
        redirect_uri: opts?.redirect_uri,
        extraParams: {
          ...opts?.extraParams
        }
      });
      if (result.redirected) {
        return result;
      }
      if (result.error) {
        return result;
      }
      try {
        await supabase.auth.setSession(result.tokens);
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
      return result;
    }
  }
};
const PHONE_EMAIL_DOMAIN = "phone.zyrafit.app";
function normalizePhone(raw) {
  return raw.replace(/\D/g, "");
}
function isValidPhoneNumber(raw) {
  const digits = normalizePhone(raw);
  return digits.length >= 7 && digits.length <= 15;
}
function phoneToEmail(raw) {
  return `${normalizePhone(raw)}@${PHONE_EMAIL_DOMAIN}`;
}
export {
  isValidPhoneNumber as i,
  lovable as l,
  normalizePhone as n,
  phoneToEmail as p
};
