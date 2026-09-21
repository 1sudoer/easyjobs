import React from "react";
import { Text, View, type ViewProps } from "@react-pdf/renderer";
import { defaultResumeTheme, type ResumeTheme } from "./primitives";
import type { ResumeDocumentData, ResumeHtmlNodes } from "./types";

// Use numeric constants — the `Node` global is not available in all rendering contexts
const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

/**
 * Tags that must become a `View`/block `Text` of their own. Anything else is
 * treated as inline and folded into the surrounding paragraph, which keeps
 * block content (lists, quotes) from ending up nested inside a `Text` — an
 * arrangement react-pdf cannot lay out or paginate.
 */
const BLOCK_TAGS = new Set([
  "address",
  "article",
  "blockquote",
  "div",
  "dd",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

type InheritedStyle = {
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  underline?: boolean;
  mono?: boolean;
  link?: boolean;
};

/**
 * react-pdf's style type. Taken from `ViewProps` rather than from `Text`, whose
 * props are a union with the SVG variant and so widen `style` to something the
 * non-SVG `Text` will not accept back.
 */
type PdfStyle = ViewProps["style"];

type InlineTextStyle = {
  fontFamily?: string;
  textDecoration?: "underline" | "line-through";
  color?: string;
};

const inlineStyleCache = new Map<string, InlineTextStyle | undefined>();

function inlineStyle(inherited: InheritedStyle): InlineTextStyle | undefined {
  const cacheKey = `${inherited.bold ? "b" : ""}${inherited.italic ? "i" : ""}${
    inherited.strike ? "s" : ""
  }${inherited.underline ? "u" : ""}${inherited.mono ? "m" : ""}${
    inherited.link ? "l" : ""
  }`;
  if (inlineStyleCache.has(cacheKey)) return inlineStyleCache.get(cacheKey);

  const style: InlineTextStyle = {};

  if (inherited.mono) {
    style.fontFamily = inherited.bold ? "Courier-Bold" : "Courier";
  } else if (inherited.bold && inherited.italic) {
    style.fontFamily = "Helvetica-BoldOblique";
  } else if (inherited.bold) {
    style.fontFamily = "Helvetica-Bold";
  } else if (inherited.italic) {
    style.fontFamily = "Helvetica-Oblique";
  }

  // react-pdf takes a single decoration, so strike-through wins over underline.
  if (inherited.strike) style.textDecoration = "line-through";
  else if (inherited.underline) style.textDecoration = "underline";

  if (inherited.link) style.color = "#2563eb";

  const resolved = Object.keys(style).length > 0 ? style : undefined;
  inlineStyleCache.set(cacheKey, resolved);
  return resolved;
}

function withInlineTag(tag: string, inherited: InheritedStyle): InheritedStyle {
  switch (tag) {
    case "b":
    case "strong":
      return { ...inherited, bold: true };
    case "em":
    case "i":
    case "cite":
    case "var":
      return { ...inherited, italic: true };
    case "s":
    case "strike":
    case "del":
      return { ...inherited, strike: true };
    case "u":
    case "ins":
      return { ...inherited, underline: true };
    case "code":
    case "kbd":
    case "samp":
      return { ...inherited, mono: true };
    case "a":
      return { ...inherited, link: true };
    default:
      return inherited;
  }
}

function renderInline(
  node: ChildNode,
  inherited: InheritedStyle,
  key: string,
): React.ReactNode {
  if (node.nodeType === TEXT_NODE) {
    const text = node.textContent ?? "";
    if (!text) return null;
    const style = inlineStyle(inherited);
    return style ? (
      <Text key={key} style={style}>
        {text}
      </Text>
    ) : (
      text
    );
  }

  if (node.nodeType !== ELEMENT_NODE) return null;
  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") return "\n";

  const next = withInlineTag(tag, inherited);
  const children = renderInlineChildren(el, next, key);
  if (children.length === 0) return null;

  const style = inlineStyle(next);
  return style ? (
    <Text key={key} style={style}>
      {children}
    </Text>
  ) : (
    <Text key={key}>{children}</Text>
  );
}

function renderInlineChildren(
  el: Element,
  inherited: InheritedStyle,
  key: string,
): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  Array.from(el.childNodes).forEach((child, i) => {
    const rendered = renderInline(child, inherited, `${key}-${i}`);
    if (rendered !== null && rendered !== undefined) out.push(rendered);
  });
  return out;
}

/**
 * Renders a node's children as a list of block elements. Consecutive inline
 * children are collected into a single paragraph so plain-text content is never
 * dropped.
 */
function renderBlocks(
  parent: Element,
  theme: ResumeTheme,
  inherited: InheritedStyle,
  keyPrefix: string,
  paragraphStyle: PdfStyle,
): React.ReactElement[] {
  const out: React.ReactElement[] = [];
  let run: React.ReactNode[] = [];
  let runIndex = 0;

  const flushRun = () => {
    if (run.length === 0) return;
    const current = run;
    run = [];
    const hasVisibleText = current.some(
      (node) => typeof node !== "string" || node.trim().length > 0,
    );
    if (hasVisibleText) {
      out.push(
        <Text
          key={`${keyPrefix}-run${runIndex}`}
          style={paragraphStyle}
          orphans={2}
          widows={2}
        >
          {current}
        </Text>,
      );
    }
    runIndex += 1;
  };

  Array.from(parent.childNodes).forEach((node, i) => {
    const key = `${keyPrefix}-${i}`;
    if (
      node.nodeType === ELEMENT_NODE &&
      BLOCK_TAGS.has((node as Element).tagName.toLowerCase())
    ) {
      flushRun();
      const block = renderBlock(
        node as Element,
        theme,
        inherited,
        key,
        paragraphStyle,
      );
      if (block) out.push(block);
      return;
    }
    const rendered = renderInline(node, inherited, key);
    if (rendered !== null && rendered !== undefined) run.push(rendered);
  });

  flushRun();
  return out;
}

function renderList(
  el: Element,
  theme: ResumeTheme,
  inherited: InheritedStyle,
  key: string,
): React.ReactElement | null {
  const { styles, breaks } = theme;
  const ordered = el.tagName.toLowerCase() === "ol";
  const start = ordered ? Number(el.getAttribute("start")) || 1 : 1;

  const items = Array.from(el.children).filter(
    (child) => child.tagName.toLowerCase() === "li",
  );
  if (items.length === 0) return null;

  const rows: React.ReactElement[] = [];
  items.forEach((li, i) => {
    const itemKey = `${key}-li${i}`;
    const body = renderBlocks(li, theme, inherited, itemKey, styles.listText);
    if (body.length === 0) return;
    rows.push(
      // No `wrap={false}` here: a bullet longer than the space left on the page
      // has to be allowed to continue onto the next one.
      <View
        key={itemKey}
        style={styles.listRow}
        minPresenceAhead={breaks.listRow}
      >
        <Text style={styles.bullet}>{ordered ? `${start + i}.` : "\u2022"}</Text>
        <View style={styles.listBody}>{body}</View>
      </View>,
    );
  });
  if (rows.length === 0) return null;

  return (
    <View key={key} style={styles.list}>
      {rows}
    </View>
  );
}

function renderBlock(
  el: Element,
  theme: ResumeTheme,
  inherited: InheritedStyle,
  key: string,
  paragraphStyle: PdfStyle,
): React.ReactElement | null {
  const { styles, breaks } = theme;
  const tag = el.tagName.toLowerCase();

  switch (tag) {
    case "hr":
      return <View key={key} style={styles.hr} />;

    case "p":
    case "dd":
    case "dt": {
      const children = renderInlineChildren(el, inherited, key);
      if (children.length === 0) return null;
      return (
        <Text key={key} style={paragraphStyle} orphans={2} widows={2}>
          {children}
        </Text>
      );
    }

    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const children = renderInlineChildren(
        el,
        { ...inherited, bold: true },
        key,
      );
      if (children.length === 0) return null;
      return (
        <Text
          key={key}
          style={styles.h2text}
          minPresenceAhead={breaks.sectionHeading}
        >
          {children}
        </Text>
      );
    }

    case "ul":
    case "ol":
      return renderList(el, theme, inherited, key);

    case "blockquote":
      return (
        <View key={key} style={styles.blockquote}>
          {renderBlocks(el, theme, inherited, key, paragraphStyle)}
        </View>
      );

    case "pre": {
      const text = el.textContent ?? "";
      if (!text.trim()) return null;
      return (
        <View key={key} style={styles.codeBlock}>
          <Text style={styles.codeText}>{text}</Text>
        </View>
      );
    }

    case "tr":
      return (
        <View key={key} style={styles.tableRow}>
          {renderBlocks(el, theme, inherited, key, paragraphStyle)}
        </View>
      );

    case "td":
    case "th":
      return (
        <View key={key} style={styles.tableCell}>
          {renderBlocks(el, theme, inherited, key, paragraphStyle)}
        </View>
      );

    default: {
      const children = renderBlocks(el, theme, inherited, key, paragraphStyle);
      if (children.length === 0) return null;
      return <View key={key}>{children}</View>;
    }
  }
}

/**
 * Converts stored rich-text HTML into react-pdf nodes.
 *
 * Every node returned is free to split across a page boundary; pagination is
 * steered with `minPresenceAhead`/`orphans`/`widows` rather than by forbidding
 * wrapping, so content taller than one page still renders.
 */
export function htmlToPdfNodes(
  html: string,
  theme: ResumeTheme = defaultResumeTheme,
): React.ReactElement[] {
  if (!html || !html.trim()) return [];
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return renderBlocks(doc.body, theme, {}, "node", theme.styles.bodyText);
  } catch {
    return [];
  }
}

/**
 * Converts every rich-text field of a resume in one go, so the preview, the
 * download and the preview dialog all build their nodes the same way and with
 * the same theme as the document that renders them.
 */
export function buildResumeHtmlNodes(
  data: ResumeDocumentData,
  theme: ResumeTheme = defaultResumeTheme,
): ResumeHtmlNodes {
  return {
    summary: data.summary ? htmlToPdfNodes(data.summary, theme) : [],
    experiences:
      data.experiences?.map((experience) =>
        experience.description ? htmlToPdfNodes(experience.description, theme) : [],
      ) ?? [],
    educations:
      data.educations?.map((education) =>
        education.description ? htmlToPdfNodes(education.description, theme) : [],
      ) ?? [],
    projects:
      data.projects?.map((project) =>
        project.description ? htmlToPdfNodes(project.description, theme) : [],
      ) ?? [],
  };
}
