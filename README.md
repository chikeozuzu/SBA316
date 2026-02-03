This assessment measures the understanding of the Document Object Model (DOM) and the capability to implement its features in a practical manner.

Objectives:

- Use DOM properties, methods, and techniques to create a web application that provides a dynamic user experience.
- Use BOM properties, methods, and techniques to facilitate creation of a dynamic web application.
- Demonstrate proficiency with event-driven programming and DOM events.
- Implement basic form validation using any combination of built-in HTML validation attributes and DOM-event-driven JavaScript validation.

SBA 316: DOM Fun — Mini Gallery

Description:

- Small single-page project demonstrating Document Object Model (DOM) and Browser Object Model (BOM) features.

Features
- Add images via form (HTML validation + JS validation).
- Gallery built from a template and DocumentFragment.
- Persisted gallery state in `localStorage` (add/remove persist across reloads).
- Remove images with Undo support (30s visible countdown).
- Reset gallery to original sample images.
- Toggle light/dark theme.
- Accessible image modal with keyboard navigation (Arrow keys, Escape) and focus trap.

How to run
1. Open `index.html` in a browser (double-click or serve with a simple static server).

Quick tests
- Add a valid `https://` image URL and caption, submit — image appears at the top.
- Remove an image — `Undo` becomes enabled and shows a 30s countdown; click `Undo` to restore.
- Click `Reset Gallery` to restore initial samples.
- Double-click an image to open the modal; use ArrowLeft/ArrowRight to navigate between images; press `Escape` to close.

Notes
- The app stores gallery data in `localStorage` under `galleryItems` and `lastAdded` keys.
- If storage is unavailable or full, operations will fall back silently but may not persist.

Next steps (optional)
- Add visual Next/Prev controls to modal.
- Run an automated a11y audit (`pa11y` or `axe`) and fix remaining issues.
- Add tests (Playwright / Cypress) for interaction flows.

Files of interest
- `index.html` — markup and templates
- `styles.css` — styles including modal and dark theme
- `index.js` — all DOM/BOM logic, event handlers, persistence

Contact
- Copyright: Chike Ozuzu, 2026