
import fs from "fs";
import path from "path";

function processFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const original = content;

  // Replacements mapping
  const map = {
    "bg-zinc-950": "bg-white dark:bg-zinc-950",
    "bg-zinc-900": "bg-neutral-100 dark:bg-zinc-900",
    "bg-zinc-900/40": "bg-neutral-100/40 dark:bg-zinc-900/40",
    "bg-zinc-900/50": "bg-neutral-100/50 dark:bg-zinc-900/50",
    "bg-zinc-950/60": "bg-white/60 dark:bg-zinc-950/60",
    "border-zinc-800": "border-neutral-200 dark:border-zinc-800",
    "border-zinc-800/60": "border-neutral-200/60 dark:border-zinc-800/60",
    "border-zinc-800/80": "border-neutral-200/80 dark:border-zinc-800/80",
    "text-zinc-100": "text-neutral-900 dark:text-zinc-100",
    "text-zinc-200": "text-neutral-800 dark:text-zinc-200",
    "text-zinc-300": "text-neutral-700 dark:text-zinc-300",
    "text-zinc-400": "text-neutral-500 dark:text-zinc-400",
    "text-zinc-500": "text-neutral-400 dark:text-zinc-500",
    "text-zinc-500/80": "text-neutral-400/80 dark:text-zinc-500/80",
    "bg-zinc-800/50": "bg-neutral-200/50 dark:bg-zinc-800/50",
    "bg-zinc-800": "bg-neutral-200 dark:bg-zinc-800"
  };

  // Sort keys by length descending to prevent partial matches
  const keys = Object.keys(map).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    // Only replace if it is a full class name (bounded by spaces, quotes, or backticks)
    const regex = new RegExp(`(?<=[\\s"\'\`])(${key.replace(/\\//g, "\\\\/")})(?=[\\s"\'\`])`, "g");
    
    // We also need to avoid replacing if it already has dark: in front of it
    content = content.replace(new RegExp(`(?<!dark:)(?<=[\\s"\'\`])(${key.replace(/\\//g, "\\\\/")})(?=[\\s"\'\`])`, "g"), map[key]);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf-8");
    console.log("Updated", filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith(".tsx")) {
      processFile(p);
    }
  }
}

walk("d:\\\\mela\\\\02042026_01_pyDemocra\\\\src\\\\modules\\\\ong\\\\app\\\\pages");

