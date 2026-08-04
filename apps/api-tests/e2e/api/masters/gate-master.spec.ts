import { runCrudSuite } from '../../helpers/crud';
import { uniqCode, uniqName } from '../../helpers/factory';

runCrudSuite({
  entity: 'GateMaster',
  create: () => ({
    gateCode: uniqCode('EXIT'),
    gateName: uniqName('School Building Exit'),
    gateType: 'StudentExit',
    sortOrder: 90,
    isActive: true,
  }),
  patch: (created) => ({ gateName: `${created['GateName']} (Annexe)` }),
  patchedField: 'gateName',
  listFilters: ['gateType=StudentExit', 'isActive=true', 'status=true', 'sortBy=GateCode&descending=true'],
});
