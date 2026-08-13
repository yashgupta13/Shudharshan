import { useState, useEffect } from 'react';
import { Languages, Globe, ChevronDown, Loader2 } from 'lucide-react';
import { useTranslationStore } from '../store/translationStore';
import toast from 'react-hot-toast';

export default function TranslationControls() {
  const {
    enabled,
    selectedLanguage,
    availableLanguages,
    isTranslating,
    serviceAvailable,
    setEnabled,
    setSelectedLanguage,
    fetchLanguages,
    checkServiceHealth,
  } = useTranslationStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      setIsChecking(true);
      const available = await checkServiceHealth();
      if (available) {
        await fetchLanguages();
      } else {
        toast.error('Translation service unavailable', { id: 'translation-unavailable' });
      }
      setIsChecking(false);
    };
    init();
  }, []);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    setShowDropdown(false);
  };

  const toggleTranslation = () => {
    if (!serviceAvailable) {
      toast.error('Translation service is not available');
      return;
    }
    setEnabled(!enabled);
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border border-border-bright bg-surface text-muted text-xs">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Checking translation...</span>
      </div>
    );
  }

  if (!serviceAvailable) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border border-border-bright bg-surface text-muted text-xs opacity-50">
        <Globe className="w-3 h-3" />
        <span>Translation unavailable</span>
      </div>
    );
  }

  const currentLang = availableLanguages.find(l => l.code === selectedLanguage) || { name: 'English' };

  return (
    <div className="flex items-center gap-2">
      {/* Translation Toggle */}
      <button
        onClick={toggleTranslation}
        className={`flex items-center gap-2 px-3 py-1.5 border transition-colors text-xs ${
          enabled
            ? 'border-accent bg-accent/10 text-accent hover:bg-accent/20'
            : 'border-border-bright bg-surface text-muted hover:text-accent hover:border-accent/50'
        }`}
        title={enabled ? 'Disable translation' : 'Enable translation'}
      >
        <Languages className={`w-3 h-3 ${isTranslating ? 'animate-pulse' : ''}`} />
        <span>{enabled ? 'ON' : 'OFF'}</span>
      </button>

      {/* Language Selector */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-1.5 border border-border-bright bg-surface text-text hover:text-accent hover:border-accent/50 transition-colors text-xs min-w-[140px] justify-between"
          disabled={!enabled}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3" />
            <span className="truncate">{currentLang.name}</span>
          </div>
          <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown */}
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full mt-1 right-0 z-50 w-56 max-h-72 overflow-y-auto border border-border-bright bg-panel shadow-lg">
              {availableLanguages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                    lang.code === selectedLanguage
                      ? 'bg-accent/10 text-accent border-l-2 border-accent'
                      : 'text-text hover:bg-surface hover:text-accent'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
