import React, { useState, useEffect } from 'react';
import { usePocketBase } from '@/contexts/PocketBaseContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FiPlus, FiTrash2, FiChevronUp, FiChevronDown, FiFilter } from 'react-icons/fi';
import { useToast } from '@/components/ui/use-toast';
import { 
  PermActionsRecord, 
  PermActionsResponse,
  PermResourcesResponse 
} from '@/database/pocketbase-types';

// Standard predefined actions
const STANDARD_ACTIONS = [
  { id: 'create', label: 'Create' },
  { id: 'list', label: 'List' },
  { id: 'view', label: 'View' },
  { id: 'update', label: 'Update' },
  { id: 'delete', label: 'Delete' },
];

// Sorting types
type SortField = 'name' | 'resource';
type SortDirection = 'asc' | 'desc';

const ActionsPage = () => {
  const { pb } = usePocketBase();
  const { toast } = useToast();
  const [actions, setActions] = useState<PermActionsResponse[]>([]);
  const [resources, setResources] = useState<PermResourcesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionName, setActionName] = useState('');
  const [customActions, setCustomActions] = useState<string[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedStandardActions, setSelectedStandardActions] = useState<string[]>([]);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('resource');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filter state
  const [resourceFilter, setResourceFilter] = useState<string>('');

  const fetchResources = async () => {
    try {
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
    }
  };

  const fetchActions = async () => {
    try {
      setLoading(true);
      const result = await pb.collection('perm_actions').getFullList({
        sort: 'name',
        expand: 'resourceId',
      });
      setActions(result);
    } catch (error) {
      console.error('Error fetching actions:', error);
      toast({
        title: "Error",
        description: "Failed to load actions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchResources();
      await fetchActions();
    };
    loadData();
  }, [pb]);

  const handleOpenDialog = () => {
    setActionName('');
    setSelectedStandardActions([]);
    setCustomActions([]);
    setSelectedResourceId(resources.length > 0 ? resources[0].id : '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedResourceId(e.target.value);
  };

  const handleResourceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setResourceFilter(e.target.value);
  };

  const handleStandardActionToggle = (actionId: string, checked: boolean) => {
    setSelectedStandardActions(prev => 
      checked 
        ? [...prev, actionId] 
        : prev.filter(id => id !== actionId)
    );
  };

  const handleAddCustomAction = () => {
    if (actionName.trim()) {
      setCustomActions(prev => [...prev, actionName.trim()]);
      setActionName('');
    }
  };

  const handleRemoveCustomAction = (index: number) => {
    setCustomActions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAction = async () => {
    try {
      if (!selectedResourceId) {
        toast({
          title: "Validation Error",
          description: "Please select a resource",
          variant: "destructive"
        });
        return;
      }

      // For create mode, we create multiple actions based on selections
      const actionsToCreate = [
        // Add all selected standard actions
        ...selectedStandardActions.map(actionId => ({
          name: actionId,
          resourceId: selectedResourceId
        })),
        // Add all custom actions
        ...customActions.map(name => ({
          name,
          resourceId: selectedResourceId
        }))
      ];

      if (actionsToCreate.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please select at least one action or add a custom action",
          variant: "destructive"
        });
        return;
      }

      // Create all actions
      for (const action of actionsToCreate) {
        await pb.collection('perm_actions').create(action);
      }
      
      toast({
        title: "Success",
        description: `${actionsToCreate.length} action(s) created successfully`
      });
      
      handleCloseDialog();
      fetchActions();
    } catch (error) {
      console.error('Error saving action:', error);
      toast({
        title: "Error",
        description: "Failed to save action",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this action? This may break existing permissions.')) {
      try {
        await pb.collection('perm_actions').delete(id);
        
        toast({
          title: "Success",
          description: "Action deleted successfully"
        });
        
        fetchActions();
      } catch (error) {
        console.error('Error deleting action:', error);
        toast({
          title: "Error",
          description: "Failed to delete action",
          variant: "destructive"
        });
      }
    }
  };

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unknown Resource';
  };
  
  // Sorting and filtering functions
  const getFilteredAndSortedActions = () => {
    if (!actions.length) return [];
    
    // First filter by resource if a filter is set
    const filteredActions = resourceFilter 
      ? actions.filter(action => action.resourceId === resourceFilter)
      : actions;
    
    // Then sort the filtered results
    return [...filteredActions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'resource':
          comparison = getResourceName(a.resourceId).localeCompare(getResourceName(b.resourceId));
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-300 ml-1"><FiChevronUp className="h-4 w-4 inline" /></span>;
    }
    
    return sortDirection === 'asc' 
      ? <span className="text-gray-700 ml-1"><FiChevronUp className="h-4 w-4 inline" /></span>
      : <span className="text-gray-700 ml-1"><FiChevronDown className="h-4 w-4 inline" /></span>;
  };

  const filteredAndSortedActions = getFilteredAndSortedActions();
  const actionCount = filteredAndSortedActions.length;
  const totalCount = actions.length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Actions</h1>
          <Button onClick={() => handleOpenDialog()} className="flex items-center gap-2">
            <FiPlus className="h-4 w-4" />
            <span>Add Action</span>
          </Button>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by:</span>
          </div>
          
          <div className="w-full sm:w-64">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={resourceFilter}
              onChange={handleResourceFilterChange}
            >
              <option value="">All Resources</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name}
                </option>
              ))}
            </select>
          </div>
          
          {resourceFilter && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setResourceFilter('')}
              className="text-xs"
            >
              Clear Filter
            </Button>
          )}
          
          <div className="ml-auto text-sm text-muted-foreground">
            {resourceFilter 
              ? `Showing ${actionCount} of ${totalCount} actions` 
              : `${totalCount} actions total`}
          </div>
        </div>

        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th 
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                    onClick={() => handleSort('resource')}
                  >
                    <div className="flex items-center">
                      Resource {renderSortIcon('resource')}
                    </div>
                  </th>
                  <th 
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Action Name {renderSortIcon('name')}
                    </div>
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center">Loading...</td>
                  </tr>
                ) : filteredAndSortedActions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center">
                      {resourceFilter 
                        ? "No actions found for the selected resource. Create your first action!" 
                        : "No actions found. Create your first action!"}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedActions.map((action) => (
                    <tr key={action.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{getResourceName(action.resourceId)}</td>
                      <td className="p-4 align-middle">{action.name}</td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeleteAction(action.id)}
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
                  Create Action
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add new actions to your system
                </p>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="resource" className="text-sm font-medium leading-none">
                    Resource
                  </label>
                  <select
                    id="resource"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedResourceId}
                    onChange={handleResourceChange}
                  >
                    {resources.length === 0 ? (
                      <option value="">No resources available</option>
                    ) : (
                      resources.map((resource) => (
                        <option key={resource.id} value={resource.id}>
                          {resource.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">
                    Standard Actions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {STANDARD_ACTIONS.map((action) => (
                      <div key={action.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`std-action-${action.id}`} 
                          checked={selectedStandardActions.includes(action.id)}
                          onCheckedChange={(checked) => 
                            handleStandardActionToggle(action.id, checked === true)
                          }
                        />
                        <label
                          htmlFor={`std-action-${action.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {action.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium leading-none">
                    Custom Actions
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Enter custom action name"
                        value={actionName}
                        onChange={(e) => setActionName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomAction();
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleAddCustomAction}
                      >
                        Add
                      </Button>
                    </div>
                    
                    {customActions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {customActions.map((action, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <span className="text-sm">{action}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveCustomAction(index)}
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSaveAction}>
                  Create
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ActionsPage;
