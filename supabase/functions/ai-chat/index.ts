import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  systemPrompt: string;
}

// Extract specific topics and keywords from conversation
function extractTopics(messages: ChatMessage[]): {
  specificGoals: string[],
  specificChallenges: string[],
  specificActivities: string[],
  specificEmotions: string[]
} {
  const userMessages = messages.filter(m => m.role === 'user');
  const allText = userMessages.map(m => m.content).join(' ');

  const specificGoals: string[] = [];
  const specificChallenges: string[] = [];
  const specificActivities: string[] = [];
  const specificEmotions: string[] = [];

  // Extract goals with context
  const goalPatterns = [
    /(?:want to|trying to|planning to|hope to|goal is to|working on)\s+([^.!?]+)/gi,
    /(?:become|start|learn|achieve|build|create|improve|develop)\s+([^.!?]+)/gi,
  ];
  goalPatterns.forEach(pattern => {
    const matches = allText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        specificGoals.push(match[1].trim().slice(0, 100));
      }
    }
  });

  // Extract challenges with context
  const challengePatterns = [
    /(?:struggling with|difficult to|hard to|can't|cannot)\s+([^.!?]+)/gi,
    /(?:problem with|issue with|trouble with|worried about)\s+([^.!?]+)/gi,
  ];
  challengePatterns.forEach(pattern => {
    const matches = allText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        specificChallenges.push(match[1].trim().slice(0, 100));
      }
    }
  });

  // Extract specific activities and topics
  const activityWords = [
    'running', 'exercise', 'workout', 'fitness', 'training',
    'business', 'startup', 'company', 'career', 'job', 'work',
    'study', 'learning', 'education', 'course', 'degree',
    'writing', 'book', 'novel', 'blog', 'content',
    'relationship', 'family', 'friendship', 'dating', 'marriage',
    'health', 'diet', 'nutrition', 'meditation', 'therapy',
    'art', 'music', 'painting', 'drawing', 'creative',
    'coding', 'programming', 'development', 'tech',
    'language', 'Spanish', 'French', 'Chinese', 'speaking',
    'project', 'presentation', 'interview', 'exam', 'test'
  ];

  activityWords.forEach(word => {
    if (allText.toLowerCase().includes(word)) {
      specificActivities.push(word);
    }
  });

  // Extract emotional states
  const emotionWords = [
    'anxious', 'anxiety', 'nervous', 'worried', 'stressed', 'overwhelmed',
    'confident', 'excited', 'motivated', 'energized', 'hopeful',
    'frustrated', 'angry', 'disappointed', 'sad', 'depressed',
    'happy', 'proud', 'grateful', 'peaceful', 'calm'
  ];

  emotionWords.forEach(word => {
    if (allText.toLowerCase().includes(word)) {
      specificEmotions.push(word);
    }
  });

  return { specificGoals, specificChallenges, specificActivities, specificEmotions };
}

// Generate 3 specific affirmations based on conversation
function generateThreeAffirmations(messages: ChatMessage[]): string {
  const topics = extractTopics(messages);
  const affirmations: string[] = [];

  // Generate affirmations based on goals
  if (topics.specificGoals.length > 0) {
    const goalText = topics.specificGoals[0];
    affirmations.push(`I am fully capable of ${goalText}, and I take action every day to make it happen.`);
  }

  // Generate affirmations based on challenges
  if (topics.specificChallenges.length > 0) {
    const challengeText = topics.specificChallenges[0];
    affirmations.push(`I am developing the skills and resilience to overcome ${challengeText}.`);
  }

  // Generate affirmations based on activities
  if (topics.specificActivities.length > 0) {
    const mainActivity = topics.specificActivities[0];

    if (mainActivity.includes('run') || mainActivity.includes('fitness') || mainActivity.includes('exercise') || mainActivity.includes('workout')) {
      affirmations.push("My body is strong and capable of achieving my fitness goals.");
    } else if (mainActivity.includes('business') || mainActivity.includes('startup') || mainActivity.includes('career')) {
      affirmations.push("I have the vision, skills, and determination to build something meaningful.");
    } else if (mainActivity.includes('learn') || mainActivity.includes('study') || mainActivity.includes('education') || mainActivity.includes('language')) {
      affirmations.push("I am an eager learner and my mind absorbs new knowledge effortlessly.");
    } else if (mainActivity.includes('writing') || mainActivity.includes('book') || mainActivity.includes('creative')) {
      affirmations.push("My creative voice is unique and valuable, and I trust my artistic process.");
    } else if (mainActivity.includes('relationship') || mainActivity.includes('family') || mainActivity.includes('friend')) {
      affirmations.push("I cultivate meaningful connections through authentic communication and presence.");
    } else if (mainActivity.includes('coding') || mainActivity.includes('programming') || mainActivity.includes('tech')) {
      affirmations.push("I am a skilled problem-solver and I grow more capable with each project.");
    } else if (mainActivity.includes('health') || mainActivity.includes('diet') || mainActivity.includes('meditation')) {
      affirmations.push("I prioritize my wellbeing and honor what my body and mind need.");
    } else if (mainActivity.includes('art') || mainActivity.includes('music') || mainActivity.includes('painting')) {
      affirmations.push("I express myself authentically through my art and trust my creative process.");
    }
  }

  // Generate affirmations based on emotions
  if (topics.specificEmotions.length > 0) {
    const emotion = topics.specificEmotions[0];
    if (['anxious', 'anxiety', 'nervous', 'worried', 'stressed', 'overwhelmed'].includes(emotion)) {
      affirmations.push("I acknowledge my feelings and choose to take small, manageable steps forward.");
    } else if (['confident', 'excited', 'motivated', 'hopeful'].includes(emotion)) {
      affirmations.push("I harness this positive energy to fuel meaningful action toward my goals.");
    } else if (['frustrated', 'angry', 'disappointed'].includes(emotion)) {
      affirmations.push("I allow myself to feel these emotions, then channel them into constructive growth.");
    }
  }

  // Add general contextual affirmations if needed
  const userMessages = messages.filter(m => m.role === 'user');
  const conversationText = userMessages.map(m => m.content).join(' ').toLowerCase();

  if (affirmations.length < 3 && (conversationText.includes('time') || conversationText.includes('busy'))) {
    affirmations.push("I make time for what truly matters, and I am in control of my priorities.");
  }
  if (affirmations.length < 3 && (conversationText.includes('fear') || conversationText.includes('scared'))) {
    affirmations.push("I feel the fear and move forward anyway, knowing courage is built through action.");
  }
  if (affirmations.length < 3 && (conversationText.includes('change') || conversationText.includes('grow'))) {
    affirmations.push("I embrace change as an opportunity for growth and transformation.");
  }

  // Ensure exactly 3 unique affirmations
  const uniqueAffirmations = [...new Set(affirmations)];
  while (uniqueAffirmations.length < 3) {
    const fillers = [
      "I trust in my abilities and my capacity to learn and grow.",
      "I am worthy of the success and happiness I am creating.",
      "Every step I take, no matter how small, moves me forward.",
    ];
    for (const filler of fillers) {
      if (!uniqueAffirmations.includes(filler) && uniqueAffirmations.length < 3) {
        uniqueAffirmations.push(filler);
      }
    }
  }

  // Format the response
  let response = "Here are 3 affirmations for you:\n\n";
  uniqueAffirmations.slice(0, 3).forEach((affirmation, index) => {
    response += `${index + 1}. "${affirmation}"\n`;
  });

  return response;
}

// Generate reflective questions based on the topic
function generateReflectiveQuestions(messages: ChatMessage[], questionNumber: number): string {
  const topics = extractTopics(messages);
  const lastMessage = messages[messages.length - 1]?.content || '';
  const lastMessageLower = lastMessage.toLowerCase();

  const questions: string[][] = [[], [], []]; // 3 sets of questions

  // Question set 1: Understanding the topic deeply
  if (topics.specificGoals.length > 0) {
    const goal = topics.specificGoals[topics.specificGoals.length - 1];
    questions[0].push(`What would achieving ${goal} mean for your life?`);
    questions[0].push(`Why is ${goal} important to you right now?`);
  }
  if (topics.specificActivities.length > 0) {
    const activity = topics.specificActivities[topics.specificActivities.length - 1];
    questions[0].push(`What draws you to ${activity}?`);
    questions[0].push(`What does success look like with ${activity}?`);
  }
  if (topics.specificChallenges.length > 0) {
    const challenge = topics.specificChallenges[topics.specificChallenges.length - 1];
    questions[0].push(`What makes ${challenge} feel challenging right now?`);
  }
  questions[0].push("What's most important to you about this?");
  questions[0].push("What brought this to your mind today?");

  // Question set 2: Emotional connection and motivation
  questions[1].push("How do you feel when you think about this?");
  questions[1].push("What would it feel like to make progress on this?");
  questions[1].push("What emotions come up for you around this?");
  questions[1].push("What's driving your desire to work on this?");

  if (topics.specificGoals.length > 0) {
    questions[1].push("What will change in your life when you achieve this?");
  }
  if (topics.specificChallenges.length > 0) {
    questions[1].push("What would overcoming this challenge give you?");
  }

  // Question set 3: Action and support
  questions[2].push("What support would help you most right now?");
  questions[2].push("What's one small step you could take today?");
  questions[2].push("What resources do you already have that could help?");
  questions[2].push("What would make this feel more achievable?");

  if (topics.specificActivities.length > 0) {
    questions[2].push("What's your next action step?");
  }
  if (lastMessageLower.includes('hard') || lastMessageLower.includes('difficult')) {
    questions[2].push("What might help you move through this difficulty?");
  }

  // Select appropriate question based on question number
  const questionSet = questions[questionNumber - 1];
  if (questionSet.length > 0) {
    return questionSet[Math.floor(Math.random() * questionSet.length)];
  }

  // Fallback questions
  const fallbacks = [
    "Tell me more about what matters most here.",
    "What else is on your mind about this?",
    "How does this connect to what you value?",
  ];
  return fallbacks[questionNumber - 1] || fallbacks[0];
}

// Generate short, supportive responses with structured question flow
function generateCoachResponse(messages: ChatMessage[], systemPrompt: string): string {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const lastMessageLower = lastMessage.toLowerCase();
  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');
  const userMessageCount = userMessages.length;

  // Greeting - first message
  if (userMessageCount === 1 && (lastMessageLower.includes('hello') || lastMessageLower.includes('hi') || lastMessageLower.includes('hey') || lastMessage.length < 20)) {
    return "Hi! What's on your mind today?";
  }

  // User said yes to affirmations
  if (lastMessageLower.includes('yes') || lastMessageLower.includes('sure') || lastMessageLower.includes('ok') || lastMessageLower.includes('please')) {
    if (assistantMessages.length > 0) {
      const lastAssistantMessage = assistantMessages[assistantMessages.length - 1].content.toLowerCase();
      if (lastAssistantMessage.includes('would you like') && lastAssistantMessage.includes('affirmation')) {
        return generateThreeAffirmations(messages);
      }
    }
  }

  // User said no to affirmations
  if ((lastMessageLower === 'no' || lastMessageLower === 'not yet' || lastMessageLower.includes('no thanks')) && assistantMessages.length > 0) {
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1].content.toLowerCase();
    if (lastAssistantMessage.includes('would you like') && lastAssistantMessage.includes('affirmation')) {
      return "That's okay! What else would you like to explore?";
    }
  }

  // After user's 4th message, offer affirmations
  if (userMessageCount === 4) {
    return "Thank you for sharing all of that with me. Would you like me to offer 3 affirmation statements based on what we've discussed?";
  }

  // Questions 1-3: Ask reflective questions with supportive feedback
  if (userMessageCount >= 1 && userMessageCount <= 3) {
    const supportiveFeedback = [
      "That's really insightful.",
      "I appreciate you sharing that.",
      "That takes courage to acknowledge.",
      "I hear you.",
      "That's meaningful.",
      "Thank you for opening up.",
    ];

    const feedback = supportiveFeedback[Math.floor(Math.random() * supportiveFeedback.length)];
    const question = generateReflectiveQuestions(messages, userMessageCount);

    return `${feedback} ${question}`;
  }

  // After question flow is complete, continue with general supportive responses
  const responses = [
    "Tell me more about that.",
    "What else is on your mind?",
    "How are you feeling about all of this now?",
    "What support would help you most?",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    const { messages, systemPrompt }: RequestBody = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Generate response using pattern matching
    const responseText = generateCoachResponse(messages, systemPrompt);

    // Return response in Claude API format
    const data = {
      id: `msg_${Date.now()}`,
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: responseText,
        }
      ],
      model: 'coach-simulator',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 0,
        output_tokens: 0,
      }
    };

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in ai-chat function:', error);

    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
