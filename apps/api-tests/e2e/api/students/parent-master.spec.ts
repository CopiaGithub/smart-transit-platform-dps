import { API } from '../../config/env';
import { expect, skipIfWritesBlocked, test } from '../../fixtures/api.fixture';
import { runCrudSuite } from '../../helpers/crud';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { uniqMobile } from '../../helpers/factory';
import { expectFail, expectOk } from '../../helpers/http';

runCrudSuite({
  entity: 'ParentMaster',
  create: () => ({
    firstName: 'Suresh',
    middleName: null,
    lastName: 'Joshi',
    // MobileNumber is the parent's identity and the app's login lookup, so it is
    // uniquely indexed. Generated well clear of the seeded 98210045xx block.
    mobileNumber: uniqMobile(),
    altMobileNumber: null,
    email: 'suresh.joshi@example.test',
    occupation: 'Engineer',
    addressLine1: 'Sector 17, Vashi',
    cityId: null,
    stateId: null,
    pinCodeId: null,
    idProofType: 'Aadhaar',
    idProofNumber: 'XXXX-XXXX-1234',
    isWhatsAppEnabled: true,
    isSmsEnabled: true,
    isActive: true,
  }),
  patch: () => ({ occupation: 'Architect' }),
  patchedField: 'occupation',
  listFilters: ['isActive=true', 'searchTerm=Joshi'],
});

test.describe('ParentMaster by-mobile', () => {
  test('a seeded parent can be found by mobile — the parent app login path', async ({ api }) => {
    // Find a real mobile from the list rather than hardcoding one, so the test does
    // not break the day the seed data changes.
    const page = await expectOk<PagedResult>(api, 'get', `${API}/ParentMaster?pageNumber=1&pageSize=25`);
    const rows = items<Record<string, unknown>>(page);
    expect(rows.length, 'the seeder creates 6 parents').toBeGreaterThan(0);

    const parent = rows[0]!;
    const mobile = String(field(parent, 'MobileNumber'));

    const found = await expectOk<Record<string, unknown>>(api, 'get', `${API}/ParentMaster/by-mobile/${mobile}`);
    expect(field(found, 'Id')).toBe(field(parent, 'Id'));
  });

  test('an unknown mobile returns 404', async ({ api }) => {
    const e = await expectFail(api, 'get', `${API}/ParentMaster/by-mobile/0000000000`, 404);
    expect(e.ErrorMessage).toBe('Parent not found.');
  });
});

test.describe('ParentMaster validation', () => {
  skipIfWritesBlocked();

  test('a duplicate mobile number is rejected', async ({ api }) => {
    const mobileNumber = uniqMobile();
    const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/ParentMaster`, {
      firstName: 'First',
      lastName: 'Parent',
      mobileNumber,
    });

    const e = await expectFail(api, 'post', `${API}/ParentMaster`, 400, {
      firstName: 'Second',
      lastName: 'Parent',
      mobileNumber,
    });
    expect(e.ErrorMessage).toBe('A parent with this mobile number already exists.');

    await expectOk(api, 'delete', `${API}/ParentMaster/${field(created, 'Id')}`);
  });

  test('a missing mobile number is rejected', async ({ api }) => {
    const e = await expectFail(api, 'post', `${API}/ParentMaster`, 400, {
      firstName: 'No',
      lastName: 'Mobile',
    });
    expect(e.ErrorMessage).toBe('Mobile number is required.');
  });

  test('a missing name is rejected', async ({ api }) => {
    const e = await expectFail(api, 'post', `${API}/ParentMaster`, 400, { mobileNumber: uniqMobile() });
    expect(e.ErrorMessage).toBe('First name and last name are required.');
  });
});
