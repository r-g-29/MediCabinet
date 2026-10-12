// LoadingSpinner – animated spinner for loading states
import './LoadingSpinner.css';

const LoadingSpinner = ({ fullPage = false }) => (
  <div className={`spinner-wrapper ${fullPage ? 'spinner-fullpage' : ''}`}>
    <div className="spinner" aria-label="Loading…" />
  </div>
);

export default LoadingSpinner;
