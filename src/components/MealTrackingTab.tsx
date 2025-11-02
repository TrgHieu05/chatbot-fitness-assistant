import { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Search, Plus, Camera, Upload, X } from 'lucide-react';
import { Language } from '../lib/translations';
import { mealsDatabase } from '../lib/mockData';

interface MealTrackingTabProps {
  language: Language;
  t: any;
}

export function MealTrackingTab({ language, t }: MealTrackingTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [addedMeals, setAddedMeals] = useState<any[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form Add Meal (không persist, chỉ lưu trong state)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealCalories, setNewMealCalories] = useState<string>('');
  const [newMealProtein, setNewMealProtein] = useState<string>('');
  const [newMealCarbs, setNewMealCarbs] = useState<string>('');
  const [newMealFats, setNewMealFats] = useState<string>('');
  const [newMealType, setNewMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');
  const [newMealImageUrl, setNewMealImageUrl] = useState<string>('');
  
  // Thêm state cho upload ảnh thật
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const filteredMeals = mealsDatabase.filter(meal =>
    meal.name[language].toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addMeal = (meal: any) => {
    setAddedMeals([...addedMeals, { ...meal, addedAt: new Date() }]);
  };

  const removeMeal = (index: number) => {
    setAddedMeals(addedMeals.filter((_, i) => i !== index));
  };

  const totalCalories = addedMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = addedMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = addedMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFats = addedMeals.reduce((sum, meal) => sum + meal.fats, 0);

  // Cập nhật hàm handleFileUpload để xử lý ảnh thật
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      
      // Tạo URL preview cho ảnh
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setUploadedImage(imageUrl);
        setNewMealImageUrl(imageUrl);
      };
      reader.readAsDataURL(file);
      
      // Không auto-fill dữ liệu từ mock; giữ nguyên các trường người dùng nhập
    }
  };

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

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Chuyển canvas thành blob và tạo URL
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setUploadedImage(imageUrl);
            setNewMealImageUrl(imageUrl);
            
            // Không auto-fill dữ liệu từ mock khi chụp ảnh
          }
        }, 'image/jpeg', 0.8);
        
        stopCamera();
      }
    }
  };

  const addCustomMeal = () => {
    const name = (newMealName || '').trim();
    if (!name) {
      alert(language === 'en' ? 'Please enter meal name' : 'Vui lòng nhập tên bữa ăn');
      return;
    }
    const calories = Number(newMealCalories) || 0;
    const protein = Number(newMealProtein) || 0;
    const carbs = Number(newMealCarbs) || 0;
    const fats = Number(newMealFats) || 0;
    const image = uploadedImage || newMealImageUrl || 'https://via.placeholder.com/64?text=Meal';

    const customMeal = {
      id: Date.now(),
      name: { en: name, vi: name },
      calories,
      protein,
      carbs,
      fats,
      image,
      type: newMealType,
    };
    addMeal(customMeal);
    
    // Reset form và đóng
    resetForm();
  };

  const resetForm = () => {
    setNewMealName('');
    setNewMealCalories('');
    setNewMealProtein('');
    setNewMealCarbs('');
    setNewMealFats('');
    setNewMealImageUrl('');
    setNewMealType('snack');
    setUploadedImage(null);
    setUploadedFile(null);
    setShowAddForm(false);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Add Meal Action */}
      <Card className="bg-card backdrop-blur-md border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground">
            {language === 'en' ? 'Add Meal' : 'Thêm Bữa Ăn'}
          </h3>
          <Button onClick={() => setShowAddForm((v) => !v)} className="bg-[#d92228] text-white">
            <Plus size={16} />
          </Button>
        </div>
        {showAddForm && (
          <div className="mt-4 space-y-4">
            {/* Image Preview Section */}
            {uploadedImage && (
              <div className="relative">
                <img 
                  src={uploadedImage} 
                  alt="Uploaded meal" 
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <Button
                  onClick={() => {
                    setUploadedImage(null);
                    setUploadedFile(null);
                    setNewMealImageUrl('');
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-8 h-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
            )}
            
            {/* Camera & Upload Buttons - Di chuyển vào đây */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={startCamera}
                className="bg-[#d92228] text-white h-12 rounded-xl"
              >
                <Camera className="mr-2" size={20} />
                <span className="whitespace-nowrap">{t.scanMeal}</span>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/10 text-foreground border border-border h-12 rounded-xl hover:bg-muted"
              >
                <Upload className="mr-2" size={20} />
                <span className="whitespace-nowrap">{t.uploadPhoto}</span>
              </Button>
            </div>
            
            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
                placeholder={language === 'en' ? 'Meal name' : 'Tên bữa ăn'}
                className="bg-input-background border-border text-foreground placeholder:text-foreground"
              />
              <Select value={newMealType} onValueChange={(v: 'breakfast' | 'lunch' | 'dinner' | 'snack') => setNewMealType(v)}>
                <SelectTrigger className="bg-input-background border-border text-foreground">
                  <SelectValue placeholder={language === 'en' ? 'Meal type' : 'Loại bữa'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{language === 'en' ? 'Breakfast' : 'Sáng'}</SelectItem>
                  <SelectItem value="lunch">{language === 'en' ? 'Lunch' : 'Trưa'}</SelectItem>
                  <SelectItem value="dinner">{language === 'en' ? 'Dinner' : 'Tối'}</SelectItem>
                  <SelectItem value="snack">{language === 'en' ? 'Snack' : 'Ăn vặt'}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={newMealCalories}
                onChange={(e) => setNewMealCalories(e.target.value)}
                placeholder={language === 'en' ? 'Calories' : 'Calories'}
                type="number"
                className="bg-input-background border-border text-foreground placeholder:text-foreground"
              />
              <Input
                value={newMealProtein}
                onChange={(e) => setNewMealProtein(e.target.value)}
                placeholder={language === 'en' ? 'Protein (g)' : 'Protein (g)'}
                type="number"
                className="bg-input-background border-border text-foreground placeholder:text-foreground"
              />
              <Input
                value={newMealCarbs}
                onChange={(e) => setNewMealCarbs(e.target.value)}
                placeholder={language === 'en' ? 'Carbs (g)' : 'Carbs (g)'}
                type="number"
                className="bg-input-background border-border text-foreground placeholder:text-foreground"
              />
              <Input
                value={newMealFats}
                onChange={(e) => setNewMealFats(e.target.value)}
                placeholder={language === 'en' ? 'Fats (g)' : 'Fats (g)'}
                type="number"
                className="bg-input-background border-border text-foreground placeholder:text-foreground"
              />
              {!uploadedImage && (
                <Input
                  value={newMealImageUrl}
                  onChange={(e) => setNewMealImageUrl(e.target.value)}
                  placeholder={language === 'en' ? 'Image URL (optional)' : 'Link ảnh (tùy chọn)'}
                  className="bg-input-background border-border text-foreground placeholder:text-foreground col-span-full"
                />
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={addCustomMeal} className="bg-[#d92228] text-white">
                {language === 'en' ? 'Add' : 'Thêm'}
              </Button>
              <Button onClick={resetForm} variant="secondary" className="bg-input-background text-foreground">
                {language === 'en' ? 'Cancel' : 'Hủy'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </Card>

      {/* Camera View */}
      {showCamera && (
        <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-3 left-8 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.3s', animationDuration: '3.5s' }}>❄</div>
            <div className="absolute top-1 right-10 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.8s', animationDuration: '4.2s' }}>❄</div>
          </div>
          <div className="relative z-10">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-video bg-black rounded-xl mb-3"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <Button
                onClick={capturePhoto}
                className="flex-1 bg-[#d92228] text-white"
              >
                {language === 'en' ? 'Capture Photo' : 'Chụp Ảnh'}
              </Button>
              <Button
                onClick={stopCamera}
                className="flex-1 bg-white/10 text-foreground border border-border hover:bg-muted"
              >
                {language === 'en' ? 'Cancel' : 'Hủy'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search Bar */}
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-gray-300 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-2 left-10 text-white/20 text-xs animate-fall" style={{ animationDelay: '0s', animationDuration: '3s' }}>❄</div>
          <div className="absolute top-0 right-14 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.6s', animationDuration: '4s' }}>❄</div>
        </div>
        <div className="relative z-10">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchMeals}
            className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMeals.map((meal) => (
            <Card key={meal.id} className="bg-white/5 backdrop-blur-md border-gray-300 overflow-hidden">
              <div className="flex gap-4 p-3">
                <img
                  src={meal.image}
                  alt={meal.name[language]}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-foreground text-sm mb-1 truncate">{meal.name[language]}</h4>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span className="whitespace-nowrap">{meal.calories} cal</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">{meal.protein}g protein</span>
                    <span>•</span>
                    <span className="whitespace-nowrap">{meal.carbs}g carbs</span>
                  </div>
                </div>
                <Button
                  onClick={() => addMeal(meal)}
                  size="sm"
                  className="bg-[#d92228] text-white h-8 px-3 shrink-0"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Added Meals */}
      {addedMeals.length > 0 && (
        <Card className="bg-[#ffffff] backdrop-blur-md border-[#dfdfdf] p-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-2 left-12 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.4s', animationDuration: '3.8s' }}>❄</div>
            <div className="absolute top-1 right-16 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.9s', animationDuration: '4.5s' }}>❄</div>
          </div>
          <h3 className="text-foreground mb-3 relative z-10">{language === 'en' ? 'Today\'s Meals' : 'Bữa Ăn Hôm Nay'}</h3>
          <div className="space-y-2 mb-4 relative z-10">
            {addedMeals.map((meal, index) => (
              <div key={index} className="flex items-center gap-3 bg-[#f5f5f5] rounded-lg p-2">
                <img
                  src={meal.image}
                  alt={meal.name[language]}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-black text-sm truncate">{meal.name[language]}</p>
                  <p className="text-black/70 text-xs">{meal.calories} cal</p>
                </div>
                <Button
                  onClick={() => removeMeal(index)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 h-8 w-8 p-0 shrink-0"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Total Summary */}
      <Card className="bg-[#d92228] border-gray-300 p-6">
        <div className="text-center mb-4">
          <p className="text-white/90 text-sm">{t.totalCalories}</p>
          <p className="text-white text-3xl">{totalCalories}</p>
          <p className="text-white/70 text-sm mt-1">
            {addedMeals.length} {language === 'en' ? 'meals tracked' : 'món đã theo dõi'}
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-300">
          <div className="text-center">
            <p className="text-white/70 text-xs">{t.protein}</p>
            <p className="text-white">{totalProtein}g</p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-xs">{t.carbs}</p>
            <p className="text-white">{totalCarbs}g</p>
          </div>
          <div className="text-center">
            <p className="text-white/70 text-xs">{t.fats}</p>
            <p className="text-white">{totalFats}g</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
