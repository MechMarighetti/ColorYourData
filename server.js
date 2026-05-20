const express = require('express');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
app.use(express.static('public'));
app.use(express.json());

const DB_PATH = '/tmp/encuesta.db';
let db;

function prepareAll(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
        rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
}

function prepareGet(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const row = stmt.step() ? stmt.getAsObject() : null;
    stmt.free();
    return row;
}

function persistDatabase() {
    try {
        fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
    } catch (err) {
        console.error('No se pudo persistir la base de datos en /tmp:', err);
    }
}

async function initDB() {
    const SQL = await initSqlJs();

    try {
        if (fs.existsSync(DB_PATH)) {
            const fileBuffer = fs.readFileSync(DB_PATH);
            db = new SQL.Database(new Uint8Array(fileBuffer));
        } else {
            db = new SQL.Database();
        }
    } catch (err) {
        console.error('No se pudo cargar DB desde /tmp, creando en memoria:', err);
        db = new SQL.Database();
    }

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
        tiempo_seleccion TEXT,
        clics_erroneos TEXT,
        movimientos_mouse TEXT,
        porcentaje_scroll TEXT,
        pausas_scroll TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    persistDatabase();
}

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    return ip ? ip.replace(/^::ffff:/, '') : 'Desconocido';
}

app.post('/guardar-color', async (req, res) => {
    try {
        const data = req.body;
        const cleanIp = getClientIp(req);

        let country = 'Desconocido';
        let region = 'No disponible';

        try {
            const response = await fetch(`https://api.iplocation.net/?ip=${cleanIp}`);
            const geo = await response.json();
            if (geo.response_code === '200') {
                country = geo.country_name || 'Desconocido';
            }
        } catch (err) {
            console.error('Error obteniendo geolocalización:', err);
        }

        db.run(
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

        const lastIdResult = db.exec('SELECT last_insert_rowid() as id');
        const sessionId = lastIdResult && lastIdResult[0] && lastIdResult[0].values && lastIdResult[0].values[0]
            ? lastIdResult[0].values[0][0]
            : null;

        persistDatabase();
        res.json({ success: true, sessionId });
    } catch (err) {
        console.error('Error en /guardar-color:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/timeline-data', (req, res) => {
    try {
        const cleanIp = getClientIp(req);
        const timeline = prepareAll(
            'SELECT id, color, timestamp, latitude, longitude FROM respuestas WHERE ip = ? ORDER BY timestamp ASC',
            [cleanIp]
        );
        const groupedByIp = prepareAll(
            'SELECT ip, COUNT(*) as total, MAX(timestamp) as last_seen FROM respuestas GROUP BY ip ORDER BY last_seen DESC'
        );

        res.json({ currentIp: cleanIp, timeline, groupedByIp });
    } catch (err) {
        console.error('Error en /timeline-data:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.get('/api/mi-perfil', (req, res) => {
    try {
        const cleanIp = getClientIp(req);
        const perfil = prepareGet(
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

app.get('/stats-data', (req, res) => {
    try {
        const totalRow = prepareGet('SELECT COUNT(*) as total, COUNT(DISTINCT ip) as unique_ips FROM respuestas');
        const colors = prepareAll('SELECT color, COUNT(*) as count FROM respuestas GROUP BY color ORDER BY count DESC');
        const countries = prepareAll(`
            SELECT country, COUNT(*) as count
            FROM respuestas
            WHERE country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY count DESC
            LIMIT 8
        `);
        const regions = prepareAll(`
            SELECT region, COUNT(*) as count
            FROM respuestas
            WHERE region IS NOT NULL AND region != ''
            GROUP BY region
            ORDER BY count DESC
            LIMIT 8
        `);
        const platforms = prepareAll(`
            SELECT platform, COUNT(*) as count
            FROM respuestas
            GROUP BY platform
            ORDER BY count DESC
            LIMIT 6
        `);
        const languages = prepareAll(`
            SELECT language, COUNT(*) as count
            FROM respuestas
            GROUP BY language
            ORDER BY count DESC
            LIMIT 6
        `);
        const resolutions = prepareAll(`
            SELECT screen_resolution, COUNT(*) as count
            FROM respuestas
            GROUP BY screen_resolution
            ORDER BY count DESC
            LIMIT 6
        `);
        const timezones = prepareAll(`
            SELECT timezone, COUNT(*) as count
            FROM respuestas
            GROUP BY timezone
            ORDER BY count DESC
            LIMIT 6
        `);

        res.json({
            total: totalRow?.total || 0,
            unique_ips: totalRow?.unique_ips || 0,
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

app.get('/api/perfil/:id', (req, res) => {
    try {
        const perfil = prepareGet(
            `SELECT
                    id, color, ip, country, region, latitude, longitude,
                    tiempo_seleccion, clics_erroneos, movimientos_mouse,
                    porcentaje_scroll, pausas_scroll, user_agent, platform,
                    language, screen_resolution, color_depth, timezone,
                    cpu_cores, device_memory, fingerprint, timestamp
             FROM respuestas
             WHERE id = ?
             LIMIT 1`,
            [req.params.id]
        );

        if (!perfil) {
            return res.status(404).json({ error: 'No se encontró el perfil' });
        }

        res.json(perfil);
    } catch (err) {
        console.error('Error en /api/perfil/:id', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/stats', (req, res) => {
    try {
        const totalRow = prepareGet('SELECT COUNT(*) as total FROM respuestas');
        const coloresRaw = prepareAll('SELECT color, COUNT(*) as cantidad FROM respuestas GROUP BY color ORDER BY cantidad DESC');
        const paisesRaw = prepareAll(`
            SELECT country as country, COUNT(*) as cantidad
            FROM respuestas
            WHERE country IS NOT NULL AND country != ''
            GROUP BY country
            ORDER BY cantidad DESC
            LIMIT 20
        `);
        const avgTiempoRow = prepareGet("SELECT AVG(CAST(tiempo_seleccion AS INTEGER)) as avgTiempo FROM respuestas WHERE tiempo_seleccion IS NOT NULL AND tiempo_seleccion != 'No consentido'");
        const avgClicsRow = prepareGet("SELECT AVG(CAST(clics_erroneos AS INTEGER)) as avgClics FROM respuestas WHERE clics_erroneos IS NOT NULL AND clics_erroneos != 'No consentido'");
        const avgScrollRow = prepareGet("SELECT AVG(CAST(porcentaje_scroll AS INTEGER)) as avgScroll FROM respuestas WHERE porcentaje_scroll IS NOT NULL AND porcentaje_scroll != 'No consentido'");

        const result = {
            total_respuestas: totalRow?.total || 0,
            colores: coloresRaw.map(r => ({ color: r.color, cantidad: r.cantidad })),
            paises: paisesRaw.map(r => ({ country: r.country, cantidad: r.cantidad })),
            promedio_tiempo: avgTiempoRow?.avgTiempo ? Math.round(avgTiempoRow.avgTiempo) : 0,
            indecisos_promedio: avgClicsRow?.avgClics ? Math.round(avgClicsRow.avgClics) : 0,
            scroll_promedio: avgScrollRow?.avgScroll ? Math.round(avgScrollRow.avgScroll) : 0
        };

        res.json(result);
    } catch (err) {
        console.error('Error en /api/stats:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

const PORT = process.env.PORT || 3000;
initDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('No se pudo iniciar la base de datos:', err);
        process.exit(1);
    });