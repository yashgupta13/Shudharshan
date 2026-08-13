import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translationApi } from '../services/api';
import toast from 'react-hot-toast';

export const useTranslationStore = create(
  persist(
    (set, get) => ({
      // State
      enabled: false,
      selectedLanguage: 'eng_Latn',
      availableLanguages: [],
      translationCache: new Map(),
      isTranslating: false,
      serviceAvailable: false,

      // Actions
      setEnabled: (enabled) => set({ enabled }),

      setSelectedLanguage: (language) => {
        set({ selectedLanguage: language });
        if (language !== 'eng_Latn') {
          set({ enabled: true });
        }
      },

      fetchLanguages: async () => {
        try {
          const response = await translationApi.getLanguages();
          set({ availableLanguages: response.languages || [] });
        } catch (error) {
          console.error('Failed to fetch languages:', error);
          toast.error('Could not load translation languages');
        }
      },

      checkServiceHealth: async () => {
        try {
          const response = await translationApi.health();
          set({ serviceAvailable: response.translation_service_available || false });
          return response.translation_service_available;
        } catch (error) {
          console.error('Translation service health check failed:', error);
          set({ serviceAvailable: false });
          return false;
        }
      },

      translateText: async (text, srcLang = 'eng_Latn', tgtLang = null) => {
        const { selectedLanguage, translationCache } = get();
        const targetLang = tgtLang || selectedLanguage;

        if (srcLang === targetLang) {
          return text;
        }

        const cacheKey = `${srcLang}:${targetLang}:${text}`;
        if (translationCache.has(cacheKey)) {
          return translationCache.get(cacheKey);
        }

        set({ isTranslating: true });
        try {
          const response = await translationApi.translate({
            sentences: [text],
            src_lang: srcLang,
            tgt_lang: targetLang,
            max_length: 256,
            num_beams: 5,
          });

          if (response.results && response.results.length > 0) {
            const translated = response.results[0].translation;

            const newCache = new Map(translationCache);
            newCache.set(cacheKey, translated);

            if (newCache.size > 1000) {
              const firstKey = newCache.keys().next().value;
              newCache.delete(firstKey);
            }

            set({ translationCache: newCache });
            return translated;
          }

          return text;
        } catch (error) {
          console.error('Translation failed:', error);
          toast.error('Translation failed');
          return text;
        } finally {
          set({ isTranslating: false });
        }
      },

      translateMessages: async (messages, srcLang = 'eng_Latn', tgtLang = null) => {
        const { selectedLanguage, translationCache } = get();
        const targetLang = tgtLang || selectedLanguage;

        if (srcLang === targetLang || messages.length === 0) {
          return messages;
        }

        const textsToTranslate = [];
        const indices = [];

        messages.forEach((msg, idx) => {
          if (msg.content && !msg.system && !msg.isFile) {
            const cacheKey = `${srcLang}:${targetLang}:${msg.content}`;
            if (!translationCache.has(cacheKey)) {
              textsToTranslate.push(msg.content);
              indices.push(idx);
            }
          }
        });

        if (textsToTranslate.length === 0) {
          return messages.map(msg => {
            if (msg.content && !msg.system && !msg.isFile) {
              const cacheKey = `${srcLang}:${targetLang}:${msg.content}`;
              return {
                ...msg,
                translatedContent: translationCache.get(cacheKey) || msg.content,
                originalContent: msg.content,
              };
            }
            return msg;
          });
        }

        set({ isTranslating: true });
        try {
          const response = await translationApi.translate({
            sentences: textsToTranslate,
            src_lang: srcLang,
            tgt_lang: targetLang,
            max_length: 256,
            num_beams: 5,
          });

          if (response.results && response.results.length > 0) {
            const newCache = new Map(translationCache);

            response.results.forEach((result, i) => {
              const cacheKey = `${srcLang}:${targetLang}:${result.source}`;
              newCache.set(cacheKey, result.translation);
            });

            if (newCache.size > 1000) {
              const keysToDelete = Array.from(newCache.keys()).slice(0, newCache.size - 1000);
              keysToDelete.forEach(key => newCache.delete(key));
            }

            set({ translationCache: newCache });

            return messages.map(msg => {
              if (msg.content && !msg.system && !msg.isFile) {
                const cacheKey = `${srcLang}:${targetLang}:${msg.content}`;
                return {
                  ...msg,
                  translatedContent: newCache.get(cacheKey) || msg.content,
                  originalContent: msg.content,
                };
              }
              return msg;
            });
          }

          return messages;
        } catch (error) {
          console.error('Batch translation failed:', error);
          toast.error('Translation failed');
          return messages;
        } finally {
          set({ isTranslating: false });
        }
      },

      clearCache: () => set({ translationCache: new Map() }),

      reset: () => set({
        enabled: false,
        selectedLanguage: 'eng_Latn',
        translationCache: new Map(),
        isTranslating: false,
      }),
    }),
    {
      name: 'translation-storage',
      partialize: (state) => ({
        enabled: state.enabled,
        selectedLanguage: state.selectedLanguage,
      }),
    }
  )
);
