import { useState } from "react";
import api from "../api";

function ScoreCircle({ score }) {
  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 60
        ? "text-amber-500"
        : "text-red-400";
  const bg =
    score >= 80
      ? "bg-emerald-50"
      : score >= 60
        ? "bg-amber-50"
        : "bg-red-50";
  return (
    <div className={`w-14 h-14 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
      <span className={`text-xl font-bold ${color}`}>{score}</span>
    </div>
  );
}

export default function ScoringPanel({ candidates }) {
  const [jd, setJd] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  const runScoring = () => {
    if (!jd.trim()) return;
    setLoading(true);
    setError("");
    setResults(null);
    api
      .post("/candidates/score", {
        job_description: jd,
        candidate_ids: candidates.map((c) => c.id),
      })
      .then((res) => setResults(res.data.results))
      .catch((err) => setError(err.response?.data?.detail || "Scoring failed."))
      .finally(() => setLoading(false));
  };

  const clearResults = () => {
    setResults(null);
    setJd("");
    setError("");
    setExpanded(null);
  };

  return (
    <div className="mb-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <h3 className="text-sm font-semibold text-amber-800">Candidate Scoring</h3>
          {results && (
            <button
              onClick={clearResults}
              className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium"
            >
              Clear scores
            </button>
          )}
        </div>

        {!results && (
          <>
            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste a job description here to score all candidates against it..."
              className="w-full h-28 px-3 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none placeholder-gray-400"
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={runScoring}
                disabled={loading || !jd.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Scoring...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    Score Candidates
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {results && (
          <div className="mt-3 space-y-3">
            {results.map((r, idx) => (
              <div
                key={r.candidate.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(expanded === r.candidate.id ? null : r.candidate.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-400 w-6">#{idx + 1}</span>
                  <ScoreCircle score={r.score} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{r.candidate.name || "Unknown"}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.reasoning}</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expanded === r.candidate.id ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {expanded === r.candidate.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1.5">
                          Strengths
                        </p>
                        <ul className="space-y-1">
                          {r.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              {s}
                            </li>
                          ))}
                          {r.strengths.length === 0 && (
                            <li className="text-sm text-gray-400">No specific strengths identified</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1.5">
                          Gaps
                        </p>
                        <ul className="space-y-1">
                          {r.gaps.map((g, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              {g}
                            </li>
                          ))}
                          {r.gaps.length === 0 && (
                            <li className="text-sm text-gray-400">No gaps identified</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
