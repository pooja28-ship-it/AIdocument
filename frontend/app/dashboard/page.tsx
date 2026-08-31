"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

type Document = {
  id: string;
  filename: string;
  status: string;
  page_count: number | null;
  created_at: string;
};

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [message, setMessage] = useState("");

  async function loadDocuments() {
    const token = getToken();

    if (!token) {
      setMessage("Please login first.");
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

      if (!response.ok) {
        throw new Error("Could not load documents");
      }

      const data = await response.json();

      setDocuments(data);
    } catch (error) {
      setMessage("Could not load documents.");
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

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
        </div>
      </div>
    </main>
  );
}