import { Schema } from 'redis-om';

export default new Schema(
	'apikey',
	{
		id: { type: 'string' },
		user_id: { type: 'string' },
		roles: { type: 'string[]' },
		created: { type: 'date', sortable: true },
		used: { type: 'date', sortable: true },
	},
	{
		dataStructure: 'JSON'
	}
);
