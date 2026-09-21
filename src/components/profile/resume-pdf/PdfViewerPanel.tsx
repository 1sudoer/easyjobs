"use client";
import { memo } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import type { ResumeDocumentData, ResumeHtmlNodes } from "./types";
import { ProfessionalResumeDocument } from "./ProfessionalTemplate";

interface Props {
  resume: ResumeDocumentData;
  htmlNodes: ResumeHtmlNodes;
}

export const PdfViewerPanel = memo(function PdfViewerPanel({ resume, htmlNodes }: Props) {
  return (
    <PDFViewer
      showToolbar={false}
      style={{ width: "100%", height: "100%", border: "none", borderRadius: "0.5rem" }}
    >
      <ProfessionalResumeDocument resume={resume} htmlNodes={htmlNodes} />
    </PDFViewer>
  );
});
