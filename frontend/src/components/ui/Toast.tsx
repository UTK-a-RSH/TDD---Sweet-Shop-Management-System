import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, 3000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-zinc-900 border-zinc-800 text-zinc-50',
        error: 'bg-red-950 border-red-900 text-red-50',
        info: 'bg-blue-950 border-blue-900 text-blue-50',
    };

    return (
        <div
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg border shadow-lg transition-all duration-300 ease-in-out ${bgColors[type]
                } ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
        >
            <div className="flex items-center space-x-2">
                {type === 'success' && (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                )}
                <span className="font-medium">{message}</span>
            </div>
        </div>
    );
};
