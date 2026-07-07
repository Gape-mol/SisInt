document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('#navbar .nav-link');

  const anchorLinks = Array.from(navLinks).filter(link =>
    link.getAttribute('href').startsWith('#')
  );

  const sections = anchorLinks
    .map(link => document.getElementById(link.getAttribute('href').slice(1)))
    .filter(Boolean);

  function setActiveLink(id) {
    if (!id) return;
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

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

  anchorLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
