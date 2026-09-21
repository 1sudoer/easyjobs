import React, { memo } from "react";
import { Document, Font, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import {
  SectionHeading,
  defaultResumeTheme,
  type ResumeTheme,
} from "./primitives";
import type { ResumeDocumentData, ResumeHtmlNodes } from "./types";
import type {
  ContactInfo,
  Education,
  LicenseOrCertification,
  SkillCategory,
  WorkExperience,
} from "@/models/profile.model";

Font.registerHyphenationCallback((word) => [word]);

function formatDate(date: Date | string | undefined | null): string {
  if (!date) return "Present";
  return format(new Date(date), "MMM yyyy");
}

function dateRange(start?: string | null, end?: string | null, ongoing?: boolean): string {
  const from = start?.trim();
  const to = ongoing || !end?.trim() ? "Present" : end.trim();
  if (!from) return to;
  return `${from} – ${to}`;
}

function joinParts(parts: (string | null | undefined)[], separator: string): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(separator);
}

/** Joins the parts of a meta line, dropping empty ones so no stray separators remain. */
function metaLine(parts: (string | null | undefined)[]): string {
  return joinParts(parts, " · ");
}

/** "Job Title — Company", omitting the dash when either side is missing. */
function titleLine(parts: (string | null | undefined)[]): string {
  return joinParts(parts, " — ");
}

/**
 * Title and meta lines of an entry, kept together on one page. That is safe here
 * because the group is at most a handful of short lines — unlike the entry as a
 * whole, which may well be taller than a page and is deliberately left outside
 * this group so it can split.
 */
function EntryHeader({
  title,
  meta,
  theme,
}: {
  title: string;
  meta: string[];
  theme: ResumeTheme;
}) {
  return (
    <View wrap={false} minPresenceAhead={theme.breaks.entryHeader}>
      <Text style={theme.styles.entryTitle}>{title}</Text>
      {meta.map((line, i) => (
        <Text key={i} style={theme.styles.entryMeta}>
          {line}
        </Text>
      ))}
    </View>
  );
}

const HeaderSection = memo(function HeaderSection({
  contactInfo,
  theme,
}: {
  contactInfo: ContactInfo;
  theme: ResumeTheme;
}) {
  const { styles } = theme;
  const contactLines = [
    contactInfo.email,
    contactInfo.phone,
    contactInfo.address,
    contactInfo.linkedin,
    contactInfo.github,
  ].filter(Boolean);

  return (
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <Text style={styles.heading}>
          {contactInfo.firstName} {contactInfo.lastName}
        </Text>
        {contactInfo.headline ? (
          <Text style={styles.subheading}>{contactInfo.headline}</Text>
        ) : null}
      </View>
      <View style={styles.headerContact}>
        {contactLines.map((line, i) => (
          <Text key={i} style={styles.contactLine}>
            {line}
          </Text>
        ))}
      </View>
    </View>
  );
});

const SummarySection = memo(function SummarySection({
  nodes,
  theme,
}: {
  nodes: React.ReactElement[];
  theme: ResumeTheme;
}) {
  if (nodes.length === 0) return null;
  return (
    <View>
      <SectionHeading title="Summary" theme={theme} />
      {nodes}
    </View>
  );
});

const SkillsSection = memo(function SkillsSection({
  skills,
  theme,
}: {
  skills: SkillCategory[] | undefined;
  theme: ResumeTheme;
}) {
  const { styles } = theme;
  if (!skills?.length) return null;

  return (
    <View>
      <SectionHeading title="Skills" theme={theme} />
      {skills.map((category, i) => (
        <View key={i} style={styles.skillRow}>
          <Text style={styles.bodyText} orphans={2} widows={2}>
            <Text style={styles.bold}>{category.label}: </Text>
            {category.details.join(", ")}
          </Text>
        </View>
      ))}
    </View>
  );
});

const ExperienceSection = memo(function ExperienceSection({
  experiences,
  nodes,
  theme,
}: {
  experiences: WorkExperience[] | undefined;
  nodes: React.ReactElement[][];
  theme: ResumeTheme;
}) {
  const { styles } = theme;
  if (!experiences?.length) return null;

  return (
    <View>
      <SectionHeading title="Experience" theme={theme} />
      {experiences.map((experience, i) => (
        <View key={i} style={styles.entry}>
          <EntryHeader
            theme={theme}
            title={titleLine([experience.jobTitle, experience.company])}
            meta={[
              metaLine([
                dateRange(
                  experience.startDate,
                  experience.endDate,
                  experience.currentJob,
                ),
                experience.location,
              ]),
            ].filter(Boolean)}
          />
          {nodes[i]}
        </View>
      ))}
    </View>
  );
});

const EducationSection = memo(function EducationSection({
  educations,
  nodes,
  theme,
}: {
  educations: Education[] | undefined;
  nodes: React.ReactElement[][];
  theme: ResumeTheme;
}) {
  const { styles } = theme;
  if (!educations?.length) return null;

  return (
    <View>
      <SectionHeading title="Education" theme={theme} />
      {educations.map((education, i) => (
        <View key={i} style={styles.entry}>
          <EntryHeader
            theme={theme}
            title={education.institution}
            meta={[
              metaLine([education.degree, education.fieldOfStudy]),
              metaLine([
                dateRange(education.startDate, education.endDate),
                education.cgpa ? `GPA: ${education.cgpa}` : null,
                education.location,
              ]),
            ].filter(Boolean)}
          />
          {nodes[i]}
        </View>
      ))}
    </View>
  );
});

const CertificationsSection = memo(function CertificationsSection({
  certifications,
  theme,
}: {
  certifications: LicenseOrCertification[] | undefined;
  theme: ResumeTheme;
}) {
  const { styles } = theme;
  if (!certifications?.length) return null;

  return (
    <View>
      <SectionHeading title="Certifications" theme={theme} />
      {certifications.map((certification, i) => (
        <View key={i} style={styles.certification}>
          <EntryHeader
            theme={theme}
            title={certification.title}
            meta={[
              certification.organization,
              metaLine([
                certification.issueDate
                  ? `Issued: ${formatDate(certification.issueDate)}`
                  : null,
                certification.expirationDate
                  ? `Expires: ${formatDate(certification.expirationDate)}`
                  : null,
              ]),
              certification.credentialUrl,
            ].filter((line): line is string => Boolean(line))}
          />
        </View>
      ))}
    </View>
  );
});

type Props = {
  resume: ResumeDocumentData;
  htmlNodes: ResumeHtmlNodes;
  theme?: ResumeTheme;
};

/**
 * Multi-page resume document.
 *
 * Content flows: no section or entry is marked `wrap={false}`, so anything
 * taller than the space left on a page — or taller than a whole page — is split
 * by the paginator instead of being clipped. Page breaks are only *nudged*, via
 * the `minPresenceAhead` budgets in the theme.
 */
export function ProfessionalResumeDocument({
  resume,
  htmlNodes,
  theme = defaultResumeTheme,
}: Props) {
  const { contactInfo, skills, experiences, educations, certifications } = resume;

  return (
    <Document
      author={`${contactInfo?.firstName ?? ""} ${contactInfo?.lastName ?? ""}`.trim()}
      creator="easyjobs.tokadream.com"
      producer="react-pdf"
    >
      <Page size="A4" style={theme.styles.page} wrap>
        {contactInfo && (
          <HeaderSection contactInfo={contactInfo} theme={theme} />
        )}
        <SummarySection nodes={htmlNodes.summary} theme={theme} />
        <SkillsSection skills={skills} theme={theme} />
        <ExperienceSection
          experiences={experiences}
          nodes={htmlNodes.experiences}
          theme={theme}
        />
        <EducationSection
          educations={educations}
          nodes={htmlNodes.educations}
          theme={theme}
        />
        <CertificationsSection certifications={certifications} theme={theme} />
      </Page>
    </Document>
  );
}
