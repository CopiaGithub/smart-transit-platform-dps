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

