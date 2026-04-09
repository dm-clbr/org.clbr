import React from "react";

export const PLATFORM_PRIMARY_NAV_ITEMS = [
  {
    id: "org",
    label: "Organization",
    href: "/dashboard",
    icon: "org"
  }
];

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

export function PlatformShell({ shellClassName, sideNav, mainClassName, children }) {
  return React.createElement(
    "div",
    { className: joinClassNames("platformShell", shellClassName) },
    React.createElement("aside", { className: "platformShellAside" }, sideNav),
    React.createElement("main", { className: joinClassNames("platformShellMain", mainClassName) }, children)
  );
}
