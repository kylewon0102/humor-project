"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./images.module.css";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
];

type CaptionRecord = {
  id?: string;
  content?: string | null;
  created_datetime_utc?: string;
  [key: string]: unknown;
};

type PipelineResponse = {
  presignedUrl: string;
  cdnUrl: string;
};

type RegisterResponse = {
  imageId: string;
  now?: number;
};

const formatTimestamp = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

export default function ImageUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cdnUrl, setCdnUrl] = useState<string | null>(null);
  const [imageId, setImageId] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionRecord[]>([]);
  const [status, setStatus] = useState<
    "idle" | "presign" | "upload" | "register" | "captions" | "done"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const acceptValue = useMemo(() => ALLOWED_TYPES.join(","), []);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setErrorMessage(null);
    setCaptions([]);
    setCdnUrl(null);
    setImageId(null);
    if (!nextFile) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(nextFile.type)) {
      setFile(null);
      setErrorMessage("Unsupported file type. Choose a JPG, PNG, GIF, WEBP, or HEIC image.");
      return;
    }
    setFile(nextFile);
  };

  const handleUpload = async () => {
    if (!file) return;
    setErrorMessage(null);
    setCaptions([]);
    setCdnUrl(null);
    setImageId(null);

    try {
      setStatus("presign");
      const presignResponse = await fetch("/api/pipeline/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type }),
      });

      if (!presignResponse.ok) {
        const payload = (await presignResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to get upload URL.");
      }

      const presignPayload = (await presignResponse.json()) as PipelineResponse;
      if (!presignPayload?.presignedUrl || !presignPayload?.cdnUrl) {
        throw new Error("Upload URL response was incomplete.");
      }

      setStatus("upload");
      const uploadResponse = await fetch(presignPayload.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image bytes.");
      }

      setStatus("register");
      const registerResponse = await fetch("/api/pipeline/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: presignPayload.cdnUrl, isCommonUse: false }),
      });

      if (!registerResponse.ok) {
        const payload = (await registerResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to register image.");
      }

      const registerPayload = (await registerResponse.json()) as RegisterResponse;
      if (!registerPayload?.imageId) {
        throw new Error("Image registration response was incomplete.");
      }

      setCdnUrl(presignPayload.cdnUrl);
      setImageId(registerPayload.imageId);

      setStatus("captions");
      const captionResponse = await fetch("/api/pipeline/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: registerPayload.imageId }),
      });

      if (!captionResponse.ok) {
        const payload = (await captionResponse.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error ?? "Failed to generate captions.");
      }

      const captionPayload = (await captionResponse.json()) as CaptionRecord[];
      setCaptions(Array.isArray(captionPayload) ? captionPayload : []);
      setStatus("done");
    } catch (error) {
      setStatus("idle");
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    }
  };

  const isBusy = status !== "idle" && status !== "done";

  return (
    <div className={styles.uploaderGrid}>
      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Upload an image</h2>
        <p className={styles.panelSubtitle}>
          Choose a supported image file to generate captions using the pipeline API.
        </p>
        <div className={styles.fieldRow}>
          <label className={styles.fieldLabel} htmlFor="imageUpload">
            Image file
          </label>
          <input
            id="imageUpload"
            className={styles.fileInput}
            type="file"
            accept={acceptValue}
            onChange={handleFileChange}
          />
          <p className={styles.helperText}>
            Supported: JPG, PNG, WEBP, GIF, HEIC.
          </p>
        </div>
        <div className={styles.actionRow}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={handleUpload}
            disabled={!file || isBusy}
          >
            {isBusy ? "Working..." : "Generate captions"}
          </button>
          <div className={styles.statusBlock}>
            <span className={styles.statusLabel}>Status</span>
            <span className={styles.statusValue}>
              {status === "idle" && "Waiting"}
              {status === "presign" && "Generating upload URL"}
              {status === "upload" && "Uploading image"}
              {status === "register" && "Registering image"}
              {status === "captions" && "Generating captions"}
              {status === "done" && "Complete"}
            </span>
          </div>
        </div>
        {errorMessage ? (
          <div className={styles.errorBox} role="alert">
            {errorMessage}
          </div>
        ) : null}
        {cdnUrl ? (
          <div className={styles.metaRow}>
            <div>
              <span className={styles.metaLabel}>CDN URL</span>
              <span className={styles.metaValue}>{cdnUrl}</span>
            </div>
            {imageId ? (
              <div>
                <span className={styles.metaLabel}>Image ID</span>
                <span className={styles.metaValue}>{imageId}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className={styles.panel}>
        <h2 className={styles.panelTitle}>Preview & captions</h2>
        <p className={styles.panelSubtitle}>
          We will show the uploaded image and the captions returned by the API.
        </p>
        {previewUrl ? (
          <div className={styles.previewFrame}>
            <img className={styles.previewImage} src={previewUrl} alt="Preview" />
          </div>
        ) : (
          <div className={styles.placeholderBox}>No image selected yet.</div>
        )}
        <div className={styles.captionList}>
          {captions.length === 0 ? (
            <p className={styles.placeholderText}>
              Captions will appear here after upload.
            </p>
          ) : (
            captions.map((caption, index) => (
              <div key={caption.id ?? `${index}`} className={styles.captionCard}>
                <p className={styles.captionText}>
                  {caption.content?.toString().trim() || "Untitled caption"}
                </p>
                {caption.created_datetime_utc ? (
                  <p className={styles.captionMeta}>
                    {formatTimestamp(String(caption.created_datetime_utc))}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
