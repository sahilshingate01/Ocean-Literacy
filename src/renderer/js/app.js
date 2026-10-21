/**
 * Main Application Orchestrator
 * Manages view routing, ambient canvas particle system, search modal, and IPC integration.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Subsystems
  initAmbientCanvas();
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

    // Search principles
    window.OCEAN_PRINCIPLES.forEach(p => {
      if (!q || p.title.toLowerCase().includes(q) || p.shortDesc.toLowerCase().includes(q)) {
        matches.push({ type: 'Principle', title: `Principle 0${p.number}: ${p.title}`, action: () => {
          navigateTo('principles');
          PrinciplesModule.openPrincipleDetail(p.id);
        }});
      }
    });

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

// Ambient Floating Bioluminescent Particles Canvas
function initAmbientCanvas() {
  const canvas = document.getElementById('ambientCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const count = 35;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.5 + 0.8,
      speedY: -(Math.random() * 0.4 + 0.1), // gently floating upward like ocean marine snow
      speedX: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.5 + 0.2,
      pulse: Math.random() * Math.PI
    });
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.pulse += 0.02;

      // Wrap around screen boundaries
      if (p.y < -10) p.y = height + 10;
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      const alpha = p.opacity + Math.sin(p.pulse) * 0.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 242, 254, ${Math.max(0.05, alpha)})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00F2FE';
      ctx.fill();
    });

    requestAnimationFrame(loop);
  }

  loop();
}
