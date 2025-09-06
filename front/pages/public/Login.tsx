import { userService } from '../../services/api.ts';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { authAtom } from '../../context/auth';
import type { User } from '../../types/index.ts';


function Login() {
    const [formData, setFormData] = useState<User>({
        id: '',
        email: '',
        username: '',
        password: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [, setAuth] = useAtom(authAtom);
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSumit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        try {
            const loginData = {
                email: formData.email,
                password: formData.password
            };
            const response = await userService.login(loginData);
            setFormData({id: response.user_id, ...formData});
            setAuth({ token: response.accessToken, user: response.user });
            console.log('Login successful:', response.username);
            console.log('User ID:', response.user_id);
            navigate('/Chat', {
                state: {user_id: response.user_id}
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }
    return (
        <div>
            <form onSubmit={handleSumit} className='flex flex-col gap-2 justify-center items-center h-screen '>
                {error && <div className="text-red-500 text-center">{error}</div>}
                <input className='p-3  border rounded'
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                />
                <input className='p-3 border rounded'
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                />
                <button
                    className='hover:bg-red-600 rounded cursor-pointer p-2 bg-blue-600'
                    type="submit"

                >{loading ? 'Logging in...' : 'Login'}</button>
                <p className="text-center">
                    Don't have an account?{' '}
                    <a href="/register" className="text-blue-600 hover:underline">
                        Register
                    </a>
                </p>
            </form>
        </div>
    )

}

export default Login;