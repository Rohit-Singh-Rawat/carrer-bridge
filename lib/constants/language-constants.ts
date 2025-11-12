export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
  isDefault?: boolean;
}

export const availableLanguages: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸', isDefault: true },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', flag: '🇨🇳' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
];

