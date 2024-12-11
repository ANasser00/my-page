const API_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

const fetcher = async (
  query: string,
  variables: Record<string, any> = {},
  token: string = ''
) => {
  try {
    console.log('Token received in fetcher:', token);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token && token.trim()) {
      const authToken = `Bearer ${token}`;
      headers['Authorization'] = authToken;
      console.log('Authorization header:', authToken);
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        const responseText = await response.text();
        console.error('401 Response:', responseText);
        throw new Error('Unauthorized: Invalid or expired token');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('GraphQL Response:', data);
    
    if (data.errors) {
      console.error('GraphQL Errors:', data.errors);
      throw new Error(data.errors[0]?.message || 'GraphQL Error');
    }

    data.data.user = data.data.user[0];

    return data.data;
  } catch (error: any) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export default fetcher;
