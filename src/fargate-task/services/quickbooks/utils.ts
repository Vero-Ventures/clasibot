import type { QBOTokenData } from '../../types';

export async function sendCookieToBackend(
  tokenData: QBOTokenData,
  backendUrl: string
): Promise<void> {
  try {
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: process.env.BACKEND_AGENT_ID!,
      },
      body: JSON.stringify(tokenData),
    });

    if (response.ok) {
      console.log('Cookie successfully sent to backend');
    } else {
      console.error('Failed to send cookie to backend:', await response.text());
    }
  } catch (error) {
    console.error('Error sending cookie to backend:', error);
    throw error;
  }
}
