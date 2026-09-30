"use client";
import * as React from "react";
import { Github, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  extractHandle,
  isValidHandle,
  socialDisplayPrefix,
  type SocialNetwork,
} from "@/lib/social-profiles";

const ICONS: Record<SocialNetwork, React.ElementType> = {
  linkedin: Linkedin,
  github: Github,
};

const HINTS: Record<SocialNetwork, string> = {
  linkedin: "Use your LinkedIn username: letters, numbers and hyphens.",
  github: "Use your GitHub username: letters, numbers and single hyphens.",
};

type SocialHandleInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  network: SocialNetwork;
  /** Leave the format hint to the form, when it shows its own validation message. */
  hideHint?: boolean;
};

/**
 * Text input for a LinkedIn or GitHub handle, shown after the fixed profile
 * address ("linkedin.com/in/…"). Pasting a full profile URL keeps only the
 * handle, and anything typed is reduced to the handle on blur, so the form only
 * ever submits handles. Works with react-hook-form's `register` and with a
 * controlled `field`.
 */
export const SocialHandleInput = React.forwardRef<HTMLInputElement, SocialHandleInputProps>(
  function SocialHandleInput(
    { network, hideHint = false, className, onChange, onBlur, name, value, defaultValue, ...props },
    forwardedRef,
  ) {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const [current, setCurrent] = React.useState(String(value ?? defaultValue ?? ""));
    const Icon = ICONS[network];
    const invalid = current !== "" && !isValidHandle(network, extractHandle(network, current));
    const hintId = React.useId();

    React.useEffect(() => {
      if (value !== undefined) setCurrent(String(value ?? ""));
    }, [value]);

    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    /** Replaces the field's value with the handle, for both form styles. */
    const commit = (raw: string) => {
      const handle = extractHandle(network, raw);
      // An uncontrolled (registered) input keeps what the DOM holds.
      if (innerRef.current) innerRef.current.value = handle;
      setCurrent(handle);
      onChange?.({
        target: { name, value: handle },
        currentTarget: { name, value: handle },
        type: "change",
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    return (
      <div className="grid gap-1">
        <div
          className={cn(
            "flex h-10 w-full overflow-hidden rounded-md border border-input bg-background text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            invalid && "border-destructive focus-within:ring-destructive",
            className,
          )}
        >
          <span className="flex shrink-0 select-none items-center gap-1.5 border-r border-input bg-muted px-2.5 text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden />
            {socialDisplayPrefix(network)}
          </span>
          <input
            {...props}
            ref={setRefs}
            name={name}
            value={value}
            defaultValue={value === undefined ? defaultValue : undefined}
            type="text"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={invalid || undefined}
            aria-describedby={invalid && !hideHint ? hintId : undefined}
            placeholder={props.placeholder ?? "username"}
            className="min-w-0 flex-1 bg-transparent px-2.5 py-2 placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(event) => {
              setCurrent(event.target.value);
              onChange?.(event);
            }}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              if (extractHandle(network, pasted) !== pasted) {
                event.preventDefault();
                commit(pasted);
              }
            }}
            onBlur={(event) => {
              if (extractHandle(network, event.target.value) !== event.target.value) {
                commit(event.target.value);
              }
              onBlur?.(event);
            }}
          />
        </div>
        {invalid && !hideHint && (
          <p id={hintId} className="text-xs text-destructive">
            {HINTS[network]}
          </p>
        )}
      </div>
    );
  },
);
