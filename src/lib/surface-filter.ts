// Client-side filter logic for surface tables.
//
// Rows carry data-* attributes: data-row (marker), data-search (lowercase
// blob), one attribute per filter key (data-status, data-chamber, …).
//
// Each filter is wrapped in <details data-filter-dropdown> containing a
// <fieldset data-filter-group data-filter-key="…"> of checkboxes. Within a
// group: OR. Across groups: AND. Empty group = allow all.

export function initSurfaceFilter(root: HTMLElement) {
  const searchInput = root.querySelector<HTMLInputElement>('[data-filter-search]');
  const dropdowns = Array.from(
    root.querySelectorAll<HTMLDetailsElement>('[data-filter-dropdown]'),
  );
  const groups = Array.from(
    root.querySelectorAll<HTMLFieldSetElement>('[data-filter-group]'),
  );
  const resetBtn = root.querySelector<HTMLButtonElement>('[data-filter-reset]');
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-row]'));
  const count = root.querySelector<HTMLElement>('[data-filter-count]');

  function activeFilters() {
    return groups
      .map((g) => ({
        key: g.dataset.filterKey ?? '',
        values: new Set(
          Array.from(g.querySelectorAll<HTMLInputElement>('input:checked')).map(
            (i) => i.value,
          ),
        ),
      }))
      .filter((f) => f.values.size > 0);
  }

  function updateBadges() {
    for (const dd of dropdowns) {
      const group = dd.querySelector<HTMLFieldSetElement>('[data-filter-group]');
      const badge = dd.querySelector<HTMLElement>('[data-filter-dd-count]');
      if (!group || !badge) continue;
      const n = group.querySelectorAll('input:checked').length;
      if (n > 0) {
        badge.textContent = String(n);
        badge.removeAttribute('hidden');
      } else {
        badge.setAttribute('hidden', '');
      }
    }
  }

  function apply() {
    const needle = (searchInput?.value ?? '').trim().toLowerCase();
    const filters = activeFilters();
    let visible = 0;

    for (const row of rows) {
      const matchesSearch =
        needle.length === 0 || (row.dataset.search ?? '').includes(needle);
      const matchesFilters = filters.every((f) => {
        const rowValue = row.dataset[camel(f.key)] ?? '';
        return f.values.has(rowValue);
      });
      const show = matchesSearch && matchesFilters;
      if (show) {
        row.removeAttribute('hidden');
        visible++;
      } else {
        row.setAttribute('hidden', '');
      }
    }

    if (count) {
      count.textContent =
        visible === rows.length ? '' : `${visible} of ${rows.length} shown`;
    }
    updateBadges();
  }

  searchInput?.addEventListener('input', apply);
  for (const g of groups) {
    for (const input of Array.from(g.querySelectorAll('input'))) {
      input.addEventListener('change', apply);
    }
  }
  resetBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    for (const g of groups) {
      for (const input of Array.from(g.querySelectorAll<HTMLInputElement>('input'))) {
        input.checked = false;
      }
    }
    for (const dd of dropdowns) dd.open = false;
    apply();
  });

  // Close open dropdowns when the user clicks outside of any dropdown.
  document.addEventListener('click', (ev) => {
    const target = ev.target as Node | null;
    if (!target) return;
    for (const dd of dropdowns) {
      if (dd.open && !dd.contains(target)) dd.open = false;
    }
  });

  updateBadges();
}

function camel(k: string): string {
  return k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}
