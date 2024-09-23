/**
 * Defines a test API route for making sql request to the QuickBooks API 'query' endpoint.
 */
import { queryRequest } from '@/actions/qbo-query';

export async function GET() {
  return await queryRequest();
}
