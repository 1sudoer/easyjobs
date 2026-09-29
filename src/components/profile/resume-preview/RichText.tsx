"use client";
import { Fragment, memo, useMemo, type JSX, type ReactNode } from "react";

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/**
 * Tags that are reproduced as-is. Anything else is unwrapped: its children are
 * kept, the tag and all of its attributes are dropped.
 */
const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "ul",
  "ol",
  "li",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "code",
  "pre",
  "blockquote",
  "hr",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
]);

const HEADINGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/** Only web and mail links survive; `javascript:` and friends are dropped. */
function safeHref(href: string | null): string | undefined {
  if (!href) return undefined;
  return /^(https?:|mailto:)/i.test(href.trim()) ? href.trim() : undefined;
}

function renderNode(node: ChildNode, key: string): ReactNode {
  if (node.nodeType === TEXT_NODE) return node.textContent;
  if (node.nodeType !== ELEMENT_NODE) return null;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  const children = Array.from(el.childNodes).map((child, i) => renderNode(child, `${key}-${i}`));

  if (!ALLOWED_TAGS.has(tag)) return <Fragment key={key}>{children}</Fragment>;

  switch (tag) {
    case "br":
      return <br key={key} />;
    case "hr":
      return <hr key={key} />;
    case "a":
      return (
        <a key={key} href={safeHref(el.getAttribute("href"))} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    case "ol":
      return (
        <ol key={key} start={Number(el.getAttribute("start")) || undefined}>
          {children}
        </ol>
      );
    default: {
      // Rich-text headings are printed as bold body lines, as in the PDF.
      const Tag = (HEADINGS.has(tag) ? "h6" : tag) as keyof JSX.IntrinsicElements;
      return <Tag key={key}>{children}</Tag>;
    }
  }
}

/**
 * Renders stored rich-text HTML as React elements. The HTML is parsed, never
 * injected: only a fixed set of formatting tags is rebuilt and every attribute
 * except a vetted link target is discarded. That matters because this also runs
 * on the public share page, where the viewer is not the author.
 */
export const RichText = memo(function RichText({
  html,
  className,
}: {
  html: string | undefined | null;
  className?: string;
}) {
  const nodes = useMemo(() => {
    if (!html?.trim() || typeof DOMParser === "undefined") return null;
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.body.childNodes).map((child, i) => renderNode(child, String(i)));
  }, [html]);

  if (!nodes) return null;
  return <div className={className}>{nodes}</div>;
});
