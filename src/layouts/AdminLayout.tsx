import React from 'react';
import { BaseLayout } from '../components/layout';

export const AdminLayout: React.FC = () => {
  return <BaseLayout useDynamicMenu={true} role="admin" />;
};