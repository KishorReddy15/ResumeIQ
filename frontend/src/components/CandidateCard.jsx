import { useState } from "react";
import api from "../api";

const SOURCE_COLORS = {
  LinkedIn: "bg-blue-50 text-blue-700 ring-blue-600/10",
  Referral: "bg-amber-50 text-amber-700 ring-amber-600/10",
  "Direct Apply": "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
  Other: "bg-gray-50 text-gray-600 ring-gray-500/10",
};

export default function CandidateCard({ candidate, onUpdate }) {
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const addTag = async () => {
    const trimmed = tagInput.trim();
    if (!trimmed || candidate.tags.includes(trimmed)) {
      setTagInput("");
      return;
    }

    setSaving(true);
    try {
      const newTags = [...candidate.tags, trimmed];
      const res = await api.patch(`/candidates/${candidate.id}/tags`, {
        tags: newTags,
      });
      onUpdate(res.data);
      setTagInput("");
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const removeTag = async (tagToRemove) => {
    setSaving(true);
    try {
      const newTags = candidate.tags.filter((t) => t !== tagToRemove);
      const res = await api.patch(`/candidates/${candidate.id}/tags`, {
        tags: newTags,
      });
      onUpdate(res.data);
    } catch {
      /* ignore */
    }
    setSaving(false);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const sourceColor = SOURCE_COLORS[candidate.source] || SOURCE_COLORS.Other;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 hover:shadow-lg hover:shadow-gray-100/80 hover:border-gray-300/60 transition-all duration-200 group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {(candidate.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 leading-tight">
              {candidate.name || "Unknown Name"}
            </h3>
            <span className={`inline-flex items-center mt-0.5 px-2 py-0.5 text-[11px] font-medium rounded-md ring-1 ring-inset ${sourceColor}`}>
              {candidate.source}
            </span>
          </div>
        </div>
        <span className="text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md max-w-[120px] truncate" title={candidate.filename}>
          {candidate.filename}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600 mb-4">
        {candidate.email && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span className="text-gray-600 truncate">{candidate.email}</span>
          </div>
        )}
        {candidate.phone && (
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <span className="text-gray-600">{candidate.phone}</span>
          </div>
        )}
      </div>

      {candidate.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Skills
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {candidate.skills.map((skill) => (
              <span
                key={skill}
                className="px-2.5 py-0.5 text-xs rounded-lg bg-indigo-50 text-indigo-700 font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {candidate.experience.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Experience
            </p>
          </div>
          <ul className="space-y-1.5">
            {candidate.experience.map((exp, i) => (
              <li key={i} className="text-sm pl-1 border-l-2 border-indigo-100 ml-0.5">
                <span className="font-medium text-gray-800 ml-2">
                  {exp.title || "Role"}
                </span>
                {exp.company && (
                  <span className="text-gray-500 ml-2">at {exp.company}</span>
                )}
                {exp.duration && (
                  <span className="text-gray-400 text-xs ml-1.5">({exp.duration})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {candidate.education.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
            </svg>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Education
            </p>
          </div>
          <ul className="space-y-1">
            {candidate.education.map((edu, i) => (
              <li key={i} className="text-sm text-gray-600">
                <span className="font-medium text-gray-700">{edu.degree || "Degree"}</span>
                {edu.institution && <span className="text-gray-500"> — {edu.institution}</span>}
                {edu.year && <span className="text-gray-400 text-xs ml-1">({edu.year})</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
          </svg>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Tags
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {candidate.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs rounded-lg bg-emerald-50 text-emerald-700 font-medium ring-1 ring-inset ring-emerald-600/10"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-500 transition-colors ml-0.5"
                disabled={saving}
              >
                &times;
              </button>
            </span>
          ))}
          <div className="inline-flex items-center">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="+ add tag"
              className="w-24 px-2.5 py-1 text-xs border border-dashed border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 bg-gray-50/50 placeholder-gray-400 transition-colors hover:border-gray-300"
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
