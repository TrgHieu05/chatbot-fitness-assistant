import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { SnowEffect } from './SnowEffect';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== '123') {
      setError('Incorrect password');
      return;
    }
    onLogin(username || 'Guest');
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#d92228] to-black flex items-center justify-center relative overflow-hidden">
      <SnowEffect />
      <div className="absolute w-48 h-48 left-[823px] top-[409px] absolute bg-[#D9D9D9] rounded-full blur-[128px]" />
      <div className="absolute w-48 h-48 left-[71px] top-[104px] absolute bg-[#D9D9D9] rounded-full blur-[128px]" />
      
      <div className="w-full max-w-md mx-4 z-10">
        <div className="bg-card backdrop-blur-md rounded-3xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-red-600 mb-2">CALIFORNIA</h1>
            <h2 className="text-foreground">FITNESS AND YOGA</h2>
            <h3 className="text-foreground mt-2">CENTER</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-foreground mb-2 text-sm">Username (Optional)</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input-background border-border text-foreground placeholder:text-foreground"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-foreground mb-2 text-sm">Password *</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="bg-input-background border-border text-foreground placeholder:text-foreground"
                placeholder="Enter password"
                required
              />
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>

            <Button
              type="submit"
              className="w-full bg-[#d92228] hover:bg-[#b91c21] text-white h-12 rounded-xl"
            >
              JOIN NOW
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
