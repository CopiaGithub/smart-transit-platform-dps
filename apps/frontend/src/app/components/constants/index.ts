export type InputType = 'text' | 'number' | 'email' | 'password';
export type DropdownModel = {
  name: string;
  value: any;
  isSelected?: boolean;
  icon?: string;
  /** Optional business code from API (e.g. regionCode, stateCode). */
  code?: string;
};

/** Label for dropdown display — shows "code — name" only when code is present. */
export function dropdownDisplayLabel(
  option: Pick<DropdownModel, 'name' | 'code'> | null | undefined,
): string {
  if (!option) return '';
  const code = option.code?.trim();
  if (code) {
    return `${code} — ${option.name}`;
  }
  return option.name ?? '';
}

export type ProductDDAlterUomModel = {
  uomId?: number;
  uomName?: string;
  salesUnit1Id?: number;
  salesUnit1Name?: string;
  bumQty?: string;
  altUOMQty?: string;
};

export type ProductDDModel = {
  id: number;
  materialCode: string;
  description: string;
  uomId: number;
  itemCategoryId?: number;
  itemAlterUOMModels?: ProductDDAlterUomModel[];
  weightUnitId: number;
  grossWeight: number;
  netWeight: number;
  isActive: boolean;
};

export interface ProductListItem {
  SrNo: number;
  Id: number | string;
  ItemId: number | string;
  ProductName: string;
  ProductCode: string;
  Uomid: number | string;
  Buomid: number | string;
  StatusId: string | number;
  IsDeleted: string | boolean | number;
  Poid: number;
  UserId: string | number;
  UomDesc: string;
  BuomDesc: string;
  ExchangeRate: number;
  WarehouseID: number;
  WarehouseName: string;
  PayableToMFPL: number;
  Qty: number;
  ItemPrice: number;
  QuantityInKg?: number;
  dlp?: number;
}

export interface OrgDetailsModel {
  Id?: number;
  Description?: string;
  MobileNo?: string;
  Email?: string;
  Address1?: string;
  Address2?: string;
  CountryID: number;
  StateID: number;
  DistrictId?: number;
  CityId?: number;
  PinCode?: number;
  IsActive?: boolean;
  CityName?: string;
}
