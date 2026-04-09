import Cookies from 'js-cookie';

const isBrowser = typeof window !== 'undefined';
const isHttps = isBrowser && window.location.protocol === 'https:';
const configuredCookieDomain = process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN?.trim();
const cookieDomain =
  configuredCookieDomain && configuredCookieDomain.length > 0
    ? configuredCookieDomain
    : undefined;

export const supabaseCookieStorage = {
  getItem: (key: string): string | null =>
    Cookies.get(key) ?? null,

  setItem: (key: string, value: string): void => {
    Cookies.set(key, value, {
      domain: cookieDomain,
      secure: isHttps,
      sameSite: 'lax',
      expires: 365,
    });
  },

  removeItem: (key: string): void => {
    Cookies.remove(key, {
      domain: cookieDomain,
    });
  },
};
