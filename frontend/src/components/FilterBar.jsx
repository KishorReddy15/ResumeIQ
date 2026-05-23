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
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
            placeholder="Search by name, email, skill, or company..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white shadow-sm placeholder-gray-400 transition-shadow hover:shadow-md"
          />
        </div>

        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl border transition-all duration-200 shadow-sm ${
            open || activeCount > 0
              ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-indigo-100/50"
              : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:shadow-md"
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
            <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
              {activeCount}
            </span>
          )}
        </button>

        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-5 mt-1">
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-6.072a4.5 4.5 0 00-6.364 0L4.34 10.783a4.5 4.5 0 006.364 6.364l1.757-1.757" />
              </svg>
              Source
            </h4>
            <div className="flex flex-wrap gap-2">
              {SOURCE_OPTIONS.map((src) => (
                <button
                  key={src}
                  onClick={() => toggleSource(src)}
                  className={`px-3.5 py-1.5 text-sm rounded-xl border transition-all duration-150 ${
                    filters.source.includes(src)
                      ? "bg-indigo-100 text-indigo-700 border-indigo-300 font-medium shadow-sm"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Skills
            </h4>
            {filters.skill.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {filters.skill.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium ring-1 ring-inset ring-indigo-600/10"
                  >
                    {s}
                    <button
                      onClick={() => removeSkill(s)}
                      className="hover:text-red-500 transition-colors"
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
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50/50 placeholder-gray-400"
              />
              {skillInput && filteredSkillOptions.length > 0 && (
                <ul className="absolute z-10 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-32 overflow-y-auto">
                  {filteredSkillOptions.slice(0, 8).map((s) => (
                    <li
                      key={s}
                      onClick={() => addSkill(s)}
                      className="px-3.5 py-2 text-sm hover:bg-indigo-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl transition-colors"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
              Tags
            </h4>
            {filters.tag.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {filters.tag.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium ring-1 ring-inset ring-emerald-600/10"
                  >
                    {t}
                    <button
                      onClick={() => removeTag(t)}
                      className="hover:text-red-500 transition-colors"
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
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50/50 placeholder-gray-400"
              />
              {tagInput && filteredTagOptions.length > 0 && (
                <ul className="absolute z-10 mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-32 overflow-y-auto">
                  {filteredTagOptions.slice(0, 8).map((t) => (
                    <li
                      key={t}
                      onClick={() => addTag(t)}
                      className="px-3.5 py-2 text-sm hover:bg-indigo-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl transition-colors"
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

      {!open && activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {filters.source.map((s) => (
            <span
              key={`src-${s}`}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg font-medium ring-1 ring-inset ring-indigo-600/10"
            >
              {s}
              <button onClick={() => toggleSource(s)} className="hover:text-red-500 transition-colors">
                &times;
              </button>
            </span>
          ))}
          {filters.skill.map((s) => (
            <span
              key={`skill-${s}`}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium ring-1 ring-inset ring-blue-600/10"
            >
              {s}
              <button onClick={() => removeSkill(s)} className="hover:text-red-500 transition-colors">
                &times;
              </button>
            </span>
          ))}
          {filters.tag.map((t) => (
            <span
              key={`tag-${t}`}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium ring-1 ring-inset ring-emerald-600/10"
            >
              {t}
              <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
