# Aprendizaje por Refuerzo aplicado a Detección de Anomalías

Aplicación web educativa que explica los fundamentos del Aprendizaje por Refuerzo (Reinforcement Learning, RL) y los aplica a un caso práctico de detección de anomalías en una intersección vehicular mediante Q-Learning.

**Asignatura:** Sistemas Inteligentes  
**Modalidad:** Individual  
**Entregables:** Repositorio GitHub + Aplicación Web funcional + Informe breve

---

## Descripción

El proyecto consiste en un sitio web interactivo orientado a una audiencia técnica o semi-técnica. El contenido principal incluye:

- Introducción al Aprendizaje por Refuerzo.
- Conceptos fundamentales: agente, entorno, estado, acción, recompensa y política.
- Explicación del aprendizaje mediante recompensas y el equilibrio entre exploración y explotación.
- Descripción del algoritmo Q-Learning y su fórmula de actualización.
- Caso práctico de detección de anomalías en tráfico vehicular.
- Simulador interactivo con tabla Q, gráfico de recompensas e intersección en vivo.
- Modo comparativo "tú vs el agente".
- Conclusiones y limitaciones del enfoque.

---

## Demo en GitHub Pages

Puedes ver la aplicación desplegada directamente en tu navegador sin instalar nada:

[https://gape-mol.github.io/SisInt/](https://gape-mol.github.io/SisInt/)

---

## Tecnologías utilizadas

- **HTML5** para la estructura del contenido.
- **CSS3** con variables personalizadas y media queries para el diseño responsive.
- **JavaScript** para la lógica del simulador, la visualización y la interactividad.
- **SVG** para diagramas y la representación gráfica de la intersección.
- **Canvas API** para el gráfico de evolución de recompensas.

No se utilizan frameworks externos ni dependencias de build. El sitio se sirve de forma estática.

---

## Estructura de archivos

```
/
├── index.html              # Página principal con el contenido educativo
├── simulador.html          # Simulador interactivo de Q-Learning
├── README.md               # Este archivo
├── css/
│   ├── styles.css          # Estilos comunes y responsive
│   └── simulador.css       # Estilos específicos del simulador
├── js/
│   ├── script.js           # Scroll-spy de la navbar en index.html
│   ├── entorno.js          # Modelo del entorno de tráfico
│   ├── qlearning.js        # Clase QLearningAgent
│   ├── sim.js              # Orquestador del simulador
│   ├── vistas.js           # Render de tabla Q y gráfico
│   ├── interseccion.js     # Visualización SVG de la intersección
│   └── comparativo.js      # Modo "tú eres el agente"
├── assets/
│   ├── Diagram.svg         # Diagrama del ciclo agente-entorno
│   ├── Street.svg          # Fondo de la intersección
│   ├── car.svg             # Icono de vehículo
│   └── left-arrow.svg      # Icono de volver   
└── docs/
    └── Informe Sistemas Inteligentes.pdf     # Informe breve del proyecto
```
---

## Instrucciones de ejecución

### Opción 1: GitHub Pages (recomendada)

Abre el siguiente enlace en cualquier navegador moderno:

[https://gape-mol.github.io/SisInt/](https://gape-mol.github.io/SisInt/)

Desde allí podrás navegar por el contenido educativo y acceder al simulador mediante el enlace del menú lateral.

### Opción 2: Ejecución local

#### Clonar el repositorio

1. Abre una terminal.
2. Ejecuta:

   ```bash
   git clone https://github.com/Gape-mol/SisInt.git
   ```

3. Entra en la carpeta del proyecto:

   ```bash
   cd SisInt
   ```

4. Abre el archivo `index.html` directamente en tu navegador:

   - Haciendo doble clic en `index.html`.
   - O ejecutando desde la terminal:

     ```bash
     start index.html
     ```

#### Descargar como ZIP

1. Ve a [https://github.com/Gape-mol/SisInt](https://github.com/Gape-mol/SisInt).
2. Haz clic en el botón verde **Code** y selecciona **Download ZIP**.
3. Descomprime el archivo descargado.
4. Abre el archivo `index.html` del interior de la carpeta con tu navegador.

---

## Cómo usar el simulador

1. En `index.html`, haz clic en **Caso práctico** en el menú lateral y luego click en *Acceder* al final de la pagina o navega a `simulador.html`.
2. En el panel de entrenamiento ajusta los hiperparámetros si lo deseas:
   - Tasa de aprendizaje (alpha).
   - Factor de descuento (gamma).
   - Exploración inicial (epsilon).
   - Exploración mínima y decaimiento de epsilon.
   - Velocidad de entrenamiento.
3. Pulsa **Entrenar** para que el agente aprenda.
4. Observa la evolución en el gráfico, la tabla Q y la intersección.
5. Cambia a la pestaña **Tabla Q** para ver los valores aprendidos.
6. Una vez entrenado, prueba el modo **Tú eres el agente** para comparar tus decisiones con las del agente.

---

## Créditos

- Diagrama del ciclo agente-entorno creado con [Excalidraw](https://excalidraw.com).
- SVG de la intersección creado con [Excalidraw](https://excalidraw.com).
- Icono de flecha atrás obtenido de [SVG Repo](https://www.svgrepo.com).
- Icono de vehículo obtenido de [SVG Repo](https://www.svgrepo.com).