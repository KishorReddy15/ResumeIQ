import { useEffect, useState } from "react";
import api from "./api";
import UploadZone from "./components/UploadZone";
import CandidateCard from "./components/CandidateCard";
import ChatAssistant from "./components/ChatAssistant";

function App() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("candidates");

  useEffect(() => {
    api
      .get("/candidates")
      .then((res) => setCandidates(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUploaded = (candidate) => {
    setCandidates((prev) => [candidate, ...prev]);
  };

  const handleUpdate = (updated) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">ResumeIQ</h1>

          <div className="flex items-center gap-4">
            <nav className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTab("candidates")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === "candidates"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Candidates
              </button>
              <button
                onClick={() => setTab("chat")}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  tab === "chat"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Chat
              </button>
            </nav>

            {tab === "candidates" && (
              <span className="text-sm text-gray-400">
                {candidates.length} candidate{candidates.length !== 1 && "s"}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === "candidates" ? (
          <>
            <UploadZone onUploaded={handleUploaded} />

            {loading ? (
              <p className="text-center text-gray-400">Loading candidates...</p>
            ) : candidates.length === 0 ? (
              <p className="text-center text-gray-400">
                No candidates yet. Upload a resume to get started.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                {candidates.map((c) => (
                  <CandidateCard
                    key={c.id}
                    candidate={c}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <ChatAssistant />
        )}
      </main>
    </div>
  );
}

export default App;
