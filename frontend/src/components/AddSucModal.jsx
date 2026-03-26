import { useState, useEffect } from 'react';
import { getOccOfficials } from '../services/api';

const REGIONS = ['NCR','1','2','3','4','MIMAROPA','5','6','NIR','7','8','9','10','11','12','CAR','CARAGA','BARMM'];

function AddSucModal({ show, onClose, onSave, allowedSections }) {
  const [officials, setOfficials] = useState([]);
  const [form, setForm] = useState({
    sucName: '', abbreviation: '', region: '', address: '', president: '', email: '', contact: '',
    boardSecretaryName: '', boardSecretaryEmail: '', boardSecretaryContact: '',
    dateOfBoardMeeting: '', occCode: '', chedOfficial: '', section: ''
  });

  useEffect(() => {
    getOccOfficials().then((res) => setOfficials(res.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    if (e.target.name === 'occCode') {
      const off = officials.find((o) => o.code === e.target.value);
      if (off) {
        updated.chedOfficial = off.name;
        updated.section = off.section;
      }
    }
    setForm(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    setForm({ sucName: '', abbreviation: '', region: '', address: '', president: '', email: '', contact: '',
      boardSecretaryName: '', boardSecretaryEmail: '', boardSecretaryContact: '',
      dateOfBoardMeeting: '', occCode: '', chedOfficial: '', section: '' });
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">Add SUC</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label">SUC Name *</label>
                  <input name="sucName" className="form-control" value={form.sucName} onChange={handleChange} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Abbreviation</label>
                  <input name="abbreviation" className="form-control" value={form.abbreviation} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Region *</label>
                  <select name="region" className="form-select" value={form.region} onChange={handleChange} required>
                    <option value="">Select Region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Address</label>
                  <input name="address" className="form-control" value={form.address} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">President</label>
                  <input name="president" className="form-control" value={form.president} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">President Email</label>
                  <input name="email" className="form-control" value={form.email} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">President Contact</label>
                  <input name="contact" className="form-control" value={form.contact} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Board Secretary</label>
                  <input name="boardSecretaryName" className="form-control" value={form.boardSecretaryName} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Board Sec. Email</label>
                  <input name="boardSecretaryEmail" className="form-control" value={form.boardSecretaryEmail} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Board Sec. Contact</label>
                  <input name="boardSecretaryContact" className="form-control" value={form.boardSecretaryContact} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Date of Board Meeting</label>
                  <input name="dateOfBoardMeeting" type="date" className="form-control" value={form.dateOfBoardMeeting} onChange={handleChange} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">OCC Code *</label>
                  <select name="occCode" className="form-select" value={form.occCode} onChange={handleChange} required>
                    <option value="">Select OCC</option>
                    {officials
                      .filter((o) => !allowedSections || allowedSections.includes(o.section))
                      .map((o) => (
                      <option key={o.code} value={o.code}>{o.code} — {o.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label">CHED Official</label>
                  <input name="chedOfficial" className="form-control" value={form.chedOfficial} readOnly />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Section</label>
                  <input name="section" className="form-control" value={form.section} readOnly />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add SUC</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddSucModal;
