import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { LoginForm } from './LoginForm';
import * as authApi from '../api/auth';

// Mock the API module
vi.mock('../api/auth', () => ({
    loginUser: vi.fn(),
}));

describe('LoginForm', () => {
    it('renders login form elements', () => {
        render(<LoginForm onSubmit={vi.fn()} />);

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty submission', async () => {
        const handleSubmit = vi.fn();
        render(<LoginForm onSubmit={handleSubmit} />);

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/email is required/i)).toBeInTheDocument();
            expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        });

        expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('calls login API on valid submission', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();

        // Mock successful login
        (authApi.loginUser as any).mockResolvedValue({ user: { id: '1' }, token: 'abc' });

        render(<LoginForm onSubmit={handleSubmit} />);

        await user.type(screen.getByLabelText(/email/i), 'test@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');

        const submitButton = screen.getByRole('button', { name: /sign in/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(authApi.loginUser).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
            expect(handleSubmit).toHaveBeenCalledWith({ user: { id: '1' }, token: 'abc' });
        });
    });
});
