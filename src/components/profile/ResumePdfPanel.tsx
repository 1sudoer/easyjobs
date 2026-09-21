"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Loader } from "lucide-react";
import { Resume } from "@/models/profile.model";
import type { ResumeDocumentData, ResumeHtmlNodes } from "./resume-pdf/types";

const PdfViewerPanel = dynamic(
  () => import("./resume-pdf/PdfViewerPanel").then((m) => ({ default: m.PdfViewerPanel })),
  { ssr: false },
);

interface ResumePdfPanelProps {
  resume: Resume;
}

export function ResumePdfPanel({ resume }: ResumePdfPanelProps) {
  const [htmlNodes, setHtmlNodes] = useState<ResumeHtmlNodes | null>(null);

  // Stable reference with only rendering-relevant fields — excludes title, id, createdAt, updatedAt, etc.
  const documentData = useMemo<ResumeDocumentData>(() => ({
    summary: resume.summary,
    contactInfo: resume.contactInfo,
    skills: resume.skills,
    experiences: resume.experiences,
    educations: resume.educations,
    certifications: resume.certifications,
  }), [
    resume.summary,
    resume.contactInfo,
    resume.skills,
    resume.experiences,
    resume.educations,
    resume.certifications,
  ]);

  // Rebuild PDF nodes only when rich-text content actually changes
  const contentKey = [
    resume.summary ?? "",
    ...(resume.experiences?.map((e) => e.description ?? "") ?? []),
    ...(resume.educations?.map((e) => e.description ?? "") ?? []),
  ].join("\0");

  useEffect(() => {
    import("./resume-pdf/html-to-pdf").then(({ buildResumeHtmlNodes }) => {
      setHtmlNodes(buildResumeHtmlNodes(documentData));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume.id, contentKey]);

  if (!htmlNodes) {
    return (
      <div className="h-full rounded-lg border bg-muted flex items-center justify-center">
        <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg border overflow-hidden shadow-sm">
      <PdfViewerPanel resume={documentData} htmlNodes={htmlNodes} />
    </div>
  );
}
