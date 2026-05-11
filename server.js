const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(express.static('public'));
app.use(express.json());

const db = new sqlite3.Database('encuesta.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS respuestas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    color TEXT NOT NULL,
    ip TEXT,
    country TEXT,
    region TEXT,
    latitude TEXT,
    longitude TEXT,
    user_agent TEXT,
    platform TEXT,
    language TEXT,
    screen_resolution TEXT,
    color_depth TEXT,
    timezone TEXT,
    cpu_cores TEXT,
    device_memory TEXT,
    fingerprint TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
});

app.post('/guardar-color', async (req, res) => {
  try {
    const data = req.body;
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
    const cleanIp = ip.replace(/^::ffff:/, '');
    let country = 'Desconocido';
    let region = 'Desconocido';

    try {
      const response = await fetch(`http://ip-api.com/json/${cleanIp}`);
      const geo = await response.json();
      if (geo.status === 'success') {
        country = geo.country;
        region = geo.regionName;
      }
    } catch (err) {
      console.log('Error obteniendo geolocalización:', err);
    }

    db.run(
      `INSERT INTO respuestas (color, ip, country, region, user_agent, platform, language, screen_resolution, color_depth, timezone, cpu_cores, device_memory, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.color, cleanIp, country, region, data.user_agent, data.platform, data.language, data.screen_resolution, data.color_depth, data.timezone, data.cpu_cores, data.device_memory, data.fingerprint],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error interno' });
        }
        res.json({ success: true });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

app.get('/timeline-data', (req, res) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
  const cleanIp = ip.replace(/^::ffff:/, '');

  db.serialize(() => {
    db.all(
      'SELECT id, color, timestamp FROM respuestas WHERE ip = ? ORDER BY timestamp ASC',
      [cleanIp],
      (err, rows) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error interno' });
        }

        db.all(
          'SELECT ip, COUNT(*) as total, MAX(timestamp) as last_seen FROM respuestas GROUP BY ip ORDER BY last_seen DESC',
          (err2, groups) => {
            if (err2) {
              console.error(err2);
              return res.status(500).json({ error: 'Error interno' });
            }
            res.json({ currentIp: cleanIp, timeline: rows, groupedByIp: groups });
          }
        );
      }
    );
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});