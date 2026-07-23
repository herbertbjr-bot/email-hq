import DOMPurify from "dompurify";

/**
 * Sanitizes untrusted HTML email bodies before they're ever rendered.
 * Strips script/style/iframe/object/embed/form tags, all event handlers
 * (onclick, onerror, ...), and javascript:/data: URIs - DOMPurify forbids
 * those by default, the FORBID_TAGS below are extra explicit belt-and-braces
 * for the tags most relevant to email (trackers, embedded forms, nested
 * frames). External links are forced to open in a new tab with
 * rel="noopener noreferrer" so a malicious link can't reach back into this
 * app's window via window.opener.
 *
 * Inline `style` attributes are kept (DOMPurify sanitizes their CSS content
 * by default, stripping things like `expression()` / `-moz-binding` /
 * `url(javascript:...)`) so formatted emails don't render as plain
 * unstyled text - only the `<style>` *tag* (which could affect the whole
 * document, not just this message) is forbidden.
 *
 * This is defense layer one. Layer two is rendering the result inside a
 * sandboxed <iframe sandbox="allow-same-origin"> (no allow-scripts) in
 * SafeHtmlEmail.tsx, so even a DOMPurify bypass couldn't execute script in
 * the parent app.
 */
export function sanitizeEmailHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, {
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "link", "meta", "base"],
    ALLOW_DATA_ATTR: false,
  });

  const doc = new DOMParser().parseFromString(clean, "text/html");
  for (const anchor of doc.querySelectorAll("a[href]")) {
    anchor.setAttribute("target", "_blank");
    anchor.setAttribute("rel", "noopener noreferrer");
  }
  return doc.body.innerHTML;
}
