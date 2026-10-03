export const ROLES = { ADMIN: 'ADMIN', PASSENGER: 'PASSENGER', DRIVER: 'DRIVER' }

export const PERMISSIONS = {
  ADMIN: [
    'routes:read', 'routes:write',
    'units:read', 'units:write',
    'drivers:read', 'drivers:write',
    'passengers:read',
    'trips:read', 'trips:write',
    'tickets:read',
    'incidents:read',
    'reports:read',
  ],
  PASSENGER: ['routes:read', 'passengers:me', 'trips:search', 'tickets:buy', 'tickets:own', 'incidents:create'],
  DRIVER: ['drivers:me', 'trips:own', 'incidents:create'],
}

export const can = (role, permission) => PERMISSIONS[role]?.includes(permission) ?? false
