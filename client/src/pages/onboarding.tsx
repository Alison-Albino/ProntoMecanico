import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wrench, MapPin, MessageCircle, ChevronRight, ChevronLeft } from 'lucide-react';

const slides = [
  {
    icon: Wrench,
    title: 'Encontre Mecânicos Próximos',
    description: 'Conecte-se instantaneamente com mecânicos profissionais na sua região. Assistência rápida quando você mais precisa.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: MapPin,
    title: 'Rastreamento em Tempo Real',
    description: 'Acompanhe a localização do mecânico em tempo real no mapa. Saiba exatamente quando a ajuda vai chegar.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    icon: MessageCircle,
    title: 'Chat e Pagamento Seguro',
    description: 'Comunique-se diretamente com o mecânico e pague de forma segura através do app. Tudo em um só lugar.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [, setLocation] = useLocation();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleGetStarted = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setLocation('/login');
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <div className="w-full max-w-md">
        <Card className="p-8 md:p-10 space-y-8 shadow-xl">
          {/* Logo/Title */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Wrench className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Pronto Mecânico</h1>
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center">
            <div className={`${slide.bgColor} p-8 rounded-full`}>
              <Icon className={`w-24 h-24 ${slide.color}`} strokeWidth={1.5} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 min-h-[140px]">
            <h2 className="text-2xl font-bold" data-testid={`text-slide-title-${currentSlide}`}>
              {slide.title}
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed" data-testid={`text-slide-description-${currentSlide}`}>
              {slide.description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide 
                    ? 'w-8 bg-primary' 
                    : 'w-2 bg-muted-foreground/30'
                }`}
                data-testid={`dot-${index}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
                data-testid="button-previous"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}
            
            {currentSlide < slides.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1"
                data-testid="button-next"
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleGetStarted}
                className="flex-1"
                data-testid="button-get-started"
              >
                Ir para Login
              </Button>
            )}
          </div>

          {/* Skip Button */}
          {currentSlide < slides.length - 1 && (
            <button
              onClick={handleGetStarted}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-skip"
            >
              Pular introdução
            </button>
          )}
        </Card>

        {/* Desktop additional info */}
        <div className="hidden md:block mt-8 text-center text-sm text-muted-foreground">
          <p>Assistência automotiva profissional a qualquer hora, em qualquer lugar</p>
        </div>
      </div>
    </div>
  );
}
