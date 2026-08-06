type CloseDropdownFn = () => void;

let activeClose: CloseDropdownFn | null = null;

export function openCdsSelect(close: CloseDropdownFn): void {
  if (activeClose && activeClose !== close) {
    activeClose();
  }
  activeClose = close;
}

export function closeCdsSelect(close: CloseDropdownFn): void {
  if (activeClose === close) {
    activeClose = null;
  }
}
