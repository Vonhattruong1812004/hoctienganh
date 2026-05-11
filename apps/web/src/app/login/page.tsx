'use client';

import { ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ThemeToggleButton } from '../../components/theme-toggle';
import { apiPost } from '../../lib/api';
import { getStoredSession, setStoredSession, type WebAuthSession } from '../../lib/session';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    roles: string[];
  };
};

const demoAccounts = [
  { label: 'Học viên', email: 'hocvien1@englishpro.local' },
  { label: 'Giáo viên', email: 'giaovien@englishpro.local' },
  { label: 'Phụ huynh', email: 'phuhuynh@englishpro.local' },
  { label: 'Quản trị', email: 'admin@englishpro.local' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('hocvien1@englishpro.local');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => 'Đăng nhập vào EnglishPro', []);

  useEffect(() => {
    if (getStoredSession()) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiPost<LoginResponse>('/auth/login', { email, password });
      const session: WebAuthSession = {
        accessToken: response.accessToken,
        user: response.user,
      };

      setStoredSession(session);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authShell">
      <section className="authPanel">
        <div className="authPanelTop">
          <div className="authBrand">
            <div className="brandMark">
              <GraduationCap size={22} />
            </div>
            <div>
              <strong>EnglishPro</strong>
              <span>Learning System</span>
            </div>
          </div>
          <ThemeToggleButton />
        </div>

        <div className="authCopy">
          <p className="eyebrow">Truy cập an toàn</p>
          <h1>{title}</h1>
          <p>
            Hệ thống học tiếng Anh theo lộ trình, bài học, quiz và tiến trình. Đăng nhập để vào
            dashboard theo vai trò của bạn.
          </p>
        </div>

        <div className="authHighlights">
          <div>
            <ShieldCheck size={18} />
            <span>JWT + RBAC sẵn sàng</span>
          </div>
          <div>
            <Sparkles size={18} />
            <span>Dữ liệu mẫu lộ trình A1</span>
          </div>
          <div>
            <ArrowRight size={18} />
            <span>Dashboard theo vai trò</span>
          </div>
        </div>

        <div className="demoAccounts">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              className="demoAccount"
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword('123456');
              }}
            >
              <strong>{account.label}</strong>
              <span>{account.email}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="authFormCard">
        <form className="authForm" onSubmit={handleSubmit}>
          <div className="sectionTitle">
            <div>
              <h2>Đăng nhập hệ thống</h2>
              <span>Sử dụng tài khoản mẫu đã seed sẵn</span>
            </div>
          </div>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Nhập email"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Mật khẩu</span>
            <div className="passwordField">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
                minLength={6}
              />
              <button
                className="iconButton"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error ? <div className="errorBox">{error}</div> : null}

          <button className="primaryButton fullWidth" type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </main>
  );
}
