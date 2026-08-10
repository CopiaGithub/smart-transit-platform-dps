import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';

import { CdsContainerComponent } from '../../../components/cds/cds-container/cds-container.component';
import { CdsTitleComponent } from '../../../components/cds/cds-title/cds-title.component';
import { CdsButtonComponent } from '../../../components/cds/cds-button/cds-button.component';
import { EditModelComponent } from '../../../components/cds/edit-model/edit-model.component';
import { PopupComponent } from '../../../components/popup/popup.component';
import { DropdownModel } from '../../../components/constants';

import { ApiService } from '../../../core/api/api.service';
import { PagedResult } from '../../../core/api/api.types';
import { BaseComponent, resolveErrorMessage } from '../../common/base/BaseComponent';
import {
  MenuListItem,
  MenuNode,
  buildTreeFromFlat,
  flattenAll,
  flattenVisible,
} from './menu-tree';

/** One page is enough — a navigation tree that needs paging is already broken. */
const ALL_MENUS_PAGE_SIZE = 500;

/**
 * B3 — Menu Master (WEB-APP-SCREENS.docx §Group B).
 *
 * A tree, not a flat table: the spec is explicit about that, and the parent
 * relationship is the whole point of the screen.
 *
 * Ordering uses PATCH /api/MenuMaster/bulk-update — moving an item swaps its
 * OrderNo with its sibling's, so only the two affected rows are sent.
 */
@Component({
  selector: 'app-menu-master',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CdsContainerComponent,
    CdsTitleComponent,
    CdsButtonComponent,
    PopupComponent,
  ],
  templateUrl: './menu-master.component.html',
  styleUrl: './menu-master.component.css',
})
export class MenuMasterComponent extends BaseComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly tree = signal<MenuNode<MenuListItem>[]>([]);
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly visibleNodes = computed(() => flattenVisible(this.tree()));
  readonly isEmpty = computed(
    () => !this.isLoading() && !this.loadError() && this.tree().length === 0,
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.api
      .get<PagedResult<MenuListItem>>('/MenuMaster', {
        PageNumber: 1,
        PageSize: ALL_MENUS_PAGE_SIZE,
        // IsActive is deliberately omitted. Despite what WEB-APP-SCREENS.docx
        // says, MenuMasterService treats it as an exact match
        // (`m.IsActive == value`), so IsActive=false returns ONLY inactive rows.
        // Leaving it null is what returns the whole tree — and an inactive menu
        // has to stay visible here, or it could never be switched back on.
      })
      .pipe(take(1))
      .subscribe({
        next: (page) => {
          this.isLoading.set(false);
          this.tree.set(buildTreeFromFlat(page?.Items ?? []));
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.tree.set([]);
          this.loadError.set(resolveErrorMessage(error, 'Failed to load the menu tree.'));
        },
      });
  }

  toggle(node: MenuNode<MenuListItem>): void {
    node.expanded = !node.expanded;
    // The nodes are mutated in place, so hand the signal a new array reference.
    this.tree.update((nodes) => [...nodes]);
  }

  expandAll(expanded: boolean): void {
    for (const node of flattenAll(this.tree())) {
      node.expanded = expanded;
    }
    this.tree.update((nodes) => [...nodes]);
  }

  // ── Add / Edit / Delete ──────────────────────────────────────────────────

  onAddNew(parent?: MenuNode<MenuListItem>): void {
    this.openDialog('Add New Menu', {
      ParentId: parent?.id ?? null,
      OrderNo: this.nextOrderNo(parent?.id ?? null),
      IsActive: true,
    });
  }

  onEdit(node: MenuNode<MenuListItem>): void {
    this.openDialog(
      'Edit Menu',
      {
        id: node.id,
        Name: node.item.Name,
        Route: node.item.Route ?? '',
        Icon: node.item.Icon ?? '',
        ParentId: node.item.ParentId,
        OrderNo: node.item.OrderNo,
        IsActive: node.item.IsActive,
      },
      node.id,
    );
  }

  private openDialog(title: string, formData: any, menuId?: number): void {
    const dialogRef = this.dialog.open(EditModelComponent, {
      width: '640px',
      data: {
        title,
        // A menu cannot be its own parent or a descendant of itself, so the
        // branch being edited is excluded from the parent options.
        formFields: [
          { name: 'Name', label: 'Menu Name', type: 'text', required: true, maxLength: 100 },
          {
            name: 'ParentId',
            label: 'Parent Menu',
            type: 'dropdown',
            optionsList: this.parentOptions(menuId),
          },
          {
            name: 'Route',
            label: 'Route',
            type: 'text',
            maxLength: 200,
            hint: 'The frontend path, e.g. /mainlayout/master/country-master',
          },
          {
            name: 'Icon',
            label: 'Icon',
            type: 'text',
            maxLength: 100,
            hint: 'A Material icon name. An unknown name falls back to a default.',
          },
          { name: 'OrderNo', label: 'Order No', type: 'number', required: true },
          { name: 'IsActive', label: 'Status', type: 'toggle' },
        ],
        formData,
        allData: [],
        duplicateCheckFields: [],
      },
    });

    dialogRef
      .afterClosed()
      .pipe(take(1))
      .subscribe((result) => {
        if (!result) return;

        const body = {
          Name: result.Name,
          Route: result.Route || null,
          Icon: result.Icon || null,
          ParentId: toIdOrNull(result.ParentId),
          OrderNo: Number(result.OrderNo) || 0,
          IsActive: !!result.IsActive,
        };

        const spinner = this.showSpinner();
        const request = menuId
          ? this.api.patch<boolean>(`/MenuMaster/${menuId}`, body)
          : this.api.post<unknown>('/MenuMaster', body);

        request.pipe(take(1)).subscribe({
          next: () => {
            spinner.close();
            this.load();
            this.showSuccess(menuId ? 'Menu updated.' : 'Menu created.');
          },
          error: (error: unknown) => {
            spinner.close();
            this.showError(error, 'Save failed.');
          },
        });
      });
  }

  onDelete(node: MenuNode<MenuListItem>): void {
    const childWarning = node.children.length
      ? ` It has ${node.children.length} child menu(s), which may be left unreachable.`
      : '';

    this.confirm(
      'Confirm Deletion',
      `Delete the menu "${node.name}"?${childWarning} This is a soft delete — the ` +
        'record is hidden but kept in the database.',
      'Delete',
    )
      .pipe(take(1))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        const spinner = this.showSpinner();
        this.api
          .delete<boolean>(`/MenuMaster/${node.id}`)
          .pipe(take(1))
          .subscribe({
            next: () => {
              spinner.close();
              this.load();
              this.showSuccess(`"${node.name}" deleted.`);
            },
            error: (error: unknown) => {
              spinner.close();
              this.showError(error, 'Delete failed.');
            },
          });
      });
  }

  // ── Reordering ───────────────────────────────────────────────────────────

  canMove(node: MenuNode<MenuListItem>, direction: -1 | 1): boolean {
    const siblings = this.siblingsOf(node);
    const index = siblings.indexOf(node);
    const target = index + direction;
    return index >= 0 && target >= 0 && target < siblings.length;
  }

  move(node: MenuNode<MenuListItem>, direction: -1 | 1): void {
    const siblings = this.siblingsOf(node);
    const index = siblings.indexOf(node);
    const swapWith = siblings[index + direction];
    if (!swapWith) return;

    // Swap the two OrderNo values and send only those two rows.
    const payload = [
      { ...bulkRow(node.item), OrderNo: swapWith.item.OrderNo },
      { ...bulkRow(swapWith.item), OrderNo: node.item.OrderNo },
    ];

    const spinner = this.showSpinner();
    this.api
      .patch<boolean>('/MenuMaster/bulk-update', payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          spinner.close();
          this.load();
        },
        error: (error: unknown) => {
          spinner.close();
          this.showError(error, 'Could not reorder the menu.');
        },
      });
  }

  private siblingsOf(node: MenuNode<MenuListItem>): MenuNode<MenuListItem>[] {
    const parentId = node.item.ParentId;
    if (parentId == null) {
      return this.tree();
    }
    const parent = flattenAll(this.tree()).find((n) => n.id === parentId);
    return parent?.children ?? this.tree();
  }

  private nextOrderNo(parentId: number | null): number {
    const siblings = flattenAll(this.tree()).filter((n) => n.item.ParentId === parentId);
    return siblings.reduce((max, n) => Math.max(max, n.item.OrderNo), 0) + 1;
  }

  private parentOptions(excludeId?: number): DropdownModel[] {
    const excluded = new Set<number>();
    if (excludeId != null) {
      const node = flattenAll(this.tree()).find((n) => n.id === excludeId);
      if (node) {
        for (const descendant of flattenAll([node])) {
          excluded.add(descendant.id);
        }
      }
    }

    return flattenAll(this.tree())
      .filter((n) => !excluded.has(n.id))
      .map((n) => ({
        name: `${'— '.repeat(n.depth)}${n.name}`,
        value: n.id,
      }));
  }
}

function bulkRow(item: MenuListItem) {
  return {
    Id: item.Id,
    Name: item.Name,
    Route: item.Route,
    OrderNo: item.OrderNo,
    IsActive: item.IsActive,
  };
}

function toIdOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '' || value === 0) {
    return null;
  }
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}
