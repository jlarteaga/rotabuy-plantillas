import { createReadStream } from 'fs';
import CsvReadableStream from 'csv-reader';
import { createPool } from 'generic-pool';
import { BlueprintProcessor } from './blueprint-processor.js';

const processorPool = createPool({
	create: () => {
		console.log('Creating BlueprintProcessor');
		return new BlueprintProcessor();
	},
	destroy() {
		console.log('closing...');
	}
}, {
	min: 4,
	max: 8
});

let count = 0;

const csvPath = `${process.cwd()}/data/arte.csv`;

const productSet = new Set();

const readStream = createReadStream(csvPath, 'utf-8')
	.pipe(new CsvReadableStream({
		parseNumbers: false,
		asObject: true,
		skipEmptyLines: true
	}));

readStream.on('data', async (product) => {
		count++;
		const specialCode = product['Codigo Nuevo'] + product.Talla + product.Color;
		if (productSet.has(specialCode)) {
			return;
		}
		productSet.add(specialCode);
		if (processorPool.available === 0) {
			readStream.pause();
		}
		const blueprintProcessor = await processorPool.acquire();
		try {
			await blueprintProcessor.process(product);
		} catch (e) {
			console.error(e);
		}
		await processorPool.release(blueprintProcessor);
		if (readStream.isPaused()) {
			console.log('Resuming');
			readStream.resume();
		}
	})
	.on('end', () => {
		console.log(`Finished with ${count} rows!`);
	});

// readFile(`${process.cwd()}/data/pictures/MBEA1-1.jpg`, { encoding: 'base64' }, (err, data) => {
// 	if (err) return console.error(err);
// 	console.log(data);
// });