const { fusebox } = require('fuse-box')

fusebox({
	homeDir: '.',
	watch: true,
	entry: 'src/index.ts',
	target: 'browser',
	devServer: { httpServer: { port: 8080 }, hmrServer: { port: 9999, enabled: true } },
	webIndex: { template: 'src/index.html' },
	sourceMap: true
}).runProd({ screwIE: false, target: 'ES5', uglify: true})