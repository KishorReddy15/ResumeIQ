import { useEffect, useState } from "react";
import api from "../api";

const SOURCE_OPTIONS = ["Direct Apply", "LinkedIn", "Referral", "Other"];

export default function FilterBar({ filters, onChange }) {
  const [options, setOptions] = useState({ sources: [], skills: [], tags: [] });
  const [skillInput, setSkillInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api
      .get("/candidates/filters")
      .then((res) => setOptions(res.data))
      .catch(() => {});
  }, []);

  const toggleSource = (src) => {
    const next = filters.source.includes(src)
      ? filters.source.filter((s) => s !== src)
      : [...filters.source, src];
    onChange({ ...filters, source: next });
  };

  const addSkill = (s) => {
    const val = s.trim();
    if (!val || filters.skill.includes(val)) return;
    onChange({ ...filters, skill: [...filters.skill, val] });
    setSkillInput("");
  };

  const removeSkill = (s) => {
    onChange({ ...filters, skill: filters.skill.filter((x) => x !== s) });
  };

  const addTag = (t) => {
    const val = t.trim();
    if (!val || filters.tag.includes(val)) return;
    onChange({ ...filters, tag: [...filters.tag, val] });
    setTagInput("");
  };

  const removeTag = (t) => {
    onChange({ ...filters, tag: filters.tag.filter((x) => x !== t) });
  };

  const clearAll = () => {
    onChange({ source: [], skill: [], tag: [], search: "" });
    setSkillInput("");
    setTagInput("");
  };

  const activeCount =
    filters.source.length +
    filters.skill.length +
    filters.tag.length +
    (filters.search ? 1 : 0);

  const filteredSkillOptions = options.skills.filter(
    (s) =>
      !filters.skill.includes(s) &&
      s.toLowerCase().includes(skillInput.toLowerCase()),
  );
  const filteredTagOptions = options.tags.filter(
    (t) =>
      !filters.tag.includes(t) &&
      t.toLowerCase().includes(tagInput.toLowerCase()),
  );

  return (
    <div className="mb-6">
      {/* Search + toggle row */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search candidates by name, email, skill, or company..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            open || activeCount > 0
              ? "bg-indigo-50 text-indigo-600 border-indigo-200"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter panel */}
      {open && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-4">
          {/* Source */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Source
            </h4>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((src) => (
                <button
                  key={src}
                  onClick={() => toggleSource(src)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    filters.source.includes(src)
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Skills
            </h4>
            {filters.skill.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {filters.skill.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {s}
                    <button
                      onClick={() => removeSkill(s)}
                      className="hover:text-blue-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Type to search skills..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput);
                  }
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {skillInput && filteredSkillOptions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {filteredSkillOptions.slice(0, 8).map((s) => (
                    <li
                      key={s}
                      onClick={() => addSkill(s)}
                      className="px-3 py-1.5 text-sm hover:bg-indigo-50 cursor-pointer"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Tags
            </h4>
            {filters.tag.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {filters.tag.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {t}
                    <button
                      onClick={() => removeTag(t)}
                      className="hover:text-green-900"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <input
                type="text"
                placeholder="Type to search tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {tagInput && filteredTagOptions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {filteredTagOptions.slice(0, 8).map((t) => (
                    <li
                      key={t}
                      onClick={() => addTag(t)}
                      className="px-3 py-1.5 text-sm hover:bg-indigo-50 cursor-pointer"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Active filter pills (shown when panel is closed) */}
      {!open && activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.source.map((s) => (
            <span
              key={`src-${s}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full"
            >
              {s}
              <button onClick={() => toggleSource(s)} className="hover:text-indigo-900">
                &times;
              </button>
            </span>
          ))}
          {filters.skill.map((s) => (
            <span
              key={`skill-${s}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
            >
              {s}
              <button onClick={() => removeSkill(s)} className="hover:text-blue-900">
                &times;
              </button>
            </span>
          ))}
          {filters.tag.map((t) => (
            <span
              key={`tag-${t}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
            >
              {t}
              <button onClick={() => removeTag(t)} className="hover:text-green-900">
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
