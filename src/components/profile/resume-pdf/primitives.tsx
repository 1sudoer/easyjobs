import type React from "react";
import { StyleSheet, Text } from "@react-pdf/renderer";
import {
  DEFAULT_DOCUMENT_SETTINGS,
  type ResumeDocumentSettings,
} from "./settings";

export { DEFAULT_DOCUMENT_SETTINGS, type ResumeDocumentSettings };

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
  /**
   * Keeps a section title from landing alone under the last line of a page.
   * Must exceed what the first entry needs to stay on the page itself (its
   * two header lines plus `entryHeader`), or the entry moves on and leaves
   * the title behind.
   */
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
  sectionHeading: 64,
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
