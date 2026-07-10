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

  // Muestra la diapositiva "index" y oculta el resto
  function mostrarSlide(index, { enfocar = false } = {}) {
    if (index < 0 || index >= slides.length) return;

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
    if (['ArrowRight', 'PageDown'].includes(event.key)) {
      event.preventDefault();
      irSiguiente();
    } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      irAnterior();
    }
  });

  // Navegación táctil (swipe) para dispositivos móviles
  let touchStartX = null;
  document.addEventListener('touchstart', event => {
    touchStartX = event.touches[0].clientX;
  }, { passive: true });

  document.addEventListener('touchend', event => {
    if (touchStartX === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    const UMBRAL = 50;
    if (deltaX > UMBRAL) {
      irAnterior();
    } else if (deltaX < -UMBRAL) {
      irSiguiente();
    }
    touchStartX = null;
  }, { passive: true });

  // Estado inicial: si la URL trae un ancla (#seccion), abre esa diapositiva
  const idInicial = window.location.hash.replace('#', '');
  const indiceInicial = slides.findIndex(slide => slide.id === idInicial);
  mostrarSlide(indiceInicial !== -1 ? indiceInicial : 0);
});
