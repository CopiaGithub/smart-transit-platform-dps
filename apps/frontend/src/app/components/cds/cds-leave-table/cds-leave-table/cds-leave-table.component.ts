import {
Component,
ContentChildren,
EventEmitter,
Input,
OnInit,
Output,
QueryList,
SimpleChanges,
TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule,FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


// âœ… Add this interface here
export interface PunchHeader {
  key: string;
  label: string;
  type?: 'text' | 'image' | 'checkbox'; // optional and type-safe
}
@Component({
  selector: 'app-cds-leave-table',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, FormsModule],
  templateUrl: './cds-leave-table.component.html',
  styleUrl: './cds-leave-table.component.css'
})
export class CdsLeaveTableComponent implements OnInit {
  @Input() headers: { key: string; label: string; type?: string }[] = [];
  @Input() data: any[] = [];
  @Input() itemsPerPage = 5;
  @Input() addContacts = false;
  @Input() canDelete?: (row: any) => boolean;
  // Action visibility flags
  @Input() showEditAction = false;
  @Input() showDeleteAction = false;
  @Input() showViewAction = false;
  @Input() showDownloadAction = false;
  @Input() showCheckboxes = false;
  @Input() showPagination = true;
  @Input() preSelectedKey: string = '';
  @Output() pdfDownload = new EventEmitter<any>();
  @Input() footerRow: any | null = null;
  PdfDownload(row?: any) {
    this.pdfDownload.emit(row);
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
  @Input() tableHeight: string = ''; // Empty for auto height
  @Input() containerClass: string = 'w-full p-0 mt-2';
  @Input() tableClass: string =
    'w-full table-auto border-collapse border border-gray-300';
  @Input() theadClass: string = 'bg-blue-100';
  @Input() paginationClass: string = 'flex justify-end items-center mt-4 gap-4';
  @Input() fixedHeader: boolean = false;
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
  @Output() rowClick = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any[]>();
  @Output() cellValueChange = new EventEmitter<any>();
  @Output() onAddContact = new EventEmitter<any>();
  @Output() onAddItem = new EventEmitter<any>();
  @Output() customAction = new EventEmitter<any>();
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
  onNumberChange(row: any, key: string, value: any) {
    row[key] = Number(value);

    // auto-calc difference if actualStock changed
    if (key === 'actualStock' && row.stock !== undefined) {
      row.difference = Number(row.actualStock) - Number(row.stock);
    }

    this.cellValueChange.emit({ row, key, value });
  }
ngOnChanges(changes: SimpleChanges): void {
  if (changes['data']) {
    this.currentPage = 1;
    this.calculateTotalPages();
    this.updateMasterCheckbox();
  }
}




  toggleMoreInfo(row: any) {
    row.moreInfoExpanded = !row.moreInfoExpanded;
  }
calculateTotalPages(): void {
  if (!this.data || this.data.length === 0) {
    this.totalPages = 0;
    return;
  }

  this.totalPages = Math.ceil(this.data.length / this.itemsPerPage);
}





  // get paginatedData() {
  //   const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  //   return this.data.slice(startIndex, startIndex + this.itemsPerPage);
  // }
get paginatedData(): any[] {
  if (!this.data || this.data.length === 0) {
    return [];
  }

  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;

  return this.data.slice(startIndex, endIndex);
}

  onCustomAction(row: any, event: Event) {
    event.stopPropagation();
    this.customAction.emit(row);
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
    // âœ… Handle row selection (clickedRows)
    if (this.clickedRows.has(row)) {
      this.clickedRows.delete(row);
    } else {
      this.clickedRows.add(row);
    }

    // âœ… Handle expansion (row.expanded flag)
    row.expanded = !row.expanded;

    // âœ… Emit row click event
    this.rowClick.emit(row);
  }
  trackByFn(index: number, item: any): any {
    // return a unique identifier for each row
    return item.empCode + '-' + item.date + '-' + index;
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

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updateMasterCheckbox();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
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
      styles['height'] = this.tableHeight;
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
      // Split comma-separated string into array
      this.currentAttachmentImages = images.split(',').map((img) => img.trim());
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
}
