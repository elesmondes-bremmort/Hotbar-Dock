# Hotbar Dock

## Description

Hotbar Dock permet à chaque utilisateur de masquer, afficher et déplacer sa hotbar Foundry VTT sans modifier les données du monde.

## Installation

1. Ouvrez l’onglet Modules dans Foundry VTT.
2. Cliquez sur `Installer un module via manifeste`.
3. Collez cette URL :

   `https://raw.githubusercontent.com/elesmondes-bremmort/hotbar-dock/main/module.json`

4. Installez et activez le module.

## Utilisation

- Un petit bouton flottant `⌨` apparaît en bas à gauche.
- Cliquez sur ce bouton pour masquer ou afficher la hotbar.
- L’état masqué / visible est enregistré par utilisateur.
- Maintenez `Alt` puis cliquez-glissez sur la hotbar pour la repositionner.
- La position est enregistrée par utilisateur.
- La hotbar s’estompe à `0.25` lorsqu’elle n’est pas survolée, puis passe à `1` au survol.

## Notes

- Le module n’altère pas les macros ni les données de la hotbar.
- Aucun socket n’est utilisé.
- Les écouteurs `mousemove` / `mouseup` sont ajoutés uniquement pendant le drag.
- Le module gère la hotbar si elle apparaît après `ready` avec des tentatives limitées.
