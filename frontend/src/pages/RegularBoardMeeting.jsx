import { useState, useEffect, useRef } from 'react';
import { getSucs, getAgendas, uploadAgendaFiles, resetAgenda } from '../services/api';
import PdfViewer from '../components/PdfViewer';

const QUARTERS = ['1st', '2nd', '3rd', '4th'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const OCC_OFFICIALS = [
  { code: 'OCSCA', label: 'Chairperson Shirley C. Agrupis' },
  { code: 'OCDRA', label: 'Commissioner Desiderio R. Apag III' },
  { code: 'OCRPA', label: 'Commissioner Ricmar P. Aquino' },
  { code: 'OCMQM', label: 'Commissioner Myrna Q. Mallari' },
  { code: 'OCMAO', label: 'Commissioner Michelle Aguilar-Ong' },
];

const getLeaderLine = (user) => {
  if (!user) return 'the Commission on Higher Education';
  if (user.role === 'admin')
    return `${user.occCode === 'OCSCA' ? 'Chairperson' : 'Commissioner'} ${user.fullname}`;
  if (user.role === 'superadmin') return `Administrator ${user.fullname}`;
  return user.fullname;
};

// ── Drag-and-drop file zone ──────────────────────────────────────────────────
function DropZone({ label, file, onFile }) {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type === 'application/pdf') onFile(f);
  };

  return (
    <div className="mb-3">
      <p className="agenda-upload-label mb-1">{label}</p>
      <div
        className={`agenda-dropzone${dragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {file ? (
          <span className="agenda-dropzone-file">
            <i className="bi bi-file-earmark-pdf-fill text-danger me-1" />
            {file.name}
          </span>
        ) : (
          <span className="agenda-dropzone-hint">
            <i className="bi bi-upload me-1" />
            Drag &amp; drop PDF here or click to browse
          </span>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files[0]) onFile(e.target.files[0]); }}
        />
      </div>
    </div>
  );
}

// ── PDF viewer modal ─────────────────────────────────────────────────────────
// ── Single quarter card ──────────────────────────────────────────────────────
function QuarterCard({ quarter, agendaDoc, sucId, sucName, year, onRefresh, onViewFile }) {
  const [agendaFile, setAgendaFile] = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [resetting,  setResetting]  = useState(false);
  const [msg,        setMsg]        = useState(null);

  useEffect(() => { setAgendaFile(null); setMsg(null); }, [sucId, year]);

  const flash = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleUpdate = async () => {
    if (!agendaFile) return flash('warning', 'Please select a PDF file.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('year', year);
      fd.append('sucName', sucName);
      fd.append('newAgenda', agendaFile);
      await uploadAgendaFiles(sucId, quarter, fd);
      setAgendaFile(null);
      flash('success', 'File updated successfully.');
      onRefresh();
    } catch (err) {
      flash('danger', err.response?.data?.message || 'Upload failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Reset ${quarter} Quarter e-Agenda file for this SUC?`)) return;
    setResetting(true);
    try {
      await resetAgenda(sucId, quarter, year);
      setOldFile(null);
      setNewFile(null);
      flash('success', 'Quarter files reset.');
      onRefresh();
    } catch (err) {
      flash('danger', err.response?.data?.message || 'Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  const currentFile = agendaDoc?.newAgenda?.filename || null;

  const handleView = () => {
    if (!agendaDoc?._id) return;
    const token = localStorage.getItem('token');
    const url = `/api/agendas/file/${agendaDoc._id}/new?token=${token}`;
    onViewFile(url, `${quarter} Quarter — e-Agenda Folder`);
  };

  return (
    <div className="agenda-quarter-card">
      {/* Yellow header */}
      <div className="agenda-quarter-header">
        <span className="agenda-quarter-title">{quarter} Quarter</span>
        <span className="agenda-badge">
          File: {currentFile ? currentFile.replace(/\.[^.]+$/, '').slice(0, 20) : 'none'}
        </span>
      </div>

      {/* White body */}
      <div className="agenda-quarter-body">
        {/* Current file row */}
        <div className="agenda-current-row">
          <div>
            <span className="agenda-current-label">Current e-Agenda Folder:</span>
            {currentFile ? (
              <button className="agenda-file-link btn btn-link p-0 ms-1" onClick={handleView}>
                {currentFile}
              </button>
            ) : (
              <span className="agenda-current-empty ms-1">—</span>
            )}
          </div>
        </div>

        {msg && (
          <div className={`alert alert-${msg.type} py-1 px-2 mb-2`} style={{ fontSize: '0.82rem' }}>
            {msg.text}
          </div>
        )}

        <DropZone label="Upload e-Agenda Folder (PDF)" file={agendaFile} onFile={setAgendaFile} />

        <div className="d-flex gap-2 mt-2">
          <button
            className="btn agenda-btn-update flex-fill"
            onClick={handleUpdate}
            disabled={saving || resetting}
          >
            {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
            Update File
          </button>
          <button
            className="btn agenda-btn-reset flex-fill"
            onClick={handleReset}
            disabled={saving || resetting}
          >
            {resetting ? <span className="spinner-border spinner-border-sm me-1" /> : null}
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
function RegularBoardMeeting({ user }) {
  const [year,       setYear]       = useState(CURRENT_YEAR);
  const [sucs,       setSucs]       = useState([]);
  const [selectedSuc, setSelectedSuc] = useState('');
  const [occFilter,  setOccFilter]  = useState('');
  const [agendas,    setAgendas]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [pdfModal,   setPdfModal]   = useState({ open: false, url: '', title: '' });
  const isUser = user?.role === 'user';

  const filteredSucs = occFilter ? sucs.filter((s) => s.occCode === occFilter) : sucs;

  const openPdf = (url, title) => setPdfModal({ open: true, url, title });
  const closePdf = () => setPdfModal({ open: false, url: '', title: '' });

  useEffect(() => {
    getSucs()
      .then((res) => {
        const list = res.data;
        setSucs(list);
        // Auto-select the user's own SUC
        if (user?.role === 'user' && user?.sucAbbreviation) {
          const match = list.find((s) => s.abbreviation === user.sucAbbreviation);
          if (match) setSelectedSuc(match._id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchAgendas = async () => {
    if (!selectedSuc) return setAgendas([]);
    setLoading(true);
    try {
      const res = await getAgendas(selectedSuc, year);
      setAgendas(res.data);
    } catch {
      setAgendas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgendas(); }, [selectedSuc, year]);

  const getDoc = (quarter) => agendas.find((a) => a.quarter === quarter) || null;
  const selectedSucName = sucs.find((s) => s._id === selectedSuc)?.sucName || '';

  return (
    <div>
      {/* Hero banner */}
      <div className="agenda-hero mb-4">
        <h4 className="agenda-hero-title">E-Agenda System</h4>
        <p className="agenda-hero-desc">
          Efficiently manage and upload the SUC Order of Business e-Management through this platform.
          It provides authorized users with a secure, centralized system for organizing, tracking, and
          accessing official SUC meeting agenda items, ensuring accuracy, transparency, and
          accountability under the leadership of {getLeaderLine(user)}.
        </p>
      </div>

      {/* Filters */}
      <div className="agenda-filters card mb-4">
        <div className="card-body d-flex flex-wrap gap-3 align-items-end">
          <div className="agenda-filter-group">
            <label className="form-label mb-1">Year</label>
            <select
              className="form-select agenda-select"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {user?.role === 'superadmin' && (
            <div className="agenda-filter-group">
              <label className="form-label mb-1">CHED Official</label>
              <select
                className="form-select agenda-select"
                value={occFilter}
                onChange={(e) => { setOccFilter(e.target.value); setSelectedSuc(''); }}
              >
                <option value="">-- All Officials --</option>
                {OCC_OFFICIALS.map((o) => (
                  <option key={o.code} value={o.code}>{o.label}</option>
                ))}
              </select>
            </div>
          )}
          {isUser ? (
            <div className="agenda-filter-group flex-fill">
              <label className="form-label mb-1">SUC</label>
              <input
                className="form-control agenda-select"
                value={sucs.find((s) => s._id === selectedSuc)?.sucName || 'Loading...'}
                readOnly
              />
            </div>
          ) : (
            <div className="agenda-filter-group flex-fill">
              <label className="form-label mb-1">SUC Name</label>
              <select
                className="form-select agenda-select"
                value={selectedSuc}
                onChange={(e) => setSelectedSuc(e.target.value)}
              >
                <option value="">-- Select SUC --</option>
                {filteredSucs.map((s) => (
                  <option key={s._id} value={s._id}>{s.sucName}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h2 className="agenda-page-title text-center mb-4">Regular Board Meeting Agenda</h2>

      {/* Quarter grid */}
      {!selectedSuc ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-calendar3 fs-2 d-block mb-2" />
          Select a SUC to view its agenda files.
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" />
        </div>
      ) : (
        <div className="agenda-quarters-grid">
          {QUARTERS.map((q) => (
            <QuarterCard
              key={q}
              quarter={q}
              agendaDoc={getDoc(q)}
              sucId={selectedSuc}
              sucName={selectedSucName}
              year={year}
              onRefresh={fetchAgendas}
              onViewFile={openPdf}
            />
          ))}
        </div>
      )}

      {pdfModal.open && (
        <PdfViewer url={pdfModal.url} title={pdfModal.title} onClose={closePdf} />
      )}
    </div>
  );
}

export default RegularBoardMeeting;
