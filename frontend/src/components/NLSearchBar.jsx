import { useState } from "react";
import api from "../api";
import CandidateCard from "./CandidateCard";

export default function NLSearchBar({ onUpdate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const res = await api.post("/search/natural", { query: trimmed });
      setResults(res.data);
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Search failed. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <input
            type="text"
            placeholder='Ask in plain English, e.g. "Find people with Python and 2+ years experience"'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="w-full pl-10 pr-4 py-2.5 border-2 border-purple-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-purple-50 placeholder-purple-300"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              AI Search
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              AI Search Results
              <span className="ml-2 text-purple-600">
                ({results.results.length} match
                {results.results.length !== 1 && "es"})
              </span>
            </h3>
            <button
              onClick={() => {
                setResults(null);
                setQuery("");
              }}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear results
            </button>
          </div>

          {results.results.length === 0 ? (
            <p className="text-center text-gray-400 py-4">
              No candidates match your query. Try rephrasing.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
              {results.results.map((r) => (
                <div key={r.candidate.id} className="relative">
                  <div className="absolute -top-2 -left-2 -right-2 bg-purple-50 border border-purple-200 rounded-t-lg px-3 py-2 text-xs text-purple-700 italic z-0">
                    {r.explanation}
                  </div>
                  <div className="mt-8">
                    <CandidateCard candidate={r.candidate} onUpdate={onUpdate} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
