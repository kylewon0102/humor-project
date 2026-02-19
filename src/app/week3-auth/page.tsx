import Image from "next/image";
import NavBar from "../components/NavBar";
import SignOutButton from "../components/SignOutButton";
import baseStyles from "../page.module.css";

export default function Week3AuthPage() {
  return (
    <div className={baseStyles.page}>
      <main className={baseStyles.main}>
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
            <span className={baseStyles.logoTag}>Week 3</span>
          </div>
          <SignOutButton className={baseStyles.headerSignOut} />
        </div>
        <NavBar />
        <div className={baseStyles.body}>
          <header className={baseStyles.header}>
            <h1 className={baseStyles.name}>Auth</h1>
            <p className={baseStyles.note}>Auth is done.</p>
          </header>
        </div>
      </main>
    </div>
  );
}
