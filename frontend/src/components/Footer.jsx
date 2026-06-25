function Footer() {
  return (
    <footer className="app-footer mt-auto" style={{ background: '#111827', color: '#f8fafc', padding: '48px 20px 40px', textAlign: 'center' }}>
      <div className="d-flex align-items-center justify-content-center gap-4 mb-4">
        <img src="/ched-logo.png" alt="CHED" style={{ height: 64 }} />
        <img src="/bp-logo-white.png" alt="Bagong Pilipinas" style={{ height: 64 }} />
      </div>
      <h4 className="fw-bold mb-3" style={{ letterSpacing: '0.5px' }}>e-Agenda System</h4>
      <p className="mb-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: '1.6' }}>
        Commission on Higher Education — Official e-Agenda for managing<br />
        State Universities and Colleges information.
      </p>
      <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap mt-2">
        <span className="badge rounded-pill" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '6px 16px', fontWeight: 500, fontSize: '0.75rem' }}>Official</span>
        <span className="badge rounded-pill" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '6px 16px', fontWeight: 500, fontSize: '0.75rem' }}>Transparent</span>
        <span className="badge rounded-pill" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '6px 16px', fontWeight: 500, fontSize: '0.75rem' }}>Service-Oriented</span>
      </div>
    </footer>
  );
}

export default Footer;
