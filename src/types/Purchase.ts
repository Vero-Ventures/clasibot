/**
 * A formatted version of the Purchase object returned from the QuickBooks API.
 */

import type { QueryResult } from './QueryResult';

export type Purchase = {
  // A Query Result object that is included as part of the returned Purchase object.
  resultInfo: QueryResult;
  // The internal QuickBooks Id for the Purchase.
  id: string;
  // The Tax Code Id of the Transaction related to the Purchase.
  taxCodeId: string;
};
