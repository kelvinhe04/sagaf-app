# CONTEXTO DEL PROYECTO — SAGAF (Sistema Automatizado de Gestión de Análisis Financiero)

> **Documento maestro de contexto** consolidado a partir de todo el material entregado en la carpeta `Contexto/`: el documento académico (Parcial ISA 4 V2.0.pdf), los 4 diagramas de casos de uso, el diagrama de clases y el prototipo HTML semi-funcional.

---

## 1. Identificación del Proyecto

| Atributo | Detalle |
|---|---|
| **Nombre del Sistema** | **SAGAF** — Sistema Automatizado de Gestión de Análisis Financiero |
| **Entidad destinataria** | Unidad de Análisis Financiero (UAF) de Panamá |
| **Universidad** | Universidad Tecnológica de Panamá — Facultad de Ingeniería de Sistemas Computacionales |
| **Departamento** | Sistemas de Información, Control y Evaluación de Recursos Informáticos |
| **Carrera** | Desarrollo y Gestión de Software |
| **Materia** | Ingeniería de Software Aplicada IV |
| **Grupo** | 1GS241 (SAGAF Grupo C) |
| **Facilitador** | María Félix Mosquera |
| **Año académico** | 2026 |
| **Tema** | Monitoreo permanente del cliente: Convergencia tecnológica entre la Ley 23 de 2015 y la Ley 81 de Protección de Datos Personales en Panamá |



## 2. Problemática

Los sujetos obligados financieros y no financieros (bancos, inmobiliarias, casinos, abogados, zonas francas, contadores, etc.) deben aplicar **debida diligencia, monitoreo continuo y reporte de operaciones sospechosas (ROS)** conforme a la **Ley 23 de 2015** de Panamá. Hoy esa gestión adolece de:

- **Registro y análisis fragmentado**: cada sector reporta de forma distinta, sin estandarización.
- **Validación limitada de partes**: en operaciones bancarias no se distingue claramente entre quien realiza la transacción y el beneficiario.
- **Carga documental poco controlada**: los documentos se gestionan en bloque, sin un contenedor por requisito documental.
- **Riesgo de exposición de datos personales**: el portal público podría autocompletar datos sensibles de cédulas ya registradas, violando la Ley 81 de 2019.
- **Necesidad de trazabilidad interna**: la UAF requiere una vista interna con bandeja, resumen, riesgo, documentos, auditoría y subsanación.

---

## 3. Propuesta de Solución

**SAGAF** es un sistema dividido en **dos componentes principales**:

### 3.1 Portal Público para Sujetos Obligados
- Hospedado por la UAF (posiblemente mediante infraestructura de la **AIG**).
- Ingreso con credenciales institucionales + **MFA** (autenticación multifactor).
- Registro de ROS mediante **formulario dinámico** según el sector (Banco, Inmobiliaria, otros).
- Validación de cédula/pasaporte/RUC **sin exponer datos sensibles**: solo muestra el nombre para corroboración.
- Carga **individualizada** de documentos: cada requisito tiene su propio contenedor.

### 3.2 Sistema Interno UAF
- Bandeja de ROS recibidos, ordenada por riesgo, estado y completitud documental.
- Resumen del caso, clasificación de riesgo (alto/medio/bajo), documentos, auditoría.
- Acciones de subsanación, validación de análisis, vinculación intersectorial.
- Reportes operativos y estratégicos con enmascaramiento/anonimización.

> **Principio rector**: el sistema **no sustituye el análisis humano** ni determina culpabilidad. Su función es mejorar recepción, trazabilidad, priorización, control documental y análisis.

---

## 4. Marco Teórico Referencial (Base Legal y Técnica)

### 4.1 Ley 23 de 2015 — Prevención de Blanqueo de Capitales
- Piedra angular del proyecto.
- Obliga a identificar al **beneficiario final** y realizar debida diligencia basada en riesgo.
- Establece el **monitoreo permanente**: examen continuo del perfil transaccional del cliente para verificar coherencia entre el volumen/naturaleza de operaciones y la actividad económica declarada.

### 4.2 Ley 81 de 2019 — Protección de Datos Personales
- Todo tratamiento requiere consentimiento del titular o excepción legal (como prevención de delitos).
- Principios: lealtad, finalidad y proporcionalidad.
- Define datos sensibles y derechos **ARCO** (Acceso, Rectificación, Cancelación, Oposición).

### 4.3 Privacidad desde el Diseño (Privacy by Design)
- **Minimización de datos**: recolectar solo lo estrictamente necesario.
- **Seguridad extremo a extremo**: datos viajan y se almacenan cifrados.
- **Transparencia**: registros de auditoría (logs) inalterables.

### 4.4 Estándares GAFI
- Enfoque basado en riesgo y monitoreo continuo durante toda la relación comercial.

### 4.5 Referencias técnicas citadas
- **TLS** (Cloudflare 2018) — cifrado de tránsito.
- **MFA** (Microsoft 2026) — autenticación multifactor obligatoria.
- **AES-256** (Progress 2022) — cifrado de datos en reposo.
- **UAF Panamá** (2018) — Manuales de Calidad de ROS.

---

## 5. Diseño del Formulario

### 5.1 Propósito
Permitir que sujetos obligados registren ROS de forma segura, estructurada y adaptada a su sector, en un **portal autenticado con MFA** (no es una página pública abierta).

### 5.2 Secciones del Formulario

| Sección | Contenido | Validaciones |
|---|---|---|
| **Recepción y Registro de ROS** | Entidad reportante, oficial de cumplimiento, fecha de detección, descripción inicial | MFA activo, campos obligatorios, formato cédula/RUC, monto válido |
| **Perfil del Cliente Reportado** | Validación por cédula/pasaporte/RUC. Si existe, solo muestra el nombre; campos sensibles bloqueados | Permisos por rol, enmascaramiento |
| **Operación Sospechosa** | Monto, tipo, jurisdicción, producto/bien, señal de alerta, narrativa | Monto numérico, fechas coherentes, señal seleccionada |
| **Búsqueda y Filtrado Inteligente** (vista UAF) | Por número, entidad, sector, riesgo, estado, documento, cliente enmascarado, completitud | Permisos por rol, auditoría de consultas |
| **Clasificación y Priorización** | Riesgo, alertas, validación de docs, subsanación | Justificación obligatoria para cambios de estado |
| **Reportes e Inteligencia Financiera** | Reportes internos sobre ROS, sectores, riesgos, tiempos, patrones | Permisos, datos agregados, auditoría, control de exportación |

### 5.3 Distinción por Sector

**Bancos** — separa explícitamente:
- **Persona que realiza la transacción (ordenante)**: verificada por cédula, solo se muestra el nombre.
- **Beneficiario**: verificación independiente.

**Inmobiliarias** — campos sobre:
- Comprador, bien inmueble, ubicación, valor, forma de pago, financiamiento bancario, avalúos, procedencia de fondos.

---

## 6. Requisitos del Software

### 6.1 Requisitos Funcionales (RF)

| ID | Nombre | Descripción Resumida |
|---|---|---|
| **RF-01** | Recepción, Registro y Gestión de ROS | Portal autenticado con MFA; número único por reporte; formulario dinámico por sector |
| **RF-02** | Búsqueda, Filtrado y Clasificación | Búsqueda por múltiples atributos; clasificación de riesgo alto/medio/bajo con justificación e historial |
| **RF-03** | Trazabilidad y Auditoría | Registra cada acción relevante (usuario, rol, fecha, hora, acción, resultado, expediente) |
| **RF-04** | Generación de Reportes e Inteligencia Financiera | Reportes con permisos, enmascaramiento y auditoría |
| **RF-05** | Control de Acceso por Roles | Roles: Sujeto Obligado, Analista UAF, Supervisor UAF, Administrador; MFA obligatorio |
| **RF-06** | Validación Segura de Identidad | Verifica cédula/pasaporte/RUC; solo muestra nombre; en bancos aplica por separado a ordenante y beneficiario |
| **RF-07** | Carga Documental Individualizada | Un contenedor por documento requerido; estados: pendiente, cargado, observado, validado |

### 6.2 Requisitos No Funcionales (RNF)

| ID | Atributo | Descripción Resumida |
|---|---|---|
| **RNF-01** | Seguridad y Privacidad | MFA, cifrado, control por roles, enmascaramiento; el portal público NO autocompleta datos sensibles |
| **RNF-02** | Control de Acceso y Roles | Sujetos obligados solo ven sus reportes; admin no tiene acceso libre a contenido sensible |
| **RNF-03** | Trazabilidad y Auditoría | Registro con usuario, rol, fecha, hora, acción, resultado, IP, expediente |
| **RNF-04** | Usabilidad e Interfaz Intuitiva | Formulario muestra solo campos necesarios según sector; UAF con vista limpia |
| **RNF-05** | Gestión Documental Controlada | Cada archivo asociado a un requisito con estado; subsanación; auditoría de carga/consulta |
| **RNF-06** | Integridad y Calidad de Datos | Validación de formatos, coherencia, evita duplicidades, detecta coincidencias sin exponer |
| **RNF-07** | Rendimiento, Disponibilidad y Recuperación | Respuesta eficiente, respaldo, recuperación ante fallos |

---

## 7. Roles del Sistema

| Rol | Permisos / Función |
|---|---|
| **Sujeto Obligado (Reportante)** | Bancos, inmobiliarias, casinos, abogados, etc. Registra y gestiona **sus propios** ROS. |
| **Analista UAF** | Revisa, clasifica, solicita subsanaciones, vincula casos. |
| **Supervisor UAF** | Valida acciones críticas, aprueba cierres, genera reportes estratégicos. |
| **Administrador del Sistema** | Gestiona usuarios, roles y configuraciones. **NO** tiene acceso libre al contenido sensible de ROS sin justificación y auditoría. |
| **Auditor Interno** | (Implícito en CU-03) Consulta el historial de auditoría. |

---

## 8. Casos de Uso UML — Cuatro Diagramas

### 8.1 Diagrama 1 — Recepción y Registro de ROS
**Actor principal**: Sujeto Obligado Financiero o No Financiero
**Actores secundarios**: Sistema SAGAF, Analista UAF

Acciones modeladas:
- Enviar ROS a la UAF
- Registrar datos generales del ROS
- Registrar operación sospechosa
- Cargar documentos individuales requeridos (cada uno con contenedor propio; estados: cargado, pendiente, observado, validado)
- Validar MFA (incluye iniciar sesión con credenciales institucionales)
- Seleccionar tipo de sujeto obligado
- Verificar identidad de partes involucradas (cédula, pasaporte, RUC; si existe coincidencia solo muestra nombre)
- Mostrar solo nombre para corroboración
- Generar número único de ROS
- Cargar formulario dinámico según plantilla ROS (bancos, inmobiliarias, casinos, zonas francas, abogados, contadores, otros sectores regulados)
- Registrar acción en auditoría

### 8.2 Diagrama 2 — Búsqueda, Filtrado y Clasificación de Casos
**Actores**: Analista UAF, Supervisor UAF
**Subsistema**: Sistema Interno UAF — Gestión Operativa de ROS

Acciones modeladas:
- Consultar documentos adjuntos
- Identificar documentos faltantes
- Buscar ROS por atributos (número, sujeto obligado, sector económico, tipo de plantilla, documento enmascarado, monto, jurisdicción, estado, riesgo, completitud documental)
- Consultar partes involucradas (ordenante, beneficiario, comprador, vendedor, beneficiario final, representante legal, apoderado)
- Registrar acción en log de auditoría
- Clasificar nivel de riesgo
- Ver resumen del expediente
- Solicitar subsanación al sujeto obligado (cuando falta documento, archivo ilegible, inconsistencia, falta sustento de fondos, narrativa insuficiente)
- Consultar bandeja de ROS recibidos
- Actualizar estado del caso
- Aplicar filtros avanzados
- Validar análisis del caso

### 8.3 Diagrama 3 — Auditoría, Reportes y Control de Acceso
**Actores**: Supervisor UAF, Analista UAF, Administrador del Sistema, Sujeto Obligado
**Subsistemas**: Reportes e Inteligencia · Control de Acceso · Auditoría

**Reportes e Inteligencia**:
- Exportar reporte controlado (aplica permisos, justificación, marca de agua, enmascaramiento, registro de auditoría)
- Generar informe de inteligencia financiera
- Generar reporte estadístico
- Generar reporte de completitud documental

**Control de Acceso**:
- Gestionar usuarios y roles
- Controlar permisos por rol
- Validar MFA (obligatorio para sujetos obligados, analistas UAF, supervisores UAF, administradores)
- Iniciar sesión

**Auditoría** (audita: inicio de sesión, validación de identidad, envío de ROS, carga documental, consulta de expediente, cambio de estado, clasificación de riesgo, exportación):
- Auditar accesos a datos sensibles
- Consultar historial de auditoría
- Registrar acción del usuario

### 8.4 Diagrama 4 — Gestión Documental y Subsanación
**Actores**: Sujeto Obligado, Analista UAF, Supervisor UAF
**Subsistema**: SAGAF — Documentos de Sustento

> Los documentos requeridos dependen de la plantilla ROS del sujeto obligado. El sistema **no usa una sola carga general**, sino un contenedor por documento.

Acciones del Sujeto Obligado:
- Visualizar documentos requeridos por plantilla
- Marcar documento como cargado
- Cargar archivo por cada documento requerido
- Adjuntar evidencia adicional
- Registrar acción en auditoría

Acciones de Analista/Supervisor UAF (la UAF puede ver: documentos cargados, pendientes, observados, validados):
- Identificar documentos pendientes
- Marcar documento como observado
- Validar documento
- Revisar documento adjunto
- Solicitar subsanación (permite que el sujeto obligado complete/corrija/reemplace evidencia **sin crear un ROS nuevo**)

### 8.5 Especificaciones detalladas (CU-01 a CU-08)

El documento PDF detalla 8 casos de uso completos (mientras los diagramas son 4, agregan estos más granulares):

| CU | Nombre | Actor Principal |
|---|---|---|
| **CU-01** | Recepción, Registro y Gestión de ROS | Sujeto Obligado |
| **CU-02** | Búsqueda, Filtrado y Clasificación de Casos | Analista UAF / Supervisor UAF |
| **CU-03** | Trazabilidad y Auditoría del Sistema | Administrador / Supervisor UAF / Auditor Interno |
| **CU-04** | Generación de Reportes e Inteligencia Financiera | Supervisor UAF / Analista UAF |
| **CU-05** | Control de Acceso y Gestión de Roles | Administrador del Sistema |
| **CU-06** | Gestión de Sujetos Obligados | Administrador / Supervisor UAF |
| **CU-07** | Vinculación Intersectorial de ROS, Clientes y Beneficiarios Finales | Analista UAF / Supervisor UAF |
| **CU-08** | Gestión Documental y Subsanación | Sujeto Obligado / Analista UAF / Supervisor UAF |

Cada CU incluye: descripción, precondiciones, flujo básico, flujos alternos, requerimientos especiales (RE-XX) y postcondiciones.

#### Flujos alternos clave (CU-01)
- **A1** Fallo de autenticación · **A2** Campos incompletos · **A3** Documento faltante · **A4** Archivo inválido · **A5** Identidad existente (solo muestra nombre) · **A6** Posible duplicidad

#### Requerimientos especiales destacados
- Número único de ROS irrepetible
- Fecha/hora generadas por el sistema
- Portal público NO autocompleta datos sensibles
- Cada documento en contenedor individual
- Toda acción auditada
- Log de auditoría de solo lectura
- Sujetos obligados solo gestionan sus propios reportes
- Vinculaciones intersectoriales NO se consolidan automáticamente sin revisión humana

---

## 9. Criterios de Aceptación

Formato Gherkin (Dado / Cuando / Entonces) para cada CU. Ejemplos clave:

- **CA-CU01-01**: Sujeto obligado autenticado con MFA envía ROS → sistema asigna número único, registra fecha/hora, identifica plantilla, coloca en bandeja UAF.
- **CA-CU01-04**: Cédula/RUC ya existe → solo muestra nombre para corroboración, no revela otros datos.
- **CA-CU03-02**: Usuario intenta modificar log → sistema bloquea y registra evento de seguridad.
- **CA-CU04-02**: Reporte no requiere identificación individual → sistema aplica enmascaramiento/anonimización.
- **CA-CU05-01**: Usuario inicia sesión → sistema solicita MFA antes de permitir acceso.
- **CA-CU08-01**: Plantilla requiere documentos → sistema muestra un contenedor de carga por cada documento requerido.

---

## 10. Diagrama de Clases — Modelo de Datos

Entidades principales (con cardinalidades):

| Clase | Atributos principales | Relaciones |
|---|---|---|
| **SujetoObligado** | id, nombre, ruc, tipo, sector, organismoSupervisor, estado | 1..N → ROS · 1..N → Usuario · N..M → PlantillaROS |
| **PlantillaROS** | id, nombre, version, tipoSujetoObligado, sector, activa | 1..N → CampoPlantilla · 1..N → DocumentoRequerido · 1..N → ROS |
| **CampoPlantilla** | id, nombre, tipoDato, obligatorio, orden, reglaValidacion | — |
| **DocumentoRequerido** | id, nombre, descripcion, obligatorio, formatosPermitidos, tamañoMaximoMB | 1..N → DocumentoAdjunto |
| **ROS** | id, numeroROS, fechaDeteccion, fechaRecepcion, estado, descripcion, canalRecepcion | 1..N → ParteInvolucrada · 1..N → OperacionSospechosa · 1..N → DocumentoAdjunto · 0..N → SolicitudSubsanacion · 0..N → VinculoIntersectorial · pertenece a 1 CasoAnalisis |
| **ParteInvolucrada** | id, rolEnOperacion (RolParte), tipoPersona, identificador, nombreVisible, datosSensiblesBloqueados (Boolean) | — |
| **OperacionSospechosa** | id, monto, moneda, jurisdiccion, productoServicio, tipoOperacion, señalAlerta | — |
| **DocumentoAdjunto** | id, nombreArchivo, tipoMime, hashArchivo, tamañoBytes, identificadorRegistro, estado (EstadoDocumento), fechaCarga | — |
| **CasoAnalisis** | id, codigoCaso, estado (EstadoCaso), fechaApertura, fechaCierre | 1..N → ROS · 1..N → ReporteInteligencia · 1..N → RiesgoCaso |
| **RiesgoCaso** | id, nivel (NivelRiesgo), puntaje, justificacion, fechaClasificacion | — |
| **ReporteInteligencia** | id, tipoReporte, periodo, nivelConfidencialidad, fechaGeneracion | — |
| **VinculoIntersectorial** | id, tipoVinculo, descripcion, confirmado (Boolean), fechaDeteccion | — |
| **SolicitudSubsanacion** | id, motivo, estado (EstadoSubsanacion), fechaSolicitud, fechaRespuesta | — |
| **Usuario** | id, nombre, correo, estado (EstadoUsuario), mfaActivo (Boolean), ultimoAcceso | N..1 → Rol |
| **Rol** | id, nombre, descripcion | N..M → Permiso |
| **Permiso** | id, codigo, modulo, accion | — |
| **EventoAuditoria** | id, fechaHoraServidor, accion, modulo, resultado, ip, recursoAfectado | — |

**Notas del modelo**:
- **Formulario dinámico**: la `PlantillaROS` define campos y documentos según el tipo de sujeto obligado (cardinalidad N..M con `SujetoObligado`).
- **Privacidad del portal público**: si la cédula/RUC existe, solo se muestra `nombreVisible`. NO se autocompletan datos sensibles.
- **Carga documental**: cada `DocumentoRequerido` tiene su propio `DocumentoAdjunto` con estado independiente.

---

## 11. Plan de Pruebas

### 11.1 Pruebas Alfa (equipo técnico y funcional)
**Objetivos**: verificar MFA, formulario dinámico, contenedores por documento, validación de cédula sin exponer datos, bandeja UAF, búsqueda, riesgo, auditoría, subsanación, controles de seguridad.

**Alcance**:
- Portal público: MFA, entorno propio, formulario dinámico, verificación de partes sin exponer, carga individual, identificación de docs cargados/pendientes/observados, borrador o envío.
- Vista UAF: bandeja, filtros, resumen claro, clasificación de riesgo con justificación, revisión documental, subsanación.
- Auditoría: registros, log no editable desde interfaz, filtro de eventos críticos.
- Seguridad: MFA, restricción por rol, bloqueo no autorizado, enmascaramiento.

**Tipos**: funcionales, integración, seguridad, rendimiento.

### 11.2 Pruebas Beta (usuarios representativos)
**Participantes**: Sujetos obligados, Analistas UAF, Supervisores UAF, Administradores, personal técnico.

**Escenarios**:
1. Registro de ROS por sujeto obligado
2. Revisión interna UAF
3. Subsanación documental
4. Restricciones de acceso

**Métricas**: tiempo de registro, tiempo de revisión, errores por usuario, documentos cargados correctamente, subsanaciones comprendidas, satisfacción, estabilidad bajo concurrencia.

### 11.3 Pruebas UX
**Objetivos**: reducir errores humanos, evitar saturación visual, claridad de flujo.

**Elementos evaluados**:
- Navegación (menú, botones, acciones principales)
- Formulario dinámico (comprensión, cambio por plantilla, validación de identidad, carga documental)
- Vista UAF (bandeja, indicadores, resumen, pestañas, acciones)
- Flujo operativo (rapidez, claridad, comprensión de datos enmascarados)

**Metodología**: observación directa, tareas guiadas, encuestas, medición de tiempos, registro de errores, comentarios.

**Indicadores**: tiempo, errores por tarea, campos abandonados, satisfacción, facilidad de aprendizaje, claridad visual, comprensión de mensajes.

---

## 12. Matriz de Defectos (técnica de implementación)

Se clasifican en 4 niveles de severidad: **Crítico, Alto, Medio, Bajo**. El PDF lista DEF-01 a DEF-15 explícitamente (mencionando hasta DEF-40 en el análisis de impacto). Defectos más relevantes:

### Críticos
| ID | Módulo | Defecto |
|---|---|---|
| **DEF-01** | Autenticación MFA | Falla por desfase horario entre servidor y dispositivo (sin tolerancia OTP) |
| **DEF-02** | Autenticación MFA | Acepta códigos vencidos (no valida expiración del token) |
| **DEF-03** | Autenticación | Permite iniciar sesión sin completar MFA |
| **DEF-05** | Control de acceso | Sujeto obligado puede ver ROS de otra entidad modificando ID en URL (IDOR) |
| **DEF-06** | Roles y permisos | Frontend oculta botones, pero backend NO valida permisos (security through obscurity) |
| **DEF-09** | Validación de identidad | Portal público autocompleta datos personales sensibles tras verificar cédula/RUC existente |
| **DEF-12** | Registro de ROS | Genera números de ROS duplicados ante envíos concurrentes |

### Altos
| ID | Módulo | Defecto |
|---|---|---|
| **DEF-04** | Sesión | No expira por inactividad |
| **DEF-07** | Formulario dinámico | Carga plantilla incorrecta por mapeo erróneo del tipo |
| **DEF-08** | Formulario dinámico | Campos antiguos quedan en memoria al cambiar de tipo |
| **DEF-11** | Validación de identidad | Ordenante y beneficiario comparten estado interno, sobrescriben nombres |
| **DEF-13** | Registro de ROS | Botón "Enviar" duplica reportes (sin debounce) |
| **DEF-14** | Registro de ROS | Si falla guardar documentos, el ROS queda registrado sin evidencia (falta transaccionalidad) |
| **DEF-15** | Carga documental | Archivo se guarda en contenedor equivocado (identificador no enviado correctamente) |

### Medios
- **DEF-10**: "persona no encontrada" por formato (guiones, espacios, ceros iniciales) — falta normalización
- **DEF-25**: búsqueda no normaliza acentos/mayúsculas/guiones
- **DEF-35**: montos guardados como texto (errores en orden/filtro/suma/reportes)

### Bajos
- **DEF-39**: mensajes genéricos como "Error inesperado" en lugar de indicar campo/acción específica

### Conclusión del impacto (áreas más delicadas)
1. Sincronización horaria para MFA
2. Validación real de permisos en backend
3. Protección de datos personales en portal público
4. Asociación correcta entre documento requerido y archivo cargado
5. Uso de transacciones al registrar ROS y documentos
6. Auditoría con hora del servidor
7. Validación segura de archivos
8. Exportaciones controladas y enmascaradas
9. Manejo correcto de formularios dinámicos por plantilla

---

## 13. Prototipo Semi-funcional (Prototipo.html)

### 13.1 Arquitectura del prototipo
- **HTML/CSS/JS** vanilla, sin framework.
- Dos vistas conmutables vía sidebar:
  - **Vista interna UAF** (default, activa al cargar)
  - **Portal sujetos obligados**
- Demo rápida: botones "Registrar ROS Banco" e "Registrar ROS Inmobiliaria" que saltan al portal con la plantilla pre-seleccionada.

### 13.2 Diseño visual
- Paleta: azules institucionales (`--primary: #145c9e`), teal, verde, ámbar, rojo, púrpura con variantes "soft".
- Tipografía: Inter / Segoe UI.
- Componentes: cards con `box-shadow` suave, badges de colores, KPIs con burbuja decorativa, tabs redondeados, timeline para auditoría, doc-cards con estados.
- Responsive a 1150px y 760px.

### 13.3 Vista UAF (componentes)
- **Topbar** con usuario "Analista UAF · MFA activo · Acceso por caso".
- **4 KPIs**: Nuevos ROS (42), Alto riesgo (11), Sustento incompleto (8), Vínculos detectados (23).
- **Bandeja de ROS** (izquierda): buscador + filtro + 3 reportes demo:
  - `ROS-2026-000248` — Banco Nacional Demo · Alto · cliente `***-***-482` · 21/24 documentos
  - `ROS-2026-000249` — Inmobiliaria Istmo Demo · Medio · comprador `***-***-095` · 12/17 documentos
  - `ROS-2026-000250` — Banco Nacional Demo · Vinculado · sociedad `RUC ***-77` · escalado
- **Panel detalle** (derecha) con 4 tabs:
  - **Resumen**: sujeto obligado, tipo, cliente (enmascarado), monto, estado, completitud, narrativa, acciones (Abrir expediente, Solicitar subsanación, Validar análisis, Ver relaciones).
  - **Riesgo**: 3 barras de progreso (señales de alerta, completitud, coincidencias) con nota de validación humana.
  - **Documentos**: contadores (Recibidos/Pendientes/Con alerta) + lista de doc-cards.
  - **Auditoría**: timeline de eventos (ROS recibido vía MFA, validación cédula, consulta de expediente, subsanación disponible).

### 13.4 Portal Público (componentes)
- **Card de Ingreso institucional** (izquierda): selector de tipo, usuario, contraseña, código MFA, botón "Cargar demo" (autocompleta), botón "Validar acceso" (abre formulario). Steps 1-2-3.
- **Card de Formulario ROS** (derecha, oculto hasta login) con 4 secciones:
  1. **Datos generales**: entidad reportante, fecha, oficial de cumplimiento, correo.
  2. **Validación de personas relacionadas**:
     - Si Banco: tipo cliente (Natural/Jurídica) + 2 lookup-cards independientes (Ordenante / Beneficiario) con botón Verificar.
     - Si Inmobiliaria: 1 lookup-card (Cliente/Comprador) con campos adicionales que se bloquean si la cédula existe.
  3. **Operación sospechosa**: monto, jurisdicción/ubicación (label cambia según sector), tipología (5 opciones), producto bancario o bien inmueble (mutuamente excluyente según tipo), narrativa.
  4. **Sustento documental**: contadores Requeridos/Cargados/Pendientes + lista de doc-cards (input file individual por requisito).

### 13.5 Lógica JavaScript clave
- **Plantillas documentales (objeto `docs`)**: 3 listas hardcoded con los documentos requeridos:
  - `bankNatural` (14 documentos): cuenta, contrato, identidad, diligencia, perfil, referencias, comunicaciones...
  - `bankLegal` (25 documentos): contrato, apertura, identificación de RL/dignatarios/accionistas/BF, diligencia, perfiles, pacto social, aviso de operación, declaraciones, referencias, dignatarios, estados financieros, comunicaciones de descarte, estados de cuenta 2 años, 80% créditos/débitos, cheques, Swift, ACH, depósitos/retiros.
  - `realestate` (17 documentos): promesa de compra-venta, diligencia, identidad, referencias, carta de trabajo, ficha/declaración, perfil transaccional, detalle del bien, escritura, forma de pago, financiamiento, sustento de fondos, avalúos, recibos, sustento de pagos.
- **Directorio simulado de personas** (`personDirectory`): mapea identificadores a nombres (María González, Carlos Pérez, Ana Morales, Roberto Castillo, Luis Herrera, Inversiones del Istmo S.A.).
- **`lookupNameById`**: busca por coincidencia exacta o por patrones numéricos (482, 095, 888, 77) — implementa el principio de "solo muestra nombre".
- **`verifyBankParty`**: verifica ordenante/beneficiario por separado, evitando que un estado sobrescriba al otro (DEF-11 prevenido).
- **`configureForm`**: cambia título/badge/secciones visibles/labels según tipo de sujeto obligado.
- **`renderDocumentUploadCards`**: genera dinámicamente un input file por cada documento de la plantilla, con badge "Pendiente" → "Cargado" al subir.
- **`updateDocCounters`**: actualiza contadores en vivo.
- **Modal de éxito**: aparece al "Enviar ROS a la UAF".

### 13.6 Principios de privacidad implementados en el prototipo
- Cliente enmascarado (`***-***-482`, `RUC ***-77`) en bandeja y resumen UAF.
- Banco: dos validaciones independientes (Ordenante + Beneficiario).
- Si cédula existe: solo se muestra el nombre, campos sensibles `disabled` con placeholder "Bloqueado por coincidencia existente".
- Notas explícitas en UI: "El portal no debe exponer información personal ya registrada".

---

## 14. Bibliografía Referenciada

1. **Asamblea Nacional de Panamá** (2015). *Ley 23 de 27 de abril de 2015*, sobre prevención de blanqueo de capitales, financiamiento del terrorismo y proliferación de armas de destrucción masiva. Gaceta Oficial Digital.
2. **Asamblea Nacional de Panamá** (2019). *Ley 81 de 26 de marzo de 2019* sobre protección de datos personales. Gaceta Oficial Digital.
3. **CloudFlare** (2018). *¿Qué es Transport Layer Security? Protocolo TLS*. https://www.cloudflare.com/es-es/learning/ssl/transport-layer-security-tls/
4. **GAFI** (2023). *Recomendaciones del GAFI: Estándares internacionales sobre la lucha contra el lavado de activos, el financiamiento del terrorismo y el financiamiento de la proliferación*.
5. **Microsoft** (2026). *Autenticación multifactor (MFA) | Seguridad de Microsoft*. https://www.microsoft.com/es-es/security/business/identity-access/microsoft-entra-mfa-multi-factor-authentication
6. **Progress** (2022). *Why You Should Use AES 256 Encryption to Secure Your Data*. https://www.progress.com/blogs/use-aes-256-encryption-secure-data
7. **Unidad de Análisis Financiero** (2018). *Manuales Calidad de ROS*. https://www.uaf.gob.pa/Manuales-Calidad-de-ROS/3

---

## 15. Inventario de Archivos en `Contexto/`

| Archivo | Tipo | Contenido |
|---|---|---|
| `Parcial ISA 4 V2.0.pdf` | PDF (24 pp) | Documento académico completo: problemática, marco teórico, formulario, requisitos funcionales/no funcionales, 8 CUs, criterios de aceptación, plan de pruebas (alfa/beta/UX), matriz de defectos, bibliografía |
| `Caso de uso 1 Recepción y Registro de ROS.png` | Diagrama UML | Casos de uso del portal público SAGAF: registro, validación MFA, verificación de identidad, generación de número único, formulario dinámico |
| `Caso de uso 2 Búsqueda, filtrado y clasificación de casos.png` | Diagrama UML | Casos de uso del sistema interno UAF: bandeja, búsqueda por atributos, clasificación de riesgo, subsanación, validación de análisis |
| `Caso de uso 3 Auditoria, Reportes y control de acceso.png` | Diagrama UML | Tres subsistemas: Reportes e Inteligencia · Control de Acceso · Auditoría |
| `Caso de uso 4 Gestión Documental y Subsanación.png` | Diagrama UML | Subsistema de documentos: visualizar, marcar, cargar, adjuntar evidencia adicional, identificar pendientes, observar/validar/subsanar |
| `Diagrama de clases.png` | Diagrama UML | Modelo de datos con 16+ clases (ROS, SujetoObligado, PlantillaROS, DocumentoRequerido/Adjunto, ParteInvolucrada, OperacionSospechosa, CasoAnalisis, RiesgoCaso, VinculoIntersectorial, SolicitudSubsanacion, Usuario/Rol/Permiso, EventoAuditoria, etc.) |
| `Prototipo.html` | Archivo HTML (1578 líneas) | Prototipo semi-funcional vanilla HTML/CSS/JS con vista UAF + portal público; lógica de formulario dinámico, verificación por cédula, carga documental individual y modal de éxito |

---

## 16. Resumen Ejecutivo (TL;DR)

**SAGAF** es la propuesta de un sistema dual (portal público autenticado con MFA + sistema interno UAF) para que los sujetos obligados financieros y no financieros de Panamá registren **Reportes de Operaciones Sospechosas (ROS)** conforme a la **Ley 23 de 2015**, sin violar la **Ley 81 de 2019** de protección de datos personales.

**Innovaciones clave** sobre los sistemas actuales:
1. **Formulario dinámico por sector** (banco, inmobiliaria y futuros).
2. **Validación de identidad sin exposición**: solo se muestra el nombre si la cédula/RUC existe.
3. **En bancos, ordenante y beneficiario se validan por separado**.
4. **Carga documental individualizada**: un contenedor por requisito documental, con estado independiente.
5. **Vista interna UAF limpia**: bandeja priorizada, KPIs, tabs (Resumen/Riesgo/Documentos/Auditoría), acciones de subsanación.
6. **Auditoría inmutable** desde el servidor con MFA obligatorio para todos los roles.
7. **Privacy by Design**: minimización, enmascaramiento, transparencia.

**Entregables académicos cubiertos**: Investigación del tema (problemática, propuesta, marco teórico), diseño del formulario, 7 RF + 7 RNF, 4 diagramas UML de casos de uso + 8 especificaciones detalladas + criterios de aceptación, diagrama de clases, 3 niveles de pruebas (alfa/beta/UX), matriz de defectos con 15+ defectos clasificados por severidad, prototipo HTML funcional.
