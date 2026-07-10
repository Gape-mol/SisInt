// Widgets interactivos de apoyo educativo (fuera de la lógica del simulador)
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------
   * 1) Demo exploración vs. explotación (sección "Aprendizaje")
   * ------------------------------------------------------------- */
  (function demoExploracion() {
    const slider = document.getElementById('slider-epsilon');
    const valorEpsilon = document.getElementById('valor-epsilon');
    const barraExplorar = document.getElementById('barra-explorar');
    const barraExplotar = document.getElementById('barra-explotar');
    const btnSimular = document.getElementById('btn-simular-decision');
    const resultado = document.getElementById('resultado-decision');

    if (!slider) return; // widget no presente en esta página

    function actualizarBarra() {
      const epsilon = Number(slider.value);
      valorEpsilon.textContent = `${epsilon}%`;
      barraExplorar.style.width = `${epsilon}%`;
      barraExplotar.style.width = `${100 - epsilon}%`;
    }

    slider.addEventListener('input', actualizarBarra);
    actualizarBarra();

    btnSimular.addEventListener('click', () => {
      const epsilon = Number(slider.value);
      const tirada = Math.random() * 100;
      const explora = tirada < epsilon;

      resultado.textContent = explora
        ? '🎲 El agente exploró: probó una acción al azar, sin importar si era la que mejor conocía.'
        : '⭐ El agente explotó: eligió la acción con el valor Q más alto que ya conocía.';
      resultado.classList.remove('demo-resultado-explorar', 'demo-resultado-explotar');
      resultado.classList.add(explora ? 'demo-resultado-explorar' : 'demo-resultado-explotar');
    });
  })();

  /* ---------------------------------------------------------------
   * 2) Calculadora de la ecuación de Bellman (sección "Q-Learning")
   * ------------------------------------------------------------- */
  (function demoBellman() {
    const inputQ = document.getElementById('input-q');
    const inputAlfa = document.getElementById('input-alfa');
    const inputR = document.getElementById('input-r');
    const inputGamma = document.getElementById('input-gamma');
    const inputMaxQ = document.getElementById('input-maxq');
    const formulaSustituida = document.getElementById('formula-sustituida');
    const resultadoQ = document.getElementById('resultado-q');

    if (!inputQ) return; // widget no presente en esta página

    const inputs = [inputQ, inputAlfa, inputR, inputGamma, inputMaxQ];

    function calcular() {
      const q = parseFloat(inputQ.value) || 0;
      const alfa = parseFloat(inputAlfa.value) || 0;
      const r = parseFloat(inputR.value) || 0;
      const gamma = parseFloat(inputGamma.value) || 0;
      const maxQ = parseFloat(inputMaxQ.value) || 0;

      const objetivo = r + gamma * maxQ;
      const nuevoQ = q + alfa * (objetivo - q);

      formulaSustituida.textContent =
        `Q(s,a) ← ${q.toFixed(2)} + ${alfa.toFixed(2)} · [ ${r.toFixed(2)} + ${gamma.toFixed(2)} · ${maxQ.toFixed(2)} − ${q.toFixed(2)} ]`;

      resultadoQ.textContent = `Nuevo Q(s,a) = ${nuevoQ.toFixed(3)}`;
    }

    inputs.forEach(input => input.addEventListener('input', calcular));
    calcular();
  })();

  /* ---------------------------------------------------------------
   * 3) Mini-quiz de comprensión (sección "Caso práctico")
   * ------------------------------------------------------------- */
  (function quizComprension() {
    const preguntas = document.querySelectorAll('.quiz-pregunta');
    if (!preguntas.length) return;

    preguntas.forEach(pregunta => {
      const correcta = pregunta.dataset.correcta;
      const opciones = pregunta.querySelectorAll('.quiz-opcion');
      const feedback = pregunta.querySelector('.quiz-feedback');

      opciones.forEach(opcion => {
        opcion.addEventListener('click', () => {
          const esCorrecta = opcion.dataset.valor === correcta;

          opciones.forEach(o => { o.disabled = true; });
          opcion.classList.add(esCorrecta ? 'quiz-opcion-correcta' : 'quiz-opcion-incorrecta');

          if (!esCorrecta) {
            const botonCorrecto = Array.from(opciones).find(o => o.dataset.valor === correcta);
            if (botonCorrecto) botonCorrecto.classList.add('quiz-opcion-correcta');
          }

          feedback.textContent = esCorrecta
            ? '✅ ¡Correcto! Esa es la recompensa que recibiría el agente.'
            : `❌ No exactamente. La recompensa correcta es ${correcta}.`;
          feedback.classList.add(esCorrecta ? 'quiz-feedback-correcta' : 'quiz-feedback-incorrecta');
        });
      });
    });
  })();

  /* ---------------------------------------------------------------
   * 4) Overlay del quiz por sección (botón "?" + modal con blur)
   * ------------------------------------------------------------- */
  (function overlaysQuiz() {
    const overlays = document.querySelectorAll('.quiz-overlay');
    const botones = document.querySelectorAll('.btn-quiz-toggle');
    if (!overlays.length) return;

    // Se mueven a <body> para que el "position: fixed" cubra toda la
    // pantalla, sin quedar contenido dentro de una sección con transform.
    overlays.forEach(overlay => document.body.appendChild(overlay));

    let overlayAbierto = null;
    let disparadorActivo = null;

    function abrirOverlay(overlay, disparador) {
      overlay.classList.add('activo');
      overlayAbierto = overlay;
      disparadorActivo = disparador;

      const panel = overlay.querySelector('.quiz-overlay-panel');
      if (panel) panel.setAttribute('tabindex', '-1');
      const cerrar = overlay.querySelector('.quiz-cerrar');
      (cerrar || panel)?.focus();
    }

    function cerrarOverlay() {
      if (!overlayAbierto) return;
      overlayAbierto.classList.remove('activo');
      if (disparadorActivo) disparadorActivo.focus();
      overlayAbierto = null;
      disparadorActivo = null;
    }

    botones.forEach(boton => {
      boton.addEventListener('click', () => {
        const overlay = document.getElementById(boton.getAttribute('aria-controls'));
        if (overlay) abrirOverlay(overlay, boton);
      });
    });

    overlays.forEach(overlay => {
      overlay.querySelectorAll('[data-cerrar-quiz]').forEach(el => {
        el.addEventListener('click', cerrarOverlay);
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && overlayAbierto) {
        cerrarOverlay();
      }
    });

    // Se expone para que script.js pueda cerrar el overlay al cambiar de diapositiva
    window.cerrarQuizOverlay = cerrarOverlay;
    window.hayQuizOverlayAbierto = () => overlayAbierto !== null;
  })();

});
