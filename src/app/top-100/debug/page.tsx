import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NavBar from "../../components/NavBar";
import baseStyles from "../../page.module.css";
import { buildTopRows } from "@/lib/top100";

export const dynamic = "force-dynamic";

export default async function Top100DebugPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { error, rows } = await buildTopRows(supabase, user.id, 50, 0);

  return (
    <div className={baseStyles.page}>
      <main className={baseStyles.main}>
        <NavBar active="top-100" />
        <div className={baseStyles.body}>
          <header className={baseStyles.header}>
            <h1 className={baseStyles.name}>Top 50 Debug</h1>
            <p className={baseStyles.note}>Raw results from buildTopRows.</p>
          </header>
          <section className={baseStyles.content} aria-label="Top 50 debug">
            {error ? (
              <div className={baseStyles.emptyState}>
                <p>Supabase error: {error.message}</p>
              </div>
            ) : (
              <pre>{JSON.stringify(rows, null, 2)}</pre>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
