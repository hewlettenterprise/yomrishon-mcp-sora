/*
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  CAPABILITY REGISTRY — Single source of truth for Sora 2 models      ║
 * ║                                                                      ║
 * ║  MAINTAINER WARNING: Do NOT scatter model capability checks          ║
 * ║  throughout the codebase. ALL capability decisions must reference    ║
 * ║  this registry. When OpenAI updates Sora 2 capabilities, update      ║
 * ║  ONLY this file.                                                     ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

export interface ModelCapabilities {
  sizes: string[];
  durations: number[]; // seconds
  supportsCharacters: boolean;
  supportsImageReference: boolean;
  supportsEdit: boolean;
  supportsExtend: boolean;
  supportsRemix: boolean;
  maxCharacters: number;
  maxExtensionSeconds?: number;
  notes?: string;
}

export interface CapabilityRegistry {
  models: Record<string, ModelCapabilities>;
  defaultModel: string;
  supportedOperations: string[];
}

/**
 * Central capability registry.
 *
 * Update this object when OpenAI changes Sora 2 model capabilities.
 * Do NOT hardcode capability assumptions anywhere else in the codebase.
 *
 * Last updated: 2026-03-16
 */
export const CAPABILITY_REGISTRY: CapabilityRegistry = {
  defaultModel: "sora-2",
  supportedOperations: [
    "create",
    "edit",
    "extend",
    "list",
    "get",
    "download",
    "character_create",
    "character_get",
    "remix",
  ],
  models: {
    "sora-2": {
      sizes: [
        "1280x720",
        "720x1280",
        "1024x1792",
        "1792x1024",
      ],
      durations: [4, 8, 12],
      supportsCharacters: true,
      supportsImageReference: true,
      supportsEdit: true,
      supportsExtend: true,
      supportsRemix: true,
      maxCharacters: 5,
      maxExtensionSeconds: 20,
      notes: "General-purpose Sora 2 model. Balanced quality and speed.",
    },
    "sora-2-pro": {
      sizes: [
        "1280x720",
        "720x1280",
        "1024x1792",
        "1792x1024",
      ],
      durations: [4, 8, 12],
      supportsCharacters: true,
      supportsImageReference: true,
      supportsEdit: true,
      supportsExtend: true,
      supportsRemix: true,
      maxCharacters: 5,
      maxExtensionSeconds: 20,
      notes:
        "Higher-quality Sora 2 model. Supports 4K. Slower generation times.",
    },
  },
};

export function getModelCapabilities(
  model: string
): ModelCapabilities | undefined {
  return CAPABILITY_REGISTRY.models[model];
}

export function getSupportedModels(): string[] {
  return Object.keys(CAPABILITY_REGISTRY.models);
}

export function isValidSize(model: string, size: string): boolean {
  const caps = getModelCapabilities(model);
  return caps ? caps.sizes.includes(size) : false;
}

export function isValidDuration(model: string, seconds: number): boolean {
  const caps = getModelCapabilities(model);
  return caps ? caps.durations.includes(seconds) : false;
}

/** Return the full capability registry in a client-friendly format. */
export function getCapabilitySummary(): Record<string, unknown> {
  const models: Record<string, unknown> = {};

  for (const [model, caps] of Object.entries(CAPABILITY_REGISTRY.models)) {
    models[model] = {
      sizes: caps.sizes,
      durations_seconds: caps.durations,
      characters: caps.supportsCharacters,
      image_reference: caps.supportsImageReference,
      edit: caps.supportsEdit,
      extend: caps.supportsExtend,
      remix: caps.supportsRemix,
      max_characters: caps.maxCharacters,
      max_extension_seconds: caps.maxExtensionSeconds,
      notes: caps.notes,
    };
  }

  return {
    supported_models: getSupportedModels(),
    operations: CAPABILITY_REGISTRY.supportedOperations,
    models,
  };
}
