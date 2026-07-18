const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-navigation');

if (menuButton && navigation) {
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };

  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    navigation.classList.toggle('is-open', !isOpen);
  });

  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 769px)').matches) closeMenu();
  });
}

const contactMenu = document.querySelector('[data-contact-menu]');

if (contactMenu) {
  const contactButton = contactMenu.querySelector('.header-action');
  const contactPopover = contactMenu.querySelector('.contact-popover');

  const setContactOpen = (isOpen, returnFocus = false) => {
    contactButton.setAttribute('aria-expanded', String(isOpen));
    contactPopover.hidden = !isOpen;
    if (!isOpen && returnFocus) contactButton.focus();
  };

  contactButton.addEventListener('click', () => {
    setContactOpen(contactButton.getAttribute('aria-expanded') !== 'true');
  });

  contactPopover.addEventListener('click', (event) => {
    if (event.target.closest('a')) setContactOpen(false);
  });

  menuButton?.addEventListener('click', () => {
    if (menuButton.getAttribute('aria-expanded') === 'false') setContactOpen(false);
  });

  document.addEventListener('click', (event) => {
    if (!contactMenu.contains(event.target)) setContactOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && contactButton.getAttribute('aria-expanded') === 'true') {
      setContactOpen(false, true);
    }
  });

  window.addEventListener('resize', () => setContactOpen(false));
}

document.querySelectorAll('.email-analysis summary, .automation-disclosures summary, .lifecycle-email-card summary').forEach((summary) => {
  summary.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      summary.parentElement.open = !summary.parentElement.open;
    }
  });
});

const previewState = {
  viewport: 'desktop',
  appearance: 'light',
};

const previewButtons = [...document.querySelectorAll('[data-preview-control]')];
const previewStages = [...document.querySelectorAll('.email-frame-stage')];
const emailFrames = [...document.querySelectorAll('[data-email-frame]')];

const applyEmailPreviewState = () => {
  previewButtons.forEach((button) => {
    const control = button.dataset.previewControl;
    const isPressed = button.dataset.previewValue === previewState[control];
    button.setAttribute('aria-pressed', String(isPressed));
  });

  previewStages.forEach((stage) => {
    stage.dataset.previewViewport = previewState.viewport;
    stage.dataset.previewAppearance = previewState.appearance;
  });

  emailFrames.forEach((frame) => {
    const currentSource = frame.getAttribute('src') || 'email-01.html';
    const baseSource = frame.dataset.previewBaseSource || currentSource.split('?')[0];
    const expandedView = frame.dataset.previewExpanded === 'true' ? '&view=expanded' : '';
    const themedSource = `${baseSource}?theme=${previewState.appearance}${expandedView}`;
    frame.dataset.previewBaseSource = baseSource;

    if (currentSource !== themedSource) {
      frame.setAttribute('src', themedSource);
      return;
    }

    if (frame.contentDocument?.documentElement) {
      frame.contentDocument.documentElement.dataset.previewTheme = previewState.appearance;
      if (frame.contentDocument.body) frame.contentDocument.body.dataset.previewTheme = previewState.appearance;
    }
  });
};

if (previewButtons.length || previewStages.length || emailFrames.length) {
  previewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      previewState[button.dataset.previewControl] = button.dataset.previewValue;
      applyEmailPreviewState();
    });
  });

  emailFrames.forEach((frame) => {
    frame.addEventListener('load', applyEmailPreviewState);
  });

  applyEmailPreviewState();
}

const emailDialog = document.querySelector('[data-email-dialog]');
const openEmailDialogButton = document.querySelector('[data-open-email-dialog]');
const closeEmailDialogButton = document.querySelector('[data-close-email-dialog]');

if (emailDialog && openEmailDialogButton && closeEmailDialogButton) {
  let dialogReturnFocus = null;

  openEmailDialogButton.addEventListener('click', () => {
    dialogReturnFocus = document.activeElement;
    emailDialog.showModal();
    document.body.classList.add('dialog-open');
    applyEmailPreviewState();
    closeEmailDialogButton.focus();
  });

  closeEmailDialogButton.addEventListener('click', () => emailDialog.close());

  emailDialog.addEventListener('close', () => {
    document.body.classList.remove('dialog-open');
    dialogReturnFocus?.focus();
  });

  emailDialog.addEventListener('click', (event) => {
    if (event.target === emailDialog) emailDialog.close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && emailDialog.open) emailDialog.close();
  });
}

const automationMap = document.querySelector('.automation-map');
const automationSvg = automationMap?.querySelector('.automation-connectors');

if (automationMap && automationSvg) {
  const svgNamespace = 'http://www.w3.org/2000/svg';
  const flowNode = (id) => automationMap.querySelector(`[data-flow-id="${id}"]`);
  let connectorFrame = 0;

  const drawAutomationConnectors = () => {
    const mapRect = automationMap.getBoundingClientRect();
    if (!mapRect.width || !mapRect.height) return;

    automationSvg.setAttribute('viewBox', `0 0 ${mapRect.width} ${mapRect.height}`);
    automationSvg.replaceChildren();

    const definitions = document.createElementNS(svgNamespace, 'defs');
    const marker = document.createElementNS(svgNamespace, 'marker');
    marker.setAttribute('id', 'automation-arrow');
    marker.setAttribute('viewBox', '0 0 8 8');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '4');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto');
    const arrow = document.createElementNS(svgNamespace, 'path');
    arrow.setAttribute('d', 'M 0 0 L 8 4 L 0 8');
    marker.append(arrow);
    definitions.append(marker);
    automationSvg.append(definitions);

    const bounds = (id) => {
      const element = flowNode(id);
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top - mapRect.top,
        right: rect.right - mapRect.left,
        bottom: rect.bottom - mapRect.top,
        left: rect.left - mapRect.left,
        width: rect.width,
        height: rect.height,
        centerX: rect.left - mapRect.left + rect.width / 2,
        centerY: rect.top - mapRect.top + rect.height / 2,
      };
    };

    const addPath = (route, hasArrow = true) => {
      const path = document.createElementNS(svgNamespace, 'path');
      path.setAttribute('d', route);
      if (hasArrow) path.setAttribute('marker-end', 'url(#automation-arrow)');
      automationSvg.append(path);
    };

    const directHorizontal = (sourceId, targetId) => {
      const source = bounds(sourceId);
      const target = bounds(targetId);
      if (!source || !target) return;
      const middleX = source.right + (target.left - source.right) / 2;
      addPath(`M ${source.right} ${source.centerY} H ${middleX} V ${target.centerY} H ${target.left}`);
    };

    const directVertical = (sourceId, targetId) => {
      const source = bounds(sourceId);
      const target = bounds(targetId);
      if (!source || !target) return;
      const middleY = source.bottom + (target.top - source.bottom) / 2;
      addPath(`M ${source.centerX} ${source.bottom} V ${middleY} H ${target.centerX} V ${target.top}`);
    };

    const branchDesktop = (sourceId, targetIds) => {
      const source = bounds(sourceId);
      const targets = targetIds.map(bounds).filter(Boolean);
      if (!source || !targets.length) return;
      const targetTop = Math.min(...targets.map((target) => target.top));
      const junctionY = source.bottom + (targetTop - source.bottom) / 2;
      const targetCenters = targets.map((target) => target.left + Math.min(12, target.width * 0.12));
      addPath(`M ${source.centerX} ${source.bottom} V ${junctionY}`, false);
      addPath(`M ${Math.min(source.centerX, ...targetCenters)} ${junctionY} H ${Math.max(source.centerX, ...targetCenters)}`, false);
      targets.forEach((target, index) => addPath(`M ${targetCenters[index]} ${junctionY} V ${target.top}`));
    };

    const mergeDesktop = (sourceIds, targetId) => {
      const sources = sourceIds.map(bounds).filter(Boolean);
      const target = bounds(targetId);
      if (!sources.length || !target) return;
      const sourceBottom = Math.max(...sources.map((source) => source.bottom));
      const junctionY = sourceBottom + (target.top - sourceBottom) / 2;
      const sourceCenters = sources.map((source) => source.centerX);
      sources.forEach((source) => addPath(`M ${source.centerX} ${source.bottom} V ${junctionY}`, false));
      addPath(`M ${Math.min(target.centerX, ...sourceCenters)} ${junctionY} H ${Math.max(target.centerX, ...sourceCenters)}`, false);
      addPath(`M ${target.centerX} ${junctionY} V ${target.top}`);
    };

    const mobileRoute = (sourceId, targetId, railOffset = 0, hasArrow = true) => {
      const source = bounds(sourceId);
      const target = bounds(targetId);
      if (!source || !target) return;
      const railX = Math.max(8, Math.min(source.left, target.left) - 12 - railOffset * 6);
      const leaveY = Math.min(source.bottom + 12, target.centerY);
      addPath(`M ${source.centerX} ${source.bottom} V ${leaveY} H ${railX} V ${target.centerY} H ${target.left}`, hasArrow);
    };

    const mergeMobile = (sourceIds, targetId) => {
      const sources = sourceIds.map(bounds).filter(Boolean);
      const target = bounds(targetId);
      if (!sources.length || !target) return;
      const mergeX = Math.max(8, target.left - 10);
      sources.forEach((source, index) => {
        const railX = Math.max(8, Math.min(source.left, target.left) - 16 - index * 6);
        addPath(`M ${source.centerX} ${source.bottom} V ${source.bottom + 12} H ${railX} V ${target.centerY} H ${mergeX}`, false);
      });
      addPath(`M ${mergeX} ${target.centerY} H ${target.left}`);
    };

    const isNarrow = window.matchMedia('(max-width: 52rem)').matches;

    if (isNarrow) {
      directVertical('email-1', 'wait-48');
      directVertical('wait-48', 'decision-completed-1');
      mobileRoute('decision-completed-1', 'activated-1', 0);
      mobileRoute('decision-completed-1', 'activity-after-email-1', 1);
      mobileRoute('activity-after-email-1', 'email-2a', 0);
      mobileRoute('activity-after-email-1', 'email-2b', 1);
      mergeMobile(['email-2a', 'email-2b'], 'wait-72');
      directVertical('wait-72', 'decision-next');
      mobileRoute('decision-next', 'activated-2', 0);
      mobileRoute('decision-next', 'email-3', 1);
      mobileRoute('decision-next', 'exit-no-engagement', 2);
      directVertical('email-3', 'day-7-check');
      mobileRoute('day-7-check', 'activated-3', 0);
      mobileRoute('day-7-check', 'exit-campaign', 1);
    } else {
      directHorizontal('email-1', 'wait-48');
      directHorizontal('wait-48', 'decision-completed-1');
      branchDesktop('decision-completed-1', ['activated-1', 'activity-after-email-1']);
      branchDesktop('activity-after-email-1', ['email-2a', 'email-2b']);
      mergeDesktop(['email-2a', 'email-2b'], 'wait-72');
      directVertical('wait-72', 'decision-next');
      branchDesktop('decision-next', ['activated-2', 'email-3', 'exit-no-engagement']);
      directVertical('email-3', 'day-7-check');
      branchDesktop('day-7-check', ['activated-3', 'exit-campaign']);
    }
  };

  const scheduleConnectorDraw = () => {
    cancelAnimationFrame(connectorFrame);
    connectorFrame = requestAnimationFrame(drawAutomationConnectors);
  };

  scheduleConnectorDraw();
  window.addEventListener('load', scheduleConnectorDraw);
  window.addEventListener('resize', scheduleConnectorDraw);
  document.fonts?.ready.then(scheduleConnectorDraw);

  if ('ResizeObserver' in window) {
    const connectorObserver = new ResizeObserver(scheduleConnectorDraw);
    connectorObserver.observe(automationMap);
  }
}
