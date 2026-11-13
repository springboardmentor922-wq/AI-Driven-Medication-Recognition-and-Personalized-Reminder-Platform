import { useState } from 'react';
import { ScanLine, UploadCloud, FileText, AlertTriangle, Save, Sparkles } from 'lucide-react';
import api from '../services/api';

const emptyDetails = {
  medicineName: '',
  dosage: '',
  activeIngredient: '',
  packQuantity: '',
  frequency: '',
  instructions: '',
  quantityPerDose: '1',
  frequencyPerDay: '1',
  stock: ''
};

export default function Scanner() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [details, setDetails] = useState(emptyDetails);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  async function scan(e) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setError('');
    setMessage('');
    setResult(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/ocr', body);
      setResult(data);
      const ai = data.medicineDetails || {};
      setDetails({
        ...emptyDetails,
        medicineName: ai.medicineName || '',
        dosage: ai.dosage || '',
        activeIngredient: ai.activeIngredient || '',
        packQuantity: ai.packQuantity ?? '',
        frequency: ai.frequency || '',
        instructions: ai.instructions || '',
        stock: ai.packQuantity ?? ''
      });
      if (!data.medicineDetails && data.groqError) {
        setMessage('AI extraction was unavailable. OCR text is shown; enter the medicine details manually.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'OCR service unavailable');
    } finally {
      setBusy(false);
    }
  }

  function update(field, value) {
    setDetails(current => ({ ...current, [field]: value }));
  }

  async function saveMedicine(e) {
    e.preventDefault();
    if (!details.medicineName.trim()) {
      setError('Enter or verify the medicine name before saving.');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      await api.post('/medicines', {
        name: details.medicineName.trim(),
        dosage: details.dosage.trim(),
        activeIngredient: details.activeIngredient.trim(),
        packQuantity: details.packQuantity === '' ? null : Number(details.packQuantity),
        stock: details.stock === '' ? 0 : Number(details.stock),
        quantityPerDose: Number(details.quantityPerDose || 1),
        frequencyPerDay: Number(details.frequencyPerDay || 1),
        category: 'Other',
        schedule: [],
        notes: [
          details.frequency ? `Prescription frequency (verify): ${details.frequency}` : '',
          details.instructions ? `Label instructions: ${details.instructions}` : '',
          'Added from OCR; user verification required.'
        ].filter(Boolean).join('\\n')
      });
      setMessage('Verified medicine saved to your medication database.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save medicine. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">PYTHON + GROQ VISION</span>
          <h1>Medicine scanner<span className="period">.</span></h1>
          <p>Extract label details, verify them, then save the medicine.</p>
        </div>
      </div>
      <div className="scanner-layout">
        <form className="panel scanner-panel" onSubmit={scan}>
          <div className="upload-icon"><ScanLine size={25} /></div>
          <h3>Upload an image</h3>
          <p className="muted">Choose a clear JPG or PNG. Maximum 5 MB.</p>
          <label className="upload-zone">
            <UploadCloud size={28} />
            <b>{file ? file.name : 'Click to choose an image'}</b>
            <small>Medicine packaging or prescription</small>
            <input type="file" accept="image/*" onChange={e => { setFile(e.target.files?.[0] || null); setResult(null); setMessage(''); }} />
          </label>
          <button className="primary-btn full" disabled={!file || busy}>
            {busy ? 'Analysing image…' : 'Extract medicine details'}
          </button>
          {error && <div className="error-box">{error}</div>}
          {message && <div className="notice">{message}</div>}
        </form>

        <div className="panel result-panel">
          <div className="panel-head">
            <div><h3>Recognition result</h3><p>AI/OCR suggestions must be checked manually</p></div>
            <FileText className="muted-icon" />
          </div>
          {!result ? (
            <div className="empty-state">Recognition result appears here after upload.</div>
          ) : (
            <>
              <div className="warning-note"><AlertTriangle size={17} />{result.notice}</div>
              <pre className="ocr-text">{result.text || 'No text detected by OCR.'}</pre>
              {result.medicineDetails && (
                <form className="ocr-verify-form" onSubmit={saveMedicine}>
                  <h4><Sparkles size={16} /> Verify extracted medicine details</h4>
                  <label>Medicine name *
                    <input value={details.medicineName} onChange={e => update('medicineName', e.target.value)} required />
                  </label>
                  <div className="form-grid">
                    <label>Strength / dosage
                      <input value={details.dosage} onChange={e => update('dosage', e.target.value)} placeholder="e.g. 5 mg" />
                    </label>
                    <label>Active ingredient
                      <input value={details.activeIngredient} onChange={e => update('activeIngredient', e.target.value)} />
                    </label>
                    <label>Pack quantity
                      <input type="number" min="0" value={details.packQuantity} onChange={e => update('packQuantity', e.target.value)} />
                    </label>
                    <label>Current stock
                      <input type="number" min="0" value={details.stock} onChange={e => update('stock', e.target.value)} />
                    </label>
                    <label>Quantity per dose *
                      <input type="number" min="0.01" step="0.01" value={details.quantityPerDose} onChange={e => update('quantityPerDose', e.target.value)} required />
                    </label>
                    <label>Doses per day *
                      <input type="number" min="0.01" step="0.01" value={details.frequencyPerDay} onChange={e => update('frequencyPerDay', e.target.value)} required />
                    </label>
                  </div>
                  <label>Frequency read from image (not assumed)
                    <input value={details.frequency} onChange={e => update('frequency', e.target.value)} placeholder="Not provided / enter from prescription" />
                  </label>
                  <label>Instructions
                    <input value={details.instructions} onChange={e => update('instructions', e.target.value)} />
                  </label>
                  <p className="muted">Dose quantity and doses per day are editable defaults, not AI-confirmed prescription instructions. Verify them from the prescription before saving.</p>
                  <button className="primary-btn full" disabled={saving}><Save size={16} />{saving ? 'Saving…' : 'Confirm and save medicine'}</button>
                </form>
              )}
              {result.groqError && <div className="notice">{result.groqError}. Tesseract text is available for manual entry.</div>}
              {result.possibleMedicineNames?.length > 0 && (
                <>
                  <h4>Recognized text lines</h4>
                  <ul className="ocr-lines">{result.possibleMedicineNames.map((line, i) => <li key={i}>{line}</li>)}</ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
