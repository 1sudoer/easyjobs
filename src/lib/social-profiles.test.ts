// @vitest-environment node
import { test, expect } from "vitest";
import { extractHandle, isValidHandle, socialProfile } from "@/lib/social-profiles";

test.each([
  ["linkedin", "jordantaylor", "jordantaylor"],
  ["linkedin", "@jordantaylor", "jordantaylor"],
  ["linkedin", "linkedin.com/in/jordantaylor", "jordantaylor"],
  ["linkedin", "https://www.linkedin.com/in/jordan-taylor-9a1b2c/", "jordan-taylor-9a1b2c"],
  ["linkedin", "https://uk.linkedin.com/in/jordantaylor?utm_source=share", "jordantaylor"],
  ["linkedin", "HTTPS://WWW.LinkedIn.com/in/JordanT/details/experience/", "JordanT"],
  ["linkedin", "https://www.linkedin.com/in/%E5%BC%A0%E4%BC%9F-123", "张伟-123"],
  ["linkedin", "  ", ""],
  ["github", "jtaylor", "jtaylor"],
  ["github", "https://github.com/jtaylor", "jtaylor"],
  ["github", "github.com/jtaylor/opentrack", "jtaylor"],
  ["github", "www.github.com/jtaylor?tab=repositories", "jtaylor"],
  ["github", "@jtaylor", "jtaylor"],
] as const)("%s %j -> %j", (network, input, handle) => {
  expect(extractHandle(network, input)).toBe(handle);
});

test("text that is not a profile URL is kept whole, so it fails validation", () => {
  expect(extractHandle("github", "bad name!")).toBe("bad name!");
  expect(isValidHandle("github", extractHandle("github", "bad name!"))).toBe(false);
  expect(extractHandle("linkedin", "example.com/in/someone")).toBe("example.com/in/someone");
});

test("validation and display", () => {
  expect(isValidHandle("github", "j-taylor")).toBe(true);
  expect(isValidHandle("github", "-bad")).toBe(false);
  expect(isValidHandle("github", "a--b")).toBe(false);
  expect(isValidHandle("linkedin", "ab")).toBe(false);
  expect(isValidHandle("linkedin", "张伟-123")).toBe(true);
  expect(isValidHandle("linkedin", "https:")).toBe(false);
  expect(socialProfile("linkedin", "https://www.linkedin.com/in/jordantaylor/")).toEqual({
    label: "linkedin.com/in/jordantaylor",
    href: "https://www.linkedin.com/in/jordantaylor",
  });
  expect(socialProfile("github", "jtaylor")?.label).toBe("github.com/jtaylor");
  expect(socialProfile("github", "")).toBeNull();
});

test("a stored value that is not a handle is shown as written, not glued onto the prefix", () => {
  expect(socialProfile("linkedin", "https://www.linkedin.com/wattmood")).toEqual({
    label: "linkedin.com/wattmood",
    href: "https://www.linkedin.com/wattmood",
  });
  expect(socialProfile("linkedin", "linkedin.com/company/acme")).toEqual({
    label: "linkedin.com/company/acme",
    href: "https://linkedin.com/company/acme",
  });
  expect(socialProfile("github", "not a handle")).toEqual({ label: "not a handle", href: undefined });
});
