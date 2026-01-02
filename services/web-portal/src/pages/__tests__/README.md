# Mobile Layout Tests

Tests para prevenir regresiones en el comportamiento mobile del portal.

## Estructura de Tests

### 1. **Lobby.test.tsx**
Tests específicos del comportamiento de la página Lobby en mobile:
- ✅ Banner ad en la parte superior
- ✅ Thumbnail del juego (no el juego completo)
- ✅ Título y descripción debajo del iframe
- ✅ Botón "Play now" funcional
- ✅ Navegación a GamePage
- ✅ Orden correcto de elementos

### 2. **GamePage.test.tsx**
Tests específicos del comportamiento de la página de juego en mobile:
- ✅ Layout fullscreen (gamePageLayout)
- ✅ Iframe del juego llenando el espacio disponible
- ✅ Banner ad en la parte inferior (80px)
- ✅ Sin sidebars ni ads laterales
- ✅ Sin esquinas redondeadas
- ✅ Navegación de vuelta al lobby

### 3. **MobileRegression.test.tsx**
Tests de regresión para prevenir cambios no deseados:
- ✅ Flujo completo de navegación Lobby → GamePage → Lobby
- ✅ Consistencia de layout en ambas páginas
- ✅ Contenido correcto renderizado (thumbnail vs game)
- ✅ Comportamiento responsive en diferentes tamaños de pantalla
- ✅ Orientación portrait y landscape
- ✅ Diferentes dispositivos móviles (iPhone SE, 6/7/8, XR/11)

## Ejecutar Tests

```bash
# Ejecutar todos los tests
yarn test

# Ejecutar con UI interactiva
yarn test:ui

# Ejecutar con coverage
yarn test:coverage

# Ejecutar tests en modo watch
yarn test --watch

# Ejecutar solo tests mobile
yarn test MobileRegression
```

## Cobertura

Los tests cubren:
- ✅ Estructura del DOM y orden de elementos
- ✅ Navegación entre páginas
- ✅ Renderizado condicional (thumbnail vs game iframe)
- ✅ Layouts responsive
- ✅ Diferentes viewports móviles
- ✅ Interacciones del usuario (clicks, navegación)

## Criterios de Regresión

Los tests fallarán si:
- ❌ El banner ad cambia de posición
- ❌ Los sidebars aparecen en mobile
- ❌ El juego completo se carga en el lobby
- ❌ El orden de elementos cambia
- ❌ La navegación entre páginas falla
- ❌ El layout fullscreen se rompe en GamePage
- ❌ Las dimensiones del banner cambian significativamente
