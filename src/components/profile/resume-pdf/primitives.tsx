import { StyleSheet, Text, View, ViewProps } from "@react-pdf/renderer";

/**
 * Every visual value of the resume document lives here so the whole template is
 * driven by one settings object. Only the defaults are used today; exposing them
 * per resume later means passing a partial override to `createResumeTheme`.
 */
export type ResumeDocumentSettings = {
  /** Page default size — text without an explicit size inherits this. */
  basePageFontSize: number;
  /** Size of body copy: paragraphs, bullets, skills. */
  documentFontSize: number;
  documentLineHeight: number;
  documentMarginVertical: number;
  documentMarginHorizontal: number;
  textColor: string;
  metaColor: string;
  metaFontSize: number;
  headerNameSize: number;
  headerNameBottomSpacing: number;
  headerHeadlineSize: number;
  headerBottomSpacing: number;
  sectionTitleSize: number;
  sectionTitleLetterSpacing: number;
  sectionTitleMarginTop: number;
  sectionTitleMarginBottom: number;
  dividerMarginBottom: number;
  /** Space below a paragraph inside rich-text content. */
  paragraphSpacing: number;
  /** Size of an `<h2>` coming from rich-text content. */
  richHeadingSize: number;
  listSpacing: number;
  listRowSpacing: number;
  listMarkerWidth: number;
  entrySpacing: number;
  skillSpacing: number;
  certificationSpacing: number;
};

export const DEFAULT_DOCUMENT_SETTINGS: ResumeDocumentSettings = {
  basePageFontSize: 9,
  documentFontSize: 11,
  documentLineHeight: 1.4,
  documentMarginVertical: 30,
  documentMarginHorizontal: 20,
  textColor: "#000000",
  metaColor: "#444444",
  metaFontSize: 10,
  headerNameSize: 20,
  headerNameBottomSpacing: 8,
  headerHeadlineSize: 12,
  headerBottomSpacing: 12,
  sectionTitleSize: 11,
  sectionTitleLetterSpacing: 0.8,
  sectionTitleMarginTop: 12,
  sectionTitleMarginBottom: 3,
  dividerMarginBottom: 6,
  paragraphSpacing: 2,
  richHeadingSize: 13,
  listSpacing: 2,
  listRowSpacing: 1,
  listMarkerWidth: 14,
  entrySpacing: 8,
  skillSpacing: 3,
  certificationSpacing: 6,
};

/**
 * `minPresenceAhead` budgets, in points. They tell the paginator how much
 * sibling content must follow an element on the same page; when there is less
 * room than this the element moves to the next page instead of being orphaned at
 * the bottom of the current one.
 *
 * Nothing here ever prevents a *block* from splitting — that is what broke the
 * previous template, which used `wrap={false}` and so could not render an entry
 * taller than the space left on the page.
 */
export type ResumeBreakBudget = {
  /** Keeps a section title from landing alone under the last line of a page. */
  sectionHeading: number;
  /** Keeps an entry's title/meta lines attached to its first line of content. */
  entryHeader: number;
  /** Keeps a bullet from starting on the very last line of a page. */
  listRow: number;
};

export const DEFAULT_BREAK_BUDGET: ResumeBreakBudget = {
  sectionHeading: 60,
  entryHeader: 44,
  listRow: 18,
};

export function createResumeStyles(
  settings: ResumeDocumentSettings = DEFAULT_DOCUMENT_SETTINGS,
) {
  const {
    basePageFontSize,
    documentFontSize,
    documentLineHeight,
    documentMarginVertical,
    documentMarginHorizontal,
    textColor,
    metaColor,
    metaFontSize,
    headerNameSize,
    headerNameBottomSpacing,
    headerHeadlineSize,
    headerBottomSpacing,
    sectionTitleSize,
    sectionTitleLetterSpacing,
    sectionTitleMarginTop,
    sectionTitleMarginBottom,
    dividerMarginBottom,
    paragraphSpacing,
    richHeadingSize,
    listSpacing,
    listRowSpacing,
    listMarkerWidth,
    entrySpacing,
    skillSpacing,
    certificationSpacing,
  } = settings;

  return StyleSheet.create({
    page: {
      fontFamily: "Helvetica",
      fontSize: basePageFontSize,
      paddingTop: documentMarginVertical,
      paddingBottom: documentMarginVertical,
      paddingHorizontal: documentMarginHorizontal,
      color: textColor,
      lineHeight: documentLineHeight,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: headerBottomSpacing,
    },
    headerIdentity: { flexShrink: 1, paddingRight: 12 },
    headerContact: { alignItems: "flex-end", flexShrink: 0 },
    heading: {
      fontSize: headerNameSize,
      fontFamily: "Helvetica-Bold",
      marginBottom: headerNameBottomSpacing,
    },
    subheading: {
      fontSize: headerHeadlineSize,
      marginBottom: 2,
    },
    contactLine: {
      fontSize: metaFontSize,
      color: metaColor,
      marginBottom: 2,
    },
    sectionTitle: {
      fontSize: sectionTitleSize,
      fontFamily: "Helvetica-Bold",
      textTransform: "uppercase",
      letterSpacing: sectionTitleLetterSpacing,
      marginBottom: sectionTitleMarginBottom,
      marginTop: sectionTitleMarginTop,
    },
    divider: {
      borderBottomWidth: 0.5,
      borderBottomColor: textColor,
      marginBottom: dividerMarginBottom,
    },
    bold: { fontFamily: "Helvetica-Bold" },
    bodyText: {
      fontSize: documentFontSize,
      marginBottom: paragraphSpacing,
    },
    entry: { marginBottom: entrySpacing },
    entryTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: documentFontSize,
      marginBottom: 1,
    },
    entryMeta: {
      fontSize: metaFontSize,
      color: metaColor,
      marginBottom: 2,
    },
    skillRow: { marginBottom: skillSpacing },
    certification: { marginBottom: certificationSpacing },
    list: { marginBottom: listSpacing },
    listRow: {
      flexDirection: "row",
      marginBottom: listRowSpacing,
    },
    bullet: {
      width: listMarkerWidth,
      fontSize: documentFontSize,
    },
    /** Column that holds a list item's blocks, so nested lists work. */
    listBody: { flex: 1 },
    listText: { fontSize: documentFontSize },
    h2text: {
      fontFamily: "Helvetica-Bold",
      fontSize: richHeadingSize,
      marginBottom: sectionTitleMarginBottom,
      marginTop: 4,
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

export function SectionHeading({
  title,
  theme = defaultResumeTheme,
  ...viewProps
}: { title: string; theme?: ResumeTheme } & ViewProps) {
  return (
    <View minPresenceAhead={theme.breaks.sectionHeading} {...viewProps}>
      {/* Title plus rule is two short lines, so keeping them together is safe. */}
      <View wrap={false}>
        <Text style={theme.styles.sectionTitle}>{title}</Text>
        <View style={theme.styles.divider} />
      </View>
    </View>
  );
}
