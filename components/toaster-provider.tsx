"use client";
import { Toaster } from "react-hot-toast";

export function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      containerStyle={{ bottom: "max(16px, env(safe-area-inset-bottom))", right: 16 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#FFFDF9",
          color: "#1A1A1A",
          border: "1px solid #C8A44D",
          boxShadow: "0 6px 24px rgba(26,26,26,0.08)",
          borderRadius: 12,
          fontSize: 15,
        },
        success: { iconTheme: { primary: "#C8A44D", secondary: "#FFFDF9" } },
      }}
    />
  );
}
