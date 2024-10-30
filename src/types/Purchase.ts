/**
 * A formatted version of the Purchase data returned from the QuickBooks API.
 */

import type { QueryResult } from './QueryResult';

export type Purchase = {
  // A Query Result object that is included as part of the object.
  result_info: QueryResult;
  //  the QuickBooks internal Id.
  id: string;
  // The Tax Code of the Transaction related to the Purchase.
  taxCodeId: string;
};
