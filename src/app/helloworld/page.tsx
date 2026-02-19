import Image from "next/image";
import NavBar from "../components/NavBar";
import SignOutButton from "../components/SignOutButton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import baseStyles from "../page.module.css";
import styles from "./profile.module.css";

export default async function HelloWorldPage() {
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
            <span className={baseStyles.logoTag}>Week 1</span>
          </div>
          <SignOutButton className={baseStyles.headerSignOut} />
        </div>
        <NavBar />
        <div className={baseStyles.body}>
          <header className={baseStyles.header}>
            <h1 className={baseStyles.name}>Hello World</h1>
            <p className={baseStyles.note}>
              A simple intro with my name and basic info.
            </p>
          </header>
          <section className={baseStyles.content} aria-label="Week 1 hello world">
            <div className={styles.introGrid}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Kyle Won</h2>
                <p className={styles.cardSubtitle}>Columbia University</p>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Role</span>
                  <span className={styles.infoValue}>Student</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>
                    {user.email ?? "Signed in"}
                  </span>
                </div>
              </div>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Hello World</h2>
                <p className={styles.cardSubtitle}>
                  Welcome to the Humor Project.
                </p>
                <p className={styles.helloText}>
                  Hello world! This is my first week assignment, showing my
                  name, basic info, and a simple greeting.
                </p>
                <div className={styles.signOutRow}>
                  <SignOutButton className={styles.signOutButton} />
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
