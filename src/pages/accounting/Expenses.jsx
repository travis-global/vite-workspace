import { useState, useEffect } from 'react';
import { getExpenses, createExpense, deleteExpense, requestDeleteExpense, verifyDeleteExpense } from '../../api/endpoints/accounting';
import styles from './Expenses.module.css';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ description: '', amount: '', category: '', date: '' });
  const [error, setError] = useState('');

  const load = () => getExpenses().then((res) => setExpenses(res.data));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await createExpense({ ...form, amount: parseFloat(form.amount) });
      setForm({ description: '', amount: '', category: '', date: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record expense.');
    }
  };

  const handleDelete = async (id) => {
    await deleteExpense(id);
    load();
  };

  return (
    <div>
      <h1>Expenses</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input placeholder="Description" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input placeholder="Amount" type="number" value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <input placeholder="Category" value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })} />
        <input type="date" value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        <button type="submit">Add Expense</button>
      </form>
      {error && <div className={styles.error}>{error}</div>}

      <table className={styles.table}>
        <thead>
          <tr><th>Description</th><th>Category</th><th>Date</th><th className={styles.num}>Amount</th><th></th></tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.expense_id}>
              <td>{exp.description}</td>
              <td>{exp.category || '—'}</td>
              <td>{exp.date}</td>
              <td className={`${styles.num} money`}><span className="symbol">₦</span>{exp.amount.toLocaleString()}</td>
              <td><button onClick={() => handleDelete(exp.expense_id)} className={styles.deleteBtn}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
