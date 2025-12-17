export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export const registerUser = async (data: RegisterCredentials) => {
    console.log('API Request: Registering user', data);

    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
    }

    return result;
};

export const loginUser = async (data: LoginCredentials) => {
    console.log('API Request: Logging in user', data);

    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('API Response:', result);

    if (!response.ok) {
        throw new Error(result.message || 'Login failed');
    }

    return result;
};
