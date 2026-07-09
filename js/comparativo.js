const Comparativo = (function () {
  let contenedorEstadoTexto = null;
  let contenedorInterseccion = null;
  let contenedorResultado = null;
  let tablaHistorial = null;
  let resumenFinal = null;
  let marcadorUsuario = null;
  let marcadorAgente = null;
  let marcadorRonda = null;
  let btnNuevaRonda = null;
  let botonesAccion = [];

  const TOTAL_RONDAS = 10;

  let rondaActual = 0;
  let puntosUsuario = 0;
  let puntosAgente = 0;
  let historial = [];
  let estadoActual = null;
  let accionAgente = null;
  let rondaEnCurso = false;
  let timeoutAutoAvance = null;

  const NOMBRES_ACCION = ['Normal', 'Alerta leve', 'Alerta crítica', 'Emergencia'];
  const COLORES_ACCION = ['#34a853', '#fbbc04', '#f57c00', '#ea4335'];

  function inicializar() {
    contenedorEstadoTexto = document.getElementById('comparativo-estado-texto');
    contenedorInterseccion = document.getElementById('comparativo-interseccion');
    contenedorResultado = document.getElementById('comparativo-resultado');
    tablaHistorial = document.querySelector('#comparativo-tabla tbody');
    resumenFinal = document.getElementById('comparativo-resumen');
    marcadorUsuario = document.getElementById('marcador-usuario');
    marcadorAgente = document.getElementById('marcador-agente');
    marcadorRonda = document.getElementById('marcador-ronda');
    btnNuevaRonda = document.getElementById('btn-nueva-ronda');
    botonesAccion = document.querySelectorAll('.btn-comparativo');

    botonesAccion.forEach(btn => {
      btn.addEventListener('click', () => {
        const accion = parseInt(btn.dataset.accion, 10);
        resolverRonda(accion);
      });
    });

    btnNuevaRonda.addEventListener('click', () => {
      if (rondaActual >= TOTAL_RONDAS) {
        reiniciarJuego();
      }
    });
  }

  function cancelarAutoAvance() {
    if (timeoutAutoAvance) {
      clearTimeout(timeoutAutoAvance);
      timeoutAutoAvance = null;
    }
  }

  function detener() {
    cancelarAutoAvance();
  }

  function obtenerAgente() {
    return window.agenteRL || null;
  }

  function formatearEstado(estado) {
    return `Flujo: ${estado.flujo} · Patrón: ${estado.patron} · Incidente: ${estado.incidente}`;
  }

  function renderizarMiniInterseccion(estado, accionIndex = null) {
    if (!contenedorInterseccion) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'interseccion-svg');

    svg.appendChild(crearElementoSvg('image', {
      href: './assets/Street.svg',
      x: 0, y: 0, width: 120, height: 120,
    }));

    const cochesPorFlujo = { bajo: 1, medio: 2, alto: 3 };
    const total = cochesPorFlujo[estado.flujo] || 1;
    const posiciones = [
      { x: 25, y: 52.8, a: 0 },
      { x: 95, y: 52.8, a: 0 },
      { x: 52.8, y: 25, a: 90 },
      { x: 52.8, y: 95, a: 90 },
      { x: 25, y: 67.2, a: 180 },
      { x: 95, y: 67.2, a: 180 },
    ];

    for (let i = 0; i < total && i < posiciones.length; i++) {
      const p = posiciones[i];
      const g = crearElementoSvg('g', {
        transform: `translate(${p.x}, ${p.y}) rotate(${p.a})`,
      });
      g.appendChild(crearElementoSvg('image', {
        href: './assets/car.svg',
        x: -7, y: -3, width: 14, height: 6,
      }));
      svg.appendChild(g);
    }

    if (accionIndex !== null && accionIndex !== undefined) {
      const colorAccion = COLORES_ACCION[accionIndex] || '#34a853';
      const badge = crearElementoSvg('g');
      badge.appendChild(crearElementoSvg('rect', {
        x: 82, y: 4, width: 34, height: 7, rx: 3.5, fill: colorAccion,
      }));
      const texto = crearElementoSvg('text', {
        x: 99, y: 8.8, class: 'interseccion-accion-texto', fill: '#ffffff',
      });
      texto.textContent = NOMBRES_ACCION[accionIndex] || '—';
      badge.appendChild(texto);
      svg.appendChild(badge);
    }

    if (estado.incidente !== 'ninguno') {
      const grupo = crearElementoSvg('g');
      grupo.appendChild(crearElementoSvg('rect', {
        x: 45, y: 45, width: 30, height: 12, rx: 1.5,
        fill: 'rgba(255,255,255,0.92)',
      }));
      const titulo = crearElementoSvg('text', {
        x: 60, y: 52.5, fill: '#ea4335', 'font-size': '3px',
        'font-weight': '700', 'text-anchor': 'middle',
      });
      titulo.textContent = '⚠ Incidente';
      grupo.appendChild(titulo);
      const desc = crearElementoSvg('text', {
        x: 60, y: 56, fill: '#333', 'font-size': '2.5px', 'text-anchor': 'middle',
      });
      desc.textContent = estado.incidente;
      grupo.appendChild(desc);
      svg.appendChild(grupo);
    }

    contenedorInterseccion.innerHTML = '';
    contenedorInterseccion.appendChild(svg);
  }

  function crearElementoSvg(tag, atributos = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(atributos).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function obtenerValoresQ(clave) {
    const agente = obtenerAgente();
    if (!agente) return [];
    return EntornoTrafico.ACCIONES.map((_, i) => ({
      accion: i,
      nombre: NOMBRES_ACCION[i],
      color: COLORES_ACCION[i],
      valor: agente.getQ(clave, i),
    })).sort((a, b) => b.valor - a.valor);
  }

  function explicacionRonda(estado, accionAgente) {
    const severidad = EntornoTrafico.severidad(estado);
    const nombreSeveridad = NOMBRES_ACCION[severidad] || 'Normal';
    const nombreAgente = NOMBRES_ACCION[accionAgente];
    let texto = `La severidad del incidente (${estado.incidente}) corresponde al nivel «${nombreSeveridad}». `;
    if (accionAgente === severidad) {
      texto += `El agente eligió «${nombreAgente}» porque coincide con esa severidad y obtiene la máxima recompensa.`;
    } else {
      texto += `El agente eligió «${nombreAgente}»; aunque no coincide exactamente con la severidad, es la acción con mayor valor Q aprendido para este estado.`;
    }
    return texto;
  }

  function iniciarRonda() {
    const agente = obtenerAgente();
    if (!agente) {
      contenedorEstadoTexto.textContent = 'Primero entrena al agente en el modo entrenamiento.';
      return;
    }

    cancelarAutoAvance();
    rondaEnCurso = true;
    estadoActual = EntornoTrafico.estadoAleatorio();
    const clave = EntornoTrafico.claveEstado(estadoActual);
    accionAgente = agente.mejorAccion(clave);

    contenedorEstadoTexto.textContent = formatearEstado(estadoActual);
    renderizarMiniInterseccion(estadoActual, null);
    resumenFinal.hidden = true;

    botonesAccion.forEach(btn => {
      btn.disabled = false;
    });
    btnNuevaRonda.hidden = true;
  }

  function resolverRonda(accionUsuario) {
    if (!rondaEnCurso) return;
    rondaEnCurso = false;
    rondaActual++;

    const recompensaUsuario = EntornoTrafico.recompensa(estadoActual, accionUsuario);
    const recompensaAgente = EntornoTrafico.recompensa(estadoActual, accionAgente);

    puntosUsuario += recompensaUsuario;
    puntosAgente += recompensaAgente;

    historial.push({
      ronda: rondaActual,
      estado: formatearEstado(estadoActual),
      accionUsuario,
      accionAgente,
      recompensaUsuario,
      recompensaAgente,
    });

    actualizarMarcador();
    agregarFilaHistorial();
    renderizarMiniInterseccion(estadoActual, accionAgente);
    mostrarResultadoRonda(accionUsuario, recompensaUsuario, recompensaAgente);

    botonesAccion.forEach(btn => {
      btn.disabled = true;
    });

    if (rondaActual >= TOTAL_RONDAS) {
      btnNuevaRonda.textContent = 'Jugar de nuevo';
      btnNuevaRonda.hidden = false;
      mostrarResumen();
    } else {
      timeoutAutoAvance = setTimeout(() => {
        timeoutAutoAvance = null;
        iniciarRonda();
      }, 1500);
    }
  }

  function mostrarResultadoRonda(accionUsuario, recUsuario, recAgente) {
    const nombreUsuario = NOMBRES_ACCION[accionUsuario];
    const nombreAgente = NOMBRES_ACCION[accionAgente];
    const clave = EntornoTrafico.claveEstado(estadoActual);
    const valoresQ = obtenerValoresQ(clave);

    let html = `<p><strong>Tú:</strong> ${nombreUsuario} → recompensa <span class="comparativo-puntos ${recUsuario >= 0 ? 'positivo' : 'negativo'}">${recUsuario}</span></p>`;
    html += `<p><strong>Agente:</strong> ${nombreAgente} → recompensa <span class="comparativo-puntos ${recAgente >= 0 ? 'positivo' : 'negativo'}">${recAgente}</span></p>`;

    if (recUsuario > recAgente) {
      html += '<p class="comparativo-ganador">¡Ganaste esta ronda!</p>';
    } else if (recUsuario < recAgente) {
      html += '<p class="comparativo-ganador">El agente ganó esta ronda.</p>';
    } else {
      html += '<p class="comparativo-ganador">Empate.</p>';
    }

    html += `<p class="comparativo-explicacion">${explicacionRonda(estadoActual, accionAgente)}</p>`;

    if (valoresQ.length > 0) {
      html += '<p class="comparativo-qvalues-titulo"><strong>Valores Q del estado actual:</strong></p>';
      html += '<ul class="comparativo-qvalues">';
      valoresQ.forEach((v, i) => {
        const esMejor = i === 0;
        html += `<li class="${esMejor ? 'mejor-q' : ''}">
          <span class="q-nombre" style="color:${v.color}">${v.nombre}</span>
          <span class="q-valor">${v.valor.toFixed(2)}</span>
          ${esMejor ? '<span class="q-etiqueta">elegida por el agente</span>' : ''}
        </li>`;
      });
      html += '</ul>';
    }

    contenedorResultado.innerHTML = html;
  }

  function agregarFilaHistorial() {
    const ultimo = historial[historial.length - 1];
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${ultimo.ronda}</td>
      <td>${ultimo.estado}</td>
      <td>${NOMBRES_ACCION[ultimo.accionUsuario]}</td>
      <td>${NOMBRES_ACCION[ultimo.accionAgente]}</td>
      <td class="${ultimo.recompensaUsuario >= 0 ? 'positivo' : 'negativo'}">${ultimo.recompensaUsuario}</td>
      <td class="${ultimo.recompensaAgente >= 0 ? 'positivo' : 'negativo'}">${ultimo.recompensaAgente}</td>
    `;
    tablaHistorial.appendChild(fila);
  }

  function actualizarMarcador() {
    marcadorUsuario.textContent = puntosUsuario;
    marcadorAgente.textContent = puntosAgente;
    marcadorRonda.textContent = `${rondaActual}/${TOTAL_RONDAS}`;
  }

  function mostrarResumen() {
    let mensaje = '';
    if (puntosUsuario > puntosAgente) {
      mensaje = `¡Ganaste! ${puntosUsuario} a ${puntosAgente}.`;
    } else if (puntosUsuario < puntosAgente) {
      mensaje = `El agente ganó ${puntosAgente} a ${puntosUsuario}.`;
    } else {
      mensaje = `Empate a ${puntosUsuario}.`;
    }

    resumenFinal.textContent = mensaje;
    resumenFinal.hidden = false;
  }

  function reiniciarJuego() {
    cancelarAutoAvance();
    rondaActual = 0;
    puntosUsuario = 0;
    puntosAgente = 0;
    historial = [];
    estadoActual = null;
    accionAgente = null;
    rondaEnCurso = false;

    tablaHistorial.innerHTML = '';
    contenedorResultado.innerHTML = '';
    resumenFinal.hidden = true;
    btnNuevaRonda.textContent = 'Jugar de nuevo';
    actualizarMarcador();
    iniciarRonda();
  }

  function resetear() {
    cancelarAutoAvance();
    rondaActual = 0;
    puntosUsuario = 0;
    puntosAgente = 0;
    historial = [];
    estadoActual = null;
    accionAgente = null;
    rondaEnCurso = false;

    tablaHistorial.innerHTML = '';
    contenedorResultado.innerHTML = '';
    resumenFinal.hidden = true;
    btnNuevaRonda.textContent = 'Jugar de nuevo';
    btnNuevaRonda.hidden = true;
    contenedorEstadoTexto.textContent = '—';
    contenedorInterseccion.innerHTML = '<p class="interseccion-vacia">Entrena el agente antes de jugar.</p>';
    actualizarMarcador();
  }

  return {
    inicializar,
    iniciarRonda,
    resetear,
    detener,
  };
})();

window.Comparativo = Comparativo;
