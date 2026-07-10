document.addEventListener('DOMContentLoaded', () => {
  // referencias del selector de modo
  const panelEntrenamiento = document.getElementById('modo-entrenamiento');
  const panelComparativo = document.getElementById('modo-comparativo');
  const botonEntrenamiento = document.querySelector('.nav-modo[data-modo="entrenamiento"]');
  const botonComparativo = document.querySelector('.nav-modo[data-modo="comparativo"]');

  // referencias del panel de entrenamiento
  const inputAlpha = document.getElementById('alpha');
  const inputGamma = document.getElementById('gamma');
  const inputEpsilon = document.getElementById('epsilon');
  const inputEpsilonMin = document.getElementById('epsilon-min');
  const inputEpsilonDecay = document.getElementById('epsilon-decay');
  const inputVelocidad = document.getElementById('velocidad');
  const inputEpisodios = document.getElementById('episodios-objetivo');

  const labelAlpha = document.getElementById('alpha-valor');
  const labelGamma = document.getElementById('gamma-valor');
  const labelEpsilon = document.getElementById('epsilon-valor');
  const labelEpsilonMin = document.getElementById('epsilon-min-valor');
  const labelEpsilonDecay = document.getElementById('epsilon-decay-valor');
  const labelVelocidad = document.getElementById('velocidad-valor');

  const btnEntrenar = document.getElementById('btn-entrenar');
  const btnPausar = document.getElementById('btn-pausar');
  const btnPaso = document.getElementById('btn-paso');
  const btnReiniciar = document.getElementById('btn-reiniciar');

  const metricaEpisodios = document.getElementById('metrica-episodios');
  const metricaRecompensa = document.getElementById('metrica-recompensa');
  const metricaMedia = document.getElementById('metrica-media');
  const metricaEpsilon = document.getElementById('metrica-epsilon');
  const estadoEntrenamiento = document.getElementById('estado-entrenamiento');

  // referencias de las pestañas
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // constantes de configuracion del entrenamiento
  const PASOS_POR_EPISODIO = 10;

  // estado interno del entrenamiento
  let agente = null;
  let entrenando = false;
  let pausado = false;
  let timeoutId = null;
  let episodiosCompletados = 0;
  let episodiosRonda = 0;
  let episodiosObjetivoRonda = 0;
  let recompensaTotal = 0;
  let historialRecompensas = [];
  let animacionCongelada = false;

  // formatea un numero con dos decimales
  function formatearNumero(n) {
    return Number.isFinite(n) ? n.toFixed(2) : '—';
  }

  // media de recompensa de los ultimos n episodios
  function calcularMediaUltimos(n) {
    const ultimas = historialRecompensas.slice(-n);
    if (ultimas.length === 0) return null;
    return ultimas.reduce((a, b) => a + b, 0) / ultimas.length;
  }

  // crea una nueva instancia del agente con los parametros del panel
  function crearAgente() {
    agente = new QLearningAgent({
      alpha: parseFloat(inputAlpha.value),
      gamma: parseFloat(inputGamma.value),
      epsilon: parseFloat(inputEpsilon.value),
      epsilonMin: parseFloat(inputEpsilonMin.value),
      epsilonDecay: parseFloat(inputEpsilonDecay.value),
      acciones: EntornoTrafico.ACCIONES,
    });
    window.agenteRL = agente;
  }

  // actualiza las metricas mostradas en pantalla
  function actualizarMetricasUI() {
    metricaEpisodios.textContent = episodiosCompletados;
    metricaRecompensa.textContent = recompensaTotal;
    metricaEpsilon.textContent = formatearNumero(agente ? agente.epsilon : 1);

    const media = calcularMediaUltimos(10);
    metricaMedia.textContent = media !== null ? formatearNumero(media) : '—';
  }

  // comprueba si el agente ya cumplio el numero de episodios indicado por el usuario
  function comprobarUmbral() {
    return episodiosRonda >= episodiosObjetivoRonda;
  }

  // sincroniza la animación de la intersección con el estado del entrenamiento
  function sincronizarAnimacion() {
    const congelar = entrenando && !pausado;
    if (congelar && !animacionCongelada) {
      Interseccion.pausarAnimacion();
      animacionCongelada = true;
    } else if (!congelar && animacionCongelada) {
      Interseccion.reanudarAnimacion();
      animacionCongelada = false;
    }
  }

  // reinicia el agente y las metricas de entrenamiento
  function resetearEntrenamiento() {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    entrenando = false;
    pausado = false;
    episodiosCompletados = 0;
    episodiosRonda = 0;
    episodiosObjetivoRonda = 0;
    recompensaTotal = 0;
    historialRecompensas = [];
    crearAgente();
    actualizarMetricasUI();
    Vistas.limpiar();
    Interseccion.limpiar();
    Interseccion.inicializar('interseccion-contenedor');
    Comparativo.resetear();
    animacionCongelada = false;
    Interseccion.reanudarAnimacion();
    actualizarBotonesEntrenamiento();
    sincronizarAnimacion();
    estadoEntrenamiento.innerHTML =
      `Pulsa <strong>Entrenar</strong> para empezar. Se detendrá al alcanzar ${parseInt(inputEpisodios.value, 10) || 50} episodios.`;
  }

  // ejecuta un episodio completo de entrenamiento
  function ejecutarEpisodio() {
    if (!agente) crearAgente();

    let recompensaEpisodio = 0;
    let estado = EntornoTrafico.estadoAleatorio();
    let ultimoEstado = estado;
    let ultimaAccion = 0;

    for (let paso = 0; paso < PASOS_POR_EPISODIO; paso++) {
      const clave = EntornoTrafico.claveEstado(estado);
      const accion = agente.elegirAccion(clave);
      const recompensa = EntornoTrafico.recompensa(estado, accion);
      const siguienteEstado = EntornoTrafico.estadoAleatorio();
      const siguienteClave = EntornoTrafico.claveEstado(siguienteEstado);

      agente.actualizar(clave, accion, recompensa, siguienteClave);
      recompensaEpisodio += recompensa;
      ultimoEstado = estado;
      ultimaAccion = accion;
      estado = siguienteEstado;
    }

    agente.decaerEpsilon();
    episodiosCompletados++;
    episodiosRonda++;
    recompensaTotal += recompensaEpisodio;
    historialRecompensas.push(recompensaEpisodio);
    actualizarMetricasUI();
    Vistas.renderizarQTable(agente);
    Vistas.renderizarGrafico(historialRecompensas);
    Interseccion.actualizarEstado(ultimoEstado, ultimaAccion);

    if (entrenando && comprobarUmbral()) {
      detenerEntrenamiento();
      estadoEntrenamiento.innerHTML = `<strong>Entrenamiento completado.</strong> ${episodiosObjetivoRonda} episodios entrenados. Recompensa Media últimos 100: ${formatearNumero(calcularMediaUltimos(10))}. Pulsa <strong>Entrenar</strong> para añadir más episodios.`;
      return;
    }
  }

  // programa el siguiente episodio segun la velocidad seleccionada
  function siguientePaso() {
    if (!entrenando || pausado) return;

    ejecutarEpisodio();

    if (entrenando && !pausado) {
      const velocidad = parseInt(inputVelocidad.value, 10);
      const delay = Math.max(0, velocidad);
      timeoutId = setTimeout(siguientePaso, delay);
    }
  }

  // inicia o reanuda el entrenamiento automatico
  function iniciarEntrenamiento() {
    if (entrenando && !pausado) return;

    if (pausado) {
      pausado = false;
    } else {
      entrenando = true;
      episodiosRonda = 0;
      episodiosObjetivoRonda = Math.max(1, parseInt(inputEpisodios.value, 10) || 50);
    }

    actualizarBotonesEntrenamiento();
    sincronizarAnimacion();
    siguientePaso();
  }

  // pausa el entrenamiento automatico
  function pausarEntrenamiento() {
    pausado = true;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    actualizarBotonesEntrenamiento();
    sincronizarAnimacion();
  }

  // detiene el entrenamiento por completo
  function detenerEntrenamiento() {
    entrenando = false;
    pausado = false;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    actualizarBotonesEntrenamiento();
    sincronizarAnimacion();
  }

  // avanza un unico episodio manualmente (tambien funciona durante pausa)
  function ejecutarUnPaso() {
    if (entrenando && !pausado) return;
    if (!agente) crearAgente();
    ejecutarEpisodio();
  }

  // actualiza el estado habilitado/deshabilitado de los botones de control
  function actualizarBotonesEntrenamiento() {
    const enMarcha = entrenando && !pausado;
    btnEntrenar.textContent = pausado ? 'Reanudar' : 'Entrenar';
    btnEntrenar.disabled = enMarcha;
    btnPausar.disabled = !entrenando || pausado;
    btnPaso.disabled = enMarcha;
  }

  // marca el punto del modo activo en la navbar
  function marcarModoActivo(modo) {
    if (botonEntrenamiento) {
      botonEntrenamiento.classList.toggle('active', modo === 'entrenamiento');
    }
    if (botonComparativo) {
      botonComparativo.classList.toggle('active', modo === 'comparativo');
    }
  }

  // muestra el panel de entrenamiento
  function mostrarEntrenamiento() {
    if (typeof Comparativo !== 'undefined' && Comparativo.detener) {
      Comparativo.detener();
    }
    panelComparativo.hidden = true;
    panelEntrenamiento.hidden = false;
    marcarModoActivo('entrenamiento');
  }

  // muestra el panel comparativo
  function mostrarComparativo() {
    panelEntrenamiento.hidden = true;
    panelComparativo.hidden = false;
    marcarModoActivo('comparativo');

    if (!agente || !(agente.q instanceof Map) || agente.q.size === 0) {
      alert('Primero entrena al agente en el modo Entrenamiento para poder compararte con él.');
      mostrarEntrenamiento();
      return;
    }

    Comparativo.iniciarRonda();
  }

  // cambia entre las pestañas de visualización
  function cambiarTab(tabId) {
    tabButtons.forEach(btn => {
      const activo = btn.dataset.tab === tabId;
      btn.classList.toggle('active', activo);
      btn.setAttribute('aria-selected', activo);
    });

    tabContents.forEach(content => {
      const mostrar = content.id === `tab-${tabId}`;
      content.hidden = !mostrar;
    });

    if (tabId === 'grafico') {
      Vistas.renderizarGrafico(historialRecompensas);
    }
  }

  // event listeners del selector de modo
  if (botonEntrenamiento) {
    botonEntrenamiento.addEventListener('click', mostrarEntrenamiento);
  }

  if (botonComparativo) {
    botonComparativo.addEventListener('click', mostrarComparativo);
  }

  // event listeners de las pestañas
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
  });

  // actualiza etiquetas de hiperparametros y pausa si cambian durante entrenamiento
  [inputAlpha, inputGamma, inputEpsilon, inputEpsilonMin, inputEpsilonDecay].forEach(input => {
    input.addEventListener('input', () => {
      labelAlpha.textContent = inputAlpha.value;
      labelGamma.textContent = inputGamma.value;
      labelEpsilon.textContent = inputEpsilon.value;
      labelEpsilonMin.textContent = inputEpsilonMin.value;
      labelEpsilonDecay.textContent = inputEpsilonDecay.value;

      if (entrenando) {
        pausarEntrenamiento();
        alert('Has cambiado los hiperparametros. El entrenamiento se ha pausado. Pulsa Reiniciar todo para aplicarlos desde cero.');
      }
    });
  });

  // actualiza la etiqueta de velocidad
  inputVelocidad.addEventListener('input', () => {
    labelVelocidad.textContent = `${inputVelocidad.value} ms/paso`;
  });

  // actualiza la etiqueta de episodios objetivo
  inputEpisodios.addEventListener('input', () => {
    const valor = Math.max(10, Math.min(1000, parseInt(inputEpisodios.value, 10) || 50));
  });

  // event listeners de los botones de control
  btnEntrenar.addEventListener('click', iniciarEntrenamiento);
  btnPausar.addEventListener('click', pausarEntrenamiento);
  btnPaso.addEventListener('click', ejecutarUnPaso);
  btnReiniciar.addEventListener('click', resetearEntrenamiento);

  // inicializacion
  Vistas.inicializar('q-table-contenedor');
  Vistas.inicializarGrafico('grafico-contenedor');
  Interseccion.inicializar('interseccion-contenedor');
  Comparativo.inicializar();
  crearAgente();
  actualizarMetricasUI();
  actualizarBotonesEntrenamiento();
  mostrarEntrenamiento();
});