import { createAccessControl } from 'better-auth/plugins/access';
import {
	adminAc,
	defaultStatements,
	memberAc,
	ownerAc
} from 'better-auth/plugins/organization/access';

const statement = {
	...defaultStatements,
	urls: ['create', 'read', 'update', 'delete']
} as const;

export const ac = createAccessControl(statement);

export const member = ac.newRole({
	...memberAc.statements,
	urls: ['create', 'read', 'update']
});

export const admin = ac.newRole({
	...adminAc.statements,
	organization: ['update', 'delete'] as const,
	urls: ['create', 'read', 'update', 'delete']
});

export const owner = ac.newRole({
	...ownerAc.statements,
	urls: ['create', 'read', 'update', 'delete']
});

export const roles = {
	admin,
	member,
	owner
};
