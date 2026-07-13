# IronCoach — versión Claude convertida en PWA

Este paquete conserva la interfaz y la lógica visual de la versión original creada con Claude.

## Archivos que debes subir a GitHub
Sube a la raíz del repositorio:

- index.html
- styles.css
- app.js
- manifest.webmanifest
- service-worker.js
- icon.svg

No subas tu archivo personal de backup.

## Activar GitHub Pages
1. GitHub → repositorio → Settings.
2. Pages.
3. Source: Deploy from a branch.
4. Branch: main.
5. Folder: /root.
6. Save.

La URL será parecida a:
`https://TU_USUARIO.github.io/ironcoach/`

## Instalar en iPhone
1. Abre la URL con Safari.
2. Pulsa Compartir.
3. Añadir a pantalla de inicio.
4. Abre IronCoach desde el nuevo icono.
5. Ajustes → Importar datos.
6. Selecciona tu copia JSON.

## Exportación
La versión incluye cuatro alternativas:
1. Hoja de compartir de iOS.
2. Descarga JSON.
3. Copia al portapapeles.
4. Visualización manual del JSON.

## Datos
La aplicación conserva el sistema actual de LocalStorage para asegurar compatibilidad con la lógica original.
Al estar publicada bajo HTTPS, Safari puede usarlo correctamente.

## Nota
Después de comprobar que la aplicación abre, instala e importa el backup correctamente,
la siguiente fase será migrar progresivamente el almacenamiento a IndexedDB sin modificar el diseño.
