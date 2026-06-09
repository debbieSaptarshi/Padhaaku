"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/ask", label: "Ask", icon: "?" },
  { href: "/explain", label: "Explain", icon: "✦" },
  { href: "/practice", label: "Practice", icon: "⚡" },
];

export function NavRail() {
  const pathname = usePathname();

  return (
    <nav className="nav-rail" aria-label="Main">
      <div className="nav-brand" title="Padhaaku">
        <span className="nav-mark">P</span>
      </div>
      <ul className="nav-list">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                <span className="nav-icon" aria-hidden>
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
