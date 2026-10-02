import { dataResponseApi } from '../../api/desembolsofechahoy';

export const PAGE_SIZE = 15;

export const sortAndPaginateDesembolsos = (
  items: dataResponseApi[],
  pageSize: number = PAGE_SIZE,
  currentPage: number = 1
) => {
  const ordered = [...items].sort((a, b) => {
    const agenciaA = String(a.AGENCIA ?? '').trim();
    const agenciaB = String(b.AGENCIA ?? '').trim();

    const agenciaOrder = agenciaA.localeCompare(agenciaB, undefined, { numeric: true, sensitivity: 'base' });
    if (agenciaOrder !== 0) {
      return agenciaOrder;
    }

    const aEnProceso = a.STATUS_GLOBAL === 'EN PROCESO' ? 0 : 1;
    const bEnProceso = b.STATUS_GLOBAL === 'EN PROCESO' ? 0 : 1;
    if (aEnProceso !== bEnProceso) {
      return aEnProceso - bEnProceso;
    }

    const razonA = String(a.RAZON_SOCIAL ?? '').trim();
    const razonB = String(b.RAZON_SOCIAL ?? '').trim();
    return razonA.localeCompare(razonB, undefined, { sensitivity: 'base' });
  });

  const totalItems = ordered.length;
  const totalPages = totalItems === 0 ? 1 : Math.ceil(totalItems / pageSize);
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: ordered.slice(start, end),
    totalItems,
    totalPages,
    currentPage: safePage,
  };
};
