import Link from "next/link";
import styles from "./NavBar.module.css";

type NavBarProps = {
  active: "captions" | "helloworld" | "auth";
};

export default function NavBar({ active }: NavBarProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.brand}>Humor Project</div>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Weeks</p>
        <Link
          className={`${styles.link} ${active === "helloworld" ? styles.active : ""}`}
          href="/helloworld"
          aria-current={active === "helloworld" ? "page" : undefined}
        >
          Week 1: Hello World
        </Link>
        <Link
          className={`${styles.link} ${active === "captions" ? styles.active : ""}`}
          href="/captions"
          aria-current={active === "captions" ? "page" : undefined}
        >
          Week 2: Captions
        </Link>
        <Link
          className={`${styles.link} ${active === "auth" ? styles.active : ""}`}
          href="/week3-auth"
          aria-current={active === "auth" ? "page" : undefined}
        >
          Week 3: Auth
        </Link>
      </div>
    </nav>
  );
}
