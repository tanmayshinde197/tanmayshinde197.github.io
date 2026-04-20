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
      // Easter egg: secret command after a pause
      setTimeout(function() {
        if (window.eggFound) window.eggFound('terminal');
        var secretLine = '\n<span class="prompt">$</span> sudo hire tanmay';
        var secretResponse = '\n<span style="color:#28c840">✓ Access granted. Welcome aboard.</span>';
        var idx = 0;
        var full = secretLine + secretResponse;
        function typeSecret() {
          if (idx < full.length) {
            // Skip HTML tags
            if (full[idx] === '<') {
              var closeIdx = full.indexOf('>', idx);
              el.innerHTML = text + full.substring(0, closeIdx + 1);
              idx = closeIdx + 1;
            } else {
              idx++;
            }
            el.innerHTML = text + full.substring(0, idx);
            setTimeout(typeSecret, idx <= secretLine.length ? 40 : 20);
          }
        }
        typeSecret();
      }, 3000);
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

// ===== Easter Egg 1: Console ASCII Art =====
(function() {
  console.log('%c' +
    ' _____                              \n' +
    '|_   _|_ _ _ __  _ __ ___   __ _ _   _ \n' +
    '  | |/ _` | \'_ \\| \'_ ` _ \\ / _` | | | |\n' +
    '  | | (_| | | | | | | | | | (_| | |_| |\n' +
    '  |_|\\__,_|_| |_|_| |_| |_|\\__,_|\\__, |\n' +
    '                                   |___/ \n',
    'color: #ff9900; font-family: monospace; font-size: 12px;'
  );
  console.log('%cHey, you\'re poking around the console? I like your style. 👀', 'color: #00d4ff; font-size: 14px;');
  console.log('%cHire me: tanmayshinde197@gmail.com', 'color: #e0e0e0; font-size: 12px;');
  console.log('%cGitHub: github.com/tanmayshinde197', 'color: #e0e0e0; font-size: 12px;');
  console.log('%c\n🥚 Psst... there are 8 easter eggs hidden on this site. Here are some hints:', 'color: #ff9900; font-size: 11px;');
  console.log('%c  1. You just found one.\n  2. Old school gamers know the code.\n  3. Click things. A lot.\n  4. Leave me. See what happens.\n  5. With great power comes great root access.\n  6. Patience pays off in the terminal.\n  7. Right-click if you dare.\n  8. Time flies when you\'re hovering.', 'color: #8888a0; font-size: 11px; font-family: monospace;');
})();

// ===== Easter Egg 2: Konami Code → Matrix Rain =====
(function() {
  var konamiSeq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  var konamiPos = 0;

  document.addEventListener('keydown', function(e) {
    if (e.key === konamiSeq[konamiPos]) {
      konamiPos++;
      if (konamiPos === konamiSeq.length) {
        konamiPos = 0;
        startMatrixRain();
        if (window.eggFound) window.eggFound('konami');
      }
    } else {
      konamiPos = 0;
    }
  });

  function startMatrixRain() {
    var c = document.createElement('canvas');
    c.id = 'matrix-rain';
    c.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;opacity:0.9;';
    document.body.appendChild(c);
    var ctx = c.getContext('2d');
    c.width = window.innerWidth;
    c.height = window.innerHeight;

    var cols = Math.floor(c.width / 16);
    var drops = [];
    for (var i = 0; i < cols; i++) drops[i] = Math.random() * -100;

    var chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789TANMAYSHINDE';

    var interval = setInterval(function() {
      ctx.fillStyle = 'rgba(10,10,15,0.05)';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#00d4ff';
      ctx.font = '14px monospace';

      for (var i = 0; i < drops.length; i++) {
        var ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = Math.random() > 0.95 ? '#ff9900' : '#00d4ff';
        ctx.fillText(ch, i * 16, drops[i] * 16);
        if (drops[i] * 16 > c.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    }, 40);

    setTimeout(function() {
      clearInterval(interval);
      c.style.transition = 'opacity 1s';
      c.style.opacity = '0';
      setTimeout(function() { c.remove(); }, 1000);
    }, 5000);
  }
})();

// ===== Easter Egg 3: Click Logo 5 Times =====
(function() {
  var logo = document.querySelector('.nav-logo');
  if (!logo) return;
  var clicks = 0;
  var timer = null;

  logo.addEventListener('click', function(e) {
    clicks++;
    clearTimeout(timer);
    timer = setTimeout(function() { clicks = 0; }, 2000);

    if (clicks >= 5) {
      clicks = 0;
      if (window.eggFound) window.eggFound('logo');
      logo.style.transition = 'transform 0.6s ease, color 0.3s';
      logo.style.transform = 'rotate(360deg) scale(1.3)';
      logo.style.color = '#00d4ff';

      var tip = document.createElement('div');
      tip.textContent = 'You found me! 🎉';
      tip.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:#12121a;color:#ff9900;padding:12px 24px;border-radius:8px;font-family:monospace;font-size:0.9rem;z-index:9999;border:1px solid #ff9900;';
      document.body.appendChild(tip);

      setTimeout(function() {
        logo.style.transform = 'rotate(0) scale(1)';
        logo.style.color = '';
      }, 800);
      setTimeout(function() { tip.remove(); }, 2500);
    }
  });
})();

// ===== Easter Egg 4: Tab Title Change =====
(function() {
  var originalTitle = document.title;
  var messages = [
    'Come back! I have more skills...',
    'Hey, where did you go? 👀',
    'Miss me yet?',
    'The terminal is lonely...',
  ];

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      document.title = messages[Math.floor(Math.random() * messages.length)];
      if (window.eggFound) window.eggFound('tab');
    } else {
      document.title = originalTitle;
    }
  });
})();

// ===== Easter Egg 5: Type "sudo" for Sparkle Trail =====
(function() {
  var buffer = '';
  var sparkleActive = false;

  document.addEventListener('keypress', function(e) {
    buffer += e.key;
    if (buffer.length > 10) buffer = buffer.slice(-10);

    if (buffer.includes('sudo') && !sparkleActive) {
      sparkleActive = true;
      buffer = '';
      if (window.eggFound) window.eggFound('sudo');

      var sparkleHandler = function(e) {
        for (var i = 0; i < 3; i++) {
          var s = document.createElement('div');
          s.textContent = ['✨','⚡','🔥','💫','⭐'][Math.floor(Math.random() * 5)];
          s.style.cssText = 'position:fixed;pointer-events:none;z-index:9999;font-size:' + (10 + Math.random() * 14) + 'px;left:' + (e.clientX + (Math.random()-0.5)*30) + 'px;top:' + (e.clientY + (Math.random()-0.5)*30) + 'px;transition:all 0.8s ease-out;opacity:1;';
          document.body.appendChild(s);
          setTimeout(function(el) {
            el.style.opacity = '0';
            el.style.transform = 'translateY(-40px) scale(0)';
          }, 10, s);
          setTimeout(function(el) { el.remove(); }, 800, s);
        }
      };

      document.addEventListener('mousemove', sparkleHandler);
      setTimeout(function() {
        document.removeEventListener('mousemove', sparkleHandler);
        sparkleActive = false;
      }, 5000);
    }
  });
})();

// ===== Easter Egg 7: Right-Click Toast =====
(function() {
  document.addEventListener('contextmenu', function(e) {
    // Don't block it, just show a toast
    if (window.eggFound) window.eggFound('rightclick');
    var toast = document.createElement('div');
    toast.textContent = 'Nice try. The source code is on GitHub anyway 😄';
    toast.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;background:#12121a;color:#ff9900;padding:10px 20px;border-radius:8px;font-family:monospace;font-size:0.8rem;z-index:9999;border:1px solid #1e1e2e;opacity:0;transition:all 0.3s ease;pointer-events:none;white-space:nowrap;transform:translate(-50%,-100%) translateY(10px);';
    document.body.appendChild(toast);

    setTimeout(function() {
      toast.style.opacity = '1';
      toast.style.transform = 'translate(-50%,-100%) translateY(0)';
    }, 10);
    setTimeout(function() {
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%,-100%) translateY(10px)';
    }, 2500);
    setTimeout(function() { toast.remove(); }, 3000);
  });
})();

// ===== Easter Egg 8: Footer Hover Shows Time on Site =====
(function() {
  var startTime = Date.now();
  var footerP = document.querySelector('.footer p');
  if (!footerP) return;
  var originalText = footerP.innerHTML;

  footerP.addEventListener('mouseenter', function() {
    if (window.eggFound) window.eggFound('footer');
    var seconds = Math.floor((Date.now() - startTime) / 1000);
    var mins = Math.floor(seconds / 60);
    var secs = seconds % 60;
    var timeStr = mins > 0 ? mins + 'm ' + secs + 's' : secs + 's';
    footerP.innerHTML = 'You\'ve been here for ' + timeStr + '. Time well spent? ⏱️';
  });

  footerP.addEventListener('mouseleave', function() {
    footerP.innerHTML = originalText;
  });
})();

// ===== Easter Egg Tracker =====
(function() {
  var found = JSON.parse(localStorage.getItem('eggs-found') || '{}');
  var total = 8;
  var toggle = document.getElementById('secretsToggle');
  var popup = document.getElementById('secretsPopup');
  var closeBtn = document.getElementById('secretsClose');
  if (!toggle || !popup) return;

  function updateCounter() {
    var count = Object.keys(found).length;
    toggle.textContent = '🥚 secrets: ' + count + '/' + total + ' found';
    // Update checkmarks
    document.querySelectorAll('.secret-check').forEach(function(el) {
      if (found[el.dataset.egg]) {
        el.textContent = '✓';
        el.classList.add('found');
      }
    });
    localStorage.setItem('eggs-found', JSON.stringify(found));
  }

  // Expose globally so each egg can call it
  window.eggFound = function(name) {
    if (!found[name]) {
      found[name] = true;
      updateCounter();
    }
  };

  // Auto-mark console as found (they opened the page, it logged)
  window.eggFound('console');

  toggle.addEventListener('click', function() {
    popup.classList.add('open');
  });

  closeBtn.addEventListener('click', function() {
    popup.classList.remove('open');
  });

  popup.addEventListener('click', function(e) {
    if (e.target === popup) popup.classList.remove('open');
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') popup.classList.remove('open');
  });

  updateCounter();
})();

// ===== Dark/Light Mode Toggle =====
(function() {
  var toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  // Check saved preference
  var saved = localStorage.getItem('theme');
  if (saved === 'light') {
    document.documentElement.classList.add('light');
    toggle.textContent = '☀️';
  }

  toggle.addEventListener('click', function() {
    var isLight = document.documentElement.classList.toggle('light');
    toggle.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
})();

// ===== Scroll to Top Button =====
(function() {
  var btn = document.getElementById('scrollTop');
  if (!btn) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
