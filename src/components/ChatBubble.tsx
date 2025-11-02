import { useRef, useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Send, Camera, X } from 'lucide-react';
import { Language } from '../lib/translations';
import { chatWithNutritionAI, chatWithNutritionAIVision, getModeInstruction } from '../lib/aiClient';

type ChatMessage = {
  type: 'ai' | 'user';
  message: string;
};

interface ChatBubbleProps {
  language: Language;
  t: any;
}

export function ChatBubble({ language, t }: ChatBubbleProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      message:
        language === 'en'
          ? 'Hello! I can help you with meal suggestions and nutrition questions. What would you like to know?'
          : 'Xin chào! Tôi có thể giúp bạn về gợi ý bữa ăn và câu hỏi dinh dưỡng. Bạn muốn biết gì?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState<'advice' | 'menu' | 'calories'>('advice');
  const [usageCount, setUsageCount] = useState<number>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('global_ai_usage') : null;
      return raw ? parseInt(raw) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [summaryText, setSummaryText] = useState<string>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('global_ai_summary') : null;
      return raw || '';
    } catch {
      return '';
    }
  });

  const [showChatBubble, setShowChatBubble] = useState(false);

  // Camera states & refs cho chế độ phân tích calories
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const persistUsage = (next: number) => {
    setUsageCount(next);
    try {
      if (typeof window !== 'undefined') localStorage.setItem('global_ai_usage', String(next));
    } catch {}
  };
  const persistSummary = (text: string) => {
    setSummaryText(text);
    try {
      if (typeof window !== 'undefined') localStorage.setItem('global_ai_summary', text);
    } catch {}
  };

  const formatPlainTextForChat = (text: string): string => {
    let s = (text || '').trim();
    s = s
      .replace(/\s*(Day\s*\d+:)/g, '\n$1\n')
      .replace(/\s*(Breakfast:|Lunch:|Dinner:|Snack:)/g, '\n$1 ')
      .replace(/\s*(Ngày\s*\d+:)/g, '\n$1\n')
      .replace(/\s*(Sáng:|Trưa:|Tối:|Ăn vặt:)/g, '\n$1 ');

    if (!/\n/.test(s)) {
      const parts = s.split(/(?<=\.|\?|!)[\s]+/);
      const rebuilt: string[] = [];
      for (let i = 0; i < parts.length; i++) {
        rebuilt.push(parts[i].trim());
        if (i % 2 === 1 && i !== parts.length - 1) rebuilt.push('\n');
        else rebuilt.push(' ');
      }
      s = rebuilt.join('').replace(/[ ]{2,}/g, ' ').trim();
    }

    s = s.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');
    return s;
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        // @ts-ignore
        videoRef.current.srcObject = mediaStream;
      }
      setShowCamera(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert(language === 'en' ? 'Could not access camera' : 'Không thể truy cập camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setShowCamera(false);
  };

  const capturePhotoAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    stopCamera();
    await sendCalorieAnalysisWithImage(dataUrl);
  };

  const modeLabel = {
    advice: language === 'en' ? 'Nutrition and fitness advice' : 'Lời khuyên dinh dưỡng và thể chất',
    menu: language === 'en' ? 'Menu building' : 'Xây dựng thực đơn',
    calories: language === 'en' ? 'Calorie analysis' : 'Phân tích calories',
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    if (usageCount >= 20) {
      const limitMsg = language === 'en'
        ? 'You have reached the limit of 20 uses in this session.'
        : 'Bạn đã dùng tối đa 20 lần trong phiên này.';
      setChatMessages((prev: ChatMessage[]) => [...prev, { type: 'ai', message: limitMsg }]);
      return;
    }

    const userText = inputMessage;
    setInputMessage('');
    setChatMessages((prev: ChatMessage[]) => [...prev, { type: 'user', message: userText }]);
    setIsSending(true);

    try {
      const history = chatMessages.map((m: ChatMessage) => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.message,
      }));
      const summaryMessage = summaryText
        ? [{ role: 'system', content: language === 'en' ? `Conversation summary: ${summaryText}` : `Tóm tắt hội thoại: ${summaryText}` }]
        : [];

      if (history.length >= 8 && usageCount < 20) {
        const newSummary = await chatWithNutritionAI(
          [
            { role: 'system', content: language === 'en' ? 'Summarize the following conversation in one short paragraph.' : 'Tóm tắt cuộc hội thoại sau thành một đoạn ngắn.' },
            ...history as any,
          ],
          language === 'en' ? 'en' : 'vi'
        );
        persistSummary(newSummary);
        persistUsage(usageCount + 1);
      }

      const messages = [
        ...summaryMessage as any,
        { role: 'system', content: getModeInstruction(mode, language === 'en' ? 'en' : 'vi') },
        ...history,
        { role: 'user', content: userText },
      ];

      const aiReply = await chatWithNutritionAI(messages as any, language === 'en' ? 'en' : 'vi');
      const formatted = formatPlainTextForChat(aiReply);
      setChatMessages((prev: ChatMessage[]) => [...prev, { type: 'ai', message: formatted }]);
      persistUsage(Math.min(usageCount + 1, 20));
    } catch (err: any) {
      const fallback = language === 'en'
        ? 'Sorry, I could not reach the nutrition assistant. Please try again later.'
        : 'Xin lỗi, không thể kết nối trợ lý dinh dưỡng. Vui lòng thử lại sau.';
      setChatMessages((prev: ChatMessage[]) => [...prev, { type: 'ai', message: fallback }]);
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const sendCalorieAnalysisWithImage = async (imageDataUrl: string) => {
    if (isSending) return;
    if (usageCount >= 20) {
      const limitMsg = language === 'en'
        ? 'You have reached the limit of 20 uses in this session.'
        : 'Bạn đã dùng tối đa 20 lần trong phiên này.';
      setChatMessages((prev: ChatMessage[]) => [...prev, { type: 'ai', message: limitMsg }]);
      return;
    }

    setIsSending(true);
    try {
      const history = chatMessages.map((m: ChatMessage) => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.message,
      }));
      const summaryMessage = summaryText
        ? [{ role: 'system', content: language === 'en' ? `Conversation summary: ${summaryText}` : `Tóm tắt hội thoại: ${summaryText}` }]
        : [];

      const instruction = getModeInstruction('calories', language === 'en' ? 'en' : 'vi');
      const messages = [
        ...summaryMessage as any,
        { role: 'system', content: instruction },
        ...history,
      ];

      const userText = language === 'en'
        ? 'Please analyze the calories and macros in this meal photo.'
        : 'Hãy phân tích calories và macros trong ảnh bữa ăn này.';

      const aiReply = await chatWithNutritionAIVision(
        messages as any,
        userText,
        imageDataUrl,
        language === 'en' ? 'en' : 'vi',
        'calories'
      );
      const formatted = formatPlainTextForChat(aiReply);
      setChatMessages((prev: ChatMessage[]) => [
        ...prev,
        { type: 'user', message: language === 'en' ? 'Sent a meal photo for analysis.' : 'Đã gửi ảnh bữa ăn để phân tích.' },
        { type: 'ai', message: formatted },
      ]);
      persistUsage(Math.min(usageCount + 1, 20));
    } catch (err: any) {
      const fallback = language === 'en'
        ? 'Sorry, I could not analyze the photo. Please try again later.'
        : 'Xin lỗi, không thể phân tích ảnh. Vui lòng thử lại sau.';
      setChatMessages((prev: ChatMessage[]) => [...prev, { type: 'ai', message: fallback }]);
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowChatBubble((v) => !v)}
        className="fixed bottom-24 right-4 z-[1000] rounded-full p-0 h-16 w-16 bg-[#ffffff] text-[#d92228] shadow-lg hover:bg-[#ffd6d6] overflow-hidden"
        aria-label={language === 'en' ? 'Open AI Nutrition Assistant' : 'Mở trợ lý dinh dưỡng AI'}
      >
        <img
          src="/src/assets/mascot.svg"
          className="h-20 w-20 object-cover"
        />
      </Button>

      {showChatBubble && (
        <div className="fixed bottom-24 right-4 z-[1000] w-[22rem] max-w-[92vw]">
          <Card className="bg-card backdrop-blur-md border-border overflow-hidden relative shadow-xl">
            <div className="absolute inset-0 pointer-events-none z-0">
              <div className="absolute top-3 left-12 text-muted-foreground text-xs animate-fall" style={{ animationDelay: '0.4s', animationDuration: '3.6s' }}>❄</div>
              <div className="absolute top-1 right-14 text-muted-foreground text-xs animate-fall" style={{ animationDelay: '1s', animationDuration: '4.4s' }}>❄</div>
            </div>
            <div className="bg-[#d92228] p-3 relative z-10 flex items-center justify-between">
              <h3 className="text-primary-foreground text-sm">{t.aiNutritionAssistant}</h3>
              <div className="flex items-center gap-3">
                <span className="text-primary-foreground text-[11px]">
                  {language === 'en' ? 'Uses left: ' : 'Lượt còn lại: '} {Math.max(0, 20 - usageCount)}
                </span>
                <Button
                  onClick={() => setShowChatBubble(false)}
                  className="h-7 w-7 p-0 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            <div className="p-3 border-b border-gray-300 relative z-10 flex items-center gap-2">
              <Select value={mode} onValueChange={(v: 'advice' | 'menu' | 'calories') => setMode(v)}>
                <SelectTrigger className="w-full bg-input-background border-border text-foreground">
                  <SelectValue placeholder={language === 'en' ? 'Select mode' : 'Chọn chế độ'} />
                </SelectTrigger>
                <SelectContent className="z-[1100]">
                  <SelectItem value="advice">{modeLabel.advice}</SelectItem>
                  <SelectItem value="menu">{modeLabel.menu}</SelectItem>
                  <SelectItem value="calories">{modeLabel.calories}</SelectItem>
                </SelectContent>
              </Select>
              {mode === 'calories' && (
                <Button onClick={startCamera} className="bg-[#d92228] hover:opacity-90">
                  <Camera size={18} />
                </Button>
              )}
            </div>

            <ScrollArea className="h-64 p-3 relative z-10">
              <div className="space-y-3">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl ${
                        msg.type === 'user' ? 'bg-[#d92228] text-white' : 'bg-input-background text-foreground'
                      }`}
                    >
                      <p className="text-xs leading-relaxed whitespace-pre-line break-words">{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {showCamera && (
              <Card className="bg-card border-border m-3">
                <div className="p-3 space-y-2">
                  <video ref={videoRef} autoPlay className="w-full rounded-lg" />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="flex gap-2">
                    <Button onClick={capturePhotoAndAnalyze} className="bg-[#d92228] text-white">
                      {language === 'en' ? 'Capture' : 'Chụp ảnh'}
                    </Button>
                    <Button onClick={stopCamera} variant="secondary" className="bg-input-background text-foreground">
                      {language === 'en' ? 'Cancel' : 'Hủy'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="p-3 border-t border-gray-300 relative z-10">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.askMeAnything}
                  className="bg-input-background border-border text-foreground placeholder:text-foreground"
                />
                <Button onClick={handleSendMessage} disabled={isSending} className="bg-[#d92228] hover:opacity-90">
                  <Send size={20} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}