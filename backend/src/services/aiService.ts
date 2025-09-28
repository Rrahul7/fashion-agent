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
  proportionBalance: string;
  proportionScore: number;
  fabricSynergy: string;
  fabricScore: number;
  stylingSophistication: string;
  sophisticationScore: number;
  overallScore: number;
  highlights: string[];
  improvementSuggestions: string[];
  expertInsights: string[];
  technicalFlaws: string[];
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
  userProfile?: UserProfile | null,
  description?: string | null
): Promise<OutfitAnalysis> {
  try {
    console.log('Analyzing outfit image with AI:', imageUrl);
    console.log('User profile context:', userProfile);
    console.log('User description:', description);

    // Use OpenRouter if configured, otherwise fall back to mock
    if (config.ai.openrouterApiKey) {
      return await analyzeWithOpenRouter(imageUrl, userProfile, description);
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
      proportionBalance: 'balanced',
      proportionScore: 75,
      fabricSynergy: 'compatible',
      fabricScore: 70,
      stylingSophistication: 'basic',
      sophisticationScore: 65,
      overallScore: 73,
      highlights: ['Clean and presentable look'],
      improvementSuggestions: ['Consider accessorizing to add personality'],
      expertInsights: ['Outfit follows basic style principles'],
      technicalFlaws: ['Limited styling creativity evident'],
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
export async function analyzeWithOpenRouter(imageUrl: string, userProfile?: UserProfile | null, description?: string | null): Promise<OutfitAnalysis> {
  if (!config.ai.openrouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const prompt = createOutfitAnalysisPrompt(userProfile, description);
  
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
        !analysis.occasionSuitability || !analysis.proportionBalance || 
        !analysis.fabricSynergy || !analysis.stylingSophistication ||
        !Array.isArray(analysis.highlights) || 
        !Array.isArray(analysis.improvementSuggestions) ||
        !Array.isArray(analysis.expertInsights) ||
        !Array.isArray(analysis.technicalFlaws) ||
        typeof analysis.styleCategoryScore !== 'number' ||
        typeof analysis.fitScore !== 'number' ||
        typeof analysis.colorHarmonyScore !== 'number' ||
        typeof analysis.occasionScore !== 'number' ||
        typeof analysis.proportionScore !== 'number' ||
        typeof analysis.fabricScore !== 'number' ||
        typeof analysis.sophisticationScore !== 'number' ||
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
function createOutfitAnalysisPrompt(userProfile?: UserProfile | null, description?: string | null): string {
  let profileContext = '';
  let descriptionContext = '';
  
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

  if (description && description.trim()) {
    descriptionContext = `\n\nUser's Context & Intent:\n"${description.trim()}"\n\nIMPORTANT: Consider this context when analyzing the outfit. If the user mentions specific occasions, style goals, or preferences, factor these into your expert assessment. Tailor your recommendations to align with their stated intentions while maintaining professional honesty about what works and what doesn't.`;
  }

  return `You are an elite fashion consultant with expertise in haute couture, fashion psychology, and advanced styling theory. Provide an expert-level analysis that reveals insights beyond what typical fashion advice offers. Be brutally honest yet constructive - fashion excellence requires acknowledging flaws to achieve greatness.

${profileContext}${descriptionContext}

## FIRST: OUTFIT VALIDATION

**CRITICAL STEP**: Before analyzing, you MUST verify there is an actual outfit to review:
- Is the person wearing substantial clothing/garments (not just underwear, swimwear, or shirtless)?
- Are there enough clothing elements to constitute a complete outfit?
- Is this appropriate for fashion analysis?

**IF NO SUBSTANTIAL OUTFIT IS PRESENT:**
Return this JSON immediately (no further analysis needed):
{
  "styleCategory": "no outfit",
  "styleCategoryScore": 0,
  "fit": "no clothing present",
  "fitScore": 0,
  "colorHarmony": "not applicable",
  "colorHarmonyScore": 0,
  "occasionSuitability": "not applicable",
  "occasionScore": 0,
  "proportionBalance": "not applicable",
  "proportionScore": 0,
  "fabricSynergy": "not applicable",
  "fabricScore": 0,
  "stylingSophistication": "not applicable",
  "sophisticationScore": 0,
  "overallScore": 0,
  "highlights": [],
  "improvementSuggestions": ["Please upload an image with clothing/outfit to analyze", "Ensure the person is wearing substantial garments for fashion review"],
  "expertInsights": ["Fashion analysis requires actual clothing elements to evaluate"],
  "technicalFlaws": ["No clothing present to analyze"]
}

**ONLY IF A COMPLETE OUTFIT IS PRESENT**, proceed with the expert analysis framework below:

## EXPERT ANALYSIS FRAMEWORK

### CORE ASSESSMENTS:

1. **Style Category & Execution**: Identify style and evaluate how successfully it's executed against professional standards

2. **Technical Fit Analysis**: 
   - Shoulder seam placement and construction
   - Armhole cut and movement allowance  
   - Hemline precision and proportion
   - Waist suppression and body geometry
   - Break points in trousers and sleeves

3. **Advanced Color Theory**:
   - Undertone harmony vs. surface color coordination
   - Color temperature balance and seasonal appropriateness
   - Value contrast for visual hierarchy
   - Chroma saturation levels and their psychological impact

4. **Occasion Contextual Intelligence**: Beyond basic appropriateness - consider power dynamics, cultural subtleties, and situational psychology

### EXPERT-LEVEL PARAMETERS:

5. **Proportion & Visual Weight Analysis**:
   - Golden ratio adherence in silhouette
   - Visual balance between upper/lower body
   - Scale relationships between garments and body frame
   - Line direction impact on perceived body geometry

6. **Fabric Synergy & Technical Merit**:
   - Weight distribution and drape interaction
   - Texture contrast sophistication
   - Seasonal fabric logic
   - Quality indicators in construction details

7. **Styling Sophistication Assessment**:
   - Layering technique mastery
   - Accessory integration and hierarchy
   - Risk-taking vs. safe choices balance
   - Evidence of personal style development vs. trend following

### CRITICAL ANALYSIS REQUIREMENTS:

- **Expert Insights**: Reveal fashion principles most people don't understand (color psychology, proportion theory, fabric behavior, style archetypes)
- **Technical Flaws**: Identify specific issues that affect the outfit's success (fit problems, styling mistakes, missed opportunities)
- **Honest Assessment**: Don't sugarcoat - fashion growth requires recognizing what isn't working

Consider advanced factors like:
- Bauhaus design principles in styling
- Fashion archetypes and their psychological messaging
- Seasonal color analysis theory
- Kibbe body geometry principles  
- French vs. Italian vs. British tailoring philosophies
- Power dressing psychological impact
- Trend vs. timeless style differentiation
- Cultural fashion codes and their proper execution

**CRITICAL**: Respond ONLY with valid JSON in this exact format:

{
  "styleCategory": "string",
  "styleCategoryScore": 85,
  "fit": "string", 
  "fitScore": 80,
  "colorHarmony": "string",
  "colorHarmonyScore": 75,
  "occasionSuitability": "string",
  "occasionScore": 90,
  "proportionBalance": "string",
  "proportionScore": 78,
  "fabricSynergy": "string", 
  "fabricScore": 73,
  "stylingSophistication": "string",
  "sophisticationScore": 82,
  "overallScore": 79,
  "highlights": ["string", "string", "string"],
  "improvementSuggestions": ["string", "string", "string"],
  "expertInsights": ["string", "string", "string"],
  "technicalFlaws": ["string", "string", "string"]
}

**Scoring Guidelines (0-100):**
- 90-100: Exceptional/Museum-Quality
- 80-89: Very Good/Editorial-Ready  
- 70-79: Good/Street Style Worthy
- 60-69: Fair/Needs Refinement
- 50-59: Below Average/Amateur Mistakes Evident
- 0-49: Poor/Requires Major Overhaul

Calculate overallScore as average of all seven component scores.

**EXPERT INSIGHTS should reveal:**
- Fashion principles most people don't know
- Historical/designer references where relevant
- Psychology behind style choices
- Advanced styling techniques demonstrated or missed

**TECHNICAL FLAWS must identify:**
- Specific fit issues with tailoring terminology
- Styling mistakes that undermine the look
- Missed opportunities for elevated execution
- Construction or quality problems visible

BE DISCERNING - not every outfit deserves high scores. Fashion excellence is rare and should be recognized as such.`;
}

// Mock analysis function for fallback
async function getMockAnalysis(): Promise<OutfitAnalysis> {
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  const styleCategoryScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const fitScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const colorHarmonyScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const occasionScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const proportionScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const fabricScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const sophisticationScore = Math.floor(Math.random() * 30) + 60; // 60-90
  const overallScore = Math.floor((styleCategoryScore + fitScore + colorHarmonyScore + occasionScore + proportionScore + fabricScore + sophisticationScore) / 7);

  return {
    styleCategory: getRandomStyle(),
    styleCategoryScore,
    fit: getRandomFit(),
    fitScore,
    colorHarmony: getRandomColorHarmony(),
    colorHarmonyScore,
    occasionSuitability: getRandomOccasion(),
    occasionScore,
    proportionBalance: 'balanced',
    proportionScore,
    fabricSynergy: 'compatible',
    fabricScore,
    stylingSophistication: 'moderate',
    sophisticationScore,
    overallScore,
    highlights: getRandomHighlights(),
    improvementSuggestions: getRandomSuggestions(),
    expertInsights: ['Good understanding of basic styling principles', 'Shows potential for style development'],
    technicalFlaws: ['Minor adjustments needed for optimal fit', 'Could benefit from more adventurous styling choices'],
  };
}
