// Frontend: React + Tailwind v3
// File: client/src/App.jsx
import React, { useState } from "react";
import backgroundImage from "./lab-background.jpg";

export default function App() {
  const [report, setReport] = useState(null);
  const [result, setResult] = useState("");

  const handleReportChange = (e) => {
    setReport(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!report) return;
    const formData = new FormData();
    formData.append("report", report);

    const res = await fetch("https://llbp-backend.onrender.com/process", {
      method: "POST",
      body: formData,
    });

    console.log("Server response status:", res.status);

    if (!res.ok) {
      const error = await res.json();
      console.error("Error response from server:", error);
      alert("Error from server: " + error.error);
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    setResult(url);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(${backgroundImage})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="max-w-3xl w-full bg-white/90 backdrop-blur-md p-12 rounded-3xl shadow-2xl text-center font-sans flex flex-col items-center justify-center">
          <h1 className="text-4xl font-extrabold mb-6 text-blue-900">
            <span role="img" aria-label="brain">🧠</span> AI-Powered Draft LLBP Generator
          </h1>
          <p className="text-md mb-10 text-gray-800">
            This is an AI tool to read a Causal Analysis Report, and generate a draft LLBP document in an ICAO suggested template.
          </p>

          <div className="text-left w-full">
            <h2 className="text-lg font-semibold mb-2">
              <span role="img" aria-label="document">📄</span> Please upload the Causal Analysis Report
            </h2>
            <input
              type="file"
              accept=".txt,.docx"
              onChange={handleReportChange}
              className="mb-6 block w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 bg-white"
            />

            <h2 className="text-lg font-semibold mb-4">
              <span role="img" aria-label="rocket">🚀</span> Please click Submit to get an initial draft of the LLBP briefing in ICAO suggested format. May take upto 30 seconds.
            </h2>
            <button
              onClick={handleSubmit}
              className="bg-blue-800 text-white px-6 py-2 rounded-lg text-lg hover:bg-blue-700 transition w-full"
            >
              Submit
            </button>
          </div>

          {result && (
            <div className="mt-10">
              <a
                href={result}
                download="LLBP_Draft.docx"
                className="inline-block mt-4 text-blue-800 font-medium underline text-lg"
              >
                <span role="img" aria-label="download">📥</span> Download LLBP Draft
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
