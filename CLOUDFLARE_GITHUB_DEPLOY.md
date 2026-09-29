# Guía de Despliegue: Ecoparque Quilmes en GitHub + Cloudflare Pages

Esta aplicación está optimizada para desplegarse de forma 100% gratuita y ultrarrápida en **Cloudflare Pages** conectada a tu repositorio de **GitHub**.

---

## 🚀 ¿Por qué Cloudflare Pages + GitHub en vez de Google Sheets?

1. **Velocidad Extrema (0 latencia)**: Google Apps Script suele tardar entre 2 y 5 segundos por cada escaneo o guardado por redirecciones y "cold starts". En Cloudflare Pages el tiempo de respuesta es casi instantáneo (<50ms).
2. **Sin bloqueos ni permisos de Google**: No requiere autorizar cuentas de Google ni lidiar con tokens expirados o cuotas de lectura/escritura de Google Drive.
3. **100% Disponible y Offline-First**: Funciona aunque se corte la conexión en el pañol gracias al almacenamiento local del navegador y compatibilidad PWA.
4. **Copias de Seguridad (Backup)**: Puedes exportar e importar en 1 solo clic toda la base en formato `.json` o descargar planillas `.csv`/Excel.
5. **SSL y Dominio Gratis**: Cloudflare te da un subdominio seguro tipo `https://ecoparque-quilmes.pages.dev` de forma perpetua y gratuita.

---

## 📋 Pasos para Subir a GitHub

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
# 1. Inicializar repositorio (si no lo hiciste)
git init

# 2. Agregar todos los archivos
git add .

# 3. Guardar el primer commit
git commit -m "Ecoparque Quilmes - Inventario y Pañol GIRSU"

# 4. Vincular con tu repositorio de GitHub (reemplaza con tu URL)
git branch -M main
git remote add origin https://github.com/TU_USUARIO/ecoparque-quilmes.git

# 5. Subir a GitHub
git push -u origin main
```

---

## ⚡ Pasos para Desplegar en Cloudflare Pages

1. Ingresa a tu cuenta de **[Cloudflare Dashboard](https://dash.cloudflare.com/)**.
2. Ve a **Compute (Workers) > Workers & Pages** o **Pages**.
3. Haz clic en **Create application** (Crear aplicación) y selecciona la pestaña **Pages**.
4. Haz clic en **Connect to Git** (Conectar a Git) y selecciona tu repositorio de GitHub `ecoparque-quilmes`.
5. En la configuración de compilación (**Build settings**):
   - **Framework preset**: `Vite` (o `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: (Opcional, versión 18 o 20)
6. Haz clic en **Save and Deploy** (Guardar y Desplegar).
7. ¡Listo! En menos de 1 minuto tendrás tu enlace público `https://ecoparque-quilmes.pages.dev` activo. Cada vez que hagas `git push`, Cloudflare actualizará la aplicación automáticamente.

---

## 💾 Persistencia de Datos y Sincronización

- **Modo Predeterminado (Local / PWA)**: El sistema guarda todo en el almacenamiento seguro del navegador. Es ideal para que el pañol funcione rápido y sin depender de servidores.
- **Backups JSON**: Desde el botón **"Nube & GitHub"** del panel de administración, puedes pulsar **"Descargar Copia de Seguridad Completa (JSON)"** para respaldar todo el inventario, préstamos y movimientos históricos en cualquier momento.
- **Sincronización en la Nube (Opcional con Cloudflare KV o Workers)**: Si en el futuro deseas sincronizar múltiples teléfonos o tablets a través de Cloudflare KV, la carpeta `/functions/api/inventory.ts` ya está lista en este repositorio para funcionar como API serverless nativa de Cloudflare Pages.
