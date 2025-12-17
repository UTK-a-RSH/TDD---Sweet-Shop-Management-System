import { useLoginForm } from '../hooks/useLoginForm';

export const LoginForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
    const { email, setEmail, password, setPassword, errors, isSubmitting, handleSubmit } = useLoginForm(onSubmit);

    return (
        <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm">
            <h2 className="text-2xl font-semibold text-center text-zinc-50 mb-8">Welcome Back</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                {errors.api && (
                    <div role="alert" className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                        {errors.api}
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-400">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-md focus:ring-2 focus:ring-zinc-700 focus:border-transparent outline-none transition-all text-zinc-50 placeholder-zinc-600"
                        placeholder="you@example.com"
                    />
                    {errors.email && (
                        <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-zinc-400">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-md focus:ring-2 focus:ring-zinc-700 focus:border-transparent outline-none transition-all text-zinc-50 placeholder-zinc-600"
                        placeholder="••••••••"
                    />
                    {errors.password && (
                        <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};
