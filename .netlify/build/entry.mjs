import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_CZl0fMnO.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/404.astro.mjs');
const _page1 = () => import('./pages/about.astro.mjs');
const _page2 = () => import('./pages/authors/_author_.astro.mjs');
const _page3 = () => import('./pages/feed.xml.astro.mjs');
const _page4 = () => import('./pages/ogimage.png.astro.mjs');
const _page5 = () => import('./pages/posts/_page_.astro.mjs');
const _page6 = () => import('./pages/posts/_---slug_/index.png.astro.mjs');
const _page7 = () => import('./pages/posts/_---page_.astro.mjs');
const _page8 = () => import('./pages/posts/_---slug_.astro.mjs');
const _page9 = () => import('./pages/projects/_page_.astro.mjs');
const _page10 = () => import('./pages/projects/_---page_.astro.mjs');
const _page11 = () => import('./pages/robots.txt.astro.mjs');
const _page12 = () => import('./pages/search.astro.mjs');
const _page13 = () => import('./pages/sparks/_page_.astro.mjs');
const _page14 = () => import('./pages/sparks/_---page_.astro.mjs');
const _page15 = () => import('./pages/tags/_tag_.astro.mjs');
const _page16 = () => import('./pages/tags.astro.mjs');
const _page17 = () => import('./pages/timer.astro.mjs');
const _page18 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["src/pages/404.md", _page0],
    ["src/pages/about.mdx", _page1],
    ["src/pages/authors/[author].astro", _page2],
    ["src/pages/feed.xml.ts", _page3],
    ["src/pages/ogImage.png.ts", _page4],
    ["src/pages/posts/[page].astro", _page5],
    ["src/pages/posts/[...slug]/index.png.ts", _page6],
    ["src/pages/posts/[...page].astro", _page7],
    ["src/pages/posts/[...slug]/index.astro", _page8],
    ["src/pages/projects/[page].astro", _page9],
    ["src/pages/projects/[...page].astro", _page10],
    ["src/pages/robots.txt.ts", _page11],
    ["src/pages/search.astro", _page12],
    ["src/pages/sparks/[page].astro", _page13],
    ["src/pages/sparks/[...page].astro", _page14],
    ["src/pages/tags/[tag].astro", _page15],
    ["src/pages/tags/index.astro", _page16],
    ["src/pages/timer.astro", _page17],
    ["src/pages/index.md", _page18]
]);
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: undefined
});
const _args = {
    "middlewareSecret": "e3b5a122-16d4-4467-b53f-f1d0774e2a7a"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
