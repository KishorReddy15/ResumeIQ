import { useState, useCallback } from "react";
import api from "../api";

const SOURCES = ["Direct Apply", "LinkedIn", "Referral", "Other"];

export default function UploadZone({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [source, setSource] = useState("Direct Apply");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const handleFiles = useCallback(
    async (files) => {
      const pdfFiles = Array.from(files).filter((f) =>
        f.name.toLowerCase().endsWith(".pdf"),
      );
      if (pdfFiles.length === 0) {
        setError("Only PDF files are accepted.");
        return;
      }

      setUploading(true);
      setError(null);
      setProgress(`Uploading 0 / ${pdfFiles.length}...`);

      for (let i = 0; i < pdfFiles.length; i++) {
        const formData = new FormData();
        formData.append("file", pdfFiles[i]);
        formData.append("source", source);

        try {
          setProgress(`Processing ${i + 1} / ${pdfFiles.length}: ${pdfFiles[i].name}`);
          const res = await api.post("/upload", formData);
          onUploaded(res.data.candidate);
        } catch (err) {
          const detail = err.response?.data?.detail || err.message;
          setError(`Failed to upload ${pdfFiles[i].name}: ${detail}`);
        }
      }

      setUploading(false);
      setProgress(null);
    },
    [source, onUploaded],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onFileInput = (e) => {
    if (e.target.files) handleFiles(e.target.files);
  };

  return (
    <div className="w-full mb-6">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${
          dragging
            ? "border-indigo-400 bg-indigo-50/70 scale-[1.01] shadow-lg shadow-indigo-100"
            : "border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30"
        } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <input
          type="file"
          accept=".pdf"
          multiple
          onChange={onFileInput}
          className="hidden"
          id="file-upload"
          disabled={uploading}
        />
        <label htmlFor="file-upload" className="cursor-pointer block px-6 py-8">
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              dragging ? "bg-indigo-100" : "bg-gradient-to-br from-indigo-50 to-purple-50"
            }`}>
              <svg
                className={`w-7 h-7 transition-colors ${dragging ? "text-indigo-600" : "text-indigo-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-gray-700 font-semibold text-sm">
                {uploading ? progress : "Drag & drop PDF resumes here"}
              </p>
              {!uploading && (
                <p className="text-xs text-gray-400 mt-1">or click to browse files</p>
              )}
            </div>

            {!uploading && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">Source:</span>
                <div className="flex gap-1">
                  {SOURCES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSource(s);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all duration-150 ${
                        source === s
                          ? "bg-indigo-100 text-indigo-700 border-indigo-300 font-medium"
                          : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-600"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
