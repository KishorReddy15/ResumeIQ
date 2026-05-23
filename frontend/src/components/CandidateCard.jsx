import { useState } from "react";
import api from "../api";

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {candidate.name || "Unknown Name"}
          </h3>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
            {candidate.source}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          {candidate.filename}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 mb-3">
        {candidate.email && (
          <p>
            <span className="font-medium text-gray-700">Email:</span>{" "}
            {candidate.email}
          </p>
        )}
        {candidate.phone && (
          <p>
            <span className="font-medium text-gray-700">Phone:</span>{" "}
            {candidate.phone}
          </p>
        )}
      </div>

      {candidate.skills.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Skills
          </p>
          <div className="flex flex-wrap gap-1">
            {candidate.skills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {candidate.experience.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Experience
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            {candidate.experience.map((exp, i) => (
              <li key={i}>
                <span className="font-medium text-gray-700">
                  {exp.title || "Role"}
                </span>
                {exp.company && ` at ${exp.company}`}
                {exp.duration && (
                  <span className="text-gray-400"> · {exp.duration}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {candidate.education.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Education
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            {candidate.education.map((edu, i) => (
              <li key={i}>
                {edu.degree || "Degree"}
                {edu.institution && ` — ${edu.institution}`}
                {edu.year && (
                  <span className="text-gray-400"> ({edu.year})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Tags
        </p>
        <div className="flex flex-wrap gap-1 items-center">
          {candidate.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-red-600 font-bold"
                disabled={saving}
              >
                ×
              </button>
            </span>
          ))}
          <div className="inline-flex items-center gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="+ add tag"
              className="w-24 px-2 py-0.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
              disabled={saving}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
