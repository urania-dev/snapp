import type { Setting } from '@prisma/client';

const parse_db_setting = (res: null | Setting, value: number | string | boolean) =>
	(res && res.value.toLowerCase() === String(value).toLowerCase()) || false;

export { parse_db_setting };
