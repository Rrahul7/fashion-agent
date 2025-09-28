import { config } from '../config/config';

export interface OutfitAnalysis {
  styleCategory: string;
  styleCategoryScore: number;
  fit: string;
  fitScore: number;
  colorHarmony: string;
  colorHarmonyScore: number;
  occasionSuitability: string;
  occasionScore: number;
  overallScore: number;
  highlights: string[];
  improvementSuggestions: string[];
}

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface UserProfile {
  skinTone?: string | null;
  build?: string | null;
  faceStructure?: string | null;
  hairType?: string | null;
  height?: number | null;
  weight?: number | null;
}

export async function analyzeOutfit(
  imageUrl: string,
  userProfile?: UserProfile | null
): Promise<OutfitAnalysis> {
  try {
    console.log('Analyzing outfit image with AI:', imageUrl);
    console.log('User profile context:', userProfile);

    // Use OpenRouter if configured, otherwise fall back to mock
    if (config.ai.openrouterApiKey) {
      return await analyzeWithOpenRouter(imageUrl, userProfile);
    } else {
      console.warn('OpenRouter API key not configured, using mock analysis');
      return await getMockAnalysis();
    }

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // Return fallback analysis with scores
    return {
      styleCategory: 'casual',
      styleCategoryScore: 75,
      fit: 'good',
      fitScore: 80,
      colorHarmony: 'neutral',
      colorHarmonyScore: 70,
      occasionSuitability: 'casual outing',
      occasionScore: 85,
      overallScore: 77,
      highlights: ['Clean and presentable look'],
      improvementSuggestions: ['Consider accessorizing to add personality'],
    };
  }
}

// Mock functions for demonstration - replace with actual AI logic
function getRandomStyle(): string {
  const styles = ['casual', 'formal', 'traditional', 'sporty', 'bohemian', 'minimalist', 'streetwear'];
  return styles[Math.floor(Math.random() * styles.length)];
}

function getRandomFit(): string {
  const fits = ['perfect', 'loose', 'tight', 'good', 'needs adjustment'];
  return fits[Math.floor(Math.random() * fits.length)];
}

function getRandomColorHarmony(): string {
  const harmonies = ['excellent', 'good', 'neutral', 'clashing', 'monochromatic'];
  return harmonies[Math.floor(Math.random() * harmonies.length)];
}

function getRandomOccasion(): string {
  const occasions = ['office', 'party', 'date', 'casual outing', 'formal event', 'workout', 'shopping'];
  return occasions[Math.floor(Math.random() * occasions.length)];
}

function getRandomHighlights(): string[] {
  const highlights = [
    'Great color coordination',
    'Well-fitted garments',
    'Appropriate for the occasion',
    'Nice attention to detail',
    'Good balance of textures',
    'Flattering silhouette',
    'Confident styling choice'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1;
  return highlights.sort(() => 0.5 - Math.random()).slice(0, count);
}

function getRandomSuggestions(): string[] {
  const suggestions = [
    'Consider adding a statement accessory',
    'Try a different shoe style for more impact',
    'Layer with a jacket or cardigan',
    'Experiment with different color combinations',
    'Pay attention to fit around the shoulders',
    'Add a belt to define your waist',
    'Consider the occasion when choosing patterns'
  ];
  
  const count = Math.floor(Math.random() * 3) + 1;
  return suggestions.sort(() => 0.5 - Math.random()).slice(0, count);
}

// OpenRouter AI Analysis Implementation
export async function analyzeWithOpenRouter(imageUrl: string, userProfile?: UserProfile | null): Promise<OutfitAnalysis> {
  if (!config.ai.openrouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const prompt = createOutfitAnalysisPrompt(userProfile);
  
  try {
    const response = await fetch(config.ai.openrouterUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.ai.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': config.frontend.url,
        'X-Title': 'Fashion Agent - Outfit Analysis',
      },
      body: JSON.stringify({
        model: config.ai.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: { 
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: {
          type: 'json_object'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data: OpenRouterResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI model');
    }

    const content = data.choices[0].message.content;
    console.log('AI Response:', content);

    // Parse and validate JSON response
    const analysis = JSON.parse(content) as OutfitAnalysis;
    
    // Validate required fields
    if (!analysis.styleCategory || !analysis.fit || !analysis.colorHarmony || 
        !analysis.occasionSuitability || !Array.isArray(analysis.highlights) || 
        !Array.isArray(analysis.improvementSuggestions) ||
        typeof analysis.styleCategoryScore !== 'number' ||
        typeof analysis.fitScore !== 'number' ||
        typeof analysis.colorHarmonyScore !== 'number' ||
        typeof analysis.occasionScore !== 'number' ||
        typeof analysis.overallScore !== 'number') {
      throw new Error('Invalid response format from AI');
    }

    return analysis;

  } catch (error) {
    console.error('OpenRouter analysis error:', error);
    throw error;
  }
}

// Create comprehensive outfit analysis prompt with JSON schema
function createOutfitAnalysisPrompt(userProfile?: UserProfile | null): string {
  let profileContext = '';
  
  if (userProfile) {
    const profileDetails = [];
    if (userProfile.skinTone) profileDetails.push(`Skin tone: ${userProfile.skinTone}`);
    if (userProfile.build) profileDetails.push(`Build: ${userProfile.build}`);
    if (userProfile.faceStructure) profileDetails.push(`Face structure: ${userProfile.faceStructure}`);
    if (userProfile.hairType) profileDetails.push(`Hair type: ${userProfile.hairType}`);
    if (userProfile.height) profileDetails.push(`Height: ${userProfile.height}cm`);
    
    if (profileDetails.length > 0) {
      profileContext = `\n\nUser Profile Context:\n${profileDetails.join('\n')}`;
    }
  }

  return `You are a professional fashion stylist and image consultant. Analyze the outfit in this image and provide detailed feedback in JSON format.

${profileContext}

Analyze the following aspects:

1. **Style Category**: Identify the main style (e.g., casual, formal, business casual, streetwear, bohemian, minimalist, traditional, sporty, etc.)

2. **Fit Assessment**: Evaluate how well the clothes fit the person (perfect, good, loose, tight, needs adjustment)

3. **Color Harmony**: Assess the color coordination (excellent, good, neutral, clashing, monochromatic)

4. **Occasion Suitability**: Determine what occasions this outfit is appropriate for (e.g., office, party, casual outing, date, formal event, workout, etc.)

5. **Highlights**: List 2-4 positive aspects of the outfit

6. **Improvement Suggestions**: Provide 2-4 specific, actionable suggestions to enhance the look

Consider factors like:
- Color theory and coordination
- Proportions and silhouette
- Texture and fabric combinations
- Seasonal appropriateness
- Personal style expression
- Cultural context if applicable
- Body type considerations (if profile provided)

**Important**: Respond ONLY with valid JSON in this exact format:

{
  "styleCategory": "string",
  "styleCategoryScore": 85,
  "fit": "string", 
  "fitScore": 80,
  "colorHarmony": "string",
  "colorHarmonyScore": 75,
  "occasionSuitability": "string",
  "occasionScore": 90,
  "overallScore": 82,
  "highlights": ["string", "string", "string"],
  "improvementSuggestions": ["string", "string", "string"]
}

**Scoring Guidelines (0-100):**
- 90-100: Exceptional/Perfect
- 80-89: Very Good
- 70-79: Good
- 60-69: Fair/Needs Minor Improvement
- 50-59: Below Average
- 0-49: Poor/Needs Major Improvement

Calculate overallScore as the average of the four individual scores.

Be specific, constructive, and encouraging in your feedback. Focus on practical advice that can be easily implemented.`;
}

// Mock analysis function for fallback
async function getMockAnalysis(): Promise<OutfitAnalysis> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const styleCategoryScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const fitScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const colorHarmonyScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const occasionScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const overallScore = Math.floor((styleCategoryScore + fitScore + colorHarmonyScore + occasionScore) / 4);

  return {
    styleCategory: getRandomStyle(),
    styleCategoryScore,
    fit: getRandomFit(),
    fitScore,
    colorHarmony: getRandomColorHarmony(),
    colorHarmonyScore,
    occasionSuitability: getRandomOccasion(),
    occasionScore,
    overallScore,
    highlights: getRandomHighlights(),
    improvementSuggestions: getRandomSuggestions(),
  };
}
