import type { TokenModel } from '../lib/types'

/**
 * Inference pricing for the token calculator, in USD per million tokens.
 *
 * Claude figures are Anthropic first-party API list rates. For any other
 * provider, use the "Custom rate" row and enter the numbers from that
 * provider's own pricing page — ProForma does not ship guessed third-party
 * prices, because a business case built on a guessed rate is worse than one
 * built on a rate you looked up.
 */
export const TOKEN_MODELS: TokenModel[] = [
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    inputPerM: 5,
    outputPerM: 25,
    note: 'Frontier tier. Complex agentic work, long-horizon coding.',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    inputPerM: 3,
    outputPerM: 15,
    note: 'Best speed/intelligence balance. The usual production default.',
  },
  {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    inputPerM: 1,
    outputPerM: 5,
    note: 'Fastest and cheapest. Classification, extraction, high-volume simple tasks.',
  },
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    inputPerM: 10,
    outputPerM: 50,
    note: 'Most capable. Reserve for the hardest reasoning; price it deliberately.',
  },
  {
    id: 'custom',
    name: 'Custom rate',
    inputPerM: 0,
    outputPerM: 0,
    note: 'Enter rates from any provider. Check their pricing page — do not estimate.',
    custom: true,
  },
]

/** Rough starting points so the calculator is never staring at zeros. */
export const WORKLOAD_PRESETS = [
  {
    id: 'classify',
    label: 'Classification / routing',
    inputTokensPerRequest: 800,
    outputTokensPerRequest: 60,
    cacheHitRate: 70,
    blurb: 'Short prompt in, a label out. Cache the taxonomy.',
  },
  {
    id: 'summarise',
    label: 'Summarise a document',
    inputTokensPerRequest: 12000,
    outputTokensPerRequest: 700,
    cacheHitRate: 20,
    blurb: 'Long input, short output. Input tokens dominate the bill.',
  },
  {
    id: 'rag',
    label: 'RAG question answering',
    inputTokensPerRequest: 6000,
    outputTokensPerRequest: 600,
    cacheHitRate: 55,
    blurb: 'Stable system prompt plus retrieved chunks. Caching pays well here.',
  },
  {
    id: 'chat',
    label: 'Customer-facing chat turn',
    inputTokensPerRequest: 3500,
    outputTokensPerRequest: 400,
    cacheHitRate: 60,
    blurb: 'Conversation history grows; cache the prefix each turn.',
  },
  {
    id: 'agent',
    label: 'Agentic task (multi tool call)',
    inputTokensPerRequest: 45000,
    outputTokensPerRequest: 4000,
    cacheHitRate: 80,
    blurb: 'One "request" is a whole loop. This is where budgets get away from people.',
  },
] as const
