const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();

app.use(express.static('public'));
app.use(express.json());

const db = new sqlite3.Database('encuesta.db');

// Promisify db methods for async/await
const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { resolve(this); });
});
const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
});

// Crear tabla si no existe (usando dbRun con promesa)
db.exec(`CREATE TABLE IF NOT EXISTS respuestas (
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
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  tiempo_seleccion TEXT,
  clics_erroneos TEXT,
  movimientos_mouse TEXT,
  porcentaje_scroll TEXT,
  pausas_scroll TEXT
);`, () => console.log('Tabla lista'));

// Endpoint para guardar respuesta
app.post('/guardar-color', async (req, res) => {
    try {
        const data = req.body;

        // Obtener IP real detrás de proxy
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
        const cleanIp = ip.replace(/^::ffff:/, '');

        let country = 'Desconocido';
        let region = 'No disponible';

        // Geolocalización CORREGIDA usando solo los campos reales del API
        try {
            const response = await fetch(`https://api.iplocation.net/?ip=${cleanIp}`);
            const geo = await response.json();
            if (geo.response_code === '200') {
                country = geo.country_name || 'Desconocido';
            }
        } catch (err) {
            console.error('Error obteniendo geolocalización:', err);
        }

        // Insertar datos de forma asíncrona
        await dbRun(
            `INSERT INTO respuestas (
                color, ip, country, region, latitude, longitude,
                user_agent, platform, language, screen_resolution, color_depth,
                timezone, cpu_cores, device_memory, fingerprint,
                tiempo_seleccion, clics_erroneos, movimientos_mouse, porcentaje_scroll, pausas_scroll
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.color, cleanIp, country, region,
                data.latitude || null, data.longitude || null,
                data.user_agent, data.platform, data.language,
                data.screen_resolution, data.color_depth, data.timezone,
                data.cpu_cores, data.device_memory, data.fingerprint,
                data.tiempo_seleccion || 'No consentido',
                data.clics_erroneos || 'No consentido',
                data.movimientos_mouse || 'No consentido',
                data.porcentaje_scroll || 'No consentido',
                data.pausas_scroll || 'No consentido'
            ]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error en /guardar-color:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para obtener timeline por IP (CORREGIDO asíncrono)
app.get('/timeline-data', async (req, res) => {
    try {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
        const cleanIp = ip.replace(/^::ffff:/, '');

        // Consultas asíncronas correctas
        const timeline = await dbAll(
            'SELECT id, color, timestamp, latitude, longitude FROM respuestas WHERE ip = ? ORDER BY timestamp ASC',
            [cleanIp]
        );

        const groupedByIp = await dbAll(
            'SELECT ip, COUNT(*) as total, MAX(timestamp) as last_seen FROM respuestas GROUP BY ip ORDER BY last_seen DESC'
        );

        res.json({ currentIp: cleanIp, timeline, groupedByIp });
    } catch (err) {
        console.error('Error en /timeline-data:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});
// Endpoint para obtener el perfil completo del usuario actual (última respuesta)
app.get('/api/mi-perfil', async (req, res) => {
    try {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
        const cleanIp = ip.replace(/^::ffff:/, '');

        // Obtener la última respuesta de este IP
        const perfil = await dbGet(
            `SELECT 
                color, country, region, 
                tiempo_seleccion, clics_erroneos, movimientos_mouse, 
                porcentaje_scroll, pausas_scroll,
                user_agent, platform, language, screen_resolution,
                color_depth, timezone, cpu_cores, device_memory, fingerprint,
                timestamp
             FROM respuestas 
             WHERE ip = ? 
             ORDER BY timestamp DESC 
             LIMIT 1`,
            [cleanIp]
        );

        if (!perfil) {
            return res.status(404).json({ error: 'No se encontraron respuestas para esta IP' });
        }

        res.json(perfil);
    } catch (err) {
        console.error('Error en /api/mi-perfil:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para estadísticas globales (CORREGIDO asíncrono)
app.get('/stats-data', async (req, res) => {
    try {
        const totalRow = await dbGet('SELECT COUNT(*) as total, COUNT(DISTINCT ip) as unique_ips FROM respuestas');
        const colors = await dbAll('SELECT color, COUNT(*) as count FROM respuestas GROUP BY color ORDER BY count DESC');
        const countries = await dbAll(`
            SELECT country, COUNT(*) as count 
            FROM respuestas 
            WHERE country IS NOT NULL AND country != '' 
            GROUP BY country 
            ORDER BY count DESC 
            LIMIT 8
        `);
        const regions = await dbAll(`
            SELECT region, COUNT(*) as count 
            FROM respuestas 
            WHERE region IS NOT NULL AND region != '' 
            GROUP BY region 
            ORDER BY count DESC 
            LIMIT 8
        `);
        const platforms = await dbAll(`
            SELECT platform, COUNT(*) as count 
            FROM respuestas 
            GROUP BY platform 
            ORDER BY count DESC 
            LIMIT 6
        `);
        const languages = await dbAll(`
            SELECT language, COUNT(*) as count 
            FROM respuestas 
            GROUP BY language 
            ORDER BY count DESC 
            LIMIT 6
        `);
        const resolutions = await dbAll(`
            SELECT screen_resolution, COUNT(*) as count 
            FROM respuestas 
            GROUP BY screen_resolution 
            ORDER BY count DESC 
            LIMIT 6
        `);
        const timezones = await dbAll(`
            SELECT timezone, COUNT(*) as count 
            FROM respuestas 
            GROUP BY timezone 
            ORDER BY count DESC 
            LIMIT 6
        `);

        res.json({
            total: totalRow.total || 0,
            unique_ips: totalRow.unique_ips || 0,
            colors,
            countries,
            regions,
            platforms,
            languages,
            resolutions,
            timezones
        });
    } catch (err) {
        console.error('Error en /stats-data:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});