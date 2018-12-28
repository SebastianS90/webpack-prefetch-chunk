const {Template} = require('webpack');

const pluginName = 'prefetch-chunk-plugin';

class PrefetchChunkPlugin {
    apply(compiler) {
        compiler.hooks.thisCompilation.tap(pluginName, ({mainTemplate}) => {
            mainTemplate.hooks.requireExtensions.tap(pluginName, (source, chunk, hash) => {
                const idNameMap = chunk.getChunkMaps().name;
                const nameIdMap = {};
                let needsMap = false;
                for (const key in idNameMap) {
                    const value = idNameMap[key];
                    nameIdMap[value] = key;
                    if (key !== value) {
                        needsMap = true;
                    }
                }
                return Template.asString([
                    source,
                    '',
                    `// Prefetch a chunk (${pluginName})`,
                    `${mainTemplate.requireFn}.pfc = function prefetchChunk(chunkId) {`,
                    Template.indent((needsMap ? [
                        `chunkId = ${JSON.stringify(nameIdMap)}[chunkId]||chunkId;`
                    ] : []).concat([
                        'if(installedChunks[chunkId] === undefined) {',
                        Template.indent([
                            'installedChunks[chunkId] = null;',
                            mainTemplate.hooks.linkPrefetch.call('', chunk, hash),
                            'document.head.appendChild(link);',
                        ]),
                        '}',
                    ])),
                    '};',
                ]);
            });
        });
    }
}

module.exports = PrefetchChunkPlugin;
