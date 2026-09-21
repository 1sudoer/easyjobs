"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddEducationFormSchema } from "@/models/AddEductionForm.schema";
import { AddContactInfoFormSchema } from "@/models/addContactInfoForm.schema";
import { AddCertificationFormSchema } from "@/models/addCertificationForm.schema";
import { AddProjectFormSchema } from "@/models/addProjectForm.schema";
import { AddExperienceFormSchema } from "@/models/addExperienceForm.schema";
import { AddSummarySectionFormSchema } from "@/models/addSummaryForm.schema";
import { AddSkillsFormSchema } from "@/models/addSkillsForm.schema";
import { getCurrentUser } from "@/utils/user.utils";
import { APP_CONSTANTS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Resume } from "@/models/profile.model";

// ─── Resume CRUD ──────────────────────────────────────────────────────────────

export const getResumeList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      prisma.resume.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
        select: {
          id: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          title: true,
          _count: { select: { Job: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.resume.count({ where: { userId: user.id } }),
    ]);
    return { data, total, success: true };
  } catch (error) {
    return handleError(error, "Failed to get resume list.");
  }
};

export const getResumeById = async (
  resumeId: string,
): Promise<any | undefined> => {
  try {
    if (!resumeId) throw new Error("Please provide resume id");
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
    });
    return { data: resume, success: true };
  } catch (error) {
    return handleError(error, "Failed to get resume.");
  }
};

export const createResume = async (title: string): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const res = await prisma.resume.create({
      data: { userId: user.id, title },
    });
    return { success: true, data: res };
  } catch (error) {
    return handleError(error, "Failed to create resume.");
  }
};

export const editResume = async (
  id: string,
  title: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const res = await prisma.resume.update({
      where: { id, userId: user.id },
      data: { title },
    });
    return { success: true, data: res };
  } catch (error) {
    return handleError(error, "Failed to update resume.");
  }
};

export const deleteResumeById = async (
  resumeId: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    await prisma.resume.delete({ where: { id: resumeId, userId: user.id } });
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete resume.");
  }
};

// ─── Contact Info ─────────────────────────────────────────────────────────────

export const saveContactInfo = async (
  data: z.infer<typeof AddContactInfoFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const res = await prisma.resume.update({
      where: { id: data.resumeId, userId: user.id },
      data: {
        contactInfo: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          headline: data.headline || null,
          phone: data.phone || null,
          address: data.address || null,
          github: data.github || null,
          linkedin: data.linkedin || null,
        },
      },
    });
    revalidatePath("/dashboard/profile/resume");
    return { data: res, success: true };
  } catch (error) {
    return handleError(error, "Failed to save contact info.");
  }
};

// Keep old names as aliases so existing callers still compile
export const addContactInfo = saveContactInfo;
export const updateContactInfo = saveContactInfo;

// ─── Summary ──────────────────────────────────────────────────────────────────

export const addResumeSummary = async (
  data: z.infer<typeof AddSummarySectionFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const res = await prisma.resume.update({
      where: { id: data.resumeId, userId: user.id },
      data: { summary: data.content },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: res, success: true };
  } catch (error) {
    return handleError(error, "Failed to create summary.");
  }
};

export const updateResumeSummary = addResumeSummary;

// ─── Skills ───────────────────────────────────────────────────────────────────

export const addResumeSkills = async (
  data: z.infer<typeof AddSkillsFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { skills: true },
    });
    if (!resume) throw new Error("Resume not found");

    const skills = (resume.skills as any[]) ?? [];
    const newSkill = { label: data.label, details: data.details };
    const updated = [...skills, newSkill];

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { skills: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: newSkill, success: true };
  } catch (error) {
    return handleError(error, "Failed to create skills.");
  }
};

export const updateResumeSkills = async (
  data: z.infer<typeof AddSkillsFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { skills: true },
    });
    if (!resume) throw new Error("Resume not found");

    const skills = (resume.skills as any[]) ?? [];
    const updated = skills.map((s: any, i: number) =>
      i === data.index ? { label: data.label, details: data.details } : s,
    );

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { skills: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: updated[data.index!], success: true };
  } catch (error) {
    return handleError(error, "Failed to update skills.");
  }
};

export const deleteSkillCategory = async (
  index: number,
  resumeId: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
      select: { skills: true },
    });
    if (!resume) throw new Error("Resume not found");

    const skills = (resume.skills as any[]) ?? [];
    const updated = skills.filter((_: any, i: number) => i !== index);

    await prisma.resume.update({
      where: { id: resumeId },
      data: { skills: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${resumeId}`);
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete skill.");
  }
};

// ─── Experience ───────────────────────────────────────────────────────────────

export const addExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { experiences: true },
    });
    if (!resume) throw new Error("Resume not found");

    const experiences = (resume.experiences as any[]) ?? [];
    const newExp = {
      company: data.company,
      jobTitle: data.title,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      currentJob: data.currentJob ?? false,
      description: data.jobDescription,
    };
    const updated = [...experiences, newExp];

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { experiences: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: newExp, success: true };
  } catch (error) {
    return handleError(error, "Failed to create experience.");
  }
};

export const updateExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { experiences: true },
    });
    if (!resume) throw new Error("Resume not found");

    const experiences = (resume.experiences as any[]) ?? [];
    const updated = experiences.map((e: any, i: number) =>
      i === data.index
        ? {
            company: data.company,
            jobTitle: data.title,
            location: data.location,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            currentJob: data.currentJob ?? false,
            description: data.jobDescription,
          }
        : e,
    );

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { experiences: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: updated[data.index!], success: true };
  } catch (error) {
    return handleError(error, "Failed to update experience.");
  }
};

export const deleteExperience = async (
  index: number,
  resumeId: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
      select: { experiences: true },
    });
    if (!resume) throw new Error("Resume not found");

    const updated = ((resume.experiences as any[]) ?? []).filter((_: any, i: number) => i !== index);
    await prisma.resume.update({ where: { id: resumeId }, data: { experiences: updated } });
    revalidatePath(`/dashboard/profile/resume/${resumeId}`);
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete experience.");
  }
};

// ─── Education ────────────────────────────────────────────────────────────────

export const addEducation = async (
  data: z.infer<typeof AddEducationFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { educations: true },
    });
    if (!resume) throw new Error("Resume not found");

    const educations = (resume.educations as any[]) ?? [];
    const newEdu = {
      institution: data.institution,
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      location: data.location,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      cgpa: data.cgpa ?? null,
      description: data.description ?? null,
    };
    const updated = [...educations, newEdu];

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { educations: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: newEdu, success: true };
  } catch (error) {
    return handleError(error, "Failed to create education.");
  }
};

export const updateEducation = async (
  data: z.infer<typeof AddEducationFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { educations: true },
    });
    if (!resume) throw new Error("Resume not found");

    const educations = (resume.educations as any[]) ?? [];
    const updated = educations.map((e: any, i: number) =>
      i === data.index
        ? {
            institution: data.institution,
            degree: data.degree,
            fieldOfStudy: data.fieldOfStudy,
            location: data.location,
            startDate: data.startDate,
            endDate: data.endDate ?? null,
            cgpa: data.cgpa ?? null,
            description: data.description ?? null,
          }
        : e,
    );

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { educations: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: updated[data.index!], success: true };
  } catch (error) {
    return handleError(error, "Failed to update education.");
  }
};

export const deleteEducation = async (
  index: number,
  resumeId: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
      select: { educations: true },
    });
    if (!resume) throw new Error("Resume not found");

    const updated = ((resume.educations as any[]) ?? []).filter((_: any, i: number) => i !== index);
    await prisma.resume.update({ where: { id: resumeId }, data: { educations: updated } });
    revalidatePath(`/dashboard/profile/resume/${resumeId}`);
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete education.");
  }
};

// ─── Certification ────────────────────────────────────────────────────────────

export const addCertification = async (
  data: z.infer<typeof AddCertificationFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { certifications: true },
    });
    if (!resume) throw new Error("Resume not found");

    const certifications = (resume.certifications as any[]) ?? [];
    const newCert = {
      title: data.title,
      organization: data.organization,
      issueDate: data.issueDate ?? null,
      expirationDate: data.expirationDate ?? null,
      credentialUrl: data.credentialUrl ?? null,
    };
    const updated = [...certifications, newCert];

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { certifications: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: newCert, success: true };
  } catch (error) {
    return handleError(error, "Failed to create certification.");
  }
};

export const updateCertification = async (
  data: z.infer<typeof AddCertificationFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { certifications: true },
    });
    if (!resume) throw new Error("Resume not found");

    const certifications = (resume.certifications as any[]) ?? [];
    const updated = certifications.map((c: any, i: number) =>
      i === data.index
        ? {
            title: data.title,
            organization: data.organization,
            issueDate: data.issueDate ?? null,
            expirationDate: data.expirationDate ?? null,
            credentialUrl: data.credentialUrl ?? null,
          }
        : c,
    );

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { certifications: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: updated[data.index!], success: true };
  } catch (error) {
    return handleError(error, "Failed to update certification.");
  }
};

export const deleteCertification = async (
  index: number,
  resumeId: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
      select: { certifications: true },
    });
    if (!resume) throw new Error("Resume not found");

    const updated = ((resume.certifications as any[]) ?? []).filter((_: any, i: number) => i !== index);
    await prisma.resume.update({ where: { id: resumeId }, data: { certifications: updated } });
    revalidatePath(`/dashboard/profile/resume/${resumeId}`);
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete certification.");
  }
};

// ─── Projects ────────────────────────────────────────────────────────────────

/** The form takes technologies as a comma-separated string; store an array. */
const parseTechnologies = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const toProject = (data: z.infer<typeof AddProjectFormSchema>) => ({
  name: data.name,
  description: data.description,
  startDate: data.startDate || null,
  endDate: data.endDate || null,
  current: data.current ?? false,
  technologies: parseTechnologies(data.technologies),
  url: data.url || null,
  githubUrl: data.githubUrl || null,
});

export const addProject = async (
  data: z.infer<typeof AddProjectFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { projects: true },
    });
    if (!resume) throw new Error("Resume not found");

    const newProject = toProject(data);
    const updated = [...((resume.projects as any[]) ?? []), newProject];

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { projects: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: newProject, success: true };
  } catch (error) {
    return handleError(error, "Failed to create project.");
  }
};

export const updateProject = async (
  data: z.infer<typeof AddProjectFormSchema>,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");
    if (data.index === undefined) throw new Error("Project index is required");

    const resume = await prisma.resume.findUnique({
      where: { id: data.resumeId, userId: user.id },
      select: { projects: true },
    });
    if (!resume) throw new Error("Resume not found");

    const projects = (resume.projects as any[]) ?? [];
    if (!projects[data.index]) throw new Error("Project not found");

    const updatedProject = toProject(data);
    const updated = projects.map((project: any, i: number) =>
      i === data.index ? updatedProject : project,
    );

    await prisma.resume.update({
      where: { id: data.resumeId },
      data: { projects: updated },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: updatedProject, success: true };
  } catch (error) {
    return handleError(error, "Failed to update project.");
  }
};

export const deleteProject = async (
  index: number,
  resumeId: string,
): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const resume = await prisma.resume.findUnique({
      where: { id: resumeId, userId: user.id },
      select: { projects: true },
    });
    if (!resume) throw new Error("Resume not found");

    const updated = ((resume.projects as any[]) ?? []).filter(
      (_: any, i: number) => i !== index,
    );
    await prisma.resume.update({ where: { id: resumeId }, data: { projects: updated } });
    revalidatePath(`/dashboard/profile/resume/${resumeId}`);
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to delete project.");
  }
};

// ─── Resume application insights ─────────────────────────────────────────────

export const getResumeApplications = async (resumeId: string): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const apps = await prisma.jobApplication.findMany({
      where: { resumeId, userId: user.id },
      select: {
        id: true,
        currentStatus: true,
        createdAt: true,
        jobPost: {
          select: {
            title: true,
            postedBy: true,
            sourceUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: apps };
  } catch (error) {
    return handleError(error, "Failed to get resume applications.");
  }
};

// ─── Resume sharing ───────────────────────────────────────────────────────────

export const shareResume = async (resumeId: string): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const owned = await prisma.resume.findUnique({ where: { id: resumeId, userId: user.id }, select: { id: true } });
    if (!owned) throw new Error("Resume not found");

    const share = await prisma.resumeShare.upsert({
      where: { resumeId },
      create: { resumeId },
      update: {},
    });
    return { success: true, data: share };
  } catch (error) {
    return handleError(error, "Failed to share resume.");
  }
};

export const unshareResume = async (resumeId: string): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const owned = await prisma.resume.findUnique({ where: { id: resumeId, userId: user.id }, select: { id: true } });
    if (!owned) throw new Error("Resume not found");

    await prisma.resumeShare.delete({ where: { resumeId } });
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to unshare resume.");
  }
};

export const getResumeShareStatus = async (resumeId: string): Promise<any | undefined> => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    const share = await prisma.resumeShare.findUnique({ where: { resumeId } });
    return { success: true, data: share ? { shared: true, token: share.token } : { shared: false } };
  } catch (error) {
    return handleError(error, "Failed to get share status.");
  }
};

export const getResumeByShareToken = async (token: string): Promise<any | undefined> => {
  try {
    if (!token) throw new Error("Token is required");
    const share = await prisma.resumeShare.findUnique({
      where: { token },
      include: { resume: true },
    });
    if (!share) return { success: false, data: null };
    return { success: true, data: share.resume };
  } catch (error) {
    return handleError(error, "Failed to fetch shared resume.");
  }
};

// ─── Save full resume (local-first draft) ─────────────────────────────────────

export const saveFullResume = async (resume: Resume): Promise<any | undefined> => {
  try {
    if (!resume.id) throw new Error("Resume id is required");
    const user = await getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    await prisma.resume.update({
      where: { id: resume.id, userId: user.id },
      data: {
        contactInfo: (resume.contactInfo as any) ?? undefined,
        summary: resume.summary ?? null,
        skills: (resume.skills as any) ?? [],
        experiences: (resume.experiences as any) ?? [],
        educations: (resume.educations as any) ?? [],
        projects: (resume.projects as any) ?? [],
        certifications: (resume.certifications as any) ?? [],
      },
    });
    revalidatePath(`/dashboard/profile/resume/${resume.id}`);
    revalidatePath(`/dashboard/job-profiles`);
    return { success: true };
  } catch (error) {
    return handleError(error, "Failed to save resume.");
  }
};
