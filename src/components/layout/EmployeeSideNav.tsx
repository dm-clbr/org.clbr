"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useProfile } from "@/hooks/useProfile";
import { PLATFORM_PRIMARY_NAV_ITEMS } from "@ava/ui";
import { PlatformSideNav } from "@ava/ui/shell/platform-side-nav";

type PlatformSideNavLinkRendererProps = {
  key: string;
  href: string;
  className: string;
  title?: string;
  ariaLabel: string;
  children: ReactNode;
};

type PlatformUtilityNavItem = {
  id: string;
  label: string;
  icon: string;
  href?: string;
  matchPrefixes?: string[];
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

type UtilityNavItem = PlatformUtilityNavItem & {
  visible: (flags: { isAdmin: boolean; isManager: boolean }) => boolean;
};

const primaryNavMatchPrefixes: Record<string, string[]> = {
  org: ["/dashboard"]
};

const utilityNavItems: UtilityNavItem[] = [
  {
    id: "manager",
    label: "Manager Panel",
    icon: "manager",
    href: "/manager",
    matchPrefixes: ["/manager"],
    visible: ({ isManager }) => isManager
  },
  {
    id: "admin",
    label: "Admin Panel",
    icon: "admin",
    href: "/admin",
    matchPrefixes: ["/admin"],
    visible: ({ isAdmin }) => isAdmin
  }
];

function routeMatches(pathname: string, prefixes: string[] | undefined): boolean {
  if (!prefixes || prefixes.length === 0) {
    return false;
  }

  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function toRoleLabel(flags: {
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isManager: boolean;
  jobTitle?: string | null;
}) {
  if (flags.isSuperAdmin) {
    return "Platform Admin";
  }
  if (flags.isAdmin) {
    return "Admin";
  }
  if (flags.isManager) {
    return "Manager";
  }
  return flags.jobTitle?.trim() || "Employee";
}

function getNavInitials(value?: string | null) {
  if (!value || typeof value !== "string") {
    return "CL";
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "CL";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function renderLink({ key, href, className, title, ariaLabel, children }: PlatformSideNavLinkRendererProps) {
  if (href.startsWith("/")) {
    return (
      <Link key={key} href={href} className={className} title={title} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a key={key} href={href} className={className} title={title} aria-label={ariaLabel}>
      {children}
    </a>
  );
}

export function EmployeeSideNav() {
  const pathname = usePathname() || "/dashboard";
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { isAdmin, isManager, isSuperAdmin } = usePermissions();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const primaryNavItems = useMemo(() => PLATFORM_PRIMARY_NAV_ITEMS.filter((item) => item.id === "org"), []);

  const visibleUtilityNavItems = useMemo(
    () =>
      utilityNavItems
        .filter((item) =>
          item.visible({
            isAdmin,
            isManager
          })
        )
        .map(({ visible: _visible, ...item }) => item),
    [isAdmin, isManager]
  );

  const displayName = profile?.full_name ?? user?.email ?? "CLBR User";
  const roleLabel = toRoleLabel({
    isSuperAdmin,
    isAdmin,
    isManager,
    jobTitle: profile?.job_title
  });
  const initials = getNavInitials(displayName);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <PlatformSideNav
      primaryItems={primaryNavItems}
      pathname={pathname}
      storageKey="org-primary-nav-collapsed"
      iconPrefix="/images/"
      wordmarkAlt="CLBR"
      brandAriaLabel="Open CLBR Org Chart"
      resolveBrandHref={() => "/dashboard"}
      sameAppHrefByItemId={{
        org: "/dashboard",
        profile: "/profile",
        manager: "/manager",
        admin: "/admin"
      }}
      renderLink={renderLink}
      isPrimaryItemActive={(itemId, currentPathname) =>
        routeMatches(currentPathname, primaryNavMatchPrefixes[itemId])
      }
      utilityItems={visibleUtilityNavItems}
      userType="employee"
      canAccessManagerPanel={isManager}
      canAccessAdminPanel={isAdmin}
      isUtilityItemActive={(item, currentPathname) =>
        routeMatches(currentPathname, item.matchPrefixes)
      }
      profile={{
        displayName,
        roleLabel,
        avatarUrl: profile?.profile_photo_url ?? null,
        initials,
        disabled: isSigningOut,
        onClick: handleSignOut
      }}
    />
  );
}
