"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Download, Loader } from "lucide-react";
import { Resume } from "@/models/profile.model";
import type { ResumeDocumentData, ResumeHtmlNodes } from "./resume-pdf/types";
import { Button } from "../ui/button";
import { generateResumePdfBlob } from "./resume-pdf/generateResumePdf";
import { toast } from "../ui/use-toast";

const PdfViewerPanel = dynamic(
  () => import("./resume-pdf/PdfViewerPanel").then((m) => ({ default: m.PdfViewerPanel })),
  { ssr: false },
);

interface PublicResumeViewProps {
  resume: Resume;
}

export function PublicResumeView({ resume }: PublicResumeViewProps) {
  const [htmlNodes, setHtmlNodes] = useState<ResumeHtmlNodes | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { blob, filename } = await generateResumePdfBlob(documentData, resume.title);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: "destructive", title: "Failed to generate PDF." });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-sm truncate">{resume.title}</span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleDownload}
          disabled={isDownloading || !htmlNodes}
        >
          {isDownloading
            ? <Loader className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />}
          <span className="hidden sm:inline">Download</span>
        </Button>
      </header>

      <div className="flex-1 p-4">
        {!htmlNodes ? (
          <div className="h-full flex items-center justify-center">
            <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
            <div className="h-full rounded-lg border overflow-hidden shadow-sm">
              <PdfViewerPanel resume={documentData} htmlNodes={htmlNodes} />
            </div>
          </div>
        )}
      </div>

      <footer className="border-t px-4 py-3 flex items-center justify-center gap-1.5 shrink-0">
        <span className="text-xs text-muted-foreground">
          Created with <span className="font-medium text-foreground">EasyJobs</span>
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TokaDream
        </span>
      </footer>
    </div>
  );
}
