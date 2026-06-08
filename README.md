# 📊 COLOR YOUR DATA

> ¿Qué aceptamos cuando clickeamos un checkbox?

**Autores:** Brizuela, Ludmila; Marighetti, Mercedes; Sordo, Teo.  
**Asignatura:** Trabajo, Tecnología y Sociedad  

[🎨 Presentación interactiva](https://canva.link/5zy7xnfx87qs2rw) | [🌐 Aplicación en vivo](https://color-your-data.vercel.app)

---

## 📌 Objeto del Proyecto

Este trabajo versa sobre el **consentimiento**, la aceptación de términos y condiciones, y el **tratamiento de la información** en entornos digitales. Consiste en una aplicación web que recopila **datos pasivos del navegador** y **datos comportamentales de la sesión** del usuario para generar contenido didáctico basado en métricas reales.

La aplicación demuestra cómo es posible construir herramientas analíticas potentes respetando la privacidad de las personas desde la arquitectura del código.

---

## 🌍 Contexto Internacional y Estándares de Privacidad

En la economía digital actual, los datos son el motor que permite a las organizaciones alcanzar a un mayor número de usuarios de manera precisa. Sin embargo, es crucial proteger derechos fundamentales como la intimidad y la autodeterminación informativa.

A nivel global, la tendencia normativa apunta hacia leyes rigurosas centradas en el usuario, tomando como principal referente el **Reglamento General de Protección de Datos de la Unión Europea (GDPR)**, vigente desde 2018. Este reglamento exige:

- Consentimiento explícito
- Transparencia
- *Accountability* (responsabilidad demostrable)
- Privacidad desde el diseño (*Privacy by Design*)

A este estándar se suma el **Convenio 108** del Consejo de Europa (aprobado en Argentina mediante **Ley N° 27.483**), que establece principios rectores globales para el tratamiento automatizado de datos personales.

---

## 🇦🇷 Garantía Constitucional y Marco Legal Argentino

La protección de datos en Argentina tiene **jerarquía constitucional**. El **artículo 43 de la Constitución Nacional** consagra la acción de *Habeas Data*, garantizando a toda persona el derecho a conocer qué datos propios constan en registros, su finalidad, y a exigir su supresión o confidencialidad.

Sobre esta base se asienta la **Ley 25.326 de Protección de Datos Personales** (2000), que establece normativas para cualquier sistema que recopile, guarde o procese información, garantizando que las personas mantengan el control sobre sus datos.

### Conceptos clave para el desarrollo de software

| Concepto | Definición |
|----------|-------------|
| **Dato Personal** | Información referida a personas físicas o jurídicas determinadas o determinables (IP, ubicación, huellas digitales, etc.) |
| **Dato Sensible** | Origen racial, opiniones políticas, creencias religiosas, salud, vida sexual. Recolección muy restringida. |
| **Disociación de Datos** | Tratamiento que impide asociar la información a una persona determinada o determinable (anonimización). |
| **Tratamiento de Datos** | Operaciones sistemáticas, electrónicas o no, de recolección, almacenamiento, modificación, evaluación o destrucción. |

### Principios fundamentales

- **Consentimiento**: libre, expreso e informado antes de recolectar datos.
- **Calidad y Finalidad**: sólo datos necesarios para el fin informado.
- **Seguridad y Confidencialidad**: medidas técnicas contra hackeos, filtraciones o adulteraciones.
- **Derechos ARCO**: Acceso, Rectificación, Actualización, Supresión en cualquier momento.

---

## ⚙️ Aplicación Práctica: «COLOR YOUR DATA»

### Arquitectura de datos y consentimiento

La aplicación clasifica la recolección de métricas en **dos niveles de consentimiento**, garantizando que los datos no sean excesivos y cumplan una finalidad específica:

#### ✅ Datos técnicos de recolección obligatoria (check principal)
Referidos a las características técnicas del dispositivo:
- Color elegido
- IP (enmascarada)
- Ubicación general (país, región, latitud, longitud)
- User agent, plataforma, idioma
- Resolución y profundidad de color de pantalla
- Zona horaria
- Núcleos de CPU, memoria del dispositivo
- *Fingerprint* (identificador único del navegador)
- *Timestamp*

#### 🔘 Datos comportamentales opcionales (check secundario)
Referidos a la interacción del usuario durante la sesión:
- Tiempo de selección
- Clics erróneos
- Movimientos del mouse
- Porcentaje de scroll
- Pausas en el scroll

### Tratamiento y disociación de la información

El sistema opera bajo una premisa estricta de **privacidad por diseño**. Conforme al artículo 2 de la Ley 25.326, se aplica un procedimiento unidireccional de **disociación de datos** sobre los identificadores técnicos recopilados (IP y *fingerprint*). Para ello se utiliza una función criptográfica **hash SHA-256**, que transforma el dato original en una cadena alfanumérica irreversible.

> 🔐 De esta manera, la información final es puramente estadística y técnica, imposibilitando su asociación directa con una persona física o jurídica. Esto impide que las métricas puedan integrarse en matrices de vigilancia de terceros o agencias externas.

### Situación registral

Dado que la aplicación aplica disociación y no almacena información que encuadre legalmente como "Dato Personal" identificable, la base de datos **no requiere inscripción** en el Registro Nacional de Bases de Datos (Agencia de Acceso a la Información Pública). No obstante, se detalla el protocolo estándar que se seguiría en caso de necesitarlo.

#### Protocolo de registro (para referencia)
- **Trámite de inscripción**: a través de la plataforma TAD (Trámites a Distancia)
- **Información requerida**: tipo de persona, CUIT/CUIL, razón social
- **Datos de la base**: nombre, finalidad, vías de reclamación
- **Procedimiento ARCO**: acreditación de identidad y formulario de solicitud

---


## 🧩 Características Técnicas

- **Frontend**: HTML, CSS, JavaScript vanilla (sin frameworks)
- **Backend**: Node.js + Express
- **Base de datos**: PostgreSQL (Supabase)
- **Hosting**: Vercel
- **Hash para disociación**: SHA-256
- **Fingerprinting**: librería `fingerprintjs` (client-side)

---

## 📁 Estructura del Proyecto
  color-your-data/
  ├── public/
│   ├── index.html          # Encuesta principal
│   ├── stats.html          # Estadísticas globales
│   ├── perfil.html         # Perfil de sesión
│   ├── huella.html         # Huella digital del usuario
│   ├── script.js           # Lógica modularizada (colores, interacción)
│   ├── perfil.js           # Estilos dinámicos basados en datos
│   └── styles.css
├── server.js               # API endpoints
├── package.json
├── .env.example
└── README.md

## 📡 Endpoints de la API
| Método | Endpoint | Descripción |
|----------|-------------|----------------------|
| POST  | /guardar-color  | Guarda una nueva selección de color (con datos técnicos y comportamentales)|
| GET |	/api/stats	| Devuelve estadísticas globales (conteo por color, etc.)|
| GET	| /api/perfil/:id |	Obtiene el perfil de una sesión específica por ID|
| GET	| /api/mi-perfil	|  Obtiene el perfil de la IP actual (última sesión)|
| GET	| /timeline-data	| Historial de respuestas por IP actual|


## 💡 Conclusión del Proyecto

**COLOR YOUR DATA** demuestra que es posible crear herramientas web funcionales y ricas en analíticas **sin comprometer los derechos fundamentales**. La implementación técnica de la disociación de datos (hashing criptográfico) no es un simple atajo burocrático, sino un **compromiso ético y legal de "Privacidad por Diseño"**. Frente a filtraciones masivas y comercialización desregulada, garantizar el anonimato desde la arquitectura del código es la forma más efectiva de cumplir con la Ley 25.326 y proteger a los usuarios.

---