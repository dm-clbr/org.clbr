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

function navButtonClassName(isActive) {
  return `navItem ${isActive ? "active" : ""}`.trim();
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
    brandAriaLabel = "Home",
    resolveBrandHref
  } = props ?? {};
  const renderLinkFn = typeof renderLink === "function" ? renderLink : defaultRenderLink;
  const brandHref = typeof resolveBrandHref === "function" ? resolveBrandHref() : "/";

  const primaryLinks = primaryItems.map((item) => {
    const href = toHref(item, sameAppHrefByItemId);
    const active = isPrimaryItemActive ? isPrimaryItemActive(item.id, pathname) : pathname === href;
    return renderLinkFn({
      key: `primary-${item.id}`,
      href,
      className: navButtonClassName(active),
      title: item.label,
      ariaLabel: item.label,
      children: React.createElement("span", null, item.label)
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
      children: React.createElement("span", null, item.label)
    });
  });

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
        children: React.createElement("span", null, "CLBR")
      })
    ),
    React.createElement("div", { className: "primaryNav" }, primaryLinks),
    React.createElement("div", { className: "utilityNav" }, utilityLinks),
    React.createElement(
      "button",
      {
        type: "button",
        className: "profileButton",
        onClick: profile?.onClick,
        disabled: profile?.disabled
      },
      React.createElement("strong", null, profile?.displayName ?? "CLBR User"),
      React.createElement("small", null, profile?.roleLabel ?? "Employee")
    )
  );
}
