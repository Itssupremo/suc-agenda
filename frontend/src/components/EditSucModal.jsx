import { useState, useEffect } from 'react';

const REGIONS = ['NCR','1','2','3','4','MIMAROPA','5','6','NIR','7','8','9','10','11','12','CAR','CARAGA','BARMM'];

function EditSucModal({ show, onClose, onSave, suc }) {
  const [form, setForm] = useState({
    sucName: '', abbreviation: '', region: '', address: '', president: '', email: '', contact: '',
    boardSecretaryName: '', boardSecretaryEmail: '', boardSecretaryContact: '',
    dateOfBoardMeeting: '', occCode: '', chedOfficial: '', section: ''
  });

  useEffect(() => {
    if (suc) {
      setForm({
        sucName: suc.sucName || '',
        abbreviation: suc.abbreviation || '',
        region: suc.region || '',
        address: suc.address || '',
        president: suc.president || '',
        email: suc.email || '',
        contact: suc.contact || '',
        boardSecretaryName: suc.boardSecretaryName || '',
        boardSecretaryEmail: suc.boardSecretaryEmail || '',
        boardSecretaryContact: suc.boardSecretaryContact || '',
        dateOfBoardMeeting: suc.dateOfBoardMeeting || '',
        occCode: suc.occCode || '',
        chedOfficial: suc.chedOfficial || '',
        section: suc.section || ''
      });
    }
  }, [suc]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(suc._id, form);
  };

  if (!show || !suc) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header bg-warning">
            <h5 className="modal-title">Edit SUC</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">SUC Name *</label>
                  <input name="sucName" className="form-control" value={form.sucName} onChange={handleChange} required />
                </div>
                <div className="col-12">
                  <label className="form-label">Region *</label>
                  <select name="region" className="form-select" value={form.region} onChange={handleChange} required>
                    <option value="">Select Region</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">President</label>
                  <input name="president" className="form-control" value={form.president} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <label className="form-label">Board Secretary Name</label>
                  <input name="boardSecretaryName" className="form-control" value={form.boardSecretaryName} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <label className="form-label">Board Secretary Email</label>
                  <input name="boardSecretaryEmail" type="email" className="form-control" value={form.boardSecretaryEmail} onChange={handleChange} />
                </div>
                <div className="col-12">
                  <label className="form-label">Date of Board Meeting</label>
                  <input name="dateOfBoardMeeting" type="date" className="form-control" value={form.dateOfBoardMeeting} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-warning">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditSucModal;

