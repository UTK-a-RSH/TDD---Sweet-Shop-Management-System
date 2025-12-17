import { useState } from 'react';
import { loginUser } from '../api/auth';

export const useLoginForm = (onSuccess?: (data: any) => void) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string; api?: string }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: typeof errors = {};

        if (!email) newErrors.email = 'Email is required';
        if (!password) newErrors.password = 'Password is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const result = await loginUser({ email, password });
            if (onSuccess) {
                onSuccess(result);
            }
        } catch (error: any) {
            setErrors({ api: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        errors,
        isSubmitting,
        handleSubmit,
    };
};
