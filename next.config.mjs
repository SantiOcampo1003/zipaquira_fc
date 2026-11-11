/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfkit (usado por @react-pdf/renderer) carga sus fuentes estándar con
    // require() dinámico, así que el trazador de Vercel no las detecta solo.
    outputFileTracingIncludes: {
      "/api/boletas/[purchaseId]/pdf": ["./node_modules/pdfkit/js/standard-fonts/**"],
      "/api/boletas/webhook": ["./node_modules/pdfkit/js/standard-fonts/**"],
    },
  },
};

export default nextConfig;
