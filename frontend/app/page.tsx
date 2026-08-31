"use client";

import { getToken } from "@/lib/auth";
import { useState } from "react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900">
            AI Document Intelligence
          </h1>

          <p className="mt-2 text-gray-600">
            Upload, analyze, summarize, and ask questions about your documents.
          </p>
        </header>

        {/* Upload section */}
        <section className="mb-8 rounded-2xl border-2 border-dashed border-gray-300 bg-white p-10 text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload a document
            </h2>

            <p className="mt-2 text-gray-500">
              PDF documents are supported.
            </p>

            <button
              type="button"
              className="mt-6 rounded-lg bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-800"
            >
              Choose Document
            </button>
          </div>
        </section>

        {/* Documents */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Your Documents
            </h2>

            <span className="text-sm text-gray-500">
              0 documents
            </span>
          </div>

          {/* Empty state */}
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900">
              No documents yet
            </h3>

            <p className="mt-2 text-gray-500">
              Upload your first document to start analyzing it with AI.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}