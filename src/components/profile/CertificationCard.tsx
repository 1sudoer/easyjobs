"use client";
import { LicenseOrCertification } from "@/models/profile.model";
import { SortableList } from "./SortableList";
import { EntryCard } from "./EntryCard";
import { certificationDates, displayUrl } from "./resume-pdf/format";
import { SectionHeaderRow } from "./SectionHeaderRow";

interface CertificationCardProps {
  certifications: LicenseOrCertification[];
  onEdit: (index: number) => void;
  onAdd: () => void;
  onDelete?: (index: number) => void;
  /** Receives the certifications in their new order; dragging is off without it. */
  onReorder?: (certifications: LicenseOrCertification[]) => void;
  /** Stops dragging, e.g. while a certification is open in the edit form. */
  reorderDisabled?: boolean;
}

function CertificationCard({
  certifications,
  onEdit,
  onAdd,
  onDelete,
  onReorder,
  reorderDisabled = false,
}: CertificationCardProps) {
  return (
    <>
      <SectionHeaderRow title="Certifications" onAction={onAdd} />
      <SortableList
        items={certifications}
        disabled={reorderDisabled || !onReorder}
        onReorder={(next) => onReorder?.(next)}
        className="space-y-3"
        renderItem={(cert, index, handle) => (
          <EntryCard
            handle={handle}
            name={cert.title}
            title={cert.title}
            subtitle={cert.organization}
            details={[
              certificationDates(cert.issueDate, cert.expirationDate),
              cert.credentialUrl ? displayUrl(cert.credentialUrl) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            onEdit={() => onEdit(index)}
            onDelete={onDelete ? () => onDelete(index) : undefined}
          />
        )}
      />
    </>
  );
}

export default CertificationCard;
