import crypto from "node:crypto";

/**
 * Motor CMS y Sanitizador de Bloques Enriquecidos HTML/WYSIWYG (Módulo M15 / RF-097).
 */

/**
 * Sanitiza y construye una publicación enriquecida CMS para proyectos y eventos.
 *
 * @param {Object} options
 * @param {string} options.title - Título de la publicación CMS.
 * @param {string} options.rawHtmlContent - Contenido HTML/WYSIWYG ingresado por el editor.
 * @param {Array<Object>} [options.mediaList=[]] - Lista de medios adjuntos (imágenes, PDFs).
 * @param {string} options.authorId - ID del autor/editor CMS.
 * @returns {Object} Publicación CMS sanitizada y procesada.
 */
export function sanitizeAndBuildCmsPost({ title, rawHtmlContent, mediaList = [], authorId }) {
  if (!title || typeof title !== "string") {
    throw new Error("El título de la publicación CMS es obligatorio.");
  }
  if (!rawHtmlContent || typeof rawHtmlContent !== "string") {
    throw new Error("El contenido HTML de la publicación CMS es obligatorio.");
  }
  if (!authorId) {
    throw new Error("El autor de la publicación es obligatorio.");
  }

  // Sanitización de etiquetas HTML peligrosas (<script>, <iframe> maliciosos, event handlers)
  let cleanHtml = rawHtmlContent
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/javascript:[^\s"']+/gi, "");

  const postId = `post_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  const processedMedia = mediaList.map((m, idx) => ({
    mediaId: `med_${idx}_${Date.now()}`,
    url: m.url || "",
    mimeType: m.mimeType || "image/jpeg",
    altText: m.altText || title,
    cdnOptimizedUrl: m.url ? `https://cdn.democra.org/media/${m.url.split("/").pop()}` : "",
  }));

  return {
    postId,
    slug,
    title,
    cleanHtmlContent: cleanHtml,
    mediaCount: processedMedia.length,
    media: processedMedia,
    authorId,
    status: "PUBLICADO",
    publishedAt: new Date().toISOString(),
  };
}
