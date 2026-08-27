import { useEffect, useMemo, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import {
  getEmptySearchResults,
  getSearchMinLength,
  searchVolunteers,
  searchProjects,
  searchActivities,
  searchAdmissions
} from "./homeService";
import type { GlobalSearchGroupedResults, GlobalSearchItem } from "./types";

const DEBOUNCE_MS = 300;
const RECENT_SEARCHES_KEY = "ong.view.global-search.recent";

export function useGlobalSearch(limitPerGroup = 6) {
  const minLength = getSearchMinLength();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // Ignore
    }
  }, []);

  const addRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(t => t !== trimmed)].slice(0, 5);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const hasSearched = debouncedQuery.length >= minLength;

  const results = useQueries({
    queries: [
      {
        queryKey: ["globalSearch", "volunteers", debouncedQuery],
        queryFn: () => searchVolunteers(debouncedQuery, limitPerGroup),
        enabled: hasSearched,
        staleTime: 60 * 1000,
      },
      {
        queryKey: ["globalSearch", "projects", debouncedQuery],
        queryFn: () => searchProjects(debouncedQuery, limitPerGroup),
        enabled: hasSearched,
        staleTime: 60 * 1000,
      },
      {
        queryKey: ["globalSearch", "activities", debouncedQuery],
        queryFn: () => searchActivities(debouncedQuery, limitPerGroup),
        enabled: hasSearched,
        staleTime: 60 * 1000,
      },
      {
        queryKey: ["globalSearch", "admissions", debouncedQuery],
        queryFn: () => searchAdmissions(debouncedQuery, limitPerGroup),
        enabled: hasSearched,
        staleTime: 60 * 1000,
      }
    ]
  });

  const isLoading = results.some(r => r.isLoading) && hasSearched;
  const isFetching = results.some(r => r.isFetching) && hasSearched;
  
  // Aggregate results safely
  const groupedResults = useMemo<GlobalSearchGroupedResults>(() => {
    if (!hasSearched) return getEmptySearchResults();
    
    return {
      volunteers: results[0].data ?? [],
      projects: results[1].data ?? [],
      activities: results[2].data ?? [],
      admissions: results[3].data ?? []
    };
  }, [results, hasSearched]);

  const totalResults = 
    groupedResults.volunteers.length +
    groupedResults.projects.length +
    groupedResults.activities.length +
    groupedResults.admissions.length;

  useEffect(() => {
    // Only save recent search if the query was fully fetched and yielded results
    if (hasSearched && !isFetching && totalResults > 0) {
      addRecentSearch(debouncedQuery);
    }
  }, [hasSearched, isFetching, totalResults, debouncedQuery]);

  const retry = () => {
    // Invalidate queries to retry
    queryClient.invalidateQueries({ queryKey: ["globalSearch"] });
  };

  const error = results.find(r => r.error)?.error?.message || null;

  return {
    query,
    setQuery,
    debouncedQuery,
    results: groupedResults,
    loading: isLoading,
    error,
    minLength,
    hasSearched,
    totalResults,
    lastSearchedTerm: debouncedQuery,
    retry,
    recentSearches,
    addRecentSearch,
    clearRecentSearches
  };
}
