import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Flame, TrendingUp } from 'lucide-react';
import { Language } from '../lib/translations';
import bannerImage1 from "../assets/img1.png";
import bannerImage2 from "../assets/img3.png";
import bannerImage3 from "../assets/img2.png";

interface ProfileTabProps {
  username: string;
  language: Language;
  t: any;
}

export function ProfileTab({ username, language, t }: ProfileTabProps) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const banners = [bannerImage1, bannerImage2, bannerImage3];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const metrics = {
    weight: { value: 68.5, unit: 'kg', goal: 65 },
    bmi: { value: 22.3, status: 'Normal' },
    muscleMass: { value: 32.8, unit: '%' },
    caloriesBurned: { value: 2340, unit: 'kcal', goal: 2500 },
    streak: 12,
    points: 1580,
  };

  const goals = [
    { label: language === 'en' ? 'Lose Weight' : 'Giảm Cân', progress: 65, color: '#d92228' },
    { label: language === 'en' ? 'Build Muscle' : 'Tăng Cơ', progress: 45, color: '#d92228' },
    { label: language === 'en' ? 'Stay Fit' : 'Giữ Dáng', progress: 80, color: '#d92228' },
  ];

  return (
    <div className="space-y-4 pb-24">
      {/* User Info Card */}
      <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-2 left-4 text-white/20 text-xs animate-fall" style={{ animationDelay: '0s', animationDuration: '3s' }}>❄</div>
          <div className="absolute top-0 right-8 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>❄</div>
          <div className="absolute top-4 left-1/2 text-white/20 text-xs animate-fall" style={{ animationDelay: '1s', animationDuration: '3.5s' }}>❄</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-foreground text-2xl">{username}</h2>
              <p className="text-muted-foreground text-sm">California Member</p>
            </div>
            <div className="flex items-center gap-2 bg-[#d92228] px-4 py-2 rounded-full">
              <Flame className="text-yellow-400" size={20} />
              <span className="text-white">{metrics.streak}</span>
            </div>
          </div>
        
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-[#d92228]/40 to-[#d92228]/80 rounded-xl p-4 border border-border">
              <p className="text-white text-sm">{t.weight}</p>
              <p className="text-white text-xl">{metrics.weight.value} {metrics.weight.unit}</p>
              <p className="text-white text-xs mt-1">
                {language === 'en' ? `Goal: ${metrics.weight.goal} kg` : `Mục tiêu: ${metrics.weight.goal} kg`}
              </p>
            </div>
          
          <div className="bg-gradient-to-br from-[#d92228]/40 to-[#d92228]/80 rounded-xl p-4 border border-border">
            <p className="text-white text-sm">{t.bmi}</p>
            <p className="text-white text-xl">{metrics.bmi.value}</p>
            <p className="text-white text-xs mt-1">{metrics.bmi.status}</p>
          </div>
          
          <div className="bg-gradient-to-br from-[#d92228]/40 to-[#d92228]/80 rounded-xl p-4 border border-border">
            <p className="text-white text-sm">{t.muscleMass}</p>
            <p className="text-white text-xl">{metrics.muscleMass.value}{metrics.muscleMass.unit}</p>
            <TrendingUp className="text-white mt-1" size={16} />
          </div>
          
          <div className="bg-gradient-to-br from-[#d92228]/40 to-[#d92228]/80 rounded-xl p-4 border border-border">
            <p className="text-white text-sm">{t.caloriesBurned}</p>
            <p className="text-white text-xl">{metrics.caloriesBurned.value}</p>
            <p className="text-white text-xs mt-1">/{metrics.caloriesBurned.goal} {metrics.caloriesBurned.unit}</p>
          </div>
        </div>
        </div>
      </Card>

      {/* Goals */}
      <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-3 left-6 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.2s', animationDuration: '3.2s' }}>❄</div>
          <div className="absolute top-1 right-10 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.8s', animationDuration: '4.2s' }}>❄</div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-foreground">{t.fitnessGoal}</h3>
            <Badge className="bg-[#d92228] text-white">
              {language === 'en' ? 'This Week' : 'Tuần Này'}
            </Badge>
          </div>
        
          <div className="space-y-4">
            {goals.map((goal, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-foreground text-sm">{goal.label}</span>
                  <span className="text-muted-foreground text-sm">{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Motivational Message */}
      <Card className="bg-[#d92228] border-gray-300 p-6">
        <p className="text-white text-center">{t.proteinGoal}</p>
      </Card>

      {/* Banner Ads */}
      <div className="relative overflow-hidden rounded-2xl h-48">
        {banners.map((banner, index) => (
          <img
            key={index}
            src={banner}
            alt={`Banner ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentBanner ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentBanner ? 'bg-white w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Points & Rewards */}
      <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-2 left-8 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.3s', animationDuration: '3.8s' }}>❄</div>
          <div className="absolute top-1 right-12 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.9s', animationDuration: '4.5s' }}>❄</div>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{t.yourPoints}</p>
            <p className="text-foreground text-2xl">{metrics.points}</p>
          </div>
          <button className="bg-[#d92228] text-white px-6 py-3 rounded-xl">
            {t.redeemPoints}
          </button>
        </div>
      </Card>
    </div>
  );
}
