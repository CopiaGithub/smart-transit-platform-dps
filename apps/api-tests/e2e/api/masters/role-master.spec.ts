import { runCrudSuite } from '../../helpers/crud';
import { uniqName } from '../../helpers/factory';

runCrudSuite({
  entity: 'RoleMaster',
  create: () => ({
    roleName: uniqName('Transport Manager'),
    description: 'Manages routes, buses and the contractor relationship.',
    isActive: true,
  }),
  patch: () => ({ description: 'Manages routes, buses, platforms and the contractor.' }),
  patchedField: 'description',
  listFilters: ['isActive=true', 'searchTerm=Transport'],
});
