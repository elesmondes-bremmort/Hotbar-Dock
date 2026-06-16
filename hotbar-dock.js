(() => {
  const MODULE = "hotbar-dock";
  const SETTING_HIDDEN = "hidden";
  const SETTING_PLACEMENT = "placement";
  const RETRY_DELAYS = [250, 1000, 2000];

  let hotbarElement = null;

  Hooks.once("init", () => {
    game.settings.register(MODULE, SETTING_HIDDEN, {
      scope: "client",
      config: false,
      type: Boolean,
      default: false
    });

    game.settings.register(MODULE, SETTING_PLACEMENT, {
      scope: "client",
      config: false,
      type: String,
      default: "bottom"
    });
  });

  Hooks.once("ready", () => {
    createControls();
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
    hotbarElement = findHotbar();
    if (!hotbarElement) return;

    removeOldHandles();
    hotbarElement.classList.add("hotbar-dock-managed");
    applyHiddenState();
    applyPlacement();
  }

  function createControls() {
    createButton({
      id: "hotbar-dock-toggle",
      title: "Afficher / masquer la hotbar",
      text: "\u2328",
      onClick: toggleHidden
    });

    createButton({
      id: "hotbar-dock-placement",
      title: "Basculer la hotbar en haut / en bas",
      text: "\u21C5",
      onClick: togglePlacement
    });
  }

  function createButton({ id, title, text, onClick }) {
    if (document.querySelector(`#${id}`)) return;

    const button = document.createElement("button");
    button.id = id;
    button.type = "button";
    button.title = title;
    button.textContent = text;
    button.addEventListener("click", event => {
      event.preventDefault();
      onClick();
    });

    document.body.appendChild(button);
  }

  function removeOldHandles() {
    if (!hotbarElement) return;

    hotbarElement.querySelector(".hotbar-dock-drag-handle")?.remove();
    hotbarElement.querySelector(".hotbar-dock-resize-handle")?.remove();
  }

  function applyHiddenState() {
    if (!hotbarElement) return;

    const hidden = game.settings.get(MODULE, SETTING_HIDDEN);
    hotbarElement.classList.toggle("hotbar-dock-hidden", hidden);
  }

  function getPlacement() {
    const placement = game.settings.get(MODULE, SETTING_PLACEMENT);
    return placement === "top" ? "top" : "bottom";
  }

  function applyPlacement() {
    if (!hotbarElement) return;

    const placement = getPlacement();
    hotbarElement.classList.toggle("hotbar-dock-top", placement === "top");
    hotbarElement.classList.toggle("hotbar-dock-bottom", placement === "bottom");

    hotbarElement.style.position = "fixed";
    hotbarElement.style.left = "50%";
    hotbarElement.style.right = "auto";
    hotbarElement.style.top = placement === "top" ? "16px" : "auto";
    hotbarElement.style.bottom = placement === "bottom" ? "24px" : "auto";
    hotbarElement.style.width = "";
    hotbarElement.style.height = "";
  }

  async function toggleHidden() {
    const current = game.settings.get(MODULE, SETTING_HIDDEN);
    await game.settings.set(MODULE, SETTING_HIDDEN, !current);
    applyHiddenState();
  }

  async function togglePlacement() {
    const nextPlacement = getPlacement() === "top" ? "bottom" : "top";
    await game.settings.set(MODULE, SETTING_PLACEMENT, nextPlacement);
    applyPlacement();
  }
})();
