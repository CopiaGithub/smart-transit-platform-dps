/** Shapes shared by Menu Master (B3) and Menu Assignment (B4). */

/** A row from GET /api/MenuMaster — flat, with ParentId. */
export interface MenuListItem {
  Id: number;
  Name: string;
  Route: string | null;
  Icon: string | null;
  ParentId: number | null;
  ParentName: string | null;
  OrderNo: number;
  IsActive: boolean;
  ChildCount: number;
}

/** GET /api/MenuAssignment/menus already returns this shape, nested. */
export interface MenuTreeNode {
  Id: number;
  Name: string;
  Route: string | null;
  Icon: string | null;
  ParentId: number | null;
  OrderNo: number;
  IsActive: boolean;
  Children: MenuTreeNode[];
}

/** A tree node plus the view state the screens need. */
export interface MenuNode<T> {
  item: T;
  id: number;
  name: string;
  depth: number;
  children: MenuNode<T>[];
  expanded: boolean;
}

/**
 * Builds a tree from the flat list. Rows whose parent is missing from the page
 * are treated as roots rather than dropped — a menu that cannot be shown is a
 * menu nobody can fix.
 */
export function buildTreeFromFlat(items: MenuListItem[]): MenuNode<MenuListItem>[] {
  const byId = new Map<number, MenuNode<MenuListItem>>();
  for (const item of items) {
    byId.set(item.Id, {
      item,
      id: item.Id,
      name: item.Name,
      depth: 0,
      children: [],
      expanded: true,
    });
  }

  const roots: MenuNode<MenuListItem>[] = [];
  for (const node of byId.values()) {
    const parentId = node.item.ParentId;
    const parent = parentId != null ? byId.get(parentId) : undefined;
    if (parent && parent !== node) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortAndDepth = (nodes: MenuNode<MenuListItem>[], depth: number): void => {
    nodes.sort((a, b) => a.item.OrderNo - b.item.OrderNo || a.name.localeCompare(b.name));
    for (const node of nodes) {
      node.depth = depth;
      sortAndDepth(node.children, depth + 1);
    }
  };
  sortAndDepth(roots, 0);

  return roots;
}

/** Wraps the already-nested assignment tree. */
export function wrapTree(nodes: MenuTreeNode[], depth = 0): MenuNode<MenuTreeNode>[] {
  return [...nodes]
    .sort((a, b) => a.OrderNo - b.OrderNo || a.Name.localeCompare(b.Name))
    .map((node) => ({
      item: node,
      id: node.Id,
      name: node.Name,
      depth,
      children: wrapTree(node.Children ?? [], depth + 1),
      expanded: true,
    }));
}

/** Depth-first flatten, skipping the subtrees of collapsed nodes. */
export function flattenVisible<T>(nodes: MenuNode<T>[]): MenuNode<T>[] {
  const out: MenuNode<T>[] = [];
  const walk = (list: MenuNode<T>[]): void => {
    for (const node of list) {
      out.push(node);
      if (node.expanded && node.children.length) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return out;
}

/** Every node in the tree, regardless of expansion. */
export function flattenAll<T>(nodes: MenuNode<T>[]): MenuNode<T>[] {
  const out: MenuNode<T>[] = [];
  const walk = (list: MenuNode<T>[]): void => {
    for (const node of list) {
      out.push(node);
      walk(node.children);
    }
  };
  walk(nodes);
  return out;
}

export function findNode<T>(nodes: MenuNode<T>[], id: number): MenuNode<T> | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}
