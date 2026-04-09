import React from "react";

function defaultRenderLink({ key, href, className, title, ariaLabel, children }) {
  return React.createElement(
    "a",
    {
      key,
      href,
      className,
      title,
      "aria-label": ariaLabel
    },
    children
  );
}

function toHref(item, sameAppHrefByItemId) {
  return sameAppHrefByItemId?.[item.id] ?? item.href ?? "#";
}

function toIconSrc(item, iconPrefix) {
  if (!item?.icon) {
    return null;
  }
  const base = typeof iconPrefix === "string" && iconPrefix.length > 0 ? iconPrefix : "/images/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}icon=${item.icon}, state=active.svg`;
}

function navButtonClassName(isActive) {
  return `navItem ${isActive ? "active" : ""}`.trim();
}

function renderNavIcon(item, iconPrefix) {
  const iconSrc = toIconSrc(item, iconPrefix);
  if (!iconSrc) {
    return React.createElement("span", { className: "navIcon navIconPlaceholder", "aria-hidden": "true" });
  }
  return React.createElement(
    "span",
    { className: "navIcon", "aria-hidden": "true" },
    React.createElement("img", { src: iconSrc, alt: "", loading: "lazy" })
  );
}

function renderNavText(label) {
  return React.createElement("span", { className: "navLabel" }, label);
}

export function PlatformSideNav(props) {
  const {
    primaryItems = [],
    utilityItems = [],
    pathname = "/",
    sameAppHrefByItemId,
    renderLink,
    isPrimaryItemActive,
    isUtilityItemActive,
    profile,
    iconPrefix = "/images/",
    wordmarkAlt = "CLBR",
    brandAriaLabel = "Home",
    resolveBrandHref
  } = props ?? {};
  const renderLinkFn = typeof renderLink === "function" ? renderLink : defaultRenderLink;
  const brandHref = typeof resolveBrandHref === "function" ? resolveBrandHref() : "/";
  const profileHref = toHref({ id: "profile", href: profile?.href ?? "/profile" }, sameAppHrefByItemId);
  const isProfileActive =
    pathname === profileHref ||
    (typeof profileHref === "string" && profileHref !== "/" && pathname.startsWith(`${profileHref}/`));

  const primaryLinks = primaryItems.map((item) => {
    const href = toHref(item, sameAppHrefByItemId);
    const active = isPrimaryItemActive ? isPrimaryItemActive(item.id, pathname) : pathname === href;
    return renderLinkFn({
      key: `primary-${item.id}`,
      href,
      className: navButtonClassName(active),
      title: item.label,
      ariaLabel: item.label,
      children: React.createElement(
        React.Fragment,
        null,
        renderNavIcon(item, iconPrefix),
        renderNavText(item.label)
      )
    });
  });

  const utilityLinks = utilityItems.map((item) => {
    const href = toHref(item, sameAppHrefByItemId);
    const active = isUtilityItemActive ? isUtilityItemActive(item, pathname) : pathname === href;
    return renderLinkFn({
      key: `utility-${item.id}`,
      href,
      className: `utilityItem ${active ? "active" : ""}`.trim(),
      title: item.label,
      ariaLabel: item.label,
      children: React.createElement(
        React.Fragment,
        null,
        renderNavIcon(item, iconPrefix),
        renderNavText(item.label)
      )
    });
  });

  const profileAvatar = profile?.avatarUrl
    ? React.createElement("img", { src: profile.avatarUrl, alt: "", className: "profileAvatarImage" })
    : React.createElement("span", { className: "profileInitials" }, profile?.initials ?? "CL");

  return React.createElement(
    "nav",
    { className: "platformSideNav" },
    React.createElement(
      "div",
      { className: "brandRow" },
      renderLinkFn({
        key: "brand-link",
        href: brandHref,
        className: "brandLink",
        ariaLabel: brandAriaLabel,
        children: React.createElement(
          React.Fragment,
          null,
          React.createElement("img", {
            src: "/images/aveyo-logo.svg",
            alt: wordmarkAlt,
            className: "brandWordmark"
          }),
          React.createElement("span", { className: "brandText" }, "CLBR")
        )
      })
    ),
    React.createElement("div", { className: "primaryNav" }, primaryLinks),
    utilityLinks.length > 0 ? React.createElement("div", { className: "utilityNav" }, utilityLinks) : null,
    React.createElement(
      "div",
      { className: "profileSection" },
      renderLinkFn({
        key: "profile-link",
        href: profileHref,
        className: `profileLink ${isProfileActive ? "active" : ""}`.trim(),
        title: "View profile",
        ariaLabel: "View profile",
        children: React.createElement(
          React.Fragment,
          null,
          React.createElement("span", { className: "profileAvatar", "aria-hidden": "true" }, profileAvatar),
          React.createElement(
            "span",
            { className: "profileCopy" },
            React.createElement("strong", null, profile?.displayName ?? "CLBR User"),
            React.createElement("small", null, profile?.roleLabel ?? "Employee")
          )
        )
      }),
      typeof profile?.onClick === "function"
        ? React.createElement(
            "button",
            {
              type: "button",
              className: "profileLogoutButton",
              onClick: profile.onClick,
              disabled: profile?.disabled
            },
            profile?.disabled ? "Logging out..." : "Log out"
          )
        : null
    )
  );
}
