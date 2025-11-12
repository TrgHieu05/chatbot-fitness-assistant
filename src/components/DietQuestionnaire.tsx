import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Language } from '../lib/translations';

type Regime = 'gym' | 'gym_cardio' | 'yoga_pilates' | 'running_cycling' | null;
type Diet = 'vegan' | 'vegetarian' | 'gluten_free' | 'keto' | 'normal' | null;

interface DietQuestionnaireProps {
  language: Language;
  onComplete: (data: {
    regime: Regime;
    allergies: {
      lactose: boolean;
      nut: boolean;
      seafood: boolean;
      othersText: string;
      none: boolean;
    };
    diet: Diet;
  }) => void;
}

export function DietQuestionnaire({ language, onComplete }: DietQuestionnaireProps) {
  const [regime, setRegime] = useState<Regime>(null);
  const [diet, setDiet] = useState<Diet>(null);
  const [allergies, setAllergies] = useState({
    lactose: false,
    nut: false,
    seafood: false,
    othersText: '',
    none: false,
  });

  const adviceText: Record<Exclude<Regime, null>, string> = {
    gym: 'Eat a lot of protein (chicken, fish, eggs) to build muscle, add good carbs (potatoes, brown rice) to have strength to exercise, and healthy fats (avocado, nuts).',
    gym_cardio: 'Eat enough nutrients: protein, carbs, vegetables. Eat a light meal before exercise (banana, yogurt), drink a protein smoothie after exercise for quick recovery.',
    yoga_pilates: 'Eat lightly before exercise (fruit, nuts), after exercise choose light dishes such as steamed fish, vegetables to make the body light and comfortable.',
    running_cycling: 'Before exercising, load up on carbs (bananas, oats), after exercising, remember to drink water, replenish electrolytes and eat some protein to recover.',
  };

  const regimeOptions: { key: Exclude<Regime, null>; label: string }[] = [
    { key: 'gym', label: 'Gym (weights, bodybuilding)' },
    { key: 'gym_cardio', label: 'Gym + Cardio' },
    { key: 'yoga_pilates', label: 'Yoga, Pilates' },
    { key: 'running_cycling', label: 'Running, cycling' },
  ];

  const dietOptions: { key: Exclude<Diet, null>; label: string }[] = [
    { key: 'vegan', label: 'Vegan Diet' },
    { key: 'vegetarian', label: 'Vegetarian Diet' },
    { key: 'gluten_free', label: 'Gluten-free Diet' },
    { key: 'keto', label: 'Keto Diet' },
    { key: 'normal', label: 'I eat normally' },
  ];

  const toggleAllergy = (field: 'lactose' | 'nut' | 'seafood' | 'none') => {
    setAllergies((prev) => {
      const next = { ...prev, [field]: !prev[field] } as typeof prev;
      if (field === 'none' && !prev.none) {
        // Selecting "none" clears other selections
        next.lactose = false;
        next.nut = false;
        next.seafood = false;
        next.othersText = '';
      } else if (field !== 'none' && prev.none) {
        // Any specific allergy turns off "none"
        next.none = false;
      }
      return next;
    });
  };

  const submit = () => {
    onComplete({ regime, allergies, diet });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="max-w-md mx-auto px-4 py-6 space-y-10">
        {/* Regime */}
        <div>
          <h3 className="text-foreground mb-2">Your workout regime</h3>
          <p className="text-muted-foreground text-sm mb-3">You can choose the following workout regimes:</p>

          <div className="space-y-3">
            {regimeOptions.map((opt) => {
              const active = regime === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setRegime(opt.key)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    active ? 'border-[#d92228] bg-red-50' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full border ${active ? 'bg-[#d92228] border-[#d92228]' : 'border-border'}`} />
                    <span className="text-foreground">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {regime && (
            <Card className="mt-4 bg-gradient-to-r from-[#d92228] to-black p-4 text-white rounded-2xl">
              {adviceText[regime]}
            </Card>
          )}
        </div>

        {/* Allergies */}
        <div>
          <h3 className="text-foreground mb-2">Do you have any allergies?</h3>
          <div className="space-y-3">
            {[
              { field: 'lactose', label: 'Lactose Allergy' },
              { field: 'nut', label: 'Nut Allergy' },
              { field: 'seafood', label: 'Seafood Allergy' },
            ].map((item) => (
              <label key={item.field} className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card cursor-pointer">
                <input
                  type="checkbox"
                  checked={(allergies as any)[item.field]}
                  onChange={() => toggleAllergy(item.field as any)}
                />
                <span className="text-foreground">{item.label}</span>
              </label>
            ))}

            {/* Others text input */}
            <div className="p-4 rounded-2xl border border-border bg-card">
              <label className="block text-foreground mb-2">Others</label>
              <Input
                value={allergies.othersText}
                onChange={(e) => setAllergies((prev) => ({ ...prev, othersText: e.target.value, none: false }))}
                placeholder={language === 'en' ? 'Enter other allergies' : 'Nhập dị ứng khác'}
                className="bg-input-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* None option */}
            <label className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card cursor-pointer">
              <input type="checkbox" checked={allergies.none} onChange={() => toggleAllergy('none')} />
              <span className="text-foreground">I am not allergic to anything</span>
            </label>
          </div>
        </div>

        {/* Diet */}
        <div>
          <h3 className="text-foreground mb-2">Your diet</h3>
          <div className="space-y-3">
            {dietOptions.map((opt) => {
              const active = diet === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setDiet(opt.key)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    active ? 'border-[#d92228] bg-red-50' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full border ${active ? 'bg-[#d92228] border-[#d92228]' : 'border-border'}`} />
                    <span className="text-foreground">{opt.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Button
            onClick={submit}
            className="w-full bg-[#d92228] hover:bg-[#b91c21] text-white h-12 rounded-xl"
          >
            Save and Continue
          </Button>
        </div>
      </div>
    </div>
  );
}