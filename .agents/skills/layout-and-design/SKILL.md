---
name: layout-and-design
description: Use for UI semantics, page structure, landmarks, headings, forms, accessibility, keyboard interaction, focus behavior, contrast, target size, ARIA decisions, and modal/dialog patterns. Use together with frontend when the task also changes Vue components or frontend state.
---

# Layout and design

Apply this skill when the task is mainly about semantics, 
accessibility, interaction structure, and page/document layout.

## Standards

Design and markup decisions must follow:

- W3C / WHATWG HTML semantics
- WCAG AA for contrast, focus, keyboard support, target size
- WAI-ARIA Authoring Practices
- first rule of ARIA: prefer native HTML first

## Rules

1. Choose the right native HTML element before adding ARIA.
2. Build pages with proper landmarks and heading hierarchy.
3. Use `button` for actions and `a` for navigation.
4. Forms must have labels, meaningful attributes, and accessible errors.
5. All interactive UI must be usable from the keyboard.
6. Visible focus is mandatory.
7. Do not use ARIA to imitate native controls when native controls exist.
8. Modal dialogs must follow APG focus rules.

## How to answer

When implementing or reviewing layout/design work:

- identify the semantic structure first
- state accessibility risks clearly
- provide the smallest correct markup example
- mention focus/keyboard behavior whenever interaction changes

Read `references/layout-and-design-standard.md` for the full 
repo-specific rules and examples.
