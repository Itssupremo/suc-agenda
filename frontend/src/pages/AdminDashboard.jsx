import { useState, useEffect } from 'react';
import { getSucs, getOccOfficials, getDateBoardMeetings, createDateBoardMeeting, updateDateBoardMeeting, deleteDateBoardMeeting, getAgendaStatusAll } from '../services/api';
import MeetingReminderModal from '../components/MeetingReminderModal';

function AdminDashboard({ user }) {
  const [sucs, setSucs] = useState([]);
  const [officials, setOfficials] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [agendaStatus, setAgendaStatus] = useState([]);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [alert, setAlert] = useState(null);
  const [filterOfficial, setFilterOfficial] = useState('');
  const [filterSuc, setFilterSuc] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const formatDate = (val) => {
    if (!val) return 'â€”';
    const parts = val.split('-');
    if (parts.length === 3) {
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const m = parseInt(parts[1], 10) - 1;
      if (m >= 0 && m < 12) return `${months[m]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
    }
    return val;
  };

  const fetchSucs = async () => {
    try { const res = await getSucs(); setSucs(res.data); } catch {}
  };

  const fetchReminders = async () => {
    try {
      const res = await getDateBoardMeetings();
      setReminders(res.data);
    } catch {
      // silently fail
    }
  };

  const fetchAgendaStatus = async () => {
    try {
      const res = await getAgendaStatusAll();
      setAgendaStatus(res.data);
    } catch {}
  };

  const checkAgendaStatus = (reminder) => {
    if (!reminder.meetingDate) return 'Pending';
    const year = parseInt(reminder.meetingDate.split('-')[0]);
    const title = reminder.title;
    if (title.startsWith('Regular Board Meeting')) {
      const match = title.match(/(1st|2nd|3rd|4th) Quarter/);
      if (!match) return 'Pending';
      return agendaStatus.some(
        (s) => s.type === 'regular' && s.sucAbbreviation === reminder.sucAbbreviation && s.year === year && s.quarter === match[1]
      ) ? 'Uploaded' : 'Pending';
    }
    if (title.startsWith('Special Board Meeting')) {
      const match = title.match(/- (1st|2nd)$/);
      if (!match) return 'Pending';
      return agendaStatus.some(
        (s) => s.type === 'special' && s.sucAbbreviation === reminder.sucAbbreviation && s.year === year && s.slot === match[1]
      ) ? 'Uploaded' : 'Pending';
    }
    return 'Pending';
  };

  const years = [...new Set(reminders.filter(r => r.meetingDate).map(r => r.meetingDate.split('-')[0]))].sort((a, b) => b - a);

  const filteredSucsForFilter = (user?.role === 'superadmin' && filterOfficial)
    ? sucs.filter((s) => s.occCode === filterOfficial)
    : sucs;

  const filteredReminders = reminders.filter((r) => {
    if (user?.role === 'superadmin' && filterOfficial) {
      const sr = sucs.find((s) => s.abbreviation === r.sucAbbreviation);
      if (!sr || sr.occCode !== filterOfficial) return false;
    }
    if (filterSuc && r.sucAbbreviation !== filterSuc) return false;
    if (filterYear && (!r.meetingDate || r.meetingDate.split('-')[0] !== filterYear)) return false;
    return true;
  });

  const handleOfficialFilterChange = (e) => {
    setFilterOfficial(e.target.value);
    setFilterSuc('');
  };

  useEffect(() => {
    fetchSucs();
    fetchReminders();
    fetchAgendaStatus();
    getOccOfficials().then((res) => {
      // admin only sees their own OCC in the modal
      if (user?.role === 'admin' && user?.occCode) {
        setOfficials(res.data.filter((o) => o.code === user.occCode));
      } else {
        setOfficials(res.data);
      }
    }).catch(() => {});
  }, []);

  const showMessage = (type, msg) => {
    setAlert({ type, msg });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleReminderSave = async (data) => {
    try {
      if (selectedReminder) {
        await updateDateBoardMeeting(selectedReminder._id, data);
        showMessage('success', 'Reminder updated');
      } else {
        await createDateBoardMeeting(data);
        showMessage('success', 'Reminder added');
      }
      setShowReminderModal(false);
      setSelectedReminder(null);
      fetchReminders();
    } catch (err) {
      showMessage('danger', err.response?.data?.message || 'Failed to save reminder');
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await deleteDateBoardMeeting(id);
      showMessage('success', 'Reminder deleted');
      fetchReminders();
    } catch {
      showMessage('danger', 'Failed to delete reminder');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Admin Dashboard</h3>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card shadow-sm">
        <div className="card-header d-flex justify-content-between align-items-center bg-primary text-white">
          <h5 className="mb-0"><i className="bi bi-bell-fill me-2"></i>Board Meeting Reminders</h5>
          <button
            className="btn btn-sm btn-light"
            onClick={() => { setSelectedReminder(null); setShowReminderModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>Add Reminder
          </button>
        </div>
        <div className="card-body">
          <div className="row g-2 mb-2">
            {user?.role === 'superadmin' && (
              <div className="col-md-4">
                <select className="form-select form-select-sm" value={filterOfficial} onChange={handleOfficialFilterChange}>
                  <option value="">All CHED Officials</option>
                  {officials.map((o) => (
                    <option key={o.code} value={o.code}>{o.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={user?.role === 'superadmin' ? 'col-md-4' : 'col-md-6'}>
              <select className="form-select form-select-sm" value={filterSuc} onChange={(e) => setFilterSuc(e.target.value)}>
                <option value="">All SUCs</option>
                {filteredSucsForFilter.map((s) => (
                  <option key={s._id} value={s.abbreviation}>{s.abbreviation} — {s.sucName}</option>
                ))}
              </select>
            </div>
            <div className={user?.role === 'superadmin' ? 'col-md-4' : 'col-md-6'}>
              <select className="form-select form-select-sm" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="table-responsive">
            <table className="table table-bordered table-striped table-hover align-middle mb-0">
              <thead className="table-primary">
                <tr>
                  <th>#</th>
                  {user?.role === 'superadmin' && <th>CHED Official</th>}
                  <th>SUC</th>
                  <th>Meeting Date</th>
                  <th>Title</th>
                  <th>Notes</th>
                  <th>E-Agenda Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.length === 0 ? (
                  <tr><td colSpan={user?.role === 'superadmin' ? 8 : 7} className="text-center text-muted py-3">No reminders found</td></tr>
                ) : (
                  filteredReminders.map((r, idx) => {
                    const today = new Date().toISOString().split('T')[0];
                    const isPast = r.meetingDate && r.meetingDate < today;
                    const isToday = r.meetingDate === today;
                    const isUpcoming = r.meetingDate && r.meetingDate > today;
                    const sucRec = sucs.find((s) => s.abbreviation === r.sucAbbreviation);
                    return (
                      <tr key={r._id} className={isToday ? 'table-danger' : isUpcoming ? 'table-warning' : ''}>
                        <td>{idx + 1}</td>
                        {user?.role === 'superadmin' && <td className="small">{sucRec ? sucRec.chedOfficial : '—'}</td>}
                        <td>
                          <strong>{r.sucAbbreviation}</strong>
                          {r.sucName && <div className="small text-muted">{r.sucName}</div>}
                        </td>
                        <td>
                          {formatDate(r.meetingDate)}
                          {isPast && <span className="badge bg-success ms-2">Done</span>}
                          {isToday && <span className="badge bg-danger ms-2">TODAY</span>}
                          {isUpcoming && <span className="badge bg-warning text-dark ms-2">Upcoming</span>}
                        </td>
                        <td>{r.title}</td>
                        <td className="small">{r.notes || '—'}</td>
                        <td>
                          {(() => {
                            const st = checkAgendaStatus(r);
                            return st === 'Uploaded'
                              ? <span className="badge bg-success">Uploaded</span>
                              : <span className="badge bg-secondary">Pending</span>;
                          })()}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-warning"
                              title="Edit"
                              onClick={() => { setSelectedReminder(r); setShowReminderModal(true); }}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              title="Delete"
                              onClick={() => handleDeleteReminder(r._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <MeetingReminderModal
        show={showReminderModal}
        onClose={() => { setShowReminderModal(false); setSelectedReminder(null); }}
        onSave={handleReminderSave}
        record={selectedReminder}
        sucs={sucs}
        officials={officials}
        reminders={reminders}
      />
    </div>
  );
}

export default AdminDashboard;
