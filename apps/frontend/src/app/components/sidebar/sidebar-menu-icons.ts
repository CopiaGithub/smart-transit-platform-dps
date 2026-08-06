/** Ligature names for Angular Material Icons (`<mat-icon>`). */
const GENERIC_MATERIAL_ICONS = new Set([
  'description',
  'article',
  'folder',
  'menu',
  'insert_drive_file',
  'note',
  '',
]);

/** Fallback colour for any menu item that does not match a rule. */
const DEFAULT_ICON_COLOR = '#64748b';

/**
 * First matching rule wins. Uses menu label + route so API-only titles still map well.
 * `color` gives each entry a distinct, meaningful accent so the sidebar reads at a glance.
 */
const MENU_ICON_RULES: { re: RegExp; icon: string; color: string }[] = [
  // ── Dashboard / broadcast ────────────────────────────────────────────────
  { re: /dashboard|dms-dashboard/i, icon: 'space_dashboard', color: '#4f46e5' },
  { re: /broadcast|dashboard.?message/i, icon: 'campaign', color: '#db2777' },

  // ── Geography › Geography-1 ──────────────────────────────────────────────
  { re: /region[- ]?master|\/master\/region/i, icon: 'public', color: '#059669' },
  { re: /state[- ]?master|state-district|\/master\/state/i, icon: 'flag', color: '#0d9488' },
  { re: /city[- ]?master|\/master\/city/i, icon: 'location_city', color: '#0891b2' },
  { re: /functional[- ]?team/i, icon: 'diversity_3', color: '#7c3aed' },
  { re: /store[- ]?master|store-list|warehouse-master/i, icon: 'storefront', color: '#ea580c' },
  { re: /sales[- ]?territory|territory master/i, icon: 'travel_explore', color: '#0284c7' },

  // ── Geography › Geography-2 ──────────────────────────────────────────────
  { re: /sales[- ]?org/i, icon: 'corporate_fare', color: '#2563eb' },
  { re: /partner[- ]?channel|distribution-channel/i, icon: 'hub', color: '#0e7490' },
  { re: /\bdivision\b/i, icon: 'account_tree', color: '#9333ea' },
  { re: /partner[- ]?type|distributor[- ]?type/i, icon: 'category', color: '#c026d3' },
  { re: /partner[- ]?group|distributor[- ]?group/i, icon: 'group_work', color: '#7c3aed' },
  { re: /(partner|distributor)[- ]?segment\s*1|segment[- ]?1/i, icon: 'pie_chart', color: '#e11d48' },
  { re: /(partner|distributor)[- ]?segment\s*2|segment[- ]?2|segment\d/i, icon: 'donut_large', color: '#be123c' },

  // ── Partner family ───────────────────────────────────────────────────────
  { re: /partner[- ]?onboarding|onboarding/i, icon: 'person_add', color: '#0d9488' },
  { re: /partner[- ]?setup/i, icon: 'handshake', color: '#0891b2' },
  { re: /partner[- ]?master[- ]?data|partner data/i, icon: 'dataset', color: '#6d28d9' },
  { re: /partner.?product/i, icon: 'shopping_bag', color: '#d97706' },
  { re: /\bp[-\s]*customers?\b|partner.?customer/i, icon: 'contacts', color: '#2563eb' },
  { re: /\bp[-\s]*suppliers?\b|partner.?supplier/i, icon: 'business', color: '#0d9488' },
  { re: /\bpartners\b/i, icon: 'groups', color: '#7c3aed' },
  { re: /\blocation\b/i, icon: 'place', color: '#059669' },

  // ── Payments ─────────────────────────────────────────────────────────────
  { re: /payment.?approval/i, icon: 'fact_check', color: '#15803d' },
  { re: /payment.?due|due[- ]?list/i, icon: 'event_busy', color: '#d97706' },
  { re: /supplier[- ]?payment.?list/i, icon: 'receipt_long', color: '#2563eb' },
  { re: /supplier[- ]?payment/i, icon: 'account_balance_wallet', color: '#0d9488' },
  { re: /principal[- ]?payment.?list/i, icon: 'receipt_long', color: '#2563eb' },
  { re: /principal[- ]?payment/i, icon: 'account_balance', color: '#4338ca' },
  { re: /\bpayments?\b/i, icon: 'payments', color: '#16a34a' },

  // ── Inventory / stock ────────────────────────────────────────────────────
  { re: /stock.?list/i, icon: 'inventory', color: '#d97706' },
  { re: /stock.?movement/i, icon: 'sync_alt', color: '#2563eb' },
  { re: /stock.?disposition|scrap/i, icon: 'delete_sweep', color: '#dc2626' },
  { re: /good.?receipt|stock.?in.?transit/i, icon: 'local_shipping', color: '#0d9488' },
  { re: /item.?to.?item.?transfer.?report/i, icon: 'assessment', color: '#4338ca' },
  { re: /item.?to.?item.?transfer/i, icon: 'compare_arrows', color: '#9333ea' },
  { re: /transfer.?document.?report/i, icon: 'summarize', color: '#4338ca' },
  { re: /transfer.?document/i, icon: 'swap_horiz', color: '#0284c7' },
  { re: /physical-inventory|stock-variance/i, icon: 'warehouse', color: '#d97706' },
  { re: /\binventory\b/i, icon: 'inventory_2', color: '#d97706' },

  // ── Purchasing / invoices / picking ──────────────────────────────────────
  { re: /principal[- ]?invo/i, icon: 'request_quote', color: '#9333ea' },
  { re: /supplier[- ]?invoic/i, icon: 'receipt', color: '#0d9488' },
  { re: /p[- ]?invoice.?list/i, icon: 'featured_play_list', color: '#4338ca' },
  { re: /p[- ]?invoices?\b/i, icon: 'receipt_long', color: '#2563eb' },
  { re: /purchase[- ]?invoice/i, icon: 'receipt', color: '#dc2626' },
  { re: /sales[- ]?invoice/i, icon: 'receipt_long', color: '#2563eb' },
  { re: /vendor[- ]?invoice/i, icon: 'receipt', color: '#0d9488' },
  { re: /\bvouchers?\b/i, icon: 'receipt_long', color: '#4338ca' },
  { re: /purchasing|purchase[- ]?order|purchase\b/i, icon: 'add_shopping_cart', color: '#ea580c' },
  { re: /picking|pick[- ]?list/i, icon: 'checklist', color: '#b45309' },

  // ── Packing ──────────────────────────────────────────────────────────────
  { re: /packing.?list/i, icon: 'format_list_bulleted', color: '#2563eb' },
  { re: /multi.?level.*packing/i, icon: 'layers', color: '#4338ca' },
  { re: /pu.?packing.*w\/?o.?ref|packing.*w\/?o ref/i, icon: 'layers_clear', color: '#9333ea' },
  { re: /pu.?packing/i, icon: 'widgets', color: '#7c3aed' },
  { re: /delivery.?packing/i, icon: 'local_mall', color: '#2563eb' },
  { re: /\bpacking\b/i, icon: 'archive', color: '#0d9488' },

  // ── Post Goods Issue (PGI) ───────────────────────────────────────────────
  { re: /pgi.?list/i, icon: 'format_list_bulleted', color: '#2563eb' },
  { re: /post.?goods.?issue|\bpgi\b/i, icon: 'outbox', color: '#ea580c' },

  // ── Finance ──────────────────────────────────────────────────────────────
  {
    re: /finance|chart.?of.?accounts|gl[- ]?master|gl[- ]?group|gl[- ]?sub|cost[- ]?center|bank[- ]?master|bank[- ]?setup|create[- ]?bank/i,
    icon: 'savings',
    color: '#15803d',
  },

  // ── Manufacturing / production ───────────────────────────────────────────
  { re: /\bbom\b|bill.?of.?material/i, icon: 'account_tree', color: '#7c3aed' },
  { re: /\brouting/i, icon: 'fork_right', color: '#0e7490' },
  { re: /work.?cent|\bwc[- ]?list|wc[- ]?prodline|prod.?line/i, icon: 'hub', color: '#0891b2' },
  { re: /production|prod[- ]?order/i, icon: 'precision_manufacturing', color: '#475569' },
  {
    re: /process.?stage|standard.?operation|labour|parameter.?control|workdone|skill.?master|soc[- ]?tranx|consumable|tools.?tranx/i,
    icon: 'factory',
    color: '#64748b',
  },
  { re: /mat.?req|material.?req|good.?issue|goods.?issue/i, icon: 'outbox', color: '#ea580c' },
  { re: /\bshift\b/i, icon: 'schedule', color: '#16a34a' },
  { re: /\bcomponent\b/i, icon: 'category', color: '#c026d3' },

  // ── Sales sub-items / misc ───────────────────────────────────────────────
  { re: /secondary[- ]?invoice/i, icon: 'receipt_long', color: '#2563eb' },
  { re: /secondary[- ]?customer|distributor.?secondary/i, icon: 'group_add', color: '#0891b2' },
  { re: /\bdelivery\b/i, icon: 'local_shipping', color: '#0284c7' },
  { re: /\bcollections?\b/i, icon: 'paid', color: '#16a34a' },

  // ── Geography (parent / catch-all) ───────────────────────────────────────
  {
    re: /geography|geo master|sales-territory|\/master\/region|\/master\/city|\/master\/state-district/i,
    icon: 'map',
    color: '#059669',
  },

  // ── People / users ───────────────────────────────────────────────────────
  {
    re: /access-control|user-master|role-master|role-assignment|designation|user-profile|onroll|offroll|\busers?\b/i,
    icon: 'people',
    color: '#2563eb',
  },
  { re: /customer-configuration|customer-group|customer-type|customer attribute|industry-type|cust /i, icon: 'badge', color: '#9333ea' },

  // ── Activities / sales ───────────────────────────────────────────────────
  { re: /sales[- ]?activit/i, icon: 'point_of_sale', color: '#0284c7' },
  { re: /activit/i, icon: 'event_note', color: '#ea580c' },
  { re: /\bsales\b/i, icon: 'trending_up', color: '#0284c7' },

  // ── Leave / attendance / tour ────────────────────────────────────────────
  { re: /leave-management|leave-application|leave-configuration|compansatory|holiday|assign-leave|leave/i, icon: 'event_available', color: '#16a34a' },
  { re: /attendance/i, icon: 'how_to_reg', color: '#c2410c' },
  { re: /tour[- ]?plan|tour-|lodging|transport|entitlement|food limit/i, icon: 'route', color: '#0d9488' },

  // ── SKU / products ───────────────────────────────────────────────────────
  { re: /sku[- ]?master|sku-/i, icon: 'qr_code_2', color: '#d97706' },
  {
    re: /product-hierarchy|product[- ]master|slob|principal-product|product allocation/i,
    icon: 'inventory_2',
    color: '#d97706',
  },

  // ── Pricing / discounts ──────────────────────────────────────────────────
  { re: /discount|mfpl-discount/i, icon: 'sell', color: '#e11d48' },
  { re: /pricing|mrp|partner.?price|margin|list price/i, icon: 'payments', color: '#16a34a' },

  // ── Lead & quotation / claims / accounts ─────────────────────────────────
  { re: /lead|quotation|purchase|sales order/i, icon: 'request_quote', color: '#dc2626' },
  { re: /distributor[- ]?claim|claim/i, icon: 'assignment_return', color: '#b45309' },
  { re: /accounts\/|debit-memo|credit-memo|cheque-receipt|payment-notification|ar-payment/i, icon: 'account_balance', color: '#0f766e' },

  // ── Bulk data / reports / approvals ──────────────────────────────────────
  {
    re: /bulk|po upload|user upload|quick sale|stock upload|uploading|upload-download|download-data|upload-quick-sales|invoice-upload|account-statement|principal-product-master|discount upload|\/upload/i,
    icon: 'cloud_upload',
    color: '#475569',
  },
  { re: /report|primary-sales|insights|analytics/i, icon: 'insights', color: '#4338ca' },
  { re: /approval/i, icon: 'fact_check', color: '#15803d' },

  // ── Other masters / config ───────────────────────────────────────────────
  { re: /expense-configuration|expense-management|receipt/i, icon: 'receipt_long', color: '#b45309' },
  {
    re: /dealer-master|distributor-report|\/master\/dealer/i,
    icon: 'storefront',
    color: '#ea580c',
  },
  { re: /configuration\/|no-ranges|reason-master|uom-master|delegation|dealer-product-allocation/i, icon: 'settings', color: '#64748b' },
  { re: /task-management|\/tasks\b/i, icon: 'task_alt', color: '#16a34a' },
  { re: /physical-inventory|stock-variance/i, icon: 'warehouse', color: '#d97706' },
  { re: /\bmaster\b/i, icon: 'dataset', color: '#6d28d9' },
];

function matchRule(item: {
  name?: string | null;
  route?: string | null;
}): { icon: string; color: string } | null {
  const blob = `${item.name ?? ''} ${item.route ?? ''}`;
  for (const rule of MENU_ICON_RULES) {
    if (rule.re.test(blob)) return rule;
  }
  return null;
}

export function resolveSidebarMenuIcon(item: {
  name?: string | null;
  route?: string | null;
  icon?: string | null;
}): string {
  const existing = String(item.icon ?? '').trim();
  const ex = existing.toLowerCase();
  if (ex && !GENERIC_MATERIAL_ICONS.has(ex)) {
    return existing;
  }
  return matchRule(item)?.icon ?? 'list_alt';
}

/** Accent colour that pairs with the resolved icon for this menu item. */
export function resolveSidebarMenuIconColor(item: {
  name?: string | null;
  route?: string | null;
}): string {
  return matchRule(item)?.color ?? DEFAULT_ICON_COLOR;
}
