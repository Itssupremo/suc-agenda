import { useState, useEffect } from 'react';
import { getDateBoardMeetings, getAgendaStatusAll } from '../services/api';

function UserDashboard({ user }) {
  const [reminders, setReminders] = useState([]);
  const [agendaStatus, setAgendaStatus] = useState([]);
  const [alert, setAlert] = useState(null);
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

  const fetchReminders = async () => {
    try {
      const res = await getDateBoardMeetings();
      setReminders(res.data);
    } catch {
      setAlert({ type: 'danger', msg: 'Failed to load reminders' });
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

  useEffect(() => {
    fetchReminders();
    fetchAgendaStatus();
  }, []);

  const years = [...new Set(reminders.filter(r => r.meetingDate).map(r => r.meetingDate.split('-')[0]))].sort((a, b) => b - a);
  const filteredReminders = filterYear
    ? reminders.filter((r) => r.meetingDate && r.meetingDate.split('-')[0] === filterYear)
    : reminders;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Dashboard</h3>
      </div>

      {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0"><i className="bi bi-bell-fill me-2"></i>Board Meeting Reminders</h5>
        </div>
        <div className="card-body">
          <div className="row g-2 mb-2">
            <div className="col-md-4">
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
                  <th>Title</th>
                  <th>Meeting Date</th>
                  <th>Notes</th>
                  <th>E-Agenda Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReminders.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-muted py-3">No reminders found</td></tr>
                ) : (
                  filteredReminders.map((r, idx) => {
                    const today = new Date().toISOString().split('T')[0];
                    const isPast = r.meetingDate && r.meetingDate < today;
                    const isToday = r.meetingDate === today;
                    const isUpcoming = r.meetingDate && r.meetingDate > today;
                    return (
                      <tr key={r._id} className={isToday ? 'table-danger' : isUpcoming ? 'table-warning' : ''}>
                        <td>{idx + 1}</td>
                        <td>{r.title}</td>
                        <td>
                          {formatDate(r.meetingDate)}
                          {isPast && <span className="badge bg-success ms-2">Done</span>}
                          {isToday && <span className="badge bg-danger ms-2">TODAY</span>}
                          {isUpcoming && <span className="badge bg-warning text-dark ms-2">Upcoming</span>}
                        </td>
                        <td className="small">{r.notes || '—'}</td>
                        <td>
                          {(() => {
                            const st = checkAgendaStatus(r);
                            return st === 'Uploaded'
                              ? <span className="badge bg-success">Uploaded</span>
                              : <span className="badge bg-secondary">Pending</span>;
                          })()}
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
    </div>
  );
}

export default UserDashboard;
