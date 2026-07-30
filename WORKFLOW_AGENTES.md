# T-SAFV-App-V — Workflow de Agentes Especializados Mobile

Este proyecto cuenta con **6 agentes especializados** que trabajan en secuencia para implementar features móviles completos desde la idea hasta la validación de calidad, UX y accesibilidad.

## Flujo de Trabajo Completo

### Flujo Principal (Desarrollo de Features Mobile)

```
Idea/Requerimiento
       ↓
[1] analista-requerimientos  → Especificación técnica detallada (pantallas)
       ↓
[2] planificador             → Plan de implementación paso a paso
       ↓
[3] programador-senior       → Código implementado y funcional
       ↓
[4] qa-esceptico             → Tests móviles + Reporte de calidad
       ↓
Feature Mobile Completo ✅
```

### Flujo de Validación de Calidad (Opcional pero Recomendado)

```
Feature Implementado
       ↓
[5] code-reviewer            → Revisión de código + Mejoras UX/Performance
       ↓
[6] qa-ui-ux                 → Tests UI/UX + Accesibilidad + Usabilidad
       ↓
Feature Validado, Accesible y Pulido ✅
```

---

## Stack Técnico

- Expo SDK 54
- React 19
- React Native 0.81
- JavaScript (sin TypeScript)
- AsyncStorage para persistencia
- Navegación manual en App.js (sin React Navigation)
- Backend: T-SAFV-API (REST)

**Arquitectura**:

```
src/
  ├── screens/           # Pantallas (archivos planos)
  ├── components/common/ # Componentes reutilizables
  ├── context/           # AuthContext, ThemeContext
  ├── services/          # HTTP con backend
  └── utils/             # Helpers
```

---

## Agentes Disponibles

### 1. Analista de Requerimientos Senior (Mobile)

**Nombre**: `analista-requerimientos`  
**Archivo**: `.agents/analista-requerimientos.agent.md`

**Propósito**: Convertir ideas vagas en especificaciones técnicas detalladas de pantallas móviles con mockups ASCII, navegación, validaciones y estados de UI.

**Cuándo usar**:

- Tienes una idea de feature móvil pero no está clara
- Necesitas documentar nuevas pantallas formalmente
- Quieres asegurar que todos los estados de UI están cubiertos

**Entrada esperada**:

- Descripción general del feature (puede ser breve)
- Contexto del problema a resolver
- Pantallas involucradas

**Salida**:

- Documento de especificación completo en `docs/specs/FEATURE-XXX-nombre.md`
- Mockups ASCII de pantallas
- Flujos de navegación
- Validaciones de formulario
- Estados de UI (loading, empty, error, success)
- Criterios de aceptación
- Integración con backend

**Ejemplo de uso**:

```
@analista-requerimientos Necesito una pantalla para que fiscales puedan
ver el historial de inspecciones de un vehículo con filtros por fecha y estado.
```

---

### 2. Planificador Técnico Senior (Mobile)

**Nombre**: `planificador`  
**Archivo**: `.agents/planificador.agent.md`

**Propósito**: Crear planes de implementación detallados, identificando screens, components, services, navigation, validations y testing móvil.

**Cuándo usar**:

- Tienes una especificación y necesitas saber CÓMO implementarla
- Quieres estimar tiempo y complejidad
- Necesitas un roadmap técnico detallado

**Entrada esperada**:

- Especificación completa (generada por analista-requerimientos)
- O referencia al archivo de spec

**Salida**:

- Plan de implementación en `docs/plans/PLAN-XXX-nombre.md`
- Fases secuenciales de trabajo
- Archivos exactos a crear/modificar
- Código de ejemplo para screens, components, services
- Estimación de tiempo
- Riesgos identificados

**Ejemplo de uso**:

```
@planificador Crea un plan de implementación para el feature documentado
en docs/specs/FEATURE-001-historial-inspecciones.md
```

---

### 3. Programador Senior Frontend (React Native)

**Nombre**: `programador-senior`  
**Archivo**: `.agents/programador-senior.agent.md`

**Propósito**: Implementar features móviles siguiendo el plan técnico y las mejores prácticas de React Native, Expo y UX móvil.

**Cuándo usar**:

- Tienes un plan de implementación y necesitas código
- Quieres que se sigan los patrones existentes del proyecto
- Necesitas implementación completa (screens, components, services, navigation)

**Entrada esperada**:

- Plan de implementación (generado por planificador)
- O especificación si el plan es simple

**Salida**:

- Código fuente completamente implementado
- Screens con hooks y estados
- Components reutilizables
- Services para comunicación con backend
- Navegación integrada en App.js
- Validaciones de formulario
- Estados de UI (loading, empty, error)
- Feature funcional y probado manualmente

**Ejemplo de uso**:

```
@programador-senior Implementa el feature según el plan en
docs/plans/PLAN-001-historial-inspecciones.md
```

---

### 4. QA Senior Escéptico (Mobile)

**Nombre**: `qa-esceptico`  
**Archivo**: `.agents/qa-esceptico.agent.md`

**Propósito**: Crear planes de pruebas móviles exhaustivos, encontrar edge cases móviles (sin internet, interrupciones, teclado) y generar reportes de calidad.

**Cuándo usar**:

- Tienes código móvil implementado que necesita validación
- Quieres tests manuales + plan de automatización
- Necesitas un reporte de calidad formal
- Quieres asegurar que no hay regresiones móviles

**Entrada esperada**:

- Feature implementado
- Especificación original (para validar criterios)
- Código fuente a testear

**Salida**:

- Plan de pruebas manuales móviles
- Plan de automatización (Jest + Testing Library + Detox)
- Reporte de calidad en `docs/qa-reports/QA-REPORT-XXX.md`
- Bugs documentados con severidad
- Edge cases móviles (sin internet, llamada entrante, teclado)
- Recomendaciones de mejora

**Ejemplo de uso**:

```
@qa-esceptico Crea plan de pruebas móviles para el feature FEATURE-001
(historial inspecciones) y genera un reporte de calidad completo
```

---

### 5. Code Reviewer Senior (React Native)

**Nombre**: `code-reviewer`  
**Archivo**: `.agents/code-reviewer.agent.md`

**Propósito**: Revisar código React Native implementado para identificar problemas de calidad, performance móvil, memory leaks, UX y cumplimiento de patrones del proyecto.

**Cuándo usar**:

- Feature implementado necesita revisión antes de merge
- Quieres validar que se siguen los patrones del proyecto
- Necesitas identificar memory leaks, re-renders innecesarios, performance issues
- Buscas oportunidades de refactorización

**Entrada esperada**:

- Feature implementado (archivos modificados/creados)
- Referencia a especificación o plan (opcional)

**Salida**:

- Reporte de revisión en `docs/code-reviews/CODE-REVIEW-XXX.md`
- Issues críticos, menores y sugerencias
- Código propuesto para correcciones
- Decisión: APROBAR / CAMBIOS MENORES / RECHAZAR

**Ejemplo de uso**:

```
@code-reviewer Revisa la implementación del feature FEATURE-001
```

---

### 6. QA UI/UX Senior (Mobile)

**Nombre**: `qa-ui-ux`  
**Archivo**: `.agents/qa-ui-ux.agent.md`

**Propósito**: Validar experiencia de usuario móvil completa, accesibilidad táctil, usabilidad, contraste de colores, touch targets y flujos end-to-end.

**Cuándo usar**:

- Feature tiene pantallas nuevas o modificadas
- Necesitas validar accesibilidad (screen readers, contraste)
- Quieres evaluar usabilidad móvil (touch targets, gestos)
- Requieres validar flujos de usuario completos

**Entrada esperada**:

- Feature implementado con pantallas
- Especificación de flujos de usuario

**Salida**:

- Plan de pruebas en `docs/qa-ui-plans/QA-UI-PLAN-XXX.md`
- Validación de accesibilidad (contraste, labels, screen readers)
- Validación de usabilidad (touch targets, gestos)
- Evaluación de mensajes y feedback visual
- Reporte de experiencia de usuario

**Ejemplo de uso**:

```
@qa-ui-ux Crea plan de pruebas UI/UX para FEATURE-001 (historial inspecciones)
```

---

## Flujo Completo Ejemplo

### Paso 1: Idea Inicial

```
Usuario: "Necesito una pantalla para ver el historial de inspecciones de un vehículo"
```

### Paso 2: Análisis de Requerimientos

```
@analista-requerimientos Necesito una pantalla para que fiscales puedan
ver el historial de inspecciones de un vehículo con filtros por fecha y estado.

→ Genera: docs/specs/FEATURE-001-historial-inspecciones.md
```

### Paso 3: Planificación

```
@planificador Crea un plan de implementación para
docs/specs/FEATURE-001-historial-inspecciones.md

→ Genera: docs/plans/PLAN-001-historial-inspecciones.md
```

### Paso 4: Implementación

```
@programador-senior Implementa el feature según
docs/plans/PLAN-001-historial-inspecciones.md

→ Crea:
  - src/screens/HistorialInspeccionesScreen.js
  - src/components/common/InspeccionCard.js
  - src/services/inspecciones/inspeccionService.js
  - Modifica: App.js (navegación)
```

### Paso 5: Testing y QA Mobile

```
@qa-esceptico Valida el feature FEATURE-001 con plan de pruebas móviles
y genera reporte de calidad

→ Genera:
  - docs/qa-reports/QA-REPORT-FEATURE-001.md
  - Lista de bugs encontrados
  - Edge cases móviles probados
```

### Paso 6: Code Review (Recomendado para features importantes)

```
@code-reviewer Revisa la implementación de FEATURE-001

→ Genera:
  - docs/code-reviews/CODE-REVIEW-FEATURE-001.md
  - Lista de issues críticos, menores y sugerencias
  - Decisión: APROBAR / CAMBIOS MENORES / RECHAZAR
```

### Paso 7: Validación UI/UX (Si hay pantallas nuevas)

```
@qa-ui-ux Crea plan de pruebas UI/UX para FEATURE-001

→ Genera:
  - docs/qa-ui-plans/QA-UI-PLAN-FEATURE-001.md
  - Validación de accesibilidad
  - Validación de usabilidad
```

---

## Mejores Prácticas

### 1. Usa el flujo completo (6 agentes) para features críticos móviles

Para features importantes con pantallas nuevas, navegación compleja, o flujos críticos para el usuario.

### 2. Usa flujo de desarrollo (4 agentes) para features estándar

Para features normales sin pantallas complejas: analista → planificador → programador → qa-esceptico.

### 3. Agrega validación selectiva según necesidad

- **Code Review**: Para pantallas complejas con hooks, optimizaciones, o lógica de estado compleja
- **QA UI/UX**: Para todas las pantallas nuevas o modificadas (validar accesibilidad y UX)

### 4. Puedes saltar agentes para cambios triviales

Para cambios muy pequeños (ej: agregar un campo en pantalla existente), puedes ir directo a programador-senior + qa-esceptico.

### 5. Code review antes de merge a main

Usa code-reviewer para todas las PR importantes antes de merge a rama principal.

### 6. QA UI/UX para todas las pantallas nuevas

Ejecuta qa-ui-ux para validar accesibilidad, contraste y usabilidad en todas las pantallas nuevas.

---

## Comandos Rápidos

### Feature Completo (Flujo Desarrollo + Validación)

```bash
# FASE 1: DESARROLLO
# 1. Análisis
@analista-requerimientos [descripción del feature móvil]

# 2. Planificación
@planificador Planifica docs/specs/FEATURE-XXX-nombre.md

# 3. Implementación
@programador-senior Implementa docs/plans/PLAN-XXX-nombre.md

# 4. Testing Mobile
@qa-esceptico Valida FEATURE-XXX con plan de pruebas móviles

# FASE 2: VALIDACIÓN (Recomendado para features importantes)
# 5. Code Review
@code-reviewer Revisa implementación de FEATURE-XXX

# 6. Testing UI/UX
@qa-ui-ux Crea plan de pruebas UI/UX para FEATURE-XXX
```

### Feature Rápido (Solo Desarrollo)

```bash
# Para features pequeños sin pantallas complejas
@analista-requerimientos [idea]
@planificador [spec file]
@programador-senior [plan file]
@qa-esceptico [feature]
```

### Cambio Simple (Solo Programación + QA)

```bash
# Si ya sabes exactamente qué hacer
@programador-senior [descripción técnica del cambio]
@qa-esceptico Crea plan de pruebas para [módulo modificado]
```

### Validación de Código Existente

```bash
# Solo code review
@code-reviewer Revisa el screen [nombre]

# Solo UI/UX
@qa-ui-ux Valida accesibilidad y UX de [pantalla]
```

---

## Estructura de Documentos Generados

```
T-SAFV-App-V/
  docs/
    specs/                         # Especificaciones
      FEATURE-001-nombre.md
      FEATURE-002-nombre.md

    plans/                         # Planes de implementación
      PLAN-001-nombre.md
      PLAN-002-nombre.md

    qa-reports/                    # Reportes de QA (lógica móvil)
      QA-REPORT-FEATURE-001.md
      QA-REPORT-FEATURE-002.md

    code-reviews/                  # Reportes de code review
      CODE-REVIEW-FEATURE-001.md
      CODE-REVIEW-FEATURE-002.md

    qa-ui-plans/                   # Planes de pruebas UI/UX
      QA-UI-PLAN-FEATURE-001.md
      QA-UI-PLAN-FEATURE-002.md

  src/                             # Código implementado
    screens/
    components/common/
    services/
    context/
    utils/
```

---

## 📊 Matriz de Decisión: ¿Qué Agentes Usar?

| Tipo de Cambio                                    | Agentes Recomendados                    | Tiempo Estimado |
| ------------------------------------------------- | --------------------------------------- | --------------- |
| **Feature Crítico** (autenticación, permisos)     | Los 6 agentes                           | 3-5 días        |
| **Feature Importante** (nueva pantalla principal) | Desarrollo (4) + Code Review + QA UI/UX | 2-3 días        |
| **Feature Estándar** (pantalla simple)            | Desarrollo (4 agentes)                  | 1-2 días        |
| **Cambio Simple** (agregar campo)                 | Programador + QA Escéptico              | 2-4 horas       |
| **Refactorización UI**                            | Code Reviewer + QA UI/UX                | 1 día           |

---

## 🎯 Resumen de Outputs por Agente

| Agente                  | Output Principal       | Ubicación                              |
| ----------------------- | ---------------------- | -------------------------------------- |
| analista-requerimientos | Especificación técnica | `docs/specs/FEATURE-XXX.md`            |
| planificador            | Plan de implementación | `docs/plans/PLAN-XXX.md`               |
| programador-senior      | Código fuente mobile   | `src/**/*`                             |
| qa-esceptico            | Tests + Reporte QA     | `docs/qa-reports/`                     |
| code-reviewer           | Reporte de revisión    | `docs/code-reviews/CODE-REVIEW-XXX.md` |
| qa-ui-ux                | Plan UI/UX             | `docs/qa-ui-plans/QA-UI-PLAN-XXX.md`   |

---

## Coordinación con Backend (T-SAFV-API)

Muchos features móviles requieren coordinación con el backend. Considera:

1. **Validar contrato API**: Antes de implementar, verifica que el backend tiene los endpoints listos (consulta `T-SAFV-API/SPECS.md` o `MATRIZ_APP_BACKEND.md`)

2. **Sincronizar validaciones**: Las validaciones móviles deben coincidir con las del backend

3. **Testing integrado**: Usa @qa-ui-ux para validar flujos completos frontend-backend

4. **Versioning**: Si cambias el contrato API, documenta en ambos proyectos

---

**Última actualización**: 2025-01-27  
**Versión**: 1.0.0  
**Mantenedor**: Equipo de desarrollo T-SAFV
