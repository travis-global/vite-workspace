// src/pages/general/FileLibrary.jsx

import { useEffect, useState } from 'react';
import {
  listFiles,
  uploadFile,
  deleteFile,
  downloadFile,
} from '../../api/endpoints/files';
import styles from './FileLibrary.module.css';

export default function FileLibrary() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [storageTier, setStorageTier] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listFiles({
        category: filterCategory || undefined,
      });
      setRows(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filterCategory]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Choose a file first.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data } = await uploadFile({
        file,
        category: category.trim() || undefined,
        department: department.trim() || undefined,
        storageTier: storageTier || undefined,
      });
      setSuccessMsg(
        'Uploaded. file_id: ' + (data.file_id || '') + ' — copy this for Lead Magnets.'
      );
      setFile(null);
      setCategory('');
      setDepartment('');
      setStorageTier('');
      e.target.reset();
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('Delete this file? Bytes will be removed.')) return;
    try {
      await deleteFile(fileId);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed.');
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      await downloadFile(fileId, filename);
    } catch {
      setError('Download failed.');
    }
  };

  const formatSize = (bytes) => {
    if (bytes == null) return '—';
    const n = Number(bytes);
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>File Library</h1>
        <p className={styles.subtitle}>
          Upload and manage files. Use the returned file_id when creating a Lead Magnet.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Upload</h2>
        <form className={styles.form} onSubmit={handleUpload}>
          <label className={styles.full}>
            File
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>
          <label>
            Category <span className={styles.optional}>(optional)</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. lead_magnet, policy"
            />
          </label>
          <label>
            Department <span className={styles.optional}>(optional)</span>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. marketing"
            />
          </label>
          <label>
            Storage tier <span className={styles.optional}>(optional)</span>
            <select
              value={storageTier}
              onChange={(e) => setStorageTier(e.target.value)}
            >
              <option value="">Auto</option>
              <option value="hot">hot (local)</option>
              <option value="cold">cold (Drive)</option>
            </select>
          </label>
          <button type="submit" disabled={submitting} className={styles.primaryBtn}>
            {submitting ? 'Uploading…' : 'Upload'}
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <div className={styles.listHeader}>
          <h2>Files</h2>
          <input
            className={styles.filter}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="Filter category"
          />
        </div>

        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : rows.length === 0 ? (
          <p className={styles.muted}>No files yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>file_id</th>
                  <th>Category</th>
                  <th>Tier</th>
                  <th>Size</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.file_id}>
                    <td>{row.original_filename}</td>
                    <td className={styles.mono}>{row.file_id}</td>
                    <td>{row.category || '—'}</td>
                    <td>{row.storage_tier}</td>
                    <td>{formatSize(row.size_bytes)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.linkBtn}
                        onClick={() =>
                          handleDownload(row.file_id, row.original_filename)
                        }
                      >
                        Download
                      </button>
                      {' · '}
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(row.file_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
