'use client';

import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Gamepad2,
  GraduationCap,
  Languages,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
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
  .zooRails,.zooSky,.zooWind,.zooWaves{position:absolute;inset:0;pointer-events:none}
  .zooRail{position:absolute;display:block;background:linear-gradient(90deg,rgba(14,165,233,.24),rgba(249,115,22,.2),rgba(244,63,94,.16));opacity:.52}
  .zooRailTop,.zooRailBottom{left:18px;right:18px;height:3px;border-radius:999px}.zooRailTop{top:12px}.zooRailBottom{bottom:12px}
  .zooRailLeft,.zooRailRight{top:18px;bottom:18px;width:3px;border-radius:999px;background:linear-gradient(180deg,rgba(14,165,233,.24),rgba(249,115,22,.2),rgba(244,63,94,.16))}.zooRailLeft{left:12px}.zooRailRight{right:12px}
  .zooSun{position:absolute;right:28px;top:24px;width:48px;height:48px;border-radius:50%;background:#fde047;box-shadow:0 0 0 12px rgba(253,224,71,.18),0 0 34px rgba(250,204,21,.44);animation:zooLoginFloat 7s ease-in-out infinite}
  .zooCloud{position:absolute;width:86px;height:24px;border-radius:999px;background:rgba(255,255,255,.6);box-shadow:18px -10px 0 rgba(255,255,255,.6),40px -2px 0 rgba(255,255,255,.6);animation:zooLoginDrift 18s ease-in-out infinite}.zooCloudOne{left:8%;top:9%}.zooCloudTwo{left:54%;top:16%;animation-direction:reverse}.zooCloudThree{right:10%;top:58%;opacity:.45}
  .zooLeaf{position:absolute;top:-34px;width:18px;height:28px;border-radius:90% 0 90% 0;background:linear-gradient(135deg,#bbf7d0,#84cc16);opacity:.72;animation:zooLoginLeaf 10s linear infinite}.zooLeaf:nth-child(1){left:14%;animation-delay:-1s}.zooLeaf:nth-child(2){left:28%;animation-delay:-5s}.zooLeaf:nth-child(3){left:42%;animation-delay:-2s}.zooLeaf:nth-child(4){left:58%;animation-delay:-7s}.zooLeaf:nth-child(5){left:72%;animation-delay:-4s}.zooLeaf:nth-child(n+6){display:none}
  .zooWaves{display:none}
  .zooAnimal{position:absolute;left:var(--zoo-x);top:var(--zoo-y);display:grid;width:76px;height:76px;place-items:center;margin:0;border:0!important;background:transparent!important;box-shadow:none!important;color:transparent;cursor:pointer;pointer-events:auto;transform:translate(-50%,-50%);animation:zooLoginRailTop 8.5s ease-in-out infinite;animation-delay:var(--zoo-delay);-webkit-tap-highlight-color:transparent}
  .zooAnimal-right{animation-name:zooLoginRailRight}.zooAnimal-bottom{animation-name:zooLoginRailBottom}.zooAnimal-left{animation-name:zooLoginRailLeft}.zooAnimal-water{animation-name:zooLoginRailBottom}
  .zooAnimal:hover,.zooAnimal:focus{outline:none}.zooAnimal.isFleeing{animation:zooLoginFlee .9s cubic-bezier(.19,1,.22,1) both}
  .zooAura{position:absolute;width:64px;height:64px;border-radius:999px;background:radial-gradient(circle,color-mix(in srgb,var(--zoo-color) 24%,transparent),transparent 70%);opacity:.42;filter:blur(8px)}
  .zooShadow{position:absolute;left:50%;bottom:14px;width:46px;height:10px;border-radius:999px;background:rgba(15,23,42,.16);filter:blur(3px);transform:translateX(-50%)}
  .zooDust,.zooSpeech{display:none!important}
  .zooCreature{position:relative;display:block;width:72px;height:66px;overflow:visible;filter:drop-shadow(0 12px 14px rgba(15,23,42,.18));transform-origin:50% 88%;animation:zooLoginBreathe 2.8s ease-in-out infinite}.zooCreatureSvg{display:block;width:100%;height:100%;overflow:visible}.zooCreatureWideSvg{width:82px;translate:-5px 2px}.zooCreatureSvg *{vector-effect:non-scaling-stroke}
  .zooSvgEye{transform-box:fill-box;transform-origin:center;animation:zooLoginBlink 5.6s ease-in-out infinite}.zooSvgEar,.zooSvgTail,.zooSvgWing,.zooSvgFin,.zooSvgLeg,.zooSvgBubble{transform-box:fill-box;transform-origin:center}.zooSvgEar{animation:zooLoginEar 4.2s ease-in-out infinite}.zooSvgTail{animation:zooLoginTail 2.1s ease-in-out infinite}.zooSvgWing,.zooSvgFin{animation:zooLoginFlap 2.8s ease-in-out infinite}.zooSvgLegLeft{animation:zooLoginStepLeft .88s ease-in-out infinite}.zooSvgLegRight{animation:zooLoginStepRight .88s ease-in-out infinite}.zooSvgBubble{animation:zooLoginBubble 3.8s ease-in-out infinite}
  .authShell{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1.08fr) minmax(430px,.92fr);min-height:100vh;overflow:hidden;background:linear-gradient(90deg,rgba(6,182,212,.11) 0 1px,transparent 1px 100%) 0 0/36px 36px,linear-gradient(180deg,rgba(37,99,235,.09) 0 1px,transparent 1px 100%) 0 0/36px 36px,radial-gradient(circle at 9% 12%,rgba(34,211,238,.34),transparent 0 260px),radial-gradient(circle at 84% 18%,rgba(244,63,94,.2),transparent 0 260px),radial-gradient(circle at 72% 86%,rgba(250,204,21,.18),transparent 0 280px),linear-gradient(135deg,#f5fdff 0%,#eef7ff 38%,#fff7ed 100%)}
  .authBackdrop{position:absolute;inset:0;z-index:-1;pointer-events:none;overflow:hidden}
  .authBackdrop:before{content:"";position:absolute;inset:0;background:linear-gradient(118deg,transparent 0 20%,rgba(255,255,255,.55) 34%,transparent 48%),repeating-linear-gradient(135deg,rgba(37,99,235,.07) 0 10px,transparent 10px 24px);opacity:.7;animation:authSweep 14s ease-in-out infinite}
  .authGridGlow{position:absolute;width:280px;height:280px;border-radius:999px;filter:blur(32px);opacity:.32}
  .authGridGlowOne{left:-90px;top:16%;background:#22d3ee}.authGridGlowTwo{right:-100px;bottom:8%;background:#fb7185}
  .authFloatingLetter{position:absolute;display:grid;width:56px;height:56px;place-items:center;border:1px solid rgba(255,255,255,.58);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.8),rgba(224,242,254,.46));color:#1d4ed8;font-size:28px;font-weight:950;box-shadow:0 18px 36px rgba(37,99,235,.14);animation:authFloat 6s ease-in-out infinite}
  .authFloatingLetterOne{left:5%;top:15%}.authFloatingLetterTwo{left:47%;bottom:14%;color:#be123c;animation-delay:-2s}.authFloatingLetterThree{right:7%;top:18%;color:#b45309;animation-delay:-3.4s}
  .authPanel{position:relative;display:grid;align-content:center;gap:22px;padding:clamp(28px,5vw,64px);border-right:1px solid rgba(14,165,233,.22);background:linear-gradient(180deg,rgba(255,255,255,.76),rgba(236,254,255,.58)),repeating-linear-gradient(90deg,rgba(14,165,233,.06) 0 12px,transparent 12px 24px);box-shadow:inset -1px 0 0 rgba(255,255,255,.68)}
  .authPanelTop{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:16px}
  .authBrand{display:flex;align-items:center;gap:14px;min-width:0}.brandMark{display:grid;width:58px;height:58px;place-items:center;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#2563eb 52%,#7c3aed);color:#fff;box-shadow:0 18px 38px rgba(37,99,235,.28),inset 0 1px 0 rgba(255,255,255,.34)}
  .authBrand strong{display:block;color:#0f172a;font-size:22px;line-height:1.05}.authBrand span{display:block;color:#64748b;font-size:13px;font-weight:800}.themeToggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid rgba(14,165,233,.22);border-radius:8px;background:linear-gradient(135deg,rgba(6,182,212,.14),rgba(249,115,22,.12));color:#0f172a;font-weight:800;cursor:pointer}
  .authCopy{position:relative;z-index:1;max-width:760px}.eyebrow{margin:0 0 6px;color:#64748b;font-size:13px;font-weight:800;text-transform:uppercase}.authCopy .eyebrow{display:inline-flex;min-height:30px;align-items:center;padding:0 12px;border:1px solid rgba(14,165,233,.24);border-radius:8px;background:linear-gradient(135deg,rgba(224,242,254,.96),rgba(255,247,237,.86));color:#0f766e}.authCopy h1{margin:12px 0 0;max-width:780px;background:linear-gradient(90deg,#0f172a 0%,#0891b2 24%,#2563eb 52%,#f97316 76%,#be123c 100%);background-clip:text;color:#07111f;font-size:clamp(44px,6vw,82px);line-height:1.02;-webkit-text-fill-color:transparent}.authCopy p:not(.eyebrow){max-width:700px;color:#405166;font-size:17px;font-weight:700;line-height:1.7}
  .authWorldCard{position:relative;z-index:1;display:grid;gap:12px;max-width:760px;padding:14px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:linear-gradient(135deg,rgba(255,255,255,.84),rgba(236,254,255,.68));box-shadow:0 22px 55px rgba(14,165,233,.12);backdrop-filter:blur(16px) saturate(140%)}
  .authWorldSky{position:relative;min-height:250px;border:1px solid rgba(255,255,255,.7);border-radius:8px;overflow:hidden;background:#bae6fd}.authZooSceneSvg{display:block;width:100%;min-height:250px;overflow:hidden;border-radius:inherit}.authZooGrid{fill:none;stroke:rgba(255,255,255,.28);stroke-width:1}.authZooCloud{transform-box:fill-box;transform-origin:center;animation:authZooCloudFloat 13s ease-in-out infinite}.authZooCloudRight{animation-duration:16s;animation-direction:reverse}.authZooSun{transform-box:fill-box;transform-origin:center;animation:authZooSunGlow 6.5s ease-in-out infinite}.authZooTree{transform-box:fill-box;transform-origin:50% 100%;animation:authZooTreeSway 4.8s ease-in-out infinite}.authZooRabbit,.authZooPenguin,.authZooTurtle,.authZooFish,.authZooLeaves{transform-box:fill-box;transform-origin:center bottom}.authZooRabbit{animation:authZooRabbitHop 4.2s ease-in-out infinite}.authZooPenguin{animation:authZooPenguinWaddle 3.2s ease-in-out infinite}.authZooTurtle{animation:authZooTurtleMove 5.4s ease-in-out infinite}.authZooFish{animation:authZooFishSwim 3.4s ease-in-out infinite}.authZooLeaves{animation:authZooLeafDrift 5.6s ease-in-out infinite}.authZooFootLeft{animation:authZooFootTap .82s ease-in-out infinite}.authZooFootRight{animation:authZooFootTap .82s ease-in-out infinite reverse}
  .authWorldStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.authWorldStats span{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:1px solid rgba(14,165,233,.16);border-radius:8px;background:rgba(255,255,255,.82);color:#0f172a;font-size:15px;font-weight:900}
  .authHighlights{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-width:760px}.authHighlights div{display:flex;align-items:flex-start;gap:10px;min-height:76px;padding:14px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.9),rgba(224,242,254,.64));color:#0f172a;font-weight:850;box-shadow:0 14px 28px rgba(37,99,235,.09)}
  .authFormCard{position:relative;display:grid;align-content:center;padding:clamp(24px,4.6vw,60px);background:linear-gradient(180deg,rgba(255,255,255,.58),rgba(255,247,237,.5)),repeating-linear-gradient(135deg,rgba(249,115,22,.06) 0 10px,transparent 10px 24px)}
  .authForm{position:relative;display:grid;gap:16px;max-width:540px;padding:clamp(22px,3vw,34px);border:1px solid rgba(255,255,255,.72);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.96),rgba(248,250,252,.9)),linear-gradient(135deg,rgba(14,165,233,.14),rgba(249,115,22,.12));box-shadow:0 34px 90px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.78)}
  .authForm:before{content:"";position:absolute;inset:-1px;z-index:-1;border-radius:8px;background:linear-gradient(135deg,#22d3ee,#6366f1,#fb7185,#f59e0b);opacity:.58}.authFormBadge{display:inline-flex;width:max-content;align-items:center;gap:8px;min-height:34px;padding:0 12px;border:1px solid rgba(14,165,233,.18);border-radius:8px;background:linear-gradient(135deg,rgba(224,242,254,.94),rgba(220,252,231,.8));color:#075985;font-size:12px;font-weight:950;text-transform:uppercase}.sectionTitle h2{margin:0;color:#0f172a;font-size:clamp(28px,3vw,38px)}.sectionTitle span{color:#64748b;font-weight:800}
  .demoAccounts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.demoAccount{display:grid;grid-template-columns:36px minmax(0,1fr);gap:10px;min-height:104px;padding:12px;border:1px solid rgba(14,165,233,.16);border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.94),rgba(236,254,255,.7));text-align:left;cursor:pointer}.demoAccount:hover,.demoAccount.selected{transform:translateY(-2px);border-color:rgba(37,99,235,.36);background:linear-gradient(145deg,rgba(224,242,254,.96),rgba(255,237,213,.74));box-shadow:0 18px 38px rgba(37,99,235,.14)}.demoAccountIcon{display:grid;width:36px;height:36px;place-items:center;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#2563eb);color:#fff}.demoAccount strong,.demoAccount em,.demoAccount small{display:block}.demoAccount strong{color:#0f172a;font-size:14px}.demoAccount em{margin-top:4px;color:#475569;font-size:12px;font-style:normal;font-weight:800;line-height:1.35}.demoAccount small{margin-top:6px;color:#64748b;font-size:11px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
  .field{display:grid;gap:8px}.field span{color:#334155;font-size:13px;font-weight:950}.field input{width:100%;min-height:52px;padding:0 14px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(248,250,252,.95));color:#0f172a;font-size:15px;font-weight:800;outline:none}.field input:focus{border-color:rgba(37,99,235,.42);outline:3px solid rgba(37,99,235,.14)}.passwordField{display:grid;grid-template-columns:minmax(0,1fr) 48px;gap:8px}.iconButton{display:inline-flex;align-items:center;justify-content:center;min-height:52px;border:1px solid rgba(14,165,233,.2);border-radius:8px;background:#fff;color:#0f172a;cursor:pointer}.primaryButton{display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:54px;padding:0 18px;border:0;border-radius:8px;background:linear-gradient(135deg,#06b6d4,#2563eb 48%,#7c3aed 72%,#f97316);color:#fff;font-size:16px;font-weight:900;cursor:pointer;box-shadow:0 20px 44px rgba(37,99,235,.28)}.primaryButton:disabled{opacity:.7;cursor:wait}.errorBox{padding:12px;border:1px solid rgba(239,68,68,.22);border-radius:8px;background:#fef2f2;color:#b91c1c;font-weight:800}.authSafetyNote{display:inline-flex;align-items:center;justify-content:center;gap:8px;color:#475569;font-size:13px;font-weight:800}.authSafetyNote strong{color:#0f172a}
  @media(max-width:1120px){.authShell{grid-template-columns:1fr}.authPanel{border-right:0;border-bottom:1px solid rgba(14,165,233,.2)}.authFormCard{min-height:auto}}
  @media(max-width:720px){.authPanel,.authFormCard{padding:18px}.authPanelTop{align-items:flex-start}.authCopy h1{font-size:38px}.authWorldSky,.authZooSceneSvg{min-height:190px}.authHighlights,.authWorldStats,.demoAccounts{grid-template-columns:1fr}.authForm{padding:18px}.authFloatingLetter{display:none}}
  @keyframes authSweep{0%,100%{transform:translateX(-28%)}50%{transform:translateX(28%)}}@keyframes authFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes authZooCloudFloat{0%,100%{transform:translateX(0) translateY(0)}50%{transform:translateX(18px) translateY(-3px)}}@keyframes authZooSunGlow{0%,100%{transform:rotate(0) scale(1);opacity:.96}50%{transform:rotate(8deg) scale(1.06);opacity:1}}@keyframes authZooTreeSway{0%,100%{transform:rotate(-.4deg)}50%{transform:rotate(1.1deg)}}@keyframes authZooRabbitHop{0%,100%{transform:translateY(0) scaleY(1)}45%{transform:translateY(-8px) scaleY(1.03)}62%{transform:translateY(0) scaleY(.96)}}@keyframes authZooPenguinWaddle{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-3px) rotate(1.5deg)}}@keyframes authZooTurtleMove{0%,100%{transform:translateX(-5px)}50%{transform:translateX(6px)}}@keyframes authZooFishSwim{0%,100%{transform:translateX(-8px) translateY(0)}50%{transform:translateX(12px) translateY(-3px)}}@keyframes authZooLeafDrift{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(8px) rotate(6deg)}}@keyframes authZooFootTap{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(2px) rotate(3deg)}}@keyframes zooLoginFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}@keyframes zooLoginDrift{0%,100%{transform:translateX(0)}50%{transform:translateX(24px)}}@keyframes zooLoginLeaf{0%{transform:translate3d(0,-40px,0) rotate(0)}100%{transform:translate3d(22px,108vh,0) rotate(360deg)}}@keyframes zooLoginRailTop{0%,100%{transform:translate(-50%,-50%) translateX(-30px)}50%{transform:translate(-50%,-50%) translateX(30px) translateY(3px)}}@keyframes zooLoginRailRight{0%,100%{transform:translate(-50%,-50%) translateY(-30px) rotate(2deg)}50%{transform:translate(-50%,-50%) translateX(-3px) translateY(30px) rotate(-2deg)}}@keyframes zooLoginRailBottom{0%,100%{transform:translate(-50%,-50%) translateX(32px)}50%{transform:translate(-50%,-50%) translateX(-32px) translateY(-3px)}}@keyframes zooLoginRailLeft{0%,100%{transform:translate(-50%,-50%) translateY(30px) rotate(-2deg)}50%{transform:translate(-50%,-50%) translateX(3px) translateY(-30px) rotate(2deg)}}@keyframes zooLoginFlee{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}60%{opacity:.94;transform:translate(-50%,-50%) translateX(110px) translateY(-44px) scale(.86) rotate(9deg)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}@keyframes zooLoginBreathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.96) translateY(1px)}}@keyframes zooLoginBlink{0%,88%,100%{transform:scaleY(1)}92%{transform:scaleY(.08)}}@keyframes zooLoginEar{0%,100%,46%{transform:rotate(0)}54%{transform:rotate(7deg)}62%{transform:rotate(-4deg)}}@keyframes zooLoginTail{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(10deg) translateX(1px)}}@keyframes zooLoginFlap{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(10deg) translateY(1px)}}@keyframes zooLoginStepLeft{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(2px) rotate(2deg)}}@keyframes zooLoginStepRight{0%,100%{transform:translateY(2px) rotate(2deg)}50%{transform:translateY(0) rotate(-2deg)}}@keyframes zooLoginBubble{0%{opacity:0;transform:translateY(8px) scale(.82)}35%{opacity:.82}100%{opacity:0;transform:translateY(-18px) scale(1.12)}}
`;

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
    <>
      <style dangerouslySetInnerHTML={{ __html: loginCriticalCss }} />
      <main className="authShell">
      <div className="authBackdrop" aria-hidden="true">
        <span className="authGridGlow authGridGlowOne" />
        <span className="authGridGlow authGridGlowTwo" />
        <span className="authFloatingLetter authFloatingLetterOne">A</span>
        <span className="authFloatingLetter authFloatingLetterTwo">B</span>
        <span className="authFloatingLetter authFloatingLetterThree">?</span>
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

        <div className="authCopy">
          <p className="eyebrow">Gamified English Platform</p>
          <h1>{title}</h1>
          <p>
            Vào hệ thống học tiếng Anh theo vai trò, nơi lộ trình, quiz, AI Content Hub, pet Pingu và
            tiến trình học được gom thành một trải nghiệm sinh động.
          </p>
        </div>

        <div className="authWorldCard" aria-label="Không gian học tập EnglishPro">
          <div className="authWorldSky">
            <svg className="authZooSceneSvg" viewBox="0 0 900 280" aria-hidden="true">
              <defs>
                <linearGradient id="authZooSky" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#9fe7ff" />
                  <stop offset="48%" stopColor="#d9f3ff" />
                  <stop offset="100%" stopColor="#dcfce7" />
                </linearGradient>
                <linearGradient id="authZooGrass" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="45%" stopColor="#16a34a" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>
                <linearGradient id="authZooHill" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#bbf7d0" />
                  <stop offset="100%" stopColor="#5eead4" />
                </linearGradient>
                <filter id="authZooSoftShadow" x="-20%" y="-20%" width="140%" height="160%">
                  <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.16" />
                </filter>
              </defs>

              <rect width="900" height="280" rx="12" fill="url(#authZooSky)" />
              <path className="authZooGrid" d="M0 35H900M0 70H900M0 105H900M0 140H900M0 175H900M0 210H900M0 245H900M40 0V280M80 0V280M120 0V280M160 0V280M200 0V280M240 0V280M280 0V280M320 0V280M360 0V280M400 0V280M440 0V280M480 0V280M520 0V280M560 0V280M600 0V280M640 0V280M680 0V280M720 0V280M760 0V280M800 0V280M840 0V280" />

              <g className="authZooCloud authZooCloudLeft">
                <ellipse cx="98" cy="62" rx="52" ry="18" fill="#ffffff" opacity=".95" />
                <ellipse cx="145" cy="53" rx="62" ry="22" fill="#ffffff" opacity=".95" />
                <ellipse cx="199" cy="65" rx="46" ry="17" fill="#ffffff" opacity=".95" />
              </g>
              <g className="authZooCloud authZooCloudRight">
                <ellipse cx="604" cy="92" rx="42" ry="15" fill="#ffffff" opacity=".92" />
                <ellipse cx="652" cy="82" rx="54" ry="19" fill="#ffffff" opacity=".92" />
                <ellipse cx="704" cy="93" rx="38" ry="14" fill="#ffffff" opacity=".92" />
              </g>

              <g className="authZooSun">
                <path d="M810 28L823 61L858 52L835 81L866 101L828 101L817 136L802 101L765 112L789 82L759 61L797 61Z" fill="#fde047" />
                <circle cx="813" cy="82" r="22" fill="#facc15" opacity=".4" />
              </g>

              <path className="authZooHill authZooHillLeft" d="M0 205L82 130L150 162L224 105L328 205Z" fill="url(#authZooHill)" opacity=".78" />
              <path className="authZooHill authZooHillRight" d="M570 205L666 108L746 164L827 120L900 205Z" fill="url(#authZooHill)" opacity=".68" />
              <path className="authZooPond" d="M594 224C638 204 729 204 775 226C732 244 638 246 594 224Z" fill="#67e8f9" opacity=".82" />

              <g className="authZooTree authZooTreeLeft" filter="url(#authZooSoftShadow)">
                <rect x="92" y="154" width="26" height="64" rx="4" fill="#92400e" />
                <circle cx="84" cy="147" r="28" fill="#16a34a" />
                <circle cx="122" cy="139" r="34" fill="#22c55e" />
                <circle cx="151" cy="151" r="27" fill="#15803d" />
              </g>
              <g className="authZooTree authZooTreeRight" filter="url(#authZooSoftShadow)">
                <rect x="810" y="164" width="24" height="58" rx="4" fill="#92400e" />
                <circle cx="789" cy="158" r="25" fill="#16a34a" />
                <circle cx="823" cy="150" r="31" fill="#22c55e" />
                <circle cx="855" cy="160" r="24" fill="#15803d" />
              </g>

              <rect x="0" y="205" width="900" height="75" rx="0" fill="url(#authZooGrass)" />
              <path d="M0 205H900" stroke="#bbf7d0" strokeWidth="5" opacity=".85" />
              <path className="authZooGrassStripes" d="M24 205V280M58 205V280M92 205V280M126 205V280M160 205V280M194 205V280M228 205V280M262 205V280M296 205V280M330 205V280M364 205V280M398 205V280M432 205V280M466 205V280M500 205V280M534 205V280M568 205V280M602 205V280M636 205V280M670 205V280M704 205V280M738 205V280M772 205V280M806 205V280M840 205V280M874 205V280" />

              <g className="authZooRabbit" filter="url(#authZooSoftShadow)">
                <ellipse cx="314" cy="207" rx="33" ry="22" fill="#ffffff" />
                <circle cx="294" cy="183" r="29" fill="#f8fafc" />
                <path d="M278 166C254 123 283 114 294 158Z" fill="#ffffff" stroke="#f9a8d4" strokeWidth="3" />
                <path d="M305 158C316 113 344 124 321 166Z" fill="#ffffff" stroke="#f9a8d4" strokeWidth="3" />
                <circle cx="286" cy="185" r="3.8" fill="#0f172a" />
                <circle cx="304" cy="185" r="3.8" fill="#0f172a" />
                <path d="M295 192L301 196L295 200L289 196Z" fill="#fb7185" />
                <circle cx="343" cy="210" r="10" fill="#ffffff" />
                <rect x="339" y="188" width="25" height="29" rx="2" fill="#f9a8d4" opacity=".85" />
              </g>

              <g className="authZooPenguin" filter="url(#authZooSoftShadow)">
                <ellipse cx="468" cy="231" rx="42" ry="7" fill="#0f172a" opacity=".14" />
                <path d="M431 177C411 187 416 212 438 209C444 195 442 184 431 177Z" fill="#fb923c" opacity=".95" />
                <path d="M503 177C524 187 518 212 496 209C490 195 492 184 503 177Z" fill="#fb923c" opacity=".95" />
                <rect x="426" y="132" width="82" height="88" rx="22" fill="#0f172a" />
                <rect x="453" y="132" width="30" height="88" fill="#f8fafc" />
                <rect x="431" y="125" width="74" height="9" rx="5" fill="#f97316" />
                <circle cx="443" cy="157" r="5" fill="#ffffff" />
                <circle cx="491" cy="157" r="5" fill="#ffffff" />
                <path d="M464 163L476 167L464 171Z" fill="#fb923c" />
                <ellipse className="authZooFootLeft" cx="447" cy="224" rx="13" ry="5" fill="#fb923c" />
                <ellipse className="authZooFootRight" cx="488" cy="224" rx="13" ry="5" fill="#fb923c" />
              </g>

              <g className="authZooTurtle" filter="url(#authZooSoftShadow)">
                <ellipse cx="614" cy="232" rx="54" ry="7" fill="#0f172a" opacity=".14" />
                <circle cx="669" cy="200" r="16" fill="#86efac" />
                <ellipse cx="610" cy="199" rx="44" ry="27" fill="#65a30d" />
                <path d="M569 199C578 172 643 172 653 199C641 221 581 222 569 199Z" fill="#22c55e" />
                <path d="M610 174V224M578 193H644M589 179L578 199L589 219M631 179L644 199L631 219" stroke="#365314" strokeWidth="4" strokeLinecap="round" opacity=".42" />
                <circle cx="674" cy="194" r="3.5" fill="#0f172a" />
                <path d="M558 201L540 192L558 185Z" fill="#86efac" />
                <circle cx="584" cy="225" r="7" fill="#14532d" />
                <circle cx="631" cy="225" r="7" fill="#14532d" />
              </g>

              <g className="authZooFish">
                <path d="M681 219L713 207L703 219L713 232Z" fill="#0ea5e9" />
                <ellipse cx="664" cy="219" rx="25" ry="14" fill="#38bdf8" />
                <circle cx="655" cy="215" r="2.8" fill="#0f172a" />
                <path d="M646 224C651 228 657 228 662 224" stroke="#075985" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>

              <g className="authZooLeaves">
                <path d="M138 20C158 24 166 42 152 55C133 48 126 31 138 20Z" fill="#84cc16" opacity=".72" />
                <path d="M304 224C321 214 339 219 345 236C326 245 311 240 304 224Z" fill="#84cc16" opacity=".78" />
                <path d="M798 112C817 122 823 140 808 152C789 141 786 124 798 112Z" fill="#84cc16" opacity=".68" />
              </g>
            </svg>
          </div>
          <div className="authWorldStats">
            <span>
              <Languages size={16} />
              Từ vựng
            </span>
            <span>
              <BookOpen size={16} />
              Bài học
            </span>
            <span>
              <Gamepad2 size={16} />
              Mini game
            </span>
          </div>
        </div>

        <div className="authHighlights">
          <div>
            <ShieldCheck size={18} />
            <span>JWT + phân quyền theo actor</span>
          </div>
          <div>
            <Sparkles size={18} />
            <span>AI Content Hub đa nguồn</span>
          </div>
          <div>
            <ArrowRight size={18} />
            <span>Dashboard và chức năng tách riêng</span>
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
