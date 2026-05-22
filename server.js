

// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const app = express();


const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
// Configuración de middlewares
app.use(express.json()); // Para parsear el cuerpo de las peticiones JSON

// --- Inicialización de Supabase ---
// Cargamos las variables de entorno que definiremos más tarde.
// Es crucial que estos nombres coincidan exactamente.
const supabaseUrl = process.env.CYD_SUPABASE_URL;
const supabaseAnonKey = process.env.CYD_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.CYD_SUPABASE_SERVICE_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ Error crítico: Las variables de entorno CYD_SUPABASE_URL y CYD_SUPABASE_ANON_KEY no están definidas.");
    // En un entorno de producción, querrás manejar esto de otra forma,
    // pero lanzar un error aquí detiene el despliegue si falta algo.
    throw new Error("Faltan las variables de entorno de Supabase.");
}

// Creamos el cliente de Supabase para interactuar con la base de datos
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// --- Fin de la inicialización de Supabase ---

// --- Función auxiliar para obtener IP real del cliente ---
function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    return ip ? ip.replace(/^::ffff:/, '') : 'Desconocido';
}

// --- RUTAS DE TU API ---

// Ruta: /guardar-color
app.post('/guardar-color', async (req, res) => {
    try {
        const data = req.body;
        const cleanIp = getClientIp(req);

        // --- (Opcional) Geolocalización ---
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
        // -----------------------------------

        // 1. Insertamos la nueva respuesta en la tabla 'respuestas'
        // Asegúrate de que los nombres de las columnas coincidan con tu tabla en Supabase.
        const { data: newResponse, error: insertError } = await supabase
            .from('respuestas')
            .insert([
                {
                    color: data.color,
                    ip: cleanIp,
                    country: country,
                    region: region,
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
                    user_agent: data.user_agent,
                    platform: data.platform,
                    language: data.language,
                    screen_resolution: data.screen_resolution,
                    color_depth: data.color_depth,
                    timezone: data.timezone,
                    cpu_cores: data.cpu_cores,
                    device_memory: data.device_memory,
                    fingerprint: data.fingerprint,
                    tiempo_seleccion: data.tiempo_seleccion || 'No consentido',
                    clics_erroneos: data.clics_erroneos || 'No consentido',
                    movimientos_mouse: data.movimientos_mouse || 'No consentido',
                    porcentaje_scroll: data.porcentaje_scroll || 'No consentido',
                    pausas_scroll: data.pausas_scroll || 'No consentido'
                }
            ])
            .select(); // Para que nos devuelva el registro insertado, incluyendo su ID.

        if (insertError) {
            console.error('Error al insertar en Supabase:', insertError);
            throw new Error(insertError.message);
        }

        // El ID de la nueva respuesta estará en newResponse[0].id
        const sessionId = newResponse ? newResponse[0].id : null;

        res.json({ success: true, sessionId: sessionId });

    } catch (err) {
        console.error('Error en /guardar-color:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta: /timeline-data
app.get('/timeline-data', async (req, res) => {
    try {
        const cleanIp = getClientIp(req);

        // 1. Obtener el timeline para esta IP
        const { data: timeline, error: timelineError } = await supabase
            .from('respuestas')
            .select('id, color, timestamp, latitude, longitude')
            .eq('ip', cleanIp)
            .order('timestamp', { ascending: true });

        if (timelineError) {
            console.error('Error al obtener timeline:', timelineError);
            throw new Error(timelineError.message);
        }

        // 2. Obtener el resumen de respuestas agrupadas por IP
        // Como Supabase no tiene una función COUNT con GROUP BY directa que devuelva
        // una lista fácilmente, hacemos una consulta un poco más elaborada.
        // Primero, obtenemos todas las IPs distintas.
        const { data: uniqueIps, error: ipsError } = await supabase
            .from('respuestas')
            .select('ip')
            .not('ip', 'is', null);

        if (ipsError) {
            console.error('Error al obtener IPs únicas:', ipsError);
            throw new Error(ipsError.message);
        }

        // Procesamos manualmente para crear el objeto groupedByIp
        const groupedByIp = {};
        const counts = {};
        const lastSeen = {};
        uniqueIps.forEach(record => {
            if (record.ip) {
                counts[record.ip] = (counts[record.ip] || 0) + 1;
                // No podemos obtener MAX(timestamp) fácilmente aquí.
                // Una alternativa más eficiente es crear una vista en Supabase o
                // hacer una segunda consulta, pero simplificamos para el ejemplo.
                lastSeen[record.ip] = 'Timestamp no calculado en esta versión';
            }
        });
        for (const [ip, total] of Object.entries(counts)) {
            groupedByIp[ip] = { total, last_seen: lastSeen[ip] };
        }
        // Nota: Para un caso de uso real, lo mejor es crear una vista en Supabase
        // o ajustar la consulta para mayor eficiencia.

        res.json({ currentIp: cleanIp, timeline: timeline || [], groupedByIp: groupedByIp });

    } catch (err) {
        console.error('Error en /timeline-data:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta: /api/mi-perfil
app.get('/api/mi-perfil', async (req, res) => {
    try {
        const cleanIp = getClientIp(req);
        // Obtenemos la última respuesta para esta IP
        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select(`
                color, country, region,
                tiempo_seleccion, clics_erroneos, movimientos_mouse,
                porcentaje_scroll, pausas_scroll,
                user_agent, platform, language, screen_resolution,
                color_depth, timezone, cpu_cores, device_memory, fingerprint,
                timestamp
            `)
            .eq('ip', cleanIp)
            .order('timestamp', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error al obtener perfil:', error);
            throw new Error(error.message);
        }

        if (!perfil || perfil.length === 0) {
            return res.status(404).json({ error: 'No se encontraron respuestas para esta IP' });
        }

        res.json(perfil[0]); // Devolvemos el primer (y único) resultado.
    } catch (err) {
        console.error('Error en /api/mi-perfil:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta: /stats-data (para tu página stats.html)
app.get('/stats-data', async (req, res) => {
    try {
        // Obtenemos las estadísticas con múltiples consultas. Para producción,
        // sería mejor crear una vista o función en PostgreSQL/Supabase.
        const [
            totalRespuestas,
            uniqueIpsCount,
            colorsCount,
            countriesCount,
            platformsCount,
            languagesCount,
            resolutionsCount,
            timezonesCount
        ] = await Promise.all([
            supabase.from('respuestas').select('*', { count: 'exact', head: true }),
            supabase.from('respuestas').select('ip', { count: 'exact', head: true }).not('ip', 'is', null),
            supabase.from('respuestas').select('color', { count: 'exact' }).not('color', 'is', null),
            supabase.from('respuestas').select('country', { count: 'exact' }).not('country', 'is', null),
            supabase.from('respuestas').select('platform', { count: 'exact' }).not('platform', 'is', null),
            supabase.from('respuestas').select('language', { count: 'exact' }).not('language', 'is', null),
            supabase.from('respuestas').select('screen_resolution', { count: 'exact' }).not('screen_resolution', 'is', null),
            supabase.from('respuestas').select('timezone', { count: 'exact' }).not('timezone', 'is', null)
        ]);

        if (totalRespuestas.error) throw totalRespuestas.error;
        if (uniqueIpsCount.error) throw uniqueIpsCount.error;
        if (colorsCount.error) throw colorsCount.error;
        if (countriesCount.error) throw countriesCount.error;
        if (platformsCount.error) throw platformsCount.error;
        if (languagesCount.error) throw languagesCount.error;
        if (resolutionsCount.error) throw resolutionsCount.error;
        if (timezonesCount.error) throw timezonesCount.error;

        // Procesamos los resultados para dar el formato que espera tu frontend
        const colors = {};
        colorsCount.data.forEach(item => { colors[item.color] = (colors[item.color] || 0) + 1; });
        const formattedColors = Object.entries(colors).map(([color, count]) => ({ color, count }));

        const countries = {};
        countriesCount.data.forEach(item => { countries[item.country] = (countries[item.country] || 0) + 1; });
        const formattedCountries = Object.entries(countries).map(([country, count]) => ({ country, count }));

        const platforms = {};
        platformsCount.data.forEach(item => { platforms[item.platform] = (platforms[item.platform] || 0) + 1; });
        const formattedPlatforms = Object.entries(platforms).map(([platform, count]) => ({ platform, count }));

        const languages = {};
        languagesCount.data.forEach(item => { languages[item.language] = (languages[item.language] || 0) + 1; });
        const formattedLanguages = Object.entries(languages).map(([language, count]) => ({ language, count }));

        const resolutions = {};
        resolutionsCount.data.forEach(item => { resolutions[item.screen_resolution] = (resolutions[item.screen_resolution] || 0) + 1; });
        const formattedResolutions = Object.entries(resolutions).map(([resolution, count]) => ({ screen_resolution: resolution, count }));

        const timezones = {};
        timezonesCount.data.forEach(item => { timezones[item.timezone] = (timezones[item.timezone] || 0) + 1; });
        const formattedTimezones = Object.entries(timezones).map(([timezone, count]) => ({ timezone, count }));

        res.json({
            total: totalRespuestas.count,
            unique_ips: uniqueIpsCount.count,
            colors: formattedColors,
            countries: formattedCountries,
            regions: [], // Por simplicidad, lo dejamos vacío o lo calculas similar a countries
            platforms: formattedPlatforms,
            languages: formattedLanguages,
            resolutions: formattedResolutions,
            timezones: formattedTimezones
        });

    } catch (err) {
        console.error('Error en /stats-data:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta: /api/perfil/:id
app.get('/api/perfil/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select('*')
            .eq('id', id)
            .single(); // Esperamos un solo resultado

        if (error) {
            if (error.code === 'PGRST116') { // Código de "no se encontró ninguna fila"
                return res.status(404).json({ error: 'No se encontró el perfil' });
            }
            console.error('Error al obtener perfil por ID:', error);
            throw new Error(error.message);
        }

        res.json(perfil);
    } catch (err) {
        console.error('Error en /api/perfil/:id:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta: /api/stats (para otras estadísticas que puedas necesitar)
app.get('/api/stats', async (req, res) => {
    try {
        // Consultas para obtener datos agregados
        const totalRespuestas = await supabase.from('respuestas').select('*', { count: 'exact', head: true });

        const coloresData = await supabase.from('respuestas').select('color').not('color', 'is', null);
        const paisesData = await supabase.from('respuestas').select('country').not('country', 'is', null);

        const avgTiempoData = await supabase.from('respuestas').select('tiempo_seleccion').not('tiempo_seleccion', 'is', null).not('tiempo_seleccion', 'eq', 'No consentido');
        const avgClicsData = await supabase.from('respuestas').select('clics_erroneos').not('clics_erroneos', 'is', null).not('clics_erroneos', 'eq', 'No consentido');
        const avgScrollData = await supabase.from('respuestas').select('porcentaje_scroll').not('porcentaje_scroll', 'is', null).not('porcentaje_scroll', 'eq', 'No consentido');

        if (totalRespuestas.error) throw totalRespuestas.error;
        if (coloresData.error) throw coloresData.error;
        if (paisesData.error) throw paisesData.error;
        if (avgTiempoData.error) throw avgTiempoData.error;
        if (avgClicsData.error) throw avgClicsData.error;
        if (avgScrollData.error) throw avgScrollData.error;

        // Procesamos los resultados
        const colores = {};
        coloresData.data.forEach(item => { colores[item.color] = (colores[item.color] || 0) + 1; });
        const formattedColores = Object.entries(colores).map(([color, cantidad]) => ({ color, cantidad }));

        const paises = {};
        paisesData.data.forEach(item => { paises[item.country] = (paises[item.country] || 0) + 1; });
        const formattedPaises = Object.entries(paises).map(([country, cantidad]) => ({ country, cantidad }));

        const avgTiempo = avgTiempoData.data.reduce((sum, item) => sum + parseInt(item.tiempo_seleccion || 0), 0) / (avgTiempoData.data.length || 1);
        const avgClics = avgClicsData.data.reduce((sum, item) => sum + parseInt(item.clics_erroneos || 0), 0) / (avgClicsData.data.length || 1);
        const avgScroll = avgScrollData.data.reduce((sum, item) => sum + parseInt(item.porcentaje_scroll || 0), 0) / (avgScrollData.data.length || 1);

        res.json({
            total_respuestas: totalRespuestas.count,
            colores: formattedColores,
            paises: formattedPaises,
            promedio_tiempo: Math.round(avgTiempo),
            indecisos_promedio: Math.round(avgClics),
            scroll_promedio: Math.round(avgScroll)
        });

    } catch (err) {
        console.error('Error en /api/stats:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// --- Exportar la app para Vercel ---
module.exports = app;

// --- Iniciar servidor localmente (solo para pruebas) ---
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Servidor con Supabase corriendo localmente en http://localhost:${PORT}`);
        console.log(`📁 Sirviendo archivos estáticos desde: ${publicPath}`);
    });
}