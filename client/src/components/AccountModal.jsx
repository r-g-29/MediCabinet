import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { updateMe } from '../api/auth';
import './AccountModal.css';

const AccountModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security'
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Active Member';

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateMe({ name: name.trim() });
      updateUser(res.data.data);
      addToast('Account profile updated successfully!', 'success');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
      addToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updateMe({ currentPassword, newPassword });
      addToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
      addToast(err.response?.data?.message || 'Failed to change password.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="account-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="account-modal-header">
          <div className="account-modal-title-row">
            <div className="account-modal-icon-badge">👤</div>
            <div>
              <h3>Manage Account Info</h3>
              <p className="account-modal-subtitle">View and update your personal details and security</p>
            </div>
          </div>
          <button
            className="account-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Hero / Summary */}
        <div className="account-hero-card">
          <div className="account-hero-avatar">{initials}</div>
          <div className="account-hero-info">
            <h4 className="account-hero-name">{user?.name}</h4>
            <span className="account-hero-email">{user?.email}</span>
            <div className="account-hero-tags">
              <span className="account-tag primary">Account Owner</span>
              <span className="account-tag subtle">Member since {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="account-modal-tabs">
          <button
            className={`account-tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => { setActiveTab('details'); setError(''); }}
            type="button"
          >
            📝 General Details
          </button>
          <button
            className={`account-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => { setActiveTab('security'); setError(''); }}
            type="button"
          >
            🔒 Password & Security
          </button>
        </div>

        {error && <div className="account-error-banner">⚠️ {error}</div>}

        {/* Tab 1: General Details */}
        {activeTab === 'details' && (
          <form onSubmit={handleSaveDetails} className="account-form">
            <div className="form-group">
              <label htmlFor="acc-name">Full Name</label>
              <input
                id="acc-name"
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="acc-email">Email Address</label>
              <input
                id="acc-email"
                type="email"
                className="form-control disabled-input"
                value={user?.email || ''}
                readOnly
                disabled
              />
              <span className="form-helper">
                Email is verified and linked to your MediCabinet account.
              </span>
            </div>

            <div className="account-shortcuts-box">
              <span className="shortcuts-title">Family Profiles & Cabinet</span>
              <p className="shortcuts-desc">
                Need to manage family member medical profiles, prescriptions, or allergies?
              </p>
              <button
                type="button"
                className="btn-link-action"
                onClick={() => {
                  onClose();
                  navigate('/profiles');
                }}
              >
                Go to Family Profiles →
              </button>
            </div>

            <div className="account-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || name === user?.name}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Password & Security */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="account-form">
            <div className="form-group">
              <label htmlFor="acc-curr-pass">Current Password</label>
              <input
                id="acc-curr-pass"
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="acc-new-pass">New Password</label>
              <input
                id="acc-new-pass"
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="acc-conf-pass">Confirm New Password</label>
              <input
                id="acc-conf-pass"
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                required
              />
            </div>

            <div className="account-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountModal;
