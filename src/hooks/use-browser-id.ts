"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "highland_browser_id";

export function useBrowserId(): string | null {
  const [browserId, setBrowserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setBrowserId(id);
  }, []);

  return browserId;
}
