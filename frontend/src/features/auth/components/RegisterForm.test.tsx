import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';
import * as authApi from '../api/auth';
import { ToastProvider } from '../../../context/ToastContext';

// Mock the API module
vi.mock('../api/auth', () => ({
    registerUser: vi.fn(),
}));

import { MemoryRouter } from 'react-router-dom';

const renderWithToast = (component: React.ReactNode) => {
    return render(
        <MemoryRouter>
            <ToastProvider>{component}</ToastProvider>
        </MemoryRouter>
    );
};

describe('RegisterForm', () => {
    it('renders register form elements', () => {
        renderWithToast(<RegisterForm />);

        expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('shows validation errors for empty submission', async () => {
        renderWithToast(<RegisterForm />);

        const submitButton = screen.getByRole('button', { name: /create account/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
            expect(screen.getByText(/name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/email is required/i)).toBeInTheDocument();
            expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        });

        expect(authApi.registerUser).not.toHaveBeenCalled();
    });

    it('calls register API on valid submission', async () => {
        const user = userEvent.setup();
        renderWithToast(<RegisterForm />);

        await user.type(screen.getByLabelText(/name/i), 'John Doe');
        await user.type(screen.getByLabelText(/email/i), 'john@example.com');
        await user.type(screen.getByLabelText(/password/i), 'password123');

        const submitButton = screen.getByRole('button', { name: /create account/i });
        await user.click(submitButton);

        await waitFor(() => {
            expect(authApi.registerUser).toHaveBeenCalledWith({
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
            });
        });
    });
});
