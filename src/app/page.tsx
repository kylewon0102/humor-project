import Image from "next/image";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.logoRow}>
            <Image
              className={styles.logo}
              src="/next.svg"
              alt="Next.js logo"
              width={110}
              height={26}
              priority
            />
            <span className={styles.logoTag}>Profile</span>
          </div>
          <h1 className={styles.name}>Kyle Won</h1>
          <a className={styles.email} href="mailto:knw2135@columbia.edu">
            knw2135@columbia.edu
          </a>
        </header>
        <section className={styles.content} aria-label="Profile content">
          <p className={styles.note}>This is a temporary page for week 1.</p>
          <div className={styles.emptyState}>
            <p>Hello World!</p>
          </div>
        </section>
      </main>
    </div>
  );
}
