import { runCrudSuite } from '../../helpers/crud';
import { uniqCode, uniqName } from '../../helpers/factory';

runCrudSuite({
  entity: 'RoutesMaster',
  create: () => ({
    routeCode: uniqCode('PNV'),
    routeName: uniqName('Panvel'),
    // The uppercase form the airport-style board renders.
    ledDisplayName: uniqName('PANVEL').toUpperCase(),
    isActive: true,
  }),
  patch: () => ({ ledDisplayName: uniqName('PANVEL EAST').toUpperCase() }),
  patchedField: 'ledDisplayName',
  listFilters: ['isActive=true', 'searchTerm=Panvel'],
});
