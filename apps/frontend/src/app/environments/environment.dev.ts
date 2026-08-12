// Hosted DEV backend, used by `ng build --configuration=development` (what the
// Jenkins DEV deploy runs). The site is tdpdev and the IIS application under it
// is tdpdevapi; controllers live under api/, so dropping that segment returns a
// 404 envelope that reads like a routing bug.
export const environment = {
  production: false,
  apiUrl: 'https://tdpdev.copiacs.com/tdpdevapi/api',
  baseUrl: 'https://tdpdev.copiacs.com',
};
