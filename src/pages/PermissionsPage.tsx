import React, { useState, useEffect } from 'react';
import { usePocketBase } from '@/contexts/PocketBaseContext';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FiPlus, FiEdit2, FiTrash2, FiChevronUp, FiChevronDown, FiFilter, FiInfo } from 'react-icons/fi';
import { useToast } from '@/components/ui/use-toast';
import { 
  PermPermissionsRecord, 
  PermPermissionsResponse,
  PermResourcesResponse,
  PermActionsResponse,
  PermRolesResponse,
  PermConditioncodesResponse
} from '@/database/pocketbase-types';

// Sorting types
type SortField = 'role' | 'resource' | 'action' | 'access' | 'condition';
type SortDirection = 'asc' | 'desc';

const PermissionsPage = () => {
  const { pb } = usePocketBase();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermPermissionsResponse[]>([]);
  const [resources, setResources] = useState<PermResourcesResponse[]>([]);
  const [actions, setActions] = useState<PermActionsResponse[]>([]);
  const [roles, setRoles] = useState<PermRolesResponse[]>([]);
  const [conditionCodes, setConditionCodes] = useState<PermConditioncodesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentPermission, setCurrentPermission] = useState<PermPermissionsRecord | null>(null);
  
  // Form state
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedActionId, setSelectedActionId] = useState('');
  const [hasPermission, setHasPermission] = useState(true);
  const [hasCondition, setHasCondition] = useState(false);
  const [selectedConditionCodeId, setSelectedConditionCodeId] = useState('');
  
  // Filtered actions based on selected resource
  const [filteredActions, setFilteredActions] = useState<PermActionsResponse[]>([]);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('role');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Filter state
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch resources, actions, roles
      const resourcesResult = await pb.collection('perm_resources').getFullList({
        sort: 'name',
      });
      setResources(resourcesResult);
      
      const actionsResult = await pb.collection('perm_actions').getFullList({
        sort: 'name',
      });
      setActions(actionsResult);
      
      const rolesResult = await pb.collection('perm_roles').getFullList({
        sort: 'name',
      });
      setRoles(rolesResult);
      
      // Fetch condition codes
      const conditionCodesResult = await pb.collection('perm_conditionCodes').getFullList({
        sort: 'name',
      });
      setConditionCodes(conditionCodesResult);
      
      // Fetch permissions
      const permissionsResult = await pb.collection('perm_permissions').getFullList({
        sort: 'created',
      });
      setPermissions(permissionsResult);
      
      if (resourcesResult.length > 0) {
        setSelectedResourceId(resourcesResult[0].id);
        const filteredActs = actionsResult.filter(action => action.resourceId === resourcesResult[0].id);
        setFilteredActions(filteredActs);
        if (filteredActs.length > 0) {
          setSelectedActionId(filteredActs[0].id);
        }
      }
      
      if (rolesResult.length > 0) {
        setSelectedRoleId(rolesResult[0].id);
      }
      
      if (conditionCodesResult.length > 0) {
        setSelectedConditionCodeId(conditionCodesResult[0].id);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pb]);

  useEffect(() => {
    // Filter actions when resource changes
    if (selectedResourceId) {
      const filteredActs = actions.filter(action => action.resourceId === selectedResourceId);
      setFilteredActions(filteredActs);
      if (filteredActs.length > 0) {
        setSelectedActionId(filteredActs[0].id);
      } else {
        setSelectedActionId('');
      }
    }
  }, [selectedResourceId, actions]);

  const handleOpenDialog = (mode: 'create' | 'edit', permission?: PermPermissionsResponse) => {
    setDialogMode(mode);
    if (mode === 'edit' && permission) {
      setCurrentPermission(permission);
      setSelectedRoleId(permission.roleId);
      setSelectedResourceId(permission.resourceId);
      
      // Find actions for this resource
      const filteredActs = actions.filter(action => action.resourceId === permission.resourceId);
      setFilteredActions(filteredActs);
      
      setSelectedActionId(permission.actionId);
      setHasPermission(permission.hasPermission || false);
      setHasCondition(permission.hasCondition || false);
      
      // Find condition code ID from the code string
      if (permission.hasCondition && permission.conditionCodeId) {
        const conditionCode = conditionCodes.find(cc => cc.id === permission.conditionCodeId);
        if (conditionCode) {
          setSelectedConditionCodeId(conditionCode.id);
        } else if (conditionCodes.length > 0) {
          setSelectedConditionCodeId(conditionCodes[0].id);
        }
      } else if (conditionCodes.length > 0) {
        setSelectedConditionCodeId(conditionCodes[0].id);
      }
    } else {
      setCurrentPermission(null);
      // Default values already set in fetchData
      setHasPermission(true);
      setHasCondition(false);
      if (conditionCodes.length > 0) {
        setSelectedConditionCodeId(conditionCodes[0].id);
      }
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleRoleChange = (value: string) => {
    setSelectedRoleId(value);
  };
  
  const handleRoleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
  };

  const handleResourceChange = (value: string) => {
    setSelectedResourceId(value);
  };

  const handleActionChange = (value: string) => {
    setSelectedActionId(value);
  };
  
  const handleConditionCodeChange = (value: string) => {
    setSelectedConditionCodeId(value);
  };

  const handleSavePermission = async () => {
    try {
      if (!selectedRoleId || !selectedResourceId || !selectedActionId) {
        toast({
          title: "Validation Error",
          description: "Please select role, resource, and action",
          variant: "destructive"
        });
        return;
      }

      if (hasCondition && !selectedConditionCodeId) {
        toast({
          title: "Validation Error",
          description: "Please select a condition code or disable conditions",
          variant: "destructive"
        });
        return;
      }

      // Check if permission already exists (for create mode)
      if (dialogMode === 'create') {
        const existingPermission = await pb.collection('perm_permissions').getList(1, 1, {
          filter: `roleId = "${selectedRoleId}" && resourceId = "${selectedResourceId}" && actionId = "${selectedActionId}"`
        });
        
        if (existingPermission.totalItems > 0) {
          toast({
            title: "Error",
            description: "This permission already exists. Please edit the existing one.",
            variant: "destructive"
          });
          return;
        }
      }

      const permissionData = {
        roleId: selectedRoleId,
        resourceId: selectedResourceId,
        actionId: selectedActionId,
        hasPermission: hasPermission,
        hasCondition: hasCondition,
        conditionCodeId: hasCondition ? selectedConditionCodeId : ''
      };

      if (dialogMode === 'create') {
        await pb.collection('perm_permissions').create(permissionData);
        toast({
          title: "Success",
          description: "Permission created successfully"
        });
      } else if (dialogMode === 'edit' && currentPermission) {
        await pb.collection('perm_permissions').update(currentPermission.id, permissionData);
        toast({
          title: "Success",
          description: "Permission updated successfully"
        });
      }
      
      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving permission:', error);
      toast({
        title: "Error",
        description: "Failed to save permission",
        variant: "destructive"
      });
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this permission?')) {
      try {
        await pb.collection('perm_permissions').delete(id);
        
        toast({
          title: "Success",
          description: "Permission deleted successfully"
        });
        
        fetchData();
      } catch (error) {
        console.error('Error deleting permission:', error);
        toast({
          title: "Error",
          description: "Failed to delete permission",
          variant: "destructive"
        });
      }
    }
  };

  const getResourceName = (resourceId: string) => {
    const resource = resources.find(r => r.id === resourceId);
    return resource ? resource.name : 'Unknown Resource';
  };

  const getActionName = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    return action ? action.name : 'Unknown Action';
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown Role';
  };
  
  const getConditionCodeName = (conditionCodeId: string) => {
    const conditionCode = conditionCodes.find(cc => cc.id === conditionCodeId);
    return conditionCode ? conditionCode.name : 'Unknown Condition';
  };
  
  const getConditionCodeDescription = (conditionCodeId: string) => {
    const conditionCode = conditionCodes.find(cc => cc.id === conditionCodeId);
    return conditionCode?.description || 'No description available';
  };
  
  // Sorting functions
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
  
  // Get filtered and sorted permissions
  const getFilteredAndSortedPermissions = () => {
    if (!permissions.length) return [];
    
    // First filter by role if a filter is set
    const filteredPermissions = roleFilter 
      ? permissions.filter(permission => permission.roleId === roleFilter)
      : permissions;
    
    // Then sort the filtered results
    return [...filteredPermissions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'role':
          comparison = getRoleName(a.roleId).localeCompare(getRoleName(b.roleId));
          break;
        case 'resource':
          comparison = getResourceName(a.resourceId).localeCompare(getResourceName(b.resourceId));
          break;
        case 'action':
          comparison = getActionName(a.actionId).localeCompare(getActionName(b.actionId));
          break;
        case 'access':
          comparison = (a.hasPermission === b.hasPermission) ? 0 : a.hasPermission ? -1 : 1;
          break;
        case 'condition':
          comparison = (a.hasCondition === b.hasCondition) ? 0 : a.hasCondition ? -1 : 1;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-300 ml-1"><FiChevronUp className="h-4 w-4 inline" /></span>;
    }
    
    return sortDirection === 'asc' 
      ? <span className="text-gray-700 ml-1"><FiChevronUp className="h-4 w-4 inline" /></span>
      : <span className="text-gray-700 ml-1"><FiChevronDown className="h-4 w-4 inline" /></span>;
  };
  
  const filteredAndSortedPermissions = getFilteredAndSortedPermissions();
  const permissionCount = filteredAndSortedPermissions.length;
  const totalCount = permissions.length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
          <Button 
            onClick={() => handleOpenDialog('create')}
            disabled={resources.length === 0 || actions.length === 0 || roles.length === 0}
            className="flex items-center gap-2"
          >
            <FiPlus className="h-4 w-4" />
            <span>Add Permission</span>
          </Button>
        </div>
        
        {(resources.length === 0 || actions.length === 0 || roles.length === 0) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You need to create at least one resource, action, and role before you can add permissions.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <FiFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter by Role:</span>
          </div>
          
          <div className="w-full sm:w-64">
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={roleFilter}
              onChange={handleRoleFilterChange}
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          
          {roleFilter && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setRoleFilter('')}
              className="text-xs"
            >
              Clear Filter
            </Button>
          )}
          
          <div className="ml-auto text-sm text-muted-foreground">
            {roleFilter 
              ? `Showing ${permissionCount} of ${totalCount} permissions` 
              : `${totalCount} permissions total`}
          </div>
        </div>
        
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th 
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center">
                      Role {renderSortIcon('role')}
                    </div>
                  </th>
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
                    onClick={() => handleSort('action')}
                  >
                    <div className="flex items-center">
                      Action {renderSortIcon('action')}
                    </div>
                  </th>
                  <th 
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                    onClick={() => handleSort('access')}
                  >
                    <div className="flex items-center">
                      Access {renderSortIcon('access')}
                    </div>
                  </th>
                  <th 
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer"
                    onClick={() => handleSort('condition')}
                  >
                    <div className="flex items-center">
                      Has Condition {renderSortIcon('condition')}
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
                    <td colSpan={6} className="p-4 text-center">Loading...</td>
                  </tr>
                ) : filteredAndSortedPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center">
                      {roleFilter 
                        ? "No permissions found for the selected role. Create your first permission!" 
                        : "No permissions found. Create your first permission!"}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPermissions.map((permission) => (
                    <tr key={permission.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{getRoleName(permission.roleId)}</td>
                      <td className="p-4 align-middle">{getResourceName(permission.resourceId)}</td>
                      <td className="p-4 align-middle">{getActionName(permission.actionId)}</td>
                      <td className="p-4 align-middle">
                        {permission.hasPermission ? (
                          <span className="text-green-600 font-medium">Allowed</span>
                        ) : (
                          <span className="text-red-600 font-medium">---</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        {permission.hasCondition ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-blue-600 font-medium flex items-center gap-1 cursor-help">
                                  {getConditionCodeName(permission.conditionCodeId || '')}
                                  <FiInfo className="h-3 w-3 text-muted-foreground" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{getConditionCodeDescription(permission.conditionCodeId || '')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-red-600 font-medium">---</span>
                        )}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleOpenDialog('edit', permission)}
                          >
                            <FiEdit2 className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeletePermission(permission.id)}
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
                  {dialogMode === 'create' ? 'Create New Permission' : 'Edit Permission'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {dialogMode === 'create' ? 'Add a new permission to your system' : 'Modify the existing permission'}
                </p>
              </div>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={selectedRoleId}
                      onValueChange={handleRoleChange}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="resource">Resource</Label>
                    <Select
                      value={selectedResourceId}
                      onValueChange={handleResourceChange}
                    >
                      <SelectTrigger id="resource">
                        <SelectValue placeholder="Select a resource" />
                      </SelectTrigger>
                      <SelectContent>
                        {resources.map((resource) => (
                          <SelectItem key={resource.id} value={resource.id}>
                            {resource.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="action">Action</Label>
                    <Select
                      value={selectedActionId}
                      onValueChange={handleActionChange}
                      disabled={filteredActions.length === 0}
                    >
                      <SelectTrigger id="action">
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredActions.map((action) => (
                          <SelectItem key={action.id} value={action.id}>
                            {action.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 md:gap-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasPermission" 
                      checked={hasPermission}
                      onCheckedChange={(checked) => {
                        const newValue = checked === true;
                        setHasPermission(newValue);
                        // If enabling hasPermission, disable hasCondition
                        if (newValue) {
                          setHasCondition(false);
                          setSelectedConditionCodeId('');
                        }
                      }}
                    />
                    <Label htmlFor="hasPermission" className={hasPermission ? "font-medium" : ""}>
                      Allow Access (Simple)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasCondition" 
                      checked={hasCondition}
                      onCheckedChange={(checked) => {
                        const newValue = checked === true;
                        setHasCondition(newValue);
                        // If enabling hasCondition, disable hasPermission
                        if (newValue) {
                          setHasPermission(false);
                        }
                      }}
                    />
                    <Label htmlFor="hasCondition" className={hasCondition ? "font-medium" : ""}>
                      Conditional Access
                    </Label>
                  </div>
                </div>
                
                {hasCondition && (
                  <div className="space-y-2">
                    <Label htmlFor="conditionCode">Condition Code</Label>
                    <Select
                      value={selectedConditionCodeId}
                      onValueChange={handleConditionCodeChange}
                    >
                      <SelectTrigger id="conditionCode">
                        <SelectValue placeholder="Select a condition code" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditionCodes.length === 0 ? (
                          <SelectItem value="none" disabled>No condition codes available</SelectItem>
                        ) : (
                          conditionCodes.map((code) => (
                            <SelectItem key={code.id} value={code.id}>
                              {code.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {conditionCodes.length === 0 && (
                      <p className="text-sm text-amber-600">
                        No condition codes found. Please create condition codes before using conditional permissions.
                      </p>
                    )}
                    {selectedConditionCodeId && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Description:</p>
                        <p className="text-sm text-muted-foreground">
                          {conditionCodes.find(cc => cc.id === selectedConditionCodeId)?.description || 'No description available'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSavePermission}>
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

export default PermissionsPage;
