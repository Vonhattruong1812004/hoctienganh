'use client';

import { Download, MonitorSmartphone } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type PwaInstallButtonProps = {
  variant?: 'default' | 'onImage';
};

export function PwaInstallButton({ variant = 'default' }: PwaInstallButtonProps) {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js');
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowGuide(false);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setShowGuide(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      setShowGuide((current) => !current);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }

    setInstallPrompt(null);
  };

  const shouldShowInstallButton = pathname === '/login' || pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  if (!shouldShowInstallButton) {
    return null;
  }

  if (installed) {
    return (
      <span style={variant === 'onImage' ? { ...styles.state, ...styles.onImageState } : styles.state} aria-label="Ứng dụng đã được cài">
        <MonitorSmartphone size={16} />
        App đã cài
      </span>
    );
  }

  return (
    <span style={styles.wrap}>
      <button
        className="secondaryButton"
        style={variant === 'onImage' ? { ...styles.button, ...styles.onImageButton } : styles.button}
        type="button"
        onClick={() => void handleInstall()}
      >
        <Download size={16} />
        Tải app
      </button>
      {showGuide ? (
        <span style={styles.hint}>
          Nếu trình duyệt chưa mở hộp cài đặt, dùng nút cài trên thanh địa chỉ. iPhone/Safari: Chia sẻ rồi chọn Thêm vào màn hình chính.
        </span>
      ) : null}
    </span>
  );
}

const styles = {
  wrap: {
    position: 'relative',
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flex: '0 0 auto',
  },
  button: {
    minHeight: 44,
    borderColor: 'rgba(14, 165, 233, 0.28)',
    background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.98), rgba(224, 242, 254, 0.96))',
    color: '#075985',
    boxShadow: '0 10px 24px rgba(14, 165, 233, 0.14)',
  },
  onImageButton: {
    borderColor: 'rgba(255, 255, 255, 0.34)',
    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.82), rgba(30, 64, 175, 0.78))',
    color: '#f8fafc',
    boxShadow: '0 14px 30px rgba(2, 6, 23, 0.22)',
  },
  state: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    padding: '0 14px',
    border: '1px solid rgba(34, 197, 94, 0.28)',
    borderRadius: 8,
    background: 'rgba(220, 252, 231, 0.94)',
    color: '#166534',
    fontWeight: 900,
    boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)',
  },
  onImageState: {
    borderColor: 'rgba(187, 247, 208, 0.46)',
    background: 'rgba(20, 83, 45, 0.82)',
    color: '#ecfdf5',
  },
  hint: {
    position: 'absolute',
    right: 0,
    top: 'calc(100% + 10px)',
    zIndex: 30,
    width: 'min(320px, 82vw)',
    padding: '12px 14px',
    border: '1px solid rgba(14, 165, 233, 0.22)',
    borderRadius: 8,
    background: 'rgba(255, 255, 255, 0.98)',
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 1.5,
    fontWeight: 800,
    boxShadow: '0 18px 42px rgba(15, 23, 42, 0.16)',
  },
} satisfies Record<string, CSSProperties>;
