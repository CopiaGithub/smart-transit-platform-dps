import { runCrudSuite } from '../../helpers/crud';
import { uniqCode } from '../../helpers/factory';

runCrudSuite({
  entity: 'BusesMaster',
  create: () => ({
    busNumber: uniqCode('B'),
    // RouteId is nullable and the suite deliberately leaves it null: pinning a bus to
    // a seeded route would make this spec depend on that route still existing.
    routeId: null,
    // Active = daily service, Reserve = the contractor's spares.
    busType: 'Reserve',
    isActive: true,
  }),
  patch: () => ({ busType: 'Active' }),
  patchedField: 'busType',
  listFilters: ['isActive=true', 'routeId=1'],
});
