import { apiClient } from './client';

import type { ApiResponse } from '@/types/api';
import type {
  ChatSummary,
  StoredMessage,
} from '@/types/chat';

interface ChatHistoryResponse {
  conversationId: string;
  mode: 'onboarding' | 'fitting';
  avatarId: number | null;
  messages: StoredMessage[];
}

export const fetchHistory = async (
  conversationId: string,
): Promise<StoredMessage[]> => {
  const { data } = await apiClient.get<
    ApiResponse<ChatHistoryResponse>
  >(`/api/v1/chat/${conversationId}`);

  return data.data?.messages ?? [];
};

export const fetchSummary = async (
  conversationId: string,
): Promise<ChatSummary | null> => {
  const { data } = await apiClient.get<
    ApiResponse<ChatSummary>
  >(`/api/v1/chat/${conversationId}/summary`);

  return data.data ?? null;
};

export const getStoredFittingConversationId =
  (): string | null => {
    try {
      return localStorage.getItem(
        'closr_chat_cv_fitting',
      );
    } catch {
      return null;
    }
  };

export const getStoredFittingConversationIds =
  (): string[] => {
    try {
      const raw = localStorage.getItem(
        'closr_chat_history_fitting',
      );

      if (raw) {
        const parsed: unknown = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          return [
            ...new Set(
              parsed.filter(
                (id): id is string =>
                  typeof id === 'string' &&
                  id.length > 0,
              ),
            ),
          ];
        }
      }

      // 기존에 만들어진 상담도 MY에서 사라지지 않도록
      // 현재 conversationId를 fallback으로 사용
      const currentId = localStorage.getItem(
        'closr_chat_cv_fitting',
      );

      return currentId ? [currentId] : [];
    } catch {
      return [];
    }
  };