"use client";

import { useState } from "react";
import baseStyles from "../page.module.css";
import styles from "./recent.module.css";

type RecentRow = {
  id: string;
  content: string | null;
  created_datetime_utc: string;
  imageId: string | null;
  imageUrl: string | null;
  imageAlt: string;
  imageStatus: "ok" | "missing_image_row" | "missing_image_url";
  likeCount: number;
  userVote: number;
};

type RecentFeedProps = {
  initialRows: RecentRow[];
  initialHasMore: boolean;
  initialOffset: number;
  pageSize: number;
  loadMorePath?: string;
  sortMode?: "recent" | "top";
  showRank?: boolean;
  baseRank?: number;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString();
};

export default function RecentFeed({
  initialRows,
  initialHasMore,
  initialOffset,
  pageSize,
  loadMorePath = "/api/recent",
  sortMode = "recent",
  showRank = false,
  baseRank = 1,
}: RecentFeedProps) {
  const [rows, setRows] = useState<RecentRow[]>(initialRows);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingVotes, setPendingVotes] = useState<Record<string, boolean>>({});

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${loadMorePath}?offset=${offset}&limit=${pageSize}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error("Failed to load more captions.");
      }

      const payload = (await response.json()) as {
        rows: RecentRow[];
        hasMore: boolean;
        nextOffset: number;
      };

      setRows((prev) => [...prev, ...payload.rows]);
      setHasMore(payload.hasMore);
      setOffset(payload.nextOffset);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load more captions.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (captionId: string, voteValue: number) => {
    if (pendingVotes[captionId]) return;
    const targetRow = rows.find((row) => row.id === captionId);
    if (!targetRow) return;

    const currentVote = targetRow.userVote;
    const nextVote = currentVote === voteValue ? 0 : voteValue;
    const delta = nextVote - currentVote;

    setPendingVotes((prev) => ({ ...prev, [captionId]: true }));
    setRows((prev) =>
      prev.map((row) =>
        row.id === captionId
          ? { ...row, likeCount: row.likeCount + delta, userVote: nextVote }
          : row,
      ),
    );
    setErrorMessage("");

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captionId, voteValue: nextVote }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit vote.");
      }

      const payload = (await response.json()) as {
        likeCount: number;
        userVote: number;
      };
      setRows((prev) =>
        prev.map((row) =>
          row.id === captionId
            ? { ...row, likeCount: payload.likeCount, userVote: payload.userVote }
            : row,
        ),
      );
    } catch (error) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === captionId
            ? { ...row, likeCount: targetRow.likeCount, userVote: currentVote }
            : row,
        ),
      );
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to submit vote.",
      );
    } finally {
      setPendingVotes((prev) => ({ ...prev, [captionId]: false }));
    }
  };

  const sortedRows = [...rows].sort((a, b) => {
    if (sortMode === "top") {
      const likeDiff = (b.likeCount ?? 0) - (a.likeCount ?? 0);
      if (likeDiff !== 0) return likeDiff;
    }
    const timeDiff =
      new Date(b.created_datetime_utc).getTime() -
      new Date(a.created_datetime_utc).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });

  return (
    <>
      <div className={styles.grid}>
        {sortedRows.map((row, index) => {
          const caption = row.content?.trim() || "Untitled caption";
          const imageUrl = row.imageUrl ?? "";
          const imageAlt = row.imageAlt || "Caption image";
          const isPending = Boolean(pendingVotes[row.id]);
          const upActive = row.userVote === 1;
          const downActive = row.userVote === -1;
          const rank = baseRank + index;
          return (
            <article key={row.id} className={styles.card}>
              {imageUrl ? (
                <img
                  className={styles.cardImage}
                  src={imageUrl}
                  alt={imageAlt}
                  loading="lazy"
                />
              ) : null}
              <div className={styles.cardBody}>
                {showRank ? (
                  <span className={styles.rankBadge}>#{rank}</span>
                ) : null}
                <p className={styles.caption}>{caption}</p>
                <p className={styles.meta}>
                  {formatDate(row.created_datetime_utc)}
                </p>
                <div className={styles.voteRow}>
                  <button
                    className={`${styles.voteButton} ${upActive ? styles.voteActive : ""}`}
                    type="button"
                    onClick={() => handleVote(row.id, 1)}
                    disabled={isPending}
                    aria-label="Upvote caption"
                    aria-pressed={upActive}
                  >
                    ▲
                  </button>
                  <span className={styles.voteCount}>{row.likeCount}</span>
                  <button
                    className={`${styles.voteButton} ${downActive ? styles.voteActive : ""}`}
                    type="button"
                    onClick={() => handleVote(row.id, -1)}
                    disabled={isPending}
                    aria-label="Downvote caption"
                    aria-pressed={downActive}
                  >
                    ▼
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {errorMessage ? (
        <div className={baseStyles.emptyState}>
          <p>{errorMessage}</p>
        </div>
      ) : null}
      {hasMore ? (
        <div className={baseStyles.pagination} aria-label="Load more">
          <button
            className={baseStyles.pageButton}
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </>
  );
}
