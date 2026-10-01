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
    details: String!
    "Whether this is the signed-in user's own default profile."
    isDefault: Boolean!
    createdAt: String!
    updatedAt: String!
    "The signed-in user's applications that use this profile."
    applicationCount: Int!
    resumeDraftCount: Int!
    "Who created the profile. Every signed-in user can view and edit it."
    owner: UserSummary!
    "Whether the signed-in user created it; only the creator may delete it."
    isOwner: Boolean!
  }

  type UserSummary {
    id: ID!
    name: String!
    imageUrl: String
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
    sectionOrder: [String!]!
    createdAt: String!
    updatedAt: String!
    "Whether the signed-in user may delete it: its author or the profile's creator."
    canDelete: Boolean!
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
    sectionOrder: [String!]
  }

  input CreateJobProfileInput {
    name: String!
    email: String!
    linkedin: String
    phone: String
    github: String
    address: String
    description: String
    details: String!
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
