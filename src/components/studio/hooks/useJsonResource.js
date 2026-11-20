"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../api";

/**
 * Loads JSON from `url`, again whenever `url` or `reloadKey` changes.
 *
 * A newer request aborts the older one, so a slow response can never replace
 * a newer one. State is only set when a response arrives (not synchronously
 * in the effect). While a request is in flight `loading` is true and `data`
 * keeps the previous result.
 */
export function useJsonResource(url, { reloadKey = 0, errorMessage = "Failed to load." } = {}) {
  const requestKey = `${url}#${reloadKey}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    apiFetch(url, { signal: controller.signal, fallbackMessage: errorMessage })
      .then((data) => setResult({ key: requestKey, data, error: null }))
      .catch((err) => {
        if (err.name === "AbortError") return;
        setResult((prev) => ({ key: requestKey, data: prev.data, error: err.message }));
      });
    return () => controller.abort();
  }, [url, requestKey, errorMessage]);

  const current = result.key === requestKey;
  return {
    data: result.data,
    loading: !current,
    error: current ? result.error : null,
  };
}
