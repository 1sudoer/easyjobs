"use client";

import { useState } from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { PowerIcon, Settings, Info } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import UserAvatar from "./UserAvatar";
import { CurrentUser } from "@/models/user.model";
import { SupportDialog } from "./SupportDialog";

interface ProfileDropdownProps {
  /** Only used to decide whether to render the avatar at all. */
  user: CurrentUser | null;
}

export function ProfileDropdown({ user }: ProfileDropdownProps) {
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const { signOut } = useClerk();
  // Straight from Clerk, so it reflects a changed email immediately rather
  // than whatever was copied into a local row at first sign-in.
  const { user: clerkUser } = useUser();
  const email = clerkUser?.primaryEmailAddress?.emailAddress;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger>
          <UserAvatar user={user} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{email ?? "My Account"}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings" className="cursor-pointer">
              <Settings className="w-5 mr-2" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setSupportDialogOpen(true)}
            className="cursor-pointer"
          >
            <Info className="w-5 mr-2" />
            Support
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => signOut({ redirectUrl: "/" })}
            className="cursor-pointer"
          >
            <Button variant="ghost" className="w-full">
              <PowerIcon className="w-5" />
              <span className="hidden md:block mx-2">Logout</span>
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SupportDialog
        open={supportDialogOpen}
        onOpenChange={setSupportDialogOpen}
      />
    </>
  );
}
