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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FiPlay } from 'react-icons/fi';
import { useToast } from '@/components/ui/use-toast';
import { 
  PermResourcesResponse,
  PermActionsResponse,
  PermRolesResponse,
  PermPermissionsResponse
} from '../database/pocketbase-types';

interface TestResult {
  role: string;
  resource: string;
  action: string;
  allowed: boolean;
  hasCondition: boolean;
  conditionResult?: boolean;
  finalResult: boolean;
  explanation: string;
}

const PermissionTestPage = () => {
  const { pb } = usePocketBase();
  const { toast } = useToast();
  const [resources, setResources] = useState<PermResourcesResponse[]>([]);
  const [actions, setActions] = useState<PermActionsResponse[]>([]);
  const [roles, setRoles] = useState<PermRolesResponse[]>([]);
  const [permissions, setPermissions] = useState<PermPermissionsResponse[]>([]);
  
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [selectedActionId, setSelectedActionId] = useState('');
  const [attributesJson, setAttributesJson] = useState('{\n  "userId": "user123",\n  "time": "2023-05-01T14:30:00Z"\n}');
  
  const [filteredActions, setFilteredActions] = useState<PermActionsResponse[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      // Fetch resources, actions, roles, permissions
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
      
      const permissionsResult = await pb.collection('perm_permissions').getFullList();
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
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
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

  const handleRoleChange = (value: string) => {
    setSelectedRoleId(value);
  };

  const handleResourceChange = (value: string) => {
    setSelectedResourceId(value);
  };

  const handleActionChange = (value: string) => {
    setSelectedActionId(value);
  };

  const validateJsonAttributes = (): boolean => {
    try {
      JSON.parse(attributesJson);
      return true;
    } catch (error) {
      setError('Invalid JSON in attributes field');
      return false;
    }
  };

  const evaluateCondition = (conditionCode: string, attributes: any): boolean => {
    try {
      // Create a safe evaluation context with the attributes
      const evalFunction = new Function('attributes', `
        try {
          ${conditionCode}
          return false; // Default to false if no return statement in condition
        } catch (error) {
          console.error("Error in condition evaluation:", error);
          return false;
        }
      `);
      
      return evalFunction(attributes);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  };

  const testPermission = async () => {
    if (!selectedRoleId || !selectedResourceId || !selectedActionId) {
      toast({
        title: "Validation Error",
        description: "Please select a role, resource, and action",
        variant: "destructive"
      });
      return;
    }

    if (!validateJsonAttributes()) {
      return;
    }

    setLoading(true);
    setError(null);
    setTestResults([]);

    try {
      const attributes = JSON.parse(attributesJson);
      
      // Find the permission record
      const permission = permissions.find(p => 
        p.roleId === selectedRoleId && 
        p.resourceId === selectedResourceId && 
        p.actionId === selectedActionId
      );

      const roleName = roles.find(r => r.id === selectedRoleId)?.name || 'Unknown Role';
      const resourceName = resources.find(r => r.id === selectedResourceId)?.name || 'Unknown Resource';
      const actionName = actions.find(a => a.id === selectedActionId)?.name || 'Unknown Action';

      if (!permission) {
        // No permission record found
        setTestResults([{
          role: roleName,
          resource: resourceName,
          action: actionName,
          allowed: false,
          hasCondition: false,
          finalResult: false,
          explanation: 'No permission record found for this combination. Access is denied by default.'
        }]);
      } else {
        // Permission record exists
        let finalResult = permission.hasPermission || false;
        let explanation = permission.hasPermission 
          ? 'Base permission is allowed.' 
          : 'Base permission is denied.';
        
        let conditionResult: boolean | undefined = undefined;
        
        // Check if there's a condition to evaluate
        if (permission.hasCondition && permission.conditionCode) {
          conditionResult = evaluateCondition(permission.conditionCode, attributes);
          finalResult = finalResult && conditionResult;
          
          explanation += permission.hasPermission 
            ? (conditionResult 
                ? ' Condition evaluated to true, so access is allowed.' 
                : ' Condition evaluated to false, so access is denied.')
            : ' Since base permission is denied, condition evaluation does not change the result.';
        }
        
        setTestResults([{
          role: roleName,
          resource: resourceName,
          action: actionName,
          allowed: permission.hasPermission || false,
          hasCondition: permission.hasCondition || false,
          conditionResult,
          finalResult,
          explanation
        }]);
      }
    } catch (error) {
      console.error('Error testing permission:', error);
      toast({
        title: "Error",
        description: "An error occurred while testing the permission",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Permissions</h1>
          <p className="text-muted-foreground mt-2">
            Use this tool to test if a specific role has permission to perform an action on a resource.
            You can also provide context attributes to test conditional permissions.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Permission Test Parameters</h3>
              
              <div className="grid gap-6">
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
                
                <div className="space-y-2">
                  <Label htmlFor="attributes">Context Attributes (JSON)</Label>
                  <Textarea
                    id="attributes"
                    rows={5}
                    value={attributesJson}
                    onChange={(e) => setAttributesJson(e.target.value)}
                    placeholder="Enter attributes as JSON"
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    These attributes will be used to evaluate conditional permissions
                  </p>
                </div>
                
                <div>
                  <Button 
                    onClick={testPermission}
                    disabled={loading || !selectedRoleId || !selectedResourceId || !selectedActionId}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Testing...
                      </>
                    ) : (
                      <>
                        <FiPlay className="h-4 w-4" />
                        Test Permission
                      </>
                    )}
                  </Button>
                </div>
                
                {error && (
                  <div className="bg-destructive/15 text-destructive p-3 rounded-md">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div>
            <div className="rounded-lg border bg-card text-card-foreground shadow p-6 h-full">
              <h3 className="text-lg font-semibold mb-4">Permission Information</h3>
              
              {selectedRoleId && selectedResourceId && selectedActionId ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Testing if:</h4>
                    <dl className="space-y-2 mt-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Role:</dt>
                        <dd className="text-sm">{getRoleName(selectedRoleId)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Resource:</dt>
                        <dd className="text-sm">{getResourceName(selectedResourceId)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-muted-foreground">Action:</dt>
                        <dd className="text-sm">{getActionName(selectedActionId)}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Permission Record:</h4>
                    
                    {(() => {
                      const permission = permissions.find(p => 
                        p.roleId === selectedRoleId && 
                        p.resourceId === selectedResourceId && 
                        p.actionId === selectedActionId
                      );
                      
                      if (!permission) {
                        return (
                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-2 rounded">
                            <p className="text-sm text-yellow-700">
                              No permission record found for this combination.
                              Access will be denied by default.
                            </p>
                          </div>
                        );
                      }
                      
                      return (
                        <dl className="space-y-2 mt-2">
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-muted-foreground">Access:</dt>
                            <dd className={`text-sm font-medium ${permission.hasPermission ? 'text-green-600' : 'text-red-600'}`}>
                              {permission.hasPermission ? 'Allowed' : 'Denied'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-sm font-medium text-muted-foreground">Has Condition:</dt>
                            <dd className={`text-sm font-medium ${permission.hasCondition ? 'text-blue-600' : ''}`}>
                              {permission.hasCondition ? 'Yes' : 'No'}
                            </dd>
                          </div>
                          {permission.hasCondition && (
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Condition Code:</dt>
                              <dd className="text-xs font-mono mt-1 bg-muted p-2 rounded overflow-auto max-h-32">
                                {permission.conditionCode || 'No condition code'}
                              </dd>
                            </div>
                          )}
                        </dl>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Select a role, resource, and action to see permission details.
                </p>
              )}
            </div>
          </div>
        </div>
        
        {testResults.length > 0 && (
          <div className="rounded-lg border bg-card text-card-foreground shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Test Results</h3>
            
            {testResults.map((result, index) => (
              <div key={index} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-full ${result.finalResult ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${result.finalResult ? 'bg-green-500' : 'bg-red-500'}`}>
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        {result.finalResult ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        )}
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">
                      {result.finalResult ? 'Access Granted' : 'Access Denied'}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {result.role} → {result.resource} → {result.action}
                    </p>
                  </div>
                </div>
                
                <div className="bg-muted p-4 rounded-md">
                  <h5 className="font-medium mb-2">Explanation:</h5>
                  <p className="text-sm">{result.explanation}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-md border">
                    <h5 className="text-sm font-medium mb-1">Base Permission</h5>
                    <p className={`text-sm font-medium ${result.allowed ? 'text-green-600' : 'text-red-600'}`}>
                      {result.allowed ? 'Allowed' : 'Denied'}
                    </p>
                  </div>
                  
                  {result.hasCondition && (
                    <div className="p-3 rounded-md border">
                      <h5 className="text-sm font-medium mb-1">Condition Result</h5>
                      <p className={`text-sm font-medium ${result.conditionResult ? 'text-green-600' : 'text-red-600'}`}>
                        {result.conditionResult ? 'True' : 'False'}
                      </p>
                    </div>
                  )}
                  
                  <div className="p-3 rounded-md border">
                    <h5 className="text-sm font-medium mb-1">Final Decision</h5>
                    <p className={`text-sm font-medium ${result.finalResult ? 'text-green-600' : 'text-red-600'}`}>
                      {result.finalResult ? 'Access Granted' : 'Access Denied'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PermissionTestPage;
