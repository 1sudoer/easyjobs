/**
 * Every visual value of the resume document lives here so the whole template is
 * driven by one settings object. Only the defaults are used today; exposing them
 * per resume later means passing a partial override to `createResumeTheme`.
 *
 * Kept free of react-pdf so the HTML live preview can lay itself out from the
 * same numbers without loading the PDF renderer.
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
