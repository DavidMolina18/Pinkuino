export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const fold = (value) => String(value ?? '').normalize('NFD').replace(/\p{M}/gu, '');

export function validateImage(file, required = false) {
  if (!file) {
    if (required) throw new Error('Selecciona una imagen para el producto.');
    return;
  }
  if (!String(file.type).startsWith('image/') || !Number.isFinite(file.size)
    || file.size <= 0 || file.size > MAX_IMAGE_BYTES) {
    throw new Error('La imagen debe tener un tipo image/* y pesar entre 1 byte y 5 MiB.');
  }
}

export function folderName(value) {
  const name = fold(value).trim().toUpperCase();
  // Reject invalid folder characters instead of silently substituting another folder.
  if (!name || !/^[A-Z0-9 _-]+$/.test(name)) {
    throw new Error('La marca o categoría contiene caracteres no válidos para la carpeta.');
  }
  return name.replace(/\s+/g, '-');
}

export function imagePath(brand, category, fileName, now = Date.now()) {
  if (typeof fileName !== 'string' || /[/\\]|\.\./.test(fileName)) {
    throw new Error('El nombre de archivo no puede contener rutas.');
  }
  const safe = fold(fileName).trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
  if (!safe || safe === '.' || !Number.isSafeInteger(now) || now < 0) {
    throw new Error('El nombre de archivo no es válido.');
  }
  return `${folderName(brand)}/${folderName(category)}/${now}-${safe}`;
}

export function managedImagePath(value, supabaseUrl) {
  try {
    const url = new URL(value);
    if (url.origin !== new URL(supabaseUrl).origin || url.username || url.password
      || url.search || url.hash) return null;
    // Inspect the raw path: URL() normalizes literal and encoded dot segments.
    const raw = String(value).match(/^https?:\/\/[^/?#]+(\/[^?#]*)$/i)?.[1];
    const prefix = '/storage/v1/object/public/imagenes/';
    if (!raw?.startsWith(prefix) || /%2f|%5c/i.test(raw)) return null;
    const path = decodeURIComponent(raw.slice(prefix.length));
    if (path.includes('%') || path.includes('\\') || path.includes('..')) return null;
    const segments = path.split('/');
    if (segments.length !== 3 || segments.some((part) => /logo/i.test(part))) return null;
    if (!/^[A-Z0-9 _-]+\/[A-Z0-9 _-]+\/\d+-[A-Za-z0-9._-]+$/.test(path)) return null;
    return path;
  } catch {
    return null;
  }
}

function price(value, nullable) {
  const text = String(value ?? '').trim();
  if (!text && nullable) return null;
  // Decimal inputs only; reject hex, Infinity and accidental whitespace/empty zero.
  if (!text || !/^\d+(\.\d+)?$/.test(text) || !Number.isFinite(Number(text))) {
    throw new Error('Los precios deben ser números finitos mayores o iguales a cero.');
  }
  return Number(text);
}

export function validateProduct(values, brands, categories, file, creating) {
  const name = String(values.nombre_producto ?? '').trim();
  const hasControl = [...name].some((character) => character.codePointAt(0) < 32 || character.codePointAt(0) === 127);
  if (!name || name.length > 200 || hasControl) {
    throw new Error('Escribe un nombre de producto válido de hasta 200 caracteres.');
  }
  const brand = brands.find((item) => String(item.id) === String(values.marca_id));
  const category = categories.find((item) => String(item.id) === String(values.categoria_id));
  if (!brand || !category) throw new Error('Selecciona una marca y una categoría válidas.');
  validateImage(file, creating);
  if (file) imagePath(brand.nombre, category.nombre, file.name, 0);
  return {
    nombre_producto: name, marca_id: brand.id, categoria_id: category.id,
    precio: price(values.precio, false), precio_mini: price(values.precio_mini, true),
  };
}

export function filterProducts(products, { name = '', brand = '', category = '' }) {
  const query = fold(name).trim().toLowerCase();
  return products.filter((product) => fold(product.nombre_producto).toLowerCase().includes(query)
    && (!brand || String(product.marca_id) === String(brand))
    && (!category || String(product.categoria_id) === String(category)));
}

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 2,
});
export const formatCOP = (value) => currency.format(Number(value));
