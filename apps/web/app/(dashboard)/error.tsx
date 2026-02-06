"use client";

import { useEffect } from "react";
import { ErrorMessage } from "@/components/ui";
import { captureError } from "@/lib/errors";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to console (and eventually Sentry)
    captureError(error, {
      boundary: "dashboard",
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="max-w-md">
        <ErrorMessage
          title="Something went wrong"
          message={
            error.message ||
            "An error occurred while loading the dashboard. Please try again."
          }
          retry={reset}
        />
      </div>
    </div>
  );
}
