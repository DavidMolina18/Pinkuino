import { useEffect, useState } from 'react';
import { validateImage } from './productModel';

export function ProductForm({ product, brands, categories, busy, onSave, onCancel }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function selectFile(event) {
    const next = event.target.files?.[0] ?? null;
    try {
      validateImage(next);
      setFile(next);
      setPreview(next ? URL.createObjectURL(next) : '');
      setError('');
    } catch (failure) {
      event.target.value = '';
      setFile(null);
      setPreview('');
      setError(failure.message);
    }
  }

  return (
    <section className="admin-form" aria-labelledby="admin-form-title">
      <h2 id="admin-form-title">{product ? 'Editar producto' : 'Crear producto'}</h2>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (!busy) onSave(Object.fromEntries(new FormData(event.currentTarget)), file);
      }}>
        <fieldset disabled={busy}>
          <legend>Datos del producto</legend>
          <label>Nombre<input name="nombre_producto" required maxLength={200} defaultValue={product?.nombre_producto ?? ''} /></label>
          <label>Marca<select name="marca_id" required defaultValue={product?.marca_id ?? ''}>
            <option value="">Selecciona una marca</option>
            {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.nombre}</option>)}
          </select></label>
          <label>Categoría<select name="categoria_id" required defaultValue={product?.categoria_id ?? ''}>
            <option value="">Selecciona una categoría</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
          </select></label>
          <label>Precio (COP)<input name="precio" type="number" min="0" step="any" required defaultValue={product?.precio ?? ''} /></label>
          <label>Precio mini (COP, opcional)<input name="precio_mini" type="number" min="0" step="any" defaultValue={product?.precio_mini ?? ''} /></label>
          <label>{product ? 'Reemplazar imagen (opcional)' : 'Imagen (obligatoria)'}
            <input type="file" accept="image/*" required={!product} onChange={selectFile} aria-describedby="admin-image-help" />
          </label>
          <p id="admin-image-help">Máximo 5 MiB. Sin archivo nuevo se conserva la imagen actual.</p>
          {(preview || product?.imagen_url) && <img className="admin-preview" src={preview || product.imagen_url} alt="Vista previa del producto" />}
          {error && <p role="alert">{error}</p>}
          <div className="admin-actions">
            <button type="submit" disabled={Boolean(error)}>{busy ? 'Guardando…' : 'Guardar producto'}</button>
            <button type="button" onClick={onCancel}>Cancelar</button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
