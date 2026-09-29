"use client";
import { useState } from "react";
import { Download, Loader } from "lucide-react";
import type { Resume } from "@/models/profile.model";
import { Button } from "../../ui/button";
import { toast } from "../../ui/use-toast";

/**
 * Builds the resume PDF on click and downloads it. The PDF renderer is loaded
 * only here, so editing never pays for it.
 */
export function DownloadResumeButton({
  resume,
  title,
  className,
}: {
  resume: Resume;
  /** File name stem; defaults to the resume's title. */
  title?: string;
  className?: string;
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const { downloadResumePdf } = await import("./generateResumePdf");
      await downloadResumePdf(resume, title?.trim() || resume.title || "resume");
    } catch {
      toast({ variant: "destructive", title: "Failed to generate PDF." });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className ?? "gap-1.5 shrink-0"}
      onClick={handleDownload}
      disabled={isDownloading}
    >
      {isDownloading ? <Loader className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      <span className="hidden sm:inline">{isDownloading ? "Preparing…" : "Download PDF"}</span>
    </Button>
  );
}
