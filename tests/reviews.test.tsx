// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import Reviews from "../src/components/Reviews";

afterEach(() => cleanup());

describe("client reviews", () => {
  it("renders all supplied client reviews without placeholders", () => {
    const { container } = render(<Reviews />);

    expect(screen.getByRole("heading", { name: "Experiences, in their own words" })).toBeTruthy();
    for (const name of [
      "Achala Bhatia",
      "Meenu",
      "Poonam Thakkar",
      "Rita Arora",
      "Chaitali",
      "Kavitha Anilkumar",
      "Saroj Khokhar",
      "Naresh Sharma",
      "Prashant Raibagkar",
    ]) {
      expect(screen.getAllByText(name)).toHaveLength(2);
    }
    expect(
      container.querySelectorAll('.reviews__group:not([aria-hidden="true"]) .review-card__placeholder'),
    ).toHaveLength(0);
    expect(container.querySelectorAll(".review-card__consultation")).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /Read the full review from/ })).toHaveLength(9);
  });

  it("opens a full review dialog, pauses the strip and closes with Escape", async () => {
    const user = userEvent.setup();
    const { container } = render(<Reviews />);
    const trigger = screen.getByRole("button", {
      name: "Read the full review from Achala Bhatia",
    });

    await user.click(trigger);

    expect(screen.getByRole("dialog", { name: "Achala Bhatia" })).toBeTruthy();
    expect(screen.queryByText("Client review")).toBeNull();
    expect(screen.getByText(/Her reading and prediction is very much accurate/)).toBeTruthy();
    expect(container.querySelector(".reviews__viewport--paused")).toBeTruthy();
    expect(document.body.style.overflow).toBe("hidden");

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.querySelector(".reviews__viewport--paused")).toBeNull();
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(trigger);
  });

  it("closes when the shaded backdrop is selected", async () => {
    const user = userEvent.setup();
    const { container } = render(<Reviews />);

    await user.click(
      screen.getByRole("button", { name: "Read the full review from Rita Arora" }),
    );

    const backdrop = container.querySelector<HTMLElement>(".review-dialog__backdrop");
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
