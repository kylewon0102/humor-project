import { createBrowserClient } from "@supabase/ssr";

const getClientEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const createSupabaseBrowserClient = () =>
  createBrowserClient(
    getClientEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getClientEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
