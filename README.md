# Portfolio

A warm, editorial single-page portfolio. Oversized serif/sans typography, smooth
scroll, on-scroll reveals, a custom cursor, hover-to-reveal project list, marquee,
counter preloader and magnetic buttons.

**Stack:** plain HTML / CSS / JS · [GSAP](https://gsap.com) + ScrollTrigger ·
[Lenis](https://lenis.darkroom.engineering) smooth scroll. All via CDN — no build step.

## Run it

Just open `index.html`, or for proper smooth-scroll behaviour serve it locally:

```bash
cd portfolio
python3 -m http.server 5173
# visit http://localhost:5173
```

## Make it yours

Everything you need to edit is marked with `[brackets]`.

| What | Where |
|------|-------|
| Name, role, intro copy | `index.html` — hero, nav, menu |
| Projects (name, tags, year) | `index.html` — `.work__list` items |
| Services / About / Recognition | `index.html` — those sections |
| Email, phone, social links | `index.html` — footer `.contact` |
| **Colors / fonts / spacing** | `css/style.css` — the `:root` tokens at the top |

### Swap the palette
Change a few variables in `:root` and the whole site re-skins:

```css
--bg: #ece7dd;     /* page background  */
--ink: #14110d;    /* main text        */
--accent: #d8492b; /* the one accent   */
--dark: #14110d;   /* dark sections    */
```

### Real project images
The project list currently shows generated color swatches on hover. To use real
images, drop them in `assets/` and in `js/main.js` (`workPreview()`) replace the
swatch line with, e.g.:

```js
preview.style.backgroundImage = `url('assets/project-one.jpg')`;
```

…and give each `<li class="work__item">` a `data-img="assets/project-one.jpg"` if
you'd like to drive it from the HTML instead.

## Deploy
It's static — drop the folder on Netlify, Vercel, GitHub Pages, or Cloudflare Pages.
