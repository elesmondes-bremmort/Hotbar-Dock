(() => {
  const MODULE = "hotbar-dock";
  const SETTING_HIDDEN = "hidden";
  const SETTING_LAYOUT = "layout";
  const MAX_RETRIES = 10;
  const RETRY_DELAY = 500;

  let hotbarElement = null;
  let retryCount = 0;
  let dragState = null;
  let resizeState = null;

  Hooks.once("init", () => {
    game.settings.register(MODULE, SETTING_HIDDEN, {
      scope: "client",
      config: false,
      type: Boolean,
      default: false
    });

    game.settings.register(MODULE, SETTING_LAYOUT, {
      scope: "client",
      config: false,
      type: Object,
      default: { left: null, top: null, width: null, height: null }
    });
  });

  Hooks.once("ready", () => {
    createToggleButton();
    scheduleHotbarRefreshes();
  });

  Hooks.on("renderHotbar", () => {
    window.setTimeout(manageHotbar, 0);
  });

  function createToggleButton() {
    if (document.querySelector("#hotbar-dock-toggle")) return;

    const button = document.createElement("button");
    button.id = "hotbar-dock-toggle";
    button.type = "button";
    button.title = "Afficher / masquer la hotbar";
    button.textContent = "\u2328";
    button.addEventListener("click", event => {
      event.preventDefault();
      toggleHidden();
    });
    document.body.appendChild(button);
  }

  function findHotbar() {
    return document.querySelector("#hotbar") || document.querySelector(".hotbar");
  }

  function scheduleHotbarRefreshes() {
    retryCount = 0;
    manageHotbar();
    retryApplyLayout();
  }

  function retryApplyLayout() {
    if (retryCount >= MAX_RETRIES) return;

    retryCount += 1;
    window.setTimeout(() => {
      manageHotbar();
      retryApplyLayout();
    }, RETRY_DELAY);
  }

  function manageHotbar() {
    hotbarElement = findHotbar();
    if (!hotbarElement) return;

    hotbarElement.classList.add("hotbar-dock-managed");
    ensureHandles(hotbarElement);
    applyHiddenState();
    applyLayout();
  }

  function ensureHandles(hotbar) {
    let dragHandle = hotbar.querySelector(".hotbar-dock-drag-handle");
    if (!dragHandle) {
      dragHandle = document.createElement("button");
      dragHandle.type = "button";
      dragHandle.className = "hotbar-dock-drag-handle";
      dragHandle.title = "Deplacer la hotbar";
      dragHandle.textContent = "\u22EE\u22EE";
      hotbar.prepend(dragHandle);
    }

    let resizeHandle = hotbar.querySelector(".hotbar-dock-resize-handle");
    if (!resizeHandle) {
      resizeHandle = document.createElement("button");
      resizeHandle.type = "button";
      resizeHandle.className = "hotbar-dock-resize-handle";
      resizeHandle.title = "Redimensionner la hotbar";
      resizeHandle.textContent = "\u25E2";
      hotbar.appendChild(resizeHandle);
    }

    if (!dragHandle.dataset.hotbarDockBound) {
      dragHandle.dataset.hotbarDockBound = "true";
      dragHandle.addEventListener("mousedown", startDrag);
    }

    if (!resizeHandle.dataset.hotbarDockBound) {
      resizeHandle.dataset.hotbarDockBound = "true";
      resizeHandle.addEventListener("mousedown", startResize);
    }
  }

  function applyHiddenState() {
    if (!hotbarElement) return;

    const hidden = game.settings.get(MODULE, SETTING_HIDDEN);
    hotbarElement.classList.toggle("hotbar-dock-hidden", hidden);
  }

  function applyLayout() {
    if (!hotbarElement) return;

    const layout = game.settings.get(MODULE, SETTING_LAYOUT) || {};
    const rect = hotbarElement.getBoundingClientRect();
    hotbarElement.style.position = "fixed";
    hotbarElement.style.left = `${Number.isFinite(layout.left) ? layout.left : rect.left}px`;
    hotbarElement.style.top = `${Number.isFinite(layout.top) ? layout.top : rect.top}px`;
    hotbarElement.style.right = "auto";
    hotbarElement.style.bottom = "auto";

    if (Number.isFinite(layout.width)) hotbarElement.style.width = `${layout.width}px`;
    if (Number.isFinite(layout.height)) hotbarElement.style.height = `${layout.height}px`;
  }

  function saveLayoutFromHotbar() {
    if (!hotbarElement) return;

    const rect = hotbarElement.getBoundingClientRect();
    game.settings.set(MODULE, SETTING_LAYOUT, {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
  }

  function startDrag(event) {
    if (!hotbarElement || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = hotbarElement.getBoundingClientRect();
    dragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top
    };

    hotbarElement.style.position = "fixed";
    hotbarElement.style.left = `${rect.left}px`;
    hotbarElement.style.top = `${rect.top}px`;
    hotbarElement.style.right = "auto";
    hotbarElement.style.bottom = "auto";

    document.body.classList.add("hotbar-dock-dragging");
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  }

  function onDragMove(event) {
    if (!dragState || !hotbarElement) return;

    event.preventDefault();

    const left = event.clientX - dragState.offsetX;
    const top = event.clientY - dragState.offsetY;
    hotbarElement.style.position = "fixed";
    hotbarElement.style.left = `${left}px`;
    hotbarElement.style.top = `${top}px`;
    hotbarElement.style.right = "auto";
    hotbarElement.style.bottom = "auto";
  }

  function onDragEnd() {
    if (!dragState) return;

    dragState = null;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.body.classList.remove("hotbar-dock-dragging");
    saveLayoutFromHotbar();
  }

  function startResize(event) {
    if (!hotbarElement || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = hotbarElement.getBoundingClientRect();
    resizeState = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: rect.width,
      startHeight: rect.height
    };

    hotbarElement.style.position = "fixed";
    hotbarElement.style.left = `${rect.left}px`;
    hotbarElement.style.top = `${rect.top}px`;
    hotbarElement.style.right = "auto";
    hotbarElement.style.bottom = "auto";

    document.body.classList.add("hotbar-dock-resizing");
    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeEnd);
  }

  function onResizeMove(event) {
    if (!resizeState || !hotbarElement) return;

    event.preventDefault();

    const newWidth = Math.max(240, resizeState.startWidth + event.clientX - resizeState.startX);
    const newHeight = Math.max(48, resizeState.startHeight + event.clientY - resizeState.startY);
    hotbarElement.style.width = `${newWidth}px`;
    hotbarElement.style.height = `${newHeight}px`;
  }

  function onResizeEnd() {
    if (!resizeState) return;

    resizeState = null;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeEnd);
    document.body.classList.remove("hotbar-dock-resizing");
    saveLayoutFromHotbar();
  }

  function toggleHidden() {
    const current = game.settings.get(MODULE, SETTING_HIDDEN);
    game.settings.set(MODULE, SETTING_HIDDEN, !current).then(() => {
      applyHiddenState();
    });
  }
})();
