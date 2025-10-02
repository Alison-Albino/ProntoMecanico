import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { vehicleBrands, vehicleModels, formatPlate, validatePlate } from '@shared/vehicles';
import { Car, ArrowLeft } from 'lucide-react';

interface VehicleSelectionProps {
  onBack: () => void;
  onNext: (vehicleData: { brand: string; model: string; plate: string }) => void;
}

export function VehicleSelection({ onBack, onNext }: VehicleSelectionProps) {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [plate, setPlate] = useState('');
  const [errors, setErrors] = useState<{ brand?: string; model?: string; plate?: string }>({});

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSelectedModel('');
    setErrors({ ...errors, brand: undefined });
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setErrors({ ...errors, model: undefined });
  };

  const handlePlateChange = (value: string) => {
    const formatted = formatPlate(value);
    setPlate(formatted);
    if (errors.plate) {
      setErrors({ ...errors, plate: undefined });
    }
  };

  const handleSubmit = () => {
    const newErrors: { brand?: string; model?: string; plate?: string } = {};

    if (!selectedBrand) {
      newErrors.brand = 'Selecione a marca do veículo';
    }
    if (!selectedModel) {
      newErrors.model = 'Selecione o modelo do veículo';
    }
    if (!plate) {
      newErrors.plate = 'Digite a placa do veículo';
    } else if (!validatePlate(plate)) {
      newErrors.plate = 'Placa inválida. Use o formato ABC-1234 ou ABC-1D23';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext({
      brand: selectedBrand,
      model: selectedModel,
      plate: plate.toUpperCase()
    });
  };

  const availableModels = selectedBrand ? vehicleModels[selectedBrand] || [] : [];
  const brandLabel = vehicleBrands.find(b => b.value === selectedBrand)?.label || '';

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-title">Dados do Veículo</CardTitle>
          <CardDescription>
            Informe a marca, modelo e placa do seu veículo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brand">Marca do Veículo *</Label>
            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger data-testid="select-brand">
                <SelectValue placeholder="Selecione a marca" />
              </SelectTrigger>
              <SelectContent>
                {vehicleBrands.map((brand) => (
                  <SelectItem key={brand.value} value={brand.value}>
                    {brand.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.brand && (
              <p className="text-sm text-destructive" data-testid="error-brand">{errors.brand}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modelo do Veículo *</Label>
            <Select 
              value={selectedModel} 
              onValueChange={handleModelChange}
              disabled={!selectedBrand}
            >
              <SelectTrigger data-testid="select-model">
                <SelectValue placeholder={selectedBrand ? "Selecione o modelo" : "Primeiro selecione a marca"} />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {brandLabel} {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.model && (
              <p className="text-sm text-destructive" data-testid="error-model">{errors.model}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="plate">Placa do Veículo *</Label>
            <Input
              id="plate"
              type="text"
              value={plate}
              onChange={(e) => handlePlateChange(e.target.value)}
              placeholder="ABC-1234 ou ABC-1D23"
              maxLength={8}
              className="uppercase"
              data-testid="input-plate"
            />
            <p className="text-xs text-muted-foreground">
              Formato: ABC-1234 (antigo) ou ABC-1D23 (Mercosul)
            </p>
            {errors.plate && (
              <p className="text-sm text-destructive" data-testid="error-plate">{errors.plate}</p>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full"
            size="lg"
            data-testid="button-continue"
          >
            Continuar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
