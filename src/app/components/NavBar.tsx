import Link from "next/link";
import styles from "./NavBar.module.css";

type NavBarProps = {
  active: "bugs" | "profile";
};

export default function NavBar({ active }: NavBarProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.brand}>Humor Project</div>
      <div className={styles.links}>
        <Link
          className={`${styles.link} ${active === "bugs" ? styles.active : ""}`}
          href="/"
          aria-current={active === "bugs" ? "page" : undefined}
        >
          Captions
        </Link>
        <Link
          className={`${styles.link} ${active === "profile" ? styles.active : ""}`}
          href="/profile"
          aria-current={active === "profile" ? "page" : undefined}
        >
          Profile
        </Link>
      </div>
    </nav>
  );
}
