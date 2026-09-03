"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getToken } from "@/lib/auth";

type Document = {
  id: string;
  filename: string;
  status: string;
  page_count: number | null;
  word_count: number | null;
  character_count: number | null;
  created_at: string;
};

type DocumentText = {
  text: string | null;
  page_count: number | null;
};

type SummaryType = "brief" | "detailed" | "key_points";

const SUMMARY_OPTIONS: {
  value: SummaryType;
  label: string;
}[] = [
  { value: "brief", label: "Brief" },
  { value: "detailed", label: "Detailed" },
  { value: "key_points", label: "Key Points" },
];

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();

  const documentId = params?.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [documentText, setDocumentText] =
    useState<DocumentText | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summaryType, setSummaryType] =
    useState<SummaryType>("brief");

  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  async function loadDocument() {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!documentId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [docResponse, textResponse] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),

        fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/text`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      if (
        docResponse.status === 401 ||
        textResponse.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (!docResponse.ok) {
        throw new Error("Could not load document.");
      }

      if (!textResponse.ok) {
        throw new Error("Could not load extracted text.");
      }

      const docData = await docResponse.json();
      const textData = await textResponse.json();

      setDocument(docData);
      setDocumentText(textData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load document."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocument();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  async function handleGenerateSummary() {
    setSummaryError("");
    setSummary("");

    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    setSummarizing(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/documents/${documentId}/summarize`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary_type: summaryType,
          }),
        }
      );

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        let detail =
          "Could not generate summary. Please try again.";

        const data = await response.json().catch(() => null);

        if (typeof data?.detail === "string") {
          detail = data.detail;
        }

        setSummaryError(detail);
        return;
      }

      const data = await response.json();

      setSummary(data.summary ?? "");
    } catch {
      setSummaryError("Could not generate summary.");
    } finally {
      setSummarizing(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-600">
            Loading document...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">

        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium"
        >
          ← Back to Documents
        </button>

        <h1 className="text-4xl font-bold">
          {document?.filename ?? "Document"}
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-white p-5 shadow sm:grid-cols-4">

          <div>
            <p className="text-sm text-gray-500">
              Status
            </p>

            <p className="font-semibold">
              {document?.status ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Pages
            </p>

            <p className="font-semibold">
              {document?.page_count ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Words
            </p>

            <p className="font-semibold">
              {document?.word_count ?? "—"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Characters
            </p>

            <p className="font-semibold">
              {document?.character_count ?? "—"}
            </p>
          </div>

        </div>

        <div className="mt-8 rounded-xl bg-white p-5 shadow">

          <h2 className="font-semibold">
            Extracted Text
          </h2>

          <div className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {documentText?.text ||
              "No extracted text available."}
          </div>

        </div>

        <div className="mt-8 rounded-xl bg-white p-5 shadow">

          <h2 className="font-semibold">
            Summary
          </h2>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">

            <select
              value={summaryType}
              onChange={(event) =>
                setSummaryType(
                  event.target.value as SummaryType
                )
              }
              disabled={summarizing}
              className="rounded-lg border border-gray-300 px-3 py-2"
            >
              {SUMMARY_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={summarizing}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              {summarizing
                ? "Generating..."
                : "Generate Summary"}
            </button>

          </div>

          {summaryError && (
            <p className="mt-3 text-red-600">
              {summaryError}
            </p>
          )}

          {summary && (
            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              {summary}
            </div>
          )}

        </div>

      </div>
    </main>
  );
}