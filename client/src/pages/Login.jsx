import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores';
import toast from 'react-hot-toast';
import { Code, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(email, password);
    if (result.success) {
      toast.success('登录成功！');
      navigate('/');
    } else {
      toast.error(result.message || '登录失败');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-white mb-2">
            <Code className="text-primary-500" size={40} />
            <span>C++ Learn</span>
          </div>
          <p className="text-slate-400">提升编程技能，从打字练习开始</p>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">登录</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-slate-300 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input w-full pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-lg"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center text-slate-400 mt-6">
            还没有账号？{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
