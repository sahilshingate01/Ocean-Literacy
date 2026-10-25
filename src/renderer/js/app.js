/**
 * Main Application Orchestrator
 * Manages view routing, ambient canvas particle system, search modal, and IPC integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Subsystems
  initAmbientCanvas();
  if (typeof AuthModal !== 'undefined' && AuthModal.init) {
    AuthModal.init();
  }
  if (typeof GameModule !== 'undefined' && GameModule.init) {
    GameModule.init();
  }
  if (typeof AdminModule !== 'undefined' && AdminModule.init) {
    AdminModule.init();
  }
  PrinciplesModule.init();
  DepthModule.init();
  MarineModule.init();
  ClimateModule.init();
  ConservationModule.init();
  QuizModule.init();
  AboutModule.init();

  // 2. Navigation Routing
  const navItems = document.querySelectorAll('.nav-item');
  const viewPanels = document.querySelectorAll('.view-panel');

  function navigateTo(viewId) {
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewId);
    });

    viewPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `view-${viewId}`);
    });

    // Reset scroll
    const appMain = document.getElementById('appMain');
    if (appMain) appMain.scrollTop = 0;
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewId = item.dataset.view;
      if (viewId) navigateTo(viewId);
    });
  });

  // Listen for native menu navigation via IPC bridge
  if (window.oceanAPI && window.oceanAPI.onNavigate) {
    window.oceanAPI.onNavigate((viewId) => {
      navigateTo(viewId);
    });
  }

  // 3. Audio Atmosphere Toggle
  const btnSoundscape = document.getElementById('btnSoundscape');
  if (btnSoundscape) {
    btnSoundscape.addEventListener('click', () => {
      const isPlaying = Soundscape.toggle();
      btnSoundscape.classList.toggle('active', isPlaying);
    });
  }

  // 4. Quick Search Modal (Cmd/Ctrl + K)
  const searchModal = document.getElementById('searchModal');
  const btnSearchTrigger = document.getElementById('btnSearchTrigger');
  const btnCloseSearch = document.getElementById('btnCloseSearch');
  const searchInput = document.getElementById('globalSearchInput');
  const searchResultsList = document.getElementById('searchResultsList');

  function openSearch() {
    if (searchModal) {
      searchModal.hidden = false;
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        renderSearchResults('');
      }
    }
  }

  function closeSearch() {
    if (searchModal) searchModal.hidden = true;
  }

  if (btnSearchTrigger) btnSearchTrigger.addEventListener('click', openSearch);
  if (btnCloseSearch) btnCloseSearch.addEventListener('click', closeSearch);

  if (searchModal) {
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) closeSearch();
    });
  }

  function renderSearchResults(query) {
    if (!searchResultsList) return;
    const q = query.toLowerCase().trim();

    const matches = [];

    // Search simulation scenarios
    if (window.OCEAN_GAME_DATA && Array.isArray(window.OCEAN_GAME_DATA.SCENARIOS)) {
      window.OCEAN_GAME_DATA.SCENARIOS.forEach(s => {
        if (!q || s.title.toLowerCase().includes(q) || s.region.toLowerCase().includes(q) || s.serviceLabel.toLowerCase().includes(q)) {
          matches.push({ type: 'Mission', title: `Mission: ${s.title} (${s.region})`, action: () => {
            navigateTo('missions');
            if (typeof GameModule !== 'undefined' && GameModule.launchMission) {
              GameModule.launchMission(s.id);
            }
          }});
        }
      });
    }

    // Search simulation roles
    if (window.OCEAN_GAME_DATA && Array.isArray(window.OCEAN_GAME_DATA.ROLES)) {
      window.OCEAN_GAME_DATA.ROLES.forEach(r => {
        if (!q || r.title.toLowerCase().includes(q) || r.shortDesc.toLowerCase().includes(q)) {
          matches.push({ type: 'Role', title: `Ocean Role: ${r.title} (${r.category})`, action: () => {
            navigateTo('missions');
            if (typeof GameModule !== 'undefined' && GameModule.setActiveRole) {
              GameModule.setActiveRole(r.id);
            }
          }});
        }
      });
    }

    // Search principles
    if (Array.isArray(window.OCEAN_PRINCIPLES)) {
      window.OCEAN_PRINCIPLES.forEach(p => {
        if (!q || p.title.toLowerCase().includes(q) || p.shortDesc.toLowerCase().includes(q)) {
          matches.push({ type: 'Principle', title: `Principle 0${p.number}: ${p.title}`, action: () => {
            navigateTo('principles');
            PrinciplesModule.openPrincipleDetail(p.id);
          }});
        }
      });
    }

    // Search depth zones
    window.OCEAN_DEPTH_ZONES.forEach(z => {
      if (!q || z.name.toLowerCase().includes(q) || z.summary.toLowerCase().includes(q)) {
        matches.push({ type: 'Depth Zone', title: z.name, action: () => {
          navigateTo('depth');
          DepthModule.jumpToDepth((z.minDepth + z.maxDepth) / 2);
        }});
      }
    });

    // Search marine life
    window.MARINE_SPECIES.forEach(s => {
      if (!q || s.commonName.toLowerCase().includes(q) || s.scientificName.toLowerCase().includes(q)) {
        matches.push({ type: 'Specimen', title: `${s.commonName} (${s.scientificName})`, action: () => {
          navigateTo('marine');
          MarineModule.openSpecimenDetail(s.id);
        }});
      }
    });

    searchResultsList.innerHTML = matches.slice(0, 8).map((m, idx) => `
      <div class="search-result-item" data-match-index="${idx}">
        <span class="search-item-type">${m.type}</span>
        <span class="search-item-title">${m.title}</span>
      </div>
    `).join('');

    searchResultsList.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.matchIndex, 10);
        if (matches[idx]) {
          matches[idx].action();
          closeSearch();
        }
      });
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  // 5. Drawer Controller
  const detailDrawer = document.getElementById('detailDrawer');
  const btnCloseDrawer = document.getElementById('btnCloseDrawer');

  function closeDrawer() {
    if (detailDrawer) detailDrawer.hidden = true;
  }

  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeDrawer);
  if (detailDrawer) {
    detailDrawer.addEventListener('click', (e) => {
      if (e.target === detailDrawer) closeDrawer();
    });
  }

  // 6. Global Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape') {
      closeSearch();
      closeDrawer();
    }
  });

  // 7. Status Bar Quick Action
  const btnQuickExport = document.getElementById('btnQuickExport');
  if (btnQuickExport) {
    btnQuickExport.addEventListener('click', () => {
      navigateTo('quiz');
      QuizModule.isFinished = true;
      QuizModule.render();
    });
  }

  // Display native platform in status bar if available
  if (window.oceanAPI && window.oceanAPI.getAppInfo) {
    window.oceanAPI.getAppInfo().then(info => {
      const platLabel = document.getElementById('desktopPlatformLabel');
      if (platLabel && info.platform) {
        platLabel.textContent = `Electron v${info.electronVersion} • ${info.platform.toUpperCase()}`;
      }
    }).catch(() => {});
  }
});

// High-Performance Ambient Bioluminescent Particles System (Warm Ivory, Coral Orange & Deep Blue)
function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener('resize', resize);

  // Theme palettes: Warm Ivory (#E6D5BD), Coral Orange (#EF8557), Deep Blue (#226192)
  const particleColors = [
    { r: 239, g: 133, b: 87 },  // Coral Orange
    { r: 230, g: 213, b: 189 }, // Warm Ivory
    { r: 34, g: 97, b: 146 },   // Deep Blue
    { r: 247, g: 160, b: 120 }, // Light Coral
    { r: 245, g: 238, b: 228 }  // Pearlescent Ivory
  ];

  const count = 38;
  const particles = [];

  for (let i = 0; i < count; i++) {
    const col = particleColors[i % particleColors.length];
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.8,
      speedY: -(Math.random() * 0.35 + 0.08), // Gentle oceanic marine snow drift
      speedX: (Math.random() - 0.5) * 0.18,
      opacity: Math.random() * 0.45 + 0.2,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.015 + 0.008,
      color: col
    });
  }

  let animationFrameId = null;

  function render() {
    if (document.hidden) {
      animationFrameId = requestAnimationFrame(render);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.y += p.speedY;
      p.x += p.speedX;
      p.pulse += p.pulseSpeed;

      // Wrap around screen boundaries with graceful margins
      if (p.y < -12) p.y = height + 12;
      if (p.x < -12) p.x = width + 12;
      if (p.x > width + 12) p.x = -12;

      const alpha = Math.max(0.04, Math.min(0.65, p.opacity + Math.sin(p.pulse) * 0.22));
      const outerR = p.radius * 2.6;

      // High-performance soft glow gradient without expensive ctx.shadowBlur
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, outerR);
      grad.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha})`);
      grad.addColorStop(0.5, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${alpha * 0.45})`);
      grad.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`);

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, outerR, 0, Math.PI * 2);
      ctx.fill();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  render();
}
