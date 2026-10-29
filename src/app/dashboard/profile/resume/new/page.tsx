import { Metadata } from "next";
import { NewResumeView } from "@/components/profile/NewResumeView";

export const metadata: Metadata = { title: "New Resume" };

export default function NewResumePage() {
  return <NewResumeView />;
}
