// Navegación lateral con scroll-spy
document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('#navbar .nav-link');

  // Filtra solo los enlaces internos de ancla
  const anchorLinks = Array.from(navLinks).filter(link =>
    link.getAttribute('href').startsWith('#')
  );

  // Secciones vinculadas a esos enlaces
  const sections = anchorLinks
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  // Marca como activo el punto correspondiente a una sección
  function setActiveLink(id) {
    if (!id) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

  // Determina qué sección está visible en la zona central de la pantalla
  function updateActiveLink() {
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;

    if (scrollY < 50) {
      setActiveLink(sections[0]?.id);
      return;
    }

    if (scrollY + viewportHeight >= docHeight - 50) {
      setActiveLink(sections[sections.length - 1]?.id);
      return;
    }

    const marker = scrollY + viewportHeight * 0.35;
    let activeId = sections[0]?.id;

    for (const section of sections) {
      if (section.offsetTop <= marker) {
        activeId = section.id;
      }
    }

    setActiveLink(activeId);
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', updateActiveLink, { passive: true });
  updateActiveLink();

  // Desplazamiento suave al hacer clic en un enlace interno
  anchorLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
