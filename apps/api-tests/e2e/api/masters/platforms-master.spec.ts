import { runCrudSuite } from '../../helpers/crud';
import { uniqName, uniqNumber } from '../../helpers/factory';

runCrudSuite({
  entity: 'PlatformsMaster',
  create: () => {
    // Seeded platforms are 1..23 (one bus-length apart from the boarding point to the
    // gate) and PlatformNumber is uniquely indexed, so start well clear of them.
    const number = uniqNumber(1000, 8000);
    return {
      platformNumber: number,
      platformName: `Station ${number}`,
      sortOrder: number,
      isActive: true,
    };
  },
  patch: () => ({ platformName: uniqName('Station Overflow').slice(0, 50) }),
  patchedField: 'platformName',
  listFilters: ['isActive=true', 'sortBy=PlatformNumber'],
});
