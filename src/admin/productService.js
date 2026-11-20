import { imagePath, managedImagePath, validateProduct } from './productModel.js';

const BUCKET = 'imagenes';
const JOINED = '*, marcas(nombre), categorias(nombre)';
const CLEANUP_FAILED = 'No se pudo limpiar la imagen; puede quedar un archivo huérfano.';

// The client, origin and clock are injected. Never import browser credentials here.
export function createProductService(client, supabaseUrl, now = Date.now) {
  const storage = client.storage.from(BUCKET);
  const referencePath = (url) => managedImagePath(String(url ?? '').split(/[?#]/)[0], supabaseUrl);

  async function cleanup(url, excludedId) {
    const path = managedImagePath(url, supabaseUrl);
    if (!path) return 'Se conservó la imagen externa, compartida o no administrada (incluidos logos).';
    try {
      // Check canonical paths too, not just literal URL equality.
      const [products, brands] = await Promise.all([
        client.from('productos').select('id, imagen_url'),
        client.from('marcas').select('logo_url'),
      ]);
      if (products.error || brands.error || !products.data || !brands.data) return CLEANUP_FAILED;
      const shared = products.data.some((item) => String(item.id) !== String(excludedId)
        && referencePath(item.imagen_url) === path)
        || brands.data.some((item) => item.logo_url === url
          || referencePath(item.logo_url) === path);
      if (shared) return 'Se conservó la imagen porque otro producto o marca la utiliza.';
      const result = await storage.remove([path]);
      if (result.error || !result.data?.some((item) => item.name === path)) return CLEANUP_FAILED;
      return '';
    } catch {
      return CLEANUP_FAILED;
    }
  }

  async function upload(file, brand, category) {
    const path = imagePath(brand.nombre, category.nombre, file.name, now());
    try {
      const result = await storage.upload(path, file, { upsert: false, contentType: file.type });
      if (result.error) throw result.error;
    } catch {
      throw new Error('No se pudo subir la imagen. No se guardaron cambios del producto.');
    }
    try {
      const result = storage.getPublicUrl(path);
      if (!result.data?.publicUrl) throw new Error('Missing URL');
      return result.data.publicUrl;
    } catch {
      let warning = '';
      try {
        const removed = await storage.remove([path]);
        if (removed.error || !removed.data?.some((item) => item.name === path)) warning = CLEANUP_FAILED;
      } catch { warning = CLEANUP_FAILED; }
      throw new Error(`No se pudo obtener la URL de la imagen. ${warning}`.trim());
    }
  }

  return {
    async load() {
      try {
        const [products, brands, categories] = await Promise.all([
          client.from('productos').select(JOINED).order('id', { ascending: false }),
          client.from('marcas').select('id, nombre').order('nombre'),
          client.from('categorias').select('id, nombre').order('nombre'),
        ]);
        if ([products, brands, categories].some((result) => result.error || !Array.isArray(result.data))) {
          throw new Error('Load failed');
        }
        return { products: products.data, brands: brands.data, categories: categories.data };
      } catch {
        throw new Error('No se pudieron cargar los productos y opciones. Revisa tu sesión y reintenta.');
      }
    },
    async save({ values, file, existing = null, brands, categories }) {
      const payload = validateProduct(values, brands, categories, file, !existing);
      let newUrl = null;
      if (file) {
        newUrl = await upload(file,
          brands.find((item) => item.id === payload.marca_id),
          categories.find((item) => item.id === payload.categoria_id));
      }
      payload.imagen_url = newUrl ?? existing?.imagen_url;
      let row;
      try {
        const query = existing
          ? client.from('productos').update(payload).eq('id', existing.id)
          : client.from('productos').insert(payload);
        const result = await query.select(JOINED).single();
        if (result.error || result.data?.id == null) throw new Error('No affected row');
        row = result.data;
      } catch {
        const warning = newUrl ? await cleanup(newUrl) : '';
        throw new Error(`No se pudo confirmar el guardado. Recarga antes de reintentar. ${warning}`.trim());
      }
      const warning = existing && newUrl && existing.imagen_url !== newUrl
        ? await cleanup(existing.imagen_url, existing.id) : '';
      return { row, warning };
    },
    async remove(product) {
      try {
        const result = await client.from('productos').delete().eq('id', product.id).select('id').single();
        if (result.error || result.data?.id == null) throw new Error('No affected row');
      } catch {
        throw new Error('No se pudo confirmar la eliminación. Recarga antes de reintentar; no se eliminó la imagen.');
      }
      return { warning: await cleanup(product.imagen_url, product.id) };
    },
  };
}
