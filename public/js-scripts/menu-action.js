const actions = {
  openContactPopup: () => {
    // TODO: remplace par modale custom
    alert("Popup contact déclenchée !");
  },
  openNewsletterModal: () => {
    alert("Newsletter modale lancée !");
  },
  // Ajout d’actions
};

/**
 * Initialise tous les éléments [data-action] en leur attachant l'action correspondante.
 */
export function initMenuActions() {    
  document.querySelectorAll("[data-action]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const action = el.getAttribute("data-action");
      if (action && typeof actions[action] === "function") {
        actions[action]();
      } else {
        console.warn("Action inconnue :", action);
      }
    });
  });
}

initMenuActions();
