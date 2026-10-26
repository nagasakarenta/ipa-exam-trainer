import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { STORAGE_KEY } from "./lib/storage";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    window.location.hash = "";
  });

  it("ホームに2つの試験が並ぶ", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "ホーム" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ITパスポート試験" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基本情報技術者試験" })).toBeInTheDocument();
  });

  it("ドリルで1問解くと、解説が出て学習データが保存される", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "分野別ドリル" }));
    await user.click(screen.getByRole("button", { name: "開始" }));

    // 選択肢を1つ選ぶ
    const choices = document.querySelectorAll<HTMLButtonElement>(".choice");
    expect(choices.length).toBeGreaterThanOrEqual(4);
    await user.click(choices[0]);

    const feedback = document.querySelector(".feedback");
    expect(feedback).not.toBeNull();
    expect(within(feedback as HTMLElement).getByText(/正解/)).toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(saved.attempts).toHaveLength(1);
    expect(Object.keys(saved.cards)).toHaveLength(1);
  });

  it("復習の件数が、間違えた問題を解いたあとに増える", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("link", { name: "分野別ドリル" }));
    await user.click(screen.getByRole("button", { name: "開始" }));
    // 正解でも不正解でも 1 枚はカードになる。不正解なら当日中に復習が必要になる
    const choices = [...document.querySelectorAll<HTMLButtonElement>(".choice")];
    await user.click(choices[0]);
    const wrong = document.querySelector(".feedback.ng") !== null;
    const badge = screen.getByRole("link", { name: /復習/ }).querySelector(".badge");
    if (wrong) expect(badge?.textContent).toBe("1");
    else expect(badge).toBeNull();
  });
});
