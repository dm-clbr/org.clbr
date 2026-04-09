"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || typeof window === "undefined") {
      return;
    }

    if (!user) {
      window.location.replace("/login");
      return;
    }

    window.location.replace("/dashboard");
  }, [loading, user]);

  return <main>Checking session...</main>;
}
