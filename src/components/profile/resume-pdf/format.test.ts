import { describe, expect, it } from "vitest";
import { groupExperiences } from "./format";

const exp = (company: string, location = "Berlin") => ({ company, location });

describe("groupExperiences", () => {
  it("keeps a single entry as one group with one role", () => {
    const groups = groupExperiences([exp("Acme")]);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ company: "Acme", location: "Berlin" });
    expect(groups[0].roles.map((r) => r.index)).toEqual([0]);
  });

  it("groups back-to-back roles at the same company, ignoring case and spaces", () => {
    const groups = groupExperiences([exp("Acme"), exp(" acme "), exp("Globex")]);
    expect(groups.map((g) => g.company)).toEqual(["Acme", "Globex"]);
    expect(groups[0].roles.map((r) => r.index)).toEqual([0, 1]);
    expect(groups[1].roles.map((r) => r.index)).toEqual([2]);
  });

  it("does not group the same company when another job sits between", () => {
    const groups = groupExperiences([exp("Acme"), exp("Globex"), exp("Acme")]);
    expect(groups).toHaveLength(3);
  });

  it("never groups entries without a company", () => {
    const groups = groupExperiences([exp(""), exp("")]);
    expect(groups).toHaveLength(2);
  });

  it("clears the shared location when roles differ", () => {
    const groups = groupExperiences([exp("Acme", "Berlin"), exp("Acme", "Paris")]);
    expect(groups[0].location).toBe("");
  });
});
