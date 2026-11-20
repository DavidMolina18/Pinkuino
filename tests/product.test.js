import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterProducts, folderName, formatCOP, imagePath, managedImagePath,
  MAX_IMAGE_BYTES, validateImage, validateProduct,
} from '../src/admin/productModel.js';
import { createProductService } from '../src/admin/productService.js';

const origin = 'https://project.supabase.co';
const publicUrl = (path) => `${origin}/storage/v1/object/public/imagenes/${path}`;
const oldUrl = publicUrl('MARCA/CATEGORIA/10-old.png');
const brands = [{ id: 1, nombre: 'Marca' }];
const categories = [{ id: 2, nombre: 'Categoría' }];
const file = { name: 'mi imágen.png', type: 'image/png', size: 100 };
const values = { nombre_producto: ' Producto ', marca_id: '1', categoria_id: '2', precio: '1200.5', precio_mini: '' };
const existing = { id: 7, imagen_url: oldUrl };
const args = (extra = {}) => ({ values, brands, categories, file, ...extra });

function harness(options = {}) {
  const events = [];
  let payload;
  const storage = {
    async upload(path, input, config) {
      events.push(['upload', path, input, config]);
      return options.uploadError ? { error: {} } : { data: { path } };
    },
    getPublicUrl(path) {
      if (options.urlThrows) throw new Error('sensitive');
      return { data: options.noUrl ? {} : { publicUrl: publicUrl(path) } };
    },
    async remove(paths) {
      events.push(['storage-remove', ...paths]);
      if (options.cleanupThrows) throw new Error('network');
      if (options.cleanupError) return { error: {} };
      return { data: options.cleanupEmpty ? [] : paths.map((name) => ({ name })) };
    },
  };
  const client = {
    storage: { from(bucket) { assert.equal(bucket, 'imagenes'); return storage; } },
    from(table) {
      let action = 'select';
      let projection;
      const query = {
        select(columns) { projection = columns; return query; },
        order() { return query; },
        eq(field, id) { events.push(['eq', field, id]); return query; },
        insert(input) { action = 'insert'; payload = input; return query; },
        update(input) { action = 'update'; payload = input; return query; },
        delete() { action = 'delete'; return query; },
        async single() {
          events.push([action, payload]);
          if (options.dbThrows) throw new Error('secret credential must not leak');
          if (options.dbError) return { error: {} };
          if (options.zeroRows) return { data: null };
          return { data: { id: 7, ...payload } };
        },
        then(resolve, reject) {
          events.push(['read', table, projection]);
          let result;
          if (options.readError) result = { error: {} };
          else if (table === 'productos') result = { data: options.products ?? [] };
          else if (table === 'marcas') result = { data: projection === 'logo_url' ? options.logos ?? [] : brands };
          else result = { data: categories };
          return Promise.resolve(result).then(resolve, reject);
        },
      };
      return query;
    },
  };
  return { service: createProductService(client, origin, () => 123), events, payload: () => payload };
}

test('validation uses actual IDs, trims name and supports zero/nullable mini', () => {
  assert.deepEqual(validateProduct(values, brands, categories, file, true), {
    nombre_producto: 'Producto', marca_id: 1, categoria_id: 2, precio: 1200.5, precio_mini: null,
  });
  assert.equal(validateProduct({ ...values, precio_mini: '0' }, brands, categories, null, false).precio_mini, 0);
  assert.equal(validateProduct({ ...values, precio: '0' }, brands, categories, null, false).precio, 0);
  for (const bad of ['', '-1', 'Infinity', 'NaN', '0xff', '1e999', ' ']) {
    assert.throws(() => validateProduct({ ...values, precio: bad }, brands, categories, file, true));
  }
  for (const changes of [{ marca_id: '8' }, { categoria_id: '' }, { nombre_producto: ' ' }, { nombre_producto: 'a'.repeat(201) }]) {
    assert.throws(() => validateProduct({ ...values, ...changes }, brands, categories, file, true));
  }
  assert.throws(() => validateProduct(values, brands, categories, null, true));
});

test('file validation rejects wrong MIME, empty and oversize files', () => {
  validateImage(file);
  validateImage(null);
  for (const bad of [{ ...file, type: 'text/plain' }, { ...file, size: 0 }, { ...file, size: MAX_IMAGE_BYTES + 1 }]) {
    assert.throws(() => validateImage(bad));
  }
});

test('uppercase accent-safe folders and sanitized original filename', () => {
  assert.equal(imagePath(' Maquíllaje ', 'Ojos claros', file.name, 123), 'MAQUILLAJE/OJOS-CLAROS/123-mi-imagen.png');
  for (const bad of ['../x', 'a/b', 'a\\b', '', '!!!', 'a.b']) assert.throws(() => folderName(bad));
  for (const bad of ['../a.png', 'a/b.png', 'a\\b.png', '', '..']) assert.throws(() => imagePath('A', 'B', bad));
});

test('cleanup path parsing rejects foreign buckets/origins/logos/traversal/encoding', () => {
  assert.equal(managedImagePath(oldUrl, origin), 'MARCA/CATEGORIA/10-old.png');
  assert.equal(managedImagePath(publicUrl('MARCA/CATEGORIA/10-mi%20imagen.png'), origin), null);
  for (const bad of [
    oldUrl.replace(origin, 'https://other.supabase.co'),
    oldUrl.replace('/imagenes/', '/other/'),
    publicUrl('LOGOS/CATEGORIA/10-logo.png'), publicUrl('MARCA/CATEGORIA/old.png'),
    publicUrl('MARCA/CATEGORIA/../10-old.png'), publicUrl('MARCA/CATEGORIA/%2e%2e/10-old.png'),
    publicUrl('MARCA%2fCATEGORIA/10-old.png'), publicUrl('MARCA/CATEGORIA/10-%252e.png'),
    publicUrl('MARCA/CATEGORIA/10-%ZZ.png'), oldUrl + '?download=1', 'not a URL',
  ]) assert.equal(managedImagePath(bad, origin), null, bad);
});

test('name/brand/category filters combine immediately; zero COP is formatted', () => {
  const products = [
    { id: 1, nombre_producto: 'Lápiz', marca_id: 1, categoria_id: 2 },
    { id: 2, nombre_producto: 'Lápiz', marca_id: 3, categoria_id: 2 },
    { id: 3, nombre_producto: 'Otro', marca_id: 1, categoria_id: 4 },
  ];
  assert.deepEqual(filterProducts(products, { name: ' LAPIZ ', brand: '1', category: '2' }).map((p) => p.id), [1]);
  assert.equal(filterProducts(products, {}).length, 3);
  assert.equal(filterProducts(products, { category: '9' }).length, 0);
  assert.match(formatCOP(0), /0/);
});

test('load returns all joined products and dynamic options, sanitizes failures', async () => {
  const h = harness({ products: [{ id: 7, marcas: { nombre: 'Marca' }, categorias: { nombre: 'Categoría' } }] });
  const data = await h.service.load();
  assert.equal(data.products.length, 1);
  assert.equal(data.brands, brands);
  assert.equal(data.categories, categories);
  assert.ok(h.events.some(([action, table, projection]) => action === 'read' && table === 'productos'
    && projection === '*, marcas(nombre), categorias(nombre)'));
  await assert.rejects(harness({ readError: true }).service.load(), /cargar/);
});

test('create uploads without upsert and writes returned public URL', async () => {
  const h = harness();
  const result = await h.service.save(args());
  assert.equal(result.row.id, 7);
  assert.equal(result.warning, '');
  assert.deepEqual(h.events[0], ['upload', 'MARCA/CATEGORIA/123-mi-imagen.png', file, { upsert: false, contentType: 'image/png' }]);
  assert.equal(h.payload().imagen_url, publicUrl('MARCA/CATEGORIA/123-mi-imagen.png'));
});

test('upload failure prevents database mutation', async () => {
  const h = harness({ uploadError: true });
  await assert.rejects(h.service.save(args()), /subir/);
  assert.equal(h.events.some(([event]) => event === 'insert'), false);
});

test('failed create compensates upload; cleanup failure is reported honestly', async () => {
  const h = harness({ dbError: true });
  await assert.rejects(h.service.save(args()), /confirmar el guardado/);
  assert.equal(h.events.at(-1)[0], 'storage-remove');
  for (const option of [{ cleanupError: true }, { cleanupThrows: true }, { cleanupEmpty: true }]) {
    await assert.rejects(harness({ dbError: true, ...option }).service.save(args()), /huérfano/);
  }
});

test('zero affected rows is failure, not a successful mutation', async () => {
  const h = harness({ zeroRows: true });
  await assert.rejects(h.service.save(args({ existing, file: null })), /confirmar/);
  await assert.rejects(h.service.remove(existing), /no se eliminó la imagen/);
  assert.equal(h.events.some(([event]) => event === 'storage-remove'), false);
});

test('edit without replacement preserves old URL even after category change', async () => {
  const h = harness();
  await h.service.save(args({ existing, file: null, values: { ...values, categoria_id: '3' }, categories: [{ id: 3, nombre: 'Nueva' }] }));
  assert.equal(h.payload().imagen_url, oldUrl);
  assert.equal(h.events.some(([event]) => event === 'upload' || event === 'storage-remove'), false);
});

test('replacement saves first then cleans old object; cleanup warnings do not undo save', async () => {
  const h = harness();
  assert.equal((await h.service.save(args({ existing }))).warning, '');
  assert.ok(h.events.findIndex(([event]) => event === 'update') < h.events.findIndex(([event]) => event === 'storage-remove'));
  assert.equal(h.events.at(-1)[1], 'MARCA/CATEGORIA/10-old.png');
  assert.match((await harness({ cleanupError: true }).service.save(args({ existing }))).warning, /huérfano/);
});

test('failed replacement cleans new upload, never the old image', async () => {
  const h = harness({ dbThrows: true });
  await assert.rejects(h.service.save(args({ existing })), (error) => !error.message.includes('secret'));
  assert.deepEqual(h.events.filter(([event]) => event === 'storage-remove'), [['storage-remove', 'MARCA/CATEGORIA/123-mi-imagen.png']]);
});

test('deletion is database-first; failed deletion keeps image', async () => {
  const h = harness();
  await h.service.remove(existing);
  assert.equal(h.events[1][0], 'delete');
  assert.equal(h.events.at(-1)[0], 'storage-remove');
  const failed = harness({ dbError: true });
  await assert.rejects(failed.service.remove(existing));
  assert.equal(failed.events.some(([event]) => event === 'storage-remove'), false);
});

test('shared product images, brand logos and unmanaged images are retained with warning', async () => {
  for (const options of [
    { products: [{ id: 8, imagen_url: oldUrl }] },
    { products: [{ id: 8, imagen_url: oldUrl + '?download=1' }] },
    { logos: [{ logo_url: oldUrl }] },
    { logos: [{ logo_url: oldUrl + '?width=100' }] },
    { readError: true },
  ]) {
    const h = harness(options);
    assert.ok((await h.service.remove(existing)).warning);
    assert.equal(h.events.some(([event]) => event === 'storage-remove'), false);
  }
  for (const imagen_url of ['https://foreign.example/image.png', publicUrl('logos/logo.png')]) {
    const h = harness();
    assert.match((await h.service.remove({ ...existing, imagen_url })).warning, /conservó/);
    assert.equal(h.events.some(([event]) => event === 'storage-remove'), false);
  }
});

test('missing public URL attempts compensation and reports incomplete cleanup', async () => {
  await assert.rejects(harness({ noUrl: true }).service.save(args()), /URL/);
  await assert.rejects(harness({ noUrl: true, cleanupError: true }).service.save(args()), /huérfano/);
  await assert.rejects(harness({ urlThrows: true }).service.save(args()), (error) => error.message.includes('URL') && !error.message.includes('sensitive'));
});

test('delete cleanup failure is a warning after a proven database deletion', async () => {
  for (const options of [{ cleanupError: true }, { cleanupThrows: true }, { cleanupEmpty: true }]) {
    const h = harness(options);
    const result = await h.service.remove(existing);
    assert.match(result.warning, /huérfano/);
    assert.equal(h.events.find(([action]) => action === 'delete')[0], 'delete');
  }
});

test('failed write compensation will not remove an upload now referenced by another product', async () => {
  const h = harness({ dbError: true, products: [{ id: 8, imagen_url: publicUrl('MARCA/CATEGORIA/123-mi-imagen.png') }] });
  await assert.rejects(h.service.save(args()), /otro producto/);
  assert.equal(h.events.some(([action]) => action === 'storage-remove'), false);
});
