import { useState, useEffect } from 'react';
import { getProfiles, createProfile, updateProfile, deleteProfile } from '../../api/profiles';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Profiles.css';

const Profiles = () => {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', age: '', relation: '', allergies: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfiles = async () => {
    try {
      const res = await getProfiles();
      setProfiles(res.data.data);
    } catch (err) {
      setError('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const openModal = (profile = null) => {
    if (profile) {
      setEditingId(profile._id);
      setForm({
        name: profile.name,
        age: profile.age || '',
        relation: profile.relation || '',
        allergies: profile.allergies ? profile.allergies.join(', ') : '',
      });
    } else {
      setEditingId(null);
      setForm({ name: '', age: '', relation: '', allergies: '' });
    }
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Process allergies into array
      const allergiesArray = form.allergies
        ? form.allergies.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
        : [];

      const payload = {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        allergies: allergiesArray,
      };

      if (editingId) {
        await updateProfile(editingId, payload);
        showToast('Profile updated successfully', 'success');
      } else {
        await createProfile(payload);
        showToast('New profile created', 'success');
      }
      
      await fetchProfiles();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save profile';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      await deleteProfile(id);
      setProfiles(profiles.filter((p) => p._id !== id));
      showToast('Profile deleted', 'info');
    } catch (err) {
      showToast('Failed to delete profile', 'error');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="profiles-page">
      <div className="profiles-header">
        <div>
          <h1>Family Profiles</h1>
          <p>Manage family members and their medical details</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Add Profile
        </button>
      </div>

      {error && !isModalOpen && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div className="profiles-grid">
        {profiles.map((profile) => (
          <div className="card profile-card" key={profile._id}>
            <div className="profile-card-header">
              <div>
                <div className="profile-name">{profile.name}</div>
                <div className="profile-relation">{profile.relation || 'No relation specified'}</div>
              </div>
              <div className="profile-actions">
                <button className="btn-icon" onClick={() => openModal(profile)} title="Edit">
                  ✏️
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(profile._id)} title="Delete">
                  🗑️
                </button>
              </div>
            </div>

            <div className="profile-details">
              {profile.age && (
                <div className="detail-row">
                  <span className="detail-label">Age:</span>
                  <span className="detail-value">{profile.age} years</span>
                </div>
              )}
              
              <div className="detail-row">
                <span className="detail-label">Allergies:</span>
                <span className="detail-value">
                  {profile.allergies && profile.allergies.length > 0 ? (
                    <div className="allergy-tags">
                      {profile.allergies.map((allergy, i) => (
                        <span key={i} className="allergy-tag">{allergy}</span>
                      ))}
                    </div>
                  ) : (
                    'None recorded'
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state-icon">👨‍👩‍👧</div>
            <h3 className="empty-state-title">No family profiles yet</h3>
            <p className="empty-state-desc">
              Create profiles for family members to manage their medicines, allergies, and daily dosage schedules.
            </p>
            <button className="btn btn-primary" onClick={() => openModal()}>
              + Add Family Profile
            </button>
          </div>
        )}
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">{editingId ? 'Edit Profile' : 'Add Profile'}</h2>
            
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Relation</label>
                <input
                  type="text"
                  name="relation"
                  value={form.relation}
                  onChange={handleChange}
                  placeholder="e.g. Self, Spouse, Child"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Age</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="e.g. 35"
                  min="0"
                  max="150"
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">Allergies (comma separated)</label>
                <input
                  type="text"
                  name="allergies"
                  value={form.allergies}
                  onChange={handleChange}
                  placeholder="e.g. Penicillin, Peanuts"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profiles;
