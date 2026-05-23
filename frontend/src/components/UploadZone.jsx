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
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center gap-4 mb-3">
        <label className="text-sm font-medium text-gray-700">Source:</label>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragging
            ? "border-indigo-500 bg-indigo-50"
            : "border-gray-300 bg-white hover:border-indigo-400"
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
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
              />
            </svg>
            <p className="text-gray-600 font-medium">
              {uploading ? progress : "Drag & drop PDF resumes here"}
            </p>
            {!uploading && (
              <p className="text-sm text-gray-400">or click to browse</p>
            )}
          </div>
        </label>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
