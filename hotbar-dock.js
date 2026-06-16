(() => {
  const MODULE = "hotbar-dock";
  const SETTING_HIDDEN = "hidden";
  const SETTING_LAYOUT = "layout";
  const SETTING_POSITION_LEGACY = "position";
  const RETRY_DELAYS = [250, 1000, 2000];

  let hotbarElement = null;
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

    game.settings.register(MODULE, SETTING_POSITION_LEGACY, {
      scope: "client",
      config: false,
      type: Object,
      default: { left: null, top: null }
    });
  });

  Hooks.once("ready", () => {
    createToggleButton();
    refreshHotbar();
    RETRY_DELAYS.forEach(delay => window.setTimeout(refreshHotbar, delay));
  });

  Hooks.on("renderHotbar", () => {
    window.setTimeout(refreshHotbar, 0);
    window.setTimeout(refreshHotbar, 250);
  });

  function findHotbar() {
    return document.querySelector("#hotbar") || document.querySelector(".hotbar");
  }

  function refreshHotbar() {
    if (dragState || resizeState) return;

    const hotbar = findHotbar();
    if (!hotbar) return;

    const rectBeforeManaging = hotbar.getBoundingClientRect();
    hotbarElement = hotbar;
    hotbarElement.classList.add("hotbar-dock-managed");

    ensureHandles(hotbarElement);
    applyHiddenState();
    applyLayout(rectBeforeManaging);
  }

  function createToggleButton() {
    if (document.querySelector("#hotbar-dock-toggle")) return;

    const button = document.createElement("button");
    button.id = "hotbar-dock-toggle";
    button.type = "button";
    button.title = "Afficher / masquer la hotbar - clic droit : reset position";
    button.textContent = "\u2328";
    button.addEventListener("click", event => {
      event.preventDefault();
      toggleHidden();
    });
    button.addEventListener("contextmenu", event => {
      event.preventDefault();
      resetLayout();
    });

    document.body.appendChild(button);
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

    if (dragHandle.dataset.hotbarDockBound !== "true") {
      dragHandle.dataset.hotbarDockBound = "true";
      dragHandle.addEventListener("mousedown", startDrag);
    }

    if (resizeHandle.dataset.hotbarDockBound !== "true") {
      resizeHandle.dataset.hotbarDockBound = "true";
      resizeHandle.addEventListener("mousedown", startResize);
    }
  }

  function applyHiddenState() {
    if (!hotbarElement) return;

    const hidden = game.settings.get(MODULE, SETTING_HIDDEN);
    hotbarElement.classList.toggle("hotbar-dock-hidden", hidden);
  }

  function getSavedLayout() {
    const layout = game.settings.get(MODULE, SETTING_LAYOUT) || {};
    if (Number.isFinite(layout.left) && Number.isFinite(layout.top)) return layout;

    const legacyPosition = game.settings.get(MODULE, SETTING_POSITION_LEGACY) || {};
    if (Number.isFinite(legacyPosition.left) && Number.isFinite(legacyPosition.top)) {
      return {
        left: legacyPosition.left,
        top: legacyPosition.top,
        width: layout.width,
        height: layout.height
      };
    }

    return layout;
  }

  function applyLayout(fallbackRect) {
    if (!hotbarElement) return;

    const layout = getSavedLayout();
    const rect = fallbackRect || hotbarElement.getBoundingClientRect();
    const hasSavedPosition = Number.isFinite(layout.left) && Number.isFinite(layout.top);

    hotbarElement.style.position = "fixed";
    hotbarElement.style.left = `${hasSavedPosition ? layout.left : rect.left}px`;
    hotbarElement.style.top = `${hasSavedPosition ? layout.top : rect.top}px`;
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
    document.addEventListener("mouseup", onDragEnd, { once: true });
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
    document.removeEventListener("mousemove", onDragMove);
    document.body.classList.remove("hotbar-dock-dragging");
    dragState = null;
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
    document.addEventListener("mouseup", onResizeEnd, { once: true });
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
    document.removeEventListener("mousemove", onResizeMove);
    document.body.classList.remove("hotbar-dock-resizing");
    resizeState = null;
    saveLayoutFromHotbar();
  }

  async function toggleHidden() {
    const current = game.settings.get(MODULE, SETTING_HIDDEN);
    await game.settings.set(MODULE, SETTING_HIDDEN, !current);
    applyHiddenState();
  }

  async function resetLayout() {
    await game.settings.set(MODULE, SETTING_LAYOUT, {
      left: null,
      top: null,
      width: null,
      height: null
    });
    await game.settings.set(MODULE, SETTING_POSITION_LEGACY, {
      left: null,
      top: null
    });

    if (!hotbarElement) {
      refreshHotbar();
      return;
    }

    hotbarElement.classList.remove("hotbar-dock-managed");
    hotbarElement.style.position = "";
    hotbarElement.style.left = "";
    hotbarElement.style.top = "";
    hotbarElement.style.right = "";
    hotbarElement.style.bottom = "";
    hotbarElement.style.width = "";
    hotbarElement.style.height = "";

    window.setTimeout(refreshHotbar, 100);
  }
})();
