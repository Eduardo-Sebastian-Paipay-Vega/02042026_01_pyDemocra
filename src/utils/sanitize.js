const ESCAPE_LOOKUP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ESCAPE_LOOKUP[char]);

export const setSafeText = (element, value = "") => {
  if (!element) return;
  element.textContent = String(value);
};
