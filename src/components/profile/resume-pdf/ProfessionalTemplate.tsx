import React, { Fragment, memo } from "react";
import { Document, Font, Link, Page, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { Section, defaultResumeTheme, type ResumeTheme } from "./primitives";
import type { ResumeDocumentData, ResumeHtmlNodes } from "./types";
import type {
  ContactInfo,
  Education,
  LicenseOrCertification,
  Project,
  SkillCategory,
  WorkExperience,
} from "@/models/profile.model";

Font.registerHyphenationCallback((word) => [word]);

function formatDate(date: Date | string | undefined | null): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? String(date) : format(parsed, "MMM yyyy");
}

function dateRange(start?: string | null, end?: string | null, ongoing?: boolean): string {
  const from = start?.trim();
  const to = ongoing || !end?.trim() ? "Present" : end.trim();
  if (!from) return ongoing || end?.trim() ? to : "";
  return `${from} – ${to}`;
}

function clean(parts: (string | null | undefined)[]): string[] {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
}

/** Joins the non-empty parts, so no stray separators remain. */
function joinParts(parts: (string | null | undefined)[], separator: string): string {
  return clean(parts).join(separator);
}

function toHref(value: string): string {
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
}

/** Shows a URL the way it is printed on a resume: no scheme, no `www.`, no trailing slash. */
function displayUrl(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

type ContactItem = { label: string; href?: string };

/**
 * An entry's heading rows: each row has a left part and an optional right part
 * (dates, location), pinned to the right margin. Kept together on one page — it
 * is only a couple of short lines — and nudged onto the next page when there is
 * no room left for the entry's first line of content.
 *
 * Entries are fragments — header and content are siblings of the previous
 * entry — since `minPresenceAhead` is ignored for the first child of a `View`.
 */
function EntryHeader({
  rows,
  first,
  theme,
}: {
  rows: { left: React.ReactNode; right?: string | null }[];
  /** First entry of its section, which needs no space above it. */
  first: boolean;
  theme: ResumeTheme;
}) {
  const { styles } = theme;
  return (
    <View
      style={first ? styles.entryHeader : styles.entryHeaderFollowing}
      wrap={false}
      minPresenceAhead={theme.breaks.entryHeader}
    >
      {rows.map((row, i) => (
        <View key={i} style={styles.entryRow}>
          <View style={styles.entryLeft}>{row.left}</View>
          {row.right ? <Text style={styles.entryRight}>{row.right}</Text> : null}
        </View>
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
  const name = joinParts([contactInfo.firstName, contactInfo.lastName], " ");
  const email = contactInfo.email?.trim();
  const items: ContactItem[] = [
    contactInfo.address?.trim() ? { label: contactInfo.address.trim() } : null,
    contactInfo.phone?.trim()
      ? {
          label: contactInfo.phone.trim(),
          href: `tel:${contactInfo.phone.replace(/[^\d+]/g, "")}`,
        }
      : null,
    email ? { label: email, href: `mailto:${email}` } : null,
    contactInfo.linkedin?.trim()
      ? { label: displayUrl(contactInfo.linkedin), href: toHref(contactInfo.linkedin.trim()) }
      : null,
    contactInfo.github?.trim()
      ? { label: displayUrl(contactInfo.github), href: toHref(contactInfo.github.trim()) }
      : null,
  ].filter((item): item is ContactItem => item !== null);

  return (
    <View style={styles.header}>
      {name ? <Text style={styles.name}>{name}</Text> : null}
      {contactInfo.headline?.trim() ? (
        <Text style={styles.headline}>{contactInfo.headline.trim()}</Text>
      ) : null}
      {items.length > 0 ? (
        <View style={styles.contactLine}>
          {items.map((item, i) => (
            <Fragment key={i}>
              {i > 0 ? <Text style={styles.separator}>•</Text> : null}
              {item.href ? (
                <Link src={item.href} style={styles.contactItem}>
                  {item.label}
                </Link>
              ) : (
                <Text style={styles.contactItem}>{item.label}</Text>
              )}
            </Fragment>
          ))}
        </View>
      ) : null}
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
    <Section title="Summary" theme={theme}>
      {nodes}
    </Section>
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
  const categories = skills?.filter((category) => clean(category.details).length > 0);
  if (!categories?.length) return null;

  return (
    <Section title="Skills" theme={theme}>
      {categories.map((category, i) => (
        <Text key={i} style={styles.skillRow} orphans={2} widows={2}>
          {category.label?.trim() ? (
            <Text style={styles.bold}>{category.label.trim()}: </Text>
          ) : null}
          {clean(category.details).join(", ")}
        </Text>
      ))}
    </Section>
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
    <Section title="Experience" theme={theme}>
      {experiences.map((experience, i) => {
        const company = experience.company?.trim();
        const location = experience.location?.trim();
        const jobTitle = experience.jobTitle?.trim();
        const dates = dateRange(
          experience.startDate,
          experience.endDate,
          experience.currentJob,
        );
        // Company and location first, then title and dates — the conventional
        // US order. Without a company the title moves up and stays bold.
        const rows = company
          ? [
              {
                left: <Text style={styles.entryTitle}>{company}</Text>,
                right: location,
              },
              { left: <Text style={styles.italic}>{jobTitle}</Text>, right: dates },
            ]
          : [
              {
                left: <Text style={styles.entryTitle}>{jobTitle}</Text>,
                right: location,
              },
              ...(dates ? [{ left: null, right: dates }] : []),
            ];
        return (
          <Fragment key={i}>
            <EntryHeader theme={theme} first={i === 0} rows={rows} />
            {nodes[i]}
          </Fragment>
        );
      })}
    </Section>
  );
});

const ProjectsSection = memo(function ProjectsSection({
  projects,
  nodes,
  theme,
}: {
  projects: Project[] | undefined;
  nodes: React.ReactElement[][];
  theme: ResumeTheme;
}) {
  const { styles } = theme;
  if (!projects?.length) return null;

  return (
    <Section title="Projects" theme={theme}>
      {projects.map((project, i) => {
        const links = clean([project.url, project.githubUrl]);
        const technologies = clean(project.technologies ?? []);
        return (
          <Fragment key={i}>
            <EntryHeader
              theme={theme}
              first={i === 0}
              rows={[
                {
                  left: (
                    <Text>
                      <Text style={styles.entryTitle}>{project.name}</Text>
                      {links.map((link, j) => (
                        <Fragment key={j}>
                          <Text style={styles.entryMeta}>{j === 0 ? "  |  " : "  •  "}</Text>
                          <Link src={toHref(link)} style={styles.link}>
                            {displayUrl(link)}
                          </Link>
                        </Fragment>
                      ))}
                    </Text>
                  ),
                  right: dateRange(project.startDate, project.endDate, project.current),
                },
                ...(technologies.length
                  ? [
                      {
                        left: (
                          <Text style={styles.italic}>{technologies.join(", ")}</Text>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
            {nodes[i]}
          </Fragment>
        );
      })}
    </Section>
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
    <Section title="Education" theme={theme}>
      {educations.map((education, i) => {
        const degree = joinParts([education.degree, education.fieldOfStudy], " in ");
        const cgpa = education.cgpa?.trim();
        const dates = dateRange(education.startDate, education.endDate);
        // Same order as experience: school and location, then degree and dates.
        return (
          <Fragment key={i}>
            <EntryHeader
              theme={theme}
              first={i === 0}
              rows={[
                {
                  left: <Text style={styles.entryTitle}>{education.institution}</Text>,
                  right: education.location?.trim(),
                },
                ...(degree || cgpa || dates
                  ? [
                      {
                        left: (
                          <Text>
                            {degree ? <Text style={styles.italic}>{degree}</Text> : null}
                            {cgpa ? (
                              <Text style={styles.entryMeta}>
                                {degree ? " • " : ""}GPA: {cgpa}
                              </Text>
                            ) : null}
                          </Text>
                        ),
                        right: dates,
                      },
                    ]
                  : []),
              ]}
            />
            {nodes[i]}
          </Fragment>
        );
      })}
    </Section>
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
    <Section title="Certifications" theme={theme}>
      {certifications.map((certification, i) => {
        const issued = formatDate(certification.issueDate);
        const expires = formatDate(certification.expirationDate);
        const url = certification.credentialUrl?.trim();
        return (
          <View key={i} style={styles.skillRow} wrap={false}>
            <View style={styles.entryRow}>
              <Text style={styles.entryLeft}>
                <Text style={styles.entryTitle}>{certification.title}</Text>
                {certification.organization?.trim() ? (
                  <Text> — {certification.organization.trim()}</Text>
                ) : null}
                {url ? (
                  <>
                    <Text style={styles.entryMeta}>  |  </Text>
                    <Link src={toHref(url)} style={styles.link}>
                      {displayUrl(url)}
                    </Link>
                  </>
                ) : null}
              </Text>
              {issued || expires ? (
                <Text style={styles.entryRight}>
                  {issued && expires
                    ? `${issued} – ${expires}`
                    : issued ?? `Expires ${expires}`}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </Section>
  );
});

type Props = {
  resume: ResumeDocumentData;
  htmlNodes: ResumeHtmlNodes;
  theme?: ResumeTheme;
};

/**
 * Single-column US resume on Letter paper, laid out like resume-lm's template:
 * centered name and contact line, then ruled sections with titles on the left
 * and dates flush right.
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
  const { contactInfo, skills, experiences, educations, projects, certifications } =
    resume;
  const author = joinParts([contactInfo?.firstName, contactInfo?.lastName], " ");

  return (
    <Document
      title={author ? `${author} – Resume` : "Resume"}
      author={author}
      creator="easyjobs.tokadream.com"
      producer="react-pdf"
    >
      <Page size="LETTER" style={theme.styles.page} wrap>
        {contactInfo && <HeaderSection contactInfo={contactInfo} theme={theme} />}
        <SummarySection nodes={htmlNodes.summary} theme={theme} />
        <SkillsSection skills={skills} theme={theme} />
        <ExperienceSection
          experiences={experiences}
          nodes={htmlNodes.experiences}
          theme={theme}
        />
        <ProjectsSection projects={projects} nodes={htmlNodes.projects} theme={theme} />
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
