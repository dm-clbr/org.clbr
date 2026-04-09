import React from "react";

export const PLATFORM_PRIMARY_NAV_ITEMS = [
  {
    id: "org",
    label: "Organization",
    href: "/dashboard",
    icon: "org"
  }
];

export function PlatformShell({ shellClassName, sideNav, mainClassName, children }) {
  return React.createElement(
    "div",
    { className: shellClassName },
    React.createElement("aside", null, sideNav),
    React.createElement("main", { className: mainClassName }, children)
  );
}
