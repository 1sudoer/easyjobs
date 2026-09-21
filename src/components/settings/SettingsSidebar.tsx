"use client";

import { Palette } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export type SettingsSection = "appearance";

const SETTINGS_SECTIONS: {
  id: SettingsSection;
  label: string;
  icon: typeof Palette;
}[] = [
  { id: "appearance", label: "Appearance", icon: Palette },
];

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

export default function SettingsSidebar({
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) {
  return (
    <nav className="flex flex-col gap-1 w-48 shrink-0">
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <Button
            key={section.id}
            variant="ghost"
            className={cn(
              "justify-start gap-2 rounded-none border-l-2",
              isActive
                ? "border-l-primary bg-muted font-medium"
                : "border-l-transparent hover:border-l-muted-foreground/25",
            )}
            onClick={() => onSectionChange(section.id)}
          >
            <Icon className="h-4 w-4" />
            {section.label}
          </Button>
        );
      })}
    </nav>
  );
}
