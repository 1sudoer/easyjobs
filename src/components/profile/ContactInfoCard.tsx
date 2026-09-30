"use client";
import { ContactInfo } from "@/models/profile.model";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Edit, Github, Linkedin } from "lucide-react";
import { socialProfile } from "@/lib/social-profiles";

interface ContactInfoCardProps {
  contactInfo: ContactInfo;
  onEdit: () => void;
}

function ContactInfoCard({ contactInfo, onEdit }: ContactInfoCardProps) {
  const { firstName, lastName, email, headline, phone, address, github, linkedin } = contactInfo;

  const details = [email, phone, address].filter(Boolean).join(" · ");
  const profiles = [
    { profile: socialProfile("linkedin", linkedin), Icon: Linkedin },
    { profile: socialProfile("github", github), Icon: Github },
  ].flatMap(({ profile, Icon }) => (profile ? [{ ...profile, Icon }] : []));

  return (
    <Card>
      <CardHeader className="flex-row justify-between relative">
        <div className="min-w-0">
          <CardTitle>{firstName} {lastName}</CardTitle>
          {headline && <CardDescription>{headline}</CardDescription>}
          {details && <CardDescription className="mt-0.5">{details}</CardDescription>}
          {profiles.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {profiles.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 absolute top-0 right-1 shrink-0"
          onClick={onEdit}
        >
          <Edit className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Edit</span>
        </Button>
      </CardHeader>
    </Card>
  );
}

export default ContactInfoCard;
