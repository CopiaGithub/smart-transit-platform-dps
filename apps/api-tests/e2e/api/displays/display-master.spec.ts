import { API } from '../../config/env';
import { expect, skipIfWritesBlocked, test } from '../../fixtures/api.fixture';
import { runCrudSuite } from '../../helpers/crud';
import { field, items, type PagedResult } from '../../helpers/envelope';
import { uniqCode, uniqName } from '../../helpers/factory';
import { call, expectFail, expectOk } from '../../helpers/http';

runCrudSuite({
  entity: 'DisplayMaster',
  create: () => ({
    displayCode: uniqCode('IND'),
    displayName: uniqName('Indoor Video Wall'),
    displayType: 'Indoor',
    // GateId / FilterByGateId left null so the suite does not depend on a seeded gate.
    gateId: null,
    location: 'School building exit',
    ipAddress: '192.168.1.23',
    screenSize: '4x6',
    widthPx: 1920,
    heightPx: 1080,
    visibleRowCount: 12,
    filterByGateId: null,
    isActive: true,
  }),
  patch: () => ({ ipAddress: '192.168.1.24', visibleRowCount: 15 }),
  patchedField: 'ipAddress',
  listFilters: ['displayType=Indoor', 'isActive=true'],
});

test.describe('DisplayMaster validation', () => {
  skipIfWritesBlocked();

  test('an unknown display type is rejected with the allowed values', async ({ api }) => {
    const e = await expectFail(api, 'post', `${API}/DisplayMaster`, 400, {
      displayCode: uniqCode('BAD'),
      displayName: uniqName('Bad Panel'),
      displayType: 'Holographic',
    });
    expect(e.ErrorMessage, 'the error should name the valid types').toContain('Display type must be one of');
  });

  test('a duplicate display code is rejected rather than silently accepted', async ({ api }) => {
    // UX_display_master_DisplayCode is unique and filtered on IsDeleted = 0. The
    // service checks first so the caller gets a sentence instead of a SQL exception.
    const code = uniqCode('DUP');
    const body = { displayCode: code, displayName: uniqName('First Panel'), displayType: 'Indoor' };

    const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/DisplayMaster`, body);

    const e = await expectFail(api, 'post', `${API}/DisplayMaster`, 400, {
      ...body,
      displayName: uniqName('Second Panel'),
    });
    expect(e.ErrorMessage).toContain('already exists');

    await expectOk(api, 'delete', `${API}/DisplayMaster/${field(created, 'Id')}`);
  });

  test('a missing display code is rejected', async ({ api }) => {
    await expectFail(api, 'post', `${API}/DisplayMaster`, 400, {
      displayName: uniqName('Nameless Panel'),
      displayType: 'Indoor',
    });
  });
});

test.describe.serial('DisplayMaster heartbeat', () => {
  skipIfWritesBlocked();

  let code: string;
  let id: number;

  test('a new panel starts Unknown', async ({ api }) => {
    code = uniqCode('HB');
    const created = await expectOk<Record<string, unknown>>(api, 'post', `${API}/DisplayMaster`, {
      displayCode: code,
      displayName: uniqName('Heartbeat Panel'),
      displayType: 'Outdoor',
    });
    id = field<number>(created, 'Id')!;
    expect(field(created, 'ConnectionStatus')).toBe('Unknown');
  });

  test('the panel reports in without a token and flips to Online', async ({ anon, api }) => {
    // [AllowAnonymous] on purpose: the LED panels are unattended devices on the wired
    // LAN with no credentials to present.
    const beat = await call(anon, 'post', `${API}/DisplayMaster/${code}/heartbeat`);
    expect(beat.http, beat.where).toBe(200);
    expect(beat.env.Success, beat.where).toBe(true);

    const row = await expectOk<Record<string, unknown>>(api, 'get', `${API}/DisplayMaster/${id}`);
    expect(field(row, 'ConnectionStatus'), 'a heartbeat should bring the panel Online').toBe('Online');
    expect(field(row, 'LastHeartbeatAt'), 'LastHeartbeatAt was not stamped').toBeTruthy();
  });

  test('a heartbeat from an unknown code is a 404 envelope, not a new row', async ({ anon }) => {
    await expectFail(anon, 'post', `${API}/DisplayMaster/NO-SUCH-PANEL/heartbeat`, 404);
  });

  test('the panel is removed', async ({ api }) => {
    await expectOk(api, 'delete', `${API}/DisplayMaster/${id}`);
  });
});

test.describe('DisplayMaster reads', () => {
  test('the seeded walls are listed with a connection status', async ({ api }) => {
    // Three panels: an 8x8 outdoor at Gate 6 and a 4x6 indoor at each student exit.
    const page = await expectOk<PagedResult>(api, 'get', `${API}/DisplayMaster?pageNumber=1&pageSize=100`);
    const rows = items<Record<string, unknown>>(page);

    expect(rows.length).toBeGreaterThanOrEqual(3);
    for (const row of rows) {
      expect(
        ['Online', 'Offline', 'Unknown'],
        `display ${field(row, 'DisplayCode')} has status ${field(row, 'ConnectionStatus')}`,
      ).toContain(field(row, 'ConnectionStatus'));
    }
  });
});
