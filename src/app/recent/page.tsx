import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NavBar from "../components/NavBar";
import SignOutButton from "../components/SignOutButton";
import baseStyles from "../page.module.css";
import RecentFeed from "./recent-feed";
import { buildRecentRows } from "@/lib/recent";

export const dynamic = "force-dynamic";

const RECENT_LIMIT = 24;

export default async function RecentPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { error, rows, hasMore, nextOffset } = await buildRecentRows(
    supabase,
    user.id,
    RECENT_LIMIT,
    0,
  );

  return (
    <div className={baseStyles.page}>
      <main className={baseStyles.main}>
        <div className={baseStyles.logoRow}>
          <div className={baseStyles.logoGroup}>
            <Image
              className={baseStyles.logo}
              src="/columbia-logo.png"
              alt="Columbia University logo"
              width={110}
              height={110}
              priority
            />
            <span className={baseStyles.logoTag}>Recent</span>
          </div>
          <SignOutButton className={baseStyles.headerSignOut} />
        </div>
        <NavBar active="recent" />
        <div className={baseStyles.body}>
          <header className={baseStyles.header}>
            <h1 className={baseStyles.name}>Recent captions</h1>
            <p className={baseStyles.note}>
              Latest captions paired with their images.
            </p>
          </header>
          <section className={baseStyles.content} aria-label="Recent captions">
            {error ? (
              <div className={baseStyles.emptyState}>
                <p>Supabase error: {error.message}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className={baseStyles.emptyState}>
                <p>No recent captions found yet.</p>
              </div>
            ) : (
              <RecentFeed
                initialRows={rows}
                initialHasMore={hasMore}
                initialOffset={nextOffset}
                pageSize={RECENT_LIMIT}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
