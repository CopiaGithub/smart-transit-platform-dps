import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { take } from 'rxjs';

import { CdsContainerComponent } from '../../../components/cds/cds-container/cds-container.component';
import { CdsTitleComponent } from '../../../components/cds/cds-title/cds-title.component';
import { CdsButtonComponent } from '../../../components/cds/cds-button/cds-button.component';
import { PopupComponent } from '../../../components/popup/popup.component';

import { ApiService } from '../../../core/api/api.service';
import { PagedResult } from '../../../core/api/api.types';
import { BaseComponent, resolveErrorMessage } from '../../common/base/BaseComponent';
import {
  MenuNode,
  MenuTreeNode,
  flattenAll,
  flattenVisible,
  wrapTree,
} from '../menu-master/menu-tree';

interface RoleListItem {
  Id: number;
  RoleName: string;
  IsActive: boolean;
}

/**
 * B4 — Menu Assignment (WEB-APP-SCREENS.docx §Group B).
 *
 * Role list on the left, a checkbox tree of menus on the right, one Save.
 *
 * Ticking a child implies its ancestors: a submenu the sidebar cannot reach is
 * a submenu nobody can click, so parents are selected automatically. Unticking a
 * parent clears its whole subtree for the same reason.
 *
 * The save is a full replacement — POST /assign-menus takes the complete set of
 * menu ids for the role, not a delta.
 */
@Component({
  selector: 'app-menu-assignment',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    CdsContainerComponent,
    CdsTitleComponent,
    CdsButtonComponent,
    PopupComponent,
  ],
  templateUrl: './menu-assignment.component.html',
  styleUrl: './menu-assignment.component.css',
})
export class MenuAssignmentComponent extends BaseComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly roles = signal<RoleListItem[]>([]);
  readonly selectedRoleId = signal<number | null>(null);
  readonly tree = signal<MenuNode<MenuTreeNode>[]>([]);
  readonly checkedIds = signal<Set<number>>(new Set());

  readonly isLoadingRoles = signal(false);
  readonly isLoadingTree = signal(false);
  readonly isSaving = signal(false);
  readonly loadError = signal<string | null>(null);

  /** The set as it was when loaded, so Save can be disabled until something changes. */
  private savedIds = new Set<number>();

  readonly visibleNodes = computed(() => flattenVisible(this.tree()));
  readonly checkedCount = computed(() => this.checkedIds().size);

  readonly selectedRoleName = computed(
    () => this.roles().find((r) => r.Id === this.selectedRoleId())?.RoleName ?? '',
  );

  readonly isDirty = computed(() => {
    const current = this.checkedIds();
    if (current.size !== this.savedIds.size) return true;
    for (const id of current) {
      if (!this.savedIds.has(id)) return true;
    }
    return false;
  });

  ngOnInit(): void {
    this.loadRoles();
    this.loadTree();
  }

  private loadRoles(): void {
    this.isLoadingRoles.set(true);
    this.api
      .get<PagedResult<RoleListItem>>('/RoleMaster', { PageNumber: 1, PageSize: 200 })
      .pipe(take(1))
      .subscribe({
        next: (page) => {
          this.isLoadingRoles.set(false);
          const roles = page?.Items ?? [];
          this.roles.set(roles);
          if (roles.length && this.selectedRoleId() == null) {
            this.selectRole(roles[0].Id);
          }
        },
        error: (error: unknown) => {
          this.isLoadingRoles.set(false);
          this.loadError.set(resolveErrorMessage(error, 'Failed to load roles.'));
        },
      });
  }

  private loadTree(): void {
    this.isLoadingTree.set(true);
    this.api
      .get<MenuTreeNode[]>('/MenuAssignment/menus')
      .pipe(take(1))
      .subscribe({
        next: (nodes) => {
          this.isLoadingTree.set(false);
          this.tree.set(wrapTree(nodes ?? []));
        },
        error: (error: unknown) => {
          this.isLoadingTree.set(false);
          this.loadError.set(resolveErrorMessage(error, 'Failed to load the menu tree.'));
        },
      });
  }

  selectRole(roleId: number): void {
    if (this.selectedRoleId() === roleId) return;

    const apply = () => {
      this.selectedRoleId.set(roleId);
      this.loadAssignedMenus(roleId);
    };

    // Switching roles would silently discard unsaved ticks.
    if (this.isDirty()) {
      this.confirm(
        'Discard changes?',
        `You have unsaved menu changes for "${this.selectedRoleName()}". Switching ` +
          'roles will discard them.',
        'Discard',
      )
        .pipe(take(1))
        .subscribe((confirmed) => {
          if (confirmed) apply();
        });
      return;
    }

    apply();
  }

  private loadAssignedMenus(roleId: number): void {
    this.api
      .get<number[]>(`/MenuAssignment/assigned/${roleId}`)
      .pipe(take(1))
      .subscribe({
        next: (ids) => {
          const set = new Set(ids ?? []);
          this.checkedIds.set(new Set(set));
          this.savedIds = new Set(set);
        },
        error: (error: unknown) => {
          this.checkedIds.set(new Set());
          this.savedIds = new Set();
          this.showError(error, 'Failed to load the menus assigned to this role.');
        },
      });
  }

  // ── Checkbox tree ────────────────────────────────────────────────────────

  isChecked(node: MenuNode<MenuTreeNode>): boolean {
    return this.checkedIds().has(node.id);
  }

  /** Some but not all descendants ticked — shown as an indeterminate box. */
  isIndeterminate(node: MenuNode<MenuTreeNode>): boolean {
    if (!node.children.length || this.isChecked(node)) return false;
    return flattenAll(node.children).some((child) => this.checkedIds().has(child.id));
  }

  toggleChecked(node: MenuNode<MenuTreeNode>): void {
    const next = new Set(this.checkedIds());
    const subtree = flattenAll([node]).map((n) => n.id);

    if (next.has(node.id)) {
      // Unticking a parent takes its whole subtree with it.
      for (const id of subtree) next.delete(id);
    } else {
      for (const id of subtree) next.add(id);
      // A child is unreachable without its ancestors, so tick them too.
      for (const ancestorId of this.ancestorIdsOf(node.id)) next.add(ancestorId);
    }

    this.checkedIds.set(next);
  }

  private ancestorIdsOf(id: number): number[] {
    const parents: number[] = [];
    const walk = (nodes: MenuNode<MenuTreeNode>[], trail: number[]): boolean => {
      for (const node of nodes) {
        if (node.id === id) {
          parents.push(...trail);
          return true;
        }
        if (walk(node.children, [...trail, node.id])) return true;
      }
      return false;
    };
    walk(this.tree(), []);
    return parents;
  }

  toggleExpanded(node: MenuNode<MenuTreeNode>): void {
    node.expanded = !node.expanded;
    this.tree.update((nodes) => [...nodes]);
  }

  selectAll(): void {
    this.checkedIds.set(new Set(flattenAll(this.tree()).map((n) => n.id)));
  }

  clearAll(): void {
    this.checkedIds.set(new Set());
  }

  reset(): void {
    this.checkedIds.set(new Set(this.savedIds));
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  save(): void {
    const roleId = this.selectedRoleId();
    if (roleId == null) return;

    const menuIds = Array.from(this.checkedIds());
    this.isSaving.set(true);

    this.api
      .post<unknown>('/MenuAssignment/assign-menus', { RoleId: roleId, MenuIds: menuIds })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.savedIds = new Set(menuIds);
          // Nudge the computed so the Save button settles back to disabled.
          this.checkedIds.set(new Set(menuIds));
          this.showSuccess(`Menus updated for ${this.selectedRoleName()}.`);
        },
        error: (error: unknown) => {
          this.isSaving.set(false);
          this.showError(error, 'Could not save the menu assignment.');
        },
      });
  }
}
