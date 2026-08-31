"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    try {
      setMessage("Logging in...");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      saveToken(data.access_token);

      router.push("/");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          Login
        </h1>

        <input
          className="mt-6 w-full rounded border p-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
        />

        <input
          className="mt-4 w-full rounded border p-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
        />

        <button
          onClick={login}
          className="mt-6 w-full rounded-lg bg-black px-5 py-3 text-white"
        >
          Login
        </button>

        {message && (
          <p className="mt-4 text-center">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}