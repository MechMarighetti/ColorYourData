const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

// Middlewares
app.use(express.json());
app.use(express.static('public'));

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

        // Insertar en Supabase
        const { data: inserted, error } = await supabase
            .from('respuestas')
            .insert([
                {
                    color: data.color,
                    ip: cleanIp,
                    country: country,
                    region: region,
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
                    user_agent: data.user_agent || null,
                    platform: data.platform || null,
                    language: data.language || null,
                    screen_resolution: data.screen_resolution || null,
                    color_depth: data.color_depth || null,
                    timezone: data.timezone || null,
                    cpu_cores: data.cpu_cores || null,
                    device_memory: data.device_memory || null,
                    fingerprint: data.fingerprint || null,
                    tiempo_seleccion: data.tiempo_seleccion || 'No consentido',
                    clics_erroneos: data.clics_erroneos || 'No consentido',
                    movimientos_mouse: data.movimientos_mouse || 'No consentido',
                    porcentaje_scroll: data.porcentaje_scroll || 'No consentido',
                    pausas_scroll: data.pausas_scroll || 'No consentido'
                }
            ])
            .select('id');

        if (error) {
            console.error('Error insertando en Supabase:', error);
            return res.status(500).json({ error: 'Error al guardar' });
        }

        const sessionId = inserted && inserted[0] ? inserted[0].id : null;
        res.json({ success: true, sessionId });
    } catch (err) {
        console.error('Error en /guardar-color:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/timeline-data', async (req, res) => {
    try {
        const cleanIp = getClientIp(req);

        // Timeline del usuario actual
        const { data: timeline, error: timelineError } = await supabase
            .from('respuestas')
            .select('id, color, timestamp, latitude, longitude, country, region')
            .eq('ip', cleanIp)
            .order('timestamp', { ascending: true });

        if (timelineError) throw timelineError;

        // Agrupar por IP
        const { data: groupedByIp, error: groupError } = await supabase
            .from('respuestas')
            .select('ip, timestamp')
            .order('timestamp', { ascending: false });

        if (groupError) throw groupError;

        // Procesar groupedByIp manualmente (contar y agrupar)
        const grouped = {};
        (groupedByIp || []).forEach(row => {
            if (!grouped[row.ip]) {
                grouped[row.ip] = { ip: row.ip, total: 0, last_seen: row.timestamp };
            }
            grouped[row.ip].total++;
        });
        const groupedArray = Object.values(grouped);

        res.json({ currentIp: cleanIp, timeline: timeline || [], groupedByIp: groupedArray });
    } catch (err) {
        console.error('Error en /timeline-data:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.get('/api/mi-perfil', async (req, res) => {
    try {
        const cleanIp = getClientIp(req);

        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select('*')
            .eq('ip', cleanIp)
            .order('timestamp', { ascending: false })
            .limit(1);

        if (error || !perfil || perfil.length === 0) {
            return res.status(404).json({ error: 'No se encontraron respuestas para esta IP' });
        }

        res.json(perfil[0]);
    } catch (err) {
        console.error('Error en /api/mi-perfil:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/stats-data', async (req, res) => {
    try {
        const { data: all } = await supabase.from('respuestas').select('*');

        if (!all || all.length === 0) {
            return res.json({
                total: 0,
                unique_ips: 0,
                colors: [],
                countries: [],
                regions: [],
                platforms: [],
                languages: [],
                resolutions: [],
                timezones: []
            });
        }

        const colors = {};
        const countries = {};
        const regions = {};
        const platforms = {};
        const languages = {};
        const resolutions = {};
        const timezones = {};

        all.forEach(row => {
            colors[row.color] = (colors[row.color] || 0) + 1;
            if (row.country && row.country !== '') countries[row.country] = (countries[row.country] || 0) + 1;
            if (row.region && row.region !== '') regions[row.region] = (regions[row.region] || 0) + 1;
            if (row.platform) platforms[row.platform] = (platforms[row.platform] || 0) + 1;
            if (row.language) languages[row.language] = (languages[row.language] || 0) + 1;
            if (row.screen_resolution) resolutions[row.screen_resolution] = (resolutions[row.screen_resolution] || 0) + 1;
            if (row.timezone) timezones[row.timezone] = (timezones[row.timezone] || 0) + 1;
        });

        res.json({
            total: all.length,
            unique_ips: new Set(all.map(r => r.ip)).size,
            colors: Object.entries(colors).map(([k, v]) => ({ color: k, count: v })).sort((a, b) => b.count - a.count),
            countries: Object.entries(countries).map(([k, v]) => ({ country: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 8),
            regions: Object.entries(regions).map(([k, v]) => ({ region: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 8),
            platforms: Object.entries(platforms).map(([k, v]) => ({ platform: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 6),
            languages: Object.entries(languages).map(([k, v]) => ({ language: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 6),
            resolutions: Object.entries(resolutions).map(([k, v]) => ({ resolution: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 6),
            timezones: Object.entries(timezones).map(([k, v]) => ({ timezone: k, count: v })).sort((a, b) => b.count - a.count).slice(0, 6)
        });
    } catch (err) {
        console.error('Error en /stats-data:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

app.get('/api/perfil/:id', async (req, res) => {
    try {
        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select('*')
            .eq('id', req.params.id)
            .limit(1);

        if (error || !perfil || perfil.length === 0) {
            return res.status(404).json({ error: 'No se encontró el perfil' });
        }

        res.json(perfil[0]);
    } catch (err) {
        console.error('Error en /api/perfil/:id', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const { data: all } = await supabase.from('respuestas').select('*');

        if (!all || all.length === 0) {
            return res.json({
                total_respuestas: 0,
                colores: [],
                paises: [],
                promedio_tiempo: 0,
                indecisos_promedio: 0,
                scroll_promedio: 0
            });
        }

        const colores = {};
        const paises = {};
        let sumTiempo = 0, countTiempo = 0;
        let sumClics = 0, countClics = 0;
        let sumScroll = 0, countScroll = 0;

        all.forEach(row => {
            colores[row.color] = (colores[row.color] || 0) + 1;
            if (row.country && row.country !== '') paises[row.country] = (paises[row.country] || 0) + 1;

            if (row.tiempo_seleccion && row.tiempo_seleccion !== 'No consentido') {
                sumTiempo += parseInt(row.tiempo_seleccion) || 0;
                countTiempo++;
            }
            if (row.clics_erroneos && row.clics_erroneos !== 'No consentido') {
                sumClics += parseInt(row.clics_erroneos) || 0;
                countClics++;
            }
            if (row.porcentaje_scroll && row.porcentaje_scroll !== 'No consentido') {
                sumScroll += parseInt(row.porcentaje_scroll) || 0;
                countScroll++;
            }
        });

        res.json({
            total_respuestas: all.length,
            colores: Object.entries(colores).map(([k, v]) => ({ color: k, cantidad: v })).sort((a, b) => b.cantidad - a.cantidad),
            paises: Object.entries(paises).map(([k, v]) => ({ country: k, cantidad: v })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 20),
            promedio_tiempo: countTiempo > 0 ? Math.round(sumTiempo / countTiempo) : 0,
            indecisos_promedio: countClics > 0 ? Math.round(sumClics / countClics) : 0,
            scroll_promedio: countScroll > 0 ? Math.round(sumScroll / countScroll) : 0
        });
    } catch (err) {
        console.error('Error en /api/stats:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en http://localhost:${PORT}`);
        console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
    });
}

module.exports = app;