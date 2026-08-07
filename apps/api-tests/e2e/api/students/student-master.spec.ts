import { API } from '../../config/env';
import { expect, skipIfWritesBlocked, test } from '../../fixtures/api.fixture';
import { runCrudSuite } from '../../helpers/crud';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { uniqCode } from '../../helpers/factory';
import { expectFail, expectOk } from '../../helpers/http';

runCrudSuite({
  entity: 'StudentMaster',
  create: () => ({
    admissionNumber: uniqCode('ADM'),
    firstName: 'Neha',
    // The seeded data deliberately includes a student with no middle name; this one has one.
    middleName: 'Suresh',
    lastName: 'Joshi',
    grade: '6',
    division: 'A',
    // AcademicYearId omitted on purpose: the service falls back to the current year,
    // which is the path the admissions screen actually uses.
    busId: null,
    routeId: null,
    exitGateId: null,
    pickupStop: 'Vashi Sector 17 Bus Stop',
    dropStop: 'Vashi Sector 17 Bus Stop',
    rfidTag: null,
    usesTransport: true,
    isActive: true,
  }),
  patch: () => ({ division: 'B' }),
  patchedField: 'division',
  listFilters: ['grade=6', 'division=A', 'isActive=true', 'academicYearId=1', 'busId=1', 'exitGateId=3'],
});

test.describe('StudentMaster reads', () => {
  test('the list projects the derived name and class fields', async ({ api }) => {
    const page = await expectOk<PagedResult>(api, 'get', `${API}/StudentMaster?pageNumber=1&pageSize=25`);
    const rows = items<Record<string, unknown>>(page);
    expect(rows.length, 'the seeder creates 6 students').toBeGreaterThan(0);

    const first = rows[0]!;
    expect(field(first, 'FullName'), 'FullName is what the LED board and app render').toBeTruthy();
    expect(field(first, 'Class'), 'Class is Grade + Division, precomputed for the client').toBeTruthy();
    expect(typeof field(first, 'ParentCount')).toBe('number');
  });

  test('a student with no bus is represented, not hidden', async ({ api }) => {
    // The seed deliberately includes a child who comes by private transport. A list
    // that silently dropped them would break the "who is still inside" headcount.
    const page = await expectOk<PagedResult>(api, 'get', `${API}/StudentMaster?pageNumber=1&pageSize=100`);
    const rows = items<Record<string, unknown>>(page);
    expect(rows.some((r) => field(r, 'UsesTransport') === false || field(r, 'BusId') === null)).toBe(true);
  });
});

test.describe('StudentMaster by-rfid', () => {
  test('an unassigned tag returns 404, not an empty success', async ({ api }) => {
    const e = await expectFail(api, 'get', `${API}/StudentMaster/by-rfid/NO-SUCH-TAG`, 404);
    expect(e.ErrorMessage).toBe('No student is linked to this RFID tag.');
  });
});

test.describe.serial('StudentMaster RFID assignment', () => {
  // The hook for the RFID phase: a card scan has to resolve to exactly one student.
  skipIfWritesBlocked();

  let id: number;
  let tag: string;

  test('a tag can be assigned and then scanned back', async ({ api }) => {
    tag = uniqCode('RFID');
    const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/StudentMaster`, {
      admissionNumber: uniqCode('ADM'),
      firstName: 'Rfid',
      lastName: 'Tester',
      grade: '7',
      division: 'C',
    });
    id = field<number>(created, 'Id')!;

    await expectOk(api, 'patch', `${API}/StudentMaster/${id}`, { rfidTag: tag });

    const scanned = await expectOk<Record<string, unknown>>(api, 'get', `${API}/StudentMaster/by-rfid/${tag}`);
    expect(field(scanned, 'Id'), 'the scan resolved to a different student').toBe(id);
  });

  test('the same tag cannot be handed to a second student', async ({ api }) => {
    // UX_student_master_RfidTag is unique and filtered on IsDeleted = 0 — a card that
    // resolved to two children would be worse than one that resolved to none.
    const other = await expectOk<Record<string, unknown>>(api, 'post', `${API}/StudentMaster`, {
      admissionNumber: uniqCode('ADM'),
      firstName: 'Second',
      lastName: 'Tester',
      grade: '7',
      division: 'C',
    });
    const otherId = field<number>(other, 'Id')!;

    const e = await expectFail(api, 'patch', `${API}/StudentMaster/${otherId}`, 400, { rfidTag: tag });
    expect(e.ErrorMessage).toBe('This RFID tag is already assigned to another student.');

    await expectOk(api, 'delete', `${API}/StudentMaster/${otherId}`);
  });

  test('the tagged student is removed', async ({ api }) => {
    await expectOk(api, 'delete', `${API}/StudentMaster/${id}`);
  });
});

test.describe('StudentMaster validation', () => {
  skipIfWritesBlocked();

  test('a duplicate admission number in the same year is rejected', async ({ api }) => {
    const admissionNumber = uniqCode('ADM');
    const body = { admissionNumber, firstName: 'Dup', lastName: 'Student', grade: '5', division: 'A' };

    const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/StudentMaster`, body);

    const e = await expectFail(api, 'post', `${API}/StudentMaster`, 400, body);
    expect(e.ErrorMessage).toContain('admission number');

    await expectOk(api, 'delete', `${API}/StudentMaster/${field(created, 'Id')}`);
  });
});
