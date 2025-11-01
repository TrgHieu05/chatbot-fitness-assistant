import { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Trophy, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { Language } from '../lib/translations';
import { communityPosts } from '../lib/mockData';

interface CommunityTabProps {
  language: Language;
  t: any;
  username: string;
}

export function CommunityTab({ language, t, username }: CommunityTabProps) {
  const [posts, setPosts] = useState(communityPosts);
  const [newPostText, setNewPostText] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const leaderboard = [
    { name: 'Alex Chen', points: 2450, rank: 1 },
    { name: 'Maria Santos', points: 2180, rank: 2 },
    { name: username, points: 1580, rank: 3 },
    { name: 'David Kim', points: 1420, rank: 4 },
    { name: 'Lisa Tran', points: 1350, rank: 5 },
  ];

  const handleLike = (postId: number) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!newPostText.trim() && !newPostImage) return;

    const newPost = {
      id: posts.length + 1,
      username: username,
      avatar: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
      time: 'Just now',
      content: {
        en: newPostText,
        vi: newPostText,
      },
      image: newPostImage,
      likes: 0,
      comments: 0,
    };

    setPosts([newPost, ...posts]);
    setNewPostText('');
    setNewPostImage(null);
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Monthly Challenge */}
      <Card className="bg-[#d92228] border-gray-300 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-400" size={24} />
            <div>
              <h3 className="text-white">{t.monthlyChallenge}</h3>
              <p className="text-white/70 text-sm">
                {language === 'en' ? 'Drink 2L water for 7 days' : 'Uống 2L nước trong 7 ngày'}
              </p>
            </div>
          </div>
          <div className="text-center">
            <div className="text-white text-2xl">5/7</div>
            <div className="text-white/70 text-xs">{t.days}</div>
          </div>
        </div>
      </Card>

      {/* Streak & Points */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-1 left-6 text-muted-foreground/30 text-xs animate-fall" style={{ animationDelay: '0s', animationDuration: '3s' }}>❄</div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-[#d92228] p-3 rounded-xl">
              <Flame className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{t.yourStreak}</p>
              <p className="text-foreground text-2xl">12 {t.days}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-4 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-2 right-8 text-muted-foreground/30 text-xs animate-fall" style={{ animationDelay: '0.5s', animationDuration: '4s' }}>❄</div>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="bg-[#d92228] p-3 rounded-xl">
              <Trophy className="text-yellow-400" size={24} />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">{t.yourPoints}</p>
              <p className="text-foreground text-2xl">1580</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-3 left-10 text-muted-foreground/30 text-xs animate-fall" style={{ animationDelay: '0.2s', animationDuration: '3.5s' }}>❄</div>
          <div className="absolute top-1 right-14 text-muted-foreground/30 text-xs animate-fall" style={{ animationDelay: '0.7s', animationDuration: '4.2s' }}>❄</div>
        </div>
        <h3 className="text-foreground mb-4 relative z-10">{t.leaderboard}</h3>
        <div className="space-y-2 relative z-10">
          {leaderboard.map((user) => (
            <div
              key={user.rank}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                user.name === username
                  ? 'bg-[#d92228] text-white'
                  : 'bg-white/10 text-foreground'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span>{user.rank}</span>
              </div>
              <div className="flex-1">
                <p>{user.name}</p>
                <p className="text-muted-foreground text-xs">{user.points} {language === 'en' ? 'points' : 'điểm'}</p>
              </div>
              {user.rank === 1 && <Trophy className="text-yellow-400" size={20} />}
            </div>
          ))}
        </div>
      </Card>

      {/* Create Post */}
      <Card className="bg-white/5 backdrop-blur-md border-gray-300 p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-2 left-12 text-muted-foreground/30 text-xs animate-fall" style={{ animationDelay: '0.3s', animationDuration: '3.8s' }}>❄</div>
          <div className="absolute top-1 right-16 text-muted-foreground/30 text-xs animate-fall" style={{ animationDelay: '0.8s', animationDuration: '4.4s' }}>❄</div>
        </div>
        <div className="flex gap-3 mb-3 relative z-10">
          <img
            src={`https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`}
            alt={username}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1">
            <Textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder={t.whatOnYourMind}
              className="bg-white/20 border-border text-foreground placeholder:text-muted-foreground min-h-20 resize-none"
            />
            {newPostImage && (
              <div className="relative mt-2">
                <img
                  src={newPostImage}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  onClick={() => setNewPostImage(null)}
                  className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center relative z-10">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ImageIcon size={20} />
            <span className="text-sm">{t.addImage}</span>
          </button>
          <Button
            onClick={handlePost}
            disabled={!newPostText.trim() && !newPostImage}
            className="bg-[#d92228] text-white"
          >
            {t.post}
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </Card>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/5 backdrop-blur-md border-gray-300 overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={post.avatar}
                    alt={post.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <h4 className="text-foreground">{post.username}</h4>
                    <p className="text-muted-foreground text-xs">{post.time}</p>
                  </div>
                </div>

                <p className="text-foreground mb-3">{post.content[language]}</p>

                {post.image && (
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full rounded-lg mb-3"
                  />
                )}

                <div className="flex items-center gap-6 pt-3 border-t border-gray-300">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-[#d92228] transition-colors"
                  >
                    <Heart size={20} />
                    <span className="text-sm">{post.likes}</span>
                  </motion.button>

                  <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle size={20} />
                    <span className="text-sm">{post.comments}</span>
                  </button>

                  <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                    <Share2 size={20} />
                    <span className="text-sm">{t.share}</span>
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
