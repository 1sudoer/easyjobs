import { Card } from "../ui/card";
import { TipTapContentViewer } from "../TipTapContentViewer";
import { SectionHeaderRow } from "./SectionHeaderRow";

interface SummarySectionCardProps {
  summary: string;
  onEdit: () => void;
}

/** The summary: the shared section header with an Edit action, then the text. */
function SummarySectionCard({ summary, onEdit }: SummarySectionCardProps) {
  return (
    <>
      <SectionHeaderRow title="Summary" onAction={onEdit} actionLabel="Edit" />
      <Card className="px-4 py-3 text-sm">
        <TipTapContentViewer content={summary} />
      </Card>
    </>
  );
}

export default SummarySectionCard;
