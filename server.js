const express = require('express');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const resources = {
  customers: {
    table: 'customers',
    fields: ['name', 'phone', 'email', 'address'],
    required: ['name', 'phone']
  },
  vehicles: {
    table: 'vehicles',
    fields: ['customer_id', 'vehicle_number', 'vehicle_model', 'vehicle_type'],
    required: ['customer_id', 'vehicle_number', 'vehicle_model']
  },
  services: {
    table: 'services',
    fields: ['vehicle_id', 'service_type', 'service_date', 'description', 'service_charge', 'status'],
    required: ['vehicle_id', 'service_type', 'service_date', 'service_charge', 'status']
  },
  payments: {
    table: 'payments',
    fields: ['service_id', 'amount', 'payment_date', 'payment_method', 'status'],
    required: ['service_id', 'amount', 'payment_date', 'payment_method', 'status']
  }
};

function cleanPayload(resource, body) {
  const cfg = resources[resource];
  if (!cfg) return null;
  const data = {};
  for (const field of cfg.fields) {
    if (body[field] !== undefined) data[field] = body[field] === '' ? null : body[field];
  }
  return data;
}

for (const [resource, cfg] of Object.entries(resources)) {
  const idField = resource === 'customers' ? 'customer_id'
    : resource === 'vehicles' ? 'vehicle_id'
    : resource === 'services' ? 'service_id' : 'payment_id';

  app.get(`/api/${resource}`, async (req, res) => {
    try {
      let sql = `SELECT * FROM ${cfg.table} ORDER BY ${idField} DESC`;
      if (resource === 'vehicles') {
        sql = `SELECT v.*, c.name AS customer_name FROM vehicles v JOIN customers c ON v.customer_id=c.customer_id ORDER BY v.vehicle_id DESC`;
      } else if (resource === 'services') {
        sql = `SELECT s.*, v.vehicle_number, v.vehicle_model, c.name AS customer_name
               FROM services s JOIN vehicles v ON s.vehicle_id=v.vehicle_id
               JOIN customers c ON v.customer_id=c.customer_id ORDER BY s.service_id DESC`;
      } else if (resource === 'payments') {
        sql = `SELECT p.*, s.service_type, v.vehicle_number, c.name AS customer_name
               FROM payments p JOIN services s ON p.service_id=s.service_id
               JOIN vehicles v ON s.vehicle_id=v.vehicle_id
               JOIN customers c ON v.customer_id=c.customer_id ORDER BY p.payment_id DESC`;
      }
      const [rows] = await db.query(sql);
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.code === 'ER_NO_SUCH_TABLE' ? 'Database tables not found. Run database.sql first.' : err.message });
    }
  });

  app.post(`/api/${resource}`, async (req, res) => {
    try {
      const data = cleanPayload(resource, req.body);
      if (!data || cfg.required.some(f => data[f] === undefined || data[f] === null)) {
        return res.status(400).json({ error: 'Please fill in all required fields.' });
      }
      const keys = Object.keys(data);
      const placeholders = keys.map(() => '?').join(', ');
      const [result] = await db.query(
        `INSERT INTO ${cfg.table} (${keys.join(', ')}) VALUES (${placeholders})`,
        keys.map(k => data[k])
      );
      res.status(201).json({ message: 'Record created successfully.', id: result.insertId });
    } catch (err) {
      res.status(400).json({ error: err.code === 'ER_DUP_ENTRY' ? 'That vehicle number is already registered.' : err.message });
    }
  });

  app.put(`/api/${resource}/:id`, async (req, res) => {
    try {
      const data = cleanPayload(resource, req.body);
      if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: 'No fields supplied.' });
      const keys = Object.keys(data);
      const [result] = await db.query(
        `UPDATE ${cfg.table} SET ${keys.map(k => `${k}=?`).join(', ')} WHERE ${idField}=?`,
        [...keys.map(k => data[k]), req.params.id]
      );
      if (!result.affectedRows) return res.status(404).json({ error: 'Record not found.' });
      res.json({ message: 'Record updated successfully.' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.delete(`/api/${resource}/:id`, async (req, res) => {
    try {
      const [result] = await db.query(`DELETE FROM ${cfg.table} WHERE ${idField}=?`, [req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ error: 'Record not found.' });
      res.json({ message: 'Record deleted successfully.' });
    } catch (err) {
      res.status(400).json({ error: 'This record may be linked to another record. Remove its dependent records first.' });
    }
  });
}

app.get('/api/dashboard', async (req, res) => {
  try {
    const [[customers]] = await db.query('SELECT COUNT(*) AS total FROM customers');
    const [[vehicles]] = await db.query('SELECT COUNT(*) AS total FROM vehicles');
    const [[services]] = await db.query('SELECT COUNT(*) AS total FROM services');
    const [[payments]] = await db.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='Paid'");
    const [recent] = await db.query(`
      SELECT s.service_id, s.service_type, s.service_date, s.status,
             v.vehicle_number, c.name AS customer_name
      FROM services s JOIN vehicles v ON s.vehicle_id=v.vehicle_id
      JOIN customers c ON v.customer_id=c.customer_id
      ORDER BY s.service_id DESC LIMIT 6`);
    res.json({ customers: customers.total, vehicles: vehicles.total, services: services.total, revenue: payments.total, recent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Samra Vehicle Service Management System running at http://localhost:${port}`));
