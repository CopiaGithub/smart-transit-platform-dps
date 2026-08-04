import type { APIRequestContext } from '@playwright/test';
import { API } from '../../config/env';
import { expect, skipIfWritesBlocked, test } from '../../fixtures/api.fixture';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { uniqCode, uniqMobile } from '../../helpers/factory';
import { expectFail, expectOk } from '../../helpers/http';

/**
 * The student ↔ parent relationship, which is the whole point of the schema change.
 *
 * Parents are people, stored once, linked to each child. The per-child flags (who is
 * the primary contact, who may collect) live on the mapping precisely because one
 * father can be primary contact for one sibling and only an emergency contact for
 * another. Two database rules back it:
 *
 *   UX_student_parent_mapping_Student_Parent  — a parent links to a child once
 *   UX_student_parent_mapping_OnePrimary      — at most one primary contact per child,
 *                                               filtered on IsPrimaryContact = 1
 *
 * So "set this parent primary" cannot be a plain UPDATE; the service has to demote the
 * incumbent in the same transaction. That demotion is what this suite exists to prove.
 */

const student = (firstName: string) => ({
  admissionNumber: uniqCode('ADM'),
  firstName,
  lastName: 'Testfamily',
  grade: '5',
  division: 'A',
});

const parent = (firstName: string) => ({
  firstName,
  lastName: 'Testfamily',
  mobileNumber: uniqMobile(),
});

async function createId(api: APIRequestContext, entity: string, body: unknown): Promise<number> {
  const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/${entity}`, body);
  const id = field<number>(created, 'Id');
  expect(id, `${entity} create returned no Id`).toBeTruthy();
  return id!;
}

test.describe.serial('student ↔ parent mapping', () => {
  skipIfWritesBlocked();

  let studentId: number;
  let fatherId: number;
  let guardianId: number;
  let fatherMappingId: number;
  let guardianMappingId: number;

  test('a student and two contacts are created', async ({ api }) => {
    studentId = await createId(api, 'StudentMaster', student('Aarav'));
    fatherId = await createId(api, 'ParentMaster', parent('Ramesh'));
    guardianId = await createId(api, 'ParentMaster', parent('Kaka'));
  });

  test('the father is linked as the primary contact', async ({ api }) => {
    fatherMappingId = await createId(api, 'StudentParentMapping', {
      studentId,
      parentId: fatherId,
      relation: 'Father',
      isPrimaryContact: true,
      isEmergencyContact: true,
      isAuthorisedForPickup: true,
      receivesNotifications: true,
      contactPriority: 1,
      isActive: true,
    });

    const row = await expectOk<Record<string, unknown>>(api, 'get', `${API}/StudentParentMapping/${fatherMappingId}`);
    expect(field(row, 'IsPrimaryContact')).toBe(true);
    expect(field(row, 'Relation')).toBe('Father');
    // The list model denormalises both sides so a grid needs one call, not three.
    expect(field(row, 'StudentName')).toBeTruthy();
    expect(field(row, 'ParentName')).toBeTruthy();
  });

  test('a second contact is linked without a primary flag', async ({ api }) => {
    guardianMappingId = await createId(api, 'StudentParentMapping', {
      studentId,
      parentId: guardianId,
      relation: 'Guardian',
      isPrimaryContact: false,
      isEmergencyContact: true,
      isAuthorisedForPickup: true,
      contactPriority: 3,
      isActive: true,
    });
  });

  test('the same parent cannot be linked to the same student twice', async ({ api }) => {
    const e = await expectFail(api, 'post', `${API}/StudentParentMapping`, 400, {
      studentId,
      parentId: fatherId,
      relation: 'Father',
    });
    expect(e.ErrorMessage).toBe('This parent is already linked to this student.');
  });

  test('an unknown relation is rejected with the allowed values', async ({ api }) => {
    const e = await expectFail(api, 'post', `${API}/StudentParentMapping`, 400, {
      studentId,
      parentId: guardianId,
      relation: 'Neighbour',
    });
    expect(e.ErrorMessage).toContain('Relation must be one of');
    expect(e.ErrorMessage).toContain('Guardian');
  });

  test('a link to a non-existent student is rejected', async ({ api }) => {
    const e = await expectFail(api, 'post', `${API}/StudentParentMapping`, 400, {
      studentId: 999999999,
      parentId: fatherId,
      relation: 'Father',
    });
    expect(e.ErrorMessage).toBe('The selected student does not exist.');
  });

  test('promoting the guardian demotes the father in the same step', async ({ api }) => {
    // The invariant. Without the demotion this PATCH would violate
    // UX_student_parent_mapping_OnePrimary and fail at the database — and if the
    // index were ever dropped, the child would silently have two primary contacts.
    await expectOk(api, 'patch', `${API}/StudentParentMapping/${guardianMappingId}`, {
      isPrimaryContact: true,
      contactPriority: 1,
    });

    const guardian = await expectOk<Record<string, unknown>>(
      api,
      'get',
      `${API}/StudentParentMapping/${guardianMappingId}`,
    );
    const father = await expectOk<Record<string, unknown>>(
      api,
      'get',
      `${API}/StudentParentMapping/${fatherMappingId}`,
    );

    expect(field(guardian, 'IsPrimaryContact'), 'the guardian was not promoted').toBe(true);
    expect(field(father, 'IsPrimaryContact'), 'the father was not demoted — two primaries').toBe(false);
  });

  test('GET StudentMaster/{id}/parents lists both contacts, primary first', async ({ api }) => {
    const contacts = await expectOk<Record<string, unknown>[]>(
      api,
      'get',
      `${API}/StudentMaster/${studentId}/parents`,
    );

    expect(contacts).toHaveLength(2);
    expect(field(contacts[0], 'IsPrimaryContact'), 'the primary contact must sort first').toBe(true);
    expect(field(contacts[0], 'ParentId')).toBe(guardianId);
    expect(field(contacts[0], 'MobileNumber'), 'the contact list must carry a number to ring').toBeTruthy();
  });

  test('GET ParentMaster/{id}/children lists the child with its transport details', async ({ api }) => {
    const children = await expectOk<Record<string, unknown>[]>(
      api,
      'get',
      `${API}/ParentMaster/${fatherId}/children`,
    );

    expect(children).toHaveLength(1);
    expect(field(children[0], 'StudentId')).toBe(studentId);
    expect(field(children[0], 'Relation')).toBe('Father');
    expect(field(children[0], 'Class'), 'the parent app shows the class on this screen').toBeTruthy();
  });

  test('the sibling case: one parent, two children', async ({ api }) => {
    // The reason parents were split into their own table. One father, three children,
    // one phone number to keep current.
    const siblingId = await createId(api, 'StudentMaster', student('Diya'));
    await createId(api, 'StudentParentMapping', {
      studentId: siblingId,
      parentId: fatherId,
      relation: 'Father',
      isPrimaryContact: true,
      contactPriority: 1,
    });

    const children = await expectOk<Record<string, unknown>[]>(
      api,
      'get',
      `${API}/ParentMaster/${fatherId}/children`,
    );
    expect(children, 'the father should now list two children').toHaveLength(2);

    // Primary for the sibling, demoted for the first child — the per-child flags the
    // mapping table exists to hold.
    const bySibling = children.find((c) => field(c, 'StudentId') === siblingId);
    const byFirst = children.find((c) => field(c, 'StudentId') === studentId);
    expect(field(bySibling, 'IsPrimaryContact')).toBe(true);
    expect(field(byFirst, 'IsPrimaryContact')).toBe(false);

    await expectOk(api, 'delete', `${API}/StudentMaster/${siblingId}`);
  });

  test('the mapping list can be filtered by student and by parent', async ({ api }) => {
    const byStudent = await expectOk<PagedResult>(
      api,
      'get',
      `${API}/StudentParentMapping?pageNumber=1&pageSize=100&studentId=${studentId}`,
    );
    expect(items(byStudent)).toHaveLength(2);

    const byParent = await expectOk<PagedResult>(
      api,
      'get',
      `${API}/StudentParentMapping?pageNumber=1&pageSize=100&parentId=${fatherId}`,
    );
    expect(items(byParent).length).toBeGreaterThanOrEqual(1);
  });

  test('deleting a link removes it from the student without touching the parent', async ({ api }) => {
    await expectOk(api, 'delete', `${API}/StudentParentMapping/${fatherMappingId}`);

    const contacts = await expectOk<Record<string, unknown>[]>(
      api,
      'get',
      `${API}/StudentMaster/${studentId}/parents`,
    );
    expect(contacts).toHaveLength(1);

    // The person still exists — only the relationship went away.
    await expectOk(api, 'get', `${API}/ParentMaster/${fatherId}`);
  });

  test('deleting the student soft-deletes its remaining mappings too', async ({ api }) => {
    await expectOk(api, 'delete', `${API}/StudentMaster/${studentId}`);

    await expectFail(api, 'get', `${API}/StudentParentMapping/${guardianMappingId}`, 404);
    // The guardian is a person in their own right and must survive the child leaving.
    const guardian = await expectOk<Record<string, unknown>>(api, 'get', `${API}/ParentMaster/${guardianId}`);
    expect(field(guardian, 'ChildrenCount'), 'the childrenCount should have dropped to 0').toBe(0);
  });

  test('the parents are removed', async ({ api }) => {
    await expectOk(api, 'delete', `${API}/ParentMaster/${fatherId}`);
    await expectOk(api, 'delete', `${API}/ParentMaster/${guardianId}`);
  });
});

test.describe('StudentParentMapping reads', () => {
  test('the seeded links are listed with both sides denormalised', async ({ api }) => {
    const page = await expectOk<PagedResult>(api, 'get', `${API}/StudentParentMapping?pageNumber=1&pageSize=100`);
    const rows = items<Record<string, unknown>>(page);
    expect(rows.length, 'the seeder creates 8 student-parent links').toBeGreaterThan(0);

    for (const row of rows) {
      expect(field(row, 'StudentName'), `mapping ${field(row, 'Id')} has no student name`).toBeTruthy();
      expect(field(row, 'ParentName'), `mapping ${field(row, 'Id')} has no parent name`).toBeTruthy();
      expect(field(row, 'MobileNumber'), `mapping ${field(row, 'Id')} has no mobile number`).toBeTruthy();
    }
  });

  test('no seeded student has two primary contacts', async ({ api }) => {
    const page = await expectOk<PagedResult>(api, 'get', `${API}/StudentParentMapping?pageNumber=1&pageSize=200`);
    const primaries = new Map<unknown, number>();

    for (const row of items<Record<string, unknown>>(page)) {
      if (field(row, 'IsPrimaryContact') !== true) continue;
      const sid = field(row, 'StudentId');
      primaries.set(sid, (primaries.get(sid) ?? 0) + 1);
    }

    for (const [sid, count] of primaries) {
      expect(count, `student ${sid} has ${count} primary contacts`).toBe(1);
    }
  });
});
