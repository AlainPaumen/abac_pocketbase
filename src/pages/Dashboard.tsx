import React, { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { usePocketBase } from '@/contexts/PocketBaseContext';
import { FiFolder, FiPlay, FiUsers, FiShield } from 'react-icons/fi';
import { Layout } from '@/components/Layout';

const Dashboard = () => {
  const { pb } = usePocketBase();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    resources: 0,
    actions: 0,
    roles: 0,
    permissions: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resourcesCount = await pb.collection('perm_resources').getList(1, 1, { $cancelKey: 'resources' });
        const actionsCount = await pb.collection('perm_actions').getList(1, 1, { $cancelKey: 'actions' });
        const rolesCount = await pb.collection('perm_roles').getList(1, 1, { $cancelKey: 'roles' });
        const permissionsCount = await pb.collection('perm_permissions').getList(1, 1, { $cancelKey: 'permissions' });
        
        setStats({
          resources: resourcesCount.totalItems,
          actions: actionsCount.totalItems,
          roles: rolesCount.totalItems,
          permissions: permissionsCount.totalItems
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();

    return () => {
      pb.cancelRequest('resources');
      pb.cancelRequest('actions');
      pb.cancelRequest('roles');
      pb.cancelRequest('permissions');
    };
  }, [pb]);

  const dashboardItems = [
    { 
      title: 'Resources', 
      count: stats.resources, 
      icon: <FiFolder className="h-10 w-10 text-primary" />, 
      description: 'Manage protected resources in your system',
      path: '/resources'
    },
    { 
      title: 'Actions', 
      count: stats.actions, 
      icon: <FiPlay className="h-10 w-10 text-primary" />, 
      description: 'Define actions that can be performed on resources',
      path: '/actions'
    },
    { 
      title: 'Roles', 
      count: stats.roles, 
      icon: <FiUsers className="h-10 w-10 text-primary" />, 
      description: 'Manage roles for permission assignment',
      path: '/roles'
    },
    { 
      title: 'Permissions', 
      count: stats.permissions, 
      icon: <FiShield className="h-10 w-10 text-primary" />, 
      description: 'Configure permissions for roles on resources',
      path: '/permissions'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ABAC Permission Management Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Attribute-Based Access Control system with this intuitive interface.
            Configure resources, actions, roles, and permissions to secure your application.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardItems.map((item) => (
            <div 
              key={item.title}
              className="bg-card rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate({ to: item.path })}
            >
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Total: {item.count}</p>
                  <div className="mb-4">{item.icon}</div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <p className="mb-4">To set up your ABAC system, follow these steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Define your <span className="font-semibold">Resources</span> - these are the objects you want to protect
            </li>
            <li>
              Create <span className="font-semibold">Actions</span> for each resource - operations that can be performed
            </li>
            <li>
              Set up <span className="font-semibold">Roles</span> - these will be assigned to users
            </li>
            <li>
              Configure <span className="font-semibold">Permissions</span> - determine which roles can perform which actions on which resources
            </li>
            <li>
              Test your permission setup using the <span className="font-semibold">Test Permissions</span> tool
            </li>
          </ol>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
