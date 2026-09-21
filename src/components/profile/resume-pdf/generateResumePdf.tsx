import { buildResumeHtmlNodes } from "./html-to-pdf";
import { defaultResumeTheme, type ResumeTheme } from "./primitives";
import { ProfessionalResumeDocument } from "./ProfessionalTemplate";
import type { ResumeDocumentData, ResumeHtmlNodes } from "./types";

export type { ResumeDocumentData, ResumeHtmlNodes } from "./types";

export function sanitizeFilename(name: string): string {
  const sanitized = name
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  return sanitized || "resume";
}

export async function generateResumePdfBlob(
  data: ResumeDocumentData,
  title: string,
  theme: ResumeTheme = defaultResumeTheme,
): Promise<{ blob: Blob; filename: string }> {
  const htmlNodes: ResumeHtmlNodes = buildResumeHtmlNodes(data, theme);

  const { pdf } = await import("@react-pdf/renderer");
  const blob = await pdf(
    <ProfessionalResumeDocument resume={data} htmlNodes={htmlNodes} theme={theme} />,
  ).toBlob();
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const filename = `${sanitizeFilename(title)}_${mm}_${dd}.pdf`;
  return { blob, filename };
}

export async function downloadResumePdf(data: ResumeDocumentData, title: string): Promise<void> {
  const { blob, filename } = await generateResumePdfBlob(data, title);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
