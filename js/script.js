// Navegación tipo "presentación": cada <section> de <main> es una diapositiva
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('#navbar .nav-link');

  // Enlaces internos (diapositivas) vs enlaces externos (ej. Simulador)
  const anchorLinks = Array.from(navLinks).filter(link =>
    link.getAttribute('href').startsWith('#')
  );

  // Diapositivas en el orden en que aparecen en el documento
  const slides = Array.from(document.querySelectorAll('main > section'));

  const btnPrev = document.getElementById('btn-slide-prev');
  const btnNext = document.getElementById('btn-slide-next');
  const contador = document.getElementById('slide-contador');

  let indiceActual = 0;

  // Marca como activo el punto del nav correspondiente a una diapositiva
  function setActiveLink(id) {
    if (!id) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

  const btnQuizGlobal = document.getElementById('btn-quiz-global');

  // Muestra la diapositiva "index" y oculta el resto
  function mostrarSlide(index, { enfocar = false } = {}) {
    if (index < 0 || index >= slides.length) return;

    if (typeof window.cerrarQuizOverlay === 'function') {
      window.cerrarQuizOverlay();
    }

    slides.forEach((slide, i) => {
      slide.classList.toggle('slide-activa', i === index);
    });

    indiceActual = index;
    setActiveLink(slides[index].id);

    if (contador) {
      contador.textContent = `${index + 1} / ${slides.length}`;
    }
    if (btnPrev) btnPrev.disabled = index === 0;
    if (btnNext) btnNext.disabled = index === slides.length - 1;

    // Cada diapositiva puede tener contenido más largo que la pantalla
    slides[index].scrollTop = 0;

    // El botón "?" apunta al quiz de la diapositiva activa (si tiene uno)
    if (btnQuizGlobal) {
      const idQuiz = `quiz-modal-${slides[index].id}`;
      const tieneQuiz = document.getElementById(idQuiz) !== null;
      if (tieneQuiz) {
        btnQuizGlobal.setAttribute('aria-controls', idQuiz);
        btnQuizGlobal.hidden = false;
      } else {
        btnQuizGlobal.removeAttribute('aria-controls');
        btnQuizGlobal.hidden = true;
      }
    }

    if (enfocar) {
      slides[index].setAttribute('tabindex', '-1');
      slides[index].focus({ preventScroll: true });
    }
  }

  function irSiguiente() {
    mostrarSlide(indiceActual + 1, { enfocar: true });
  }

  function irAnterior() {
    mostrarSlide(indiceActual - 1, { enfocar: true });
  }

  // Clic en los puntos del nav -> salta directo a esa diapositiva
  anchorLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const index = slides.findIndex(slide => slide.id === id);
      if (index !== -1) mostrarSlide(index, { enfocar: true });
    });
  });

  // Botones Anterior / Siguiente
  if (btnPrev) btnPrev.addEventListener('click', irAnterior);
  if (btnNext) btnNext.addEventListener('click', irSiguiente);

  // Navegación por teclado (flechas y Av Pág / Re Pág)
  document.addEventListener('keydown', event => {
    if (typeof window.hayQuizOverlayAbierto === 'function' && window.hayQuizOverlayAbierto()) {
      return; // el overlay del quiz maneja su propio teclado (Escape)
    }
    if (['ArrowRight', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      irSiguiente();
    } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      irAnterior();
    }
  });

  // swipe para dispositivos moviles
  let touchStartX = null;
  let touchStartY = null;
  let esSwipeHorizontal = false;

  document.addEventListener('touchstart', event => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
    esSwipeHorizontal = false;
  }, { passive: true });

  // Si el gesto es claramente horizontal, evitamos que el navegador lo
  // interprete como scroll de la página o como su gesto nativo de
  // "volver atrás" (swipe desde el borde), que cancelaría el touchend
  // antes de que nuestro código llegue a ejecutarse.
  document.addEventListener('touchmove', event => {
    if (touchStartX === null || touchStartY === null) return;
    const deltaX = event.touches[0].clientX - touchStartX;
    const deltaY = event.touches[0].clientY - touchStartY;

    if (!esSwipeHorizontal && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      esSwipeHorizontal = true;
    }
    if (esSwipeHorizontal && event.cancelable) {
      event.preventDefault();
    }
  }, { passive: false });

  function resetToqueEnCurso() {
    touchStartX = null;
    touchStartY = null;
    esSwipeHorizontal = false;
  }

  document.addEventListener('touchend', event => {
    if (touchStartX === null) return;
    if (typeof window.hayQuizOverlayAbierto === 'function' && window.hayQuizOverlayAbierto()) {
      resetToqueEnCurso();
      return;
    }
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const UMBRAL = 50;
    if (deltaX > UMBRAL) {
      irAnterior();
    } else if (deltaX < -UMBRAL) {
      irSiguiente();
    }
    resetToqueEnCurso();
  }, { passive: true });

  // Si el navegador cancela el toque (p. ej. porque decidió hacer un
  // gesto propio), dejamos el estado limpio para el próximo swipe.
  document.addEventListener('touchcancel', resetToqueEnCurso, { passive: true });

  // Estado inicial: si la URL trae un ancla (#seccion), abre esa diapositiva
  const idInicial = window.location.hash.replace('#', '');
  const indiceInicial = slides.findIndex(slide => slide.id === idInicial);
  mostrarSlide(indiceInicial !== -1 ? indiceInicial : 0);
});
