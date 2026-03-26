import { useState, useEffect } from 'react';

const QUARTERS = [
  'Regular Board Meeting - 1st Quarter',
  'Regular Board Meeting - 2nd Quarter',
  'Regular Board Meeting - 3rd Quarter',
  'Regular Board Meeting - 4th Quarter',
  'Special Board Meeting - 1st',
  'Special Board Meeting - 2nd',
];

function MeetingReminderModal({ show, onClose, onSave, record, sucs, officials, reminders }) {
  const [occFilter, setOccFilter] = useState('');
  const [form, setForm] = useState({
    sucAbbreviation: '', sucName: '', meetingDate: '', title: '', notes: ''
  });

  // SUCs under selected official
  const filteredSucs = occFilter ? sucs.filter((s) => s.occCode === occFilter) : [];

  // Quarters already used for the selected SUC (exclude the record being edited)
  const usedQuarters = reminders
    .filter((r) => r.sucAbbreviation === form.sucAbbreviation && (!record || r._id !== record._id))
    .map((r) => r.title);

  const availableQuarters = QUARTERS.filter((q) => !usedQuarters.includes(q));

  useEffect(() => {
    if (show) {
      if (record) {
        const suc = sucs.find((s) => s.abbreviation === record.sucAbbreviation);
        setOccFilter(suc?.occCode || '');
        setForm({
          sucAbbreviation: record.sucAbbreviation || '',
          sucName: record.sucName || '',
          meetingDate: record.meetingDate || '',
          title: record.title || '',
          notes: record.notes || '',
        });
      } else {
        setOccFilter('');
        setForm({ sucAbbreviation: '', sucName: '', meetingDate: '', title: '', notes: '' });
      }
    }
  }, [record, show]);

  const handleOccChange = (e) => {
    setOccFilter(e.target.value);
    setForm((f) => ({ ...f, sucAbbreviation: '', sucName: '', title: '' }));
  };

  const handleSucChange = (e) => {
    const abbr = e.target.value;
    const suc = sucs.find((s) => s.abbreviation === abbr);
    setForm((f) => ({ ...f, sucAbbreviation: abbr, sucName: suc ? suc.sucName : '', title: '' }));
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  if (!show) return null;

  // When editing, the current title may already be "used" — ensure it's always selectable
  const titleOptions = record && form.title && !availableQuarters.includes(form.title)
    ? [form.title, ...availableQuarters]
    : availableQuarters;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-bell-fill me-2"></i>
              {record ? 'Edit' : 'Add'} Board Meeting Reminder
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">CHED Official *</label>
                  <select className="form-select" value={occFilter} onChange={handleOccChange} required>
                    <option value="">— Select CHED Official —</option>
                    {(officials || []).map((o) => (
                      <option key={o.code} value={o.code}>{o.name}</option>
                    ))}
                  </select>
                </div>
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
                          ? 'All 4 quarters already set'
                          : '— Select Quarter —'}
                    </option>
                    {titleOptions.map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  {form.sucAbbreviation && availableQuarters.length === 0 && !record && (
                    <div className="form-text text-danger">
                      All 4 quarters have been set for this SUC.
                    </div>
                  )}
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Meeting Date *</label>
                  <input
                    name="meetingDate"
                    type="date"
                    className="form-control"
                    value={form.meetingDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    rows="2"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Optional notes or agenda..."
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">
                <i className="bi bi-check-lg me-1"></i>Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MeetingReminderModal;

