const { fusebox } = require('fuse-box')

fusebox({
	homeDir: '.',
	watch: true,
	entry: 'src/index.ts',
	target: 'browser',
	webIndex: { template: 'src/index.html' },
}).runProd({ screwIE: false, target: 'ES5', uglify: true })