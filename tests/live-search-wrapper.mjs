const fetchOriginal=globalThis.fetch;
globalThis.fetch=(input,opcoes={})=>fetchOriginal(input,{...opcoes,signal:opcoes.signal||AbortSignal.timeout(8000)});
await import('./live-search.mjs');
