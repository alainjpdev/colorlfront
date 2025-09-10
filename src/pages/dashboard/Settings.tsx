import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTranslation } from 'react-i18next';

const Settings: React.FC = () => {
  const { t } = useTranslation();
  const [platformName, setPlatformName] = useState('ColorLand');
  const [contactEmail, setContactEmail] = useState('admin@email.com');
  const [language, setLanguage] = useState('es');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para guardar la configuración
    alert('Configuración guardada (dummy)');
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-text mb-6">{t('adminDashboard.settings', 'Configuración')}</h1>
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text font-medium mb-1">Nombre de la Plataforma</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={platformName}
              onChange={e => setPlatformName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-text font-medium mb-1">Email de Contacto</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-text font-medium mb-1">Idioma</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <Button type="submit" className="w-full mt-4">Guardar Cambios</Button>
        </form>
      </Card>
    </div>
  );
};

export default Settings; 