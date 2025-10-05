import { TOOLS } from '@/types/model';
import { z } from 'zod';

const AIConfigurationSchema = z.object({
	selectedModel: z.string().nullable(),
	enabledTools: z.array(z.enum(TOOLS)).default(['web_search']),
	selectedImageSize: z.string().optional().default('1:1'),
	reasoningEffort: z.enum(['off', 'low', 'medium', 'high']).default('medium'),
});

export type AIConfiguration = z.infer<typeof AIConfigurationSchema>;

const AI_CONFIGURATION_STORAGE_KEY = 'ai-configuration';

const safeRemoveStorageItem = (key: string): void => {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(key);
	} catch {}
};

export const loadAIConfiguration = (): AIConfiguration => {
	if (typeof window === 'undefined')
		return {
			selectedModel: null,
			enabledTools: ['web_search'],
			selectedImageSize: '1:1',
			reasoningEffort: 'medium',
		};
	const stored = localStorage.getItem(AI_CONFIGURATION_STORAGE_KEY);
	if (!stored) {
		return {
			selectedModel: null,
			enabledTools: ['web_search'],
			selectedImageSize: '1:1',
			reasoningEffort: 'medium',
		};
	}

	try {
		const parsed = JSON.parse(stored);

		// Validate enabled tools but let the UI handle invalid model IDs gracefully
		if (
			parsed.enabledTools.some((tool: string) => !TOOLS.includes(tool as (typeof TOOLS)[number]))
		) {
			parsed.enabledTools = ['web_search'];
		}

		return AIConfigurationSchema.parse(parsed);
	} catch {
		safeRemoveStorageItem(AI_CONFIGURATION_STORAGE_KEY);
		return {
			selectedModel: null,
			enabledTools: ['web_search'],
			selectedImageSize: '1:1',
			reasoningEffort: 'medium',
		};
	}
};

export const saveAIConfiguration = (config: AIConfiguration): void => {
	if (typeof window === 'undefined') return;
	const validated = AIConfigurationSchema.parse(config);
	localStorage.setItem(AI_CONFIGURATION_STORAGE_KEY, JSON.stringify(validated));
};
