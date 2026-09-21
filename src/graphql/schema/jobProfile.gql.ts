export const jobProfileTypeDefs = /* GraphQL */ `
  type JobProfile {
    id: ID!
    name: String!
    email: String!
    linkedin: String
    phone: String
    github: String
    address: String
    description: String
    details: String
    isDefault: Boolean!
    createdAt: String!
    updatedAt: String!
    applicationCount: Int!
    resumeDraftCount: Int!
  }

  type ResumeDraft {
    id: ID!
    jobProfileId: ID
    title: String!
    summary: String
    contactInfo: JSON
    skills: JSON
    experiences: JSON
    educations: JSON
    projects: JSON
    certifications: JSON
    createdAt: String!
    updatedAt: String!
  }

  input ResumeDraftInput {
    title: String
    summary: String
    contactInfo: JSON
    skills: JSON
    experiences: JSON
    educations: JSON
    projects: JSON
    certifications: JSON
  }

  input CreateJobProfileInput {
    name: String!
    email: String!
    linkedin: String
    phone: String
    github: String
    address: String
    description: String
    details: String
    isDefault: Boolean
  }

  input UpdateJobProfileInput {
    name: String
    email: String
    linkedin: String
    phone: String
    github: String
    address: String
    description: String
    details: String
    isDefault: Boolean
  }

  extend type Query {
    jobProfiles: [JobProfile!]!
    jobProfile(id: ID!): JobProfile
    profileResumeDrafts(profileId: ID!): [ResumeDraft!]!
    resumeDraft(id: ID!): ResumeDraft
  }

  extend type Mutation {
    createJobProfile(input: CreateJobProfileInput!): JobProfile!
    updateJobProfile(id: ID!, input: UpdateJobProfileInput!): JobProfile!
    deleteJobProfile(id: ID!): Boolean!
    createProfileResumeDraft(profileId: ID!, input: ResumeDraftInput!): ResumeDraft!
    updateProfileResumeDraft(id: ID!, input: ResumeDraftInput!): ResumeDraft!
    deleteProfileResumeDraft(id: ID!): Boolean!
  }
`
