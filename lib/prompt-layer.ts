/**
 * Prompt Layer System for Fal.ai Image Generation
 * 
 * This module provides a sophisticated prompt enhancement system that transforms
 * basic user prompts into professional-grade image generation prompts.
 */

export interface PromptOptions {
  style?: 'photorealistic' | 'artistic' | 'cinematic' | 'illustration' | 'sketch';
  quality?: 'high' | 'medium' | 'low';
  mood?: 'peaceful' | 'dramatic' | 'vibrant' | 'mysterious' | 'nostalgic';
  camera?: 'professional' | 'amateur' | 'studio' | 'documentary';
  lighting?: 'natural' | 'studio' | 'dramatic' | 'soft' | 'harsh';
  composition?: 'close-up' | 'wide-shot' | 'medium-shot' | 'bird-eye' | 'low-angle';
  colorPalette?: 'warm' | 'cool' | 'monochrome' | 'vibrant' | 'pastel';
  era?: 'modern' | 'vintage' | 'futuristic' | 'medieval' | 'retro';
  genre?: 'portrait' | 'landscape' | 'still-life' | 'abstract' | 'conceptual';
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  additions: string[];
  options: PromptOptions;
}

// Style enhancement mappings
const styleEnhancements = {
  photorealistic: [
    'photorealistic',
    'hyperrealistic',
    'award-winning photography',
    'professional photography',
    'detailed',
    'sharp focus',
    'high resolution'
  ],
  artistic: [
    'artistic',
    'creative',
    'stylized',
    'artistic interpretation',
    'creative composition',
    'artistic vision'
  ],
  cinematic: [
    'cinematic',
    'movie-like',
    'dramatic lighting',
    'cinematic composition',
    'film photography',
    'cinematic quality'
  ],
  illustration: [
    'illustration',
    'digital art',
    'concept art',
    'illustrated',
    'artistic illustration'
  ],
  sketch: [
    'sketch',
    'hand-drawn',
    'pencil sketch',
    'charcoal drawing',
    'artistic sketch'
  ]
};

// Quality enhancement mappings
const qualityEnhancements = {
  high: [
    'high quality',
    'ultra-detailed',
    'masterpiece',
    'professional',
    'award-winning',
    '4K resolution',
    '8K resolution'
  ],
  medium: [
    'good quality',
    'well-detailed',
    'professional',
    'high resolution'
  ],
  low: [
    'basic quality',
    'simple',
    'clean'
  ]
};

// Mood enhancement mappings
const moodEnhancements = {
  peaceful: [
    'peaceful',
    'serene',
    'calm',
    'tranquil',
    'gentle',
    'soft mood'
  ],
  dramatic: [
    'dramatic',
    'intense',
    'powerful',
    'striking',
    'bold',
    'dynamic'
  ],
  vibrant: [
    'vibrant',
    'energetic',
    'lively',
    'colorful',
    'bright',
    'cheerful'
  ],
  mysterious: [
    'mysterious',
    'enigmatic',
    'mystical',
    'atmospheric',
    'moody',
    'intriguing'
  ],
  nostalgic: [
    'nostalgic',
    'vintage',
    'retro',
    'classic',
    'timeless',
    'sentimental'
  ]
};

// Camera and technical enhancements
const cameraEnhancements = {
  professional: [
    'professional camera',
    'DSLR photography',
    'professional photography',
    'award-winning photography'
  ],
  amateur: [
    'amateur photography',
    'casual shot',
    'snapshot style'
  ],
  studio: [
    'studio photography',
    'professional studio',
    'controlled lighting',
    'studio setup'
  ],
  documentary: [
    'documentary style',
    'candid photography',
    'natural lighting',
    'authentic'
  ]
};

// Lighting enhancements
const lightingEnhancements = {
  natural: [
    'natural lighting',
    'daylight',
    'soft natural light',
    'golden hour',
    'natural illumination'
  ],
  studio: [
    'studio lighting',
    'professional lighting',
    'controlled lighting',
    'studio setup'
  ],
  dramatic: [
    'dramatic lighting',
    'high contrast',
    'strong shadows',
    'dramatic illumination'
  ],
  soft: [
    'soft lighting',
    'diffused light',
    'gentle illumination',
    'soft shadows'
  ],
  harsh: [
    'harsh lighting',
    'strong light',
    'high contrast',
    'bold shadows'
  ]
};

// Composition enhancements
const compositionEnhancements = {
  'close-up': [
    'close-up shot',
    'intimate framing',
    'detailed view',
    'macro photography'
  ],
  'wide-shot': [
    'wide shot',
    'panoramic view',
    'expansive composition',
    'wide-angle'
  ],
  'medium-shot': [
    'medium shot',
    'balanced composition',
    'standard framing'
  ],
  'bird-eye': [
    'bird\'s eye view',
    'aerial perspective',
    'top-down view',
    'overhead shot'
  ],
  'low-angle': [
    'low angle shot',
    'dramatic perspective',
    'powerful framing',
    'heroic angle'
  ]
};

// Color palette enhancements
const colorPaletteEnhancements = {
  warm: [
    'warm colors',
    'warm palette',
    'golden tones',
    'warm lighting',
    'cozy atmosphere'
  ],
  cool: [
    'cool colors',
    'cool palette',
    'blue tones',
    'cool lighting',
    'refreshing atmosphere'
  ],
  monochrome: [
    'monochrome',
    'black and white',
    'grayscale',
    'minimalist palette'
  ],
  vibrant: [
    'vibrant colors',
    'colorful',
    'bright palette',
    'saturated colors'
  ],
  pastel: [
    'pastel colors',
    'soft palette',
    'gentle colors',
    'muted tones'
  ]
};

// Era enhancements
const eraEnhancements = {
  modern: [
    'modern',
    'contemporary',
    'current style',
    'modern aesthetic'
  ],
  vintage: [
    'vintage',
    'retro',
    'classic style',
    'nostalgic',
    'old-fashioned'
  ],
  futuristic: [
    'futuristic',
    'sci-fi',
    'advanced',
    'high-tech',
    'modern technology'
  ],
  medieval: [
    'medieval',
    'historical',
    'ancient',
    'period piece',
    'historical setting'
  ],
  retro: [
    'retro',
    'vintage',
    'classic',
    'nostalgic',
    'throwback'
  ]
};

// Genre-specific enhancements
const genreEnhancements = {
  portrait: [
    'portrait photography',
    'portrait style',
    'character study',
    'facial expression',
    'portrait composition'
  ],
  landscape: [
    'landscape photography',
    'scenic view',
    'natural scenery',
    'outdoor photography',
    'landscape composition'
  ],
  'still-life': [
    'still life',
    'object photography',
    'composition study',
    'arranged objects',
    'still life setup'
  ],
  abstract: [
    'abstract',
    'conceptual',
    'artistic interpretation',
    'non-representational',
    'abstract composition'
  ],
  conceptual: [
    'conceptual',
    'symbolic',
    'metaphorical',
    'artistic concept',
    'conceptual art'
  ]
};

/**
 * Enhances a basic prompt with professional photography and art direction terms
 * @param originalPrompt - The original user prompt
 * @param options - Enhancement options
 * @returns Enhanced prompt object
 */
export function enhancePrompt(
  originalPrompt: string,
  options: PromptOptions = {}
): EnhancedPrompt {
  const additions: string[] = [];
  
  // Apply style enhancement
  if (options.style && styleEnhancements[options.style]) {
    additions.push(...styleEnhancements[options.style]);
  }
  
  // Apply quality enhancement
  if (options.quality && qualityEnhancements[options.quality]) {
    additions.push(...qualityEnhancements[options.quality]);
  }
  
  // Apply mood enhancement
  if (options.mood && moodEnhancements[options.mood]) {
    additions.push(...moodEnhancements[options.mood]);
  }
  
  // Apply camera enhancement
  if (options.camera && cameraEnhancements[options.camera]) {
    additions.push(...cameraEnhancements[options.camera]);
  }
  
  // Apply lighting enhancement
  if (options.lighting && lightingEnhancements[options.lighting]) {
    additions.push(...lightingEnhancements[options.lighting]);
  }
  
  // Apply composition enhancement
  if (options.composition && compositionEnhancements[options.composition]) {
    additions.push(...compositionEnhancements[options.composition]);
  }
  
  // Apply color palette enhancement
  if (options.colorPalette && colorPaletteEnhancements[options.colorPalette]) {
    additions.push(...colorPaletteEnhancements[options.colorPalette]);
  }
  
  // Apply era enhancement
  if (options.era && eraEnhancements[options.era]) {
    additions.push(...eraEnhancements[options.era]);
  }
  
  // Apply genre enhancement
  if (options.genre && genreEnhancements[options.genre]) {
    additions.push(...genreEnhancements[options.genre]);
  }
  
  // Remove duplicates and create enhanced prompt
  const uniqueAdditions = [...new Set(additions)];
  const enhancedPrompt = `${originalPrompt}, ${uniqueAdditions.join(', ')}`;
  
  return {
    original: originalPrompt,
    enhanced: enhancedPrompt,
    additions: uniqueAdditions,
    options
  };
}

/**
 * Quick enhancement function with sensible defaults
 * @param prompt - The original prompt
 * @param style - Style preference
 * @param quality - Quality level
 * @returns Enhanced prompt string
 */
export function quickEnhance(
  prompt: string,
  style: 'photorealistic' | 'artistic' | 'cinematic' = 'photorealistic',
  quality: 'high' | 'medium' | 'low' = 'high'
): string {
  return enhancePrompt(prompt, { style, quality }).enhanced;
}

/**
 * Preset enhancement configurations for common use cases
 */
export const presets = {
  portrait: (prompt: string) => enhancePrompt(prompt, {
    style: 'photorealistic',
    quality: 'high',
    mood: 'peaceful',
    camera: 'professional',
    lighting: 'natural',
    composition: 'close-up',
    genre: 'portrait'
  }),
  
  landscape: (prompt: string) => enhancePrompt(prompt, {
    style: 'photorealistic',
    quality: 'high',
    mood: 'peaceful',
    camera: 'professional',
    lighting: 'natural',
    composition: 'wide-shot',
    genre: 'landscape'
  }),
  
  artistic: (prompt: string) => enhancePrompt(prompt, {
    style: 'artistic',
    quality: 'high',
    mood: 'dramatic',
    camera: 'professional',
    lighting: 'dramatic',
    composition: 'medium-shot',
    genre: 'abstract'
  }),
  
  cinematic: (prompt: string) => enhancePrompt(prompt, {
    style: 'cinematic',
    quality: 'high',
    mood: 'dramatic',
    camera: 'professional',
    lighting: 'dramatic',
    composition: 'wide-shot',
    era: 'modern'
  }),
  
  vintage: (prompt: string) => enhancePrompt(prompt, {
    style: 'photorealistic',
    quality: 'high',
    mood: 'nostalgic',
    camera: 'amateur',
    lighting: 'natural',
    era: 'vintage',
    colorPalette: 'warm'
  })
};

/**
 * Analyze a prompt and suggest enhancements
 * @param prompt - The original prompt
 * @returns Suggested enhancement options
 */
export function analyzePrompt(prompt: string): Partial<PromptOptions> {
  const suggestions: Partial<PromptOptions> = {};
  
  // Analyze for portrait keywords
  if (prompt.toLowerCase().includes('person') || 
      prompt.toLowerCase().includes('face') || 
      prompt.toLowerCase().includes('portrait')) {
    suggestions.genre = 'portrait';
    suggestions.composition = 'close-up';
  }
  
  // Analyze for landscape keywords
  if (prompt.toLowerCase().includes('mountain') || 
      prompt.toLowerCase().includes('forest') || 
      prompt.toLowerCase().includes('landscape')) {
    suggestions.genre = 'landscape';
    suggestions.composition = 'wide-shot';
  }
  
  // Analyze for artistic keywords
  if (prompt.toLowerCase().includes('artistic') || 
      prompt.toLowerCase().includes('creative') || 
      prompt.toLowerCase().includes('abstract')) {
    suggestions.style = 'artistic';
    suggestions.genre = 'abstract';
  }
  
  // Analyze for cinematic keywords
  if (prompt.toLowerCase().includes('cinematic') || 
      prompt.toLowerCase().includes('movie') || 
      prompt.toLowerCase().includes('dramatic')) {
    suggestions.style = 'cinematic';
    suggestions.mood = 'dramatic';
    suggestions.lighting = 'dramatic';
  }
  
  return suggestions;
}

/**
 * Batch enhance multiple prompts
 * @param prompts - Array of prompts to enhance
 * @param options - Enhancement options
 * @returns Array of enhanced prompts
 */
export function batchEnhance(
  prompts: string[],
  options: PromptOptions = {}
): EnhancedPrompt[] {
  return prompts.map(prompt => enhancePrompt(prompt, options));
}

/**
 * Validate enhancement options
 * @param options - Options to validate
 * @returns Validation result
 */
export function validateOptions(options: PromptOptions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (options.style && !Object.keys(styleEnhancements).includes(options.style)) {
    errors.push(`Invalid style: ${options.style}`);
  }
  
  if (options.quality && !Object.keys(qualityEnhancements).includes(options.quality)) {
    errors.push(`Invalid quality: ${options.quality}`);
  }
  
  if (options.mood && !Object.keys(moodEnhancements).includes(options.mood)) {
    errors.push(`Invalid mood: ${options.mood}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
