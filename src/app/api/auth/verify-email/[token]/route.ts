
import { NextResponse, type NextRequest } from 'next/server';

const POD_API_URL = process.env.POD_API_URL || 'http://localhost:9002';

interface VerifyEmailParams {
  params: {
    token: string;
  };
}

// This is a GET route because verification links in emails are typically GET requests.
export async function GET(request: NextRequest, { params }: VerifyEmailParams) {
  const { token } = params;

  if (!token) {
    return NextResponse.json({ error: 'Verification token is missing.' }, { status: 400 });
  }

  try {
    // Call PANDA Pod API to handle the actual verification
    const podResponse = await fetch(\`\${POD_API_URL}/api/pod/auth/verify-email/\${token}\`, {
      method: 'GET', // The Pod endpoint is also GET
    });

    const podData = await podResponse.json();

    if (!podResponse.ok) {
      // Pass through the error from the Pod API
      return NextResponse.json({ error: podData.error || 'Email verification failed at Pod.' }, { status: podResponse.status });
    }

    // Successfully verified, redirect to login or a success page
    // For now, just return the success message from the Pod
    // A redirect to login with a success message might be better UX
    // return NextResponse.redirect(new URL('/auth/login?verified=true', request.url));
    return NextResponse.json({ message: podData.message });


  } catch (error) {
    console.error('BFF Email Verification error:', error);
    return NextResponse.json({ error: 'Internal server error during email verification.' }, { status: 500 });
  }
}
