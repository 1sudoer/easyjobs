import type React from "react";
import { StyleSheet, Text } from "@react-pdf/renderer";

/**
 * Every visual value of the resume document lives here so the whole template is
 * driven by one settings object. Only the defaults are used today; exposing them
 * per resume later means passing a partial override to `createResumeTheme`.
 *
 * The defaults follow the conventional US resume: US Letter, half-inch margins,
 * a single column in 10pt Helvetica, a centered name over one contact line, and
 * uppercase section titles over a thin rule.
 */
export type ResumeDocumentSettings = {
  /** Size of body copy: paragraphs, bullets, skills, entry lines. */
  documentFontSize: number;
  documentLineHeight: number;
  documentMarginVertical: number;
  documentMarginHorizontal: number;
  textColor: string;
  /** Secondary text: contact line, locations, links. */
  metaColor: string;
  ruleColor: string;
  headerNameSize: number;
  headerNameBottomSpacing: number;
  headerHeadlineSize: number;
  headerBottomSpacing: number;
  sectionTitleSize: number;
  sectionTitleLetterSpacing: number;
  sectionSpacing: number;
  sectionTitleBottomSpacing: number;
  /** Space below a paragraph inside rich-text content. */
  paragraphSpacing: number;
  /** Size of a heading coming from rich-text content. */
  richHeadingSize: number;
  listIndent: number;
  listMarkerWidth: number;
  listRowSpacing: number;
  entrySpacing: number;
  entryHeaderBottomSpacing: number;
  skillSpacing: number;
};

export const DEFAULT_DOCUMENT_SETTINGS: ResumeDocumentSettings = {
  documentFontSize: 10,
  documentLineHeight: 1.3,
  documentMarginVertical: 36,
  documentMarginHorizontal: 36,
  textColor: "#111827",
  metaColor: "#374151",
  ruleColor: "#111827",
  headerNameSize: 22,
  headerNameBottomSpacing: 4,
  headerHeadlineSize: 11,
  headerBottomSpacing: 4,
  sectionTitleSize: 10.5,
  sectionTitleLetterSpacing: 0.6,
  sectionSpacing: 8,
  sectionTitleBottomSpacing: 4,
  paragraphSpacing: 2,
  richHeadingSize: 10,
  listIndent: 8,
  listMarkerWidth: 10,
  listRowSpacing: 1.5,
  entrySpacing: 6,
  entryHeaderBottomSpacing: 2,
  skillSpacing: 1.5,
};

/**
 * `minPresenceAhead` budgets, in points. They tell the paginator how much
 * sibling content must follow an element on the same page; when there is less
 * room than this the element moves to the next page instead of being orphaned at
 * the bottom of the current one.
 *
 * Nothing here ever prevents a *block* from splitting — an entry taller than the
 * space left on the page must still be able to continue onto the next one.
 */
export type ResumeBreakBudget = {
  /** Keeps a section title from landing alone under the last line of a page. */
  sectionHeading: number;
  /** Keeps an entry's title/meta lines attached to its first line of content. */
  entryHeader: number;
  /**
   * Room the next bullet must have after each bullet. Zero by default: any
   * positive budget pushes a complete one-line bullet onto the next page and
   * leaves a gap at the bottom of every page. A multi-line bullet is already
   * kept from splitting into a single stranded line by `orphans`/`widows`.
   */
  listRow: number;
};

export const DEFAULT_BREAK_BUDGET: ResumeBreakBudget = {
  sectionHeading: 48,
  entryHeader: 28,
  listRow: 0,
};

export function createResumeStyles(
  settings: ResumeDocumentSettings = DEFAULT_DOCUMENT_SETTINGS,
) {
  const {
    documentFontSize,
    documentLineHeight,
    documentMarginVertical,
    documentMarginHorizontal,
    textColor,
    metaColor,
    ruleColor,
    headerNameSize,
    headerNameBottomSpacing,
    headerHeadlineSize,
    headerBottomSpacing,
    sectionTitleSize,
    sectionTitleLetterSpacing,
    sectionSpacing,
    sectionTitleBottomSpacing,
    paragraphSpacing,
    richHeadingSize,
    listIndent,
    listMarkerWidth,
    listRowSpacing,
    entrySpacing,
    entryHeaderBottomSpacing,
    skillSpacing,
  } = settings;

  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: documentFontSize,
      paddingTop: documentMarginVertical,
      paddingBottom: documentMarginVertical,
      paddingHorizontal: documentMarginHorizontal,
      color: textColor,
      lineHeight: documentLineHeight,
    },
    // Header: centered name, optional headline, one wrapped contact line.
    header: {
      alignItems: "center",
      marginBottom: headerBottomSpacing,
    },
    name: {
      fontSize: headerNameSize,
      fontFamily: "Helvetica-Bold",
      lineHeight: 1.15,
      textAlign: "center",
      marginBottom: headerNameBottomSpacing,
    },
    headline: {
      fontSize: headerHeadlineSize,
      textAlign: "center",
      marginBottom: 2,
    },
    contactLine: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      fontSize: documentFontSize,
      color: metaColor,
    },
    contactItem: { color: metaColor, textDecoration: "none" },
    separator: { color: metaColor, marginHorizontal: 5 },
    // Sections
    sectionTitle: {
      marginTop: sectionSpacing,
      fontSize: sectionTitleSize,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: sectionTitleLetterSpacing,
      paddingBottom: 1,
      borderBottomWidth: 0.75,
      borderBottomColor: ruleColor,
      marginBottom: sectionTitleBottomSpacing,
    },
    bold: { fontFamily: "Helvetica-Bold" },
    italic: { fontFamily: "Helvetica-Oblique" },
    bodyText: {
      fontSize: documentFontSize,
      marginBottom: paragraphSpacing,
    },
    // Entries: a two-column header (title left, date right) over the details.
    entryHeader: { marginBottom: entryHeaderBottomSpacing },
    /** Every entry but the first, so the last one adds no gap before the next section. */
    entryHeaderFollowing: {
      marginTop: entrySpacing,
      marginBottom: entryHeaderBottomSpacing,
    },
    entryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    entryLeft: { flex: 1, paddingRight: 12 },
    entryRight: { flexShrink: 0, textAlign: "right" },
    entryTitle: { fontFamily: "Helvetica-Bold" },
    entrySubtitle: {},
    entryMeta: { color: metaColor },
    link: { color: metaColor, textDecoration: "none" },
    skillRow: { marginBottom: skillSpacing },
    // Rich text
    list: { paddingLeft: listIndent },
    listRow: {
      flexDirection: "row",
      marginBottom: listRowSpacing,
    },
    bullet: { width: listMarkerWidth },
    /** Column that holds a list item's blocks, so nested lists work. */
    listBody: { flex: 1 },
    listText: { fontSize: documentFontSize },
    h2text: {
      fontFamily: "Helvetica-Bold",
      fontSize: richHeadingSize,
      marginBottom: 1,
      marginTop: 2,
    },
    blockquote: {
      borderLeftWidth: 1.5,
      borderLeftColor: "#cccccc",
      paddingLeft: 8,
      marginBottom: paragraphSpacing,
    },
    codeBlock: {
      backgroundColor: "#f4f4f5",
      padding: 6,
      marginBottom: paragraphSpacing,
    },
    codeText: {
      fontFamily: "Courier",
      fontSize: documentFontSize - 1,
    },
    hr: {
      borderBottomWidth: 0.5,
      borderBottomColor: "#cccccc",
      marginVertical: 4,
    },
    tableRow: { flexDirection: "row" },
    tableCell: { flex: 1, paddingRight: 4 },
  });
}

export type ResumeStyles = ReturnType<typeof createResumeStyles>;

export type ResumeTheme = {
  settings: ResumeDocumentSettings;
  styles: ResumeStyles;
  breaks: ResumeBreakBudget;
};

export function createResumeTheme(
  settings?: Partial<ResumeDocumentSettings>,
  breaks?: Partial<ResumeBreakBudget>,
): ResumeTheme {
  const resolved = { ...DEFAULT_DOCUMENT_SETTINGS, ...settings };
  return {
    settings: resolved,
    styles: createResumeStyles(resolved),
    breaks: { ...DEFAULT_BREAK_BUDGET, ...breaks },
  };
}

export const defaultResumeTheme: ResumeTheme = createResumeTheme();

/**
 * A section: its ruled title followed by content that is free to split across
 * pages. Rendered as a fragment, not a wrapping `View`, because react-pdf only
 * honours `minPresenceAhead` for an element that has earlier siblings in its
 * container — as the first child of its own `View` the title could never move
 * to the next page.
 */
export function Section({
  title,
  theme = defaultResumeTheme,
  children,
}: {
  title: string;
  theme?: ResumeTheme;
  children?: React.ReactNode;
}) {
  return (
    <>
      <Text
        style={theme.styles.sectionTitle}
        minPresenceAhead={theme.breaks.sectionHeading}
      >
        {title}
      </Text>
      {children}
    </>
  );
}
