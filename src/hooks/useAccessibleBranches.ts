import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Branch } from "../types/branches";

export function useAccessibleBranches() {
  const { token } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchAccessible = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        const res = await fetch(`${baseUrl}/api/branches/access`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setBranches(data.data || []);
      } catch {
        /* ignore network failures for branch metadata */
      }
    };

    fetchAccessible();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return { branches };
}