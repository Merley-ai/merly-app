# Fal.ai API Models Reference

This document provides a comprehensive reference for all Fal.ai models available for image generation, including their parameters, use cases, and performance characteristics.

## Table of Contents

- [Text-to-Image Models](#text-to-image-models)
- [Real-time Models](#real-time-models)
- [Model Parameters](#model-parameters)
- [Performance Comparison](#performance-comparison)
- [Use Case Recommendations](#use-case-recommendations)

## Text-to-Image Models

### 1. Flux Schnell (`fal-ai/flux/schnell`)

**Description**: Fast version of Flux model optimized for speed with minimal quality loss.

**Parameters**:
```typescript
{
  prompt: string,
  image_size?: 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9',
  num_inference_steps?: number, // Default: 4, Range: 1-8
  enable_safety_checker?: boolean, // Default: true
  seed?: number, // Optional for reproducible results
}
```

**Performance**:
- ⚡ Speed: Very Fast (2-4 seconds)
- 🎨 Quality: High (4/5)
- 💰 Cost: Low (~$0.002 per image)
- 🎯 Best for: Quick prototyping, real-time applications

**Example**:
```typescript
const result = await fal.subscribe('fal-ai/flux/schnell', {
  input: {
    prompt: 'a photorealistic cat sitting on a windowsill',
    image_size: 'square_hd',
    num_inference_steps: 4,
    enable_safety_checker: true,
  },
});
```

### 2. Flux Dev (`fal-ai/flux/dev`)

**Description**: Standard Flux model with higher quality output.

**Parameters**:
```typescript
{
  prompt: string,
  image_size?: 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9',
  num_inference_steps?: number, // Default: 8, Range: 1-20
  enable_safety_checker?: boolean, // Default: true
  seed?: number,
  guidance_scale?: number, // Default: 3.5, Range: 1-20
}
```

**Performance**:
- ⚡ Speed: Fast (4-8 seconds)
- 🎨 Quality: Very High (5/5)
- 💰 Cost: Medium (~$0.005 per image)
- 🎯 Best for: High-quality image generation, professional use

**Example**:
```typescript
const result = await fal.subscribe('fal-ai/flux/dev', {
  input: {
    prompt: 'a cinematic shot of a mountain landscape at sunset',
    image_size: 'landscape_16_9',
    num_inference_steps: 12,
    guidance_scale: 5.0,
    enable_safety_checker: true,
  },
});
```

### 3. Fast SDXL (`fal-ai/fast-sdxl`)

**Description**: Optimized SDXL model for fast generation.

**Parameters**:
```typescript
{
  prompt: string,
  image_size?: 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9',
  num_inference_steps?: number, // Default: 4, Range: 1-8
  enable_safety_checker?: boolean, // Default: true
  seed?: number,
  loras?: Array<{path: string, scale: number}>, // Optional LoRA models
}
```

**Performance**:
- ⚡ Speed: Very Fast (2-4 seconds)
- 🎨 Quality: High (4/5)
- 💰 Cost: Low (~$0.0025 per image)
- 🎯 Best for: SDXL-specific use cases, LoRA integration

**Example**:
```typescript
const result = await fal.subscribe('fal-ai/fast-sdxl', {
  input: {
    prompt: 'a portrait of a person, professional photography',
    image_size: 'portrait_4_3',
    num_inference_steps: 6,
    enable_safety_checker: true,
  },
});
```

### 4. Standard SDXL (`fal-ai/sdxl`)

**Description**: Full SDXL model with maximum quality.

**Parameters**:
```typescript
{
  prompt: string,
  image_size?: 'square_hd' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9',
  num_inference_steps?: number, // Default: 20, Range: 1-50
  enable_safety_checker?: boolean, // Default: true
  seed?: number,
  guidance_scale?: number, // Default: 7.5, Range: 1-20
  loras?: Array<{path: string, scale: number}>,
}
```

**Performance**:
- ⚡ Speed: Slow (10-20 seconds)
- 🎨 Quality: Maximum (5/5)
- 💰 Cost: High (~$0.01 per image)
- 🎯 Best for: Final production images, maximum quality needs

## Real-time Models

### 1. Fast LCM Diffusion (`fal-ai/fast-lcm-diffusion`)

**Description**: Real-time Latent Consistency Model for interactive applications.

**Parameters**:
```typescript
{
  prompt: string,
  image_url?: string, // Base64 image for img2img
  sync_mode?: boolean, // Default: false
  num_inference_steps?: number, // Default: 4, Range: 1-8
  guidance_scale?: number, // Default: 1.0, Range: 1-2
  seed?: number,
}
```

**Performance**:
- ⚡ Speed: Real-time (< 1 second)
- 🎨 Quality: Good (3/5)
- 💰 Cost: Very Low (~$0.001 per image)
- 🎯 Best for: Interactive applications, live generation

**Example**:
```typescript
const connection = fal.realtime.connect('fal-ai/fast-lcm-diffusion', {
  onResult: (result) => {
    console.log('Real-time result:', result);
  },
  onError: (error) => {
    console.error('Real-time error:', error);
  },
});

connection.send({
  prompt: 'a quick sketch of a cat',
  sync_mode: true,
  num_inference_steps: 4,
});
```

### 2. Fast Turbo Diffusion (`fal-ai/fast-turbo-diffusion`)

**Description**: Ultra-fast Turbo model for real-time generation.

**Parameters**:
```typescript
{
  prompt: string,
  image_url?: string,
  sync_mode?: boolean,
  num_inference_steps?: number, // Default: 1, Range: 1-4
  guidance_scale?: number, // Default: 0.0, Range: 0-1
  seed?: number,
}
```

**Performance**:
- ⚡ Speed: Ultra-fast (< 0.5 seconds)
- 🎨 Quality: Good (3/5)
- 💰 Cost: Very Low (~$0.0005 per image)
- 🎯 Best for: Ultra-fast prototyping, live demos

## Model Parameters

### Common Parameters

| Parameter | Type | Description | Default | Range |
|-----------|------|-------------|---------|-------|
| `prompt` | string | Text description of desired image | Required | - |
| `image_size` | string | Output image dimensions | 'square_hd' | See options above |
| `num_inference_steps` | number | Number of denoising steps | Model-specific | 1-50 |
| `enable_safety_checker` | boolean | Enable content safety filtering | true | true/false |
| `seed` | number | Random seed for reproducible results | Random | 0-4294967295 |

### Advanced Parameters

| Parameter | Type | Description | Default | Range |
|-----------|------|-------------|---------|-------|
| `guidance_scale` | number | How closely to follow the prompt | Model-specific | 1-20 |
| `loras` | Array | LoRA models for style/character control | [] | - |
| `sync_mode` | boolean | Return base64 image data | false | true/false |

## Performance Comparison

| Model | Speed | Quality | Cost | Best Use Case |
|-------|-------|---------|------|---------------|
| `fal-ai/flux/schnell` | ⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | Quick generation |
| `fal-ai/flux/dev` | ⚡⚡ | ⭐⭐⭐⭐⭐ | 💰💰 | High quality |
| `fal-ai/fast-sdxl` | ⚡⚡⚡ | ⭐⭐⭐⭐ | 💰 | SDXL + LoRA |
| `fal-ai/sdxl` | ⚡ | ⭐⭐⭐⭐⭐ | 💰💰💰 | Maximum quality |
| `fal-ai/fast-lcm-diffusion` | ⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | Real-time |
| `fal-ai/fast-turbo-diffusion` | ⚡⚡⚡⚡⚡ | ⭐⭐⭐ | 💰 | Ultra-fast |

## Use Case Recommendations

### 🚀 Quick Prototyping
- **Model**: `fal-ai/flux/schnell`
- **Steps**: 4
- **Use when**: Testing ideas, rapid iteration

### 🎨 High-Quality Production
- **Model**: `fal-ai/flux/dev`
- **Steps**: 12-16
- **Use when**: Final images, professional work

### ⚡ Real-time Applications
- **Model**: `fal-ai/fast-lcm-diffusion`
- **Steps**: 4
- **Use when**: Interactive apps, live generation

### 🎯 Specific Styles/Characters
- **Model**: `fal-ai/fast-sdxl` + LoRA
- **Steps**: 6-8
- **Use when**: Character consistency, style transfer

### 🏆 Maximum Quality
- **Model**: `fal-ai/sdxl`
- **Steps**: 20-30
- **Use when**: Final production, print quality

## Image Size Options

| Size | Dimensions | Aspect Ratio | Best For |
|------|------------|--------------|----------|
| `square_hd` | 1024x1024 | 1:1 | Social media, avatars |
| `portrait_4_3` | 1024x768 | 4:3 | Portraits, vertical content |
| `portrait_16_9` | 1024x576 | 16:9 | Mobile screens, banners |
| `landscape_4_3` | 1024x768 | 4:3 | Traditional photos |
| `landscape_16_9` | 1024x576 | 16:9 | Widescreen, presentations |

## Tips for Better Results

1. **Use descriptive prompts**: Include style, mood, lighting details
2. **Experiment with steps**: More steps = better quality but slower
3. **Try different models**: Each has unique strengths
4. **Use LoRA models**: For consistent characters/styles
5. **Enable safety checker**: Prevents inappropriate content
6. **Set seeds**: For reproducible results during development

## Error Handling

```typescript
try {
  const result = await fal.subscribe('fal-ai/flux/schnell', {
    input: { /* parameters */ },
    logs: true,
    onQueueUpdate: (update) => {
      console.log('Status:', update.status);
    },
  });
} catch (error) {
  if (error.status === 422) {
    console.error('Invalid parameters:', error.details);
  } else if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Generation failed:', error);
  }
}
```

## Rate Limits

- **Free tier**: 10 concurrent requests
- **Paid tier**: Higher limits based on plan
- **Enterprise**: Custom limits available

## Support

For model-specific issues:
1. Check parameter ranges
2. Verify prompt format
3. Test with minimal parameters
4. Check Fal.ai documentation
5. Join Discord community
