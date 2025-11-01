import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Star, MapPin, ShoppingCart, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../lib/translations';
import { restaurants, mealsDatabase } from '../lib/mockData';
import { DistrictMap } from './DistrictMap';

interface RestaurantTabProps {
  language: Language;
  t: any;
}

interface CartItem {
  restaurantId: number;
  menuItemId: number;
  mealId: number;
  price: number;
  quantity: number;
}

export function RestaurantTab({ language, t }: RestaurantTabProps) {
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  const filteredRestaurants = selectedDistrict
    ? restaurants.filter(r => r.district === selectedDistrict)
    : restaurants;

  const addToCart = (restaurantId: number, menuItem: any) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(
        item => item.restaurantId === restaurantId && item.menuItemId === menuItem.id
      );

      if (existingItem) {
        return prevCart.map(item =>
          item.restaurantId === restaurantId && item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prevCart, {
        restaurantId,
        menuItemId: menuItem.id,
        mealId: menuItem.mealId,
        price: menuItem.price,
        quantity: 1,
      }];
    });
  };

  const updateQuantity = (restaurantId: number, menuItemId: number, delta: number) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item =>
        item.restaurantId === restaurantId && item.menuItemId === menuItemId
          ? { ...item, quantity: Math.max(0, item.quantity + delta) }
          : item
      ).filter(item => item.quantity > 0);
      return updatedCart;
    });
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleOrderNow = () => {
    window.open('https://food.grab.com/vn/en/', '_blank');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header with Cart Icon */}
      <div className="flex items-center justify-between bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-gray-300 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-2 left-10 text-white/20 text-xs animate-fall" style={{ animationDelay: '0s', animationDuration: '3s' }}>❄</div>
          <div className="absolute top-0 right-20 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>❄</div>
        </div>
        <h2 className="text-foreground text-xl relative z-10">{t.healthyRestaurants}</h2>
        <button
          onClick={() => setShowCart(true)}
          className="relative z-10 bg-[#d92228] text-white p-3 rounded-xl"
        >
          <ShoppingCart size={20} />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-black text-xs w-6 h-6 rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* District Map */}
      <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-3 left-12 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.2s', animationDuration: '3.4s' }}>❄</div>
          <div className="absolute top-1 right-16 text-white/20 text-xs animate-fall" style={{ animationDelay: '0.7s', animationDuration: '4.2s' }}>❄</div>
        </div>
        <h3 className="text-foreground mb-4 relative z-10">{t.selectDistrict}</h3>
        <div className="relative z-10">
          <DistrictMap
            selectedDistrict={selectedDistrict}
            onDistrictSelect={setSelectedDistrict}
            language={language}
          />
        </div>
      </Card>

      {/* Restaurants List */}
      <div className="space-y-3">
        {filteredRestaurants.map((restaurant) => (
          <Card key={restaurant.id} className="bg-white/5 backdrop-blur-md border-gray-300 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-foreground mb-1">{restaurant.name[language]}</h3>
                  <p className="text-muted-foreground text-sm">{restaurant.type[language]}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400 fill-yellow-400" size={14} />
                      <span className="text-foreground text-sm">{restaurant.rating}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">({restaurant.reviews} {language === 'en' ? 'reviews' : 'đánh giá'})</span>
                  </div>
                </div>
                <Badge className="bg-[#d92228] text-white">
                  {t.district} {restaurant.district}
                </Badge>
              </div>

              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    onClick={() => setSelectedRestaurant(restaurant.id)}
                    className="w-full bg-[#d92228] text-white"
                  >
                    {t.viewMenu}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="bg-black border-white/20 max-h-[80vh] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="text-white">{restaurant.name[language]}</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-1 gap-3 mt-6">
                    {restaurant.menu.map((menuItem) => {
                      const meal = mealsDatabase.find(m => m.id === menuItem.mealId);
                      if (!meal) return null;

                      return (
                        <div key={menuItem.id} className="flex gap-4 bg-white/10 rounded-xl p-3 backdrop-blur-md">
                          <img
                            src={meal.image}
                            alt={meal.name[language]}
                            className="w-20 h-20 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="text-white mb-1">{meal.name[language]}</h4>
                            <div className="flex gap-2 text-xs text-white/70 mb-2">
                              <span>{meal.calories} cal</span>
                              <span>•</span>
                              <span>{meal.protein}g protein</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#d92228]">{menuItem.price.toLocaleString()}đ</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => addToCart(restaurant.id, menuItem)}
                                className="bg-[#d92228] text-white p-2 rounded-lg"
                              >
                                <Plus size={16} />
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </Card>
        ))}
      </div>

      {/* Cart Sheet */}
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="right" className="bg-black border-white/20 w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-white">{t.cart}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            {cart.length === 0 ? (
              <p className="text-white/70 text-center py-8">
                {language === 'en' ? 'Your cart is empty' : 'Giỏ hàng trống'}
              </p>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {cart.map((item, index) => {
                    const meal = mealsDatabase.find(m => m.id === item.mealId);
                    const restaurant = restaurants.find(r => r.id === item.restaurantId);
                    if (!meal || !restaurant) return null;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-3 bg-white/10 rounded-xl p-3"
                      >
                        <img
                          src={meal.image}
                          alt={meal.name[language]}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="text-white text-sm">{meal.name[language]}</h4>
                          <p className="text-white/50 text-xs">{restaurant.name[language]}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#d92228] text-sm">{item.price.toLocaleString()}đ</span>
                            <div className="flex items-center gap-2 bg-white/20 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.restaurantId, item.menuItemId, -1)}
                                className="p-1 text-white hover:bg-white/10 rounded-l-lg"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-white text-sm px-2">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.restaurantId, item.menuItemId, 1)}
                                className="p-1 text-white hover:bg-white/10 rounded-r-lg"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="border-t border-white/20 pt-4">
                  <div className="flex justify-between mb-4">
                    <span className="text-white">{language === 'en' ? 'Total' : 'Tổng Cộng'}</span>
                    <span className="text-white text-xl">{cartTotal.toLocaleString()}đ</span>
                  </div>
                  <Button
                    onClick={handleOrderNow}
                    className="w-full bg-[#d92228] text-white h-12"
                  >
                    {t.orderNow}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
