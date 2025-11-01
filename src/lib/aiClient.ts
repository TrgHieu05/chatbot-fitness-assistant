export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };
export type ChatMode = 'advice' | 'menu' | 'calories';

const API_URL = '/api/openrouter';

export async function chatWithNutritionAI(messages: ChatMessage[], language: 'en' | 'vi') {

  const systemPrompt = language === 'en'
    ? [
        'You are a bilingual nutrition assistant.',
        'ALWAYS respond in English, regardless of the user input language.',
        'Use plain text only — do not use Markdown, bullet points, code fences, or special formatting.',
        'Structure your response as short paragraphs separated by newline characters for readability.',
        'Provide clear, safe, practical diet guidance aligned to user goals, with concise tips and optional meal suggestions.',
      ].join(' ')
    : [
        'Bạn là trợ lý dinh dưỡng song ngữ.',
        'LUÔN trả lời bằng tiếng Việt, bất kể người dùng nhập bằng ngôn ngữ nào.',
        'Chỉ dùng văn bản thuần — không dùng Markdown, gạch đầu dòng, code fence hoặc định dạng đặc biệt.',
        'Sắp xếp câu trả lời thành các đoạn ngắn, phân tách bằng ký tự xuống dòng để dễ đọc.',
        'Hãy đưa ra hướng dẫn ăn uống an toàn, thực tế, phù hợp mục tiêu của người dùng, ưu tiên mẹo ngắn gọn và gợi ý bữa ăn.',
      ].join(' ');

  function stripMarkdown(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/`([^`]*)`/g, '$1') // inline code
      .replace(/^#+\s*(.*)$/gm, '$1') // headings
      .replace(/^\s*[-*]\s+/gm, '') // unordered list bullets
      .replace(/^\s*\d+\.\s+/gm, '') // ordered list numbers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
      .replace(/\*([^*]+)\*/g, '$1') // italic
      .replace(/_([^_]+)_/g, '$1') // italic underscores
      .replace(/~~([^~]+)~~/g, '$1') // strikethrough
      .replace(/>\s?/gm, '') // blockquotes
      .replace(/!\[(.*?)\]\((.*?)\)/g, '$1') // images alt text
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // links text
      .replace(/[ \t]{2,}/g, ' ') // collapse multiple spaces/tabs but keep newlines
      .replace(/\n{3,}/g, '\n\n') // limit excessive blank lines to two
      .trim();
  }

  const payload = {
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Phản hồi AI không có nội dung.');
  }
  return stripMarkdown(content);
}

// Hướng dẫn theo chế độ để điều chỉnh phong cách trả lời
export function getModeInstruction(mode: ChatMode, language: 'en' | 'vi'): string {
  if (language === 'en') {
    switch (mode) {
      case 'advice':
        return [
          'Mode: Nutrition and fitness advice.',
          'Give practical, safe guidance tailored to the user’s context and goals.',
          'Prefer step-by-step tips, suggest small habit changes, and optional 7-day action plan.',
        ].join(' ');
      case 'menu':
        return [
          'Mode: Menu building.',
          'Create a simple 7-day menu with 3 meals + 1 snack per day.',
          'Each meal: name, approximate calories and macros.',
          'End with a concise shopping list summary grouped by categories.',
        ].join(' ');
      case 'calories':
        return [
          'Mode: Calorie analysis from meal image.',
          'Identify foods, estimate portion sizes, calories and macros per item and total.',
          'Provide confidence level and mention assumptions; suggest healthier swaps if relevant.',
        ].join(' ');
      default:
        return '';
    }
  } else {
    // Vietnamese
    switch (mode) {
      case 'advice':
        return [
          'Chế độ: Lời khuyên dinh dưỡng và thể chất.',
          'Đưa ra hướng dẫn an toàn, thực tế, phù hợp bối cảnh và mục tiêu của người dùng.',
          'Ưu tiên mẹo theo từng bước, gợi ý thay đổi thói quen nhỏ và kế hoạch hành động 7 ngày (tùy chọn).',
        ].join(' ');
      case 'menu':
        return [
          'Chế độ: Xây dựng thực đơn.',
          'Tạo thực đơn đơn giản.',
          'Mỗi bữa: tên, calories và macros ước lượng.',
          'Kết thúc bằng danh sách mua sắm ngắn gọn, nhóm theo danh mục.',
        ].join(' ');
      case 'calories':
        return [
          'Chế độ: Phân tích calories từ ảnh món ăn.',
          'Nhận diện món ăn, ước lượng khẩu phần, calories và macros cho từng món và tổng.',
          'Đưa mức độ tự tin, nêu giả định và gợi ý thay thế lành mạnh nếu phù hợp.',
        ].join(' ');
      default:
        return '';
    }
  }
}

// Chat hỗ trợ ảnh: gửi lịch sử dạng văn bản và tin nhắn cuối cùng chứa văn bản + ảnh
export async function chatWithNutritionAIVision(
  messages: ChatMessage[],
  userText: string,
  imageDataUrl: string,
  language: 'en' | 'vi',
  mode?: ChatMode,
) {
  

  const systemPrompt = language === 'en'
    ? [
        'You are a bilingual nutrition assistant.',
        'ALWAYS respond in English, regardless of the user input language.',
        'Use plain text only — do not use Markdown, bullet points, code fences, or special formatting.',
        'Structure your response as short paragraphs separated by newline characters for readability.',
        'Provide clear, safe, practical diet guidance aligned to user goals, with concise tips and optional meal suggestions.',
      ].join(' ')
    : [
        'Bạn là trợ lý dinh dưỡng song ngữ.',
        'LUÔN trả lời bằng tiếng Việt, bất kể người dùng nhập bằng ngôn ngữ nào.',
        'Chỉ dùng văn bản thuần — không dùng Markdown, gạch đầu dòng, code fence hoặc định dạng đặc biệt.',
        'Sắp xếp câu trả lời thành các đoạn ngắn, phân tách bằng ký tự xuống dòng để dễ đọc.',
        'Hãy đưa ra hướng dẫn ăn uống an toàn, thực tế, phù hợp mục tiêu của người dùng, ưu tiên mẹo ngắn gọn và gợi ý bữa ăn.',
      ].join(' ');

  function stripMarkdown(text: string): string {
    return text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/^#+\s*(.*)$/gm, '$1')
      .replace(/^\s*[-*]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/>\s?/gm, '')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const extraInstruction = mode ? getModeInstruction(mode, language) : '';

  const payload = {
    // Model hỗ trợ hình ảnh
    model: 'openai/gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...(extraInstruction ? [{ role: 'system', content: extraInstruction }] : []),
      ...messages,
      {
        role: 'user',
        content: [
          { type: 'text', text: userText },
          { type: 'image_url', image_url: { url: imageDataUrl } },
        ] as any,
      },
    ],
  } as any;

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Phản hồi AI không có nội dung.');
  }
  return stripMarkdown(content);
}

// Tóm tắt hội thoại: tạo bản tóm tắt ngắn gọn văn bản thuần để dùng làm ngữ cảnh
export async function summarizeConversation(messages: ChatMessage[], language: 'en' | 'vi') {

  const systemSummaryPrompt = language === 'en'
    ? [
        'You are a helpful assistant generating a short conversation summary.',
        'Use plain text only — no Markdown or special formatting.',
        'Summarize user goals, preferences, and important assistant guidance so far.',
        'Keep it concise (2–4 short lines).'
      ].join(' ')
    : [
        'Bạn là trợ lý tạo bản tóm tắt hội thoại ngắn gọn.',
        'Chỉ dùng văn bản thuần — không dùng Markdown hay định dạng đặc biệt.',
        'Tóm tắt mục tiêu, sở thích của người dùng và hướng dẫn quan trọng của trợ lý.',
        'Giữ ngắn gọn (2–4 dòng ngắn).'
      ].join(' ');

  const payload = {
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemSummaryPrompt },
      ...messages,
      { role: 'user', content: language === 'en' ? 'Please summarize our conversation.' : 'Hãy tóm tắt hội thoại của chúng ta.' }
    ],
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Phản hồi tóm tắt không có nội dung.');
  }
  // Tối giản định dạng, giữ xuống dòng
  return content
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}