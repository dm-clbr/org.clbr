interface BuildAuthLoginUrlOptions {
  logout?: boolean;
}

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function getConfiguredOrgAppUrl() {
  const configured = process.env.NEXT_PUBLIC_ORG_APP_URL?.trim();
  if (configured) {
    return trimTrailingSlash(configured);
  }
  return "http://localhost:4105";
}

export function getPlatformAppUrl() {
  if (typeof window !== "undefined") {
    return trimTrailingSlash(window.location.origin);
  }
  return getConfiguredOrgAppUrl();
}

export function getPostLoginRedirectUrl() {
  if (typeof window !== "undefined") {
    return `${trimTrailingSlash(window.location.origin)}/dashboard`;
  }
  return `${getConfiguredOrgAppUrl()}/dashboard`;
}

export function getAuthAppUrl() {
  return getPlatformAppUrl();
}

export function getApiBaseUrl() {
  const configuredApiBaseUrl = process.env.NEXT_PUBLIC_PLATFORM_API_BASE_URL?.trim();
  return configuredApiBaseUrl ? trimTrailingSlash(configuredApiBaseUrl) : getPlatformAppUrl();
}

export function buildAuthLoginUrl(returnTo: string, options: BuildAuthLoginUrlOptions = {}) {
  const loginUrl = new URL("/login", getAuthAppUrl());
  if (returnTo.trim()) {
    loginUrl.searchParams.set("returnTo", returnTo.trim());
  }
  if (options.logout) {
    loginUrl.searchParams.set("logout", "1");
  }
  return loginUrl.toString();
}
