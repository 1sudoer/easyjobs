"use client";
import dynamic from "next/dynamic";

/**
 * The live preview, rendered in the browser only: rich text is parsed with
 * `DOMParser`, which the server does not have, so a server render would not
 * match the client's.
 */
export const ResumePreviewPanel = dynamic(
  () => import("./ResumePreviewPanel").then((m) => ({ default: m.ResumePreviewPanel })),
  {
    ssr: false,
    loading: () => <div className="h-full rounded-lg border bg-muted/60" />,
  },
);
