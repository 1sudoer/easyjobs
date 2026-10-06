"use client";
import dynamic from "next/dynamic";

/**
 * The live preview, rendered in the browser only: it builds the PDF with
 * react-pdf and draws it with pdf.js, neither of which runs on the server.
 */
export const ResumePreviewPanel = dynamic(
  () => import("./ResumePreviewPanel").then((m) => ({ default: m.ResumePreviewPanel })),
  {
    ssr: false,
    loading: () => <div className="h-full rounded-lg border bg-muted/60" />,
  },
);
