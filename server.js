

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

function random_name(fingerprint) {
    const adjetivos = ['Luminoso', 'Curioso', 'Saltarin', 'Tranquilo', 'Brillante', 'Oscuro', 'Veloz', 'Sereno', 'Magico', 'Amable', 'Audaz', 'Sutil', 'Elegante', 'Radiante', 'Misterioso', 'Divertido', 'Sabio', 'Dulce', 'Fresco', 'Vibrante'];
    const sustantivos = ['Zorro', 'Nube', 'Lince', 'Pez', 'Gato', 'Luna', 'Sol', 'Estrella', 'Mariposa', 'Colibri', 'Tigre', 'Delfin', 'Arbol', 'Piedra', 'Rio', 'Nube', 'Fenix', 'Dragon', 'Buho', 'Coral'];
    const value = String(fingerprint || 'sin-huella');
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    const idx1 = Math.abs(hash) % adjetivos.length;
    const idx2 = Math.abs(hash >> 8) % sustantivos.length;
    return `${adjetivos[idx1]} ${sustantivos[idx2]}`;
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
        const fingerprintName = random_name(data.fingerprint);
        const payload = {
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
            fingerprint_name: fingerprintName,
            tiempo_seleccion: data.tiempo_seleccion || 'No consentido',
            clics_erroneos: data.clics_erroneos || 'No consentido',
            movimientos_mouse: data.movimientos_mouse || 'No consentido',
            porcentaje_scroll: data.porcentaje_scroll || 'No consentido',
            pausas_scroll: data.pausas_scroll || 'No consentido',
            terms_read: data.terms_read
        };

        let { data: newResponse, error: insertError } = await supabase
            .from('respuestas')
            .insert([payload])
            .select(); // Para que nos devuelva el registro insertado, incluyendo su ID.

        if (insertError && String(insertError.message || '').includes('fingerprint_name')) {
            console.warn('La columna fingerprint_name no existe todavia. Ejecuta la migracion Supabase incluida.');
            const fallbackPayload = { ...payload };
            delete fallbackPayload.fingerprint_name;
            const retry = await supabase
                .from('respuestas')
                .insert([fallbackPayload])
                .select();
            newResponse = retry.data;
            insertError = retry.error;
        }

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
            .select('*')
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
app.get('/api/transparencia', async (req, res) => {
    try {
        const { data: registros, error } = await supabase
            .from('respuestas')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(1000);

        if (error) throw error;

        // Devolver directamente el array de filas (el frontend lo espera como array)
        res.json(registros || []);
    } catch (err) {
        console.error('Error en /api/transparencia:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Ruta: /api/mi-perfil
app.get('/api/mi-perfil', async (req, res) => {
    try {
        const cleanIp = getClientIp(req);
        // Obtenemos la última respuesta para esta IP
        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select('*')
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

// Ruta: /stats-data (para tu pagina stats.html)
app.get('/stats-data', async (req, res) => {
    try {
        const { data: responses, error } = await supabase
            .from('respuestas')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(2000);

        if (error) throw error;

        const rows = responses || [];
        const countBy = (key) => {
            const counts = {};
            rows.forEach(item => {
                const value = item[key] || 'No disponible';
                counts[value] = (counts[value] || 0) + 1;
            });
            return Object.entries(counts).map(([value, count]) => ({ [key]: value, count }));
        };

        const formattedColors = countBy('color').map(item => ({ color: item.color, count: item.count }));
        const formattedCountries = countBy('country').map(item => ({ country: item.country, count: item.count }));
        const formattedRegions = countBy('region').map(item => ({ region: item.region, count: item.count }));
        const formattedPlatforms = countBy('platform').map(item => ({ platform: item.platform, count: item.count }));
        const formattedLanguages = countBy('language').map(item => ({ language: item.language, count: item.count }));
        const formattedResolutions = countBy('screen_resolution').map(item => ({ screen_resolution: item.screen_resolution, count: item.count }));
        const formattedTimezones = countBy('timezone').map(item => ({ timezone: item.timezone, count: item.count }));
        const uniqueIps = new Set(rows.map(item => item.ip).filter(Boolean)).size;
        const uniqueFingerprints = new Set(rows.map(item => item.fingerprint).filter(Boolean)).size;
        const terminosLeidos = rows.filter(item => item.terms_read === true).length;

        res.json({
            total: rows.length,
            unique_ips: uniqueIps,
            unique_fingerprints: uniqueFingerprints,
            terms_read: terminosLeidos,
            colors: formattedColors,
            countries: formattedCountries,
            regions: formattedRegions,
            platforms: formattedPlatforms,
            languages: formattedLanguages,
            resolutions: formattedResolutions,
            timezones: formattedTimezones,
            responses: rows.map(item => ({
                ...item,
                fingerprint_name: item.fingerprint_name || random_name(item.fingerprint)
            }))
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

app.get('/transparencia', (req, res) => {
    res.sendFile(path.join(publicPath, 'transparencia.html'));
});

app.post('/registrar-lectura', async (req, res) => {
    try {
        const { fingerprint } = req.body;
        if (!fingerprint) return res.status(400).json({ error: 'Fingerprint requerido' });

        // Actualizamos todas las respuestas de este fingerprint
        const { error } = await supabase
            .from('respuestas')
            .update({ terms_read: true })
            .eq('fingerprint', fingerprint);

        if (error) {
            console.error('Error al actualizar terms_read:', error);
            return res.status(500).json({ error: 'Error al registrar lectura' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error en /registrar-lectura:', err);
        res.status(500).json({ error: 'Error interno' });
    }
});

// --- Exportar la app para Vercel ---
module.exports = app;

// --- Iniciar servidor localmente (solo para pruebas) ---
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Servidor con Supabase corriendo localmente en http://localhost:${PORT}`);
        console.log(`📁 Sirviendo archivos estáticos desde: ${publicPath}`);
        console.log(`📁 Sirviendo transparencia desde: ${publicPath}/transparencia`);
    });
}
