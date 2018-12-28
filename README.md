[![npm][npm]][npm-url]

# Webpack Prefetch Chunk Plugin
This plugin provides a helper function for prefetching chunks dynamically whenever you want.

You might know the `import(/* webpackPrefetch: true */ 'MyModule');` syntax (see [documentation](https://webpack.js.org/guides/code-splitting/#prefetching-preloading-modules)).
Using that magic comment, the chunk containing `MyModule` will be prefetched as soon as the chunk containing the `import(...)` statement is installed.
There are use cases where this is too early and unflexible.


## Example use case

Consider the following setup for `vue-router` (this plugin works for any async chunks, `vue-router` is just an example):

```javascript
const PageA = () => import(/* webpackChunkName: "page-a" */'./PageA.vue')
const PageB = () => import(/* webpackChunkName: "page-b" */'./PageB.vue')
const PageC = () => import(/* webpackChunkName: "page-c" */'./PageC.vue')

const router = new VueRouter({
  routes: [
    { path: '/a', component: PageA },
    { path: '/b', component: PageB },
    { path: '/c', component: PageC },
  ]
})
```

Adding `/* webpackPrefetch: true */` to any of the above `import(...)`s will prefetch that chunk directly when the router is being set up.
You might end up prefetching a lot of stuff unnecessarily, thereby wasting your user's bandwidth.

Assume we want to prefetch `page-b` only when the user accesses `/a`.
To do so, we call `__webpack_require__.pfc('page-b')` somewhere in `PageA.vue`, for example in the `mounted` hook.

**Real-world use case:** A login form.
When the user submits the form then a tiny request to your API is made to check the credentials and additionally a large request to load the chunk that renders a dashboard (first page after login).
You could prefetch that chunk as soon as the user starts typing something into the login form.
Just call `__webpack_require__.pfc('chunk-with-dashboard')` from the change handler for the input fields.


## Install

```bash
yarn add webpack-prefetch-chunk
```

or

```bash
npm install webpack-prefetch-chunk
```


## Usage
```javascript
const PrefetchChunkPlugin = require('webpack-prefetch-chunk');

module.exports = {
    plugins: [
        new PrefetchChunkPlugin()
    ]
};
```

The plugin adds a `__webpack_require__.pfc` function to the manifest (`pfc` = **p**re**f**etch **c**hunk).
Call that function in any module you wish.
Pass it the name of the chunk you want to load, i.e. the name specified with `/* webpackChunkName: "my-chunk-name" */`.

At runtime, a `<link rel="prefetch" as="script" href="...">` element is appended to the document head.
Nothing is done if the chunk is already loaded or is currently loading/prefetching.

The implementation is [inspired by webpack itself](https://github.com/webpack/webpack/blob/v4.28.2/lib/web/JsonpMainTemplatePlugin.js#L391-L395).
The rest of the code is to ensure that the helper function can be used regardless of the `optimization.namedChunks` setting.


## Using Typescript?

Add the following to a `.d.ts` file somewhere in your `include` path specified in `tsconfig.json`:

```typescript
declare global {
    const __webpack_require__: {
        pfc(chunkId: string): void,
    }
}
```


[npm]: https://img.shields.io/npm/v/webpack-prefetch-chunk.svg
[npm-url]: https://npmjs.com/package/webpack-prefetch-chunk
