import { useCallback, useEffect, useRef, useState } from "react";
import api from "./api";
import UploadZone from "./components/UploadZone";
import CandidateCard from "./components/CandidateCard";
import ChatAssistant from "./components/ChatAssistant";
import FilterBar from "./components/FilterBar";
import NLSearchBar from "./components/NLSearchBar";
import CompareModal from "./components/CompareModal";
import ScoringPanel from "./components/ScoringPanel";

const EMPTY_FILTERS = { source: [], skill: [], tag: [], search: "" };

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("candidates");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const debounceRef = useRef(null);

  const fetchCandidates = useCallback((f) => {
    const params = new URLSearchParams();
    f.source.forEach((s) => params.append("source", s));
    f.skill.forEach((s) => params.append("skill", s));
    f.tag.forEach((t) => params.append("tag", t));
    if (f.search) params.append("search", f.search);
    const qs = params.toString();

    api
      .get(`/candidates${qs ? `?${qs}` : ""}`)
      .then((res) => setCandidates(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCandidates(EMPTY_FILTERS);
  }, [fetchCandidates]);

  const handleFilterChange = (next) => {
    setFilters(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCandidates(next), 300);
  };

  const handleUploaded = (candidate) => {
    setCandidates((prev) => [candidate, ...prev]);
  };

  const handleUpdate = (updated) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ResumeIQ
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex gap-0.5 bg-gray-100/80 rounded-xl p-1">
              <button
                onClick={() => setTab("candidates")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab === "candidates"
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  Candidates
                </span>
              </button>
              <button
                onClick={() => setTab("chat")}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  tab === "chat"
                    ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                  Chat
                </span>
              </button>
            </nav>

            {tab === "candidates" && (
              <span className="hidden sm:inline-flex items-center gap-1 text-sm text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                <span className="font-semibold text-gray-600">{candidates.length}</span>
                candidate{candidates.length !== 1 && "s"}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {tab === "candidates" ? (
          <>
            <UploadZone onUploaded={handleUploaded} />
            <NLSearchBar onUpdate={handleUpdate} />
            <ScoringPanel candidates={candidates} />
            <FilterBar filters={filters} onChange={handleFilterChange} />

            {compareIds.length >= 2 && (
              <div className="mb-4 flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-200/60">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
                <span className="text-sm text-indigo-700 font-medium">
                  {compareIds.length} candidate{compareIds.length !== 1 && "s"} selected
                </span>
                <button
                  onClick={() => setShowCompare(true)}
                  className="ml-auto px-3 py-1.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  Compare Now
                </button>
                <button
                  onClick={() => setCompareIds([])}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="animate-spin w-8 h-8 mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading candidates...
              </div>
            ) : candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-lg font-medium text-gray-500">No candidates yet</p>
                <p className="text-sm mt-1">Upload a resume to get started</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2">
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    onUpdate={handleUpdate}
                    compareSelected={compareIds.includes(c.id)}
                    onToggleCompare={(id) => {
                      setCompareIds((prev) =>
                        prev.includes(id)
                          ? prev.filter((x) => x !== id)
                          : prev.length < 4
                            ? [...prev, id]
                            : prev,
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <ChatAssistant />
        )}
      </main>

      {showCompare && compareIds.length >= 2 && (
        <CompareModal
          candidateIds={compareIds}
          candidates={candidates}
          onClose={() => setShowCompare(false)}
        />
      )}
    </div>
  );
}

export default App;
