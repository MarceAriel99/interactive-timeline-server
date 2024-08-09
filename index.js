const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json())
app.use(cors());
const port = process.env.PORT || 4000;

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

// TODO Use Sequelize framework to handle database operations

/* ----------------------------------------------------------------- 
                              EVENTS
----------------------------------------------------------------- */

// Get all events
app.get('/events', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ev.events');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Get event by id
app.get('/events/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ev.events WHERE id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Delete event by id
app.delete('/events/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ev.events WHERE id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Update event by id
app.put('/events/:id', async (req, res) => {
  try {
    var keys = Object.keys(req.body);

    console.log(keys);
    console.log(req.body);

    var query = 'UPDATE ev.events SET'
    //enumerate all keys in req.body
    keys.forEach((key, index) => {
      query += ` ${key} = $${index + 1},`
      console.log(key, index, req.body[key])
    });
    //remove last comma
    query = query.slice(0, -1);
    query += ' WHERE id = $' + (keys.length + 1) + ' RETURNING *';

    console.log(query);
    
    const result = await pool.query(query, keys.map(key => req.body[key]).concat(req.params.id));

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

// Create event
app.post('/events', async (req, res) => {
  try {
    const {task_id, title, description, date, place} = req.body;

    var query = 'INSERT INTO ev.events (\
      task_id, title, description, date, place\
      ) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    
    const result = await pool.query(query, [task_id, title, description, date, place]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
