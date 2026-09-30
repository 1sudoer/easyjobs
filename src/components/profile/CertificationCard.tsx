"use client";
import type { ReactNode } from "react";
import { LicenseOrCertification } from "@/models/profile.model";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Edit, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { DragHandle, SortableList } from "./SortableList";
import { SectionHeaderRow } from "./SectionHeaderRow";

interface CertificationCardProps {
  certifications: LicenseOrCertification[];
  onEdit: (index: number) => void;
  onAdd: () => void;
  /** Receives the certifications in their new order; dragging is off without it. */
  onReorder?: (certifications: LicenseOrCertification[]) => void;
  /** Stops dragging, e.g. while a certification is open in the edit form. */
  reorderDisabled?: boolean;
  /** Grip for reordering the whole section. */
  dragHandle?: ReactNode;
}

function CertificationCard({
  certifications,
  onEdit,
  onAdd,
  onReorder,
  reorderDisabled = false,
  dragHandle,
}: CertificationCardProps) {
  return (
    <>
      <SectionHeaderRow title="Certifications" onAdd={onAdd} dragHandle={dragHandle} />
      <SortableList
        items={certifications}
        disabled={reorderDisabled || !onReorder}
        onReorder={(next) => onReorder?.(next)}
        className="space-y-3"
        renderItem={(cert, index, handle) => (
          <Card>
            <CardHeader className="p-2 pb-0 flex-row justify-between relative">
              <div className="flex min-w-0 items-center gap-1 pr-16">
                <DragHandle handle={handle} label={cert.title} />
                <CardTitle className="text-xl">{cert.title}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 absolute top-0 right-1"
                onClick={() => onEdit(index)}
              >
                <Edit className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Edit
                </span>
              </Button>
            </CardHeader>
            <CardContent>
              <h3>{cert.organization}</h3>
              <CardDescription>
                {cert.issueDate && (
                  <>Issued: {format(new Date(cert.issueDate), "MMM yyyy")}</>
                )}
                {cert.issueDate && cert.expirationDate && " · "}
                {cert.expirationDate ? (
                  <>
                    Expires: {format(new Date(cert.expirationDate), "MMM yyyy")}
                  </>
                ) : (
                  cert.issueDate && " · No Expiration"
                )}
              </CardDescription>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline mt-1"
                >
                  View Credential
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </CardContent>
          </Card>
        )}
      />
    </>
  );
}

export default CertificationCard;
