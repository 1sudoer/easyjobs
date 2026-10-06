"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Loader } from "lucide-react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { Resume } from "@/models/profile.model";
import type { ResumeDocumentData } from "../resume-pdf/types";

/** Pause after the last edit before rebuilding the PDF. */
const REBUILD_DELAY_MS = 400;
/** Space around the pages inside the panel, in CSS pixels. */
const GUTTER = 16;
/** US Letter in PDF points. */
const PAGE_WIDTH_PT = 612;

/** Only the fields the resume prints; title, ids and timestamps are left out. */
function toDocumentData(resume: Resume): ResumeDocumentData {
  const { summary, contactInfo, skills, experiences, educations, projects, certifications, sectionOrder } =
    resume;
  return { summary, contactInfo, skills, experiences, educations, projects, certifications, sectionOrder };
}

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;

/** pdf.js, loaded on first use with its worker, so parsing stays off the main thread. */
function loadPdfjs() {
  pdfjsPromise ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    return pdfjs;
  });
  return pdfjsPromise;
}

/** Draws every page of `pdf` onto new canvases `cssWidth` pixels wide. */
async function renderPages(pdf: PDFDocumentProxy, cssWidth: number): Promise<HTMLCanvasElement[]> {
  const pixelRatio = window.devicePixelRatio || 1;
  const canvases: HTMLCanvasElement[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const viewport = page.getViewport({ scale: (cssWidth / PAGE_WIDTH_PT) * pixelRatio });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;
    canvas.className = "block bg-white shadow-md";
    canvas.setAttribute("aria-label", `Resume page ${n} of ${pdf.numPages}`);
    canvas.setAttribute("role", "img");
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
    canvases.push(canvas);
  }
  return canvases;
}

/**
 * Live preview of a resume that shows the PDF itself: the same document the
 * download produces, rebuilt a moment after each edit and drawn page by page.
 * Page breaks, margins and wrapping are therefore exactly what will be
 * downloaded; an HTML imitation could never match react-pdf's line breaking.
 *
 * The previous pages stay on screen until the new ones are ready, so editing
 * does not flicker; a small spinner shows while a rebuild is under way.
 */
export function ResumePreviewPanel({ resume }: { resume: Resume }) {
  const deferred = useDeferredValue(resume);
  const data = useMemo(() => toDocumentData(deferred), [deferred]);

  const containerRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [isBuilding, setIsBuilding] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => setContainerWidth(container.clientWidth));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Rebuild the PDF a moment after the content stops changing.
  useEffect(() => {
    let cancelled = false;
    setIsBuilding(true);
    const timer = setTimeout(async () => {
      try {
        const { generateResumePdfBlob } = await import("../resume-pdf/generateResumePdf");
        const { blob: next } = await generateResumePdfBlob(data, "preview");
        if (!cancelled) {
          setBlob(next);
          setError(false);
        }
      } catch (e) {
        console.error("Failed to build the resume preview", e);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setIsBuilding(false);
      }
    }, REBUILD_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data]);

  // Draw the latest PDF at the panel's width, swapping pages in only when done.
  const cssWidth = Math.max(0, Math.floor(containerWidth - GUTTER * 2));
  useEffect(() => {
    if (!blob || !cssWidth) return;
    let cancelled = false;
    let pdf: PDFDocumentProxy | null = null;
    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const canvases = await renderPages(pdf, cssWidth);
        if (!cancelled) pagesRef.current?.replaceChildren(...canvases);
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to draw the resume preview", e);
          setError(true);
        }
      } finally {
        void pdf?.destroy();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [blob, cssWidth]);

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto overflow-x-hidden rounded-lg border bg-muted/60"
      style={{ padding: GUTTER }}
    >
      <div ref={pagesRef} className="flex flex-col items-center gap-4" />
      {!blob && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {blob && isBuilding && (
        <Loader
          aria-label="Updating preview"
          className="sticky bottom-2 ml-auto mt-2 h-4 w-4 animate-spin text-muted-foreground"
        />
      )}
      {error && (
        <p className="sticky bottom-2 mt-2 text-center text-xs text-destructive">
          The preview could not be updated. Your changes are kept; try again after the next edit.
        </p>
      )}
    </div>
  );
}
