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
      `INSERT INTO respuestas (color, ip, country, region, latitude, longitude, user_agent, platform, language, screen_resolution, color_depth, timezone, cpu_cores, device_memory, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.color, cleanIp, country, region, data.latitude || null, data.longitude || null, data.user_agent, data.platform, data.language, data.screen_resolution, data.color_depth, data.timezone, data.cpu_cores, data.device_memory, data.fingerprint],
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
      'SELECT id, color, timestamp, latitude, longitude FROM respuestas WHERE ip = ? ORDER BY timestamp ASC',
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

app.get('/stats-data', (req, res) => {
  db.serialize(() => {
    db.get('SELECT COUNT(*) as total, COUNT(DISTINCT ip) as unique_ips FROM respuestas', [], (err, totalRow) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error interno' });
      }

      db.all('SELECT color, COUNT(*) as count FROM respuestas GROUP BY color ORDER BY count DESC', [], (err2, colors) => {
        if (err2) {
          console.error(err2);
          return res.status(500).json({ error: 'Error interno' });
        }

        db.all('SELECT country, COUNT(*) as count FROM respuestas WHERE country IS NOT NULL AND country != "" GROUP BY country ORDER BY count DESC LIMIT 8', [], (err3, countries) => {
          if (err3) {
            console.error(err3);
            return res.status(500).json({ error: 'Error interno' });
          }

          db.all('SELECT region, COUNT(*) as count FROM respuestas WHERE region IS NOT NULL AND region != "" GROUP BY region ORDER BY count DESC LIMIT 8', [], (err4, regions) => {
            if (err4) {
              console.error(err4);
              return res.status(500).json({ error: 'Error interno' });
            }

            db.all('SELECT platform, COUNT(*) as count FROM respuestas GROUP BY platform ORDER BY count DESC LIMIT 6', [], (err5, platforms) => {
              if (err5) {
                console.error(err5);
                return res.status(500).json({ error: 'Error interno' });
              }

              db.all('SELECT language, COUNT(*) as count FROM respuestas GROUP BY language ORDER BY count DESC LIMIT 6', [], (err6, languages) => {
                if (err6) {
                  console.error(err6);
                  return res.status(500).json({ error: 'Error interno' });
                }

                db.all('SELECT screen_resolution, COUNT(*) as count FROM respuestas GROUP BY screen_resolution ORDER BY count DESC LIMIT 6', [], (err7, resolutions) => {
                  if (err7) {
                    console.error(err7);
                    return res.status(500).json({ error: 'Error interno' });
                  }

                  db.all('SELECT timezone, COUNT(*) as count FROM respuestas GROUP BY timezone ORDER BY count DESC LIMIT 6', [], (err8, timezones) => {
                    if (err8) {
                      console.error(err8);
                      return res.status(500).json({ error: 'Error interno' });
                    }

                    res.json({
                      total: totalRow.total,
                      unique_ips: totalRow.unique_ips,
                      colors,
                      countries,
                      regions,
                      platforms,
                      languages,
                      resolutions,
                      timezones
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});