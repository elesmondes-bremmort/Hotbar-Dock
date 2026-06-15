(() => {
  const MODULE = "hotbar-dock";
  const SETTING_HIDDEN = "hotbar-dock.hidden";
  const SETTING_POSITION = "hotbar-dock.position";
  const MAX_RETRIES = 10;
  const RETRY_DELAY = 500;
  let hotbarElement = null;
  let retryCount = 0;
  let dragState = {
    active: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startBottom: 0
  };

  Hooks.once("init", () => {
    game.settings.register(MODULE, "hidden", {
      scope: "client",
      config: false,
      type: Boolean,
      default: false
    });

    game.settings.register(MODULE, "position", {
      scope: "client",
      config: false,
      type: Object,
      default: { left: null, bottom: null }
    });
  });

  Hooks.once("ready", () => {
    createToggleButton();
    findHotbar();
  });

  function createToggleButton() {
    const button = document.createElement("button");
    button.id = "hotbar-dock-toggle";
    button.type = "button";
    button.title = "Afficher / masquer la hotbar";
    button.textContent = "⌨";
    button.addEventListener("click", event => {
      event.preventDefault();
      toggleHidden();
    });
    document.body.appendChild(button);
  }

  function getHotbarSelector() {
    return document.querySelector("#hotbar") || document.querySelector(".hotbar");
  }

  function findHotbar() {
    hotbarElement = getHotbarSelector();
    if (!hotbarElement && retryCount < MAX_RETRIES) {
      retryCount += 1;
      window.setTimeout(findHotbar, RETRY_DELAY);
      return;
    }
    if (!hotbarElement) return;
    manageHotbar();
  }

  function manageHotbar() {
    hotbarElement.classList.add("hotbar-dock-managed");
    applyHiddenState();
    applySavedPosition();
    attachDragHandlers();
  }

  function applyHiddenState() {
    if (!hotbarElement) return;
    const hidden = game.settings.get(MODULE, "hidden");
    if (hidden) {
      hotbarElement.classList.add("hotbar-dock-hidden");
    } else {
      hotbarElement.classList.remove("hotbar-dock-hidden");
    }
  }

  function toggleHidden() {
    const current = game.settings.get(MODULE, "hidden");
    game.settings.set(MODULE, "hidden", !current).then(() => {
      applyHiddenState();
    });
  }

  function applySavedPosition() {
    if (!hotbarElement) return;
    const position = game.settings.get(MODULE, "position") || { left: null, bottom: null };
    if (position.left !== null || position.bottom !== null) {
      hotbarElement.style.position = "fixed";
      if (position.left !== null) {
        hotbarElement.style.left = position.left;
      }
      if (position.bottom !== null) {
        hotbarElement.style.bottom = position.bottom;
      }
      hotbarElement.style.right = "auto";
      hotbarElement.style.top = "auto";
    }
  }

  function attachDragHandlers() {
    if (!hotbarElement) return;
    hotbarElement.addEventListener("mousedown", onHotbarMouseDown);
    hotbarElement.addEventListener("touchstart", onHotbarTouchStart, { passive: false });
  }

  function onHotbarMouseDown(event) {
    if (!event.altKey || event.button !== 0) return;
    event.preventDefault();
    startDrag(event.clientX, event.clientY);
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragEnd);
  }

  function onHotbarTouchStart(event) {
    if (!event.altKey || !event.touches?.length) return;
    const touch = event.touches[0];
    event.preventDefault();
    startDrag(touch.clientX, touch.clientY);
    document.addEventListener("touchmove", onDragMove, { passive: false });
    document.addEventListener("touchend", onDragEnd);
  }

  function startDrag(clientX, clientY) {
    if (!hotbarElement) return;
    const rect = hotbarElement.getBoundingClientRect();
    hotbarElement.style.position = "fixed";
    hotbarElement.style.right = "auto";
    hotbarElement.style.top = "auto";
    hotbarElement.style.left = `${rect.left}px`;
    hotbarElement.style.bottom = `${window.innerHeight - rect.bottom}px`;
    dragState.active = true;
    dragState.startX = clientX;
    dragState.startY = clientY;
    dragState.startLeft = rect.left;
    dragState.startBottom = window.innerHeight - rect.bottom;
    document.body.classList.add("hotbar-dock-dragging");
  }

  function onDragMove(event) {
    if (!dragState.active) return;
    event.preventDefault();
    const clientX = event.type.startsWith("touch") ? event.touches[0].clientX : event.clientX;
    const clientY = event.type.startsWith("touch") ? event.touches[0].clientY : event.clientY;
    updateDragPosition(clientX, clientY);
  }

  function updateDragPosition(clientX, clientY) {
    if (!hotbarElement) return;
    const deltaX = clientX - dragState.startX;
    const deltaY = clientY - dragState.startY;
    const left = Math.max(0, dragState.startLeft + deltaX);
    const bottom = Math.max(0, dragState.startBottom - deltaY);
    hotbarElement.style.left = `${left}px`;
    hotbarElement.style.bottom = `${bottom}px`;
  }

  function onDragEnd() {
    if (!dragState.active) return;
    dragState.active = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragEnd);
    document.removeEventListener("touchmove", onDragMove);
    document.removeEventListener("touchend", onDragEnd);
    document.body.classList.remove("hotbar-dock-dragging");
    savePosition();
  }

  function savePosition() {
    if (!hotbarElement) return;
    const rect = hotbarElement.getBoundingClientRect();
    const left = `${Math.round(rect.left)}px`;
    const bottom = `${Math.round(window.innerHeight - rect.bottom)}px`;
    game.settings.set(MODULE, "position", { left, bottom });
  }
})();
