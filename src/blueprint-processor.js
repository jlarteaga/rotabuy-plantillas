import { readFileSync, writeFile, accessSync, readFile } from 'fs';
import { JSDOM } from 'jsdom';

const picturesPath = `${process.cwd()}/data/pictures`;
const blueprintsPath = `${process.cwd()}/data/blueprints`;
console.log(picturesPath);
const outputPath = `${process.cwd()}/out`;

export class BlueprintProcessor {

	renderedBlueprintV1;
	renderedBlueprintV2;
	renderedBlueprintM1;
	renderedBlueprintM2;
	renderedBlueprintN1;
	renderedBlueprintN2;
	renderedBlueprintBF1;
	renderedBlueprintBF2;

	constructor() {
		const options = {
			contentType: 'image/svg+xml'
		};
		this.renderedBlueprintV1 = new JSDOM(readFileSync(`${blueprintsPath}/v-1.svg`), options);
		this.renderedBlueprintV2 = new JSDOM(readFileSync(`${blueprintsPath}/v-2.svg`), options);
		this.renderedBlueprintM1 = new JSDOM(readFileSync(`${blueprintsPath}/m-1.svg`), options);
		this.renderedBlueprintM2 = new JSDOM(readFileSync(`${blueprintsPath}/m-2.svg`), options);
		this.renderedBlueprintN1 = new JSDOM(readFileSync(`${blueprintsPath}/n-1.svg`), options);
		this.renderedBlueprintN2 = new JSDOM(readFileSync(`${blueprintsPath}/n-2.svg`), options);
		this.renderedBlueprintBF1 = new JSDOM(readFileSync(`${blueprintsPath}/bf-1.svg`), options);
		this.renderedBlueprintBF2 = new JSDOM(readFileSync(`${blueprintsPath}/bf-2.svg`), options);
	}

	process(product) {
		return new Promise(async (resolve, reject) => {
			const photoCount = this._getPhotoCount(product);
			const code = product['Codigo Nuevo'];
			if (photoCount === 0) {
				console.log(`Couldn't find photos for ${product['Codigo Nuevo']}`);
				return resolve();
			}
			const renderedBlueprint = this._getRenderer(product, photoCount);
			this._setTextContent(renderedBlueprint, 'brand', product.Marca);
			this._setTextContent(renderedBlueprint, 'type', product.Categoria);
			this._setTextContent(renderedBlueprint, 'size', `Talla: ${product.Talla}`);
			this._setTextContent(renderedBlueprint, 'color', `Color: ${product.Color}`);
			this._setTextContent(renderedBlueprint, 'price', `Precio: ${product.Precio} Bs`);
			if (product.Descuento && product.Descuento !== 0) {
				this._setTextContent(renderedBlueprint, 'discount', `${product.Descuento}%`);
				this._setTextContent(renderedBlueprint, 'discountPrice', `Ahora: ${product.PrecioDescuento} Bs`);
			}
			if (photoCount === 1) {
				await this._loadPhoto(renderedBlueprint, 'image1', `${picturesPath}/${code}.jpg`);
			} else if (photoCount === 2) {
				await Promise.all([
					this._loadPhoto(renderedBlueprint, 'image0', `${picturesPath}/${code}-1.jpg`),
					this._loadPhoto(renderedBlueprint, 'image2', `${picturesPath}/${code}-2.jpg`)
				]);
			}
			writeFile(`${outputPath}/${product['Codigo Nuevo']}-${product.Item}.svg`, renderedBlueprint.serialize(), (err) => {
				if (err) {
					return reject(err);
				}
				resolve();
			});
		});
	}

	_setTextContent(renderedBlueprint, id, value) {
		if (value) {
			if (renderedBlueprint.window.document.getElementById(id)) {
				renderedBlueprint.window.document.getElementById(id).textContent = value;
			}
		}
	}

	_getRenderer(product, photoCount) {
		const gender = product.Genero;
		let baseRenderer = 'renderedBlueprint';
		if (product.Descuento && product.Descuento !== 0 && product.Descuento !== '0') {
			baseRenderer += 'BF';
		} else {
			switch (gender) {
				case 'Mujer':
					baseRenderer += 'M';
					break;
				case 'Niños':
				case 'Niñas':
					baseRenderer += 'N';
					break;
				default:
					baseRenderer += 'V';
					break;
			}
		}
		baseRenderer += photoCount;
		if (!this[baseRenderer]) {
			console.log(baseRenderer);
		}
		return this[baseRenderer];
	}

	_getPhotoCount(product) {
		const code = product['Codigo Nuevo'];
		try {
			accessSync(`${picturesPath}/${code}.jpg`);
			return 1;
		} catch (e1) {
			try {
				accessSync(`${picturesPath}/${code}-1.jpg`);
				accessSync(`${picturesPath}/${code}-2.jpg`);
				return 2;
			} catch (e2) {
				return 0;
			}
		}
	}

	_loadPhoto(renderedBlueprint, id, picturePath) {
		return new Promise((resolve, reject) => {
			readFile(picturePath, {
				encoding: 'base64'
			}, (err, data) => {
				if (err) {
					return reject(err);
				}
				renderedBlueprint.window.document.getElementById(id).setAttribute('xlink:href', `data:image/jpeg;base64,${data}`);
				resolve();
			});
		});
	}
}