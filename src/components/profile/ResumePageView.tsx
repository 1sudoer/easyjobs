"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Copy,
  ExternalLink,
  Globe,
  Unlink,
  Loader,
  MoreHorizontal,
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Save,
} from "lucide-react";
import { Resume } from "@/models/profile.model";
import { Button } from "../ui/button";
import { ResumePreviewPanel } from "./resume-preview";
import { ResumeEditorPanel } from "./ResumeEditorPanel";
import { DownloadResumeButton } from "./resume-pdf/DownloadResumeButton";
import { editResume, getResumeApplications, getResumeShareStatus, shareResume, unshareResume, saveFullResume } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface ResumePageViewProps {
  resume: Resume;
}

export function ResumePageView({ resume }: ResumePageViewProps) {
  const [showEdit, setShowEdit] = useState(true);
  const [localResume, setLocalResume] = useState<Resume>(resume);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();
  const savedRef = useRef<Resume>(resume);

  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isSharing, startShareTransition] = useTransition();

  const [titleDraft, setTitleDraft] = useState(resume.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleTitleEdit = () => {
    setTitleDraft(localResume.title);
    setIsEditingTitle(true);
    setTimeout(() => titleInputRef.current?.select(), 0);
  };

  const handleTitleSave = async () => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === localResume.title) {
      setTitleDraft(localResume.title);
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    const res = await editResume(resume.id!, trimmed);
    if (!res?.success) {
      toast({ variant: "destructive", title: "Failed to rename resume." });
      setTitleDraft(localResume.title);
    } else {
      setLocalResume((prev) => ({ ...prev, title: trimmed }));
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") { e.currentTarget.blur(); }
    if (e.key === "Escape") { setTitleDraft(localResume.title); setIsEditingTitle(false); }
  };

  type AppInsight = { id: string; currentStatus: string; jobPost: { title: string; postedBy: string; sourceUrl: string | null } };
  const [appInsights, setAppInsights] = useState<AppInsight[]>([]);

  useEffect(() => {
    if (!resume.id) return;
    getResumeShareStatus(resume.id).then((res) => {
      if (res?.success && res.data.shared) setShareToken(res.data.token);
    });
    getResumeApplications(resume.id).then((res) => {
      if (res?.success) setAppInsights(res.data);
    });
  }, [resume.id]);

  const publicUrl = shareToken ? `${window.location.origin}/cv/${shareToken}` : null;

  const handleShare = () => {
    startShareTransition(async () => {
      const res = await shareResume(resume.id!);
      if (!res?.success) {
        toast({ variant: "destructive", title: "Failed to share resume." });
        return;
      }
      const token = res.data.token as string;
      setShareToken(token);
      const url = `${window.location.origin}/cv/${token}`;
      await navigator.clipboard.writeText(url).catch(() => { });
      toast({ variant: "success", description: "Public link copied to clipboard." });
    });
  };

  const handleUnshare = () => {
    startShareTransition(async () => {
      const res = await unshareResume(resume.id!);
      if (!res?.success) {
        toast({ variant: "destructive", title: "Failed to withdraw sharing." });
        return;
      }
      setShareToken(null);
      toast({ description: "Resume is no longer publicly shared." });
    });
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl).catch(() => { });
    toast({ description: "Link copied to clipboard." });
  };

  const backHref = resume.jobProfileId ? "/dashboard/job-profiles" : "/dashboard/profile";

  const updateLocal = (updates: Partial<Resume>) => {
    setLocalResume((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleSave = () => {
    startSaveTransition(async () => {
      const res = await saveFullResume(localResume);
      if (!res.success) {
        toast({ variant: "destructive", title: "Failed to save.", description: res.message });
      } else {
        savedRef.current = localResume;
        setIsDirty(false);
        toast({ variant: "success", description: "Resume saved." });
      }
    });
  };

  const handleDiscard = () => {
    setLocalResume(savedRef.current);
    setIsDirty(false);
  };

  return (
    <div className="col-span-3 flex flex-col gap-3 h-[calc(100dvh-5.5rem)]">

      {/* Top bar */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="gap-1.5 px-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>

        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="font-semibold text-sm flex-1 min-w-0 bg-transparent border-b border-border outline-none px-0.5"
            autoFocus
          />
        ) : (
          <button
            onClick={handleTitleEdit}
            className="font-semibold text-sm truncate flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
            title="Click to rename"
          >
            {localResume.title}
          </button>
        )}

        {isDirty && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 shrink-0 text-muted-foreground"
              onClick={handleDiscard}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Discard</span>
            </Button>
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? <Loader className="h-4 w-4 animate-spin" />
                : <Save className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {isSaving ? "Saving…" : "Save"}
              </span>
            </Button>
          </>
        )}

        <DownloadResumeButton resume={localResume} />

        {shareToken ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="gap-1.5 shrink-0">
                {isSharing
                  ? <Loader className="h-4 w-4 animate-spin" />
                  : <Globe className="h-4 w-4" />}
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleUnshare}
                className="text-destructive focus:text-destructive"
              >
                <Unlink className="h-4 w-4 mr-2" />
                Unshare
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleShare}
            disabled={isSharing}
          >
            {isSharing
              ? <Loader className="h-4 w-4 animate-spin" />
              : <Globe className="h-4 w-4" />}
            <span className="hidden sm:inline">Share</span>
          </Button>
        )}

        <Button
          variant={showEdit ? "secondary" : "outline"}
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={() => setShowEdit((v) => !v)}
        >
          {showEdit
            ? <PanelRightClose className="h-4 w-4" />
            : <PanelRightOpen className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {showEdit ? "Hide Edit" : "Edit"}
          </span>
        </Button>
      </div>

      {/* Application insights */}
      {appInsights.length > 0 && (
        <div className="flex items-center gap-2 shrink-0 overflow-x-auto pb-0.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Briefcase className="h-3.5 w-3.5" />
            Used in {appInsights.length} {appInsights.length === 1 ? "application" : "applications"}:
          </span>
          {appInsights.map((app) => (
            <div key={app.id} className="flex items-center gap-1 shrink-0 rounded-full border bg-muted/40 px-2.5 py-0.5 text-xs">
              <Link href={`/dashboard/applications/${app.id}`} className="hover:underline font-medium">
                {app.jobPost.title}
              </Link>
              <span className="text-muted-foreground">· {app.jobPost.postedBy}</span>
              <span className="text-muted-foreground capitalize">· {app.currentStatus.replace(/_/g, " ")}</span>
              {app.jobPost.sourceUrl && (
                <a href={app.jobPost.sourceUrl} target="_blank" rel="noopener noreferrer" className="ml-0.5 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Split view: live preview + editor */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <ResumePreviewPanel resume={localResume} />
        </div>

        {showEdit && (
          <ResumeEditorPanel
            resumeId={resume.id}
            localResume={localResume}
            updateLocal={updateLocal}
          />
        )}
      </div>

    </div>
  );
}
