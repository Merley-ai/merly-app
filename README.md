# Fal.ai Integration Guide

This guide explains how to integrate and use Fal.ai APIs for AI image generation in your Next.js application.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Available Models](#available-models)
- [Implementation](#implementation)
- [Prompt Layer System](#prompt-layer-system)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)

## Overview

Fal.ai provides fast, high-quality AI image generation APIs. This integration includes:

- **Server-side proxy** for secure API key handling
- **Client-side integration** with React components
- **Prompt layer system** for enhanced image generation
- **Multiple model support** for different use cases

## Setup

### 1. Install Dependencies

```bash
npm install @fal-ai/client @fal-ai/server-proxy
```

### 2. Environment Variables

Create `.env.local` file:

```bash
FAL_KEY=your_fal_api_key_here
```

Get your API key from [fal.ai dashboard](https://fal.ai/dashboard).

### 3. Proxy Route

Create `app/api/fal/proxy/route.ts`:

```typescript
import { route } from '@fal-ai/server-proxy/nextjs';

export const { GET, POST } = route;
```

### 4. Client Configuration

In your React component:

```typescript
import { fal } from '@fal-ai/client';

fal.config({
  proxyUrl: '/api/fal/proxy',
});
```

## Available Models

### Text-to-Image Models

| Model | Description | Speed | Quality | Use Case |
|-------|-------------|-------|---------|----------|
| `fal-ai/flux/schnell` | Fast Flux model | ⚡⚡⚡ | ⭐⭐⭐⭐ | Quick generation, prototyping |
| `fal-ai/flux/dev` | Standard Flux model | ⚡⚡ | ⭐⭐⭐⭐⭐ | High-quality images |
| `fal-ai/fast-sdxl` | SDXL optimized | ⚡⚡⚡ | ⭐⭐⭐⭐ | Fast SDXL generation |
| `fal-ai/sdxl` | Standard SDXL | ⚡ | ⭐⭐⭐⭐⭐ | Highest quality |

### Real-time Models

| Model | Description | Use Case |
|-------|-------------|----------|
| `fal-ai/fast-lcm-diffusion` | Real-time LCM | Interactive applications |
| `fal-ai/fast-turbo-diffusion` | Real-time Turbo | Live generation |

## Implementation

### Basic Image Generation

```typescript
const result = await fal.subscribe('fal-ai/flux/schnell', {
  input: {
    prompt: 'a beautiful sunset over mountains',
    image_size: 'square_hd',
    num_inference_steps: 4,
    enable_safety_checker: true,
  },
});

const imageUrl = result.data.images[0].url;
```

### With Prompt Layer

```typescript
import { enhancePrompt } from '@/lib/prompt-layer';

const enhancedPrompt = enhancePrompt(userPrompt, {
  style: 'photorealistic',
  quality: 'high',
  mood: 'peaceful'
});

const result = await fal.subscribe('fal-ai/flux/schnell', {
  input: {
    prompt: enhancedPrompt,
    image_size: 'square_hd',
    num_inference_steps: 4,
    enable_safety_checker: true,
  },
});
```

## Prompt Layer System

The prompt layer system enhances user prompts with professional photography and art direction terms.

### Features

- **Style Enhancement**: Adds professional photography terms
- **Quality Boosting**: Improves image quality descriptors
- **Mood Control**: Influences the emotional tone
- **Technical Parameters**: Adds camera and lighting specifications

### Usage

```typescript
import { enhancePrompt, PromptOptions } from '@/lib/prompt-layer';

const options: PromptOptions = {
  style: 'photorealistic', // 'photorealistic', 'artistic', 'cinematic'
  quality: 'high',         // 'high', 'medium', 'low'
  mood: 'peaceful',        // 'peaceful', 'dramatic', 'vibrant'
  camera: 'professional',  // 'professional', 'amateur', 'studio'
  lighting: 'natural'      // 'natural', 'studio', 'dramatic'
};

const enhancedPrompt = enhancePrompt('a cat', options);
// Result: "a photorealistic cat, high quality, peaceful mood, professional camera, natural lighting, award-winning photography, detailed, sharp focus"
```

## Usage Examples

### Example 1: Basic Generation

```typescript
export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateImage = async () => {
    setIsGenerating(true);
    
    try {
      const result = await fal.subscribe('fal-ai/flux/schnell', {
        input: {
          prompt: prompt,
          image_size: 'square_hd',
          num_inference_steps: 4,
          enable_safety_checker: true,
        },
      });

      setImageUrl(result.data.images[0].url);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your image..."
      />
      <button onClick={generateImage} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate'}
      </button>
      {imageUrl && <img src={imageUrl} alt="Generated" />}
    </div>
  );
}
```

### Example 2: With Prompt Enhancement

```typescript
import { enhancePrompt } from '@/lib/prompt-layer';

const generateEnhancedImage = async () => {
  const enhancedPrompt = enhancePrompt(prompt, {
    style: 'photorealistic',
    quality: 'high',
    mood: 'dramatic'
  });

  const result = await fal.subscribe('fal-ai/flux/dev', {
    input: {
      prompt: enhancedPrompt,
      image_size: 'square_hd',
      num_inference_steps: 8,
      enable_safety_checker: true,
    },
  });

  return result.data.images[0].url;
};
```

## Troubleshooting

### Common Issues

1. **HTTP 500 Error**: Check that `FAL_KEY` is set in `.env.local`
2. **Proxy Route Error**: Ensure correct import: `import { route } from '@fal-ai/server-proxy/nextjs'`
3. **Generation Fails**: Verify API key has sufficient credits
4. **Slow Generation**: Try `fal-ai/flux/schnell` for faster results

### Debug Mode

Enable detailed logging:

```typescript
const result = await fal.subscribe('fal-ai/flux/schnell', {
  input: { /* ... */ },
  logs: true,
  onQueueUpdate: (update) => {
    console.log('Queue update:', update);
  },
});
```

### Rate Limits

- **Free tier**: 10 concurrent requests
- **Paid tier**: Higher limits available
- **Enterprise**: Custom limits

## Best Practices

1. **Use appropriate models** for your use case
2. **Implement error handling** for failed generations
3. **Add loading states** for better UX
4. **Cache results** to reduce API calls
5. **Use prompt enhancement** for better results
6. **Monitor API usage** to stay within limits

## Resources

- [Fal.ai Documentation](https://docs.fal.ai/)
- [Model Gallery](https://fal.ai/models)
- [API Reference](https://docs.fal.ai/model-apis)
- [Community Discord](https://discord.gg/fal-ai)

## Support

For issues specific to this integration:
1. Check the troubleshooting section
2. Review Fal.ai documentation
3. Join the Fal.ai Discord community
4. Create an issue in this repository