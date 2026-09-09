/**
 * 客户端中间件：给所有服务端函数调用带上当前登录用户的令牌。
 */
import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });
  },
);
