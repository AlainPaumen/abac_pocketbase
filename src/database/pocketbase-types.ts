/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	PermActions = "perm_actions",
	PermConditioncodes = "perm_conditionCodes",
	PermPermissions = "perm_permissions",
	PermResources = "perm_resources",
	PermRoles = "perm_roles",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type PermActionsRecord = {
	created?: IsoDateString
	id: string
	name: string
	resourceId: RecordIdString
	updated?: IsoDateString
}

export type PermConditioncodesRecord = {
	created?: IsoDateString
	description?: string
	id: string
	name: string
	updated?: IsoDateString
}

export type PermPermissionsRecord = {
	actionId: RecordIdString
	conditionCode?: string
	created?: IsoDateString
	hasCondition?: boolean
	hasPermission?: boolean
	id: string
	resourceId: RecordIdString
	roleId: RecordIdString
	updated?: IsoDateString
}

export type PermResourcesRecord = {
	created?: IsoDateString
	id: string
	name: string
	updated?: IsoDateString
}

export type PermRolesRecord = {
	created?: IsoDateString
	id: string
	name: string
	updated?: IsoDateString
}

export type UsersRecord = {
	avatar?: string
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type PermActionsResponse<Texpand = unknown> = Required<PermActionsRecord> & BaseSystemFields<Texpand>
export type PermConditioncodesResponse<Texpand = unknown> = Required<PermConditioncodesRecord> & BaseSystemFields<Texpand>
export type PermPermissionsResponse<Texpand = unknown> = Required<PermPermissionsRecord> & BaseSystemFields<Texpand>
export type PermResourcesResponse<Texpand = unknown> = Required<PermResourcesRecord> & BaseSystemFields<Texpand>
export type PermRolesResponse<Texpand = unknown> = Required<PermRolesRecord> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	perm_actions: PermActionsRecord
	perm_conditionCodes: PermConditioncodesRecord
	perm_permissions: PermPermissionsRecord
	perm_resources: PermResourcesRecord
	perm_roles: PermRolesRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	perm_actions: PermActionsResponse
	perm_conditionCodes: PermConditioncodesResponse
	perm_permissions: PermPermissionsResponse
	perm_resources: PermResourcesResponse
	perm_roles: PermRolesResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'perm_actions'): RecordService<PermActionsResponse>
	collection(idOrName: 'perm_conditionCodes'): RecordService<PermConditioncodesResponse>
	collection(idOrName: 'perm_permissions'): RecordService<PermPermissionsResponse>
	collection(idOrName: 'perm_resources'): RecordService<PermResourcesResponse>
	collection(idOrName: 'perm_roles'): RecordService<PermRolesResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
