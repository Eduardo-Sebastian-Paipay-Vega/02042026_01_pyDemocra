import { sanitizeAndBuildCmsPost } from "./cms-engine.js";

describe("Modulo M15: Motor CMS y Bloques Enriquecidos (server/services/cms-engine.js)", () => {
  test("sanitiza HTML quitando scripts maliciosos y genera slug de publicacion", () => {
    const post = sanitizeAndBuildCmsPost({
      title: "Gran Colecta Nacional 2026",
      rawHtmlContent: "<p>Bienvenidos a la colecta</p><script>alert('hack')</script><button onclick=\"alert('xss')\">Boton</button>",
      mediaList: [
        { url: "https://storage.org/banners/banner1.jpg", mimeType: "image/jpeg" },
      ],
      authorId: "author-cms-1",
    });

    expect(post.postId).toBeDefined();
    expect(post.slug).toBe("gran-colecta-nacional-2026");
    expect(post.cleanHtmlContent).not.toContain("<script>");
    expect(post.cleanHtmlContent).not.toContain("onclick");
    expect(post.mediaCount).toBe(1);
    expect(post.status).toBe("PUBLICADO");
  });

  test("lanza error si el titulo o contenido HTML estan vacios", () => {
    expect(() =>
      sanitizeAndBuildCmsPost({
        title: "",
        rawHtmlContent: "<p>Texto</p>",
        authorId: "author-1",
      })
    ).toThrow("El título de la publicación CMS es obligatorio.");
  });
});
