import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsExiting(true);
    }, 1500);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-500 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-700">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center">
              <Wrench className="w-10 h-10 text-primary animate-in spin-in-180 duration-1000" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white tracking-tight animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
          Pronto Mecânico
        </h1>
      </div>
    </div>
  );
}
