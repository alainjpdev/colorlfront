import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, Factory, Globe, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useDarkMode } from '../hooks/useDarkMode';
import { Moon, Sun } from 'lucide-react';
import logo from '../assets/logo.webp';
import azul from '../assets/azul.webp';
import verde from '../assets/verde.webp';
import morada from '../assets/morada.webp';

export const Landing: React.FC = () => {
  const features = [
    {
      icon: Palette,
      title: 'Pinturas de Alta Calidad',
      description: 'Fabricamos pinturas premium con los mejores materiales y tecnología avanzada'
    },
    {
      icon: Factory,
      title: 'Producción Industrial',
      description: 'Contamos con maquinaria moderna y procesos automatizados para máxima eficiencia'
    },
    {
      icon: Globe,
      title: 'Distribución Global',
      description: 'Llegamos a clientes en todo el mundo con productos certificados'
    }
  ];

  const benefits = [
    'Tecnología de fabricación probada internacionalmente',
    'Equipo técnico certificado y especializado',
    'Infraestructura industrial completa',
    'Productos de calidad premium',
    'Atención al cliente 24/7',
    'Distribución global de productos'
  ];

  const [dark, setDark] = useDarkMode();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src={logo} alt="ColorLand Logo" className="h-20 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login"
                className="text-text-secondary hover:text-text transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link to="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-text mb-6">
              Nuestros productos destacados
              <span className="text-primary block"></span>
            </h1>
            <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
              
            </p>
            
            {/* Productos destacados - Imágenes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 lg:gap-12 mb-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="p-4">
                  <img src={azul} alt="Pintura Azul" className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg shadow-lg" />
                </div>
              </div>
              <div className="text-center">
                <div className="p-4">
                  <img src={verde} alt="Pintura Verde" className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg shadow-lg" />
                </div>
              </div>
              <div className="text-center">
                <div className="p-4">
                  <img src={morada} alt="Pintura Morada" className="w-full h-48 sm:h-64 lg:h-80 object-cover rounded-lg shadow-lg" />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" className="flex items-center">
                  Comenzar Ahora
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Ver Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text mb-4">
              ¿Por qué elegir ColorLand?
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              Ofrecemos la mejor experiencia en pinturas de alta calidad con tecnología avanzada y servicio personalizado.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow bg-white">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text mb-2">{feature.title}</h3>
                <p className="text-text-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-text mb-6">
                Una fábrica completa para tus proyectos
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                Accede a todo lo que necesitas para tus proyectos de pintura con productos de la más alta calidad y tecnología avanzada de fabricación.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-success mr-3 flex-shrink-0" />
                    <span className="text-text-secondary">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-lg shadow-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-text mb-4">Comienza tu viaje hoy</h3>
              <p className="text-text-secondary mb-6">
                Regístrate ahora y obtén acceso a nuestros productos de pintura de alta calidad.
              </p>
              <Link to="/register">
                <Button size="lg" className="w-full">
                  Registrarse Gratis
                </Button>
              </Link>
              <p className="text-sm text-text-secondary mt-4 text-center">
                Sin compromisos
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-text py-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={logo} alt="ColorLand Logo" className="h-6 w-auto" />
              </div>
              <p className="text-text-secondary">
                Fábrica líder en la producción de pinturas de alta calidad para el mercado nacional e internacional.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Productos</h3>
              <ul className="space-y-2 text-text-secondary">
                <li>Pinturas Acrílicas</li>
                <li>Pinturas Epóxicas</li>
                <li>Pinturas Industriales</li>
                <li>Pinturas Decorativas</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2 text-text-secondary">
                <li>Sobre Nosotros</li>
                <li>Procesos de Fabricación</li>
                <li>Certificaciones</li>
                <li>Contacto</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Servicios</h3>
              <ul className="space-y-2 text-text-secondary">
                <li>Asesoría Técnica</li>
                <li>Distribución</li>
                <li>Garantía de Calidad</li>
                <li>Catálogo de Productos</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-text-secondary">
            <p>&copy; 2024 ColorLand. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};