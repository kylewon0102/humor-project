import Image from "next/image";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import NavBar from "../components/NavBar";
import SignOutButton from "../components/SignOutButton";
import baseStyles from "../page.module.css";

export const dynamic = "force-dynamic";

export default async function ImagesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

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
            <span className={baseStyles.logoTag}>Images</span>
          </div>
          <SignOutButton className={baseStyles.headerSignOut} />
        </div>
        <NavBar active="images" />
        <div className={baseStyles.body}>
          <header className={baseStyles.header}>
            <h1 className={baseStyles.name}>Images</h1>
            <p className={baseStyles.note}>
              Browse the images tied to your captions.
            </p>
          </header>
          <section className={baseStyles.content} aria-label="Images">
            <div className={baseStyles.emptyState}>
              <p>Image browsing is coming next.</p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
