import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Car, ArrowLeft } from 'lucide-react';

interface VehicleSelectionProps {
  onBack: () => void;
  onNext: (vehicleData: { brand: string; model: string; plate: string; year: string }) => void;
}

export function VehicleSelection({ onBack, onNext }: VehicleSelectionProps) {
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState<{ 
    plate?: string; 
    brand?: string; 
    model?: string; 
    year?: string 
  }>({});

  const formatPlate = (value: string): string => {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
    }
  };

  const validatePlate = (plate: string): boolean => {
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, '');
    const mercosulPattern = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    const oldPattern = /^[A-Z]{3}[0-9]{4}$/;
    
    return mercosulPattern.test(cleanPlate) || oldPattern.test(cleanPlate);
  };

  const handlePlateChange = (value: string) => {
    const formatted = formatPlate(value);
    setPlate(formatted);
    if (errors.plate) {
      setErrors({ ...errors, plate: undefined });
    }
  };

  const handleSubmit = () => {
    const newErrors: { plate?: string; brand?: string; model?: string; year?: string } = {};

    if (!plate.trim()) {
      newErrors.plate = 'Digite a placa do veículo';
    } else if (!validatePlate(plate)) {
      newErrors.plate = 'Placa inválida. Use ABC-1234 ou ABC-1D23';
    }

    if (!brand.trim()) {
      newErrors.brand = 'Digite a marca do veículo';
    }

    if (!model.trim()) {
      newErrors.model = 'Digite o modelo do veículo';
    }

    if (!year.trim()) {
      newErrors.year = 'Digite o ano do veículo';
    } else if (!/^\d{4}$/.test(year)) {
      newErrors.year = 'Ano inválido. Use formato: 2020';
    } else {
      const yearNum = parseInt(year);
      const currentYear = new Date().getFullYear();
      if (yearNum < 1900 || yearNum > currentYear + 1) {
        newErrors.year = `Ano deve estar entre 1900 e ${currentYear + 1}`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({
      plate: plate.toUpperCase(),
      brand: brand.trim(),
      model: model.trim(),
      year: year.trim()
    });
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b z-10 p-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </button>
        </div>

        <div className="p-6 space-y-8 max-w-md mx-auto w-full">
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-title">
              Dados do Veículo
            </h2>
            <p className="text-muted-foreground text-lg">
              Informe os dados do veículo que precisa de assistência
            </p>
          </div>

          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-100">
            <div className="space-y-2">
              <Label htmlFor="plate" className="text-base font-medium">
                Placa *
              </Label>
              <Input
                id="plate"
                type="text"
                value={plate}
                onChange={(e) => handlePlateChange(e.target.value)}
                placeholder="ABC-1234"
                maxLength={8}
                className="text-lg h-12 uppercase rounded-2xl border-2 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                data-testid="input-plate"
              />
              {errors.plate ? (
                <p className="text-sm text-destructive font-medium" data-testid="error-plate">
                  {errors.plate}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Formato antigo (ABC-1234) ou Mercosul (ABC-1D23)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand" className="text-base font-medium">
                Marca *
              </Label>
              <Input
                id="brand"
                type="text"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  if (errors.brand) setErrors({ ...errors, brand: undefined });
                }}
                placeholder="Ex: Chevrolet, Volkswagen, Fiat..."
                className="text-lg h-12 rounded-2xl border-2 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                data-testid="input-brand"
              />
              {errors.brand && (
                <p className="text-sm text-destructive font-medium" data-testid="error-brand">
                  {errors.brand}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-base font-medium">
                Modelo *
              </Label>
              <Input
                id="model"
                type="text"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  if (errors.model) setErrors({ ...errors, model: undefined });
                }}
                placeholder="Ex: Onix, Gol, Argo..."
                className="text-lg h-12 rounded-2xl border-2 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                data-testid="input-model"
              />
              {errors.model && (
                <p className="text-sm text-destructive font-medium" data-testid="error-model">
                  {errors.model}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year" className="text-base font-medium">
                Ano *
              </Label>
              <Input
                id="year"
                type="text"
                value={year}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setYear(value);
                  if (errors.year) setErrors({ ...errors, year: undefined });
                }}
                placeholder="Ex: 2020"
                maxLength={4}
                className="text-lg h-12 rounded-2xl border-2 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10"
                data-testid="input-year"
              />
              {errors.year && (
                <p className="text-sm text-destructive font-medium" data-testid="error-year">
                  {errors.year}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          onClick={handleSubmit}
          className="w-full max-w-md mx-auto h-14 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
          data-testid="button-continue"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
