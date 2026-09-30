"use client";
import { Resume } from "@/models/profile.model";
import { ResumePreviewPanel } from "./resume-preview";
import { DownloadResumeButton } from "./resume-pdf/DownloadResumeButton";

interface PublicResumeViewProps {
  resume: Resume;
}

export function PublicResumeView({ resume }: PublicResumeViewProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <span className="font-semibold text-sm truncate">{resume.title}</span>
        <DownloadResumeButton resume={resume} />
      </header>

      <div className="flex-1 p-4">
        <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
          <ResumePreviewPanel resume={resume} />
        </div>
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
