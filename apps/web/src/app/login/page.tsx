'use client';

import {
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
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
  { label: 'Học viên', email: 'hocvien1@englishpro.local', hint: 'Học bài, làm quiz, chăm Pingu' },
  { label: 'Giáo viên', email: 'giaovien@englishpro.local', hint: 'Theo dõi lớp và hỗ trợ học viên' },
  { label: 'Phụ huynh', email: 'phuhuynh@englishpro.local', hint: 'Xem tiến trình và cảnh báo ôn tập' },
  { label: 'Quản trị', email: 'admin@englishpro.local', hint: 'Điều phối hệ thống và nội dung' },
];

const loginCriticalCss = `
  *{box-sizing:border-box}
  body{margin:0;color:#102033;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f5fdff}
  button,input{font:inherit}
  .zooAmbientLayer{position:fixed;inset:0;z-index:40;overflow:hidden;pointer-events:none}
  .zooAnimal{position:absolute;left:var(--zoo-x);top:var(--zoo-y);display:grid;width:76px;height:76px;place-items:center;margin:0;border:0!important;background:transparent!important;box-shadow:none!important;color:transparent;cursor:pointer;pointer-events:auto;transform:translate(-50%,-50%);animation:zooLoginRailTop 8.5s ease-in-out infinite;animation-delay:var(--zoo-delay);-webkit-tap-highlight-color:transparent}
  .zooAnimal-right{animation-name:zooLoginRailRight}.zooAnimal-bottom{animation-name:zooLoginRailBottom}.zooAnimal-left{animation-name:zooLoginRailLeft}.zooAnimal-water{animation-name:zooLoginRailBottom}
  .zooAnimal:hover,.zooAnimal:focus{outline:none}.zooAnimal.isFleeing{animation:zooLoginFlee .9s cubic-bezier(.19,1,.22,1) both}
  .zooAura{position:absolute;width:64px;height:64px;border-radius:999px;background:radial-gradient(circle,color-mix(in srgb,var(--zoo-color) 24%,transparent),transparent 70%);opacity:.42;filter:blur(8px)}
  .zooShadow{position:absolute;left:50%;bottom:14px;width:46px;height:10px;border-radius:999px;background:rgba(15,23,42,.16);filter:blur(3px);transform:translateX(-50%)}
  .zooCreature{position:relative;display:block;width:72px;height:66px;overflow:visible;filter:drop-shadow(0 12px 14px rgba(15,23,42,.18));transform-origin:50% 88%;animation:zooLoginBreathe 2.8s ease-in-out infinite}.zooCreatureSvg{display:block;width:100%;height:100%;overflow:visible}.zooCreatureWideSvg{width:82px;translate:-5px 2px}.zooCreatureSvg *{vector-effect:non-scaling-stroke}
  .zooSvgEye{transform-box:fill-box;transform-origin:center;animation:zooLoginBlink 5.6s ease-in-out infinite}.zooSvgEar,.zooSvgTail,.zooSvgWing,.zooSvgFin,.zooSvgLeg,.zooSvgBubble{transform-box:fill-box;transform-origin:center}.zooSvgEar{animation:zooLoginEar 4.2s ease-in-out infinite}.zooSvgTail{animation:zooLoginTail 2.1s ease-in-out infinite}.zooSvgWing,.zooSvgFin{animation:zooLoginFlap 2.8s ease-in-out infinite}.zooSvgLegLeft{animation:zooLoginStepLeft .88s ease-in-out infinite}.zooSvgLegRight{animation:zooLoginStepRight .88s ease-in-out infinite}.zooSvgBubble{animation:zooLoginBubble 3.8s ease-in-out infinite}
  .authShell{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(430px,.92fr);min-height:100vh;overflow:hidden;background:linear-gradient(90deg,rgba(6,182,212,.11) 0 1px,transparent 1px 100%) 0 0/36px 36px,linear-gradient(180deg,rgba(37,99,235,.09) 0 1px,transparent 1px 100%) 0 0/36px 36px,radial-gradient(circle at 9% 12%,rgba(34,211,238,.34),transparent 0 260px),radial-gradient(circle at 84% 18%,rgba(244,63,94,.2),transparent 0 260px),radial-gradient(circle at 72% 86%,rgba(250,204,21,.18),transparent 0 280px),linear-gradient(135deg,#f5fdff 0%,#eef7ff 38%,#fff7ed 100%)}
  .authBackdrop{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
  .authBackdrop:before{content:"";position:absolute;inset:0;background:linear-gradient(118deg,transparent 0 20%,rgba(255,255,255,.55) 34%,transparent 48%),repeating-linear-gradient(135deg,rgba(37,99,235,.07) 0 10px,transparent 10px 24px);opacity:.7}
  .authGridGlow{position:absolute;width:280px;height:280px;border-radius:999px;filter:blur(32px);opacity:.32}
  .authGridGlowOne{left:-90px;top:16%;background:#22d3ee}.authGridGlowTwo{right:-100px;bottom:8%;background:#fb7185}
  .authPanel{position:relative;display:grid;align-content:center;gap:22px;padding:clamp(28px,5vw,64px);border-right:1px solid rgba(14,165,233,.22);background:linear-gradient(180deg,rgba(255,255,255,.76),rgba(236,254,255,.58)),repeating-linear-gradient(90deg,rgba(14,165,233,.06) 0 12px,transparent 12px 24px);box-shadow:inset -1px 0 0 rgba(255,255,255,.68)}
  .authPanelTop{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .authBrand{display:flex;align-items:center;gap:14px;min-width:0}.brandMark{display:grid;width:58px;height:58px;place-items:center;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#2563eb 52%,#7c3aed);color:#fff;box-shadow:0 18px 38px rgba(37,99,235,.28),inset 0 1px 0 rgba(255,255,255,.34)}
  .authBrand strong{display:block;color:#0f172a;font-size:22px;line-height:1.05}.authBrand span{display:block;color:#64748b;font-size:13px;font-weight:800}.themeToggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid rgba(14,165,233,.22);border-radius:8px;background:linear-gradient(135deg,rgba(6,182,212,.14),rgba(249,115,22,.12));color:#0f172a;font-weight:800;cursor:pointer}
  .authCopy{position:relative;z-index:1;max-width:760px}.eyebrow{margin:0 0 6px;color:#64748b;font-size:13px;font-weight:800;text-transform:uppercase}.authCopy .eyebrow{display:inline-flex;min-height:30px;align-items:center;padding:0 12px;border:1px solid rgba(14,165,233,.24);border-radius:8px;background:linear-gradient(135deg,rgba(224,242,254,.96),rgba(255,247,237,.86));color:#0f766e}.authCopy h1{display:inline-flex;align-items:center;width:max-content;max-width:100%;margin:10px 0 0;padding:8px 14px;border:2px solid rgba(37,99,235,.28);border-radius:8px;background:linear-gradient(135deg,#fde047 0%,#facc15 45%,#38bdf8 46%,#2563eb 100%);color:#082f49;font-size:clamp(24px,2.8vw,38px);font-weight:950;line-height:1;letter-spacing:0;white-space:nowrap;text-shadow:0 1px 0 rgba(255,255,255,.7);box-shadow:0 16px 34px rgba(37,99,235,.16),inset 0 1px 0 rgba(255,255,255,.72)}.authCopy p:not(.eyebrow){max-width:700px;color:#405166;font-size:17px;font-weight:700;line-height:1.7}
  .authWorldCard{position:relative;z-index:1;display:grid;gap:12px;max-width:760px;margin-top:-8px;padding:14px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.84),rgba(236,254,255,.68));box-shadow:0 22px 55px rgba(14,165,233,.12);backdrop-filter:blur(16px) saturate(140%)}
  .authWorldSky{position:relative;min-height:250px;border:1px solid rgba(255,255,255,.7);border-radius:8px;overflow:hidden;background:#0f172a}.authPokemonGif{display:block;width:100%;height:100%;min-height:250px;object-fit:cover;image-rendering:pixelated}
  .authWorldStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.authWorldStats span{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:1px solid rgba(14,165,233,.16);border-radius:8px;background:rgba(255,255,255,.82);color:#0f172a;font-size:15px;font-weight:900}
  .authHighlights{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:760px}.authHighlights div{display:flex;align-items:flex-start;gap:10px;min-height:76px;padding:14px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.9),rgba(224,242,254,.64));color:#0f172a;font-weight:850;box-shadow:0 14px 28px rgba(37,99,235,.09)}
  .authFormCard{position:relative;display:grid;align-content:center;padding:clamp(24px,4.6vw,60px);background:linear-gradient(180deg,rgba(255,255,255,.58),rgba(255,247,237,.5)),repeating-linear-gradient(135deg,rgba(249,115,22,.06) 0 10px,transparent 10px 24px)}
  .authForm{position:relative;display:grid;gap:16px;max-width:540px;padding:clamp(22px,3vw,34px);border:1px solid rgba(255,255,255,.72);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.9)),linear-gradient(135deg,rgba(14,165,233,.14),rgba(249,115,22,.12));box-shadow:0 34px 90px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.78)}
  .authForm:before{content:"";position:absolute;inset:-1px;z-index:-1;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#6366f1,#fb7185,#f59e0b);opacity:.58}.authFormBadge{display:inline-flex;width:max-content;align-items:center;gap:8px;min-height:34px;padding:0 12px;border:1px solid rgba(14,165,233,.18);border-radius:8px;background:linear-gradient(135deg,rgba(224,242,254,.94),rgba(220,252,231,.8));color:#075985;font-size:12px;font-weight:950;text-transform:uppercase}.sectionTitle h2{margin:0;color:#0f172a;font-size:clamp(28px,3vw,38px)}.sectionTitle span{color:#64748b;font-weight:800}
  .demoAccounts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.demoAccount{display:grid;grid-template-columns:36px minmax(0,1fr);gap:10px;min-height:104px;padding:12px;border:1px solid rgba(14,165,233,.16);border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(236,254,255,.7));text-align:left;cursor:pointer}.demoAccount:hover,.demoAccount.selected{transform:translateY(-2px);border-color:rgba(37,99,235,.36);background:linear-gradient(145deg,rgba(224,242,254,.96),rgba(255,237,213,.74));box-shadow:0 18px 38px rgba(37,99,235,.14)}.demoAccountIcon{display:grid;width:36px;height:36px;place-items:center;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#2563eb);color:#fff}.demoAccount strong,.demoAccount em,.demoAccount small{display:block}.demoAccount strong{color:#0f172a;font-size:14px}.demoAccount em{margin-top:4px;color:#475569;font-size:12px;font-style:normal;font-weight:800;line-height:1.35}.demoAccount small{margin-top:6px;color:#64748b;font-size:11px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
  .field{display:grid;gap:8px}.field span{color:#334155;font-size:13px;font-weight:950}.field input{width:100%;min-height:52px;padding:0 14px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.95));color:#0f172a;font-size:15px;font-weight:800;outline:none}.field input:focus{border-color:rgba(37,99,235,.42);outline:3px solid rgba(37,99,235,.14)}.passwordField{display:grid;grid-template-columns:minmax(0,1fr) 48px;gap:8px}.iconButton{display:inline-flex;align-items:center;justify-content:center;min-height:52px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:#fff;color:#0f172a;cursor:pointer}.primaryButton{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 18px;border:0;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#2563eb 48%,#7c3aed 72%,#f97316);color:#fff;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 20px 44px rgba(37,99,235,.28)}.primaryButton:disabled{opacity:.7;cursor:wait}.errorBox{padding:12px;border:1px solid rgba(239,68,68,.22);border-radius:8px;background:#fef2f2;color:#b91c1c;font-weight:800}.authSafetyNote{display:inline-flex;align-items:center;justify-content:center;gap:8px;color:#475569;font-size:13px;font-weight:800}.authSafetyNote strong{color:#0f172a}
  @media(max-width:1120px){.authShell{grid-template-columns:1fr}.authPanel{border-right:0;border-bottom:1px solid rgba(14,165,233,.2)}.authFormCard{min-height:auto}}
  @media(max-width:720px){.authPanel,.authFormCard{padding:18px}.authPanelTop{align-items:flex-start}.authCopy h1{font-size:24px}.authWorldCard{margin-top:-4px}.authWorldSky,.authPokemonGif{min-height:190px}.authHighlights,.authWorldStats,.demoAccounts{grid-template-columns:1fr}.authForm{padding:18px}}
  @keyframes authZooRabbitHop{0%,100%{transform:translateY(0) scaleY(1)}45%{transform:translateY(-8px) scaleY(1.03)}62%{transform:translateY(0) scaleY(.96)}}@keyframes authZooPenguinWaddle{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-3px) rotate(1.5deg)}}@keyframes authZooTurtleMove{0%,100%{transform:translateX(-5px)}50%{transform:translateX(6px)}}@keyframes authZooFishSwim{0%,100%{transform:translateX(-8px) translateY(0)}50%{transform:translateX(12px) translateY(-3px)}}@keyframes authZooFootTap{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(2px) rotate(3deg)}}@keyframes zooLoginRailTop{0%,100%{transform:translate(-50%,-50%) translateX(-30px)}50%{transform:translate(-50%,-50%) translateX(30px) translateY(3px)}}@keyframes zooLoginRailRight{0%,100%{transform:translate(-50%,-50%) translateY(-30px) rotate(2deg)}50%{transform:translate(-50%,-50%) translateX(-3px) translateY(30px) rotate(-2deg)}}@keyframes zooLoginRailBottom{0%,100%{transform:translate(-50%,-50%) translateX(32px)}50%{transform:translate(-50%,-50%) translateX(-32px) translateY(-3px)}}@keyframes zooLoginRailLeft{0%,100%{transform:translate(-50%,-50%) translateY(30px) rotate(-2deg)}50%{transform:translate(-50%,-50%) translateX(3px) translateY(-30px) rotate(2deg)}}@keyframes zooLoginFlee{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}60%{opacity:.94;transform:translate(-50%,-50%) translateX(110px) translateY(-44px) scale(.86) rotate(9deg)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes zooLoginBreathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.96) translateY(1px)}}@keyframes zooLoginBlink{0%,88%,100%{transform:scaleY(1)}92%{transform:scaleY(.08)}}@keyframes zooLoginEar{0%,100%,46%{transform:rotate(0)}54%{transform:rotate(7deg)}62%{transform:rotate(-4deg)}}@keyframes zooLoginTail{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(10deg) translateX(1px)}}@keyframes zooLoginFlap{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(10deg) translateY(1px)}}@keyframes zooLoginStepLeft{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(2px) rotate(2deg)}}@keyframes zooLoginStepRight{0%,100%{transform:translateY(2px) rotate(2deg)}50%{transform:translateY(0) rotate(-2deg)}}@keyframes zooLoginBubble{0%{opacity:0;transform:translateY(8px) scale(.82)}35%{opacity:.82}100%{opacity:0;transform:translateY(-18px) scale(1.12)}}
`;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('hocvien1@englishpro.local');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <>
      <style dangerouslySetInnerHTML={{ __html: loginCriticalCss }} />
      <main className="authShell">
      <div className="authBackdrop" aria-hidden="true">
        <span className="authGridGlow authGridGlowOne" />
        <span className="authGridGlow authGridGlowTwo" />
      </div>

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

        <div className="authWorldCard" aria-label="Không gian học tập EnglishPro">
          <div className="authWorldSky">
            <img className="authPokemonGif" src="/media/pokemon1.gif" alt="" />
          </div>
        </div>
      </section>

      <section className="authFormCard">
        <form className="authForm" onSubmit={handleSubmit}>
          <div className="authFormBadge">
            <LockKeyhole size={16} />
            Phiên đăng nhập bảo mật
          </div>

          <div className="sectionTitle">
            <div>
              <h2>Đăng nhập hệ thống</h2>
              <span>Chọn nhanh tài khoản mẫu hoặc nhập thông tin riêng</span>
            </div>
          </div>

          <div className="demoAccounts" aria-label="Tài khoản mẫu">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                className={`demoAccount ${email === account.email ? 'selected' : ''}`}
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword('123456');
                }}
              >
                <span className="demoAccountIcon">
                  <Users size={16} />
                </span>
                <span>
                  <strong>{account.label}</strong>
                  <em>{account.hint}</em>
                  <small>{account.email}</small>
                </span>
              </button>
            ))}
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
            {loading ? 'Đang mở cổng...' : 'Đăng nhập'}
            {!loading ? <ArrowRight size={17} /> : null}
          </button>

          <div className="authSafetyNote">
            <ShieldCheck size={15} />
            Mật khẩu mẫu: <strong>123456</strong>
          </div>
        </form>
      </section>
      </main>
    </>
  );
}
