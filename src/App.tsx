import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProfileTab } from './components/ProfileTab';
import { CalendarTab } from './components/CalendarTab';
import { MealTrackingTab } from './components/MealTrackingTab';
import { RestaurantTab } from './components/RestaurantTab';
import { CommunityTab } from './components/CommunityTab';
import { SnowEffect } from './components/SnowEffect';
import { Button } from './components/ui/button';
import { User, Calendar, UtensilsCrossed, Store, Users, LogOut } from 'lucide-react';
import { translations, Language } from './lib/translations';
import christmasBanner from './assets/banner.png';
import { ChatBubble } from './components/ChatBubble';
import { DietQuestionnaire } from './components/DietQuestionnaire';
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<'profile' | 'calendar' | 'meal' | 'restaurant' | 'community'>('profile');
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const t = translations[language];

  const handleLogin = (name: string) => {
    setUsername(name);
    setIsLoggedIn(true);
    setShowQuestionnaire(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
    setActiveTab('profile');
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (showQuestionnaire) {
    return (
      <DietQuestionnaire
        language={language}
        onComplete={() => {
          setShowQuestionnaire(false);
        }}
        onChangeLanguage={setLanguage}
      />
    );
  }

  const tabs = [
    { id: 'profile', icon: User, label: t.profile },
    { id: 'calendar', icon: Calendar, label: t.calendar },
    { id: 'meal', icon: UtensilsCrossed, label: t.mealTracking },
    { id: 'restaurant', icon: Store, label: t.restaurant },
    { id: 'community', icon: Users, label: t.community },
  ] as const;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Snow Effect on Navigation */}
      <SnowEffect />

      {/* Top Banner with Christmas Image */}
      <div className="sticky top-0 z-40 border-b border-border bg-card overflow-visible">
        <div className="max-w-md mx-auto">
          <div className="relative">
            <img 
              src={christmasBanner} 
              alt="Merry Christmas" 
              className="w-full h-24 object-cover"
            />
            <div className="absolute top-4 right-4">
              <LanguageSwitcher language={language} onChange={setLanguage} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        {activeTab === 'profile' && (
          <ProfileTab username={username} language={language} t={t} />
        )}
        {activeTab === 'calendar' && (
          <CalendarTab language={language} t={t} />
        )}
        {activeTab === 'meal' && (
          <MealTrackingTab language={language} t={t} />
        )}
        {activeTab === 'restaurant' && (
          <RestaurantTab language={language} t={t} />
        )}
        {activeTab === 'community' && (
          <CommunityTab language={language} t={t} username={username} />
        )}
      </div>

      {/* Global Chat Bubble visible across all tabs */}
      <ChatBubble language={language} t={t} />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-md mx-auto px-4 pb-4">
          <div className="bg-card backdrop-blur-md rounded-3xl border border-border shadow-lg">
            <div className="flex items-center justify-around p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-[#d92228]'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Icon
                      size={20}
                      className={isActive ? 'text-primary-foreground' : 'text-foreground'}
                    />
                    <span
                      className={`text-xs ${
                        isActive ? 'text-primary-foreground' : 'text-foreground'
                      } whitespace-nowrap`}
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="fixed top-20 right-4 z-50">
        <Button
          onClick={handleLogout}
          size="sm"
          className="bg-card backdrop-blur-md border border-border text-foreground hover:bg-accent rounded-full"
        >
          <LogOut size={16} className="mr-2" />
          {t.logout}
        </Button>
      </div>
    </div>
  );
}
