import { useEffect, useState } from "react";
import api from "../api";

const ALL_SKILLS_COLOR = "bg-emerald-50 text-emerald-700";
const UNIQUE_SKILL_COLOR = "bg-gray-100 text-gray-500";

export default function CompareModal({ candidateIds, candidates, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .post("/candidates/compare", { candidate_ids: candidateIds })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.detail || "Comparison failed."))
      .finally(() => setLoading(false));
  }, [candidateIds]);

  if (!data && !loading && !error) return null;

  const selected = candidates.filter((c) => candidateIds.includes(c.id));
  const allSkills = selected.reduce((acc, c) => {
    c.skills.forEach((s) => acc.add(s));
    return acc;
  }, new Set());
  const sharedSkills = [...allSkills].filter((s) =>
    selected.every((c) => c.skills.includes(s)),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">
              Compare Candidates ({candidateIds.length})
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <svg className="animate-spin w-8 h-8 mb-3 text-indigo-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating comparison...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <>
              {data.ai_summary && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">AI Summary</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{data.ai_summary}</p>
                    </div>
                  </div>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-3 px-3 bg-gray-50 rounded-tl-lg font-semibold text-gray-500 uppercase tracking-wide text-xs w-32">
                      Field
                    </th>
                    {selected.map((c) => (
                      <th key={c.id} className="text-left py-3 px-3 bg-gray-50 last:rounded-tr-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                            {(c.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">{c.name || "Unknown"}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <Row label="Source">
                    {selected.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        <SourceBadge source={c.source} />
                      </td>
                    ))}
                  </Row>
                  <Row label="Email">
                    {selected.map((c) => (
                      <td key={c.id} className="py-3 px-3 text-gray-600">{c.email || "—"}</td>
                    ))}
                  </Row>
                  <Row label="Phone">
                    {selected.map((c) => (
                      <td key={c.id} className="py-3 px-3 text-gray-600">{c.phone || "—"}</td>
                    ))}
                  </Row>
                  <Row label="Skills">
                    {selected.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {c.skills.map((s) => (
                            <span
                              key={s}
                              className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                                sharedSkills.includes(s) ? ALL_SKILLS_COLOR : UNIQUE_SKILL_COLOR
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                          {c.skills.length === 0 && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                    ))}
                  </Row>
                  <Row label="Experience">
                    {selected.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        {c.experience.length > 0 ? (
                          <ul className="space-y-1.5">
                            {c.experience.map((e, i) => (
                              <li key={i} className="text-xs">
                                <span className="font-medium text-gray-800">{e.title}</span>
                                {e.company && <span className="text-gray-500"> at {e.company}</span>}
                                {e.duration && <span className="text-gray-400 ml-1">({e.duration})</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </Row>
                  <Row label="Education">
                    {selected.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        {c.education.length > 0 ? (
                          <ul className="space-y-1">
                            {c.education.map((e, i) => (
                              <li key={i} className="text-xs">
                                <span className="font-medium text-gray-800">{e.degree}</span>
                                {e.institution && <span className="text-gray-500"> — {e.institution}</span>}
                                {e.year && <span className="text-gray-400 ml-1">({e.year})</span>}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    ))}
                  </Row>
                  <Row label="Tags">
                    {selected.map((c) => (
                      <td key={c.id} className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
                              {t}
                            </span>
                          ))}
                          {c.tags.length === 0 && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                    ))}
                  </Row>
                </tbody>
              </table>

              {sharedSkills.length > 0 && (
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                  <span className={`px-2 py-0.5 rounded-md font-medium ${ALL_SKILLS_COLOR}`}>Green</span>
                  = shared skills
                  <span className={`px-2 py-0.5 rounded-md font-medium ${UNIQUE_SKILL_COLOR} ml-2`}>Gray</span>
                  = unique to one candidate
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <tr className="hover:bg-gray-50/50">
      <td className="py-3 px-3 font-semibold text-gray-500 uppercase tracking-wide text-xs align-top">
        {label}
      </td>
      {children}
    </tr>
  );
}

const SOURCE_COLORS = {
  LinkedIn: "bg-blue-50 text-blue-700",
  Referral: "bg-amber-50 text-amber-700",
  "Direct Apply": "bg-emerald-50 text-emerald-700",
  Other: "bg-gray-50 text-gray-600",
};

function SourceBadge({ source }) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${SOURCE_COLORS[source] || SOURCE_COLORS.Other}`}>
      {source}
    </span>
  );
}
