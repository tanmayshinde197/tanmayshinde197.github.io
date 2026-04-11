(function() {
  'use strict';

  // ===== Canvas Setup =====
  var canvas = document.getElementById('particles');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var mouse = { x: null, y: null };
  var particles = [];
  var neuralNodes = [];

  var NEURAL_SPACING = 50;
  var NEURAL_RADIUS = 200;
  var NEURAL_CONNECT_DIST = 90;

  function initNeuralGrid() {
    neuralNodes = [];
    var pageH = Math.max(document.body.scrollHeight || 4000, 4000);
    var cols = Math.ceil(canvas.width / NEURAL_SPACING) + 1;
    var rows = Math.ceil(pageH / NEURAL_SPACING) + 1;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        neuralNodes.push({
          x: c * NEURAL_SPACING + (Math.random() - 0.5) * 18,
          y: r * NEURAL_SPACING + (Math.random() - 0.5) * 18
        });
      }
    }
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', function() {
    resizeCanvas();
    initNeuralGrid();
  });

  document.addEventListener('mousemove', function(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  document.addEventListener('mouseleave', function() {
    mouse.x = null;
    mouse.y = null;
  });

  // ===== Floating Particles =====
  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.15,
      color: Math.random() > 0.5 ? '255,153,0' : '0,212,255'
    };
  }

  var count = Math.min(80, Math.floor(window.innerWidth / 15));
  for (var i = 0; i < count; i++) particles.push(createParticle());

  function updateParticle(p) {
    p.x += p.speedX;
    p.y += p.speedY;
    if (mouse.x !== null) {
      var dx = p.x - mouse.x;
      var dy = p.y - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        var force = (120 - dist) / 120;
        p.x += (dx / dist) * force * 1.5;
        p.y += (dy / dist) * force * 1.5;
      }
    }
    if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
    if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      updateParticle(p);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + p.color + ',' + p.opacity + ')';
      ctx.fill();
    }
    // Lines between close particles
    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          var alpha = (1 - dist / 150) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = 'rgba(255,153,0,' + alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  // ===== Neural Network (hover reveal) =====
  function drawNeuralNetwork() {
    if (mouse.x === null || neuralNodes.length === 0) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var active = [];

    for (var i = 0; i < neuralNodes.length; i++) {
      var node = neuralNodes[i];
      var screenY = node.y - scrollY;
      // Skip nodes far off screen
      if (screenY < -NEURAL_RADIUS || screenY > canvas.height + NEURAL_RADIUS) continue;

      var dx = node.x - mouse.x;
      var dy = screenY - mouse.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < NEURAL_RADIUS) {
        var intensity = 1 - dist / NEURAL_RADIUS;
        active.push({ x: node.x, y: screenY, dist: dist, intensity: intensity });

        var size = 1.5 + intensity * 2.5;
        ctx.beginPath();
        ctx.arc(node.x, screenY, size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,' + (intensity * 0.7) + ')';
        ctx.fill();
      }
    }

    // Connect nearby active nodes
    for (var i = 0; i < active.length; i++) {
      for (var j = i + 1; j < active.length; j++) {
        var dx = active[i].x - active[j].x;
        var dy = active[i].y - active[j].y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < NEURAL_CONNECT_DIST) {
          var alpha = Math.min(active[i].intensity, active[j].intensity) * (1 - dist / NEURAL_CONNECT_DIST) * 0.5;
          ctx.beginPath();
          ctx.moveTo(active[i].x, active[i].y);
          ctx.lineTo(active[j].x, active[j].y);
          ctx.strokeStyle = 'rgba(0,212,255,' + alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      // Line from node to cursor
      if (active[i].dist < NEURAL_RADIUS * 0.5) {
        ctx.beginPath();
        ctx.moveTo(active[i].x, active[i].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = 'rgba(255,153,0,' + (active[i].intensity * 0.15) + ')';
        ctx.lineWidth = 0.4;
        ctx.stroke();
      }
    }

    // Glow at cursor
    var grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, NEURAL_RADIUS * 0.6);
    grad.addColorStop(0, 'rgba(0,212,255,0.04)');
    grad.addColorStop(1, 'rgba(0,212,255,0)');
    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, NEURAL_RADIUS * 0.6, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ===== Main Animation Loop =====
  function animate() {
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawParticles();
    drawNeuralNetwork();
    requestAnimationFrame(animate);
  }

  // Init neural grid after page loads (so scrollHeight is correct)
  window.addEventListener('load', function() {
    initNeuralGrid();
  });
  // Also init now with a fallback height
  initNeuralGrid();
  animate();

})();

// ===== Scroll Reveal =====
(function() {
  var els = document.querySelectorAll('.reveal');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var delay = parseInt(entry.target.getAttribute('data-delay') || '0');
        setTimeout(function() {
          entry.target.classList.add('visible');
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function(el) { observer.observe(el); });
})();

// ===== Parallax Orbs =====
(function() {
  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(function() {
        var scrollY = window.scrollY;
        var orbs = document.querySelectorAll('.orb');
        for (var i = 0; i < orbs.length; i++) {
          var speed = 0.02 + i * 0.01;
          orbs[i].style.transform = 'translateY(' + (scrollY * speed) + 'px)';
        }
        ticking = false;
      });
      ticking = true;
    }
  });
})();

// ===== Terminal Typing =====
(function() {
  var el = document.getElementById('terminal-text');
  if (!el) return;
  var lines = [
    '> Cloud Support Engineer II @ AWS, Dublin',
    '> EC2 Linux Subject Matter Expert',
    '> 2x AWS Certified',
    '  - DevOps Engineer Professional',
    '  - Solutions Architect Associate',
    '> 4+ years resolving complex cloud infra',
    '> Speciality: Linux, networking, security',
    '> Passionate about reliable cloud systems',
    '> Open to connect — let\'s build something!'
  ];
  var lineIdx = 0, charIdx = 0, text = '';

  function type() {
    if (lineIdx < lines.length) {
      if (charIdx < lines[lineIdx].length) {
        text += lines[lineIdx][charIdx];
        el.innerHTML = text + '<span class="cursor-blink">▌</span>';
        charIdx++;
        setTimeout(type, 12);
      } else {
        text += '\n';
        lineIdx++;
        charIdx = 0;
        setTimeout(type, 200);
      }
    } else {
      el.innerHTML = text;
    }
  }
  setTimeout(type, 800);
})();

// ===== Mobile Nav =====
(function() {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  toggle.addEventListener('click', function() {
    var isOpen = links.classList.toggle('open');
    toggle.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  links.querySelectorAll('a').forEach(function(a) {
    a.addEventListener('click', function() {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// ===== Active Nav on Scroll =====
(function() {
  var sections = document.querySelectorAll('.section, .hero');
  var anchors = document.querySelectorAll('.nav-links a');
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var id = entry.target.getAttribute('id');
        anchors.forEach(function(a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-70px 0px 0px 0px' });
  sections.forEach(function(s) { observer.observe(s); });
})();

// ===== Nav BG on Scroll =====
window.addEventListener('scroll', function() {
  var nav = document.getElementById('nav');
  if (nav) {
    nav.style.background = window.scrollY > 50
      ? 'rgba(10,10,15,0.95)'
      : 'rgba(10,10,15,0.85)';
  }
});

// ===== 3D Tilt Cards =====
(function() {
  var cards = document.querySelectorAll('[data-tilt]');
  cards.forEach(function(card) {
    var inner = card.querySelector('.tilt-card-inner');
    var glow = card.querySelector('.tilt-glow');
    if (!inner) return;

    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -8;
      var rotateY = ((x - centerX) / centerX) * 8;

      inner.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.02)';

      if (glow) {
        var percentX = (x / rect.width) * 100;
        var percentY = (y / rect.height) * 100;
        glow.style.setProperty('--glow-x', percentX + '%');
        glow.style.setProperty('--glow-y', percentY + '%');
      }
    });

    card.addEventListener('mouseleave', function() {
      inner.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    });
  });
})();

// ===== Skill Modal =====
(function() {
  var overlay = document.getElementById('skillModal');
  var titleEl = document.getElementById('skillModalTitle');
  var descEl = document.getElementById('skillModalDesc');
  if (!overlay) return;

  document.querySelectorAll('.skill-badge[data-skill]').forEach(function(badge) {
    badge.addEventListener('click', function() {
      titleEl.textContent = badge.getAttribute('data-skill');
      descEl.textContent = badge.getAttribute('data-desc');
      overlay.classList.add('active');
    });
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.classList.contains('skill-modal-close')) {
      overlay.classList.remove('active');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') overlay.classList.remove('active');
  });
})();

// ===== Card Glow Follow =====
(function() {
  document.querySelectorAll('[data-glow]').forEach(function(card) {
    var glow = card.querySelector('.card-glow');
    if (!glow) return;

    card.addEventListener('mousemove', function(e) {
      var rect = card.getBoundingClientRect();
      var x = ((e.clientX - rect.left) / rect.width) * 100;
      var y = ((e.clientY - rect.top) / rect.height) * 100;
      glow.style.setProperty('--glow-x', x + '%');
      glow.style.setProperty('--glow-y', y + '%');
    });
  });
})();
