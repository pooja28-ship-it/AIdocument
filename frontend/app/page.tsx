import { getToken } from "@/lib/auth";
"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function uploadDocument() {
    if (!file) {
      setMessage("Please select a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setMessage("Uploading...");

      const token = getToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      setMessage(`Uploaded: ${data.filename}`);
    } catch (error) {
      setMessage("Upload failed.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold">
          AI Document Intelligence
        </h1>

        <p className="mt-2 text-gray-600">
          Upload a PDF and analyze it with AI.
        </p>

        <div className="mt-10 rounded-xl bg-white p-6 shadow">
          <h2 className="text-2xl font-semibold">
            Upload Document
          </h2>

          <input
            className="mt-6 block w-full rounded border p-3"
            type="file"
            accept="application/pdf"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
            }}
          />

          <button
            onClick={uploadDocument}
            className="mt-4 rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
          >
            Upload PDF
          </button>

          {message && (
            <p className="mt-4 text-gray-700">
              {message}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}