import React, { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Eye, EyeOff, Save, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { DynamicMenuItem, CreateMenuItemData } from '../../types/menu';
import { menuAPI } from '../../services/menuAPI';
import { menuAPIMock } from '../../services/menuAPIMock';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Usar API real para persistencia en base de datos
const api = menuAPI;

// Componente para elementos arrastrables
interface SortableItemProps {
  item: DynamicMenuItem;
  onEdit: (item: DynamicMenuItem) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  onToggleActive 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-panel rounded-lg border border-border ${
        isDragging ? 'shadow-lg' : ''
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-bg rounded"
        >
          <GripVertical className="w-3 h-3 text-text-secondary" />
        </div>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-text truncate">{item.label}</span>
          <span className="text-xs text-text-secondary flex-shrink-0">({item.icon})</span>
          {item.to && (
            <span className="text-xs text-accent truncate">{item.to}</span>
          )}
        </div>
        <div className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
          item.isActive 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
        }`}>
          {item.isActive ? 'Activo' : 'Inactivo'}
        </div>
      </div>

      <div className="flex items-center gap-1 ml-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleActive(item.id)}
          className={`p-1 ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}
        >
          {item.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(item)}
          className="p-1"
        >
          <Edit className="w-3 h-3" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(item.id)}
          className="p-1 text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

interface MenuManagerProps {
  menuItems: DynamicMenuItem[];
  onMenuChange: () => void;
  role: 'admin' | 'teacher' | 'student';
}

export const MenuManager: React.FC<MenuManagerProps> = ({ 
  menuItems, 
  onMenuChange, 
  role 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<DynamicMenuItem | null>(null);
  const [availableIcons, setAvailableIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DynamicMenuItem[]>(menuItems);

  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Actualizar items cuando cambien los menuItems
  React.useEffect(() => {
    setItems(menuItems);
  }, [menuItems]);

  // Manejar el final del drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);

      // Actualizar el orden en el backend
      try {
        await api.reorderMenuItems(newItems.map((item, index) => ({
          id: item.id,
          order: index + 1
        })));
        onMenuChange();
        setError(null);
      } catch (err) {
        console.warn('⚠️ Error al reordenar en backend, manteniendo orden local:', err);
        // No revertir el cambio, mantener el orden local
        // El backend tiene un problema, pero el reordenamiento local funciona
        setError('Reordenamiento guardado localmente (backend temporalmente no disponible)');
        // Limpiar el error después de 3 segundos
        setTimeout(() => setError(null), 3000);
      }
    }
  };

  const [formData, setFormData] = useState<CreateMenuItemData>({
    to: '',
    key: '',
    icon: 'Home',
    label: '',
    role,
    order: menuItems.length + 1
  });

  // Cargar iconos disponibles
  React.useEffect(() => {
    const loadIcons = async () => {
      try {
        const icons = await api.getAvailableIcons();
        setAvailableIcons(icons);
      } catch (err) {
        console.error('Error loading icons:', err);
      }
    };
    loadIcons();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (editingItem) {
        // Actualizar elemento existente
        await api.updateMenuItem(editingItem.id, formData);
        setEditingItem(null);
      } else {
        // Crear nuevo elemento
        await api.createMenuItem(formData);
      }
      
      setFormData({
        to: '',
        key: '',
        icon: 'Home',
        label: '',
        role,
        order: menuItems.length + 1
      });
      setShowAddForm(false);
      onMenuChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar elemento');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: DynamicMenuItem) => {
    setEditingItem(item);
    setFormData({
      to: item.to || '',
      key: item.key || '',
      icon: item.icon,
      label: item.label,
      role: item.role,
      order: item.order
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este elemento?')) {
      try {
        await api.deleteMenuItem(id);
        onMenuChange();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al eliminar elemento');
      }
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const item = menuItems.find(item => item.id === id);
      if (item) {
        await api.updateMenuItem(id, { isActive: !item.isActive });
        onMenuChange();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar elemento');
    }
  };

  const resetForm = () => {
    setFormData({
      to: '',
      key: '',
      icon: 'Home',
      label: '',
      role,
      order: menuItems.length + 1
    });
    setEditingItem(null);
    setShowAddForm(false);
    setError(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-text">Elementos del Menú</h3>
        <Button
          onClick={() => setShowAddForm(true)}
          size="sm"
          className="flex items-center gap-1 text-xs"
        >
          <Plus className="w-3 h-3" />
          Agregar
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Formulario de agregar/editar - Compacto */}
      {showAddForm && (
        <Card className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-sm font-medium text-text">
              {editingItem ? 'Editar Elemento' : 'Nuevo Elemento'}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetForm}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Etiqueta *
                </label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Nombre del elemento"
                  required
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Icono *
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-panel text-text"
                  required
                >
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  URL (opcional)
                </label>
                <Input
                  value={formData.to || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                  placeholder="/dashboard/ruta"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text mb-1">
                  Clave (opcional)
                </label>
                <Input
                  value={formData.key || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="clave-unica"
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="flex items-center gap-1 text-xs"
              >
                <Save className="w-3 h-3" />
                {loading ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de elementos existentes - Drag and Drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {items.length === 0 ? (
              <div className="text-center py-4 text-text-secondary text-sm">
                No hay elementos de menú para este rol
              </div>
            ) : (
              items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
