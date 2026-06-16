(() => {
  const MODULE = "hotbar-dock";
  const SETTING_HIDDEN = "hidden";
  const SETTING_POSITION = "position";

  let hotbarElement = null;
  let dragState = null;

  Hooks.once("init", () => {
    game.settings.register(MODULE, SETTING_HIDDEN, {
      scope: "client",
      config: false,
      type: Boolean,
      default: false
    });

    game.settings.register(MODULE, SETTING_POSITION, {
      scope: "client",
      config: false,
      type: Object,
      default: {
        left: null,
        top: null
      }
    });
  });

  Hooks.once("ready", () => {
    createToggleButton();
    refreshHotbar();

    setTimeout(refreshHotbar, 250);
    setTimeout(refreshHotbar, 1000);
    setTimeout(refreshHotbar, 2000);
  });

  Hooks.on("renderHotbar", () => {
    setTimeout(refreshHotbar, 0);
    setTimeout(refreshHotbar, 250);
  });

  function findHotbar() {
    return document.querySelector("#hotbar") || document.querySelector(".hotbar");
  }

  function refreshHotbar() {
    hotbarElement = findHotbar();
    if (!hotbarElement) return;

    hotbarElement.classList.add("hotbar-dock-managed");

    ensureDragHandle();
    applyHiddenState();
    applyPosition();
  }

  function createToggleButton() {
    if (document.querySelector("#hotbar-dock-toggle")) return;

    const button = document.createElement("button");
    button.id = "hotbar-dock-toggle";
    button.type = "button";
    button.title = "Afficher / masquer la hotbar — clic droit : reset position";
    button.textContent = "⌨";

    button.addEventListener("click", event => {
      event.preventDefault();
      toggleHidden();
    });

    button.addEventListener("contextmenu", async event => {
      event.preventDefault();
      await resetPosition();
    });

    document.body.appendChild(button);
  }

  function ensureDragHandle() {
    if (!hotbarElement) return;

    let handle = hotbarElement.querySelector(".hotbar-dock-drag-handle");

    if (!handle) {
      handle = document.createElement("button");
      handle.type = "button";
      handle.className = "hotbar-dock-drag-handle";
      handle.title = "Déplacer la hotbar";
      handle.textContent = "☰";
      hotbarElement.prepend(handle);
    }

    if (handle.dataset.hotbarDockBound === "true") return;

    handle.dataset.hotbarDockBound = "true";
    handle.addEventListener("mousedown", startDrag);
  }

  function applyHiddenState() {
    if (!hotbarElement) return;

    const hidden = game.settings.get(MODULE, SETTING_HIDDEN);
    hotbarElement.classList.toggle("hotbar-dock-hidden", hidden);
  }

  function applyPosition() {
    if (!hotbarElement) return;

    const position = game.settings.get(MODULE, SETTING_POSITION) || {};
    const rect = hotbarElement.getBoundingClientRect();

    let left = Number.isFinite(position.left) ? position.left : rect.left;
    let top = Number.isFinite(position.top) ? position.top : rect.top;

    const clamped = clampPosition(left, top, rect.width, rect.height);
    left = clamped.left;
    top = clamped.top;

    hotbarElement.style.position = "fixed";
    hotbarElement.style.left = `${left}px`;
    hotbarElement.style.top = `${top}px`;
    hotbarElement.style.right = "auto";
    hotbarElement.style.bottom = "auto";
  }

  function clampPosition(left, top, width, height) {
    const margin = 8;

    const maxLeft = Math.max(margin, window.innerWidth - width - margin);
    const maxTop = Math.max(margin, window.innerHeight - height - margin);

    return {
      left: Math.min(Math.max(left, margin), maxLeft),
      top: Math.min(Math.max(top, margin), maxTop)
    };
  }

  async function savePositionFromHotbar() {
    if (!hotbarElement) return;

    const rect = hotbarElement.getBoundingClientRect();
    const clamped = clampPosition(rect.left, rect.top, rect.width, rect.height);

    await game.settings.set(MODULE, SETTING_POSITION, {
      left: Math.round(clamped.left),
      top: Math.round(clamped.top)
    });
  }

  function startDrag(event) {
    if (!hotbarElement || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    const rect = hotbarElement.getBoundingClientRect();

    dragState = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height
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

    const wantedLeft = event.clientX - dragState.offsetX;
    const wantedTop = event.clientY - dragState.offsetY;

    const clamped = clampPosition(
      wantedLeft,
      wantedTop,
      dragState.width,
      dragState.height
    );

    hotbarElement.style.left = `${clamped.left}px`;
    hotbarElement.style.top = `${clamped.top}px`;
    hotbarElement.style.right = "auto";
    hotbarElement.style.bottom = "auto";
  }

  async function onDragEnd() {
    document.removeEventListener("mousemove", onDragMove);
    document.body.classList.remove("hotbar-dock-dragging");

    dragState = null;
    await savePositionFromHotbar();
  }

  async function toggleHidden() {
    const current = game.settings.get(MODULE, SETTING_HIDDEN);
    await game.settings.set(MODULE, SETTING_HIDDEN, !current);

    refreshHotbar();
  }

  async function resetPosition() {
    await game.settings.set(MODULE, SETTING_POSITION, {
      left: null,
      top: null
    });

    if (!hotbarElement) refreshHotbar();
    if (!hotbarElement) return;

    hotbarElement.style.position = "";
    hotbarElement.style.left = "";
    hotbarElement.style.top = "";
    hotbarElement.style.right = "";
    hotbarElement.style.bottom = "";

    setTimeout(refreshHotbar, 100);
  }
})();