import { useState, useEffect } from 'react';
import { getSucs, getAgendaStatusAll } from '../services/api';

const QUARTERS = ['1st', '2nd', '3rd', '4th'];
const SPECIAL_SLOTS = ['1st', '2nd'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const OCC_OFFICIALS = [
  { code: 'OCSCA', label: 'Chairperson Shirley C. Agrupis' },
  { code: 'OCDRA', label: 'Commissioner Desiderio R. Apag III' },
  { code: 'OCRPA', label: 'Commissioner Ricmar P. Aquino' },
  { code: 'OCMQM', label: 'Commissioner Myrna Q. Mallari' },
  { code: 'OCMAO', label: 'Commissioner Michelle Aguilar-Ong' },
];

function Analytics({ user }) {
  const [sucs, setSucs] = useState([]);
  const [uploadStatus, setUploadStatus] = useState([]);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const [selectedOfficial, setSelectedOfficial] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sucsRes, statusRes] = await Promise.all([
          getSucs(),
          getAgendaStatusAll(),
        ]);
        setSucs(sucsRes.data);
        setUploadStatus(statusRes.data);
      } catch (err) {
        console.error('Failed to load analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter SUCs based on CHED official
  const filteredSucs = selectedOfficial
    ? sucs.filter((s) => s.occCode === selectedOfficial)
    : sucs;

  const totalSucsCount = filteredSucs.length;
  const filteredSucAbbrevs = new Set(filteredSucs.map((s) => s.abbreviation));

  // Filter upload statuses to only match current year and visible SUCs
  const currentYearStatus = uploadStatus.filter(
    (item) => item.year === selectedYear && filteredSucAbbrevs.has(item.sucAbbreviation)
  );

  // Helper to get stats for a regular board meeting quarter
  const getRegularStats = (quarter) => {
    const uploaded = currentYearStatus.filter(
      (item) => item.type === 'regular' && item.quarter === quarter
    );
    const uploadedAbbrevs = new Set(uploaded.map((u) => u.sucAbbreviation));
    const pendingSucs = filteredSucs.filter((s) => !uploadedAbbrevs.has(s.abbreviation));
    
    return {
      uploadedCount: uploaded.length,
      percentage: totalSucsCount > 0 ? Math.round((uploaded.length / totalSucsCount) * 100) : 0,
      uploadedList: uploaded.map((u) => u.sucAbbreviation).sort(),
      pendingList: pendingSucs.map((s) => s.abbreviation).sort(),
    };
  };

  // Helper to get stats for a special board meeting slot
  const getSpecialStats = (slot) => {
    const uploaded = currentYearStatus.filter(
      (item) => item.type === 'special' && item.slot === slot
    );
    const uploadedAbbrevs = new Set(uploaded.map((u) => u.sucAbbreviation));
    const pendingSucs = filteredSucs.filter((s) => !uploadedAbbrevs.has(s.abbreviation));

    return {
      uploadedCount: uploaded.length,
      percentage: totalSucsCount > 0 ? Math.round((uploaded.length / totalSucsCount) * 100) : 0,
      uploadedList: uploaded.map((u) => u.sucAbbreviation).sort(),
      pendingList: pendingSucs.map((s) => s.abbreviation).sort(),
    };
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5" style={{ minHeight: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-2">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="mb-0">System Analytics Dashboard</h3>
      </div>

      {/* Filters Card */}
      <div className="card shadow-sm mb-4">
        <div className="card-body bg-light">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label mb-1 fw-bold text-secondary" style={{ fontSize: '0.85rem' }}>Select Year</label>
              <select
                className="form-select form-select-sm"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {user?.role === 'superadmin' && (
              <div className="col-md-4">
                <label className="form-label mb-1 fw-bold text-secondary" style={{ fontSize: '0.85rem' }}>Filter by CHED Official</label>
                <select
                  className="form-select form-select-sm"
                  value={selectedOfficial}
                  onChange={(e) => setSelectedOfficial(e.target.value)}
                >
                  <option value="">-- All Officials --</option>
                  {OCC_OFFICIALS.map((o) => (
                    <option key={o.code} value={o.code}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="col-md-5 text-md-end">
              <span className="badge bg-secondary p-2" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-building me-1" />
                Active SUCs in Filter: <strong className="text-white">{totalSucsCount}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white py-2">
              <h5 className="card-title mb-0" style={{ fontSize: '1rem' }}>
                <i className="bi bi-calendar-event me-2" />
                Regular Board Meetings Upload Rates ({selectedYear})
              </h5>
            </div>
            <div className="card-body">
              {QUARTERS.map((q) => {
                const stats = getRegularStats(q);
                return (
                  <div key={q} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-dark">{q} Quarter Agenda</span>
                      <span className="text-muted small">
                        {stats.uploadedCount} / {totalSucsCount} ({stats.percentage}%)
                      </span>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div
                        className="progress-bar bg-success"
                        role="progressbar"
                        style={{ width: `${stats.percentage}%` }}
                        aria-valuenow={stats.percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white py-2">
              <h5 className="card-title mb-0" style={{ fontSize: '1rem' }}>
                <i className="bi bi-calendar-check me-2" />
                Special Board Meetings Upload Rates ({selectedYear})
              </h5>
            </div>
            <div className="card-body">
              {SPECIAL_SLOTS.map((slot) => {
                const stats = getSpecialStats(slot);
                return (
                  <div key={slot} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-dark">{slot} Special Meeting</span>
                      <span className="text-muted small">
                        {stats.uploadedCount} / {totalSucsCount} ({stats.percentage}%)
                      </span>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div
                        className="progress-bar bg-info"
                        role="progressbar"
                        style={{ width: `${stats.percentage}%` }}
                        aria-valuenow={stats.percentage}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed SUC Status list */}
      <h4 className="mt-4 mb-3" style={{ fontSize: '1.2rem', fontWeight: 600 }}>Detailed Upload Lists</h4>
      <div className="row g-4">
        {QUARTERS.map((q) => {
          const stats = getRegularStats(q);
          return (
            <div key={q} className="col-md-6 col-xxl-3">
              <div className="card shadow-sm h-100">
                <div className="card-header bg-dark text-white py-2 d-flex justify-content-between align-items-center">
                  <span className="fw-bold" style={{ fontSize: '0.9rem' }}>Regular: {q} Quarter</span>
                  <span className="badge bg-success">{stats.percentage}%</span>
                </div>
                <div className="card-body py-2 px-3" style={{ fontSize: '0.85rem' }}>
                  <div className="mb-2">
                    <strong className="text-success d-block mb-1">Uploaded ({stats.uploadedCount}):</strong>
                    <div className="d-flex flex-wrap gap-1">
                      {stats.uploadedList.length > 0 ? (
                        stats.uploadedList.map((abbr) => (
                          <span key={abbr} className="badge bg-light text-success border border-success px-2 py-1">
                            {abbr}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted italic">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <strong className="text-danger d-block mb-1">Pending ({stats.pendingList.length}):</strong>
                    <div className="d-flex flex-wrap gap-1">
                      {stats.pendingList.length > 0 ? (
                        stats.pendingList.map((abbr) => (
                          <span key={abbr} className="badge bg-light text-danger border border-danger px-2 py-1">
                            {abbr}
                          </span>
                        ))
                      ) : (
                        <span className="text-success small fw-bold">All Uploaded!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Analytics;
