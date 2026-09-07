import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { truncAddr } from "../utils/format.js";

export default function AddrChip({ value, front = 6, back = 4, mono = true, size = 12 }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: mono ? "monospace" : "inherit", fontSize: size }}>
      {truncAddr(value, front, back)}
      <button onClick={copy} title="Copy full address" style={{
        background: "none", border: 0, padding: 2, cursor: "pointer", display: "inline-flex",
        color: copied ? "var(--lime)" : "var(--dim)", flexShrink: 0,
      }}>
        {copied ? <Check size={size + 1} /> : <Copy size={size} />}
      </button>
    </span>
  );
}
