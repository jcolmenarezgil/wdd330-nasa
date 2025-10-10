// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            // Define un punto de entrada local: /nasa-api
            // Cuando tu código llame a '/nasa-api/...'
            '/nasa-api': {
                // 🎯 Redirige la petición a la URL base de la API de la NASA
                target: 'https://osdr.nasa.gov/geode-py/ws',

                // 💡 CRUCIAL: Engaña al servidor de destino para que piense
                // que la petición viene de su mismo origen, no de localhost.
                changeOrigin: true,

                // 🧹 Opcional pero útil: reescribe la ruta para eliminar
                // el prefijo '/nasa-api' que usamos localmente.
                // La ruta final enviada será: /api/missions
                rewrite: (path) => path.replace(/^\/nasa-api/, ''),

                // Dado que la API de la NASA usa HTTPS
                secure: true,
            },
        },
    },
});