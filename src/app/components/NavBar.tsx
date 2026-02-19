import Link from "next/link";
import styles from "./NavBar.module.css";

type NavBarProps = {
  active?: "recent" | "top-100" | "favorites" | "images";
};

export default function NavBar({ active }: NavBarProps) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      <div className={styles.brand}>Humor Project</div>
      <div className={styles.links}>
        <Link
          className={`${styles.link} ${active === "recent" ? styles.active : ""}`}
          href="/recent"
          aria-current={active === "recent" ? "page" : undefined}
        >
          Recent
        </Link>
        <Link
          className={`${styles.link} ${active === "top-100" ? styles.active : ""}`}
          href="/top-100"
          aria-current={active === "top-100" ? "page" : undefined}
        >
          Top 50
        </Link>
        <Link
          className={`${styles.link} ${active === "favorites" ? styles.active : ""}`}
          href="/favorites"
          aria-current={active === "favorites" ? "page" : undefined}
        >
          Favorites
        </Link>
        <Link
          className={`${styles.link} ${active === "images" ? styles.active : ""}`}
          href="/images"
          aria-current={active === "images" ? "page" : undefined}
        >
          Images
        </Link>
      </div>
    </nav>
  );
}
