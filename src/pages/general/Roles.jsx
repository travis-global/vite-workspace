// src/pages/general/Roles.jsx

import { useEffect, useState } from 'react';
import {
  listRoles,
  createRole,
  deleteRole,
  assignRole,
  unassignRole,
  getUserRoles,
} from '../../api/endpoints/roles';
import styles from './Roles.module.css';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [department, setDepartment] = useState('');
  const [assignRoleId, setAssignRoleId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [lookupUserId, setLookupUserId] = useState('');
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await listRoles();
      setRoles(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await createRole({
        roleName: roleName.trim(),
        department: department.trim(),
      });
      setRoleName('');
      setDepartment('');
      setSuccessMsg('Role created.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Create failed (admin only).');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm('Delete this role? Users will lose it.')) return;
    try {
      await deleteRole(roleId);
      setSuccessMsg('Role deleted.');
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Delete failed.');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await assignRole(Number(assignRoleId), assignUserId.trim());
      setSuccessMsg('Role assigned.');
      setAssignUserId('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Assign failed.');
    }
  };

  const handleUnassign = async (e) => {
    e.preventDefault();
    try {
      await unassignRole(Number(assignRoleId), assignUserId.trim());
      setSuccessMsg('Role unassigned.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unassign failed.');
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    try {
      const { data } = await getUserRoles(lookupUserId.trim());
      setUserRoles(data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Lookup failed.');
      setUserRoles([]);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Roles Management</h1>
        <p className={styles.subtitle}>
          Create roles, assign them to users, and look up who holds what. Admin only.
        </p>
      </header>

      {error && <div className={styles.error}>{error}</div>}
      {successMsg && <div className={styles.success}>{successMsg}</div>}

      <section className={styles.card}>
        <h2>Create role</h2>
        <form className={styles.form} onSubmit={handleCreate}>
          <label>
            Role name
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              required
              placeholder="e.g. Marketing Lead"
            />
          </label>
          <label>
            Department
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              placeholder="e.g. marketing"
            />
          </label>
          <button type="submit" className={styles.primaryBtn}>
            Create
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>All roles</h2>
        {loading ? (
          <p className={styles.muted}>Loading…</p>
        ) : roles.length === 0 ? (
          <p className={styles.muted}>No roles yet.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.role_id}>
                    <td>{r.role_id}</td>
                    <td>{r.role_name}</td>
                    <td>{r.department}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(r.role_id)}
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

      <section className={styles.card}>
        <h2>Assign / unassign</h2>
        <form className={styles.formRow}>
          <select
            value={assignRoleId}
            onChange={(e) => setAssignRoleId(e.target.value)}
            required
          >
            <option value="">Select role</option>
            {roles.map((r) => (
              <option key={r.role_id} value={r.role_id}>
                {r.role_name} ({r.department})
              </option>
            ))}
          </select>
          <input
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            placeholder="user_id"
            required
          />
          <button type="button" className={styles.primaryBtn} onClick={handleAssign}>
            Assign
          </button>
          <button type="button" className={styles.secondaryBtn} onClick={handleUnassign}>
            Unassign
          </button>
        </form>
      </section>

      <section className={styles.card}>
        <h2>Lookup user roles</h2>
        <form className={styles.formRow} onSubmit={handleLookup}>
          <input
            value={lookupUserId}
            onChange={(e) => setLookupUserId(e.target.value)}
            placeholder="user_id"
            required
          />
          <button type="submit" className={styles.primaryBtn}>
            Lookup
          </button>
        </form>
        {userRoles.length > 0 && (
          <ul className={styles.list}>
            {userRoles.map((r) => (
              <li key={r.role_id}>
                {r.role_name} ({r.department}) — id {r.role_id}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
