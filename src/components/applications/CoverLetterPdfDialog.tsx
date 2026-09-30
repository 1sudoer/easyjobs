"use client";
import { Document, Page, Text, View, StyleSheet, PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { socialProfile } from "@/lib/social-profiles";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const styles = StyleSheet.create({
  page: {
    paddingTop: 52,
    paddingBottom: 52,
    paddingHorizontal: 60,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: "#1a1a1a",
  },
  name: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  contactRow: {
    fontSize: 9.5,
    color: "#444",
    marginBottom: 2,
  },
  location: {
    fontSize: 9.5,
    color: "#444",
  },
  divider: {
    borderBottomWidth: 0.75,
    borderBottomColor: "#c0c0c0",
    marginVertical: 10,
  },
  date: {
    fontSize: 10,
    marginBottom: 10,
  },
  addressBlock: {
    fontSize: 10,
    lineHeight: 1.6,
    marginBottom: 10,
  },
  re: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 0,
  },
  body: {
    fontSize: 10.5,
    lineHeight: 1.7,
    color: "#1a1a1a",
    marginTop: 10,
  },
  salutation: {
    fontSize: 10.5,
    marginTop: 0,
    marginBottom: 10,
  },
  closing: {
    marginTop: 14,
    fontSize: 10.5,
  },
  signatureName: {
    marginTop: 4,
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
  },
});

export interface CoverLetterProfile {
  name: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  location?: string;
}

export interface CoverLetterJob {
  title: string;
  companyName: string;
  companyLocation?: string;
}

function CoverLetterDocument({
  coverLetter,
  profile,
  job,
  date,
}: {
  coverLetter: string;
  profile: CoverLetterProfile;
  job: CoverLetterJob;
  date: string;
}) {
  const contactItems = [
    profile.phone,
    profile.email,
    socialProfile("linkedin", profile.linkedin)?.label,
    socialProfile("github", profile.github)?.label,
  ].filter(Boolean) as string[];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Sender block */}
        <Text style={styles.name}>{profile.name}</Text>
        {contactItems.map((item) => (
          <Text key={item} style={styles.contactRow}>{item}</Text>
        ))}
        {profile.location ? <Text style={styles.location}>{profile.location}</Text> : null}

        <View style={styles.divider} />

        {/* Date */}
        <Text style={styles.date}>{date}</Text>

        {/* Recipient block */}
        <View style={styles.addressBlock}>
          <Text>Hiring Manager</Text>
          <Text>{job.companyName}</Text>
          {job.companyLocation ? <Text>{job.companyLocation}</Text> : null}
        </View>

        {/* Re: line */}
        <Text style={styles.re}>Re: {job.title} Application</Text>

        <View style={styles.divider} />

        {/* Body */}
        <Text style={styles.salutation}>Dear Hiring Manager,</Text>
        <Text style={styles.body}>{coverLetter}</Text>

        {/* Closing */}
        <Text style={styles.closing}>Sincerely,</Text>
        <Text style={styles.signatureName}>{profile.name}</Text>
      </Page>
    </Document>
  );
}

interface CoverLetterPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverLetter: string;
  profile: CoverLetterProfile;
  job: CoverLetterJob;
  filename: string;
  date: string;
}

export function CoverLetterPdfDialog({
  open,
  onOpenChange,
  coverLetter,
  profile,
  job,
  filename,
  date,
}: CoverLetterPdfDialogProps) {
  const doc = (
    <CoverLetterDocument
      coverLetter={coverLetter}
      profile={profile}
      job={job}
      date={date}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col gap-3 p-4">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-sm font-semibold">Cover Letter Preview</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 rounded overflow-hidden border">
          <PDFViewer showToolbar={false} style={{ width: "100%", height: "100%", border: "none" }}>
            {doc}
          </PDFViewer>
        </div>

        <div className="shrink-0 flex justify-end">
          <PDFDownloadLink document={doc} fileName={filename}>
            {({ loading }) => (
              <Button size="sm" disabled={loading} className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                {loading ? "Preparing..." : "Download PDF"}
              </Button>
            )}
          </PDFDownloadLink>
        </div>
      </DialogContent>
    </Dialog>
  );
}
