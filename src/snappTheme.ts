import type { CustomThemeConfig } from '@skeletonlabs/tw-plugin';

export const snappTheme: CustomThemeConfig = {
	name: 'snappTheme',
	properties: {
		// =~= Theme Properties =~=
		'--theme-font-family-base': `system-ui`,
		'--theme-font-family-heading': `system-ui`,
		'--theme-font-color-base': '0 0 0',
		'--theme-font-color-dark': '255 255 255',
		'--theme-rounded-base': '8px',
		'--theme-rounded-container': '4px',
		'--theme-border-base': '1px',
		// =~= Theme On-X Colors =~=
		"--on-primary": "0 0 0",
		"--on-secondary": "255 255 255",
		"--on-tertiary": "255 255 255",
		"--on-success": "0 0 0",
		"--on-warning": "0 0 0",
		"--on-error": "255 255 255",
		"--on-surface": "255 255 255",
		// =~= Theme Colors  =~=
		// primary | #4e96b8
		'--color-primary-50': '228 239 244', // #e4eff4
		'--color-primary-100': '220 234 241', // #dceaf1
		'--color-primary-200': '211 229 237', // #d3e5ed
		'--color-primary-300': '184 213 227', // #b8d5e3
		'--color-primary-400': '131 182 205', // #83b6cd
		'--color-primary-500': '78 150 184', // #4e96b8
		'--color-primary-600': '70 135 166', // #4687a6
		'--color-primary-700': '59 113 138', // #3b718a
		'--color-primary-800': '47 90 110', // #2f5a6e
		'--color-primary-900': '38 74 90', // #264a5a
		// secondary | #1a68a2
		'--color-secondary-50': '221 232 241', // #dde8f1
		'--color-secondary-100': '209 225 236', // #d1e1ec
		'--color-secondary-200': '198 217 232', // #c6d9e8
		'--color-secondary-300': '163 195 218', // #a3c3da
		'--color-secondary-400': '95 149 190', // #5f95be
		'--color-secondary-500': '26 104 162', // #1a68a2
		'--color-secondary-600': '23 94 146', // #175e92
		'--color-secondary-700': '20 78 122', // #144e7a
		'--color-secondary-800': '16 62 97', // #103e61
		'--color-secondary-900': '13 51 79', // #0d334f
		// tertiary | #484848
		'--color-tertiary-50': '228 228 228', // #e4e4e4
		'--color-tertiary-100': '218 218 218', // #dadada
		'--color-tertiary-200': '209 209 209', // #d1d1d1
		'--color-tertiary-300': '182 182 182', // #b6b6b6
		'--color-tertiary-400': '127 127 127', // #7f7f7f
		'--color-tertiary-500': '72 72 72', // #484848
		'--color-tertiary-600': '65 65 65', // #414141
		'--color-tertiary-700': '54 54 54', // #363636
		'--color-tertiary-800': '43 43 43', // #2b2b2b
		'--color-tertiary-900': '35 35 35', // #232323
		// success | #a8cc15
		'--color-success-50': '242 247 220', // #f2f7dc
		'--color-success-100': '238 245 208', // #eef5d0
		'--color-success-200': '233 242 197', // #e9f2c5
		'--color-success-300': '220 235 161', // #dceba1
		'--color-success-400': '194 219 91', // #c2db5b
		'--color-success-500': '168 204 21', // #a8cc15
		'--color-success-600': '151 184 19', // #97b813
		'--color-success-700': '126 153 16', // #7e9910
		'--color-success-800': '101 122 13', // #657a0d
		'--color-success-900': '82 100 10', // #52640a
		// warning | #EAB308
		'--color-warning-50': '252 244 218', // #fcf4da
		'--color-warning-100': '251 240 206', // #fbf0ce
		'--color-warning-200': '250 236 193', // #faecc1
		'--color-warning-300': '247 225 156', // #f7e19c
		'--color-warning-400': '240 202 82', // #f0ca52
		'--color-warning-500': '234 179 8', // #EAB308
		'--color-warning-600': '211 161 7', // #d3a107
		'--color-warning-700': '176 134 6', // #b08606
		'--color-warning-800': '140 107 5', // #8c6b05
		'--color-warning-900': '115 88 4', // #735804
		// error | #D41976
		'--color-error-50': '249 221 234', // #f9ddea
		'--color-error-100': '246 209 228', // #f6d1e4
		'--color-error-200': '244 198 221', // #f4c6dd
		'--color-error-300': '238 163 200', // #eea3c8
		'--color-error-400': '225 94 159', // #e15e9f
		'--color-error-500': '212 25 118', // #D41976
		'--color-error-600': '191 23 106', // #bf176a
		'--color-error-700': '159 19 89', // #9f1359
		'--color-error-800': '127 15 71', // #7f0f47
		'--color-error-900': '104 12 58', // #680c3a
		// surface | #507189
		'--color-surface-50': '229 234 237', // #e5eaed
		'--color-surface-100': '220 227 231', // #dce3e7
		'--color-surface-200': '211 220 226', // #d3dce2
		'--color-surface-300': '185 198 208', // #b9c6d0
		'--color-surface-400': '133 156 172', // #859cac
		'--color-surface-500': '80 113 137', // #507189
		'--color-surface-600': '72 102 123', // #48667b
		'--color-surface-700': '60 85 103', // #3c5567
		'--color-surface-800': '48 68 82', // #304452
		'--color-surface-900': '39 55 67' // #273743
	}
};
