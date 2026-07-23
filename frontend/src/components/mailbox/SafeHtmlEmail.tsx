import { useMemo, useRef, useState } from "react";
import { sanitizeEmailHtml } from "../../utils/sanitizeHtml";
import styles from "./SafeHtmlEmail.module.css";

const IFRAME_STYLES = `
  body {
    margin: 0;
    padding: 12px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    color: #1a1d29;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  img { max-width: 100%; height: auto; }
  table { max-width: 100%; }
  a { color: #4f46e5; }
`;

/**
 * Renders an email's HTML body defensively. Two independent layers:
 * 1. sanitizeEmailHtml() (DOMPurify) strips script tags, event handlers,
 *    javascript: URIs, forms, and other executable/dangerous content.
 * 2. The sanitized markup is rendered inside a sandboxed <iframe> with only
 *    "allow-same-origin" (no "allow-scripts") - the single most common
 *    DOMPurify-bypass mitigation, since even a sanitizer bug can't execute
 *    script in a frame the browser refuses to run scripts in at all.
 *    allow-same-origin without allow-scripts is safe: the classic sandbox
 *    escape requires *both* together, and script execution is impossible
 *    here regardless of same-origin DOM access.
 */
export function SafeHtmlEmail({ html }: { html: string }) {
  const sanitized = useMemo(() => sanitizeEmailHtml(html), [html]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8" /><style>${IFRAME_STYLES}</style></head><body>${sanitized}</body></html>`;

  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (doc?.body) {
      setHeight(Math.min(doc.body.scrollHeight + 24, 2000));
    }
  };

  return (
    <iframe
      ref={iframeRef}
      className={styles.frame}
      style={{ height }}
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      title="Message content"
      onLoad={handleLoad}
    />
  );
}
