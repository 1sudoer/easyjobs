import { gql } from '@apollo/client/core'

// ─── Job Posts ───────────────────────────────────────────────────────────────

export const JOB_POSTS_QUERY = gql`
  query JobPosts($filter: JobPostFilter, $page: Int, $limit: Int) {
    jobPosts(filter: $filter, page: $page, limit: $limit) {
      items {
        id
        title
        salary
        locations
        postedAt
        postedBy
        sourceUrl
        jobSource
        status
        applicationCount
        savedProfileIds
        createdAt
        tags {
          id
          label
          value
        }
      }
      total
      page
      totalPages
    }
  }
`

export const JOB_POST_QUERY = gql`
  query JobPost($id: ID!) {
    jobPost(id: $id) {
      id
      title
      description
      salary
      locations
      postedAt
      postedBy
      sourceUrl
      jobType
      jobSource
      status
      applicationCount
      createdAt
      updatedAt
      tags {
        id
        label
        value
      }
    }
  }
`

export const JOB_POST_INSIGHTS_QUERY = gql`
  query JobPostInsights {
    jobPostInsights {
      total
      active
      closed
      inappropriate
      savedToApply
    }
  }
`

export const CREATE_JOB_POST = gql`
  mutation CreateJobPost($input: CreateJobPostInput!) {
    createJobPost(input: $input) {
      id
      title
      jobType
      jobSource
      status
      createdAt
    }
  }
`

export const UPDATE_JOB_POST = gql`
  mutation UpdateJobPost($id: ID!, $input: UpdateJobPostInput!) {
    updateJobPost(id: $id, input: $input) {
      id
      title
      jobType
      jobSource
      status
    }
  }
`

export const SET_JOB_POST_STATUS = gql`
  mutation SetJobPostStatus($id: ID!, $status: String!) {
    setJobPostStatus(id: $id, status: $status) {
      id
      status
    }
  }
`

export const DELETE_JOB_POST = gql`
  mutation DeleteJobPost($id: ID!) {
    deleteJobPost(id: $id)
  }
`

export const JOB_POST_TAGS_QUERY = gql`
  query JobPostTags {
    jobPostTags {
      id
      label
      value
    }
  }
`

export const CREATE_JOB_POST_TAG = gql`
  mutation CreateJobPostTag($label: String!) {
    createJobPostTag(label: $label) {
      id
      label
      value
    }
  }
`

export const SET_JOB_POST_TAGS = gql`
  mutation SetJobPostTags($jobPostId: ID!, $tagIds: [ID!]!) {
    setJobPostTags(jobPostId: $jobPostId, tagIds: $tagIds) {
      id
      tags {
        id
        label
        value
      }
    }
  }
`

export const CHECK_DUPLICATE_JOB_POSTS = gql`
  query CheckDuplicateJobPosts($title: String!, $postedBy: String!, $excludeId: ID) {
    checkDuplicateJobPosts(title: $title, postedBy: $postedBy, excludeId: $excludeId) {
      id
      title
      postedBy
      postedAt
      sourceUrl
      status
      createdAt
    }
  }
`

// ─── Job Applications ─────────────────────────────────────────────────────────

export const JOB_APPLICATIONS_QUERY = gql`
  query JobApplications($filter: ApplicationFilter, $page: Int, $limit: Int) {
    jobApplications(filter: $filter, page: $page, limit: $limit) {
      items {
        id
        currentStatus
        cvGenerationStatus
        createdAt
        updatedAt
        jobPost {
          id
          title
          postedBy
          locations
          salary
          jobSource
        }
        jobProfile {
          id
          name
        }
        resume {
          id
          title
        }
      }
      total
      page
      totalPages
    }
  }
`

export const JOB_APPLICATION_QUERY = gql`
  query JobApplication($id: ID!) {
    jobApplication(id: $id) {
      id
      currentStatus
      cvGenerationStatus
      coverLetter
      notes
      createdAt
      updatedAt
      jobPost {
        id
        title
        description
        salary
        locations
        postedBy
        postedAt
        sourceUrl
      }
      jobProfile {
        id
        name
        email
        linkedin
        github
        phone
        address
        details
      }
      resume {
        id
        title
      }
      statusHistory {
        id
        status
        changedAt
        note
        durationFromPreviousMinutes
      }
      customQuestions {
        id
        question
        answer
        questionType
        sortOrder
      }
    }
  }
`

export const APPLICATION_INSIGHTS_QUERY = gql`
  query ApplicationInsights($startDate: String, $endDate: String) {
    applicationInsights(startDate: $startDate, endDate: $endDate) {
      totalApplications
      cvReadyCount
      byStatus {
        status
        count
      }
      avgDaysByStatus {
        fromStatus
        toStatus
        avgDays
      }
      recentStatusChanges {
        applicationId
        jobTitle
        toStatus
        changedAt
        daysSinceChange
      }
    }
  }
`

export const SAVE_JOB_POST_TO_APPLY = gql`
  mutation SaveJobPostToApply($jobPostId: ID!, $profileId: ID) {
    saveJobPostToApply(jobPostId: $jobPostId, profileId: $profileId) {
      id
      currentStatus
      cvGenerationStatus
    }
  }
`

export const UPDATE_APPLICATION_STATUS = gql`
  mutation UpdateApplicationStatus($id: ID!, $status: String!, $note: String) {
    updateApplicationStatus(id: $id, status: $status, note: $note) {
      id
      currentStatus
      statusHistory {
        id
        status
        changedAt
        note
        durationFromPreviousMinutes
      }
    }
  }
`

export const UPDATE_APPLICATION = gql`
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      id
      coverLetter
      notes
      jobProfile {
        id
        name
      }
      resume {
        id
        title
      }
      customQuestions {
        id
        question
        answer
        questionType
        sortOrder
      }
    }
  }
`

export const DELETE_APPLICATION = gql`
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id)
  }
`

export const DELETE_APPLICATION_QUESTION = gql`
  mutation DeleteApplicationQuestion($id: ID!) {
    deleteApplicationQuestion(id: $id)
  }
`

export const GENERATE_CV = gql`
  mutation GenerateCV($applicationId: ID!) {
    generateCV(applicationId: $applicationId) {
      id
      cvGenerationStatus
    }
  }
`

// ─── Job Profiles ─────────────────────────────────────────────────────────────

export const JOB_PROFILE_QUERY = gql`
  query JobProfile($id: ID!) {
    jobProfile(id: $id) {
      id
      name
      email
      linkedin
      phone
      github
      address
      description
      details
      isDefault
      applicationCount
      resumeDraftCount
      createdAt
      updatedAt
    }
  }
`

export const JOB_PROFILES_QUERY = gql`
  query JobProfiles {
    jobProfiles {
      id
      name
      email
      linkedin
      phone
      github
      address
      description
      details
      isDefault
      applicationCount
      resumeDraftCount
      createdAt
    }
  }
`

const RESUME_DRAFT_FIELDS = /* GraphQL */ `
  id
  jobProfileId
  title
  summary
  contactInfo
  skills
  experiences
  educations
  projects
  certifications
  createdAt
  updatedAt
`

export const PROFILE_RESUME_DRAFTS_QUERY = gql`
  query ProfileResumeDrafts($profileId: ID!) {
    profileResumeDrafts(profileId: $profileId) {
      ${RESUME_DRAFT_FIELDS}
    }
  }
`

export const CREATE_PROFILE_RESUME_DRAFT = gql`
  mutation CreateProfileResumeDraft($profileId: ID!, $input: ResumeDraftInput!) {
    createProfileResumeDraft(profileId: $profileId, input: $input) {
      ${RESUME_DRAFT_FIELDS}
    }
  }
`

export const UPDATE_PROFILE_RESUME_DRAFT = gql`
  mutation UpdateProfileResumeDraft($id: ID!, $input: ResumeDraftInput!) {
    updateProfileResumeDraft(id: $id, input: $input) {
      ${RESUME_DRAFT_FIELDS}
    }
  }
`

export const DELETE_PROFILE_RESUME_DRAFT = gql`
  mutation DeleteProfileResumeDraft($id: ID!) {
    deleteProfileResumeDraft(id: $id)
  }
`

export const RESUME_DRAFT_QUERY = gql`
  query ResumeDraft($id: ID!) {
    resumeDraft(id: $id) {
      ${RESUME_DRAFT_FIELDS}
    }
  }
`

export const RESUME_LINKED_APPLICATIONS_QUERY = gql`
  query ResumeLinkedApplications($resumeId: ID!) {
    jobApplications(filter: { resumeId: $resumeId }, limit: 50) {
      items {
        id
        currentStatus
        createdAt
        jobPost {
          id
          title
          postedBy
        }
      }
    }
  }
`

export const CREATE_JOB_PROFILE = gql`
  mutation CreateJobProfile($input: CreateJobProfileInput!) {
    createJobProfile(input: $input) {
      id
      name
      isDefault
    }
  }
`

export const UPDATE_JOB_PROFILE = gql`
  mutation UpdateJobProfile($id: ID!, $input: UpdateJobProfileInput!) {
    updateJobProfile(id: $id, input: $input) {
      id
      name
      email
      linkedin
      phone
      github
      address
      description
      details
      isDefault
    }
  }
`

export const DELETE_JOB_PROFILE = gql`
  mutation DeleteJobProfile($id: ID!) {
    deleteJobProfile(id: $id)
  }
`
