import Image from "next/image";
import NavBar from "../components/NavBar";
import baseStyles from "../page.module.css";
import styles from "./profile.module.css";

export default function ProfilePage() {
  return (
    <div className={baseStyles.page}>
      <main className={baseStyles.main}>
        <NavBar active="profile" />
        <header className={baseStyles.header}>
          <div className={baseStyles.logoRow}>
            <Image
              className={baseStyles.logo}
              src="/next.svg"
              alt="Next.js logo"
              width={110}
              height={26}
              priority
            />
            <span className={baseStyles.logoTag}>Settings</span>
          </div>
          <h1 className={baseStyles.name}>Profile</h1>
          <p className={baseStyles.note}>
            Manage your account details and preferences.
          </p>
        </header>
        <section className={baseStyles.content} aria-label="Profile settings">
          <div className={styles.settingsGrid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Account</h2>
                <p className={styles.cardSubtitle}>
                  Core identity used across the app.
                </p>
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.settingName}>Display name</p>
                  <p className={styles.settingHint}>
                    Appears on your public profile.
                  </p>
                </div>
                <div className={styles.settingValue}>Kyle Won</div>
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.settingName}>Role</p>
                  <p className={styles.settingHint}>Current workspace access.</p>
                </div>
                <div className={styles.settingValue}>Student</div>
              </div>
            </div>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Contact</h2>
                <p className={styles.cardSubtitle}>
                  Where you receive notifications.
                </p>
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.settingName}>Email</p>
                  <p className={styles.settingHint}>
                    Used for account recovery.
                  </p>
                </div>
                <div className={styles.settingValue}>knw2135@columbia.edu</div>
              </div>
              <div className={styles.settingRow}>
                <div className={styles.settingLabel}>
                  <p className={styles.settingName}>Notifications</p>
                  <p className={styles.settingHint}>
                    Weekly bug report summary.
                  </p>
                </div>
                <div className={styles.settingValue}>Enabled</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
