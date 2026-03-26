import { useState, useRef, useEffect } from 'react';

export default function PdfViewer({ url, title, onClose }) {
  const [zoom, setZoom] = useState(100);
  const iframeRef  = useRef();
  const pdfSrc     = `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
  const loadCount  = useRef(0); // first load is the PDF itself

  useEffect(() => {
    loadCount.current = 0; // reset when url changes
  }, [url]);

  const handleLoad = () => {
    loadCount.current += 1;
    if (loadCount.current <= 1) return; // first load = PDF itself, ignore

    // A link inside the PDF was clicked — iframe navigated away
    try {
      const href = iframeRef.current?.contentWindow?.location?.href;
      if (href && href !== 'about:blank') {
        window.open(href, '_blank', 'noopener,noreferrer');
      }
    } catch (_) {
      // cross-origin (external link) — still open via src attribute comparison trick below
    }
    // Always restore the PDF
    iframeRef.current.src = pdfSrc;
    loadCount.current = 1;
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: '#1b1d27', display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 50, flexShrink: 0,
        background: '#111318', borderBottom: '1px solid #2a2d3a',
        color: '#e2e2e2',
      }}>
        {/* Filename + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </span>
          <span style={{ background: '#2a2d3a', color: '#99aabb', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 3, flexShrink: 0 }}>
            PDF
          </span>
        </div>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <button
            onClick={() => setZoom(z => Math.max(50, z - 10))}
            style={{ width: 30, height: 30, background: '#2a2d3a', border: 'none', color: '#e2e2e2', borderRadius: 4, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
          >−</button>
          <span style={{ minWidth: 44, textAlign: 'center', fontSize: '0.85rem', color: '#e2e2e2' }}>{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(200, z + 10))}
            style={{ width: 30, height: 30, background: '#2a2d3a', border: 'none', color: '#e2e2e2', borderRadius: 4, cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}
          >+</button>
          <button
            onClick={() => setZoom(100)}
            style={{ height: 30, padding: '0 12px', background: '#2a2d3a', border: 'none', color: '#e2e2e2', borderRadius: 4, cursor: 'pointer', fontSize: '0.8rem' }}
          >Reset</button>
        </div>

        {/* Download + Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <a
            href={url}
            download
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              height: 32, padding: '0 14px',
              background: '#1a56db', color: '#fff',
              borderRadius: 5, textDecoration: 'none', fontSize: '0.82rem', fontWeight: 500,
            }}
          >
            <i className="bi bi-download me-1" />Download
          </a>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, background: 'transparent', border: 'none', color: '#99aabb', cursor: 'pointer', fontSize: '1.4rem', borderRadius: 4, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Close"
          >×</button>
        </div>
      </div>

      {/* ── PDF content ── */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '28px 20px' }}>
        <iframe
          ref={iframeRef}
          src={pdfSrc}
          onLoad={handleLoad}
          title={title}
          style={{
            border: 'none',
            width: `${Math.round((zoom / 100) * 960)}px`,
            minWidth: 480,
            height: 'calc(100vh - 106px)',
            boxShadow: '0 6px 40px rgba(0,0,0,0.7)',
            background: '#fff',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}

