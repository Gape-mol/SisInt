const Vistas = (function () {
  let contenedorTabla = null;
  let contenedorGrafico = null;
  let canvas = null;
  let ctx = null;

  const ALTURA_GRAFICO = 320;
  const MARGEN_GRAFICO = { arriba: 24, derecha: 24, abajo: 40, izquierda: 56 };

  // referencia al contenedor de la tabla Q
  function inicializar(idContenedor) {
    contenedorTabla = document.getElementById(idContenedor);
  }

  // referencia al contenedor del gráfico de recompensa
  function inicializarGrafico(idContenedor) {
    contenedorGrafico = document.getElementById(idContenedor);
  }

  // capitaliza y reemplaza guiones bajos por espacios
  function formatearAccion(nombre) {
    return nombre
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  // convierte un valor Q a un color de fondo tipo heatmap (rojo -> amarillo -> verde)
  function colorCelda(valor, min, max) {
    if (!Number.isFinite(valor) || min === max) {
      return { fondo: '#f8f9fa', texto: '#333333' };
    }

    const t = Math.max(0, Math.min(1, (valor - min) / (max - min)));
    const matiz = Math.round(120 * t);
    const fondo = `hsl(${matiz}, 75%, 88%)`;
    const texto = '#333333';
    return { fondo, texto };
  }

  // renderiza la tabla Q completa (24 estados x 4 acciones)
  function renderizarQTable(agente) {
    if (!contenedorTabla) return;

    const estados = EntornoTrafico.todosLosEstados();
    const acciones = EntornoTrafico.ACCIONES;

    // recopila todos los valores Q para normalizar el heatmap
    let min = Infinity;
    let max = -Infinity;
    const valores = estados.map(estado => {
      const clave = EntornoTrafico.claveEstado(estado);
      return acciones.map((_, a) => {
        const q = agente.getQ(clave, a);
        min = Math.min(min, q);
        max = Math.max(max, q);
        return q;
      });
    });

    // evita rango nulo cuando todo es cero
    if (min === Infinity) {
      min = 0;
      max = 0;
    }

    const tabla = document.createElement('table');
    tabla.className = 'q-table';
    tabla.setAttribute('aria-label', 'Tabla Q del agente');

    const thead = document.createElement('thead');
    const filaCabecera = document.createElement('tr');
    filaCabecera.appendChild(document.createElement('th')).textContent = 'Estado';
    acciones.forEach(nombre => {
      const th = document.createElement('th');
      th.textContent = formatearAccion(nombre);
      filaCabecera.appendChild(th);
    });
    thead.appendChild(filaCabecera);
    tabla.appendChild(thead);

    const tbody = document.createElement('tbody');
    estados.forEach((estado, i) => {
      const clave = EntornoTrafico.claveEstado(estado);
      const filaValores = valores[i];
      const mejorValor = Math.max(...filaValores);

      const fila = document.createElement('tr');

      const celdaEstado = document.createElement('td');
      celdaEstado.className = 'q-estado';
      celdaEstado.textContent = clave.replace(/\|/g, ' · ');
      celdaEstado.title = `Flujo: ${estado.flujo}, Patrón: ${estado.patron}, Incidente: ${estado.incidente}`;
      fila.appendChild(celdaEstado);

      filaValores.forEach((q, a) => {
        const celda = document.createElement('td');
        const { fondo, texto } = colorCelda(q, min, max);
        celda.style.backgroundColor = fondo;
        celda.style.color = texto;
        celda.textContent = Number.isFinite(q) ? q.toFixed(2) : '0.00';

        if (q === mejorValor && acciones.length > 1) {
          celda.classList.add('mejor-accion');
          celda.setAttribute('aria-label', `${formatearAccion(acciones[a])}, valor ${celda.textContent}, mejor acción`);
        } else {
          celda.setAttribute('aria-label', `${formatearAccion(acciones[a])}, valor ${celda.textContent}`);
        }

        fila.appendChild(celda);
      });

      tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);

    contenedorTabla.innerHTML = '';
    contenedorTabla.appendChild(tabla);
  }

  // redimensiona el canvas al tamaño del contenedor considerando el DPR
  function ajustarCanvas() {
    if (!contenedorGrafico || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const anchoCss = contenedorGrafico.clientWidth;

    canvas.style.width = `${anchoCss}px`;
    canvas.style.height = `${ALTURA_GRAFICO}px`;
    canvas.width = Math.floor(anchoCss * dpr);
    canvas.height = Math.floor(ALTURA_GRAFICO * dpr);

    ctx.scale(dpr, dpr);
  }

  // renderiza el gráfico de recompensa acumulada por episodio
  function renderizarGrafico(historialRecompensas) {
    if (!contenedorGrafico || historialRecompensas.length === 0) return;

    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.setAttribute('aria-label', 'Gráfico de recompensa por episodio');
      ctx = canvas.getContext('2d');
      contenedorGrafico.innerHTML = '';
      contenedorGrafico.appendChild(canvas);
    }

    ajustarCanvas();

    const ancho = contenedorGrafico.clientWidth;
    const alto = ALTURA_GRAFICO;
    const { arriba, derecha, abajo, izquierda } = MARGEN_GRAFICO;
    const anchoGrafico = ancho - izquierda - derecha;
    const altoGrafico = alto - arriba - abajo;

    // límites
    const recompensas = historialRecompensas;
    let minY = Math.min(...recompensas);
    let maxY = Math.max(...recompensas);
    if (minY === maxY) {
      minY -= 1;
      maxY += 1;
    }
    // añade un pequeño margen vertical
    const rangoY = maxY - minY;
    minY -= rangoY * 0.05;
    maxY += rangoY * 0.05;

    const totalEpisodios = recompensas.length;

    // limpia
    ctx.clearRect(0, 0, ancho, alto);

    // ejes
    ctx.strokeStyle = '#5f6368';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(izquierda, arriba);
    ctx.lineTo(izquierda, alto - abajo);
    ctx.lineTo(ancho - derecha, alto - abajo);
    ctx.stroke();

    // etiquetas eje Y
    ctx.fillStyle = '#5f6368';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const pasosY = 4;
    for (let i = 0; i <= pasosY; i++) {
      const valor = minY + (maxY - minY) * (i / pasosY);
      const y = alto - abajo - (altoGrafico * (i / pasosY));
      ctx.fillText(valor.toFixed(0), izquierda - 8, y);

      ctx.strokeStyle = '#e8eaed';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(izquierda, y);
      ctx.lineTo(ancho - derecha, y);
      ctx.stroke();
    }

    // etiquetas eje X
    ctx.fillStyle = '#5f6368';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const pasosX = Math.min(5, totalEpisodios);
    for (let i = 0; i <= pasosX; i++) {
      const episodio = Math.round(1 + (totalEpisodios - 1) * (i / pasosX));
      const x = izquierda + anchoGrafico * ((episodio - 1) / Math.max(1, totalEpisodios - 1));
      ctx.fillText(String(episodio), x, alto - abajo + 8);
    }

    // línea de recompensa
    ctx.strokeStyle = '#1a73e8';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    recompensas.forEach((r, i) => {
      const x = izquierda + anchoGrafico * (i / Math.max(1, totalEpisodios - 1));
      const y = alto - abajo - ((r - minY) / (maxY - minY)) * altoGrafico;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // puntos
    ctx.fillStyle = '#1a73e8';
    recompensas.forEach((r, i) => {
      const x = izquierda + anchoGrafico * (i / Math.max(1, totalEpisodios - 1));
      const y = alto - abajo - ((r - minY) / (maxY - minY)) * altoGrafico;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // leyenda
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('Recompensa por episodio', izquierda, 6);
  }

  // limpia las visualizaciones y restaura los mensajes iniciales
  function limpiar() {
    if (contenedorTabla) {
      contenedorTabla.innerHTML = '<p class="q-table-vacia">Entrena el agente para ver la tabla Q.</p>';
    }
    if (contenedorGrafico) {
      canvas = null;
      ctx = null;
      contenedorGrafico.innerHTML = '<p class="grafico-vacio">Entrena el agente para ver la evolución de la recompensa.</p>';
    }
  }

  return {
    inicializar,
    inicializarGrafico,
    renderizarQTable,
    renderizarGrafico,
    limpiar,
  };
})();

window.Vistas = Vistas;
