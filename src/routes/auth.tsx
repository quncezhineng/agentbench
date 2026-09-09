import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter, SiteHeader } from "@/components/agentbench/SiteShell";

const TITLE = "登录 · AgentBench 智衡";
const DESC = "登录 AgentBench 智衡，管理员可在此进入评测提交的审核后台。";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const field =
  "w-full rounded-lg border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-brand";

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/admin/review" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin/review` },
        });
        if (error) throw error;
        setMsg("注册成功，可以直接登录。");
        setMode("signin");
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "操作失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader navs={[]} />
      <main className="mx-auto w-full max-w-md px-4 py-14">
        <h1 className="mb-1 text-[22px] font-bold">{mode === "signin" ? "登录" : "注册"}</h1>
        <p className="mb-5 text-[13px] text-text-3">
          管理员登录后可以进入审核后台，处理访客提交的评测结果。
        </p>
        <form onSubmit={onSubmit} className="ab-panel space-y-3 bg-white p-5">
          <div>
            <label
              className="mb-1 block text-[11.5px] font-semibold text-text-2"
              htmlFor="au-email"
            >
              邮箱
            </label>
            <input
              id="au-email"
              className={field}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[11.5px] font-semibold text-text-2" htmlFor="au-pass">
              密码
            </label>
            <input
              id="au-pass"
              className={field}
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-brand px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "处理中…" : mode === "signin" ? "登录" : "注册"}
          </button>
          <button
            type="button"
            className="w-full text-[12px] text-text-3 underline"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "还没有账号？去注册" : "已有账号？去登录"}
          </button>
          {msg && (
            <p className="text-[12.5px] text-danger" role="status">
              {msg}
            </p>
          )}
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
