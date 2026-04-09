import { NextRequest, NextResponse } from "next/server";

const DIRECT_ACCESS_TOKEN_COOKIE_NAMES = ["ava-access-token", "sb-access-token"];
const DIRECT_REFRESH_TOKEN_COOKIE_NAMES = ["ava-refresh-token", "sb-refresh-token"];
const STRUCTURED_SESSION_COOKIE_NAME_PREFIXES = ["sb-clbr-org-auth"];
const SUPABASE_ISSUER_REGEX = /^https?:\/\/([a-z0-9-]+)\.supabase\.co\/auth\/v1\/?$/i;

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseStructuredTokenCookie(rawValue: string) {
  const decoded = decodeCookieValue(rawValue);
  try {
    const parsed = JSON.parse(decoded) as unknown;
    if (Array.isArray(parsed)) {
      return {
        accessToken: typeof parsed[0] === "string" ? parsed[0] : undefined,
        refreshToken: typeof parsed[1] === "string" ? parsed[1] : undefined
      };
    }
    if (parsed && typeof parsed === "object") {
      const parsedRecord = parsed as Record<string, unknown>;
      const accessToken = parsedRecord.access_token;
      const refreshToken = parsedRecord.refresh_token;
      if (typeof accessToken === "string" || typeof refreshToken === "string") {
        return {
          accessToken: typeof accessToken === "string" ? accessToken : undefined,
          refreshToken: typeof refreshToken === "string" ? refreshToken : undefined
        };
      }

      const nestedSession =
        (parsedRecord.currentSession && typeof parsedRecord.currentSession === "object"
          ? (parsedRecord.currentSession as Record<string, unknown>)
          : null) ??
        (parsedRecord.session && typeof parsedRecord.session === "object"
          ? (parsedRecord.session as Record<string, unknown>)
          : null);

      const nestedAccessToken = nestedSession?.access_token;
      const nestedRefreshToken = nestedSession?.refresh_token;
      return {
        accessToken: typeof nestedAccessToken === "string" ? nestedAccessToken : undefined,
        refreshToken: typeof nestedRefreshToken === "string" ? nestedRefreshToken : undefined
      };
    }
  } catch {
    // ignore parse issues
  }
  return {
    accessToken: undefined,
    refreshToken: undefined
  };
}

function resolveCurrentSupabaseProjectRef() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return null;
  }

  try {
    const hostname = new URL(supabaseUrl).hostname;
    const [projectRef] = hostname.split(".");
    return projectRef?.trim().toLowerCase() || null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(accessToken: string): Record<string, unknown> | null {
  const parts = accessToken.split(".");
  if (parts.length < 2) {
    return null;
  }

  const payloadPart = parts[1];
  const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  try {
    const decoded = atob(padded);
    const payload = JSON.parse(decoded) as unknown;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      return payload as Record<string, unknown>;
    }
  } catch {
    // Ignore malformed tokens and let callers decide fallback behavior.
  }

  return null;
}

function resolveProjectRefFromAccessToken(accessToken: string) {
  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return null;
  }

  const ref = payload.ref;
  if (typeof ref === "string" && ref.trim()) {
    return ref.trim().toLowerCase();
  }

  const issuer = payload.iss;
  if (typeof issuer === "string") {
    const match = issuer.match(SUPABASE_ISSUER_REGEX);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

function isExpectedProjectAccessToken(accessToken: string, expectedProjectRef: string | null) {
  if (!expectedProjectRef) {
    return true;
  }

  return resolveProjectRefFromAccessToken(accessToken) === expectedProjectRef;
}

function firstCookieValue(request: NextRequest, names: string[]) {
  for (const name of names) {
    const value = request.cookies.get(name)?.value;
    if (value) {
      return value;
    }
  }
  return undefined;
}

function isStructuredSessionCookieName(name: string) {
  const normalizedName = name.toLowerCase();
  if (normalizedName.includes("auth-token")) {
    return true;
  }
  return STRUCTURED_SESSION_COOKIE_NAME_PREFIXES.some((prefix) =>
    normalizedName.startsWith(prefix)
  );
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const cookies = request.cookies.getAll();
  const expectedProjectRef = resolveCurrentSupabaseProjectRef();
  let mismatchedProjectTokenDetected = false;

  const directAccessToken = firstCookieValue(request, DIRECT_ACCESS_TOKEN_COOKIE_NAMES);
  const directRefreshToken = firstCookieValue(request, DIRECT_REFRESH_TOKEN_COOKIE_NAMES);
  if (directAccessToken) {
    const decodedAccessToken = decodeCookieValue(directAccessToken);
    if (isExpectedProjectAccessToken(decodedAccessToken, expectedProjectRef)) {
      return NextResponse.json(
        {
          accessToken: decodedAccessToken,
          refreshToken: directRefreshToken ? decodeCookieValue(directRefreshToken) : null
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    mismatchedProjectTokenDetected = true;
  }

  const structuredCandidates = cookies.filter((cookie) => isStructuredSessionCookieName(cookie.name));
  const orderedStructuredCandidates = expectedProjectRef
    ? [
        ...structuredCandidates.filter((cookie) =>
          cookie.name.toLowerCase().includes(expectedProjectRef)
        ),
        ...structuredCandidates.filter(
          (cookie) => !cookie.name.toLowerCase().includes(expectedProjectRef)
        )
      ]
    : structuredCandidates;

  for (const cookie of orderedStructuredCandidates) {
    const parsed = parseStructuredTokenCookie(cookie.value);
    if (!parsed.accessToken) {
      continue;
    }

    if (!isExpectedProjectAccessToken(parsed.accessToken, expectedProjectRef)) {
      mismatchedProjectTokenDetected = true;
      continue;
    }

    return NextResponse.json(
      {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken ?? null
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  if (mismatchedProjectTokenDetected) {
    return NextResponse.json(
      {
        code: "SUPABASE_TOKEN_PROJECT_MISMATCH",
        error:
          "Found Supabase auth cookies for a different project. Clear stale Supabase auth cookies and sign in again.",
        expectedProjectRef,
        requestId
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      code: "NO_ACTIVE_SESSION",
      error: "No Supabase session cookie available.",
      requestId
    },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}
