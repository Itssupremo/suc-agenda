import { useState, useEffect } from 'react';

const QUARTERS = [
  'Regular Board Meeting - 1st Quarter',
  'Regular Board Meeting - 2nd Quarter',
  'Regular Board Meeting - 3rd Quarter',
  'Regular Board Meeting - 4th Quarter',
  'Special Board Meeting - 1st',
  'Special Board Meeting - 2nd',
];

const LOCATION_OPTIONS = [
  { value: '4F_CHED', label: '4/F CHED OCDRA Board Room' },
  { value: 'SUC_CAMPUS', label: 'SUC Campus' },
  { value: 'OTHERS', label: 'Others' },
];

const MEETING_TYPE_OPTIONS = [
  { value: 'Face-to-Face', label: 'Face-to-Face' },
  { value: 'Online', label: 'Online' },
  { value: 'Hybrid', label: 'Hybrid' },
];

function MeetingReminderModal({ show, onClose, onSave, record, sucs, officials, reminders }) {
  const [occFilter, setOccFilter] = useState('');
  const [form, setForm] = useState({
    sucAbbreviation: '',
    sucName: '',
    meetingDate: '',
    meetingTime: '',
    title: '',
    notes: '',
    meetingType: '',
    locationMode: '',
    locationCampus: '',
    locationOthers: '',
  });

  const filteredSucs = occFilter ? sucs.filter((s) => s.occCode === occFilter) : [];

  const usedQuarters = reminders
    .filter((r) => r.sucAbbreviation === form.sucAbbreviation && (!record || r._id !== record._id))
    .map((r) => r.title);

  const availableQuarters = QUARTERS.filter((q) => !usedQuarters.includes(q));

  const resolveLocation = (f = form) => {
    if (f.meetingType === 'Online') return 'Virtual (Zoom Meeting)';
    if (f.locationMode === '4F_CHED') return '4/F CHED OCDRA Board Room';
    if (f.locationMode === 'SUC_CAMPUS') {
      const campus = (f.locationCampus || '').trim();
      const name = (f.sucName || '').trim();
      return campus ? `${name}, ${campus}` : name;
    }
    if (f.locationMode === 'OTHERS') return (f.locationOthers || '').trim();
    return '';
  };

  const parseLocation = (loc, sucName) => {
    if (!loc) return { locationMode: '', locationCampus: '', locationOthers: '' };
    if (loc === 'Virtual (Zoom Meeting)') return { locationMode: '', locationCampus: '', locationOthers: '' };
    if (loc === '4/F CHED OCDRA Board Room') return { locationMode: '4F_CHED', locationCampus: '', locationOthers: '' };
    if (sucName && loc.startsWith(sucName)) {
      const after = loc.slice(sucName.length).replace(/^,\s*/, '');
      return { locationMode: 'SUC_CAMPUS', locationCampus: after, locationOthers: '' };
    }
    return { locationMode: 'OTHERS', locationCampus: '', locationOthers: loc };
  };

  useEffect(() => {
    if (show) {
      if (record) {
        const suc = sucs.find((s) => s.abbreviation === record.sucAbbreviation);
        setOccFilter(suc?.occCode || '');
        const locParsed = parseLocation(record.location || '', record.sucName || '');
        setForm({
          sucAbbreviation: record.sucAbbreviation || '',
          sucName: record.sucName || '',
          meetingDate: record.meetingDate || '',
          meetingTime: record.meetingTime || '',
          title: record.title || '',
          notes: record.notes || '',
          meetingType: record.meetingType || '',
          locationMode: locParsed.locationMode,
          locationCampus: locParsed.locationCampus,
          locationOthers: locParsed.locationOthers,
        });
      } else {
        setOccFilter('');
        setForm({
          sucAbbreviation: '', sucName: '', meetingDate: '', meetingTime: '',
          title: '', notes: '', meetingType: '', locationMode: '', locationCampus: '', locationOthers: '',
        });
      }
    }
  }, [record, show]);

  const handleOccChange = (e) => {
    setOccFilter(e.target.value);
    setForm((f) => ({ ...f, sucAbbreviation: '', sucName: '', title: '', locationCampus: '' }));
  };

  const handleSucChange = (e) => {
    const abbr = e.target.value;
    const suc = sucs.find((s) => s.abbreviation === abbr);
    setForm((f) => ({ ...f, sucAbbreviation: abbr, sucName: suc ? suc.sucName : '', title: '', locationCampus: '' }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const next = { ...f, [name]: value };
      if (name === 'meetingType' && value === 'Online') {
        next.locationMode = '';
        next.locationCampus = '';
        next.locationOthers = '';
      }
      if (name === 'locationMode') {
        next.locationCampus = '';
        next.locationOthers = '';
      }
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const location = resolveLocation(form);
    onSave({
      sucAbbreviation: form.sucAbbreviation,
      sucName: form.sucName,
      meetingDate: form.meetingDate,
      meetingTime: form.meetingTime,
      title: form.title,
      notes: form.notes,
      meetingType: form.meetingType,
      location,
    });
  };

  if (!show) return null;

  const titleOptions = record && form.title && !availableQuarters.includes(form.title)
    ? [form.title, ...availableQuarters]
    : availableQuarters;

  const isOnline = form.meetingType === 'Online';
  const showLocationDropdown = !isOnline && form.meetingType !== '';
  const showCampusInput = showLocationDropdown && form.locationMode === 'SUC_CAMPUS';
  const showOthersInput = showLocationDropdown && form.locationMode === 'OTHERS';
  const locationPreview = isOnline ? 'Virtual (Zoom Meeting)' : resolveLocation(form);

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-bell-fill me-2" />
              {record ? 'Edit' : 'Add'} Board Meeting Reminder
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose} />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">

                {/* CHED Official */}
                <div className="col-12">
                  <label className="form-label fw-semibold">CHED Official *</label>
                  <select className="form-select" value={occFilter} onChange={handleOccChange} required>
                    <option value="">— Select CHED Official —</option>
                    {(officials || []).map((o) => (
                      <option key={o.code} value={o.code}>{o.name}</option>
                    ))}
                  </select>
                </div>

                {/* SUC */}
                <div className="col-12">
                  <label className="form-label fw-semibold">SUC *</label>
                  <select
                    className="form-select"
                    value={form.sucAbbreviation}
                    onChange={handleSucChange}
                    required
                    disabled={!occFilter}
                  >
                    <option value="">
                      {occFilter ? '— Select SUC —' : 'Select CHED Official first'}
                    </option>
                    {filteredSucs.map((s) => (
                      <option key={s._id} value={s.abbreviation}>
                        {s.sucName}{s.abbreviation ? ` (${s.abbreviation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quarter */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Quarter *</label>
                  <select
                    name="title"
                    className="form-select"
                    value={form.title}
                    onChange={handleChange}
                    required
                    disabled={!form.sucAbbreviation}
                  >
                    <option value="">
                      {!form.sucAbbreviation
                        ? 'Select SUC first'
                        : titleOptions.length === 0
                          ? 'All quarters already set'
                          : '— Select Quarter —'}
                    </option>
                    {titleOptions.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  {form.sucAbbreviation && availableQuarters.length === 0 && !record && (
                    <div className="form-text text-danger">
                      All quarters have been set for this SUC.
                    </div>
                  )}
                </div>

                {/* Meeting Date + Time side by side */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-calendar3 me-1" style={{ color: 'var(--accent)' }} />
                    Meeting Date *
                  </label>
                  <input
                    name="meetingDate"
                    type="date"
                    className="form-control"
                    value={form.meetingDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-clock me-1" style={{ color: 'var(--accent)' }} />
                    Meeting Time *
                  </label>
                  <input
                    name="meetingTime"
                    type="time"
                    className="form-control"
                    value={form.meetingTime}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Meeting Type + Location side by side */}
                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-camera-video me-1" style={{ color: 'var(--accent)' }} />
                    Meeting Type *
                  </label>
                  <select
                    name="meetingType"
                    className="form-select"
                    value={form.meetingType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">— Select Meeting Type —</option>
                    {MEETING_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-geo-alt me-1" style={{ color: 'var(--accent)' }} />
                    Location *
                  </label>

                  {isOnline ? (
                    <div
                      className="form-control d-flex align-items-center gap-2"
                      style={{ background: '#f0f9ff', border: '1.5px solid #bae6fd', color: '#0369a1', fontWeight: 600, cursor: 'not-allowed', userSelect: 'none' }}
                    >
                      <i className="bi bi-camera-video-fill" style={{ color: '#0284c7' }} />
                      Virtual (Zoom Meeting)
                    </div>
                  ) : (
                    <select
                      name="locationMode"
                      className="form-select"
                      value={form.locationMode}
                      onChange={handleChange}
                      required={form.meetingType !== ''}
                      disabled={form.meetingType === ''}
                    >
                      <option value="">
                        {form.meetingType === '' ? 'Select Meeting Type first' : '— Select Location —'}
                      </option>
                      {LOCATION_OPTIONS.map((l) => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 4/F CHED confirmation banner */}
                {showLocationDropdown && form.locationMode === '4F_CHED' && (
                  <div className="col-12">
                    <div
                      className="d-flex align-items-center gap-2 px-3 py-2 rounded"
                      style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      <i className="bi bi-building-check" />
                      Location set to: 4/F CHED OCDRA Board Room
                    </div>
                  </div>
                )}

                {/* SUC Campus input */}
                {showCampusInput && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-building me-1" style={{ color: 'var(--accent)' }} />
                      Campus Name *
                    </label>
                    <div className="input-group">
                      <span
                        className="input-group-text"
                        style={{ fontSize: '0.82rem', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}
                        title={form.sucName}
                      >
                        {form.sucName || 'SUC Name'}
                      </span>
                      <input
                        name="locationCampus"
                        type="text"
                        className="form-control"
                        value={form.locationCampus}
                        onChange={handleChange}
                        placeholder="e.g. Main Campus"
                        required
                      />
                    </div>
                    {locationPreview && (
                      <div className="form-text" style={{ color: 'var(--text-secondary)' }}>
                        <i className="bi bi-pin-map me-1" />
                        Location preview: <strong>{locationPreview}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Others free-text */}
                {showOthersInput && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-pencil me-1" style={{ color: 'var(--accent)' }} />
                      Specify Location *
                    </label>
                    <input
                      name="locationOthers"
                      type="text"
                      className="form-control"
                      value={form.locationOthers}
                      onChange={handleChange}
                      placeholder="Enter the specific location..."
                      required
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="col-12">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    rows="2"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Optional notes or agenda..."
                  />
                </div>

              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check-lg me-1" />Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MeetingReminderModal;
