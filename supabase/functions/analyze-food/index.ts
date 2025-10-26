// Deno edge function

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, foodName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing food:', { hasImage: !!imageUrl, foodName });

    // Prepare the prompt based on input
    let userPrompt = '';
    const messages: any[] = [
      {
        role: 'system',
        content: `You are a nutrition expert AI. Analyze food and provide accurate nutrition information. 
Always respond with JSON in this exact format:
{
  "foodName": "detected food name",
  "calories": number (integer),
  "protein": number (decimal, grams),
  "carbs": number (decimal, grams),
  "fat": number (decimal, grams),
  "healthRating": "good" or "average" or "poor",
  "vitamins": "brief description of key vitamins",
  "minerals": "brief description of key minerals"
}

Rating guidelines:
- "good": balanced macros, high in vitamins/minerals, whole foods
- "average": moderate nutritional value, some processed elements
- "poor": high in unhealthy fats/sugars, low nutritional value

Be accurate with numeric values. Use realistic portion sizes.`
      }
    ];

    if (imageUrl) {
      userPrompt = `Analyze this food image and provide detailed nutrition information.`;
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: userPrompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      });
    } else if (foodName) {
      userPrompt = `Analyze "${foodName}" and provide detailed nutrition information for a standard serving.`;
      messages.push({
        role: 'user',
        content: userPrompt
      });
    } else {
      throw new Error('Either imageUrl or foodName must be provided');
    }

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const aiMessage = data.choices?.[0]?.message?.content;
    if (!aiMessage) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from AI response
    let nutritionData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiMessage.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       aiMessage.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[1]);
      } else {
        nutritionData = JSON.parse(aiMessage);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiMessage);
      throw new Error('Failed to parse nutrition data from AI response');
    }

    // Validate the response structure
    if (!nutritionData.foodName || typeof nutritionData.calories !== 'number') {
      throw new Error('Invalid nutrition data structure from AI');
    }

    console.log('Successfully analyzed food:', nutritionData.foodName);

    return new Response(
      JSON.stringify(nutritionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-food function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to analyze food'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
