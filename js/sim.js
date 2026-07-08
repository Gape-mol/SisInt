document.addEventListener('DOMContentLoaded', () => {
  // referencias del selector de modo
  const bienvenida = document.getElementById('bienvenida');
  const panelEntrenamiento = document.getElementById('modo-entrenamiento');
  const botonEntrenamiento = document.querySelector('.nav-modo[data-modo="entrenamiento"]');
  const botonComparativo = document.querySelector('.nav-modo[data-modo="comparativo"]');

  // referencias del panel de entrenamiento
  const inputAlpha = document.getElementById('alpha');
  const inputGamma = document.getElementById('gamma');
  const inputEpsilon = document.getElementById('epsilon');
  const inputVelocidad = document.getElementById('velocidad');

  const labelAlpha = document.getElementById('alpha-valor');
  const labelGamma = document.getElementById('gamma-valor');
  const labelEpsilon = document.getElementById('epsilon-valor');
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

  // constantes de configuracion del entrenamiento
  const EPISODIOS_MIN = 100;
  const EPISODIOS_MAX = 300;
  const MEDIA_UMBRAL = 1.2;
  const PASOS_POR_EPISODIO = 10;

  // estado interno del entrenamiento
  let agente = null;
  let entrenando = false;
  let pausado = false;
  let timeoutId = null;
  let episodiosCompletados = 0;
  let recompensaTotal = 0;
  let historialRecompensas = [];

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
      epsilonMin: 0.05,
      epsilonDecay: 0.95,
      acciones: EntornoTrafico.ACCIONES,
    });
  }

  // actualiza las metricas mostradas en pantalla
  function actualizarMetricasUI() {
    metricaEpisodios.textContent = episodiosCompletados;
    metricaRecompensa.textContent = recompensaTotal;
    metricaEpsilon.textContent = formatearNumero(agente ? agente.epsilon : 1);

    const media = calcularMediaUltimos(10);
    metricaMedia.textContent = media !== null ? formatearNumero(media) : '—';
  }

  // comprueba si el agente ya cumple el umbral de entrenamiento
  function comprobarUmbral() {
    const media = calcularMediaUltimos(10);
    const suficientesEpisodios = episodiosCompletados >= EPISODIOS_MIN;
    const mediaOk = media !== null && media >= MEDIA_UMBRAL;
    const techoAlcanzado = episodiosCompletados >= EPISODIOS_MAX;

    return (suficientesEpisodios && mediaOk) || techoAlcanzado;
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
    recompensaTotal = 0;
    historialRecompensas = [];
    crearAgente();
    actualizarMetricasUI();
    actualizarBotonesEntrenamiento();
    estadoEntrenamiento.innerHTML =
      'Pulsa <strong>Entrenar</strong> para empezar. Se detiene al cumplir 100 episodios con una media ≥ 1.2 en los ultimos 10 episodios, o al llegar a 300 episodios.';
  }

  // ejecuta un episodio completo de entrenamiento
  function ejecutarEpisodio() {
    if (!agente) crearAgente();

    let recompensaEpisodio = 0;
    let estado = EntornoTrafico.estadoAleatorio();

    for (let paso = 0; paso < PASOS_POR_EPISODIO; paso++) {
      const clave = EntornoTrafico.claveEstado(estado);
      const accion = agente.elegirAccion(clave);
      const recompensa = EntornoTrafico.recompensa(estado, accion);
      const siguienteEstado = EntornoTrafico.estadoAleatorio();
      const siguienteClave = EntornoTrafico.claveEstado(siguienteEstado);

      agente.actualizar(clave, accion, recompensa, siguienteClave);
      recompensaEpisodio += recompensa;
      estado = siguienteEstado;
    }

    agente.decaerEpsilon();
    episodiosCompletados++;
    recompensaTotal += recompensaEpisodio;
    historialRecompensas.push(recompensaEpisodio);
    actualizarMetricasUI();

    if (comprobarUmbral()) {
      detenerEntrenamiento();
      estadoEntrenamiento.innerHTML = `<strong>Entrenamiento completado.</strong> Media ultimos 10 episodios: ${formatearNumero(calcularMediaUltimos(10))}.`;
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
    }

    actualizarBotonesEntrenamiento();
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
  }

  // avanza un unico episodio manualmente
  function ejecutarUnPaso() {
    if (entrenando) return;
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
    bienvenida.hidden = true;
    panelEntrenamiento.hidden = false;
    marcarModoActivo('entrenamiento');
  }

  // event listeners del selector de modo
  if (botonEntrenamiento) {
    botonEntrenamiento.addEventListener('click', mostrarEntrenamiento);
  }

  // actualiza etiquetas de hiperparametros y pausa si cambian durante entrenamiento
  [inputAlpha, inputGamma, inputEpsilon].forEach(input => {
    input.addEventListener('input', () => {
      labelAlpha.textContent = inputAlpha.value;
      labelGamma.textContent = inputGamma.value;
      labelEpsilon.textContent = inputEpsilon.value;

      if (entrenando) {
        pausarEntrenamiento();
        alert('Has cambiado los hiperparametros. El entrenamiento se ha pausado. Pulsa Reiniciar agente para aplicarlos desde cero.');
      }
    });
  });

  // actualiza la etiqueta de velocidad
  inputVelocidad.addEventListener('input', () => {
    labelVelocidad.textContent = `${inputVelocidad.value} ms/paso`;
  });

  // event listeners de los botones de control
  btnEntrenar.addEventListener('click', iniciarEntrenamiento);
  btnPausar.addEventListener('click', pausarEntrenamiento);
  btnPaso.addEventListener('click', ejecutarUnPaso);
  btnReiniciar.addEventListener('click', resetearEntrenamiento);

  // inicializacion
  crearAgente();
  actualizarMetricasUI();
  actualizarBotonesEntrenamiento();
  mostrarEntrenamiento();
});