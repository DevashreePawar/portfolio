/* ================================================================
   NAV — scroll state + mobile toggle
================================================================ */
const navbar = document.getElementById('navbar');
const toggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

toggle.addEventListener('click', () => {
  const open = toggle.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  navLinks.classList.toggle('open', open);
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  });
});

document.addEventListener('click', e => {
  if (!navbar.contains(e.target)) {
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
  }
});

/* ================================================================
   SCROLL REVEAL
================================================================ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ================================================================
   PROJECT FILTERING
================================================================ */
const filterBtns = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const filter = btn.dataset.filter;

    /* Update button state */
    filterBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');

    /* Show/hide cards */
    projectCards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      if (match) {
        card.classList.remove('hidden');
        /* Re-trigger reveal animation */
        card.classList.remove('in-view');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => card.classList.add('in-view'));
        });
      } else {
        card.classList.add('hidden');
      }
    });
  });
});

/* ================================================================
   SMOOTH SCROLL (polyfill for scroll-behavior)
================================================================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h')
    ) || 70;
    const top = target.getBoundingClientRect().top + window.scrollY - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ================================================================
   ACTIVE NAV LINK HIGHLIGHT
================================================================ */
const sections = document.querySelectorAll('section[id], footer[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      navAnchors.forEach(a => {
        const active = a.getAttribute('href') === `#${id}`;
        a.style.color = active ? 'var(--text)' : '';
      });
    }
  });
}, { threshold: 0.45 });

sections.forEach(s => sectionObserver.observe(s));

/* ================================================================
   SKILL FILTER — click skill → scroll to usage in Projects + Experience
================================================================ */
const skillSpans = document.querySelectorAll('.skill-tags span[data-skill]');
const timelineItems = document.querySelectorAll('.timeline-item');
let activeSkill = null;

/* Floating chip to clear the active skill filter */
const skillChip = document.createElement('div');
skillChip.className = 'skill-filter-chip';
skillChip.innerHTML = '<span class="skill-chip-label"></span><button class="skill-chip-clear" aria-label="Clear skill filter">×</button>';
skillChip.hidden = true;
document.body.appendChild(skillChip);

function resetSkillFilter() {
  activeSkill = null;
  skillSpans.forEach(s => s.classList.remove('skill-active'));
  projectCards.forEach(card => {
    card.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('in-view')));
  });
  timelineItems.forEach(t => t.classList.remove('skill-dim'));
  filterBtns.forEach(b => {
    const isAll = b.dataset.filter === 'all';
    b.classList.toggle('active', isAll);
    b.setAttribute('aria-selected', isAll ? 'true' : 'false');
  });
  skillChip.hidden = true;
}

skillChip.querySelector('.skill-chip-clear').addEventListener('click', resetSkillFilter);

skillSpans.forEach(span => {
  span.addEventListener('click', () => {
    const skill = span.dataset.skill;
    if (activeSkill === skill) { resetSkillFilter(); return; }

    activeSkill = skill;

    /* Highlight the clicked skill tag */
    skillSpans.forEach(s => s.classList.toggle('skill-active', s.dataset.skill === skill));

    /* Filter project cards — hide non-matching, show matching */
    projectCards.forEach(card => {
      const matches = (card.dataset.skills || '').split(',').includes(skill);
      if (matches) {
        card.classList.remove('hidden');
        card.classList.remove('in-view');
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('in-view')));
      } else {
        card.classList.add('hidden');
      }
    });

    /* Dim non-matching experience items */
    timelineItems.forEach(item => {
      const matches = (item.dataset.skills || '').split(',').includes(skill);
      item.classList.toggle('skill-dim', !matches);
    });

    /* Reset category filter buttons to All */
    filterBtns.forEach(b => {
      const isAll = b.dataset.filter === 'all';
      b.classList.toggle('active', isAll);
      b.setAttribute('aria-selected', isAll ? 'true' : 'false');
    });

    /* Show dismissible chip */
    skillChip.querySelector('.skill-chip-label').textContent = span.textContent.trim();
    skillChip.hidden = false;

    /* Scroll to projects section */
    const target = document.getElementById('projects');
    const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 70;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH, behavior: 'smooth' });
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && activeSkill) resetSkillFilter();
});

/* ================================================================
   LEFT COLUMN CAROUSEL
================================================================ */
const leftSlides = document.querySelectorAll('.left-slide');
const lcDots    = document.querySelectorAll('.lc-dot');
let lcCurrent   = 0;

function lcGoTo(idx) {
  const prev = lcCurrent;
  lcCurrent = (idx + leftSlides.length) % leftSlides.length;
  if (prev === lcCurrent) return;

  leftSlides[prev].classList.add('exit');
  leftSlides[prev].addEventListener('animationend', () => {
    leftSlides[prev].classList.remove('active', 'exit');
  }, { once: true });

  leftSlides[lcCurrent].classList.add('active');

  lcDots.forEach((d, i) => d.classList.toggle('active', i === lcCurrent));
}

lcDots.forEach((dot, i) => dot.addEventListener('click', () => lcGoTo(i)));

/* Auto-advance every 4 s, pause on hover */
const lcEl = document.getElementById('about-left-carousel');
let lcTimer = setInterval(() => lcGoTo(lcCurrent + 1), 4000);
lcEl.addEventListener('mouseenter', () => clearInterval(lcTimer));
lcEl.addEventListener('mouseleave', () => {
  lcTimer = setInterval(() => lcGoTo(lcCurrent + 1), 4000);
});

