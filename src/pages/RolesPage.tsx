import React, { useState, useEffect } from 'react';
import { usePocketBase } from '@/contexts/PocketBaseContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/components/ui/use-toast';
import { PermRolesRecord, PermRolesResponse } from '../database/pocketbase-types';

const RolesPage = () => {
  const { pb } = usePocketBase();
  const { toast } = useToast();
  const [roles, setRoles] = useState<PermRolesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentRole, setCurrentRole] = useState<PermRolesRecord | null>(null);
  const [roleName, setRoleName] = useState('');

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const result = await pb.collection('perm_roles').getFullList({
        sort: 'name',
      });
      setRoles(result);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Error",
        description: "Failed to load roles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [pb]);

  const handleOpenDialog = (mode: 'create' | 'edit', role?: PermRolesResponse) => {
    setDialogMode(mode);
    if (mode === 'edit' && role) {
      setCurrentRole(role);
      setRoleName(role.name);
    } else {
      setCurrentRole(null);
      setRoleName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveRole = async () => {
    try {
      if (!roleName.trim()) {
        toast({
          title: "Validation Error",
          description: "Role name cannot be empty",
          variant: "destructive"
        });
        return;
      }

      if (dialogMode === 'create') {
        await pb.collection('perm_roles').create({
          name: roleName
        });
        toast({
          title: "Success",
          description: "Role created successfully"
        });
      } else if (dialogMode === 'edit' && currentRole) {
        await pb.collection('perm_roles').update(currentRole.id, {
          name: roleName
        });
        toast({
          title: "Success",
          description: "Role updated successfully"
        });
      }
      
      handleCloseDialog();
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast({
        title: "Error",
        description: "Failed to save role",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this role? This will also delete all associated permissions.')) {
      try {
        // First, delete all permissions associated with this role
        const permissions = await pb.collection('perm_permissions').getFullList({
          filter: `roleId = "${id}"`
        });
        
        for (const permission of permissions) {
          await pb.collection('perm_permissions').delete(permission.id);
        }
        
        // Then delete the role
        await pb.collection('perm_roles').delete(id);
        
        toast({
          title: "Success",
          description: "Role and associated permissions deleted successfully"
        });
        
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role:', error);
        toast({
          title: "Error",
          description: "Failed to delete role",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
          <Button onClick={() => handleOpenDialog('create')} className="flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            <span>Add Role</span>
          </Button>
        </div>

        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center">Loading...</td>
                  </tr>
                ) : roles.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center">No roles found. Create your first role!</td>
                  </tr>
                ) : (
                  roles.map((role) => (
                    <tr key={role.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{role.name}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleOpenDialog('edit', role)}
                          >
                            <FiEdit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <FiTrash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {openDialog && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
              <div className="flex flex-col space-y-1.5 text-center sm:text-left">
                <h2 className="text-lg font-semibold leading-none tracking-tight">
                  {dialogMode === 'create' ? 'Create Role' : 'Edit Role'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dialogMode === 'create' ? 'Add a new role to your system' : 'Modify the existing role'}
                </p>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none">
                    Role Name
                  </label>
                  <input
                    id="name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="Enter role name"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSaveRole}>
                  {dialogMode === 'create' ? 'Create' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RolesPage;
