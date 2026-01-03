# Tower Wars MVP - Game Plan

## Concepto del Juego
Juego de conquista de torres estilo Galcon/Eufloria:
- Torres generan soldados automáticamente
- Envías tropas de una torre a otra (link origen → destino)
- Si destino es aliada: suma soldados
- Si destino es enemiga/neutra: resta soldados
- Si soldados llegan a 0: torre capturada

## Scope MVP
- **Single-player**: Jugador vs Torres enemigas y neutras
- **Sin IA enemiga**: Enemigos solo generan soldados, no atacan
- **Torres neutras**: No generan soldados, solo mantienen los iniciales
- **Envío configurable**: Steps predeterminados (25%, 50%, 75%, 100%)
- **Mapa aleatorio equilibrado**: Distribución balanceada de torres
- **Gráficos simples**: Círculos con números, líneas para links

---

## Arquitectura de Entidades

### 1. Tower (Torre)
```
- position: { x, y }
- team: 'player' | 'neutral' | 'enemy'
- soldiers: number (cantidad actual)
- generationRate: number (soldados/segundo, 0 para neutras)
- radius: number (tamaño visual)
- maxSoldiers: number (capacidad máxima)
```

### 2. Troop (Tropa en movimiento)
```
- origin: Tower
- destination: Tower
- soldiers: number
- team: 'player' | 'neutral' | 'enemy'
- position: { x, y }
- speed: number
```

### 3. Link (visual del envío)
```
- from: Tower
- to: Tower
- active: boolean
```

---

## Implementación por Fases

### Fase 1: Entidades Base
**Archivos a crear:**
- `src/entities/Tower.ts` - Clase Tower con Phaser.GameObjects.Container
- `src/entities/Troop.ts` - Clase Troop para soldados en movimiento
- `src/entities/types.ts` - Tipos compartidos (Team, Position, etc.)

**Funcionalidad:**
- Torre renderiza como círculo con color según equipo
- Torre muestra número de soldados en el centro
- Torre genera soldados cada X segundos

### Fase 2: Interacción y Links
**Archivos a modificar:**
- `src/scenes/GameScene.ts` - Lógica de selección y envío

**Funcionalidad:**
- Click en torre propia: selecciona
- Click en otra torre (con torre seleccionada): envía 50% de soldados
- Línea visual del link durante el envío

### Fase 3: Movimiento de Tropas
**Archivos a crear/modificar:**
- `src/entities/Troop.ts` - Movimiento hacia destino
- `src/scenes/GameScene.ts` - Gestión de tropas activas

**Funcionalidad:**
- Tropas viajan de origen a destino
- Al llegar: suma/resta soldados
- Captura de torre si soldados <= 0

### Fase 4: Game Loop y Victoria
**Archivos a modificar:**
- `src/scenes/GameScene.ts` - Condición de victoria

**Funcionalidad:**
- Victoria: todas las torres son del jugador
- Reinicio del nivel

---

## Archivos a Crear/Modificar

### Nuevos:
1. `src/entities/types.ts` - Tipos TypeScript
2. `src/entities/Tower.ts` - Entidad torre
3. `src/entities/Troop.ts` - Entidad tropa
4. `src/config/gameConfig.ts` - Constantes del juego

### Modificar:
1. `src/scenes/GameScene.ts` - Toda la lógica del juego
2. `src/scenes/BootScene.ts` - Precargar assets si los hay

---

## Controles (Mobile-First)

- **Tap torre propia**: Seleccionar (muestra selector de %)
- **Selector de %**: Botones 25%, 50%, 75%, 100%
- **Tap otra torre** (con selección): Enviar tropas con % seleccionado
- **Tap fuera**: Deseleccionar

## Generación de Mapa Aleatorio

```
- Total torres: 6-8
- Distribución: 1 player, 1-2 enemy, resto neutral
- Posiciones: Grid con variación aleatoria
- Soldados iniciales:
  - Player: 10
  - Enemy: 10-20
  - Neutral: 5-15
```

---

## Diseño Visual Simple (MVP)

```
Torres:
- Círculo azul (#3498db) = jugador
- Círculo rojo (#e74c3c) = enemigo
- Círculo gris (#95a5a6) = neutral
- Número blanco en centro = soldados
- Borde más grueso cuando seleccionada

Tropas:
- Círculo pequeño del color del equipo
- Se mueve en línea recta hacia destino
- Número pequeño de soldados

Links:
- Línea del color del equipo durante envío
```

---

## Orden de Implementación TDD

### Sprint 1: Entidades Base
1. [ ] `src/entities/types.ts` - Interfaces y tipos
2. [ ] `src/config/gameConfig.ts` - Constantes (colores, velocidades, rates)
3. [ ] `src/entities/Tower.ts` + tests - Clase torre con render y generación
4. [ ] `src/entities/Troop.ts` + tests - Clase tropa con movimiento

### Sprint 2: GameScene Core
5. [ ] `src/utils/MapGenerator.ts` + tests - Generador de mapa aleatorio
6. [ ] `src/scenes/GameScene.ts` - Renderizar torres del mapa
7. [ ] Implementar generación de soldados (update loop)

### Sprint 3: Interacción
8. [ ] Implementar selección de torre (tap)
9. [ ] Implementar UI selector de % (25/50/75/100)
10. [ ] Implementar envío de tropas (tap destino)

### Sprint 4: Mecánicas
11. [ ] Implementar movimiento de tropas hacia destino
12. [ ] Implementar llegada: suma/resta soldados
13. [ ] Implementar captura de torre

### Sprint 5: Game Loop
14. [ ] Condición de victoria (todas las torres del jugador)
15. [ ] Botón reiniciar / nuevo mapa
16. [ ] Polish: feedback visual, sonidos básicos (opcional)
