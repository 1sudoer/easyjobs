"use client";
import { Loader, X } from "lucide-react";
import { SocialHandleInput } from "../SocialHandleInput";
import { extractHandle, toStoredHandle } from "@/lib/social-profiles";
import { Button } from "../ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { AddContactInfoFormSchema } from "@/models/addContactInfoForm.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useTransition } from "react";
import { toast } from "../ui/use-toast";
import { ContactInfo } from "@/models/profile.model";
import { saveContactInfo } from "@/actions/profile.actions";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  headline: "",
  phone: "",
  address: "",
  github: "",
  linkedin: "",
};

interface AddContactInfoProps {
  contactInfoToEdit?: ContactInfo | null;
  resumeId: string | undefined;
  onClose: () => void;
  onLocalSave?: (contactInfo: ContactInfo) => void;
}

function AddContactInfo({
  contactInfoToEdit,
  resumeId,
  onClose,
  onLocalSave,
}: AddContactInfoProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AddContactInfoFormSchema>>({
    resolver: zodResolver(AddContactInfoFormSchema),
    defaultValues: { resumeId, ...EMPTY_FORM },
  });

  const { reset, formState } = form;

  useEffect(() => {
    if (contactInfoToEdit) {
      reset({
        resumeId,
        firstName: contactInfoToEdit.firstName,
        lastName: contactInfoToEdit.lastName,
        email: contactInfoToEdit.email,
        headline: contactInfoToEdit.headline ?? "",
        phone: contactInfoToEdit.phone ?? "",
        address: contactInfoToEdit.address ?? "",
        // Older resumes may hold full profile URLs; edit them as handles.
        github: extractHandle("github", contactInfoToEdit.github),
        linkedin: extractHandle("linkedin", contactInfoToEdit.linkedin),
      }, { keepDefaultValues: true });
    } else {
      reset({ resumeId, ...EMPTY_FORM });
    }
  }, [contactInfoToEdit, reset, resumeId]);

  const onSubmit = (data: z.infer<typeof AddContactInfoFormSchema>) => {
    if (onLocalSave) {
      onLocalSave({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        headline: data.headline || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        github: toStoredHandle("github", data.github) ?? undefined,
        linkedin: toStoredHandle("linkedin", data.linkedin) ?? undefined,
      });
      reset(data);
      onClose();
      return;
    }
    startTransition(async () => {
      const res = await saveContactInfo(data);
      if (!res.success) {
        toast({ variant: "destructive", title: "Error!", description: res.message });
      } else {
        reset();
        onClose();
        toast({
          variant: "success",
          description: `Contact info ${contactInfoToEdit ? "updated" : "saved"} successfully`,
        });
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {contactInfoToEdit ? "Edit Contact Info" : "Add Contact Info"}
        </h3>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name *</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl><Input {...field} type="email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Senior Software Engineer" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl><Input {...field} type="tel" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Toronto, ON" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="linkedin"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>LinkedIn</FormLabel>
                <FormControl>
                  <SocialHandleInput {...field} network="linkedin" hideHint />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="github"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>GitHub</FormLabel>
                <FormControl>
                  <SocialHandleInput {...field} network="github" hideHint />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="md:col-span-2 flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!formState.isDirty || isPending}>
              Save
              {isPending && <Loader className="h-4 w-4 shrink-0 animate-spin ml-1" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default AddContactInfo;
