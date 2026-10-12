import { useState, useEffect, useCallback } from 'react';
import { getMedicines, createMedicine, updateMedicine, deleteMedicine, checkDuplicate, searchReference, scanMedicine } from '../../api/medicines';
import { getProfiles } from '../../api/profiles';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/LoadingSpinner';
import './Medicines.css';

const Medicines = () => {
  const { showToast } = useToast();
  const [medicines, setMedicines] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({ profileId: '', status: 'all', search: '' });

  // Autocomplete State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingRef, setIsSearchingRef] = useState(false);
  const [notFoundInRef, setNotFoundInRef] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Duplicate Warning State
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateData, setDuplicateData] = useState([]);
  const [pendingSubmitData, setPendingSubmitData] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    profileId: '',
    name: '',
    genericName: '',
    activeIngredients: '',
    uses: '',
    expiry: '',
    batchNo: '',
    quantity: '',
    threshold: '5',
    price: ''
  });

  // OCR Scan State
  const [showScanner, setShowScanner] = useState(false);
  const [scanFront, setScanFront] = useState(null);
  const [scanBack, setScanBack] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanCandidates, setScanCandidates] = useState([]);
  const [uncertainFields, setUncertainFields] = useState({});
  const [scanError, setScanError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [medRes, profRes] = await Promise.all([
        getMedicines(filters),
        getProfiles()
      ]);
      setMedicines(medRes.data.data);
      setProfiles(profRes.data.data);
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openModal = (med = null) => {
    if (med) {
      setEditingId(med._id);
      setForm({
        profileId: med.profileId?._id || '',
        name: med.name,
        genericName: med.genericName || '',
        activeIngredients: med.activeIngredients ? med.activeIngredients.join(', ') : '',
        uses: med.uses || '',
        expiry: med.expiry ? new Date(med.expiry).toISOString().split('T')[0] : '',
        batchNo: med.batchNo || '',
        quantity: med.quantity.toString(),
        threshold: med.threshold.toString(),
        price: med.price ? med.price.toString() : ''
      });
    } else {
      setEditingId(null);
      setForm({
        profileId: '', name: '', genericName: '', activeIngredients: '',
        uses: '', expiry: '', batchNo: '', quantity: '', threshold: '5', price: ''
      });
    }
    setIsModalOpen(true);
    setError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setShowSuggestions(false);
    setNotFoundInRef(false);
    setShowDuplicateWarning(false);
    setShowDuplicateWarning(false);
    setPendingSubmitData(null);
    setShowScanner(false);
    setScanFront(null);
    setScanBack(null);
    setScanCandidates([]);
    setUncertainFields({});
    setScanError('');
  };

  const handleScanFront = (e) => setScanFront(e.target.files[0]);
  const handleScanBack = (e) => setScanBack(e.target.files[0]);

  const processScan = async () => {
    if (!scanFront) return setScanError('Please select or capture a front photo of the medicine packaging.');
    setScanError('');
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append('images', scanFront);
      if (scanBack) formData.append('images', scanBack);
      
      const res = await scanMedicine(formData);
      const data = res.data.data;
      
      const topMatch = data.candidates && data.candidates.length > 0 ? data.candidates[0] : null;
      const detectedName = topMatch?.name || data.detectedName || '';
      const detectedGeneric = topMatch?.genericName || (topMatch?.name ? topMatch.name : '') || data.detectedIngredients || '';
      const detectedIngredients = topMatch?.activeIngredients
        ? (Array.isArray(topMatch.activeIngredients) ? topMatch.activeIngredients.join(', ') : topMatch.activeIngredients)
        : (topMatch?.composition ? (Array.isArray(topMatch.composition) ? topMatch.composition.join(', ') : topMatch.composition) : (data.detectedIngredients || ''));
      const detectedUses = topMatch?.uses || data.detectedUses || '';
      const detectedExpiry = data.expiry ? data.expiry.split('T')[0] : '';
      const detectedBatchNo = data.batchNo || '';

      const newUncertain = {};
      if (!detectedExpiry) newUncertain.expiry = true;
      if (!detectedBatchNo) newUncertain.batchNo = true;
      if (!detectedName) newUncertain.name = true;

      setForm(prev => ({
        ...prev,
        name: detectedName || prev.name,
        genericName: detectedGeneric || prev.genericName,
        activeIngredients: detectedIngredients || prev.activeIngredients,
        uses: detectedUses || prev.uses,
        expiry: detectedExpiry || prev.expiry,
        batchNo: detectedBatchNo || prev.batchNo
      }));

      setUncertainFields(newUncertain);
      setScanCandidates(data.candidates || []);
      setShowScanner(false);

      if (detectedName) {
        showToast(`Detected "${detectedName}"! Form auto-filled.`, 'success');
      } else if (detectedExpiry || detectedBatchNo) {
        showToast('Packaging scanned! Expiry and batch detected.', 'success');
      } else {
        showToast('Packaging scanned. Text extracted — please verify details.', 'info');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to scan image. Please enter details manually.';
      setScanError(msg);
      showToast(msg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, name: value }));
    setNotFoundInRef(false);
    
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchTimeout) clearTimeout(searchTimeout);
    
    setSearchTimeout(setTimeout(async () => {
      setIsSearchingRef(true);
      try {
        const res = await searchReference(value);
        setSuggestions(res.data.data);
        setShowSuggestions(true);
        if (res.data.data.length === 0) {
          setNotFoundInRef(true);
        }
      } catch (err) {
        console.error("Failed to search reference", err);
      } finally {
        setIsSearchingRef(false);
      }
    }, 300));
  };

  const selectSuggestion = (suggestion) => {
    const ingredients = suggestion.activeIngredients || suggestion.composition;
    setForm(prev => ({
      ...prev,
      name: suggestion.name,
      genericName: suggestion.genericName || suggestion.name,
      activeIngredients: Array.isArray(ingredients) ? ingredients.join(', ') : (ingredients || ''),
      uses: suggestion.uses || prev.uses
    }));
    setShowSuggestions(false);
    setNotFoundInRef(false);
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e, forceSave = false) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const activeIngredientsList = form.activeIngredients 
          ? form.activeIngredients.split(',').map(i => i.trim()).filter(i => i)
          : [];

      const payload = {
        ...form,
        profileId: form.profileId || null,
        activeIngredients: activeIngredientsList,
        quantity: parseInt(form.quantity),
        threshold: parseInt(form.threshold),
        price: form.price ? parseFloat(form.price) : null,
      };

      if (!forceSave && !editingId) {
        const dupRes = await checkDuplicate({
          profileId: payload.profileId,
          activeIngredients: activeIngredientsList
        });
        
        if (dupRes.data.data && dupRes.data.data.length > 0) {
          setDuplicateData(dupRes.data.data);
          setPendingSubmitData(payload);
          setShowDuplicateWarning(true);
          setIsSubmitting(false);
          return;
        }
      }

      if (editingId) {
        await updateMedicine(editingId, pendingSubmitData || payload);
        showToast('Medicine updated successfully', 'success');
      } else {
        await createMedicine(pendingSubmitData || payload);
        showToast('Medicine added to cabinet', 'success');
      }
      
      await fetchData();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save medicine';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
      if (forceSave) {
        setPendingSubmitData(null);
        setShowDuplicateWarning(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await deleteMedicine(id);
      setMedicines(medicines.filter((m) => m._id !== id));
      showToast('Medicine deleted', 'info');
    } catch (err) {
      showToast('Failed to delete medicine', 'error');
    }
  };

  return (
    <div className="medicines-page">
      <div className="medicines-header">
        <div>
          <h1>Medicine Cabinet</h1>
          <p>Track inventory, expiration dates, and low stock</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          + Add Medicine
        </button>
      </div>

      <div className="card medicines-filters">
        <div className="filter-group">
          <label>Search</label>
          <input 
            type="text" 
            name="search" 
            placeholder="Search name, generic, uses..." 
            value={filters.search} 
            onChange={handleFilterChange} 
          />
        </div>
        <div className="filter-group">
          <label>Profile</label>
          <select name="profileId" value={filters.profileId} onChange={handleFilterChange}>
            <option value="">All Family Members</option>
            {profiles.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">All</option>
            <option value="ok">Valid (OK)</option>
            <option value="expiring">Expiring Soon</option>
            <option value="expired">Expired</option>
            <option value="lowstock">Low Stock</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner fullPage />
      ) : (
        <div className="medicines-grid">
          {medicines.map((med) => (
            <div className="card medicine-card" key={med._id}>
              <div className="med-header">
                <div>
                  <div className="med-title">{med.name}</div>
                  {med.genericName && <div className="med-generic">{med.genericName}</div>}
                  <div className="med-badges">
                    <span className={`badge ${med.status}`}>{med.status}</span>
                    {med.quantity <= med.threshold && <span className="badge lowstock">Low Stock</span>}
                    {med.profileId && <span className="badge profile">{med.profileId.name}</span>}
                  </div>
                </div>
                <div className="med-actions">
                  <button className="btn-icon" onClick={() => openModal(med)} title="Edit">✏️</button>
                  <button className="btn-icon danger" onClick={() => handleDelete(med._id)} title="Delete">🗑️</button>
                </div>
              </div>

              <div className="med-details">
                <div className="med-detail-row">
                  <span className="med-label">Qty Left:</span>
                  <span className="med-value">{med.quantity} (Alert at {med.threshold})</span>
                </div>
                <div className="med-detail-row">
                  <span className="med-label">Expiry:</span>
                  <span className="med-value">{new Date(med.expiry).toLocaleDateString()}</span>
                </div>
                {med.uses && (
                  <div className="med-detail-row">
                    <span className="med-label">Uses:</span>
                    <span className="med-value">{med.uses}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {medicines.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">💊</div>
              <h3 className="empty-state-title">No medicines found</h3>
              <p className="empty-state-desc">
                {filters.search || filters.status !== 'all' || filters.profileId
                  ? 'No medicines match the selected filters. Try clearing filters or searching for something else.'
                  : 'Your medicine cabinet is empty. Add your medicines to track stock, expiry dates, and schedules.'}
              </p>
              <button className="btn btn-primary" onClick={() => openModal()}>
                + Add First Medicine
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content medicine-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="medicine-modal-header">
              <div>
                <h2 className="medicine-modal-title">{editingId ? 'Edit Medicine' : 'Add Medicine'}</h2>
                <p className="medicine-modal-sub">
                  {editingId ? 'Update medicine inventory and dosage details' : 'Enter medicine details or scan packaging to auto-fill'}
                </p>
              </div>
              <div className="modal-header-actions">
                {!editingId && !showScanner && (
                  <button 
                    type="button" 
                    className="btn-scan-header" 
                    onClick={() => setShowScanner(true)}
                    title="Scan medicine packaging using AI OCR"
                  >
                    <span>📷</span> Scan Packaging (AI)
                  </button>
                )}
                <button type="button" className="btn-modal-close" onClick={closeModal} title="Close">
                  ✕
                </button>
              </div>
            </div>

            {showDuplicateWarning && (
              <div className="alert alert-warning compact-alert">
                <div className="compact-alert-title">⚠️ Duplicate Active Ingredients Detected</div>
                <p>The following medicines share ingredients with this entry:</p>
                <ul>
                  {duplicateData.map(d => (
                    <li key={d._id}>{d.name} (Qty: {d.quantity})</li>
                  ))}
                </ul>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => handleSubmit(null, true)} disabled={isSubmitting}>
                    Save Anyway
                  </button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowDuplicateWarning(false)}>
                    Review
                  </button>
                </div>
              </div>
            )}

            {scanCandidates.length > 0 && !showScanner && !editingId && (
              <div className="scan-matches-bar">
                <span className="scan-matches-label">Detected matches:</span>
                <div className="scan-matches-pills">
                  {scanCandidates.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`pill-candidate ${form.name.toLowerCase() === c.name.toLowerCase() ? 'active' : ''}`}
                      onClick={() => selectSuggestion(c)}
                      title={`Select ${c.name}`}
                    >
                      {c.name} {c.confidence ? `(${c.confidence}%)` : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showScanner ? (
              <div className="scanner-compact-container">
                {scanError && <div className="alert alert-error compact-alert">{scanError}</div>}
                
                <div className="scanner-dropzone-grid">
                  <div className="scanner-dropzone">
                    <label className="scanner-label">Front Packaging Photo *</label>
                    <input 
                      type="file" 
                      id="scan-front-input"
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleScanFront} 
                      className="scanner-file-input"
                    />
                    <label htmlFor="scan-front-input" className={`scanner-upload-box ${scanFront ? 'has-file' : ''}`}>
                      <span className="scanner-icon">{scanFront ? '✓' : '📷'}</span>
                      <span className="scanner-filename">{scanFront ? scanFront.name : 'Select or capture Front photo'}</span>
                      <span className="scanner-hint">Shows brand name, strength, salts</span>
                    </label>
                  </div>

                  <div className="scanner-dropzone">
                    <label className="scanner-label">Back / Side Photo (Optional)</label>
                    <input 
                      type="file" 
                      id="scan-back-input"
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleScanBack} 
                      className="scanner-file-input"
                    />
                    <label htmlFor="scan-back-input" className={`scanner-upload-box ${scanBack ? 'has-file' : ''}`}>
                      <span className="scanner-icon">{scanBack ? '✓' : '📷'}</span>
                      <span className="scanner-filename">{scanBack ? scanBack.name : 'Select or capture Back photo'}</span>
                      <span className="scanner-hint">Shows Batch No., Expiry date, MRP</span>
                    </label>
                  </div>
                </div>

                <div className="scanner-actions">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={processScan} 
                    disabled={isScanning || !scanFront}
                  >
                    {isScanning ? 'Scanning packaging with AI...' : '🔍 Extract Details with OCR'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    onClick={() => setShowScanner(false)} 
                    disabled={isScanning}
                  >
                    Back to Form
                  </button>
                </div>
              </div>
            ) : (
              <>
                {error && <div className="alert alert-error compact-alert">{error}</div>}

                <form onSubmit={handleSubmit} className="medicine-form-grid">
                  {/* Row 1: Name and Generic */}
                  <div className="med-form-col col-6 relative">
                    <label className="med-form-label">
                      Medicine Name <span className="req">*</span>
                    </label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="e.g. Paracetamol 500mg, Dolo 650, Augmentin" 
                      value={form.name} 
                      onChange={handleNameChange} 
                      onFocus={() => form.name.length >= 2 && setShowSuggestions(true)} 
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                      required 
                      autoComplete="off" 
                      className={uncertainFields.name ? 'input-uncertain' : ''}
                    />
                    {isSearchingRef && <span className="ref-searching-text">Searching database...</span>}
                    {notFoundInRef && !isSearchingRef && (
                      <span className="ref-notfound-text">Not in reference database — enter details manually</span>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                      <ul className="suggestions-dropdown">
                        {suggestions.map(s => (
                          <li key={s._id} onMouseDown={() => selectSuggestion(s)}>
                            <div className="sugg-name">{s.name}</div>
                            {s.composition && s.composition.length > 0 && (
                              <div className="sugg-comp">{Array.isArray(s.composition) ? s.composition.join(', ') : s.composition}</div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="med-form-col col-6">
                    <label className="med-form-label">Generic Name</label>
                    <input 
                      type="text" 
                      name="genericName" 
                      placeholder="e.g. Acetaminophen, Amoxicillin + Clavulanic Acid" 
                      value={form.genericName} 
                      onChange={handleChange} 
                    />
                  </div>

                  {/* Row 2: Active Ingredients and Uses */}
                  <div className="med-form-col col-6">
                    <label className="med-form-label">Active Ingredients (comma separated)</label>
                    <input 
                      type="text" 
                      name="activeIngredients" 
                      placeholder="e.g. Paracetamol 650mg, Caffeine 30mg" 
                      value={form.activeIngredients} 
                      onChange={handleChange} 
                    />
                  </div>

                  <div className="med-form-col col-6">
                    <label className="med-form-label">Primary Uses</label>
                    <input 
                      type="text" 
                      name="uses" 
                      placeholder="e.g. Fever, Headache, Joint Pain, Bacterial Infection" 
                      value={form.uses} 
                      onChange={handleChange} 
                    />
                  </div>

                  {/* Row 3: Profile, Expiry, Batch No */}
                  <div className="med-form-col col-4">
                    <label className="med-form-label">Assign to Profile</label>
                    <select name="profileId" value={form.profileId} onChange={handleChange}>
                      <option value="">-- General / Everyone --</option>
                      {profiles.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>

                  <div className="med-form-col col-4">
                    <label className="med-form-label">
                      Expiry Date <span className="req">*</span>
                    </label>
                    <input 
                      type="date" 
                      name="expiry" 
                      value={form.expiry} 
                      onChange={handleChange} 
                      required 
                      className={uncertainFields.expiry ? 'input-uncertain' : ''}
                    />
                  </div>

                  <div className="med-form-col col-4">
                    <label className="med-form-label">Batch No.</label>
                    <input 
                      type="text" 
                      name="batchNo" 
                      placeholder="e.g. B240901, LOT-8821" 
                      value={form.batchNo} 
                      onChange={handleChange} 
                      className={uncertainFields.batchNo ? 'input-uncertain' : ''}
                    />
                  </div>

                  {/* Row 4: Quantity, Alert Threshold, Price */}
                  <div className="med-form-col col-4">
                    <label className="med-form-label">
                      Quantity <span className="req">*</span>
                    </label>
                    <input 
                      type="number" 
                      name="quantity" 
                      placeholder="e.g. 10 (units/tablets)" 
                      value={form.quantity} 
                      onChange={handleChange} 
                      min="0" 
                      required 
                    />
                  </div>

                  <div className="med-form-col col-4">
                    <label className="med-form-label">Alert Threshold</label>
                    <input 
                      type="number" 
                      name="threshold" 
                      placeholder="e.g. 5 (alert when low)" 
                      value={form.threshold} 
                      onChange={handleChange} 
                      min="0" 
                    />
                  </div>

                  <div className="med-form-col col-4">
                    <label className="med-form-label">Price (₹)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      name="price" 
                      placeholder="e.g. 45.00" 
                      value={form.price} 
                      onChange={handleChange} 
                      min="0" 
                    />
                  </div>

                  {/* Footer actions */}
                  <div className="medicine-modal-actions">
                    <button type="button" className="btn btn-ghost" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : editingId ? 'Update Medicine' : 'Save to Cabinet'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
