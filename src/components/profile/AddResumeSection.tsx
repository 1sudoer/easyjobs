"use client";
import { PlusCircle } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type SectionKey =
  | "contactInfo"
  | "summary"
  | "skills"
  | "experience"
  | "project"
  | "education"
  | "certification";

interface AddResumeSectionProps {
  addedSections: Set<SectionKey>;
  onOpen: (section: SectionKey) => void;
}

function AddResumeSection({ addedSections, onOpen }: AddResumeSectionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1 cursor-pointer">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Section
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onOpen("contactInfo")}
            disabled={addedSections.has("contactInfo")}
          >
            Add Contact Info
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onOpen("summary")}
            disabled={addedSections.has("summary")}
          >
            Add Summary
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onOpen("skills")}
            disabled={addedSections.has("skills")}
          >
            Add Skills
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onOpen("experience")}
            disabled={addedSections.has("experience")}
          >
            Add Experience
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onOpen("project")}
            disabled={addedSections.has("project")}
          >
            Add Project
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onOpen("education")}
            disabled={addedSections.has("education")}
          >
            Add Education
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => onOpen("certification")}
            disabled={addedSections.has("certification")}
          >
            Add Certification / License
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default AddResumeSection;
