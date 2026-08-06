import {
  Component,
  ContentChildren,
  EventEmitter,
  Input,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// âœ… Add this interface here
export interface PunchHeader {
  key: string;
  label: string;
  type?: 'text' | 'image' | 'checkbox'; // optional and type-safe
}

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, FormsModule],
  styleUrls: ['./table.component.css'],
})
export class TableComponent implements OnInit {
  @Input() headers: {
    key: string;
    label: string;
    type?: string;
    options?: any[];
    width?: string; // e.g. '200px' or '15%' - caps the column width
    truncate?: boolean; // ellipsis + native tooltip, value hidden beyond one line
    wrap?: boolean; // wraps long text onto multiple lines instead of clipping it
  }[] = [];
  @Input() pageReset: number = 0;
  private lastPageReset = 0;
  @Input() data: any[] = [];
  @Input() itemsPerPage = 25;
  @Input() addContacts = false;
  @Input() canDelete?: (row: any) => boolean;
  // Action visibility flags
  @Input() showEditAction = false;
  @Input() showDeleteAction = false;
  @Input() showViewAction = false;
  @Input() showDownloadAction = false;
  @Input() showCheckboxes = false;
  @Input() showPagination = true;
  @Input() showToRecords = false;
  @Input() preSelectedKey: string = '';
  @Output() pdfDownload = new EventEmitter<any>();
  @Input() footerRow: any | null = null;
  PdfDownload(row?: any) {
    this.pdfDownload.emit(row);
  }

  compareFn(o1: any, o2: any): boolean {
    return o1 === o2;
  }
  // Custom action templates
  @ContentChildren(TemplateRef) templates!: QueryList<TemplateRef<any>>;

  @Input() customActionsTemplate: TemplateRef<any> | null = null;
  @Input() headers2: { key: string; label: string; type?: string }[] = [];
  @Input() headers3: { key: string; label: string; type?: string }[] = [];
  @Input() data2: any[] = [];
  // Action routes or handlers
  @Input() editRoute: string = '';

  // Style customization inputs
  @Input() tableHeight: string = '300px'; // Empty for auto height
  @Input() containerClass: string = 'w-full p-0 mt-2';
  @Input() tableClass: string =
    'w-full table-auto border-collapse border border-gray-300';
  @Input() theadClass: string = 'bg-blue-100';
  @Input() paginationClass: string =
    'flex justify-end items-center mt-2 gap-4 mr-3';
  @Input() fixedHeader: boolean = true;
  @Input() enableHorizontalScroll: boolean = false;
  @Input() rowHoverClass: string = 'hover:bg-gray-100';
  @Input() selectedRowClass: string = 'bg-blue-50';
  @Input() clickedRowClass: string = 'bg-gray-100';
  @Input() stripedRows: boolean = false;
  @Input() showCustomAction = false;
  @Input() customActionLabel = 'Action';
  @Input() customActionClass = 'text-purple-600 hover:text-purple-800';
  @Output() viewAccessories = new EventEmitter<any>();
  // table.component.ts
  @Input() showPdfDownloadButton = false; // to toggle the button
  // event to parent

  // Events
  @Output() edit = new EventEmitter<any>();
  @Output() view = new EventEmitter<any>();
  @Output() delete = new EventEmitter<any>();
  @Output() download = new EventEmitter<any>();
  @Output() editAccessory = new EventEmitter<any>();
  @Output() deleteAccessory = new EventEmitter<any>();
  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() cellValueChange = new EventEmitter<any>();
  @Output() onAddContact = new EventEmitter<any>();
  @Output() onAddItem = new EventEmitter<any>();
  @Output() customAction = new EventEmitter<any>();
  @Output() tableValueChange = new EventEmitter<any[]>();
  @Output() onNext = new EventEmitter<any>();
  @Output() onPrevious = new EventEmitter<any>();
  @Input() isServerSidePagination: boolean = false;
  @Input() totalRecords: number = 0;

  emitTableChange() {
    // debounce rapid consecutive changes so parent sees a single update
    this.debouncedEmit();
  }
  shouldShowCell(header: any, row: any): boolean {
    if (header.key === 'gstPercent' || header.key === 'hsnCode') {
      const val = row['gstApplicable'];
      const normalized =
        val !== null &&
        val !== undefined &&
        typeof val === 'object' &&
        'value' in val
          ? val.value
          : val;
      return normalized === 'Yes';
    }
    return true;
  }

  onDynamicAdd(row: any, type: string, event: Event) {
    event.stopPropagation();

    if (type === 'accessories') {
      this.onAddItem.emit(row);
    }

    if (type === 'discountPopup') {
      this.customAction.emit({
        action: 'discount',
        row: row,
      });
    }
  }

  private emitTimer: any = null;
  private debouncedEmit(delay = 0) {
    if (this.emitTimer) {
      clearTimeout(this.emitTimer);
    }
    this.emitTimer = setTimeout(() => {
      this.tableValueChange.emit(this.data);
      this.emitTimer = null;
    }, delay);
  }
  showAttachmentModal = false;
  currentAttachmentImages: string[] = [];
  currentAttachmentTitle = '';

  clickedRows = new Set<any>();
  currentPage = 1;
  totalPages = 1;
  selectedRows = new Set<any>();
  allSelected = false;
  @Input() selectionKey?: string;
  @Input() selectedIds: any[] = [];
  selectedRowIds = new Set<any>();
  getNextHeaders(level: number) {
    if (level === 1) return this.headers2;
    if (level === 2) return this.headers3;
    return this.headers2;
  }
  // tableId is used to identify the table and action like edit, delete, view, etc.
  @Input() tableId: string = '';
  // punchHeaders = [
  //   { key: 'inTime', label: 'In Time' },
  //   { key: 'outTime', label: 'Out Time' },
  //   { key: 'totalHrs', label: 'Total Time' },
  //   { key: 'inSelfiePhoto', label: 'In Selfie', type: 'image' },
  //   { key: 'outSelfiePhoto', label: 'Out Selfie', type: 'image' },
  // ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.calculateTotalPages();
  }
  onTextareaChange(row: any, key: string, value: string) {
    row[key] = value;

    this.cellValueChange.emit({
      row,
      key,
      value,
    });
  }
  onNumberChange(
    row: any,
    key: string,
    value: any,
    fieldType: 'number' | 'text' = 'number',
  ) {
    if (fieldType === 'text') {
      row[key] = value;
      this.cellValueChange.emit({ row, key, value });
      return;
    }

    row[key] = Number(value);

    if (key === 'actualStock' && row.stock !== undefined) {
      row.difference = Number(row.actualStock) - Number(row.stock);
    }

    // âœ… discountAmount removed â€” it's readonly now, calculated automatically
    if (key === 'discount' || key === 'gstPercent') {
      this.onDiscountChange(row);
    }

    this.cellValueChange.emit({ row, key, value });
  }
  ngOnChanges() {
    this.calculateTotalPages();
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    if (this.pageReset !== this.lastPageReset) {
      this.lastPageReset = this.pageReset;
      this.currentPage = 1;
    }

    if (this.selectionKey) {
      this.selectedRowIds = new Set(this.selectedIds);
    } else {
      this.selectedRows.clear();
      this.allSelected = false;

      if (this.preSelectedKey && this.data?.length) {
        this.data.forEach((row) => {
          if (row[this.preSelectedKey]) {
            this.selectedRows.add(row);
          }
        });
      }
    }

    this.updateMasterCheckbox();
  }

  toggleMoreInfo(row: any) {
    row.moreInfoExpanded = !row.moreInfoExpanded;
  }
  calculateTotalPages() {
    if (this.isServerSidePagination) {
      this.totalPages = Math.ceil(this.totalRecords / this.itemsPerPage);
    } else {
      this.totalPages = Math.ceil(this.data.length / this.itemsPerPage);
    }
  }

  // get paginatedData() {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   return this.data.slice(startIndex, startIndex + this.itemsPerPage);
  // }
  get paginatedData() {
    if (!this.showPagination) {
      return this.data;
    }

    if (this.isServerSidePagination) {
      return this.data;
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.data.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get displayedRecords(): number {
    return this.isServerSidePagination || !this.showPagination
      ? this.data.length
      : this.paginatedData.length;
  }

  get totalAvailableRecords(): number {
    return this.isServerSidePagination ? this.totalRecords : this.data.length;
  }

  onCustomAction(row: any, event: Event) {
    event.stopPropagation();
    this.customAction.emit(row);
  }

  toggleAccessoryDetails(row: any) {
    row.accessoryExpanded = !row.accessoryExpanded;
  }

  // toggleRow(row: any) {
  //   if (this.clickedRows.has(row)) {
  //     this.clickedRows.delete(row);
  //   } else {
  //     this.clickedRows.add(row);
  //   }
  //   this.rowClick.emit(row);
  // }
  toggleRow(row: any) {
    if (this.clickedRows.has(row)) {
      this.clickedRows.delete(row);
    } else {
      this.clickedRows.add(row);
    }

    row.expanded = !row.expanded;

    this.rowClick.emit(row);
  }
  trackByFn(index: number, item: any): any {
    if (this.selectionKey && item?.[this.selectionKey] !== undefined) {
      return item[this.selectionKey];
    }

    return (
      item?.id ?? item?.menuId ?? item?.empCode + '-' + item?.date + '-' + index
    );
  }

  // Checkbox selection methods
  toggleSelection(row: any, event: Event) {
    event.stopPropagation();

    if (this.selectionKey) {
      const id = row[this.selectionKey];

      if (this.selectedRowIds.has(id)) {
        this.selectedRowIds.delete(id);
      } else {
        this.selectedRowIds.add(id);
      }
    } else {
      if (this.selectedRows.has(row)) {
        this.selectedRows.delete(row);
      } else {
        this.selectedRows.add(row);
      }
    }

    this.updateMasterCheckbox();
    this.emitSelectionChange();
  }

  isSelected(row: any): boolean {
    if (this.selectionKey) {
      return this.selectedRowIds.has(row[this.selectionKey]);
    }
    return this.selectedRows.has(row);
  }

  toggleMasterSelection(event: Event) {
    event.stopPropagation();
    this.allSelected = !this.allSelected;

    this.paginatedData.forEach((row) => {
      if (this.selectionKey) {
        const key = this.selectionKey as string;
        const id = row[key];

        this.allSelected
          ? this.selectedRowIds.add(id)
          : this.selectedRowIds.delete(id);
      } else {
        this.allSelected
          ? this.selectedRows.add(row)
          : this.selectedRows.delete(row);
      }
    });

    this.emitSelectionChange();
  }

  updateMasterCheckbox() {
    if (this.selectionKey) {
      const key = this.selectionKey as string;

      this.allSelected =
        this.paginatedData.length > 0 &&
        this.paginatedData.every((row) => this.selectedRowIds.has(row[key]));
    } else {
      this.allSelected =
        this.paginatedData.length > 0 &&
        this.paginatedData.every((row) => this.selectedRows.has(row));
    }
  }

  emitSelectionChange() {
    if (this.selectionKey) {
      const key = this.selectionKey as string;

      const selected = this.data.filter((row) =>
        this.selectedRowIds.has(row[key]),
      );
      this.selectionChange.emit(selected);
    } else {
      this.selectionChange.emit(Array.from(this.selectedRows));
    }
  }

  onDiscountChange(row: any) {
    if (row._manualDiscountLocked) {
      this.emitTableChange();
      return;
    }

    const price = Number(row.price || 0);
    const qty = Number(row.quantity || 1);
    const discountVal = Number(row.discount || 0);

    const discountType = (
      typeof row.discountType === 'object'
        ? (row.discountType?.value ?? '')
        : (row.discountType ?? '')
    )
      .toString()
      .toLowerCase();

    const isPercent =
      discountType === 'per' ||
      discountType === '%' ||
      discountType === 'percent';
    const isAmount = discountType === 'amt' || discountType === 'amount';

    let discountPerUnit = 0; // â† per-unit discount

    if (isPercent) {
      discountPerUnit = Number(((price * discountVal) / 100).toFixed(2));
    } else if (isAmount) {
      discountPerUnit = discountVal;
    }

    // âœ… Show total discount across all qty in the Discount Amt column
    row.discountAmount = Number((discountPerUnit * qty).toFixed(2));

    row.totalAfterDiscount = Number(
      ((price - discountPerUnit) * qty).toFixed(2),
    );

    if (row.gstApplicable === 'Yes' && row.gstPercent) {
      row.totalGstAmount = Number(
        ((row.totalAfterDiscount * Number(row.gstPercent || 0)) / 100).toFixed(
          2,
        ),
      );
    } else {
      row.totalGstAmount = 0;
    }

    row.totalAmount = Number(
      (row.totalAfterDiscount + row.totalGstAmount).toFixed(2),
    );

    this.emitTableChange();
  }

  onGSTChange(row: any) {
    const totalAfterDiscount = Number(row.totalAfterDiscount || 0);
    const gstPercent = Number(row.gstPercent || 0);

    if (row.gstApplicable === 'No') {
      row.gstPercent = 0;
      row.totalGstAmount = 0;
    } else if (row.gstApplicable === 'Yes') {
      row.totalGstAmount = Number(
        ((totalAfterDiscount * gstPercent) / 100).toFixed(2),
      );
    }

    // âœ… DO NOT TOUCH totalAfterDiscount
    row.totalAmount = Number(
      (totalAfterDiscount + row.totalGstAmount).toFixed(2),
    );

    this.emitTableChange();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;

      if (this.isServerSidePagination) {
        this.onNext.emit(this.currentPage);
      }

      this.updateMasterCheckbox();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;

      if (this.isServerSidePagination) {
        this.onPrevious.emit(this.currentPage);
      }

      this.updateMasterCheckbox();
    }
  }

  onEdit(row: any, event: Event) {
    event.stopPropagation(); // Prevent row click
    if (this.editRoute) {
      this.router.navigate([this.editRoute, row.id]);
    } else {
      this.edit.emit(row);
    }
  }
  onAddItems(row: any, event: Event) {
    event.stopPropagation(); // Prevent row click
    this.onAddItem.emit(row);
  }
  onView(row: any, event: Event) {
    event.stopPropagation(); // Prevent row click
    this.view.emit(row);
  }
  onViewSepcification(row: any, event: Event) {
    event.stopPropagation(); // Prevent row click
    this.view.emit(row);
  }
  onDelete(row: any, event: Event) {
    event.stopPropagation(); // Prevent row click
    this.delete.emit(row);
  }

  onDownload(row: any, event: Event) {
    event.stopPropagation(); // Prevent row click
    this.download.emit(row);
  }
  onAddContacts(row: any): void {
    console.log('Adding contacts for', row);
    this.onAddContact.emit(row);
  }
  // Check if we should show the actions column
  get showActionsColumn(): boolean {
    return (
      this.showEditAction ||
      this.showDeleteAction ||
      this.showViewAction ||
      this.showDownloadAction ||
      this.showCustomAction ||
      this.customActionsTemplate !== null
    );
  }

  // Style-related getters for template
  get tableWrapperStyle() {
    const styles: { [key: string]: string } = {};

    if (this.tableHeight) {
      styles['max-height'] = this.tableHeight;
      styles['overflow-y'] = 'auto';
    }

    if (this.enableHorizontalScroll) {
      styles['overflow-x'] = 'auto';
    }

    return styles;
  }

  get tableHeaderStyle() {
    return this.fixedHeader
      ? { position: 'sticky', top: '0', zIndex: '10' }
      : {};
  }

  // NEW: cap column width via header.width, used on both <th> and <td>
  getColumnStyle(header: any) {
    return header?.width
      ? { width: header.width, maxWidth: header.width, minWidth: header.width }
      : {};
  }

  getRowClass(row: any, index: number) {
    const classes = [
      'cursor-pointer',
      'transition-colors',
      'duration-200',
      'ease-in-out',
    ];

    if (this.rowHoverClass) {
      classes.push(this.rowHoverClass);
    }

    if (this.clickedRows.has(row) && this.clickedRowClass) {
      classes.push(this.clickedRowClass);
    }

    if (this.isSelected(row) && this.selectedRowClass) {
      classes.push(this.selectedRowClass);
    }

    if (this.stripedRows && index % 2 === 1) {
      classes.push('bg-gray-50');
    }

    return classes.join(' ');
  }

  onCheckboxChange(row: any, key: string, event: any) {
    // Update only the specific cell checkbox value
    row[key] = event.target.checked;

    // Emit an event with the changed data
    this.cellValueChange.emit({
      row,
      key,
      value: event.target.checked,
    });
  }
  isImageColumn(key: string): boolean {
    return key.toLowerCase().includes('image');
  }

  openAttachmentsModal(images: string | string[], title: string) {
    if (typeof images === 'string') {
      // data URLs contain a comma (data:image/...;base64,xxx) — never split those
      this.currentAttachmentImages = images.startsWith('data:')
        ? [images]
        : images.split(',').map((img) => img.trim());
    } else if (Array.isArray(images)) {
      this.currentAttachmentImages = images;
    } else {
      this.currentAttachmentImages = [];
    }
    this.currentAttachmentTitle = `${title}`;
    this.showAttachmentModal = true;
  }

  // Close modal
  closeAttachmentsModal() {
    this.showAttachmentModal = false;
  }

  getImageSource(image: string): string {
    if (!image) {
      return '';
    }

    if (image.startsWith('data:image/')) {
      return image;
    }

    if (image.startsWith('http')) {
      return image;
    }
    return `data:image/jpeg;base64,${image}`;
  }

  // table.component.ts
  onPdfDownload() {
    this.pdfDownload.emit();
  }
  getTemplate(columnKey: string): TemplateRef<any> | null {
    return (
      this.templates.find((tpl: any) =>
        tpl._declarationTContainer.localNames?.includes('cell_' + columnKey),
      ) || null
    );
  }

  getDropdownValue(row: any, key: string): any {
    const val = row[key];
    if (val === null || val === undefined) return null;

    // If stored as object {name, value} â†’ extract the primitive value
    if (typeof val === 'object' && 'value' in val) return val.value;

    // Plain string/number â†’ return as-is
    return val;
  }

  onDropdownChange(row: any, key: string, value: any) {
    // âœ… Always store plain primitive â€” never store objects in row
    const normalized =
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      'value' in value
        ? value.value
        : value;

    row[key] = normalized;

    this.cellValueChange.emit({ row, key, value: normalized });

    if (key === 'discountType') {
      // Reset on type change
      row.discount = null;
      row.discountAmount = 0;
      row.totalAfterDiscount = 0;
      this.onDiscountChange(row);
    }

    if (key === 'gstApplicable') {
      this.onGSTChange(row);
    }

    this.emitTableChange();
  }

  // getPunchHeaders(row: any): PunchHeader[] {
  //   const baseHeaders: PunchHeader[] = [
  //     { key: 'inTime', label: 'In Time' },
  //     { key: 'outTime', label: 'Out Time' },
  //     { key: 'totalHrs', label: 'Total Time' },
  //   ];
  //   // const hasSelfie = row.punchRecords?.some((p: any) => p.inSelfiePhoto || p.outSelfiePhoto);
  //   const hasSelfie = row.punchRecords?.some(
  //     (p: any) => 'inSelfiePhoto' in p || 'outSelfiePhoto' in p,
  //   );

  //   if (hasSelfie) {
  //     baseHeaders.push({
  //       key: 'inSelfiePhoto',
  //       label: 'In Selfie',
  //       type: 'image',
  //     });
  //     baseHeaders.push({
  //       key: 'outSelfiePhoto',
  //       label: 'Out Selfie',
  //       type: 'image',
  //     });
  //   }

  //   return baseHeaders;
  // }

  onEditAccessory(row: any, event: Event) {
    event.stopPropagation();
    this.customAction.emit({ action: 'editAccessory', row }); // `row` here = the accessory row
  }

  onDeleteAccessory(row: any, event: Event) {
    event.stopPropagation();
    this.customAction.emit({ action: 'removeAccessory', row });
  }

  onNestedCustomAction(parentRow: any, event: any) {
    if (event.action === 'editAccessory') {
      this.customAction.emit({
        action: 'editAccessory',
        row: parentRow,
        childRow: event.row,
      });
    } else if (event.action === 'removeAccessory') {
      const childIndex = (parentRow.moreInfoData || []).indexOf(event.row);
      this.customAction.emit({
        action: 'removeAccessory',
        row: parentRow,
        childIndex,
      });
    } else {
      // pass through anything else unchanged
      this.customAction.emit(event);
    }
  }
}
