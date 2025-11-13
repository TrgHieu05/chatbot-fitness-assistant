import { useRef, useState } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Send, Camera } from 'lucide-react';
import { Language } from '../lib/translations';
import { weeklyMealPlan, mealsDatabase } from '../lib/mockData';
import cheatdayBanner from '../assets/cheatday_banner.png';
import { chatWithNutritionAI, chatWithNutritionAIVision, getModeInstruction } from '../lib/aiClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from './ui/alert-dialog';

interface CalendarTabProps {
  language: Language;
  t: any;
}

// Kiểu cho tin nhắn chat để tránh 'implicit any'
type ChatMessage = {
  type: 'ai' | 'user';
  message: string;
};

export function CalendarTab({ language, t }: CalendarTabProps) {
  // Index ngày hôm nay trong tuần (bắt đầu từ Thứ Hai = 0)
  const todayIndex = ((new Date().getDay() + 6) % 7);
  const [selectedDay, setSelectedDay] = useState<number>(() => todayIndex);
  // Danh sách các ngày được bật Cheat Day (mỗi ngày độc lập)
  const [cheatDays, setCheatDays] = useState<number[]>([]);
  const [cheatLimitOpen, setCheatLimitOpen] = useState(false);

  // Toggle trạng thái Cheat Day cho một ngày bất kỳ
  const toggleCheatDay = (dayIndex: number) => {
    setCheatDays((prev) => {
      if (prev.includes(dayIndex)) {
        return prev.filter((i) => i !== dayIndex);
      }
      if (prev.length >= 3) {
        setCheatLimitOpen(true);
        return prev;
      }
      return [...prev, dayIndex];
    });
  };
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      message: language == 'en' 
        ? 'Hello! I can help you with meal suggestions and nutrition questions. What would you like to know?' 
        : 'Xin chào! Tôi có thể giúp bạn về gợi ý bữa ăn và câu hỏi dinh dưỡng. Bạn muốn biết gì?'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mode, setMode] = useState<'advice' | 'menu' | 'calories'>('advice');
  const [usageCount, setUsageCount] = useState<number>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('calendar_ai_usage') : null;
      return raw ? parseInt(raw) || 0 : 0;
    } catch {
      return 0;
    }
  });
  const [summaryText, setSummaryText] = useState<string>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('calendar_ai_summary') : null;
      return raw || '';
    } catch {
      return '';
    }
  });

  // Bong bóng chat đã chuyển thành component global (ChatBubble)

  // Helper lưu/persist số lượt và tóm tắt
  const persistUsage = (next: number) => {
    setUsageCount(next);
    try { if (typeof window !== 'undefined') localStorage.setItem('calendar_ai_usage', String(next)); } catch {}
  };
  const persistSummary = (text: string) => {
    setSummaryText(text);
    try { if (typeof window !== 'undefined') localStorage.setItem('calendar_ai_summary', text); } catch {}
  };

  // Định dạng văn bản để dễ đọc: chèn xuống dòng theo từ khóa/ngày và chia câu
  const formatPlainTextForChat = (text: string): string => {
    let s = (text || '').trim();
    // Chèn xuống dòng trước các mục ngày và bữa ăn (EN/VI)
    s = s
      .replace(/\s*(Day\s*\d+:)/g, '\n$1\n')
      .replace(/\s*(Breakfast:|Lunch:|Dinner:|Snack:)/g, '\n$1 ')
      .replace(/\s*(Ngày\s*\d+:)/g, '\n$1\n')
      .replace(/\s*(Sáng:|Trưa:|Tối:|Ăn vặt:)/g, '\n$1 ');

    // Nếu hầu như không có xuống dòng, tách theo câu và chèn \n sau mỗi 2 câu
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

    // Giới hạn khoảng trắng thừa
    s = s.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n');
    return s;
  };

  // Camera states & refs cho chế độ phân tích calories
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
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

    // Gửi ảnh đến AI cho chế độ phân tích calories
    await sendCalorieAnalysisWithImage(dataUrl);
  };

  const modeLabel = {
    advice: language === 'en' ? 'Nutrition and fitness advice' : 'Lời khuyên dinh dưỡng và thể chất',
    menu: language === 'en' ? 'Menu building' : 'Xây dựng thực đơn',
    calories: language === 'en' ? 'Calorie analysis' : 'Phân tích calories',
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    // Giới hạn 20 lần cho mỗi phiên
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
      // Nếu có tóm tắt, ghép vào đầu như system message phụ
      const summaryMessage = summaryText
        ? [{ role: 'system', content: language === 'en' ? `Conversation summary: ${summaryText}` : `Tóm tắt hội thoại: ${summaryText}` }]
        : [];

      // Khi lịch sử dài, tạo tóm tắt (đếm lượt vào giới hạn 20)
      if (history.length >= 8 && usageCount < 20) {
        const newSummary = await chatWithNutritionAI(
          [
            { role: 'system', content: language === 'en' ? 'Summarize the following conversation in one short paragraph.' : 'Tóm tắt cuộc hội thoại sau thành một đoạn ngắn.' },
            ...history as { role: 'user' | 'assistant' | 'system'; content: string }[]
          ],
          language === 'en' ? 'en' : 'vi'
        );
        persistSummary(newSummary);
        persistUsage(usageCount + 1);
      }

      const messages = [
        ...summaryMessage as any,
        // Thêm hướng dẫn theo chế độ để định hình câu trả lời
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
    // Giới hạn 20
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
      // Gửi tin nhắn xác nhận đã gửi ảnh
      setChatMessages((prev: ChatMessage[]) => [
        ...prev,
        { type: 'user', message: language === 'en' ? 'Sent a meal photo for analysis.' : 'Đã gửi ảnh bữa ăn để phân tích.' },
        { type: 'ai', message: formatted }
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

  const getMealData = (mealId: number) => {
    return mealsDatabase.find(m => m.id === mealId);
  };

  const dayData = currentWeekPlan[selectedDay];
  const totalDayCalories = dayData.meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalDayProtein = dayData.meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalDayCarbs = dayData.meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalDayFats = dayData.meals.reduce((sum, meal) => sum + meal.fats, 0);

  return (
    <div className="space-y-4 pb-24">
      {/* Popup giới hạn Cheat Day */}
      <AlertDialog open={cheatLimitOpen} onOpenChange={setCheatLimitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Cheat Day Limit' : 'Giới hạn Cheat Day'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en'
                ? 'You can only set up to 3 cheat days per week.'
                : 'Bạn chỉ có thể đặt tối đa 3 ngày Cheat Day mỗi tuần.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-[#c81b21] text-white font-bold" onClick={() => setCheatLimitOpen(false)}>
              {language === 'en' ? 'OK' : 'Đã hiểu'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Week Calendar */}
      <div className="bg-card backdrop-blur-md rounded-2xl p-4 border border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-2 left-10 text-muted-foreground text-xs animate-fall" style={{ animationDelay: '0s', animationDuration: '3s' }}>❄</div>
          <div className="absolute top-0 right-16 text-muted-foreground text-xs animate-fall" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>❄</div>
          <div className="absolute top-4 left-1/3 text-muted-foreground text-xs animate-fall" style={{ animationDelay: '1s', animationDuration: '3.5s' }}>❄</div>
        </div>
        <h3 className="text-foreground mb-4 relative z-10">{t.weeklyCalendar}</h3>
        {/* Một hàng: mỗi item bọc ô ngày + pill Cheat Day tương ứng */}
        <div className="flex gap-2 overflow-x-auto pb-1 relative z-10">
          {currentWeekPlan.map((day, index) => (
            <div key={index} className="flex-shrink-0 w-28 flex flex-col items-stretch">
              <button
                onClick={() => setSelectedDay(index)}
                className={`w-full px-4 py-3 rounded-xl transition-all ${
                  selectedDay === index
                    ? 'bg-[#d92228] text-white font-bold'
                    : 'bg-card text-foreground border border-border'
                }`}
              >
                <div className="text-xs">{day.day[language]}</div>
                <div className="text-sm mt-1">{day.date}</div>
              </button>

              <button
                onClick={() => toggleCheatDay(index)}
                className={`mt-2 w-full px-4 py-1 rounded-full text-xs transition-all ${
                  cheatDays.includes(index)
                    ? 'bg-yellow-400 text-black'
                    : 'bg-card text-foreground border border-border'
                }`}
              >
                {language === 'en' ? 'Cheat Day' : 'Cheat Day'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Cheat Day hiển thị ngay dưới Weekly Meal Plan khi ngày hiện tại bật */}
      {cheatDays.includes(selectedDay) && (
        <div className="rounded-2xl overflow-hidden border border-border">
          <img
            src={cheatdayBanner}
            alt={language === 'en' ? 'Cheat Day' : 'Cheat Day'}
            className="w-full object-cover"
          />
        </div>
      )}

      {/* Daily Summary - ẩn khi ngày hiện tại là Cheat Day */}
      {!cheatDays.includes(selectedDay) && (
        <Card className="bg-card backdrop-blur-md border-border p-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-1 left-8 text-muted-foreground text-xs animate-fall" style={{ animationDelay: '0.2s', animationDuration: '3.2s' }}>❄</div>
            <div className="absolute top-2 right-10 text-muted-foreground text-xs animate-fall" style={{ animationDelay: '0.7s', animationDuration: '4.2s' }}>❄</div>
          </div>
          <div className="grid grid-cols-4 gap-2 relative z-10">
            <div className="text-center">
              <p className="text-foreground text-xs">{t.calories}</p>
              <p className="text-foreground">{totalDayCalories}</p>
            </div>
            <div className="text-center">
              <p className="text-foreground text-xs">{t.protein}</p>
              <p className="text-foreground">{totalDayProtein}g</p>
            </div>
            <div className="text-center">
              <p className="text-foreground text-xs">{t.carbs}</p>
              <p className="text-foreground">{totalDayCarbs}g</p>
            </div>
            <div className="text-center">
              <p className="text-foreground text-xs">{t.fats}</p>
              <p className="text-foreground">{totalDayFats}g</p>
            </div>
          </div>
        </Card>
      )}

      {/* Meals for Selected Day - ẩn khi Cheat Day */}
      {!cheatDays.includes(selectedDay) && (
        <div className="space-y-3">
          {dayData.meals.map((meal, index) => {
            const mealData = getMealData(meal.mealId);
            if (!mealData) return null;

            const mealTypes = {
              breakfast: t.breakfast,
              lunch: t.lunch,
              dinner: t.dinner,
              snack: t.snack,
            };

            return (
              <Card key={index} className="bg-card backdrop-blur-md border-border overflow-hidden">
                <div className="flex gap-4 p-4">
                  <img
                    src={mealData.image}
                    alt={mealData.name[language]}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge className="bg-gradient-to-r from-[#d92228] to-[#b91c21] text-white mb-1">
                          {mealTypes[meal.type as keyof typeof mealTypes]}
                        </Badge>
                        <h4 className="text-foreground text-sm">{mealData.name[language]}</h4>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs text-foreground">
                      <span>{meal.calories} {t.calories.toLowerCase()}</span>
                      <span>{meal.protein}g {t.protein.toLowerCase()}</span>
                      <span>{meal.carbs}g {t.carbs.toLowerCase()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}


      {/* Bong bóng chat đã được chuyển thành component global trong App.tsx */}
    </div>
  );
}
  // Tạo lịch tuần động dựa trên tuần hiện tại (Thứ Hai → Chủ Nhật)
  const buildCurrentWeekPlan = () => {
    const now = new Date();
    const jsDay = now.getDay(); // 0=Sun..6=Sat
    const offsetToMonday = (jsDay + 6) % 7; // số ngày lùi về thứ Hai
    const monday = new Date(now);
    monday.setDate(now.getDate() - offsetToMonday);

    const dayNames = [
      { en: 'Monday', vi: 'Thứ Hai' },
      { en: 'Tuesday', vi: 'Thứ Ba' },
      { en: 'Wednesday', vi: 'Thứ Tư' },
      { en: 'Thursday', vi: 'Thứ Năm' },
      { en: 'Friday', vi: 'Thứ Sáu' },
      { en: 'Saturday', vi: 'Thứ Bảy' },
      { en: 'Sunday', vi: 'Chủ Nhật' },
    ];

    const plan = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const dateStr = `${monthShort} ${d.getDate()}`;
      return {
        date: dateStr,
        day: dayNames[i],
        meals: weeklyMealPlan[i]?.meals || [],
      };
    });
    return plan;
  };

  const currentWeekPlan = buildCurrentWeekPlan();
