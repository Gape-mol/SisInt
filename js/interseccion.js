const Interseccion = (function () {
  let contenedor = null;
  let svg = null;
  let overlay = null;
  let leyendaEl = null;
  let badgeRect = null;
  let badgeText = null;
  let incidenteGrupo = null;

  // referencias a coches por carril (para mostrar/ocultar según flujo)
  let cochesPorCarril = [];

  // estado del semáforo
  let semaforoTimer = null;
  let faseActual = 'H';
  let faseMs = 3000;
  let modoSemaforo = 'normal';
  let animacionPausada = false;

  const COLORES_ACCION = {
    normal: '#34a853',
    alerta_leve: '#fbbc04',
    alerta_critica: '#f57c00',
    emergencia: '#ea4335',
  };

  const ICONOS_INCIDENTE = {
    ninguno: '',
    exceso: '⚡ Exceso',
    contraflujo: '⬍ Contraflujo',
    bloqueo: '✕ Bloqueo',
  };

  const RUTA_COCHE = './assets/car.svg';
  const RUTA_CALLE = './assets/Street.svg';

  const TAMANO_SVG = 120;
  const INICIO_CARRETERA = 10;
  const FIN_CARRETERA = 110;
  const LONGITUD_CARRETERA = FIN_CARRETERA - INICIO_CARRETERA;

  const ANCHO_COCHE = 14;
  const ALTO_COCHE = 6.2;
  const MARGEN_COCHE = ANCHO_COCHE / 2 + 1;

  // carriles: 0,1 horizontales; 2,3 verticales
  const CARRILES = [
    { x: INICIO_CARRETERA - MARGEN_COCHE, y: 52.8, angulo: 0, espejado: false, eje: 'H' },
    { x: FIN_CARRETERA + MARGEN_COCHE, y: 67.2, angulo: 0, espejado: true, eje: 'H' },
    { x: 52.8, y: INICIO_CARRETERA - MARGEN_COCHE, angulo: 90, espejado: false, eje: 'V' },
    { x: 67.2, y: FIN_CARRETERA + MARGEN_COCHE, angulo: 270, espejado: false, eje: 'V' },
  ];

  const MAX_COCHE_POR_CARRIL = 3;
  const DISTANCIA_ANIM = LONGITUD_CARRETERA + ANCHO_COCHE + 2;
  const DURACION_BASE = 3;

  function inicializar(idContenedor) {
    contenedor = document.getElementById(idContenedor);
    if (!contenedor) return;
    construirEscena();
  }

  function crearElemento(tag, atributos = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(atributos).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  function crearTexto(x, y, contenido, clase) {
    const t = crearElemento('text', { x, y, class: clase });
    t.textContent = contenido;
    return t;
  }

  function formatearAccion(nombre) {
    return nombre
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  function construirEscena() {
    svg = crearElemento('svg', {
      viewBox: `0 0 ${TAMANO_SVG} ${TAMANO_SVG}`,
      class: 'interseccion-svg',
      'aria-label': 'Visualización esquemática de la intersección',
    });

    // fondo de calle
    svg.appendChild(crearElemento('image', {
      href: RUTA_CALLE,
      x: 0,
      y: 0,
      width: TAMANO_SVG,
      height: TAMANO_SVG,
    }));

    // recorte de carretera
    const defs = crearElemento('defs');
    const clip = crearElemento('clipPath', { id: 'clip-carretera' });
    clip.appendChild(crearElemento('rect', {
      x: INICIO_CARRETERA,
      y: INICIO_CARRETERA,
      width: LONGITUD_CARRETERA,
      height: LONGITUD_CARRETERA,
    }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    const trafico = crearElemento('g', { 'clip-path': 'url(#clip-carretera)' });

    cochesPorCarril = [];

    CARRILES.forEach((carril, carrilIndex) => {
      const cochesCarril = [];
      for (let i = 0; i < MAX_COCHE_POR_CARRIL; i++) {
        const coche = crearCoche(carril, i);
        trafico.appendChild(coche.elemento);
        cochesCarril.push(coche);
      }
      cochesPorCarril.push(cochesCarril);
    });

    svg.appendChild(trafico);

    // semáforo (dos luces: H y V)
    const semaforo = crearElemento('g', { class: 'semaforo' });
    const luzH = crearElemento('circle', {
      cx: 14, cy: 14, r: 3, class: 'semaforo-luz semaforo-luz-h verde',
    });
    const luzV = crearElemento('circle', {
      cx: 22, cy: 14, r: 3, class: 'semaforo-luz semaforo-luz-v rojo',
    });
    semaforo.appendChild(luzH);
    semaforo.appendChild(luzV);
    svg.appendChild(semaforo);

    // overlay dinámico
    overlay = crearElemento('g', { class: 'interseccion-overlay' });

    leyendaEl = crearTexto(4, 7, '', 'interseccion-leyenda');
    overlay.appendChild(leyendaEl);

    badgeRect = crearElemento('rect', {
      x: 82, y: 4, width: 34, height: 7, rx: 3.5, class: 'interseccion-accion-fondo',
    });
    badgeText = crearTexto(99, 8.8, '', 'interseccion-accion-texto');
    overlay.appendChild(badgeRect);
    overlay.appendChild(badgeText);

    incidenteGrupo = crearElemento('g', { class: 'interseccion-incidente' });
    incidenteGrupo.appendChild(crearElemento('rect', {
      x: 45, y: 45, width: 30, height: 12, rx: 1.5, class: 'interseccion-incidente-fondo',
    }));
    incidenteGrupo.appendChild(crearTexto(60, 52.5, '', 'interseccion-incidente-titulo'));
    incidenteGrupo.appendChild(crearTexto(60, 56, '', 'interseccion-incidente-texto'));
    incidenteGrupo.setAttribute('hidden', true);
    overlay.appendChild(incidenteGrupo);

    svg.appendChild(overlay);
    contenedor.innerHTML = '';
    contenedor.appendChild(svg);

    iniciarSemaforo();
  }

  function crearCoche(carril, indice) {
    const espejo = carril.espejado ? -1 : 1;
    const grupo = crearElemento('g', {
      class: 'interseccion-coche',
      transform: `translate(${carril.x}, ${carril.y}) rotate(${carril.angulo}) scale(${espejo}, 1)`,
    });

    const movil = crearElemento('g', {
      class: 'interseccion-coche-movil',
      style: `--dist: ${DISTANCIA_ANIM}px; animation-delay: ${-(indice / MAX_COCHE_POR_CARRIL) * DURACION_BASE}s;`,
    });

    movil.appendChild(crearElemento('image', {
      href: RUTA_COCHE,
      x: -ANCHO_COCHE / 2,
      y: -ALTO_COCHE / 2,
      width: ANCHO_COCHE,
      height: ALTO_COCHE,
    }));

    grupo.appendChild(movil);
    grupo.setAttribute('hidden', 'true');

    return { elemento: grupo, movil, eje: carril.eje };
  }

  function iniciarSemaforo() {
    detenerSemaforo();
    if (animacionPausada) return;

    if (modoSemaforo === 'ambar' || modoSemaforo === 'rojo') {
      aplicarModoSemaforo();
      return;
    }

    aplicarFaseSemaforo();
    semaforoTimer = setInterval(alternarFase, faseMs);
  }

  function detenerSemaforo() {
    if (semaforoTimer) {
      clearInterval(semaforoTimer);
      semaforoTimer = null;
    }
  }

  function alternarFase() {
    faseActual = faseActual === 'H' ? 'V' : 'H';
    aplicarFaseSemaforo();
  }

  function aplicarFaseSemaforo() {
    const luzH = svg.querySelector('.semaforo-luz-h');
    const luzV = svg.querySelector('.semaforo-luz-v');
    if (!luzH || !luzV) return;

    luzH.classList.remove('verde', 'rojo', 'ambar');
    luzV.classList.remove('verde', 'rojo', 'ambar');

    if (faseActual === 'H') {
      luzH.classList.add('verde');
      luzV.classList.add('rojo');
      setPausaCarriles('V');
    } else {
      luzH.classList.add('rojo');
      luzV.classList.add('verde');
      setPausaCarriles('H');
    }
  }

  function aplicarModoSemaforo() {
    const luzH = svg.querySelector('.semaforo-luz-h');
    const luzV = svg.querySelector('.semaforo-luz-v');
    if (!luzH || !luzV) return;

    luzH.classList.remove('verde', 'rojo', 'ambar');
    luzV.classList.remove('verde', 'rojo', 'ambar');

    if (modoSemaforo === 'ambar') {
      luzH.classList.add('ambar');
      luzV.classList.add('ambar');
      setModoCoches('lento');
    } else if (modoSemaforo === 'rojo') {
      luzH.classList.add('rojo');
      luzV.classList.add('rojo');
      setModoCoches('pausado');
    }
  }

  function setPausaCarriles(ejePausado) {
    cochesPorCarril.forEach((cochesCarril) => {
      cochesCarril.forEach(({ movil, eje }) => {
        movil.classList.remove('interseccion-coche-pausado', 'interseccion-coche-lento');
        if (eje === ejePausado) {
          movil.classList.add('interseccion-coche-pausado');
        }
      });
    });
  }

  function setModoCoches(modo) {
    cochesPorCarril.forEach((cochesCarril) => {
      cochesCarril.forEach(({ movil }) => {
        movil.classList.remove('interseccion-coche-pausado', 'interseccion-coche-lento');
        if (modo === 'lento') movil.classList.add('interseccion-coche-lento');
        else if (modo === 'pausado') movil.classList.add('interseccion-coche-pausado');
      });
    });
  }

  // actualiza solo el overlay y la visibilidad de coches según flujo
  function actualizarEstado(estado, accionIndex) {
    if (!svg) return;

    const accionNombre = EntornoTrafico.ACCIONES[accionIndex] || 'normal';
    const colorAccion = COLORES_ACCION[accionNombre] || '#34a853';

    // leyenda
    leyendaEl.textContent = `Flujo: ${estado.flujo} · Patrón: ${estado.patron}`;

    // badge
    badgeRect.setAttribute('fill', colorAccion);
    badgeText.textContent = formatearAccion(accionNombre);

    // incidente
    const tituloIncidente = incidenteGrupo.querySelector('.interseccion-incidente-titulo');
    const textoIncidente = incidenteGrupo.querySelector('.interseccion-incidente-texto');
    if (estado.incidente !== 'ninguno') {
      tituloIncidente.textContent = '⚠ Incidente';
      textoIncidente.textContent = ICONOS_INCIDENTE[estado.incidente] || estado.incidente;
      incidenteGrupo.removeAttribute('hidden');
    } else {
      incidenteGrupo.setAttribute('hidden', 'true');
    }

    // semáforo reactivo según acción
    configurarSemaforo(accionNombre);

    // visibilidad de coches según flujo
    const cochesVisibles = { bajo: 1, medio: 2, alto: 3 }[estado.flujo] || 1;
    cochesPorCarril.forEach((cochesCarril) => {
      cochesCarril.forEach((coche, i) => {
        const visibleGlobalmente = i < cochesVisibles;
        const esIrregular = estado.patron === 'irregular' && i === 0 && coche.eje === 'H';
        coche.elemento.classList.toggle('interseccion-coche-irregular', esIrregular && visibleGlobalmente);
        if (visibleGlobalmente) {
          coche.elemento.removeAttribute('hidden');
        } else {
          coche.elemento.setAttribute('hidden', 'true');
        }
      });
    });
  }

  function configurarSemaforo(accionNombre) {
    const config = {
      normal: { faseMs: 3000, modo: 'normal' },
      alerta_leve: { faseMs: 1500, modo: 'normal' },
      alerta_critica: { faseMs: 0, modo: 'ambar' },
      emergencia: { faseMs: 0, modo: 'rojo' },
    };

    const cfg = config[accionNombre] || config.normal;
    const cambioModo = cfg.modo !== modoSemaforo;
    const cambioFase = cfg.faseMs !== faseMs;

    modoSemaforo = cfg.modo;
    faseMs = cfg.faseMs;

    if (cambioModo || cambioFase) {
      iniciarSemaforo();
    }
  }

  function pausarAnimacion() {
    if (animacionPausada) return;
    animacionPausada = true;
    detenerSemaforo();
    if (svg) svg.classList.add('interseccion-pausada');
  }

  function reanudarAnimacion() {
    if (!animacionPausada) return;
    animacionPausada = false;
    if (svg) svg.classList.remove('interseccion-pausada');
    iniciarSemaforo();
  }

  function limpiar() {
    detenerSemaforo();
    animacionPausada = false;
    svg = null;
    overlay = null;
    cochesPorCarril = [];
    if (!contenedor) return;
    contenedor.innerHTML = '<p class="interseccion-vacia">Entrena el agente para ver la intersección.</p>';
  }

  return {
    inicializar,
    actualizarEstado,
    pausarAnimacion,
    reanudarAnimacion,
    limpiar,
  };
})();

window.Interseccion = Interseccion;