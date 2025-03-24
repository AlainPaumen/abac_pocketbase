import React, { useState, useEffect } from 'react';
import { usePocketBase } from '@/contexts/PocketBaseContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useToast } from '@/components/ui/use-toast';
import { PermResourcesRecord, PermResourcesResponse } from '../database/pocketbase-types';

const ResourcesPage = () => {
  const { pb } = usePocketBase();
  const { toast } = useToast();
  const [resources, setResources] = useState<PermResourcesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentResource, setCurrentResource] = useState<PermResourcesRecord | null>(null);
  const [resourceName, setResourceName] = useState('');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const result = await pb.collection('perm_resources').getFullList({
        sort: 'name',
      });
      setResources(result);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [pb]);

  const handleOpenDialog = (mode: 'create' | 'edit', resource?: PermResourcesResponse) => {
    setDialogMode(mode);
    if (mode === 'edit' && resource) {
      setCurrentResource(resource);
      setResourceName(resource.name);
    } else {
      setCurrentResource(null);
      setResourceName('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveResource = async () => {
    try {
      if (!resourceName.trim()) {
        toast({
          title: "Validation Error",
          description: "Resource name cannot be empty",
          variant: "destructive"
        });
        return;
      }

      if (dialogMode === 'create') {
        await pb.collection('perm_resources').create({
          name: resourceName
        });
        toast({
          title: "Success",
          description: "Resource created successfully"
        });
      } else if (dialogMode === 'edit' && currentResource) {
        await pb.collection('perm_resources').update(currentResource.id, {
          name: resourceName
        });
        toast({
          title: "Success",
          description: "Resource updated successfully"
        });
      }
      
      handleCloseDialog();
      fetchResources();
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: "Failed to save resource",
        variant: "destructive"
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this resource? This will also delete all associated actions and permissions.')) {
      try {
        // First, delete all actions associated with this resource
        const actions = await pb.collection('perm_actions').getFullList({
          filter: `resourceId = "${id}"`
        });
        
        // For each action, delete associated permissions
        for (const action of actions) {
          await pb.collection('perm_permissions').getFullList({
            filter: `actionId = "${action.id}"`
          }).then(permissions => {
            permissions.forEach(async (permission) => {
              await pb.collection('perm_permissions').delete(permission.id);
            });
          });
          
          // Then delete the action
          await pb.collection('perm_actions').delete(action.id);
        }
        
        // Finally delete the resource
        await pb.collection('perm_resources').delete(id);
        
        toast({
          title: "Success",
          description: "Resource and associated items deleted successfully"
        });
        
        fetchResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
        toast({
          title: "Error",
          description: "Failed to delete resource",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <Button onClick={() => handleOpenDialog('create')} className="flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            <span>Add Resource</span>
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
                ) : resources.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-4 text-center">No resources found. Create your first resource!</td>
                  </tr>
                ) : (
                  resources.map((resource) => (
                    <tr key={resource.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{resource.name}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleOpenDialog('edit', resource)}
                          >
                            <FiEdit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeleteResource(resource.id)}
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
                  {dialogMode === 'create' ? 'Create Resource' : 'Edit Resource'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dialogMode === 'create' ? 'Add a new resource to your system' : 'Modify the existing resource'}
                </p>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none">
                    Resource Name
                  </label>
                  <input
                    id="name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    placeholder="Enter resource name"
                  />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSaveResource}>
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

export default ResourcesPage;
