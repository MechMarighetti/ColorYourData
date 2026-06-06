// server.js

import path from 'path';
import { fileURLToPath} from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import express from 'express';
import crypto from 'crypto';


dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));
// Configuración de middlewares
app.use(express.json()); // Para parsear el cuerpo de las peticiones JSON

const supabaseUrl = process.env.CYD_SUPABASE_URL;
const supabaseAnonKey = process.env.CYD_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.CYD_SUPABASE_SERVICE_KEY;

// Creamos el cliente de Supabase para interactuar con la base de datos
const supabase = createClient(supabaseUrl, supabaseAnonKey);
// --- Fin de la inicialización de Supabase ---

function hashIp(ip) {
    const salt = "cyd2026tts";
    
    const iphash = crypto.createHash('sha256').update(ip + salt).digest('hex');
    return iphash;
}
function hashFingerprint(fingerprint) {
    const salt = "cyd2026ttsfp";
    const fphash = crypto.createHash('sha256').update(fingerprint + salt).digest('hex');
    return fphash;
}

// en el Server necesito hacer el req del ip, el clinet y el sessionid

function random_name(fingerprint) {
    const adjetivos = ['Luminoso', 'Curioso', 'Saltarin', 'Tranquilo', 'Brillante', 'Oscuro', 'Veloz', 'Sereno', 'Magico', 'Amable', 'Audaz', 'Sutil', 'Elegante', 'Radiante', 'Misterioso', 'Divertido', 'Sabio', 'Dulce', 'Fresco', 'Vibrante'];
    const sustantivos = ['Zorro', 'Nube', 'Lince', 'Pez', 'Gato', 'Luna', 'Sol', 'Estrella', 'Mariposa', 'Colibri', 'Tigre', 'Delfin', 'Arbol', 'Piedra', 'Rio', 'Nube', 'Fenix', 'Dragon', 'Buho', 'Coral'];
    const verbos = ['Brilla', 'Corre', 'Salta', 'Vuela', 'Nada', 'Danza', 'Canta', 'Ruge', 'Susurra', 'Explora', 'Descubre', 'Ilumina', 'Fluye', 'Crece', 'Resplandece'];
    const adverbios = ['rápidamente', 'suavemente', 'alegremente', 'silenciosamente', 'valientemente', 'cuidadosamente', 'misteriosamente', 'elegantemente', 'vibrantemente', 'dulcemente'];

    const value = String(fingerprint || 'sin-huella');
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash) + value.charCodeAt(i);
        hash |= 0;
    }
    const idx1 = Math.abs(hash) % adjetivos.length;
    const idx2 = Math.abs(hash >> 8) % sustantivos.length;
    const idx3 = Math.abs(hash >> 16) % verbos.length;
    const idx4 = Math.abs(hash >> 24) % adverbios.length;
    const nombre_inventado = `${adjetivos[idx1]} ${sustantivos[idx2]}`;
    const narrativa = `${verbos[idx3]} ${adverbios[idx4]}`;
    return  `${nombre_inventado}, ${narrativa}` ;
}

    async function getGeolocation(ip) {
        const response = await fetch(`https://api.iplocation.net/?ip=${ip}`);
        const geo = await response.json();
        if (geo.response_code === '200') {
            return {
                country: geo.country_name || 'Desconocido',
                region: geo.region || 'No disponible'
            };
        }
        return { country: 'Desconocido', region: 'No disponible' };
    }
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

        const hashedIp = hashIp(cleanIp);

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
        
        const payload = {
            color: data.color,
            ip: hashIp(cleanIp), // Guardamos la IP hasheada para mayor privacidad
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
            fingerprint: hashFingerprint(data.fingerprint), // Guardamos la huella hasheada para mayor privacidad
            fingerprint_name: random_name(data.fingerprint), // Nombre inventado basado en la huella (sin revelar la huella real)
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
       // Guardamos la IP real para mostrarla en el perfil, aunque solo guardamos la versión hasheada en la base de datos.

        res.json({ success: true, sessionId: sessionId});

    } catch (err) {
        console.error('Error en /guardar-color:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});


app.get('/perfil', (req, res) => {
    res.sendFile(path.join(publicPath, 'perfil.html'));
});


app.get('/api/perfil/:fingerprint', async (req, res) => {
  try {
    const { fingerprint } = req.params;
    const { data, error } = await supabase
      .from('respuestas')
      .select('*')
      .eq('fingerprint', fingerprint)
      .order('timestamp', { ascending: false })
      .limit(1);
    
    if (error || !data || data.length === 0) 
      return res.status(404).json({ error: 'No encontrado' });
    res.json(data[0]);
  } catch(err) {
    res.status(500).json({ error: 'Error interno' });
  }
});

// Ruta: /timeline-data
app.get('/timeline-data', async (req, res) => {
    try {
        const cleanIp = req.query.ip || getClientIp(req);
        const hashedIp = hashIp(cleanIp);

        // 1. Obtener el timeline para esta IP
        const { data: timeline, error: timelineError } = await supabase
            .from('respuestas')
            .select('*')
            .eq('ip', hashedIp)
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

        res.json({ currentIp: cleanIp, timeline: timeline, hashedIp: hashedIp || [], groupedByIp: groupedByIp });

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
        const hashedIp = hashIp(cleanIp);

        // Obtenemos la última respuesta para esta IP
        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select('*')
            .eq('ip', hashedIp)
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
// Ruta: /api/perfil (alias de /api/mi-perfil para el visitante actual)
app.get('/api/perfil', async (req, res) => {
    try {
        const cleanIp = getClientIp(req);
        const iphash = hashIp(cleanIp);

        // Obtenemos la última respuesta para esta IP
        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select('*')
            .eq('ip', iphash)
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
        console.error('Error en /api/perfil:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta: /api/perfil/:id (por ID específico)
app.get('/api/perfil/:id', async (req, res) => { 
    try {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
        
        const { data: perfil, error } = await supabase
            .from('respuestas')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'No se encontró el perfil' });
            }
            console.error('Error SQL:', error);
            return res.status(500).json({ error: 'Error en la consulta' });
        }

        if (!perfil) {
            return res.status(404).json({ error: 'Perfil no existe' });
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
        const cpu_cores = await supabase.from('respuestas').select('cpu_cores').not('cpu_cores', 'is', null).not('cpu_cores', 'eq', 'No consentido');

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
export default app;

// --- Iniciar servidor localmente (solo para pruebas) ---
const isLocal = process.env.NODE_ENV !== 'production';
if (isLocal) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`✅ Servidor con Supabase corriendo localmente en http://localhost:${PORT}`);
        console.log(`📁 Sirviendo archivos estáticos desde: ${publicPath}`);
        console.log(`📁 Sirviendo transparencia desde: ${publicPath}/transparencia`);
    });
}
