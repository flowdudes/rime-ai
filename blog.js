gsap.timeline()
  .set('[data-anim]', { opacity: 1 })
  .from('.blog_top > *', {
    opacity: 0,
    y: 20,
    duration: 1.2,
    stagger: 0.1,
    ease: 'power4.out'
  })
  .from('.blog_img-wrap', {
    opacity: 0,
    scale: 0.9,
    y: 20,
    duration: 1.2,
    stagger: 0.1,
    ease: 'power4.out'
  }, '<0.2')

document.querySelectorAll(".resources_circle").forEach((el) => {
  const words = el.textContent
    .trim()
    .split(/[\s\-_]+/)
    .filter(Boolean);

  const initials =
    words.length > 1 ?
    words.slice(0, 2).map((w) => w[0]).join("") :
    words[0].slice(0, 2);

  el.textContent = initials.toUpperCase();
});

(function initBlogInfoRandomColor() {
  if (window.__blogInfoRandomColorInit) return;
  window.__blogInfoRandomColorInit = true;

  const cssVar = (name, fallback = '') => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };

  const colors = [
    cssVar('--dot-yellow', cssVar('--base-color-brand--yellow', '#FFD46F')),
    cssVar('--dot-pink', cssVar('--base-color-brand--pink-light', '#FFA0FF')),
    cssVar('--dot-blue', cssVar('--base-color-brand--aqua', '#2CC3E9')),
  ];

  document.querySelectorAll('.blog_info').forEach(info => {
    if (info.dataset.blogColorInit) return;
    info.dataset.blogColorInit = 'true';

    const color = colors[(Math.random() * colors.length) | 0];

    info.style.setProperty('--blog-accent', color);

    const dot = info.querySelector('.resources_dot');
    const circle = info.querySelector('.resources_circle');

    if (dot) dot.style.backgroundColor = color;
    if (circle) circle.style.backgroundColor = color;
  });
})();
