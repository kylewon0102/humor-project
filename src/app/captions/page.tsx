import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import NavBar from "../components/NavBar";
import SignOutButton from "../components/SignOutButton";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const formatValue = (value: unknown) => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const parsePage = (pageParam?: string | string[]) => {
  const value = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.floor(parsed);
};

export default async function Home({ searchParams }: PageProps) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const page = parsePage(resolvedSearchParams?.page);
  const rangeStart = (page - 1) * PAGE_SIZE;
  const rangeEnd = rangeStart + PAGE_SIZE - 1;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <NavBar active="captions" />
          <div className={styles.body}>
            <section className={styles.content}>
              <h1 className={styles.name}>Captions</h1>
              <div className={styles.emptyState}>
                <p>Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file.</p>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  const { data, error, count } = await supabase
    .from("captions")
    .select("*", { count: "exact" })
    .order("created_datetime_utc", { ascending: false })
    .order("id", { ascending: false })
    .range(rangeStart, rangeEnd);
  const rows = data ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const totalRows = count ?? 0;
  const totalPages = totalRows ? Math.max(1, Math.ceil(totalRows / PAGE_SIZE)) : 1;
  const nextPage = page + 1;
  const prevPage = page - 1;
  const hasPrev = page > 1;
  const hasNext = totalRows ? page < totalPages : rows.length === PAGE_SIZE;

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <NavBar active="captions" />
        <div className={styles.body}>
          <header className={styles.header}>
            <div className={styles.logoRow}>
              <div className={styles.logoGroup}>
                <Image
                  className={styles.logo}
                  src="/columbia-logo.png"
                  alt="Columbia University logo"
                  width={96}
                  height={96}
                  priority
                />
                <span className={styles.logoTag}> Week 2 </span>
              </div>
              <SignOutButton className={styles.headerSignOut} />
            </div>
            <h1 className={styles.name}>Captions</h1>
            <p className={styles.note}>
              Showing {rows.length} of {totalRows} captions (page {page} of{" "}
              {totalPages}).
            </p>
          </header>
          <section className={styles.content} aria-label="Caption list">
            {!error && rows.length > 0 ? (
              <div className={styles.pagination} aria-label="Pagination top">
                <a
                  className={`${styles.pageButton} ${
                    hasPrev ? "" : styles.pageDisabled
                  }`}
                  href={hasPrev ? `/?page=${prevPage}` : undefined}
                  aria-disabled={!hasPrev}
                >
                  Previous
                </a>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <a
                  className={`${styles.pageButton} ${
                    hasNext ? "" : styles.pageDisabled
                  }`}
                  href={hasNext ? `/?page=${nextPage}` : undefined}
                  aria-disabled={!hasNext}
                >
                  Next
                </a>
              </div>
            ) : null}
            {error ? (
              <div className={styles.emptyState}>
                <p>Supabase error: {error.message}</p>
              </div>
            ) : rows.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No captions found yet.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column}
                          className={
                            column === "id"
                              ? styles.colId
                              : column === "content"
                                ? styles.colContent
                                : column === "is_public"
                                  ? styles.colIsPublic
                                  : [
                                        "humor_flavor_id",
                                        "is_featured",
                                        "caption_request_id",
                                        "like_count",
                                        "llm_prompt_chain_id",
                                    ].includes(column)
                                    ? styles.colCompact
                                    : undefined
                          }
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {columns.map((column) => (
                          <td
                            key={`${rowIndex}-${column}`}
                            className={
                              column === "id"
                                ? styles.colId
                                : column === "content"
                                  ? styles.colContent
                                  : column === "is_public"
                                    ? styles.colIsPublic
                                    : [
                                          "humor_flavor_id",
                                          "is_featured",
                                          "caption_request_id",
                                          "like_count",
                                          "llm_prompt_chain_id",
                                      ].includes(column)
                                      ? styles.colCompact
                                      : undefined
                            }
                          >
                            {formatValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!error && rows.length > 0 ? (
              <div className={styles.pagination} aria-label="Pagination bottom">
                <a
                  className={`${styles.pageButton} ${
                    hasPrev ? "" : styles.pageDisabled
                  }`}
                  href={hasPrev ? `/?page=${prevPage}` : undefined}
                  aria-disabled={!hasPrev}
                >
                  Previous
                </a>
                <span className={styles.pageInfo}>
                  Page {page} of {totalPages}
                </span>
                <a
                  className={`${styles.pageButton} ${
                    hasNext ? "" : styles.pageDisabled
                  }`}
                  href={hasNext ? `/?page=${nextPage}` : undefined}
                  aria-disabled={!hasNext}
                >
                  Next
                </a>
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </div>
  );
}
