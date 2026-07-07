// .cjs explicito: package.json tiene "type": "module", asi que un
// babel.config.js plano se interpretaria como ESM y Babel/Jest esperan
// poder cargar este archivo via require() (CommonJS) al arrancar.
// Unico proposito: transformar import/export (ESM) de server/**/*.js a
// CommonJS para que Jest (que no soporta ESM nativo de forma estable) pueda
// ejecutar y mockear estos archivos con la API estandar (jest.mock, etc.).
module.exports = {
  presets: [["@babel/preset-env", { targets: { node: "current" } }]],
};
