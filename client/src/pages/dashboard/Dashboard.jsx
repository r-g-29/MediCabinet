// Dashboard – home page with live stats, Today's Doses, and Analytics
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTodayDoses, logDose } from '../../api/schedules';
import { getStatsSummary, getStatsAdherence, getStatsWaste } from '../../api/stats';
import LoadingSpinner from '../../components/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const [stats, setStats] = useState({ totalMedicines: '–', expiringSoon: '–', expired: '–', lowStock: '–' });
  const [adherenceData, setAdherenceData] = useState([]);
  const [wasteData, setWasteData] = useState([]);
  const [totalWaste, setTotalWaste] = useState(0);
  
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, adhRes, wasteRes, doseRes] = await Promise.all([
        getStatsSummary(),
        getStatsAdherence(30),
        getStatsWaste(),
        getTodayDoses()
      ]);
      setStats(sumRes.data.data);
      setAdherenceData(adhRes.data.data);
      setWasteData(wasteRes.data.data.monthly);
      setTotalWaste(wasteRes.data.data.totalWastedPrice);
      setDoses(doseRes.data.data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleLog = async (dose, status) => {
    const key = `${dose.scheduleId}|${dose.time}`;
    setLoggingId(key);
    try {
      const res = await logDose({
        scheduleId: dose.scheduleId,
        scheduledFor: dose.scheduledFor,
        status,
      });
      const updatedQty = res.data.data?.updatedQuantity;
      setDoses(prev => prev.map(d =>
        d.scheduleId === dose.scheduleId && d.time === dose.time
          ? {
              ...d,
              status,
              medicine: updatedQty != null ? { ...d.medicine, quantity: updatedQty } : d.medicine
            }
          : d
      ));
      // Refresh adherence charts
      getStatsAdherence(30).then(res => setAdherenceData(res.data.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log dose');
    } finally {
      setLoggingId(null);
    }
  };

  const groupedDoses = doses.reduce((acc, dose) => {
    const name = dose.profile?.name || 'General';
    if (!acc[name]) acc[name] = [];
    acc[name].push(dose);
    return acc;
  }, {});

  const STATS_CONFIG = [
    { icon: '💊', label: 'Total Medicines', key: 'totalMedicines', colorClass: 'stat-icon-blue' },
    { icon: '⚠️', label: 'Expiring Soon',   key: 'expiringSoon',   colorClass: 'stat-icon-yellow' },
    { icon: '🛑', label: 'Expired',          key: 'expired',        colorClass: 'stat-icon-red' },
    { icon: '📉', label: 'Low Stock',        key: 'lowStock',       colorClass: 'stat-icon-purple' },
  ];


  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>
            {greeting},{' '}
            <span className="greeting-name">{user?.name?.split(' ')[0] ?? 'there'}</span> 👋
          </h1>
          <p>Here's an overview of your family's medicine cabinet</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/emergency')}>
          🚨 Emergency Info
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {STATS_CONFIG.map(({ icon, label, key, colorClass }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${colorClass}`}>{icon}</div>
            <div className="stat-info">
              <div className="stat-value">{stats[key]}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Adherence (Last 30 Days)</h3>
          {adherenceData.length === 0 ? (
            <p className="chart-empty">No dose logs found.</p>
          ) : (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={adherenceData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" fontSize={12} tick={{ fill: '#6b7280' }} />
                  <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem' }} />
                  <Legend />
                  <Bar dataKey="taken" fill="#059669" name="Taken" stackId="a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missed" fill="#dc2626" name="Missed" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        <div className="chart-card">
          <h3>Wasted Spend (Expired) - Total: ₹{totalWaste.toFixed(2)}</h3>
          {wasteData.length === 0 ? (
            <p className="chart-empty">No expired medicines recorded.</p>
          ) : (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={wasteData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="label" fontSize={12} tick={{ fill: '#6b7280' }} />
                  <YAxis fontSize={12} tick={{ fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem' }} />
                  <Legend />
                  <Line type="monotone" dataKey="cost" stroke="#dc2626" name="Cost (₹)" strokeWidth={2.5} dot={{ fill: '#dc2626', r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Today's Doses */}
      <div className="today-section">
        <h2>💊 Today's Doses</h2>
        {doses.length === 0 ? (
          <div className="dashboard-welcome" style={{ marginTop: '1rem' }}>
            <h2>No doses scheduled for today</h2>
            <p>Create a schedule to start tracking doses for your family members.</p>
            <div className="welcome-actions">
              <Link to="/schedules" className="btn btn-primary">Create Schedule</Link>
            </div>
          </div>
        ) : (
          Object.entries(groupedDoses).map(([personName, personDoses]) => (
            <div className="dose-group" key={personName}>
              <div className="dose-group-name">👤 {personName}</div>
              {personDoses.map(dose => {
                const key = `${dose.scheduleId}|${dose.time}`;
                const isLogging = loggingId === key;
                const isDone = dose.status === 'taken' || dose.status === 'missed';

                return (
                  <div className={`dose-row ${dose.status}`} key={key}>
                    <div className="dose-info">
                      <div className="dose-med-name">{dose.medicine?.name}</div>
                      <div className="dose-time">🕐 {dose.time}</div>
                      {dose.status === 'taken' && dose.medicine?.quantity != null && (
                        <div className="dose-qty">📦 {dose.medicine.quantity} left</div>
                      )}
                    </div>
                    <div className="dose-btns">
                      {isDone ? (
                        <span className={`dose-status-badge ${dose.status}`}>
                          {dose.status === 'taken' ? '✓ Taken' : '⚠ Skipped'}
                        </span>
                      ) : (
                        <>
                          <button
                            className="btn-taken"
                            disabled={isLogging}
                            onClick={() => handleLog(dose, 'taken')}
                          >
                            {isLogging ? '…' : '✓ Taken'}
                          </button>
                          <button
                            className="btn-skip"
                            disabled={isLogging}
                            onClick={() => handleLog(dose, 'missed')}
                          >
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Dashboard;
