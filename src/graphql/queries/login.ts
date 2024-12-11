//Handles authentication by sending a POST request to the backend

// graphql/queries/login.ts
import fetcher from '../../utils/fetcher';

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export const loginUser = async ({ identifier, password }: LoginInput): Promise<LoginResponse> => {
  const credentials = btoa(`${identifier}:${password}`);

  try {
    const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Login failed');
    }

    const data = await response.json();
    console.log('Login Response:', data);
    console.log('Token received:', data);
    
    // Return raw token without any manipulation
    return {
      token: data,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message || 'Failed to login');
  }
};
