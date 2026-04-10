import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NavBar from "../components/NavBar";
import SignOutButton from "../components/SignOutButton";
import baseStyles from "../page.module.css";
import RecentFeed from "../recent/recent-feed";
import { buildTopRows } from "@/lib/top100";
import styles from "./top-100.module.css";
import TopPodium from "./top-podium";

export const dynamic = "force-dynamic";

export default async function Top100Page() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { error, rows } = await buildTopRows(supabase, user.id, 50, 0);
  const podiumRows = rows.slice(0, 3);
  const feedRows = rows.slice(3);

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
            <span className={baseStyles.logoTag}>Top 50</span>
          </div>
          <SignOutButton className={baseStyles.headerSignOut} />
        </div>
        <NavBar active="top-100" />
        <div className={baseStyles.body}>
          <header className={baseStyles.header}>
            <h1 className={baseStyles.name}>Top 50</h1>
            <p className={baseStyles.note}>
              The most-liked captions ranked by likes. Ties keep their existing order so equal
              like counts do not jump around.
            </p>
          </header>
          <section className={baseStyles.content} aria-label="Top captions">
            {error ? (
              <div className={baseStyles.emptyState}>
                <p>Supabase error: {error.message}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className={baseStyles.emptyState}>
                <p>No top captions found yet.</p>
              </div>
            ) : (
              <>
                <TopPodium initialRows={podiumRows} />
                <div className={styles.podiumDivider} aria-hidden="true" />
                <RecentFeed
                  initialRows={feedRows}
                  initialHasMore={false}
                  initialOffset={feedRows.length}
                  pageSize={50}
                  sortMode="top"
                  showRank
                  baseRank={4}
                />
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
