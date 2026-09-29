"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Resume } from "@/models/profile.model";
import type { ResumeDocumentData } from "../resume-pdf/types";
import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX, ResumePreview } from "./ResumePreview";

/** Space around the page inside the panel, in CSS pixels. */
const GUTTER = 16;

/** Only the fields the resume prints; title, ids and timestamps are left out. */
function toDocumentData(resume: Resume): ResumeDocumentData {
  const { summary, contactInfo, skills, experiences, educations, projects, certifications, sectionOrder } =
    resume;
  return { summary, contactInfo, skills, experiences, educations, projects, certifications, sectionOrder };
}

/**
 * Live preview of a resume: an HTML page at US Letter size, scaled down to fit
 * the panel's width so lines wrap exactly as they will in the PDF. Dashed rules
 * mark where each 11-inch page ends. They are approximate: the PDF keeps a
 * heading with its first line, so a break can come a line or two earlier.
 *
 * Nothing here builds a PDF; that happens only when the user downloads.
 */
export function ResumePreviewPanel({ resume }: { resume: Resume }) {
  // Typing stays immediate; the preview may lag a frame behind on large resumes.
  const deferred = useDeferredValue(resume);
  const data = useMemo(() => toDocumentData(deferred), [deferred]);

  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageHeight, setPageHeight] = useState(PAGE_HEIGHT_PX);

  useEffect(() => {
    const container = containerRef.current;
    const page = pageRef.current;
    if (!container || !page) return;
    const observer = new ResizeObserver(() => {
      setContainerWidth(container.clientWidth);
      setPageHeight(page.offsetHeight);
    });
    observer.observe(container);
    observer.observe(page);
    return () => observer.disconnect();
  }, []);

  const scale = containerWidth
    ? Math.min(1, (containerWidth - GUTTER * 2) / PAGE_WIDTH_PX)
    : 1;
  const pageCount = Math.max(1, Math.ceil(pageHeight / PAGE_HEIGHT_PX));

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto overflow-x-hidden rounded-lg border bg-muted/60"
      style={{ padding: GUTTER }}
    >
      {/* Reserves the scaled size, since a CSS transform does not affect layout. */}
      <div
        className="mx-auto"
        style={{ width: PAGE_WIDTH_PX * scale, height: pageCount * PAGE_HEIGHT_PX * scale }}
      >
        <div
          className="relative origin-top-left shadow-md"
          style={{
            width: PAGE_WIDTH_PX,
            minHeight: pageCount * PAGE_HEIGHT_PX,
            transform: `scale(${scale})`,
            background: "#fff",
            visibility: containerWidth ? "visible" : "hidden",
          }}
        >
          <div ref={pageRef}>
            <ResumePreview resume={data} />
          </div>
          {Array.from({ length: pageCount - 1 }, (_, i) => (
            <div
              key={i}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-muted-foreground/40"
              style={{ top: (i + 1) * PAGE_HEIGHT_PX }}
            >
              <span className="absolute right-2 top-1 text-[11px] text-muted-foreground">
                Page {i + 2}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
