"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader, PanelRightClose, PanelRightOpen } from "lucide-react";
import { Resume } from "@/models/profile.model";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ResumePreviewPanel } from "./resume-preview";
import { DownloadResumeButton } from "./resume-pdf/DownloadResumeButton";
import { ResumeEditorPanel } from "./ResumeEditorPanel";
import { createResume, saveFullResume } from "@/actions/profile.actions";
import { toast } from "../ui/use-toast";

const BLANK_RESUME: Resume = { title: "" };

export function NewResumeView() {
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(true);
  const [title, setTitle] = useState("");
  const [localResume, setLocalResume] = useState<Resume>(BLANK_RESUME);
  const [isCreating, startCreateTransition] = useTransition();

  const updateLocal = (updates: Partial<Resume>) =>
    setLocalResume((prev) => ({ ...prev, ...updates }));

  const handleCreate = () => {
    if (!title.trim()) {
      toast({ variant: "destructive", title: "Resume title is required." });
      return;
    }
    startCreateTransition(async () => {
      // 1. Create the record to get an id
      const created = await createResume(title.trim());
      if (!created?.success || !created.data?.id) {
        toast({
          variant: "destructive",
          title: "Failed to create resume.",
          description: created?.message,
        });
        return;
      }

      // 2. Persist any sections the user already filled in
      const fullResume: Resume = { ...localResume, id: created.data.id, title: title.trim() };
      await saveFullResume(fullResume);

      // 3. Navigate to the new resume editor
      router.push(`/dashboard/profile/resume/${created.data.id}`);
    });
  };

  const previewResume = useMemo<Resume>(() => ({ ...localResume, title }), [localResume, title]);

  return (
    <div className="col-span-3 flex flex-col gap-3 h-[calc(100dvh-5.5rem)]">

      {/* Top bar */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/dashboard/profile">
          <Button variant="ghost" size="sm" className="gap-1.5 px-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </Link>

        <Input
          placeholder="Resume title — e.g. Full Stack Engineer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-8 text-sm flex-1 min-w-0 max-w-xs"
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <Button
          size="sm"
          className="gap-1.5 shrink-0"
          onClick={handleCreate}
          disabled={isCreating || !title.trim()}
        >
          {isCreating && <Loader className="h-4 w-4 animate-spin" />}
          <span>{isCreating ? "Creating…" : "Create Resume"}</span>
        </Button>

        <DownloadResumeButton resume={previewResume} title={title} />

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

      {/* Split view: live preview + editor */}
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="flex-1 min-w-0 min-h-0">
          <ResumePreviewPanel resume={previewResume} />
        </div>

        {showEdit && (
          <ResumeEditorPanel
            resumeId={undefined}
            localResume={localResume}
            updateLocal={updateLocal}
          />
        )}
      </div>

    </div>
  );
}
