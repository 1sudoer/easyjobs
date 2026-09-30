"use client";
import { Fragment, memo, type CSSProperties, type ReactNode } from "react";
import {
  resolveSectionOrder,
  type ContactInfo,
  type Education,
  type LicenseOrCertification,
  type Project,
  type ResumeSection,
  type SkillCategory,
  type WorkExperience,
} from "@/models/profile.model";
import {
  certificationDates,
  clean,
  contactItems,
  dateRange,
  displayUrl,
  joinParts,
  toHref,
} from "../resume-pdf/format";
import { DEFAULT_DOCUMENT_SETTINGS as S } from "../resume-pdf/settings";
import type { ResumeDocumentData } from "../resume-pdf/types";
import { RichText } from "./RichText";

/** US Letter at CSS resolution: 8.5in × 11in. */
export const PAGE_WIDTH_PX = 816;
export const PAGE_HEIGHT_PX = 1056;

const pt = (value: number) => `${value}pt`;

/**
 * Styles for the rich-text descriptions, scoped to the preview. They mirror the
 * react-pdf rules in `primitives.tsx`: indented bullets, tight rows, bold
 * headings at body size.
 */
const RICH_TEXT_CSS = `
.resume-preview .rt p { margin: 0 0 ${pt(S.paragraphSpacing)}; }
.resume-preview .rt ul, .resume-preview .rt ol { margin: 0; padding-left: ${pt(S.listIndent + S.listMarkerWidth)}; }
.resume-preview .rt ul { list-style: disc; }
.resume-preview .rt ol { list-style: decimal; }
.resume-preview .rt li { margin-bottom: ${pt(S.listRowSpacing)}; }
.resume-preview .rt li p { margin: 0; }
.resume-preview .rt h6 { font-size: ${pt(S.richHeadingSize)}; font-weight: 700; margin: ${pt(2)} 0 ${pt(1)}; }
.resume-preview .rt blockquote { border-left: 1.5pt solid #ccc; padding-left: 8pt; margin: 0 0 ${pt(S.paragraphSpacing)}; }
.resume-preview .rt pre { background: #f4f4f5; padding: 6pt; margin: 0 0 ${pt(S.paragraphSpacing)}; white-space: pre-wrap; }
.resume-preview .rt code { font-family: Courier, monospace; font-size: ${pt(S.documentFontSize - 1)}; }
.resume-preview .rt hr { border: 0; border-bottom: 0.5pt solid #ccc; margin: 4pt 0; }
.resume-preview .rt a { color: #2563eb; text-decoration: none; }
.resume-preview a { text-decoration: none; }
`;

const styles = {
  page: {
    width: PAGE_WIDTH_PX,
    minHeight: PAGE_HEIGHT_PX,
    boxSizing: "border-box",
    padding: `${pt(S.documentMarginVertical)} ${pt(S.documentMarginHorizontal)}`,
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: pt(S.documentFontSize),
    lineHeight: S.documentLineHeight,
    color: S.textColor,
    background: "#fff",
  },
  header: { textAlign: "center", marginBottom: pt(S.headerBottomSpacing) },
  name: {
    fontSize: pt(S.headerNameSize),
    fontWeight: 700,
    lineHeight: 1.15,
    margin: `0 0 ${pt(S.headerNameBottomSpacing)}`,
  },
  headline: { fontSize: pt(S.headerHeadlineSize), marginBottom: pt(2) },
  contactLine: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    color: S.metaColor,
  },
  separator: { margin: "0 5pt" },
  sectionTitle: {
    fontSize: pt(S.sectionTitleSize),
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: pt(S.sectionTitleLetterSpacing),
    paddingBottom: pt(1),
    borderBottom: `0.75pt solid ${S.ruleColor}`,
    margin: `${pt(S.sectionSpacing)} 0 ${pt(S.sectionTitleBottomSpacing)}`,
  },
  row: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  left: { flex: 1, minWidth: 0, paddingRight: 12 },
  right: { flexShrink: 0, textAlign: "right" },
  bold: { fontWeight: 700 },
  italic: { fontStyle: "italic" },
  meta: { color: S.metaColor },
  /** Separator with the PDF's exact spacing; HTML would collapse the spaces. */
  gap: { color: S.metaColor, whiteSpace: "pre" },
} satisfies Record<string, CSSProperties>;

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 style={styles.sectionTitle}>{children}</h2>;
}

/** Title/meta rows of one entry: left text with an optional right-aligned value. */
function EntryHeader({
  rows,
  first,
}: {
  rows: { left: ReactNode; right?: string | null }[];
  first: boolean;
}) {
  return (
    <div
      style={{
        marginTop: first ? 0 : pt(S.entrySpacing),
        marginBottom: pt(S.entryHeaderBottomSpacing),
      }}
    >
      {rows.map((row, i) => (
        <div key={i} style={styles.row}>
          <div style={styles.left}>{row.left}</div>
          {row.right ? <div style={styles.right}>{row.right}</div> : null}
        </div>
      ))}
    </div>
  );
}

function ResumeLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={styles.meta}>
      {children}
    </a>
  );
}

function Header({ contactInfo }: { contactInfo: ContactInfo }) {
  const name = joinParts([contactInfo.firstName, contactInfo.lastName], " ");
  const items = contactItems(contactInfo);
  return (
    <header style={styles.header}>
      {name ? <h1 style={styles.name}>{name}</h1> : null}
      {contactInfo.headline?.trim() ? (
        <div style={styles.headline}>{contactInfo.headline.trim()}</div>
      ) : null}
      {items.length > 0 ? (
        <div style={styles.contactLine}>
          {items.map((item, i) => (
            <Fragment key={i}>
              {i > 0 ? <span style={styles.separator}>•</span> : null}
              {item.href ? (
                <ResumeLink href={item.href}>{item.label}</ResumeLink>
              ) : (
                <span>{item.label}</span>
              )}
            </Fragment>
          ))}
        </div>
      ) : null}
    </header>
  );
}

function Summary({ summary }: { summary?: string }) {
  if (!summary?.replace(/<[^>]*>/g, "").trim()) return null;
  return (
    <section>
      <SectionTitle>Summary</SectionTitle>
      <RichText html={summary} className="rt" />
    </section>
  );
}

function Skills({ skills }: { skills?: SkillCategory[] }) {
  const categories = skills?.filter((category) => clean(category.details).length > 0);
  if (!categories?.length) return null;
  return (
    <section>
      <SectionTitle>Skills</SectionTitle>
      {categories.map((category, i) => (
        <div key={i} style={{ marginBottom: pt(S.skillSpacing) }}>
          {category.label?.trim() ? (
            <span style={styles.bold}>{category.label.trim()}: </span>
          ) : null}
          {clean(category.details).join(", ")}
        </div>
      ))}
    </section>
  );
}

function Experience({ experiences }: { experiences?: WorkExperience[] }) {
  if (!experiences?.length) return null;
  return (
    <section>
      <SectionTitle>Experience</SectionTitle>
      {experiences.map((experience, i) => {
        const company = experience.company?.trim();
        const location = experience.location?.trim();
        const jobTitle = experience.jobTitle?.trim();
        const dates = dateRange(experience.startDate, experience.endDate, experience.currentJob);
        // Same order as the PDF: company and location, then title and dates.
        const rows = company
          ? [
              { left: <span style={styles.bold}>{company}</span>, right: location },
              { left: <span style={styles.italic}>{jobTitle}</span>, right: dates },
            ]
          : [
              { left: <span style={styles.bold}>{jobTitle}</span>, right: location },
              ...(dates ? [{ left: null, right: dates }] : []),
            ];
        return (
          <Fragment key={i}>
            <EntryHeader first={i === 0} rows={rows} />
            <RichText html={experience.description} className="rt" />
          </Fragment>
        );
      })}
    </section>
  );
}

function Projects({ projects }: { projects?: Project[] }) {
  if (!projects?.length) return null;
  return (
    <section>
      <SectionTitle>Projects</SectionTitle>
      {projects.map((project, i) => {
        const links = clean([project.url, project.githubUrl]);
        const technologies = clean(project.technologies ?? []);
        return (
          <Fragment key={i}>
            <EntryHeader
              first={i === 0}
              rows={[
                {
                  left: (
                    <>
                      <span style={styles.bold}>{project.name}</span>
                      {links.map((link, j) => (
                        <Fragment key={j}>
                          <span style={styles.gap}>{j === 0 ? "  |  " : "  •  "}</span>
                          <ResumeLink href={toHref(link)}>{displayUrl(link)}</ResumeLink>
                        </Fragment>
                      ))}
                    </>
                  ),
                  right: dateRange(project.startDate, project.endDate, project.current),
                },
                ...(technologies.length
                  ? [{ left: <span style={styles.italic}>{technologies.join(", ")}</span> }]
                  : []),
              ]}
            />
            <RichText html={project.description} className="rt" />
          </Fragment>
        );
      })}
    </section>
  );
}

function EducationList({ educations }: { educations?: Education[] }) {
  if (!educations?.length) return null;
  return (
    <section>
      <SectionTitle>Education</SectionTitle>
      {educations.map((education, i) => {
        const degree = joinParts([education.degree, education.fieldOfStudy], " in ");
        const cgpa = education.cgpa?.trim();
        const dates = dateRange(education.startDate, education.endDate);
        return (
          <Fragment key={i}>
            <EntryHeader
              first={i === 0}
              rows={[
                {
                  left: <span style={styles.bold}>{education.institution}</span>,
                  right: education.location?.trim(),
                },
                ...(degree || cgpa || dates
                  ? [
                      {
                        left: (
                          <>
                            {degree ? <span style={styles.italic}>{degree}</span> : null}
                            {cgpa ? (
                              <span style={styles.meta}>
                                {degree ? " • " : ""}GPA: {cgpa}
                              </span>
                            ) : null}
                          </>
                        ),
                        right: dates,
                      },
                    ]
                  : []),
              ]}
            />
            <RichText html={education.description} className="rt" />
          </Fragment>
        );
      })}
    </section>
  );
}

function Certifications({ certifications }: { certifications?: LicenseOrCertification[] }) {
  if (!certifications?.length) return null;
  return (
    <section>
      <SectionTitle>Certifications</SectionTitle>
      {certifications.map((certification, i) => {
        const url = certification.credentialUrl?.trim();
        const dates = certificationDates(certification.issueDate, certification.expirationDate);
        return (
          <div key={i} style={{ ...styles.row, marginBottom: pt(S.skillSpacing) }}>
            <div style={styles.left}>
              <span style={styles.bold}>{certification.title}</span>
              {certification.organization?.trim() ? (
                <span> — {certification.organization.trim()}</span>
              ) : null}
              {url ? (
                <>
                  <span style={styles.gap}>{"  |  "}</span>
                  <ResumeLink href={toHref(url)}>{displayUrl(url)}</ResumeLink>
                </>
              ) : null}
            </div>
            {dates ? <div style={styles.right}>{dates}</div> : null}
          </div>
        );
      })}
    </section>
  );
}

function renderSection(section: ResumeSection, resume: ResumeDocumentData) {
  switch (section) {
    case "summary":
      return <Summary summary={resume.summary} />;
    case "skills":
      return <Skills skills={resume.skills} />;
    case "experience":
      return <Experience experiences={resume.experiences} />;
    case "project":
      return <Projects projects={resume.projects} />;
    case "education":
      return <EducationList educations={resume.educations} />;
    case "certification":
      return <Certifications certifications={resume.certifications} />;
  }
}

/**
 * The resume as an HTML page at US Letter width, laid out like the PDF from
 * `ProfessionalTemplate` — same order, measurements and formatting — so it can
 * serve as a live preview without generating a PDF on every change. The PDF
 * itself is only built on download.
 */
export const ResumePreview = memo(function ResumePreview({
  resume,
}: {
  resume: ResumeDocumentData;
}) {
  return (
    <article className="resume-preview" style={styles.page} aria-label="Resume preview">
      <style>{RICH_TEXT_CSS}</style>
      {resume.contactInfo ? <Header contactInfo={resume.contactInfo} /> : null}
      {resolveSectionOrder(resume.sectionOrder).map((section) => (
        <Fragment key={section}>{renderSection(section, resume)}</Fragment>
      ))}
    </article>
  );
});
