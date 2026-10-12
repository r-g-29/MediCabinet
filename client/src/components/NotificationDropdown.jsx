import { useState, useEffect, useRef } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../api/notifications';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="notification-container" ref={dropdownRef}>
      <button className="notification-bell" onClick={() => setIsOpen(!isOpen)} id="btn-notifications">
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n._id} 
                  className={`notification-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => !n.read && handleMarkAsRead(n._id)}
                >
                  <div className="notification-msg">
                    {n.type === 'expiry' && '⚠️ '}
                    {n.type === 'lowstock' && '📉 '}
                    {n.type === 'dose' && '💊 '}
                    {n.message}
                  </div>
                  <div className="notification-meta-row">
                    <span className="notification-time">
                      {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {n.emailSent ? (
                      <span className="notif-email-tag sent" title={`Email alert delivered to ${n.emailRecipient}`}>
                        ✉️ Emailed
                      </span>
                    ) : n.emailStatus === 'failed' ? (
                      <span className="notif-email-tag failed" title={n.emailError || 'Email delivery failed'}>
                        ⚠️ Email failed
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

