"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

type Document = {
  id: string;
  filename: string;
  status: string;
  page_count: number | null;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  async function loadDocuments() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load documents");
      }

      const data = await response.json();

      setDocuments(data);
    } catch {
      setMessage("Could not load documents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError("");
    setUploadSuccess("");
  }

  async function handleUpload() {
    setUploadError("");
    setUploadSuccess("");

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!selectedFile) {
      setUploadError("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setUploading(true);

    try {
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

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        let detail = "Upload failed. Please try again.";

        const data = await response.json().catch(() => null);

        if (typeof data?.detail === "string") {
          detail = data.detail;
        }

        setUploadError(detail);
        return;
      }

      setUploadSuccess("Document uploaded successfully.");
      setSelectedFile(null);

      await loadDocuments();
    } catch {
      setUploadError("Could not upload document.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">
          My Documents
        </h1>

        {message && (
          <p className="mt-4 text-red-600">
            {message}
          </p>
        )}

        <div className="mt-8 rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold">Upload Document</h2>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />

            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>

          {uploadError && (
            <p className="mt-3 text-red-600">
              {uploadError}
            </p>
          )}

          {uploadSuccess && (
            <p className="mt-3 text-green-600">
              {uploadSuccess}
            </p>
          )}
        </div>

        <div className="mt-8 space-y-4">
          {documents.map((document) => (
            <div
              key={document.id}
              className="rounded-xl bg-white p-5 shadow"
            >
              <h2 className="font-semibold">
                {document.filename}
              </h2>

              <p className="text-gray-600">
                Status: {document.status}
              </p>

              <p className="text-gray-600">
                Pages: {document.page_count ?? "—"}
              </p>
            </div>
          ))}

          {!message && documents.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center">
              <p className="text-gray-500">
                No documents uploaded yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}