import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.name}>Kyle Won</h1>
          <a className={styles.email} href="mailto:knw2135@columbia.edu">
            knw2135@columbia.edu
          </a>
        </header>
        <section className={styles.content} aria-label="Profile content" />
      </main>
    </div>
  );
}
