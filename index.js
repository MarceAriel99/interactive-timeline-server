const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json())
app.use(cors());
const port = process.env.PORT || 4000;
const UPLOAD_PATH = '/test_images';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '.' + UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// TODO Use Sequelize framework to handle database operations

// Initialize database
app.get('/initialize', async (req, res) => {
  // test connection
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

/* ----------------------------------------------------------------- 
                              EVENTS
----------------------------------------------------------------- */

// Get all events
app.get('/events', async (req, res) => {
  try {
    // Get query parameters ignoring orderBy and order
    const query_params = Object.keys(req.query).filter(key => key !== 'orderBy' && key !== 'order');

    const orderBy = req.query.orderBy || 'id';
    const order = req.query.order || 'ASC';

    console.log('orderBy:', orderBy, 'order:', order);
    console.log('query_params:', query_params);

    query = 'SELECT * FROM ev.events';
    if (query_params.length > 0) {
      query += ' WHERE';
      query_params.forEach((key, index) => {
        query += ` ${key} = $${index + 1} AND`
      });
      query = query.slice(0, -4);
    }
    query += ' ORDER BY ' + orderBy + ' ' + order;

    console.log("Query:", query);

    const result = await pool.query(query, query_params.map(key => req.query[key]));
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
    res.statusMessage = error.message;
    res.status(500).end();
  }
});

/* ----------------------------------------------------------------- 
                            EVENTS MEDIA
----------------------------------------------------------------- */

// Get all events media
app.get('/events_media', async (req, res) => {
  console.log("GET events_media");
  try {
    const result = await pool.query('SELECT * FROM ev.events_media');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.post('/events_media', async (req, res) => {
  try {
    console.log("POST events_media");
    let {timeline_event_id, url} = req.body;
    url = 'http://localhost:4000/' + url;

    var query = 'INSERT INTO ev.events_media (\
      timeline_event_id, url\
      ) VALUES ($1, $2) RETURNING *';

    console.log(query);
    
    const result = await pool.query(query, [timeline_event_id, url]);

    console.log(result.rows);

    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send('Server Error');
  }
});

app.post("/upload", upload.single('file'), (req, res, next) => {
  console.log("POST upload");
  const file = req.file;
  if (!file) {
    res.statusMessage = "No file uploaded!";
    res.status(500).end();
  }

  // TODO: Check if the allowed file types can be directly specified in the multer configuration
  const file_mimetype = file.mimetype.split('/')[1];
  if (file_mimetype !== 'webp') {
    fs.unlink(file.path, (err) => {
      if (err) {
        console.error("Error deleting file: ", err);
      }
    });
    res.statusMessage = "Only webp files are allowed!";
    res.status(500).end();
  }

  // Erase the last part of the file path and replace it with the file name
  file.path = file.path.replace(/(.*\/)(.*)/, `$1${file.filename}`);
  // Return the file url
  res.json({url: file.path});
});

app.delete('/events_media/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ev.events_media WHERE id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send('Server Error');
  }
});

app.delete('/delete/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, UPLOAD_PATH, filename);

  console.log("Deleting file: ", filePath);

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file: ", err);
      return res.status(500).json({ error: "Failed to delete file" });
    }
    res.status(200).json({ message: "File deleted successfully" });
  });
});

app.use(UPLOAD_PATH, express.static(path.join(__dirname, UPLOAD_PATH.split('/')[1])));

// /* ----------------------------------------------------------------- 
//                             TRANSACTIONS
// ----------------------------------------------------------------- */

// // Manages creating an event and uploading its media
// app.post('/create_event', upload.array('files'), async (req, res, next) => {
//   console.log("POST create_event");
//   // Parse event from the JSON string
//   const event = JSON.parse(req.body.event);
//   const { task_id, title, description, date, place } = event;
//   const media = req.files;

//   // media.forEach(file => {
//   //   if (file.mimetype.split('/')[1] !== 'webp') {
//   //     return next(new Error('Only webp files are allowed!'));
//   //   }
//   // });

//   const client = await pool.connect();
//   client.query('BEGIN');
//   try {
//     // Insert row into events table
//     const event_query = 'INSERT INTO ev.events (\
//       task_id, title, description, date, place\
//       ) VALUES ($1, $2, $3, $4, $5) RETURNING *';
    
//     const event_result = await client.query(event_query, [task_id, title, description, date, place]);
//     const event_id = event_result.rows[0].id;

//     // Insert rows into events_media table
//     const media_query = 'INSERT INTO ev.events_media (\
//       timeline_event_id, url\
//       ) VALUES ($1, $2) RETURNING *';

//     const media_promises = media.map(async (file) => {
//       let file_path = file.path.replace(/(.*\/)(.*)/, `$1${file.filename}`);
//       file_path = 'http://localhost:4000/' + file_path;
      
//       return await client.query(media_query, [event_id, file_path]);
//     });
    
//     // Await all promises
//     await Promise.all(media_promises);

//     console.log("COMMIT");
//     client.query('COMMIT');
//     res.json(event_result.rows[0]);
//   }
//   catch (error) {
//     console.log("ROLLBACK");
//     client.query('ROLLBACK');
//     // Delete uploaded files if they exist
//     media.forEach(file => {
//       const filePath = path.join(__dirname, file.path);
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           console.error("Error deleting file: ", err);
//         } else {
//           console.log("Deleted file: ", filePath);
//         }
//       });
//     });
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
//   finally {
//     client.release();
//   }

// });

// // Manages updating an event and uploading its media
// app.put('/update_event/:id', upload.array('files'), async (req, res, next) => {
//   console.log("PUT update_event");
//   // Parse event from the JSON string
//   const event = JSON.parse(req.body.event);
//   const { task_id, title, description, date, place } = event;
//   const media = req.files;

//   // media.forEach(file => {
//   //   if (file.mimetype.split('/')[1] !== 'webp') {
//   //     return next(new Error('Only webp files are allowed!'));
//   //   }
//   // });

//   const client = await pool.connect();
//   client.query('BEGIN');
//   try {
//     // Update row in events table
//     const event_query = 'UPDATE ev.events SET\
//       task_id = $1, title = $2, description = $3, date = $4, place = $5\
//       WHERE id = $6 RETURNING *';
    
//     const event_result = await client.query(event_query, [task_id, title, description, date, place, req.params.id]);

//     // Insert rows into events_media table
//     const media_query = 'INSERT INTO ev.events_media (\
//       timeline_event_id, url\
//       ) VALUES ($1, $2) RETURNING *';

//     const media_promises = media.map(async (file) => {
//       let file_path = file.path.replace(/(.*\/)(.*)/, `$1${file.filename}`);
//       file_path = 'http://localhost:4000/' + file_path;
      
//       return await client.query(media_query, [req.params.id, file_path]);
//     });
    
//     // Await all promises
//     await Promise.all(media_promises);

//     console.log("COMMIT");
//     client.query('COMMIT');
//     res.json(event_result.rows[0]);
//   }
//   catch (error) {
//     console.log("ROLLBACK");
//     client.query('ROLLBACK');
//     // Delete uploaded files if they exist
//     media.forEach(file => {
//       const filePath = path.join(__dirname, file.path);
//       fs.unlink(filePath, (err) => {
//         if (err) {
//           console.error("Error deleting file: ", err);
//         } else {
//           console.log("Deleted file: ", filePath);
//         }
//       });
//     });
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
//   finally {
//     client.release();
//   }

// });


/* ----------------------------------------------------------------- 
                              END
----------------------------------------------------------------- */

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

