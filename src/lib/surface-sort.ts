// Click-to-sort for data tables.
//
// Each sortable <th> carries data-sort-key="<key>"; each <tr data-row> must
// carry a matching data-<key> attribute whose value is used for ordering.
// Values are compared with localeCompare(numeric:true), so "HR.12" sorts
// after "HR.3" and ISO dates sort chronologically as strings.
//
// Sort is tri-state per column: unsorted → ascending → descending → unsorted
// (third click clears). aria-sort on the <th> reflects the state for a11y
// and the CSS arrows.

type SortState = { key: string; dir: 'asc' | 'desc' } | null;

export function initSurfaceSort(root: HTMLElement) {
  const tbodyEl = root.querySelector<HTMLTableSectionElement>('tbody');
  if (!tbodyEl) return;
  const tbody = tbodyEl;
  const headers = Array.from(
    root.querySelectorAll<HTMLTableCellElement>('thead th[data-sort-key]'),
  );
  if (headers.length === 0) return;

  const originalOrder = Array.from(tbody.querySelectorAll<HTMLElement>('[data-row]'));

  let state: SortState = null;

  function render() {
    // Update header indicators.
    for (const th of headers) {
      if (state && th.dataset.sortKey === state.key) {
        th.setAttribute('aria-sort', state.dir === 'asc' ? 'ascending' : 'descending');
      } else {
        th.removeAttribute('aria-sort');
      }
    }

    // Produce ordered list, then reinsert under tbody (respecting current
    // filter state — hidden rows remain hidden, they just move in the DOM).
    let ordered: HTMLElement[];
    if (!state) {
      ordered = originalOrder;
    } else {
      const { key, dir } = state;
      const attr = camel(key);
      ordered = [...originalOrder].sort((a, b) => {
        const av = a.dataset[attr] ?? '';
        const bv = b.dataset[attr] ?? '';
        // Blanks always sort last regardless of direction.
        if (!av && !bv) return 0;
        if (!av) return 1;
        if (!bv) return -1;
        const cmp = av.localeCompare(bv, 'en', { numeric: true, sensitivity: 'base' });
        return dir === 'asc' ? cmp : -cmp;
      });
    }
    for (const row of ordered) tbody.appendChild(row);
  }

  for (const th of headers) {
    th.addEventListener('click', () => {
      const key = th.dataset.sortKey!;
      if (!state || state.key !== key) {
        state = { key, dir: 'asc' };
      } else if (state.dir === 'asc') {
        state = { key, dir: 'desc' };
      } else {
        state = null;
      }
      render();
    });
  }
}

function camel(k: string): string {
  return k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
