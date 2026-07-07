document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('#navbar .nav-link');
  const linkById = new Map(
    Array.from(navLinks).map(link => [link.getAttribute('href').slice(1), link])
  );
  const sections = Array.from(linkById.keys())
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function setActiveLink(id) {
    if (!id) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  window.addEventListener('resize', updateActiveLink, { passive: true });
  updateActiveLink();

  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
