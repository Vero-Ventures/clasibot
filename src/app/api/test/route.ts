export async function POST(_request: Request) {
  try {
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:' + error.message);
    } else {
      console.error('Unexpected Error');
    }
    return new Response('Invalid', { status: 400 });
  }
}
