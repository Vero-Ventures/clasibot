export async function POST(request: Request) {
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
