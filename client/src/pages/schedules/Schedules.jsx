import { useState, useEffect, useCallback } from 'react';
import { getMedicines } from '../../api/medicines';
import { getProfiles } from '../../api/profiles';
import {
  getSchedules, createSchedule, updateSchedule, deleteSchedule
} from '../../api/schedules';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Schedules.css';

const toDateInput = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

const Schedules = () => {
  const { showToast } = useToast();
  const [schedules, setSchedules]   = useState([]);
  const [medicines, setMedicines]   = useState([]);
  const [profiles, setProfiles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Time picker state
  const [timeInput, setTimeInput] = useState('08:00');

  const [form, setForm] = useState({
    medicineId: '',
    profileId:  '',
    times:      [],
    startDate:  toDateInput(new Date()),
    endDate:    '',
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, medRes, profRes] = await Promise.all([
        getSchedules(), getMedicines({}), getProfiles()
      ]);
      setSchedules(schedRes.data.data);
      setMedicines(medRes.data.data);
      setProfiles(profRes.data.data);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = () => {
    setForm({ medicineId: '', profileId: '', times: [], startDate: toDateInput(new Date()), endDate: '' });
    setTimeInput('08:00');
    setError('');
    setIsModalOpen(true);
  };
  const closeModal = () => setIsModalOpen(false);

  const addTime = () => {
    if (!timeInput) return;
    if (form.times.includes(timeInput)) return;
    setForm(prev => ({ ...prev, times: [...prev.times, timeInput].sort() }));
  };

  const removeTime = (t) =>
    setForm(prev => ({ ...prev, times: prev.times.filter(x => x !== t) }));

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.times.length) { setError('Add at least one dose time'); return; }
    setIsSubmitting(true);
    setError('');
    try {
      await createSchedule({
        ...form,
        endDate: form.endDate || null,
      });
      await fetchAll();
      closeModal();
      showToast('Schedule created successfully', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create schedule';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleActive = async (schedule) => {
    try {
      await updateSchedule(schedule._id, { active: !schedule.active });
      await fetchAll();
      showToast(schedule.active ? 'Schedule paused' : 'Schedule activated', 'info');
    } catch {
      showToast('Failed to update schedule', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await deleteSchedule(id);
      setSchedules(prev => prev.filter(s => s._id !== id));
      showToast('Schedule deleted', 'info');
    } catch {
      showToast('Failed to delete schedule', 'error');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="schedules-page">
      <div className="schedules-header">
        <div>
          <h1>📅 Dose Schedules</h1>
          <p>Set up daily reminders for each family member's medicines</p>
        </div>
        <button className="btn btn-primary" id="btn-add-schedule" onClick={openModal}>
          + New Schedule
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="schedule-list">
      {schedules.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">🗓️</div>
            <h3 className="empty-state-title">No dose schedules yet</h3>
            <p className="empty-state-desc">
              Create a schedule to start automatically tracking daily doses for your family members and receive reminders.
            </p>
            <button className="btn btn-primary" onClick={openModal}>+ New Schedule</button>
          </div>
        )}
        {schedules.map(s => (
          <div className={`schedule-card ${s.active ? '' : 'inactive'}`} key={s._id}>
            <div className="schedule-info">
              <div className="schedule-name">💊 {s.medicineId?.name}</div>
              <div className="schedule-sub">👤 {s.profileId?.name} · Qty left: {s.medicineId?.quantity}</div>
              <div className="schedule-times">
                {s.times.map(t => <span className="time-chip" key={t}>🕐 {t}</span>)}
              </div>
              <div className="schedule-dates">
                From {toDateInput(s.startDate)}{s.endDate ? ` to ${toDateInput(s.endDate)}` : ' · ongoing'}
              </div>
            </div>
            <div className="schedule-actions">
              <span className={s.active ? 'badge-active' : 'badge-inactive'}>
                {s.active ? 'Active' : 'Inactive'}
              </span>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
                onClick={() => toggleActive(s)}
                id={`btn-toggle-${s._id}`}
              >
                {s.active ? 'Deactivate' : 'Activate'}
              </button>
              <button className="btn-icon danger" onClick={() => handleDelete(s._id)} title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Schedule Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">New Dose Schedule</h2>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} className="schedule-form">
              <div className="form-group">
                <label className="form-label">Family Member *</label>
                <select name="profileId" value={form.profileId} onChange={handleChange} required>
                  <option value="">-- Select --</option>
                  {profiles.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Medicine *</label>
                <select name="medicineId" value={form.medicineId} onChange={handleChange} required>
                  <option value="">-- Select --</option>
                  {medicines.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name}{m.profileId ? ` (${m.profileId.name})` : ''} · Qty: {m.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Dose Times *</label>
                <div className="times-input-row">
                  <input
                    type="time"
                    value={timeInput}
                    onChange={e => setTimeInput(e.target.value)}
                    id="time-picker"
                  />
                  <button type="button" className="btn btn-ghost" style={{ padding: '4px 12px' }} onClick={addTime}>
                    + Add
                  </button>
                </div>
                <div className="schedule-times" style={{ marginTop: '0.5rem' }}>
                  {form.times.map(t => (
                    <span className="time-tag" key={t}>
                      🕐 {t}
                      <button type="button" onClick={() => removeTime(t)}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date (optional)</label>
                  <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" id="btn-save-schedule" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
