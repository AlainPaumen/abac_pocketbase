# ABAC Permission Management System

A comprehensive web application for managing Attribute-Based Access Control (ABAC) permissions. This system allows you to define and manage resources, actions, roles, and permissions with conditional logic.

## Features

- **Resource Management**: Define protected resources in your system
- **Action Management**: Create actions that can be performed on resources
- **Role Management**: Define roles for permission assignment
- **Permission Management**: Configure which roles can perform which actions on which resources
- **Conditional Permissions**: Add JavaScript conditions to permissions for fine-grained access control
- **Permission Testing**: Test permissions with different attributes to validate your ABAC rules

## Prerequisites

- Node.js (v14+)
- PocketBase server running locally

## Setup

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Make sure your PocketBase server is running at `http://127.0.0.1:8090` with the correct collections set up:
   - perm_resources
   - perm_actions
   - perm_roles
   - perm_permissions

4. Start the development server:

```bash
npm start
```

## Project Structure

- `/src/components`: Reusable UI components
- `/src/contexts`: React context providers
- `/src/database`: PocketBase type definitions
- `/src/pages`: Application pages for each feature

## ABAC System Overview

This application implements an Attribute-Based Access Control system with the following components:

1. **Resources**: Objects that you want to protect (e.g., "documents", "users", "projects")
2. **Actions**: Operations that can be performed on resources (e.g., "read", "write", "delete")
3. **Roles**: User roles that are assigned permissions (e.g., "admin", "editor", "viewer")
4. **Permissions**: Rules that specify which roles can perform which actions on which resources
5. **Conditions**: Optional JavaScript expressions that evaluate at runtime to provide dynamic access control

## Usage

1. First, create resources that you want to protect
2. Define actions for each resource
3. Create roles that will be assigned to users
4. Set up permissions by associating roles with resource-action pairs
5. Add conditions to permissions for more fine-grained control
6. Test your permission setup using the testing tool

## License

MIT
