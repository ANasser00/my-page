import fetcher from '../../utils/fetcher';

export interface UserInfo {
  id: string;
  login: string;
  firstName: string;
  lastName: string;
  totalUp: number;
  totalDown: number;
  createdAt: string;
  email: string;
  campus: string;
  auditRatio: number;
}

export interface Progress {
  id: string;
  grade: number;
  createdAt: string;
  object: {
    id: string;
    name: string;
    type: string;
  };
}

export interface XPView {
  userId: string;
  amount: number;
  path: string;
  __typename: string;
}

export interface UserData {
  user: UserInfo;
  xp_view: XPView[];
  progress: Progress[];
}

const USER_QUERY = `
  query {
     user {   
  firstName
    lastName
    id
    login
    auditRatio
    email
    campus
    totalUp
    totalDown   
    createdAt   
  }
    xp_view (where:{event:{id:{_eq:20}}}) {
      userId
      amount
      path
      __typename
    }
   progress (where:{object:{type:{_eq:"project"}}}) {
      id
      grade
      createdAt
      object {
        id
        name
        type
      }
    }
  }
`;

export const getUserData = async (token: string): Promise<UserData> => {
  try {
    const data = await fetcher(USER_QUERY, {}, token);
    console.log('GraphQL Response Data:', data);
    return data;
  } catch (error: any) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};