import { useEffect, useState } from "react";
import { mailApi } from "../api/mail";
import type { Folder } from "../types";

export function useFolders(accountId: string | null) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setFolders([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    mailApi
      .folders(accountId)
      .then((data) => {
        if (!cancelled) setFolders(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load folders");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return { folders, loading, error };
}
