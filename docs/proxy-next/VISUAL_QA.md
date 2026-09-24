# Visual verification

Date: 23 September 2026. Fixture: fictional `Maya Ramanathan` profile in `client/src/lib/profile-document-fixtures.ts`. The fixture is available only when Vite runs in development and is never sent through an upload or API route.

Verified with the shared production renderer in `client/src/components/profile-document-view.tsx`:

| Width | Style | Result |
|---:|---|---|
| 1440 × 900 | Editorial | Finished text-only composition; workspace split is 1050/390; no horizontal overflow |
| 768 × 900 | Modern | Full-width page with 390px dismissible editing panel overlay; no horizontal overflow |
| 390 × 844 | Expressive | Public page remains complete without an image; 44px responsive headline; no horizontal overflow |
| 390 × 844 | Editing panel | Full-width dismissible panel; every visible button is at least 44px high; approve action remains reachable |
| 1440 × 900 | Modern + portrait | Portrait occupies its own evidence column; same text and projects remain intact; no overflow |
| 1440 × 900 | Editorial + failed portrait | Broken image is removed and replaced by the `MR` monogram; no broken-image icon |
| 390 × 844 | Expressive + sparse content | No empty Selected work section; page moves directly from hero to one role; no overflow |

The three styles use different composition, typography, spacing, and colour systems. They share the same typed content and renderer used by public pages. Text-only profiles use a monogram in Editorial and intentional type/shape compositions in Modern and Expressive. There are no empty media frames or invented images.

The generated concept used a fixed desktop side panel. The implementation changes this to an overlay below 900px so the page stays readable. On mobile it becomes a full-width dismissible panel because a 320–390px side panel beside the page would squeeze both surfaces.

Development visual URL:

```text
/visual-test.html?style=editorial
/visual-test.html?style=modern
/visual-test.html?style=expressive&panel=closed
```
