import pino from 'pino';

const transport = pino.transport({
	options: { destination: 1 },
	target: 'pino-pretty'
});

export const log = pino(transport);
