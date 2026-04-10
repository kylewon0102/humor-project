"use client";

import { useState } from "react";
import styles from "./top-100.module.css";

type PodiumRow = {
  id: string;
  content: string | null;
  imageUrl: string | null;
  imageAlt: string;
  likeCount: number;
  userVote: number;
};

type TopPodiumProps = {
  initialRows: PodiumRow[];
};

export default function TopPodium({ initialRows }: TopPodiumProps) {
  const [rows, setRows] = useState(initialRows);
  const [pendingVotes, setPendingVotes] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState("");

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

  const orderedRows = [...rows].sort((a, b) => {
    const likeDiff = b.likeCount - a.likeCount;
    if (likeDiff !== 0) return likeDiff;
    return initialRows.findIndex((row) => row.id === a.id) - initialRows.findIndex((row) => row.id === b.id);
  });

  return (
    <div className={styles.podiumWrap}>
      <div className={styles.podiumLabel}>Podium</div>
      <div className={styles.podium} aria-label="Top three podium">
        {orderedRows.map((row, index) => {
          const isPending = Boolean(pendingVotes[row.id]);
          const upActive = row.userVote === 1;
          const downActive = row.userVote === -1;

          return (
            <article
              key={row.id}
              className={`${styles.podiumCard} ${
                index === 0
                  ? styles.podiumFirst
                  : index === 1
                    ? styles.podiumSecond
                    : styles.podiumThird
              }`}
            >
              <div className={styles.podiumHeader}>
                <span className={styles.podiumRank}>#{index + 1}</span>
                <span className={styles.podiumScore}>{row.likeCount} likes</span>
              </div>
              {row.imageUrl ? (
                <img
                  className={styles.podiumImage}
                  src={row.imageUrl}
                  alt={row.imageAlt || "Caption image"}
                  loading="lazy"
                />
              ) : null}
              <div className={styles.podiumBody}>
                <p className={styles.podiumCaption}>
                  {row.content?.trim() || "Untitled caption"}
                </p>
                <div className={styles.podiumVotes}>
                  <button
                    className={`${styles.podiumVoteButton} ${upActive ? styles.podiumVoteActive : ""}`}
                    type="button"
                    onClick={() => handleVote(row.id, 1)}
                    disabled={isPending}
                    aria-label="Like caption"
                    aria-pressed={upActive}
                  >
                    Like
                  </button>
                  <button
                    className={`${styles.podiumVoteButton} ${downActive ? styles.podiumVoteActive : ""}`}
                    type="button"
                    onClick={() => handleVote(row.id, -1)}
                    disabled={isPending}
                    aria-label="Dislike caption"
                    aria-pressed={downActive}
                  >
                    Dislike
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {errorMessage ? <p className={styles.podiumError}>{errorMessage}</p> : null}
    </div>
  );
}
