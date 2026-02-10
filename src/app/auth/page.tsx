import Image from "next/image";
import SignInButton from "../components/SignInButton";
import baseStyles from "../page.module.css";
import styles from "../helloworld/profile.module.css";

export default function AuthPage() {
  return (
    <div className={baseStyles.page}>
      <main className={baseStyles.main}>
        <div className={baseStyles.body}>
          <header className={baseStyles.header}>
            <div className={baseStyles.logoRow}>
              <div className={baseStyles.logoGroup}>
                <Image
                  className={baseStyles.logo}
                  src="/columbia-logo.png"
                  alt="Columbia University logo"
                  width={96}
                  height={96}
                  priority
                />
                <span className={baseStyles.logoTag}>Auth</span>
              </div>
            </div>
            <h1 className={baseStyles.name}>Sign in</h1>
            <p className={baseStyles.note}>
              Connect with Google to access this website.
            </p>
          </header>
          <section className={baseStyles.content} aria-label="Sign in">
            <div className={styles.authCard}>
              <p className={styles.authText}>
                You must be signed in to access this website.
              </p>
              <SignInButton className={styles.authButton} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
