import { useState, useEffect, useCallback } from "react";

type Status = "idle" | "loading" | "success" | "error";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(() => {
    setStatus("loading");
    setError(null);
    fn()
      .then((result) => {
        setData(result);
        setStatus("success");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
        setStatus("error");
      });
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, status, error, retry: run };
}
