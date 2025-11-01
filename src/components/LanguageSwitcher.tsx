import { Button } from './ui/button';

interface LanguageSwitcherProps {
  language: 'en' | 'vi';
  onChange: (lang: 'en' | 'vi') => void;
}

export function LanguageSwitcher({ language, onChange }: LanguageSwitcherProps) {
  return (
    <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-full p-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('en')}
        className={`rounded-full px-3 ${
          language === 'en' ? 'bg-[#d92228] text-white hover:bg-[#d92228]' : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        🇬🇧
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange('vi')}
        className={`rounded-full px-3 ${
          language === 'vi' ? 'bg-[#d92228] text-white hover:bg-[#d92228]' : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        🇻🇳
      </Button>
    </div>
  );
}
