import type { Transaction } from '@/types/Transaction';

export const filterToUncategorized = (
  purchases: Transaction[]
): Transaction[] => {
  return purchases.filter((purchase: Transaction) =>
    purchase.category.toLowerCase().includes('uncategor')
  );
};

export const filterOutUncategorized = (
  purchases: Transaction[]
): Transaction[] => {
  return purchases.filter(
    (purchase: Transaction) =>
      !purchase.category.toLowerCase().includes('uncategor')
  );
};
