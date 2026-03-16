import { create } from 'zustand';
import type { Analysis, Transcript, AnalysisLanguage } from '@/types/analysis';

interface AnalysisState {
  currentAnalysis: Analysis | null;
  transcript: Transcript | null;
  isLoading: boolean;
  loadingMessage: string;
  selectedLanguage: AnalysisLanguage;
  scriptText: string;
  analysedAt: Date | null;

  setAnalysis: (analysis: Analysis | null) => void;
  setTranscript: (transcript: Transcript | null) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setLanguage: (language: AnalysisLanguage) => void;
  setScriptText: (text: string) => void;
  clearAnalysis: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  currentAnalysis: null,
  transcript: null,
  isLoading: false,
  loadingMessage: '',
  selectedLanguage: 'en',
  scriptText: '',
  analysedAt: null,

  setAnalysis: (currentAnalysis) =>
    set({ currentAnalysis, analysedAt: currentAnalysis ? new Date() : null }),

  setTranscript: (transcript) => set({ transcript }),

  setLoading: (isLoading, message = '') =>
    set({ isLoading, loadingMessage: message }),

  setLanguage: (selectedLanguage) => set({ selectedLanguage }),

  setScriptText: (scriptText) => set({ scriptText }),

  clearAnalysis: () =>
    set({
      currentAnalysis: null,
      transcript: null,
      isLoading: false,
      loadingMessage: '',
      scriptText: '',
      analysedAt: null
    })
}));
