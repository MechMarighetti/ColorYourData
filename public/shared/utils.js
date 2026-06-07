
export const COLOR_OPTIONS = [
    { hex: '#c41e3a', name: 'Rojo Elegante' },
    { hex: '#ff4444', name: 'Rojo Coral' },
    { hex: '#FF6F91', name: 'Fucsia Suave' },
    { hex: '#FFB3BA', name: 'Rosa Caramelo' },
    { hex: '#FFD1DC', name: 'Crema de Fresa' },
/*     { hex: '#F7CAC9', name: 'Rosa Cuarzo' }, */
    { hex: '#e6633c', name: 'Rojo Terracota' },
    { hex: '#ff8c00', name: 'Naranja Oscuro' },
    { hex: '#ffa826', name: 'Naranja Brillante' },
    { hex: '#F0B27A', name: 'Coral Claro' },
    { hex: '#FFDFBA', name: 'Durazno Dulce' },
   /*  { hex: '#FFC3A0', name: 'Salmón Rosado' }, */
  /*   { hex: '#FAD7A1', name: 'Melocotón Pastel' },
    /* { hex: '#F5DEB3', name: 'Trigo Dorado' }, */
    /* { hex: '#daa520', name: 'Oro Trigo' }, */
    /*{ hex: '#F9E79F', name: 'Amarillo Pastel' }, */
    { hex: '#F7DC6F', name: 'Melón Suave' },
    { hex: '#FFFFBA', name: 'Amarillo Mantequilla' },
    { hex: '#F9F871', name: 'Amarillo Sol' },
    { hex: '#b4e45c', name: 'Verde Limón' },
    { hex: '#44aa25', name: 'Verde Bosque' },
  /*   { hex: '#B4F8C8', name: 'Verde Primavera' }, */
    { hex: '#BAFFC9', name: 'Menta Suave' },
    { hex: '#A3E4D7', name: 'Verde Agua' },
    { hex: '#A3E4D7', name: 'Verde Menta' },
   /*  { hex: '#A0E7E5', name: 'Turquesa Claro' }, */
    { hex: '#76D7C4', name: 'Aqua Fresco' },
    { hex: '#1ea5a5', name: 'Aqua Mágico' },
    { hex: '#20b2aa', name: 'Verde Azulado' },
    /* { hex: '#BAE1FF', name: 'Azul Cielo' }, */
    { hex: '#61bbf7', name: 'Celeste Puro' },
    { hex: '#3471aa', name: 'Azul Océano' },
    { hex: '#006994', name: 'Azul Profundo' },
    { hex: '#606ffc', name: 'Azul Índigo' },
    /* { hex: '#E6E6FA', name: 'Perla Lavanda' }, */
    { hex: '#F5E1FD', name: 'Lavanda Bebé' },
    { hex: '#D7BDE2', name: 'Lila Grisáceo' },
    { hex: '#d8a8e6', name: 'Lila Claro' },
    { hex: '#9f1ea3', name: 'Magenta Profundo' },
    { hex: '#5216a1', name: 'Púrpura Oscuro' },
   /*  { hex: '#8b4789', name: 'Morado Viñedo' }, */
];


export const COLOR_NAMES = {
    '#c41e3a': 'Rojo Elegante',
    '#ff4444': 'Rojo Coral',
    '#FF6F91': 'Fucsia Suave',
    '#FFB3BA': 'Rosa Caramelo',
    '#FFD1DC': 'Crema de Fresa',
    '#F7CAC9': 'Rosa Cuarzo',
    '#e6633c': 'Rojo Terracota',
    '#ff8c00': 'Naranja Oscuro',
    '#ffa826': 'Naranja Brillante',
    '#F0B27A': 'Coral Claro',
    '#FFDFBA': 'Durazno Dulce',
    '#FFC3A0': 'Salmón Rosado',
    '#FAD7A1': 'Melocotón Pastel',
    '#F5DEB3': 'Trigo Dorado',
    '#daa520': 'Oro Trigo',
    '#F9E79F': 'Amarillo Pastel',
    '#F7DC6F': 'Melón Suave',
    '#FFFFBA': 'Amarillo Mantequilla',
    '#F9F871': 'Amarillo Sol',
    '#b4e45c': 'Verde Limón',
    '#44aa25': 'Verde Bosque',
    '#B4F8C8': 'Verde Primavera',
    '#BAFFC9': 'Menta Suave',
    '#A3E4D7': 'Verde Agua',
    '#A3E4D7': 'Verde Menta',
    '#A0E7E5': 'Turquesa Claro',
    '#76D7C4': 'Aqua Fresco',
    '#1ea5a5': 'Aqua Mágico',
    '#20b2aa': 'Verde Azulado',
    '#BAE1FF': 'Azul Cielo',
    '#61bbf7': 'Celeste Puro',
    '#3471aa': 'Azul Océano',
    '#006994': 'Azul Profundo',
    '#606ffc': 'Azul Índigo',
    '#E6E6FA': 'Perla Lavanda',
    '#F5E1FD': 'Lavanda Bebé',
    '#D7BDE2': 'Lila Grisáceo',
    '#d8a8e6': 'Lila Claro',
    '#9f1ea3': 'Magenta Profundo',
    '#5216a1': 'Púrpura Oscuro',
    '#8b4789': 'Morado Viñedo'
}

export const DATA_FIELDS = [
    { key: 'color', icon: '🎨', label: 'Color elegido', description: 'Es la respuesta central de la encuesta y permite comparar preferencias de color de forma anonima.' },
    { key: 'ip', icon: '📍', label: 'IP', description: 'Se usa para agrupar visitas aproximadas y construir tu historial local sin pedir nombre ni email.' },
    { key: 'country_region', icon: '🌎', label: 'Pais y region', description: 'La ubicacion aproximada ayuda a ver tendencias por zona geografica sin identificarte personalmente.' },
    { key: 'tiempo_seleccion', icon: '⏱️', label: 'Tiempo de seleccion', description: 'Mide cuanto tardaste en elegir para explicar como una pagina puede analizar tu comportamiento.' },
    { key: 'clics_erroneos', icon: '🖱️', label: 'Clics erroneos', description: 'Cuenta cambios o intentos previos para mostrar señales de decision o exploracion.' },
    { key: 'movimientos_mouse', icon: '🧭', label: 'Movimientos del mouse', description: 'Resume por que zonas pasaste el cursor; no guarda coordenadas exactas, solo un patron simplificado.' },
    { key: 'porcentaje_scroll', icon: '📜', label: 'Porcentaje de scroll', description: 'Indica que tanto recorriste la pagina y si llegaste a leer las secciones inferiores.' },
    { key: 'pausas_scroll', icon: '⏸️', label: 'Pausas de scroll', description: 'Detecta momentos de pausa durante la lectura para explicar analitica de atencion.' },
    { key: 'platform_user_agent', icon: '💻', label: 'Plataforma y navegador', description: 'El navegador revela sistema operativo, version y motor; combinado con otros datos puede diferenciar dispositivos.' },
    { key: 'language', icon: '🗣️', label: 'Idioma', description: 'El idioma del navegador permite analizar preferencias culturales y adaptar contenido.' },
    { key: 'screen_resolution', icon: '📺', label: 'Resolucion de pantalla', description: 'Ayuda a entender el tipo de dispositivo y tambien forma parte de una huella tecnica.' },
    { key: 'color_depth', icon: '🌈', label: 'Profundidad de color', description: 'Cantidad de bits de color soportados por la pantalla; es una senal tecnica del dispositivo.' },
    { key: 'timezone', icon: '🕒', label: 'Zona horaria', description: 'Permite inferir zona geografica aproximada y comparar horarios de uso.' },
    { key: 'cpu_cores', icon: '🧠', label: 'Nucleos de CPU', description: 'Cantidad de nucleos logicos reportados por el navegador; aporta contexto sobre el dispositivo.' },
    { key: 'device_memory', icon: '💾', label: 'Memoria del dispositivo', description: 'Memoria aproximada informada por el navegador; otra pista tecnica del equipo.' },
    { key: 'fingerprint', icon: '🔐', label: 'Huella digital', description: 'Identificador generado desde caracteristicas del navegador. Aqui lo mostramos con un nombre amable y anonimo.' },
    { key: 'timestamp', icon: '🗓️', label: 'Hora de la visita', description: 'Fecha y hora en que se registro la eleccion para ordenar el historial.' },
    { key: 'mapa_ubicacion', icon: '🗺️', label: 'Ubicación aproximada', description: 'Posición geográfica detectada por tu dispositivo al dar permiso.' }
];

export function normalizeHex(color) {

  if (!color) return '#cccccc';
  return color.startsWith('#') ? color.toUpperCase() : `#${color}`.toUpperCase();
}

export function colorName(color) {
  const hex = normalizeHex(color);
  return COLOR_NAMES[hex] || hex;
}

export function hexToRgba(hex, alpha = 1) {
    // Eliminar # si existe
    hex = hex.replace('#', '');
    let r, g, b;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      return `rgba(0,0,0,${alpha})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }


