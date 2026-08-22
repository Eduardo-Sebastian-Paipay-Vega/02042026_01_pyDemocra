import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getEmptySearchResults,
  getSearchMinLength,
  searchGlobalEntities,
  toFriendlyError,
} from "./homeService";
import { useSessionStorageState } from "../../lib/session-state";
import type { GlobalSearchGroupedResults } from "./types";

const DEBOUNCE_MS = 350;
const GLOBAL_SEARCH_QUERY_STORAGE_KEY = "ong.view.global-search.query";

function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error) {
    const normalized = error.message.toLowerCase();
    return normalized.includes("aborted");
  }

  return false;
}

function countResults(results: GlobalSearchGroupedResults): number {
  return (
    results.volunteers.length +
    results.projects.length +
    results.activities.length +
    results.admissions.length
  );
}

export function useGlobalSearch(limitPerGroup = 6) {
  const minLength = getSearchMinLength();
  const [query, setQuery] = useSessionStorageState(
    GLOBAL_SEARCH_QUERY_STORAGE_KEY,
    ""
  );
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [results, setResults] = useState<GlobalSearchGroupedResults>(
    getEmptySearchResults()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSearchedTerm, setLastSearchedTerm] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const currentTerm = debouncedQuery.trim();

    if (currentTerm.length < minLength) {
      setLoading(false);
      setError(null);
      setResults(getEmptySearchResults());
      setLastSearchedTerm(currentTerm);
      return;
    }

    let isActive = true;
    const abortController = new AbortController();

    setLoading(true);
    setError(null);
    setLastSearchedTerm(currentTerm);

    searchGlobalEntities(currentTerm, {
      limitPerGroup,
      signal: abortController.signal,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setResults(response);
      })
      .catch((fetchError) => {
        if (!isActive || isAbortError(fetchError)) {
          return;
        }

        setResults(getEmptySearchResults());
        setError(
          toFriendlyError(
            fetchError,
            "No se pudieron obtener resultados de la busqueda global."
          )
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [debouncedQuery, limitPerGroup, minLength, retryToken]);

  const hasSearched = debouncedQuery.trim().length >= minLength;
  const totalResults = useMemo(() => countResults(results), [results]);

  const retry = useCallback(() => {
    if (debouncedQuery.trim().length < minLength) {
      return;
    }
    setRetryToken((current) => current + 1);
  }, [debouncedQuery, minLength]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    minLength,
    hasSearched,
    totalResults,
    lastSearchedTerm,
    retry,
  };
}

