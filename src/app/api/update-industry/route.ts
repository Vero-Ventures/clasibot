import prisma from '@/lib/db';
import { options } from '../auth/[...nextauth]/options';
import { getServerSession } from 'next-auth';

export async function POST(req: Request) {
  // Get the current session.
  const session = await getServerSession(options);
  if (!session) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Get the industry and email from the request body.
  const { industry, email } = await req.json();

  if (!industry || !email) {
    return Response.json(
      { message: 'Industry or email not provided' },
      { status: 400 }
    );
  }

  try {
    // Update the user's industry using the email.
    await prisma.user.update({
      where: { email },
      data: { industry },
    });

    // If the industry is updated successfully, return a success response with a status of 200.
    return Response.json(
      { message: 'Industry updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    // Return an error response with a status of 500.
    return Response.json({ message: 'Internal server error', errorMessage: error }, { status: 500 });
  }
}
