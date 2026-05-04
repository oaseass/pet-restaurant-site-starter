"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useRouteProgress } from "@/components/RouteProgress";

type SmartLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps | "href"> & {
    pendingLabel?: string;
  };

function hrefToString(href: SmartLinkProps["href"]) {
  if (typeof href === "string") return href;
  const pathname = href.pathname ?? "";
  const searchParams = new URLSearchParams();
  if (href.query) {
    for (const [key, value] of Object.entries(href.query)) {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined) searchParams.append(key, String(item));
        });
      } else if (value !== undefined) {
        searchParams.set(key, String(value));
      }
    }
  }
  const query = searchParams.toString();
  const hash = href.hash ? (href.hash.startsWith("#") ? href.hash : `#${href.hash}`) : "";
  return `${pathname}${query ? `?${query}` : ""}${hash}`;
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function SmartLink({ href, onClick, target, pendingLabel = "이동 중...", ...props }: SmartLinkProps) {
  const { start } = useRouteProgress();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || !isPlainLeftClick(event) || (target && target !== "_self")) return;

    const hrefString = hrefToString(href);
    if (!hrefString || hrefString.startsWith("#") || hrefString.startsWith("mailto:") || hrefString.startsWith("tel:")) return;

    try {
      const currentUrl = new URL(window.location.href);
      const targetUrl = new URL(hrefString, currentUrl.origin);
      if (targetUrl.origin !== currentUrl.origin) return;
      if (`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}` === `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`) return;
      start(pendingLabel);
    } catch {
      start(pendingLabel);
    }
  };

  return <Link href={href} target={target} onClick={handleClick} {...props} />;
}