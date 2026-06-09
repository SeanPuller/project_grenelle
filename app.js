const APP_VERSION = '0.94';

// Disable browser's automatic scroll restoration so SPA navigation controls scroll position
if ('scrollRestoration' in history) {
	history.scrollRestoration = 'manual';
}

document.addEventListener('DOMContentLoaded', () => {
	const mainContent = document.getElementById('main-content');
	const navLinks = document.querySelectorAll('.nav-link');

	let currentExercise = '';
	let currentViewName = 'home';
	let currentDepth = 0;
	let exerciseReturnView = 'exercises';
	let homeLogsViewDate = null; // null means today
	let globalIsReordering = false;
	let exerciseSearchTerm = '';

	const DEFAULT_COLORS = {
		primary: '#beff5c',
		bg: '#ffffff',
		textDark: '#111111',
		textLight: '#666666',
		textDisabled: '#bbbbbb',
		border: '#e0e0e0',
		btnSecondaryBg: '#e6e6e6',
		btnRemoveColor: '#aaaaaa',
		danger: '#dc3545'
	};

	const COLOR_PRESETS = {
		default: { ...DEFAULT_COLORS },
		dark: {
			primary: '#333333',
			bg: '#121212',
			textDark: '#ffffff',
			textLight: '#aaaaaa',
			textDisabled: '#555555',
			border: '#2a2a2a',
			btnSecondaryBg: '#222222',
			btnRemoveColor: '#777777',
			danger: '#cf6679'
		},
		brazil: {
			primary: '#009b3a',
			bg: '#ffcb00',
			textDark: '#002776',
			textLight: '#005d23',
			textDisabled: '#7ba082',
			border: '#007a2d',
			btnSecondaryBg: '#e6b700',
			btnRemoveColor: '#002776',
			danger: '#ff0000'
		},
		france: {
			primary: '#b31b26',
			bg: '#002347',
			textDark: '#ffffff',
			textLight: '#a8b8cc',
			textDisabled: '#5c738f',
			border: '#003975',
			btnSecondaryBg: '#003366',
			btnRemoveColor: '#8aa2c2',
			danger: '#ff5555'
		},
		monochromatic: {
			primary: '#cccccc',
			bg: '#ffffff',
			textDark: '#000000',
			textLight: '#666666',
			textDisabled: '#aaaaaa',
			border: '#bbbbbb',
			btnSecondaryBg: '#eeeeee',
			btnRemoveColor: '#777777',
			danger: '#555555'
		},
		forest: {
			primary: '#86c28f',
			bg: '#f4f8f4',
			textDark: '#0a2e15',
			textLight: '#476652',
			textDisabled: '#8ba895',
			border: '#a3cfae',
			btnSecondaryBg: '#d1e8d6',
			btnRemoveColor: '#3e6b4c',
			danger: '#cc3333'
		}
	};

	const DEFAULT_DATA = {
		version: 1,
		settings: { debugDate: '', showHomeLogs: true, showVolumeHome: true, showVolumeExercises: true, showRoutineNoteIcons: true, searchType: 'contains', oneRMFormula: 'epley', timerAlertSound: 'single', timerBeepCount: 2, timerAlertVolume: 80, customTypes: [], hueRotation: 0, colors: { ...DEFAULT_COLORS }, enableCustomCopyText: false, customCopyText: 'You are a strength coach. Critique this workout data', enableRestTimer: true },
		home: {
			history: {}
		},
		programs: [],
		routines: [],
		exercises: []
	};

	let data = JSON.parse(JSON.stringify(DEFAULT_DATA));
	try {
		const saved = localStorage.getItem('grenelle_fitness_data');
		if (saved) {
			const parsed = JSON.parse(saved);
			data = {
				version: parsed.version || 1,
				settings: {
					debugDate: '',
					showHomeLogs: true,
					showVolumeHome: true,
					showVolumeExercises: true,
					showRoutineNoteIcons: true,
					searchType: 'contains',
					oneRMFormula: 'epley',
					timerAlertSound: 'single',
					timerBeepCount: 2,
					timerAlertVolume: 80,
					customTypes: [],
					hueRotation: 0,
					colors: { ...DEFAULT_COLORS },
					enableCustomCopyText: false,
					customCopyText: 'You are a strength coach. Critique this workout data',
					enableRestTimer: true,
					...(parsed.settings || {})
				},
				home: parsed.home || DEFAULT_DATA.home,
				programs: parsed.programs || [],
				routines: parsed.routines || [],
				exercises: parsed.exercises || []
			};
		}
	} catch (e) {
		console.error('Failed to parse saved data', e);
	}

	function rotateHue(hex, degree) {
		if (degree === 0) return hex;
		// Hex to RGB
		let r = parseInt(hex.slice(1, 3), 16) / 255;
		let g = parseInt(hex.slice(3, 5), 16) / 255;
		let b = parseInt(hex.slice(5, 7), 16) / 255;
		let max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;
		if (max === min) h = s = 0;
		else {
			let d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		// Rotate Hue
		h = (h * 360 + degree) % 360;
		if (h < 0) h += 360;
		// HSL to Hex
		s *= 100; l *= 100;
		l /= 100;
		const a = s * Math.min(l, 1 - l) / 100;
		const f = n => {
			const k = (n + h / 30) % 12;
			const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
			return Math.round(255 * color).toString(16).padStart(2, '0');
		};
		return `#${f(0)}${f(8)}${f(4)}`;
	}

	function applyColors() {
		const colors = (data.settings && data.settings.colors) ? data.settings.colors : DEFAULT_COLORS;
		const rotation = data.settings?.hueRotation || 0;

		const setVar = (name, hex, rotate = true) => {
			const finalHex = rotate ? rotateHue(hex, rotation) : hex;
			document.documentElement.style.setProperty(name, finalHex);
		};

		setVar('--primary-color', colors.primary || DEFAULT_COLORS.primary);
		setVar('--bg-color', colors.bg || DEFAULT_COLORS.bg);
		setVar('--text-dark', colors.textDark || DEFAULT_COLORS.textDark);
		setVar('--text-light', colors.textLight || DEFAULT_COLORS.textLight);
		setVar('--text-disabled', colors.textDisabled || DEFAULT_COLORS.textDisabled);
		setVar('--border-color', colors.border || DEFAULT_COLORS.border);
		setVar('--btn-secondary-bg', colors.btnSecondaryBg || DEFAULT_COLORS.btnSecondaryBg);
		setVar('--btn-remove-color', colors.btnRemoveColor || DEFAULT_COLORS.btnRemoveColor);
		setVar('--danger-color', colors.danger || DEFAULT_COLORS.danger, false); // No rotation for danger
		setVar('--notes-line-color', colors.border || DEFAULT_COLORS.border);
	}

	applyColors();

	function getCurrentDate() {
		if (data.settings && data.settings.debugDate) {
			return data.settings.debugDate;
		}
		return new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
	}

	function getHomeItemsForDate(date) {
		if (!data.home.history) {
			data.home.history = {};
			if (data.home.items) {
				const oldDate = data.home.date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
				data.home.history[oldDate] = data.home.items;
				delete data.home.items;
				delete data.home.date;
			}
		}
		if (!data.home.history[date]) {
			data.home.history[date] = [];
		}
		return data.home.history[date];
	}

	function getAllTags() {
		const tags = new Set();
		if (data.home && data.home.tags) {
			Object.values(data.home.tags).forEach(dayTags => {
				if (Array.isArray(dayTags)) dayTags.forEach(t => tags.add(t));
			});
		}
		if (data.exercises) {
			data.exercises.forEach(ex => {
				if (ex.logs) {
					ex.logs.forEach(log => {
						if (log.tags && Array.isArray(log.tags)) {
							log.tags.forEach(t => tags.add(t));
						} else if (log.tag) {
							log.tag.split(/[\s,]+/).filter(t => t).forEach(t => tags.add(t));
						}
					});
				}
			});
		}
		return Array.from(tags).sort();
	}

	function getSetTags(logEntry) {
		if (logEntry.tags && Array.isArray(logEntry.tags)) return logEntry.tags;
		if (logEntry.tag) return logEntry.tag.split(/[\s,]+/).filter(t => t);
		return [];
	}

	function getRoutineItemName(item) {
		if (typeof item === 'string') return item;
		return item?.name || '';
	}

	function ensureRoutineIdsAndNotes() {
		if (!data.routines) return;
		data.routines.forEach((routine, routineIndex) => {
			if (!routine.id) {
				routine.id = `routine_${Date.now()}_${routineIndex}_${Math.random().toString(36).slice(2, 8)}`;
			}
			if (!routine.itemNotes) routine.itemNotes = {};
			routine.items = (routine.items || []).map(item => {
				if (typeof item === 'object' && item) {
					return getRoutineItemName(item);
				}
				return item;
			});
		});
	}

	function getHomeItemNote(item) {
		return typeof item === 'object' && item ? (item.note || '') : '';
	}

	function createRoutineItem(name, note = '') {
		return { name, note };
	}

	function setRoutineItemNote(routine, index, note) {
		const current = routine.items[index];
		const name = getRoutineItemName(current);
		routine.items[index] = name;
		if (!routine.itemNotes) routine.itemNotes = {};
		const cleanNote = note.trim();
		if (cleanNote) {
			routine.itemNotes[index] = cleanNote;
		} else {
			delete routine.itemNotes[index];
		}
	}

	function getRoutineItemNote(routine, index) {
		return routine?.itemNotes?.[index] || '';
	}

	function reorderRoutineItemNotes(routine, oldIndexes) {
		if (!routine.itemNotes) return;
		const nextNotes = {};
		oldIndexes.forEach((oldIndex, newIndex) => {
			const note = routine.itemNotes[oldIndex];
			if (note) nextNotes[newIndex] = note;
		});
		routine.itemNotes = nextNotes;
	}

	function removeRoutineItem(routine, index) {
		routine.items.splice(index, 1);
		if (!routine.itemNotes) return;
		const nextNotes = {};
		Object.entries(routine.itemNotes).forEach(([key, note]) => {
			const oldIndex = parseInt(key, 10);
			if (Number.isNaN(oldIndex) || oldIndex === index || !note) return;
			nextNotes[oldIndex > index ? oldIndex - 1 : oldIndex] = note;
		});
		routine.itemNotes = nextNotes;
	}

	function getRoutineEntriesForExercise(exerciseName) {
		ensureRoutineIdsAndNotes();
		const entries = [];
		data.routines.forEach(routine => {
			(routine.items || []).forEach((item, index) => {
				if (getRoutineItemName(item) === exerciseName) {
					entries.push({ routine, index });
				}
			});
		});
		return entries;
	}

	function renderExerciseNameWithNote(container, name, note, align = 'left') {
		const wrap = document.createElement('span');
		wrap.className = 'exercise-with-note';
		wrap.style.flex = '1';
		wrap.style.textAlign = align;

		const nameSpan = document.createElement('span');
		nameSpan.className = 'exercise-name';
		nameSpan.textContent = name;
		wrap.appendChild(nameSpan);

		if (note) {
			const noteSpan = document.createElement('span');
			noteSpan.className = 'routine-note';
			noteSpan.textContent = note;
			wrap.appendChild(noteSpan);
		}

		container.appendChild(wrap);
		return wrap;
	}

	function calculateOneRM(w, r) {
		if (r === 1) return w;
		const formula = data.settings?.oneRMFormula || 'epley';
		switch (formula) {
			case 'brzycki': return w * 36 / (37 - r);
			case 'lander': return (100 * w) / (101.3 - 2.67123 * r);
			case 'lombardi': return w * Math.pow(r, 0.1);
			case 'epley':
			default:
				return w * (1 + r / 30);
		}
	}

	function calculateWeightForReps(oneRM, r) {
		if (r === 1) return oneRM;
		const formula = data.settings?.oneRMFormula || 'epley';
		switch (formula) {
			case 'brzycki': return oneRM * (37 - r) / 36;
			case 'lander': return (oneRM * (101.3 - 2.67123 * r)) / 100;
			case 'lombardi': return oneRM / Math.pow(r, 0.1);
			case 'epley':
			default:
				return oneRM / (1 + r / 30);
		}
	}

	function calculateSetVolume(logEntry) {
		// Don't count partial sets towards volume
		if (logEntry.type === 'p') return 0;
		const w = parseFloat(logEntry.data?.kg);
		const r = parseFloat(logEntry.data?.reps);
		if (!isNaN(w) && !isNaN(r) && r > 0 && Number.isInteger(r)) {
			return w * r;
		}
		return 0;
	}

	function calculateLogsVolume(logs) {
		let total = 0;
		logs.forEach(log => {
			total += calculateSetVolume(log);
		});
		return total;
	}

// Global renderer for strength-standard 1D graphs used across views
function renderStandardGraphGlobal(wrapper, best1RMValue, levels, standards) {
	wrapper.innerHTML = '';

	const entries = levels
		.map(level => ({ level, value: parseFloat(standards[level]) }))
		.filter(entry => !isNaN(entry.value))
		.sort((a, b) => a.value - b.value);

	const graph = document.createElement('div');
	graph.className = 'strength-standard-graph';

	const line = document.createElement('div');
	line.className = 'strength-standard-line';
	graph.appendChild(line);

	if (entries.length === 0) {
		const placeholder = document.createElement('div');
		placeholder.className = 'strength-standard-placeholder';
		placeholder.textContent = 'enter strength standards to display the 1d graph.';
		wrapper.appendChild(placeholder);
		return;
	}

	const minValue = entries[0].value;
	const maxValue = entries[entries.length - 1].value;
	const range = Math.max(1, maxValue - minValue);

	const markers = [];
	entries.forEach(entry => {
		const marker = document.createElement('div');
		marker.className = 'strength-standard-marker';
		marker.style.left = `${((entry.value - minValue) / range) * 100}%`;
		marker.title = `${entry.level}: ${entry.value} kg`;

		const label = document.createElement('span');
		label.className = 'strength-standard-label';
		label.textContent = entry.level;

		const weightLabel = document.createElement('span');
		weightLabel.className = 'strength-standard-weight';
		weightLabel.textContent = `${Math.round(entry.value)} kg`;

		marker.appendChild(label);
		marker.appendChild(weightLabel);
		line.appendChild(marker);
		markers.push(marker);
	});

	let bestPosition = null;
	if (best1RMValue > 0) {
		const bestMarker = document.createElement('div');
		bestMarker.className = 'strength-standard-best-marker';
		bestPosition = Math.min(100, Math.max(0, ((best1RMValue - minValue) / range) * 100));
		bestMarker.style.left = `${bestPosition}%`;
		bestMarker.title = `best 1rm: ${Math.round(best1RMValue)} kg`;
		line.appendChild(bestMarker);
	}

	if (bestPosition !== null) {
		markers.forEach(marker => {
			const pos = parseFloat(marker.style.left);
			if (Math.abs(pos - bestPosition) < 6) {
				marker.classList.add('strength-standard-hide-text');
			}
		});
	}

	wrapper.appendChild(graph);
}

	function saveData() {
		localStorage.setItem('grenelle_fitness_data', JSON.stringify(data, null, 2));
	}

	function searchMatches(label, searchTerm) {
		const normalizedLabel = (label || '').toLowerCase();
		const normalizedTerm = (searchTerm || '').trim().toLowerCase();
		if (!normalizedTerm) return true;

		if (data.settings?.searchType === 'prefix') {
			return normalizedLabel.startsWith(normalizedTerm);
		}
		return normalizedLabel.includes(normalizedTerm);
	}

	const appHeader = document.querySelector('.app-header');
	const logo = appHeader.querySelector('.logo');
	const backBtn = appHeader.querySelector('.back-btn');
	const headerTitle = appHeader.querySelector('.header-title');
	const settingsIcon = appHeader.querySelector('.settings-icon');
	const dataIcon = appHeader.querySelector('.data-icon');
	const headerEditIcon = appHeader.querySelector('.header-edit-icon');
	const headerAddHomeIcon = appHeader.querySelector('.header-add-home-icon');

	if (settingsIcon) {
		settingsIcon.addEventListener('click', () => {
			renderView('settings');
		});
	}

	if (dataIcon) {
		dataIcon.addEventListener('click', () => {
			renderView('data-page');
		});
	}

	if (backBtn) {
		backBtn.addEventListener('click', () => {
			history.back();
		});
	}

	if (headerEditIcon) {
		headerEditIcon.addEventListener('click', () => {
			renderView('exercise-edit');
		});
	}

	if (headerAddHomeIcon) {
		headerAddHomeIcon.addEventListener('click', () => {
			const itemsForToday = getHomeItemsForDate(getCurrentDate());
			itemsForToday.push(currentExercise);
			getExerciseObj(currentExercise);
			saveData();
			showAlert(`Added "${currentExercise}" to home.`);
		});
	}

	const sdDialog = document.getElementById('selection-dialog');
	const sdTitle = document.getElementById('sd-title');
	const sdSearch = document.getElementById('sd-search');
	const sdList = document.getElementById('sd-list');
	const sdNewContainer = document.getElementById('sd-new-container');
	const sdInput = document.getElementById('sd-input');
	const sdCancel = document.getElementById('sd-cancel');
	const sdAddNewBtn = document.getElementById('sd-add-new-btn');
	const sdSaveBtn = document.getElementById('sd-save-btn');

	let currentSelectionCallback = null;

	let isMultiSelect = false;
	let selectedValues = new Set();

	function openSelectionDialog(title, optionsList, onSelect, addNewText = 'add new', showAddNew = true) {
		sdTitle.textContent = title;
		currentSelectionCallback = onSelect;
		sdAddNewBtn.textContent = addNewText;
		const showSearch = currentViewName !== 'settings';

		sdList.style.display = 'block';
		sdSearch.style.display = showSearch ? 'block' : 'none';
		sdNewContainer.style.display = 'none';
		sdAddNewBtn.style.display = showAddNew ? 'block' : 'none';
		sdSaveBtn.style.display = 'none';
		sdSearch.value = '';
		sdInput.value = '';
		isMultiSelect = false;
		selectedValues.clear();

		sdInput.setAttribute('autocapitalize', 'none');

		const renderList = () => {
			sdList.innerHTML = '';
			if (optionsList.length === 0) {
				sdList.innerHTML = '<div style="color: gray; font-size: 14px; text-align: center; padding: 12px;">No existing entries</div>';
			} else {
				let options = optionsList.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
				if (typeof optionsList[0] === 'string') {
					options.sort((a, b) => a.label.localeCompare(b.label));
				}
				const searchTerm = sdSearch.value;
				if (searchTerm) {
					options = options.filter(opt => searchMatches(opt.label, searchTerm));
				}
				if (options.length === 0) {
					sdList.innerHTML = '<div style="color: gray; font-size: 14px; text-align: center; padding: 12px;">No matching entries</div>';
					return;
				}
				options.forEach(opt => {
					const div = document.createElement('div');
					div.className = 'list-item';
					div.style.display = 'flex';
					div.style.alignItems = 'center';
					div.style.gap = '8px';

					const check = document.createElement('span');
					check.className = 'material-icons-outlined';
					check.textContent = selectedValues.has(opt.value) ? 'check_box' : 'check_box_outline_blank';
					check.style.fontSize = '20px';
					check.style.display = isMultiSelect ? 'block' : 'none';
					div.appendChild(check);

					const textSpan = document.createElement('span');
					textSpan.textContent = opt.label;
					div.appendChild(textSpan);

					addLongPressListener(div, (e) => {
						if (isMultiSelect) return;
						isMultiSelect = true;
						sdTitle.textContent = title + ' (multi-select)';
						sdSaveBtn.style.display = 'block';
						sdAddNewBtn.style.display = 'none';
						selectedValues.add(opt.value);
						renderList();
					});

					div.addEventListener('click', () => {
						if (isMultiSelect) {
							if (selectedValues.has(opt.value)) {
								selectedValues.delete(opt.value);
								check.textContent = 'check_box_outline_blank';
							} else {
								selectedValues.add(opt.value);
								check.textContent = 'check_box';
							}
						} else {
							sdDialog.close();
							if (currentSelectionCallback) currentSelectionCallback(opt.value);
						}
					});
					sdList.appendChild(div);
				});
			}
		};

		sdSearch.oninput = renderList;
		renderList();
		sdDialog.showModal();
		sdSearch.blur();
	}

	sdCancel.addEventListener('click', () => sdDialog.close());

	// Close dialog when clicking outside (on the backdrop), unless in multi-select mode
	sdDialog.addEventListener('click', (e) => {
		if (e.target === sdDialog && !isMultiSelect) {
			sdDialog.close();
		}
	});

	sdAddNewBtn.addEventListener('click', () => {
		sdList.style.display = 'none';
		sdSearch.style.display = 'none';
		sdAddNewBtn.style.display = 'none';
		sdNewContainer.style.display = 'block';
		sdSaveBtn.style.display = 'block';
		sdInput.focus();
	});

	sdSaveBtn.addEventListener('click', () => {
		if (isMultiSelect) {
			sdDialog.close();
			if (currentSelectionCallback) {
				currentSelectionCallback(Array.from(selectedValues));
			}
			return;
		}
		const val = sdInput.value.trim();
		if (val) {
			sdDialog.close();
			if (currentSelectionCallback) currentSelectionCallback(val);
		}
	});

	sdInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			sdSaveBtn.click();
		}
	});

	// --- Generic Dialog Logic ---
	const gdDialog = document.getElementById('generic-dialog');
	const gdMessage = document.getElementById('gd-message');
	const gdInputContainer = document.getElementById('gd-input-container');
	const gdInput = document.getElementById('gd-input');
	const gdCancel = document.getElementById('gd-cancel');
	const gdConfirm = document.getElementById('gd-confirm');

	let gdResolve = null;

	function showGenericDialog(message, type = 'alert', defaultValue = '') {
		return new Promise((resolve) => {
			gdMessage.textContent = message;
			gdResolve = resolve;

			if (type === 'prompt') {
				gdInputContainer.style.display = 'block';
				gdInput.value = defaultValue;
			} else {
				gdInputContainer.style.display = 'none';
			}

			if (type === 'alert') {
				gdCancel.style.display = 'none';
			} else {
				gdCancel.style.display = 'block';
			}

			gdDialog.showModal();
			if (type === 'prompt') gdInput.focus();
		});
	}

	gdConfirm.addEventListener('click', () => {
		const isPrompt = gdInputContainer.style.display === 'block';
		const result = isPrompt ? gdInput.value : true;
		gdDialog.close();
		if (gdResolve) gdResolve(result);
	});

	gdCancel.addEventListener('click', () => {
		gdDialog.close();
		if (gdResolve) gdResolve(null);
	});

	gdInput.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			gdConfirm.click();
		} else if (e.key === 'Escape') {
			gdCancel.click();
		}
	});

	const showAlert = (msg) => showGenericDialog(msg, 'alert');
	const showConfirm = (msg) => showGenericDialog(msg, 'confirm');
	const showPrompt = (msg, def) => showGenericDialog(msg, 'prompt', def);

	// --- Calendar Dialog Logic ---
	const calDialog = document.getElementById('calendar-dialog');
	const calMonthLabel = document.getElementById('cal-month-label');
	const calGrid = document.getElementById('cal-grid');
	const calPrev = document.getElementById('cal-prev');
	const calNext = document.getElementById('cal-next');
	const calCancel = document.getElementById('cal-cancel');

	let calViewDate = new Date(); // Month currently being viewed in calendar
	let calOnSelect = null;
	let calSelectedDateStr = null;

	function openCalendarDialog(initialDateStr, onSelect, selectedDateStr = null) {
		calOnSelect = onSelect;
		calSelectedDateStr = selectedDateStr;

		// Parse initial date (dd-mm-yyyy)
		const parts = initialDateStr.split('-');
		calViewDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 1);

		renderCalendar();
		calDialog.showModal();
	}

	function renderCalendar() {
		calGrid.innerHTML = '';
		const year = calViewDate.getFullYear();
		const month = calViewDate.getMonth();

		calMonthLabel.textContent = calViewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toLowerCase();

		// Days with logs for highlighting
		const loggedDates = new Set();
		data.exercises.forEach(ex => {
			if (ex.logs) ex.logs.forEach(l => loggedDates.add(l.date));
		});

		const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
		const selectedStr = calSelectedDateStr || homeLogsViewDate || todayStr;

		// Start of month
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		// Adjust for Monday start (JS getDay is 0 for Sun)
		const startOffset = (firstDay === 0) ? 6 : firstDay - 1;

		// Empty slots before 1st
		for (let i = 0; i < startOffset; i++) {
			const div = document.createElement('div');
			div.className = 'cal-day empty';
			calGrid.appendChild(div);
		}

		// Day slots
		for (let d = 1; d <= daysInMonth; d++) {
			const div = document.createElement('div');
			div.className = 'cal-day';
			div.textContent = d;

			const dateStr = `${d.toString().padStart(2, '0')}-${(month + 1).toString().padStart(2, '0')}-${year}`;

			if (dateStr === todayStr) div.classList.add('today');
			if (dateStr === selectedStr) div.classList.add('selected');
			if (loggedDates.has(dateStr)) div.classList.add('has-logs');

			div.addEventListener('click', () => {
				calDialog.close();
				if (calOnSelect) calOnSelect(dateStr);
			});

			calGrid.appendChild(div);
		}
	}

	calPrev.addEventListener('click', () => {
		calViewDate.setMonth(calViewDate.getMonth() - 1);
		renderCalendar();
	});

	calNext.addEventListener('click', () => {
		calViewDate.setMonth(calViewDate.getMonth() + 1);
		renderCalendar();
	});

	calCancel.addEventListener('click', () => calDialog.close());


	function renderInlineAdd(listContainer, onSave, onCancel) {
		if (listContainer.querySelector('.inline-add-row')) return;

		const row = document.createElement('div');
		row.className = 'list-item inline-add-row';

		const input = document.createElement('input');
		input.type = 'text';
		input.className = 'inline-input';
		input.placeholder = 'Name...';
		input.setAttribute('autocapitalize', 'none');

		const actions = document.createElement('div');
		actions.className = 'inline-actions';

		const saveBtn = document.createElement('span');
		saveBtn.className = 'material-icons-outlined inline-btn inline-save';
		saveBtn.textContent = 'check';

		const cancelBtn = document.createElement('span');
		cancelBtn.className = 'material-icons-outlined inline-btn inline-cancel';
		cancelBtn.textContent = 'close';

		actions.appendChild(saveBtn);
		actions.appendChild(cancelBtn);
		row.appendChild(input);
		row.appendChild(actions);

		listContainer.prepend(row);
		input.focus();

		saveBtn.addEventListener('click', () => {
			const val = input.value.trim();
			if (val) {
				onSave(val);
			} else {
				onCancel();
			}
		});

		cancelBtn.addEventListener('click', () => onCancel());
	}

	function setupReorderable(container, array, onReorder) {
		let draggedItem = null;

		Array.from(container.children).forEach(child => {
			// Disable native HTML5 drag on touch devices to prevent conflicts
			if (!('ontouchstart' in window)) {
				child.draggable = true;
			}

			// --- Desktop Drag & Drop ---
			child.addEventListener('dragstart', (e) => {
				draggedItem = child;
				e.dataTransfer.effectAllowed = 'move';
				if (e.dataTransfer.setData) e.dataTransfer.setData('text/plain', '');
				setTimeout(() => child.style.opacity = '0.5', 0);
			});

			child.addEventListener('dragend', () => {
				if (draggedItem) {
					draggedItem.style.opacity = '1';
				}
				draggedItem = null;
			});

			child.addEventListener('dragover', (e) => {
				e.preventDefault();
				e.dataTransfer.dropEffect = 'move';

				if (child === draggedItem || !draggedItem) return;

				const rect = child.getBoundingClientRect();
				const midpoint = rect.top + rect.height / 2;
				if (e.clientY < midpoint) {
					container.insertBefore(draggedItem, child);
				} else {
					container.insertBefore(draggedItem, child.nextSibling);
				}
			});

			child.addEventListener('drop', (e) => {
				e.preventDefault();
				if (draggedItem) {
					draggedItem.style.opacity = '1';
				}
				const newArray = [];
				const newIndexes = [];
				Array.from(container.children).forEach(c => {
					const idx = parseInt(c.dataset.index, 10);
					if (!isNaN(idx)) {
						newArray.push(array[idx]);
						newIndexes.push(idx);
					}
				});
				onReorder(newArray, newIndexes);
			});

			// --- Mobile Touch Drag & Drop ---
			let pressTimer = null;
			let isDragging = false;
			let wasDragging = false;

			child.addEventListener('touchstart', (e) => {
				if (e.touches.length !== 1) return;
				pressTimer = setTimeout(() => {
					isDragging = true;
					globalIsReordering = true;
					draggedItem = child;
					child.style.opacity = '0.5';
					if (navigator.vibrate) navigator.vibrate(50);
				}, 400); // 400ms long press to activate drag
			}, { passive: true });

			child.addEventListener('contextmenu', (e) => {
				if (isDragging) {
					e.preventDefault();
				}
			});

			child.addEventListener('touchmove', (e) => {
				if (!isDragging || !draggedItem) {
					clearTimeout(pressTimer);
					return;
				}
				e.preventDefault(); // Prevent scrolling

				const touch = e.touches[0];
				const target = document.elementFromPoint(touch.clientX, touch.clientY);
				if (!target) return;

				let overItem = target;
				while (overItem && overItem.parentNode !== container) {
					overItem = overItem.parentNode;
				}

				if (overItem && overItem !== draggedItem && overItem.parentNode === container) {
					const rect = overItem.getBoundingClientRect();
					const midpoint = rect.top + rect.height / 2;
					if (touch.clientY < midpoint) {
						container.insertBefore(draggedItem, overItem);
					} else {
						container.insertBefore(draggedItem, overItem.nextSibling);
					}
				}
			}, { passive: false });

			const endTouch = () => {
				clearTimeout(pressTimer);
				if (isDragging) {
					isDragging = false;
					setTimeout(() => globalIsReordering = false, 50);
					wasDragging = true;
					setTimeout(() => wasDragging = false, 50);

					if (draggedItem) draggedItem.style.opacity = '1';
					draggedItem = null;

					const newArray = [];
					const newIndexes = [];
					Array.from(container.children).forEach(c => {
						const idx = parseInt(c.dataset.index, 10);
						if (!isNaN(idx)) {
							newArray.push(array[idx]);
							newIndexes.push(idx);
						}
					});
					onReorder(newArray, newIndexes);
				}
			};

			child.addEventListener('touchend', endTouch);
			child.addEventListener('touchcancel', endTouch);

			child.addEventListener('click', (e) => {
				if (wasDragging) {
					e.stopPropagation();
					e.preventDefault();
				}
			}, true); // Capture phase to intercept clicks before children
		});
	}

	function addLongPressListener(element, callback) {
		let timer;
		let isLongPress = false;
		const delay = 600;

		const start = (e) => {
			if (e.type === 'touchstart' && e.touches.length > 1) return;
			isLongPress = false;
			timer = setTimeout(() => {
				isLongPress = true;
				if (navigator.vibrate) navigator.vibrate(50);
				callback(e);
			}, delay);
		};

		const cancel = () => {
			clearTimeout(timer);
		};

		element.addEventListener('mousedown', start);
		element.addEventListener('touchstart', start, { passive: true });
		element.addEventListener('mouseup', cancel);
		element.addEventListener('mouseleave', cancel);
		element.addEventListener('touchend', cancel);
		element.addEventListener('touchmove', cancel);

		element.addEventListener('click', (e) => {
			if (isLongPress) {
				e.preventDefault();
				e.stopPropagation();
			}
		}, true);
	}

	function renderInlineRename(elementToReplace, initialValue, onSave) {
		const parent = elementToReplace.parentNode;
		if (parent.querySelector('.inline-edit-row')) return;

		const originalDisplay = elementToReplace.style.display;

		// If it's a header title, we might want to hide the action buttons too
		const siblingButtons = parent.querySelector('div[style*="display:flex"]');
		const originalButtonsDisplay = siblingButtons ? siblingButtons.style.display : null;

		elementToReplace.style.display = 'none';
		if (siblingButtons) siblingButtons.style.display = 'none';

		const row = document.createElement('div');
		row.className = 'inline-edit-row';

		const input = document.createElement('input');
		input.type = 'text';
		input.className = 'inline-input';
		input.value = initialValue;
		input.setAttribute('autocapitalize', 'none');

		const actions = document.createElement('div');
		actions.className = 'inline-actions';

		const saveBtn = document.createElement('span');
		saveBtn.className = 'material-icons-outlined inline-btn inline-save';
		saveBtn.textContent = 'check';

		const cancelBtn = document.createElement('span');
		cancelBtn.className = 'material-icons-outlined inline-btn inline-cancel';
		cancelBtn.textContent = 'close';

		actions.appendChild(saveBtn);
		actions.appendChild(cancelBtn);
		row.appendChild(input);
		row.appendChild(actions);

		parent.insertBefore(row, elementToReplace.nextSibling);
		input.focus();
		input.select();

		const finish = (success) => {
			row.remove();
			elementToReplace.style.display = originalDisplay;
			if (siblingButtons) siblingButtons.style.display = originalButtonsDisplay;

			if (success) {
				const val = input.value.trim();
				if (val && val !== initialValue) {
					onSave(val);
				}
			}
		};

		saveBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			finish(true);
		});
		cancelBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			finish(false);
		});
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') finish(true);
			if (e.key === 'Escape') finish(false);
		});
		input.addEventListener('click', (e) => e.stopPropagation());
	}

	function renameExercise(oldName, newName) {
		if (!newName || oldName === newName) return;
		const ex = data.exercises.find(e => e.name === oldName);
		if (ex) ex.name = newName;

		data.routines.forEach(r => {
			r.items = r.items.map(item => {
				const itemName = getRoutineItemName(item);
				if (itemName !== oldName) return item;
				return typeof item === 'string' ? newName : { ...item, name: newName };
			});
		});

		data.programs.forEach(p => {
			p.items = p.items.map(item => item === oldName ? newName : item);
		});

		if (data.home.history) {
			Object.keys(data.home.history).forEach(date => {
				data.home.history[date] = data.home.history[date].map(item => {
					const itemName = getRoutineItemName(item);
					if (itemName !== oldName) return item;
					return typeof item === 'string' ? newName : { ...item, name: newName };
				});
			});
		}

		if (currentExercise === oldName) currentExercise = newName;
		saveData();
	}

	function renameRoutine(oldName, newName) {
		if (!newName || oldName === newName) return;
		const rout = data.routines.find(r => r.name === oldName);
		if (rout) rout.name = newName;

		data.programs.forEach(p => {
			p.items = p.items.map(item => item === oldName ? newName : item);
		});
		saveData();
	}

	function renameProgram(oldName, newName) {
		if (!newName || oldName === newName) return;
		const prog = data.programs.find(p => p.name === oldName);
		if (prog) prog.name = newName;
		saveData();
	}

	function getExerciseObj(name) {
		let ex = data.exercises.find(e => e.name === name);
		if (!ex) {
			ex = { name: name, types: ['kg', 'reps'], logs: [], notes: '', strengthStandards: {}, restTimer: 0 };
			data.exercises.push(ex);
		}
		if (!ex.strengthStandards) {
			ex.strengthStandards = {};
		}
		if (ex.restTimer === undefined) {
			ex.restTimer = 0;
		}
		return ex;
	}

	function renderView(viewName, pushToHistory = true) {
		const mainTabs = ['programs', 'routines', 'exercises'];
		const subViews = ['exercise-detail', 'exercise-edit', 'settings', 'data-page'];

		if (viewName === 'exercise-detail' && ['home', 'programs', 'routines', 'exercises'].includes(currentViewName)) {
			exerciseReturnView = currentViewName;
		}
		if (currentViewName === 'home' && viewName !== 'home') {
			homeLogsViewDate = null; // reset to today when leaving home
		}

		if (pushToHistory && viewName !== currentViewName) {
			const currentIsHome = currentViewName === 'home';
			const currentIsTab = mainTabs.includes(currentViewName);
			const currentIsSub = subViews.includes(currentViewName);

			const nextIsHome = viewName === 'home';
			const nextIsTab = mainTabs.includes(viewName);
			const nextIsSub = subViews.includes(viewName);

			if (nextIsHome) {
				if (currentDepth > 0) {
					history.go(-currentDepth);
					return;
				}
			} else if (nextIsTab) {
				if (currentDepth === 0) {
					currentDepth = 1;
					history.pushState({ view: viewName, exercise: currentExercise, depth: 1 }, '', '');
				} else {
					currentDepth = 1;
					history.replaceState({ view: viewName, exercise: currentExercise, depth: 1 }, '', '');
				}
			} else if (nextIsSub) {
				currentDepth++;
				history.pushState({ view: viewName, exercise: currentExercise, depth: currentDepth }, '', '');
			}
		}

		currentViewName = viewName;
		if (window.AndroidInterface && window.AndroidInterface.updateView) {
			window.AndroidInterface.updateView(viewName);
		}

		const template = document.getElementById(`view-${viewName}`);
		if (!template) return;

		navLinks.forEach(link => {
			if (link.dataset.target === viewName) {
				link.classList.add('active');
			} else {
				link.classList.remove('active');
			}
		});

		const topNav = document.querySelector('.top-nav');
		const isMainView = ['home', 'programs', 'routines', 'exercises'].includes(viewName);

		if (isMainView) {
			topNav.style.display = 'flex';
			logo.style.display = 'flex';
			backBtn.style.display = 'none';
			headerTitle.style.display = 'none';
			settingsIcon.style.display = 'flex';
			if (dataIcon) dataIcon.style.display = 'flex';
			headerEditIcon.style.display = 'none';
			headerAddHomeIcon.style.display = 'none';
		} else {
			topNav.style.display = 'none';
			logo.style.display = 'none';
			backBtn.style.display = 'block';
			headerTitle.style.display = 'block';
			settingsIcon.style.display = 'none';
			if (dataIcon) dataIcon.style.display = 'none';

			if (viewName === 'settings') {
				headerTitle.textContent = 'settings';
				headerEditIcon.style.display = 'none';
				headerAddHomeIcon.style.display = 'none';
			} else if (viewName === 'exercise-detail') {
				headerTitle.textContent = currentExercise;
				headerEditIcon.style.display = 'block';
				headerAddHomeIcon.style.display = 'block';
			} else if (viewName === 'exercise-edit') {
				headerTitle.textContent = `edit ${currentExercise}`;
				headerEditIcon.style.display = 'none';
				headerAddHomeIcon.style.display = 'none';
			} else if (viewName === 'data-page') {
				headerTitle.textContent = 'app data';
				headerEditIcon.style.display = 'none';
				headerAddHomeIcon.style.display = 'none';
			}
		}

		mainContent.innerHTML = '';
		window.scrollTo(0, 0);
		const content = template.content.cloneNode(true);

		if (viewName === 'home') {
			const listContainer = content.getElementById('home-list');
			const emptyState = content.getElementById('home-empty');
			const dateDisplay = content.getElementById('home-date-display');

			const todayStr = getCurrentDate();
			const logsDate = homeLogsViewDate || todayStr;
			const isViewingToday = logsDate === todayStr;

			const itemsForDate = getHomeItemsForDate(logsDate);

			if (dateDisplay) {
				dateDisplay.textContent = isViewingToday ? todayStr : logsDate;
				dateDisplay.style.cursor = 'pointer';
				dateDisplay.addEventListener('click', () => {
					openCalendarDialog(logsDate, (selected) => {
						homeLogsViewDate = selected === todayStr ? null : selected;
						renderView('home');
					});
				});
			}

			const tagsSpan = content.querySelector('.add-tags');
			if (tagsSpan) {
				if (!data.home.tags) data.home.tags = {};
				const currentTags = data.home.tags[logsDate] || [];

				tagsSpan.innerHTML = '';
				if (currentTags.length > 0) {
					currentTags.forEach(t => {
						const s = document.createElement('span');
						s.textContent = `#${t} `;
						s.style.color = 'var(--text-dark)';
						s.style.fontWeight = '600';
						s.style.cursor = 'pointer';
						s.addEventListener('click', (e) => {
							e.stopPropagation();
							data.home.tags[logsDate] = data.home.tags[logsDate].filter(x => x !== t);
							saveData();
							renderView('home');
						});
						tagsSpan.appendChild(s);
					});
				}

				const addS = document.createElement('span');
				addS.textContent = '<add tags>';
				addS.style.cursor = 'pointer';
				addS.addEventListener('click', (e) => {
					e.stopPropagation();
					const allTags = getAllTags().map(t => ({ label: `#${t}`, value: t }));
					openSelectionDialog('Select a tag', allTags, (selection) => {
						const selections = Array.isArray(selection) ? selection : [selection];
						selections.forEach(sel => {
							let val = typeof sel === 'string' ? sel : sel.value;
							if (val) {
								val = val.replace(/^#/, '').trim();
								if (!data.home.tags[logsDate]) data.home.tags[logsDate] = [];
								if (!data.home.tags[logsDate].includes(val)) {
									data.home.tags[logsDate].push(val);
								}
							}
						});
						saveData();
						renderView('home');
					}, 'add new tag');
				});
				tagsSpan.appendChild(addS);
			}

			const mainAddBtn = content.querySelector('.btn-add');
			if (mainAddBtn) {
				mainAddBtn.addEventListener('click', () => {
					const routines = data.routines.map(r => ({ label: `[routine] ${r.name}`, value: { type: 'routine', routine: r } })).sort((a, b) => a.label.localeCompare(b.label));
					const exercises = data.exercises.map(e => ({ label: e.name, value: { type: 'exercise', name: e.name } })).sort((a, b) => a.label.localeCompare(b.label));
					const allOptions = [...routines, ...exercises];

					openSelectionDialog('Add routine or exercise', allOptions, (selection) => {
						const selections = Array.isArray(selection) ? selection : [selection];
						selections.forEach(sel => {
							if (typeof sel === 'string') {
								itemsForDate.push(sel);
								getExerciseObj(sel);
							} else if (sel.type === 'routine') {
								sel.routine.items.forEach((routineItem, routineIndex) => {
									const exName = getRoutineItemName(routineItem);
									const note = getRoutineItemNote(sel.routine, routineIndex);
									itemsForDate.push(note ? createRoutineItem(exName, note) : exName);
									getExerciseObj(exName);
								});
							} else {
								itemsForDate.push(sel.name);
								getExerciseObj(sel.name);
							}
						});
						saveData();
						renderView('home');
					}, 'add new exercise');
				});
			}

			if (itemsForDate.length > 0) {
				const homeContainer = document.createElement('div');
				itemsForDate.forEach((item, index) => {
					const itemName = getRoutineItemName(item);
					const itemNote = getHomeItemNote(item);
					const div = document.createElement('div');
					div.className = 'list-item';
					div.style.display = 'flex';
					div.style.alignItems = 'center';

					renderExerciseNameWithNote(div, itemName, itemNote);

					const rmBtn = document.createElement('button');
					rmBtn.className = 'btn-remove-sm material-icons-outlined';
					rmBtn.textContent = 'close';
					rmBtn.addEventListener('click', (e) => {
						e.stopPropagation();
						itemsForDate.splice(index, 1);
						renderView('home');
					});
					div.appendChild(rmBtn);

					div.dataset.index = index;
					div.addEventListener('click', () => {
						currentExercise = itemName;
						renderView('exercise-detail');
					});
					homeContainer.appendChild(div);
				});
				setupReorderable(homeContainer, itemsForDate, (newArr) => {
					data.home.history[logsDate] = newArr;
					renderView('home');
				});
				listContainer.appendChild(homeContainer);
				emptyState.style.display = 'none';
			} else {
				emptyState.style.display = 'block';
			}

			// Render logs summary if setting is on
			const showLogs = data.settings?.showHomeLogs !== false;
			const dayLogsContainer = content.getElementById('home-day-logs');
			if (dayLogsContainer && showLogs) {
				// Collect all logs for the viewed date across all exercises
				const todayLogs = [];
				data.exercises.forEach(ex => {
					if (ex.logs) {
						ex.logs.forEach(log => {
							if (log.date === logsDate) {
								todayLogs.push({ ex, log });
							}
						});
					}
				});

				if (todayLogs.length > 0) {
					// Group by exercise, tracking earliest timestamp for sort
					const byExercise = {};
					todayLogs.forEach(({ ex, log }) => {
						if (!byExercise[ex.name]) byExercise[ex.name] = { ex, logs: [], firstTs: Infinity };
						byExercise[ex.name].logs.push(log);
						const ts = log.ts || 0;
						if (ts < byExercise[ex.name].firstTs) byExercise[ex.name].firstTs = ts;
					});

					// Sort exercises by time of first set logged
					const sortedExercises = Object.entries(byExercise)
						.sort(([, a], [, b]) => a.firstTs - b.firstTs);

					const logsSection = document.createElement('div');
					logsSection.style.marginTop = '16px';

					const logsHeading = document.createElement('div');
					logsHeading.className = 'settings-subheading';
					logsHeading.style.marginTop = '0';
					logsHeading.style.color = 'var(--text-light)';
					logsHeading.style.display = 'flex';
					logsHeading.style.justifyContent = 'space-between';
					logsHeading.style.alignItems = 'center';
					
					const titleSpan = document.createElement('span');
					titleSpan.textContent = isViewingToday ? "today's sets" : `sets on ${logsDate}`;
					logsHeading.appendChild(titleSpan);

					// Total volume for today
					const showVolumeHome = data.settings?.showVolumeHome !== false;
					if (showVolumeHome) {
						const allLogEntries = todayLogs.map(t => t.log);
						const totalVolume = calculateLogsVolume(allLogEntries);
						if (totalVolume > 0) {
							const totalVolSpan = document.createElement('span');
							totalVolSpan.style.fontSize = '12px';
							totalVolSpan.style.fontWeight = '400';
							totalVolSpan.style.color = 'var(--text-light)';
							totalVolSpan.textContent = `total ${Math.round(totalVolume)} kg`;
							logsHeading.insertBefore(totalVolSpan, logsHeading.querySelector('.material-icons-outlined'));
						}
					}

					const copyBtn = document.createElement('span');
					copyBtn.className = 'material-icons-outlined';
					copyBtn.textContent = 'content_copy';
					copyBtn.style.fontSize = '16px';
					copyBtn.style.cursor = 'pointer';
					copyBtn.title = 'Copy to clipboard';
					copyBtn.addEventListener('click', () => {
						const dayTags = data.home.tags ? (data.home.tags[logsDate] || []) : [];
						let text = `${logsDate}\n`;
						if (dayTags.length > 0) {
							text += dayTags.map(t => `#${t}`).join(' ') + '\n';
						}
						text += '\n';

						sortedExercises.forEach(([exName, { ex, logs }]) => {
							text += `${exName}\n`;
							let workSetCount = 0;
							logs.forEach(set => {
								const setType = set.type || 's';
								let setLabel;
								if (setType === 'w') setLabel = 'W';
								else if (setType === 'p') setLabel = 'P';
								else { workSetCount++; setLabel = workSetCount.toString(); }

								let metrics = Object.entries(set.data).map(([k, v]) => `${v}${k}`).join(' ');
								if (set.data.kg !== undefined && set.data.reps !== undefined) {
									metrics = `${set.data.kg}kg x ${set.data.reps}`;
									const others = Object.entries(set.data).filter(([k]) => k !== 'kg' && k !== 'reps');
									if (others.length > 0) {
										metrics += ' ' + others.map(([k, v]) => `${v}${k}`).join(' ');
									}
								}
								
								const setTags = getSetTags(set);
								const tagsStr = setTags.length > 0 ? ' ' + setTags.map(t => `#${t}`).join(' ') : '';
								
								text += `${setLabel}. ${metrics}${tagsStr}\n`;
							});
							text += '\n';
						});

						navigator.clipboard.writeText(text.trim()).then(() => {
							const originalIcon = copyBtn.textContent;
							copyBtn.textContent = 'done';
							setTimeout(() => {
								copyBtn.textContent = originalIcon;
							}, 1500);
						});
					});
					logsHeading.appendChild(copyBtn);

					logsSection.appendChild(logsHeading);

					sortedExercises.forEach(([exName, { ex, logs }]) => {
						const exHeader = document.createElement('div');
						exHeader.className = 'day-header';
						exHeader.style.cursor = 'pointer';
						exHeader.innerHTML = `<span>${exName}</span>`;
						if (showVolumeHome) {
							const exVolume = calculateLogsVolume(logs);
							if (exVolume > 0) {
								const volSpan = document.createElement('span');
								volSpan.style.fontSize = '12px';
								volSpan.style.fontWeight = '400';
								volSpan.style.color = 'var(--text-light)';
								volSpan.textContent = `${Math.round(exVolume)} kg`;
								exHeader.appendChild(volSpan);
							}
						}
						exHeader.addEventListener('click', () => {
							currentExercise = exName;
							renderView('exercise-detail');
						});
						logsSection.appendChild(exHeader);

						let workSetCount = 0;
						logs.forEach(set => {
							const setType = set.type || 's';
							let setLabel;
							if (setType === 'w') setLabel = 'W';
							else if (setType === 'p') setLabel = 'P';
							else { workSetCount++; setLabel = workSetCount.toString(); }

							const setRow = document.createElement('div');
							setRow.className = 'set-row';

							const numSpan = document.createElement('span');
							numSpan.className = 'set-num';
							numSpan.textContent = setLabel;
							setRow.appendChild(numSpan);

							const metricsWrap = document.createElement('div');
							metricsWrap.style.display = 'flex';
							metricsWrap.style.gap = '12px';
							metricsWrap.style.flex = '1';
							metricsWrap.style.flexWrap = 'wrap';

							Object.entries(set.data).forEach(([k, v]) => {
								const s = document.createElement('span');
								s.textContent = `${v} ${k}`;
								metricsWrap.appendChild(s);
							});

							setRow.appendChild(metricsWrap);
							logsSection.appendChild(setRow);
						});
					});

					dayLogsContainer.appendChild(logsSection);
				}
			}
		} else if (viewName === 'programs') {
			const listContainer = content.getElementById('programs-list');
			const emptyState = content.getElementById('programs-empty');

			const mainAddBtn = content.querySelector('.main-add-row .btn-add');
			if (mainAddBtn) {
				mainAddBtn.addEventListener('click', () => {
					emptyState.style.display = 'none';
					renderInlineAdd(listContainer, (name) => {
						data.programs.push({ name: name, items: [] });
						renderView('programs');
					}, () => renderView('programs'));
				});
			}

			if (data.programs.length > 0) {
				const sortedProgs = [...data.programs].sort((a, b) => a.name.localeCompare(b.name));
				sortedProgs.forEach(prog => {
					const progContainer = document.createElement('div');

					const header = document.createElement('div');
					header.className = 'list-header';
					const isProgCollapsed = prog.isCollapsed || false;
					header.innerHTML = `
						<span class="material-icons-outlined collapse-toggle" style="font-size:18px; cursor:pointer; margin-right:4px;">${isProgCollapsed ? 'chevron_right' : 'expand_more'}</span>
						<span class="list-header-title" style="cursor: pointer; flex:1">${prog.name}</span> 
						<div style="display:flex">
							<button class="btn-add-sm">+</button>
							<button class="btn-remove-sm material-icons-outlined">close</button>
						</div>
					`;
					progContainer.appendChild(header);

					header.querySelector('.collapse-toggle').addEventListener('click', () => {
						prog.isCollapsed = !isProgCollapsed;
						saveData();
						renderView('programs');
					});

					const titleSpan = header.querySelector('.list-header-title');
					titleSpan.addEventListener('click', () => {
						prog.isCollapsed = !isProgCollapsed;
						saveData();
						renderView('programs');
					});
					addLongPressListener(titleSpan, () => {
						renderInlineRename(titleSpan, prog.name, (newName) => {
							renameProgram(prog.name, newName);
							renderView('programs');
						});
					});

					const headerRmBtn = header.querySelector('.btn-remove-sm');
					headerRmBtn.addEventListener('click', () => {
						showConfirm(`Delete program "${prog.name}"?`).then(confirmed => {
							if (confirmed) {
								data.programs = data.programs.filter(p => p.name !== prog.name);
								renderView('programs');
							}
						});
					});

					const headerBtn = header.querySelector('.btn-add-sm');
					headerBtn.addEventListener('click', () => {
						openSelectionDialog(`Add routine to "${prog.name}"`, data.routines.map(r => r.name), (selection) => {
							const names = Array.isArray(selection) ? selection : [selection];
							names.forEach(name => {
								if (name) {
									prog.items.push(name);
									if (!data.routines.find(r => r.name === name)) {
										data.routines.push({ name: name, items: [] });
									}
								}
							});
							saveData();
							renderView('programs');
						});
					});

					const routinesContainer = document.createElement('div');
					if (isProgCollapsed) routinesContainer.style.display = 'none';
					prog.items.forEach((routineName, index) => {
						const rWrapper = document.createElement('div');
						rWrapper.dataset.index = index;

						let rout = data.routines.find(r => r.name === routineName);
						if (!rout) {
							rout = { name: routineName, items: [] };
							data.routines.push(rout);
						}

						const rHeader = document.createElement('div');
						rHeader.className = 'list-header';
						rHeader.style.marginTop = '8px';
						rHeader.style.paddingLeft = '24px';
						if (!prog.collapsedRoutines) prog.collapsedRoutines = [];
						const isRoutCollapsed = prog.collapsedRoutines.includes(routineName);
						rHeader.innerHTML = `
							<span class="material-icons-outlined collapse-toggle" style="font-size:16px; cursor:pointer; margin-right:4px;">${isRoutCollapsed ? 'chevron_right' : 'expand_more'}</span>
							<span class="list-header-title" style="flex:1">${routineName}</span> 
							<div style="display:flex">
								<button class="btn-add-sm">+</button>
								<button class="btn-remove-sm material-icons-outlined">close</button>
							</div>
						`;
						rWrapper.appendChild(rHeader);

						const toggleRoutCollapse = () => {
							if (isRoutCollapsed) {
								prog.collapsedRoutines = prog.collapsedRoutines.filter(n => n !== routineName);
							} else {
								prog.collapsedRoutines.push(routineName);
							}
							saveData();
							renderView('programs');
						};

						rHeader.querySelector('.collapse-toggle').addEventListener('click', toggleRoutCollapse);

						const rTitle = rHeader.querySelector('.list-header-title');
						rTitle.style.cursor = 'pointer';
						rTitle.addEventListener('click', toggleRoutCollapse);

						const rRmBtn = rHeader.querySelector('.btn-remove-sm');
						rRmBtn.addEventListener('click', (e) => {
							e.stopPropagation();
							showConfirm(`Remove routine "${routineName}" from program?`).then(confirmed => {
								if (confirmed) {
									prog.items.splice(index, 1);
									renderView('programs');
								}
							});
						});

						const rHeaderBtn = rHeader.querySelector('.btn-add-sm');
						rHeaderBtn.addEventListener('click', () => {
							openSelectionDialog(`Add exercise to "${routineName}"`, data.exercises.map(e => e.name), (selection) => {
								const names = Array.isArray(selection) ? selection : [selection];
								names.forEach(name => {
									if (name) {
										rout.items.push(name);
										if (!data.exercises.find(e => e.name === name)) {
											getExerciseObj(name);
										}
									}
								});
								saveData();
								renderView('programs');
							});
						});

						const rItems = document.createElement('div');
						if (isRoutCollapsed) rItems.style.display = 'none';
						rout.items.forEach((routineItem, exIndex) => {
							const exName = getRoutineItemName(routineItem);
							const exNote = getRoutineItemNote(rout, exIndex);
							const div = document.createElement('div');
							div.className = 'list-item';
							div.style.display = 'flex';
							div.style.alignItems = 'center';

							renderExerciseNameWithNote(div, exName, exNote, 'right');

							if (data.settings?.showRoutineNoteIcons !== false) {
								const noteBtn = document.createElement('button');
								noteBtn.className = 'btn-remove-sm material-icons-outlined';
								noteBtn.textContent = exNote ? 'edit_note' : 'note_add';
								noteBtn.title = exNote ? 'Edit routine note' : 'Add routine note';
								noteBtn.addEventListener('click', (e) => {
									e.stopPropagation();
									showPrompt(`Routine note for "${exName}" (e.g. 5 sets x 10 reps):`, exNote).then(note => {
										if (note !== null) {
											setRoutineItemNote(rout, exIndex, note);
											saveData();
											renderView('programs');
										}
									});
								});
								div.appendChild(noteBtn);
							}

							const rmBtn = document.createElement('button');
							rmBtn.className = 'btn-remove-sm material-icons-outlined';
							rmBtn.textContent = 'close';
							rmBtn.addEventListener('click', (e) => {
								e.stopPropagation();
								showConfirm(`Remove exercise "${exName}" from routine?`).then(confirmed => {
									if (confirmed) {
										removeRoutineItem(rout, exIndex);
										renderView('programs');
									}
								});
							});
							div.appendChild(rmBtn);

							div.addEventListener('click', () => {
								currentExercise = exName;
								renderView('exercise-detail');
							});
							rItems.appendChild(div);
						});

						rWrapper.appendChild(rItems);
						routinesContainer.appendChild(rWrapper);
					});

					setupReorderable(routinesContainer, prog.items, (newArr) => {
						prog.items = newArr;
						renderView('programs');
					});

					progContainer.appendChild(routinesContainer);
					listContainer.appendChild(progContainer);
				});
				emptyState.style.display = 'none';
			} else {
				emptyState.style.display = 'block';
			}
		} else if (viewName === 'routines') {
			const listContainer = content.getElementById('routines-list');
			const emptyState = content.getElementById('routines-empty');

			const mainAddBtn = content.querySelector('.main-add-row .btn-add');
			if (mainAddBtn) {
				mainAddBtn.addEventListener('click', () => {
					emptyState.style.display = 'none';
					renderInlineAdd(listContainer, (name) => {
						if (!data.routines.find(r => r.name === name)) {
							data.routines.push({ name: name, items: [] });
						}
						renderView('routines');
					}, () => renderView('routines'));
				});
			}

			if (data.routines.length > 0) {
				const sortedRouts = [...data.routines].sort((a, b) => a.name.localeCompare(b.name));
				sortedRouts.forEach(rout => {
					const routContainer = document.createElement('div');

					const header = document.createElement('div');
					header.className = 'list-header';
					const isCollapsed = rout.isCollapsed || false;
					header.innerHTML = `
						<span class="material-icons-outlined collapse-toggle" style="font-size:18px; cursor:pointer; margin-right:4px;">${isCollapsed ? 'chevron_right' : 'expand_more'}</span>
						<span class="list-header-title" style="cursor: pointer; flex:1">${rout.name}</span> 
						<div style="display:flex">
							<button class="btn-add-sm">+</button>
							<button class="btn-remove-sm material-icons-outlined">close</button>
						</div>
					`;
					routContainer.appendChild(header);

					header.querySelector('.collapse-toggle').addEventListener('click', () => {
						rout.isCollapsed = !isCollapsed;
						saveData();
						renderView('routines');
					});

					const titleSpan = header.querySelector('.list-header-title');
					titleSpan.addEventListener('click', () => {
						rout.isCollapsed = !isCollapsed;
						saveData();
						renderView('routines');
					});
					addLongPressListener(titleSpan, () => {
						renderInlineRename(titleSpan, rout.name, (newName) => {
							renameRoutine(rout.name, newName);
							renderView('routines');
						});
					});

					const headerRmBtn = header.querySelector('.btn-remove-sm');
					headerRmBtn.addEventListener('click', () => {
						showConfirm(`Delete routine "${rout.name}" completely?`).then(confirmed => {
							if (confirmed) {
								data.routines = data.routines.filter(r => r.name !== rout.name);
								data.programs.forEach(p => {
									p.items = p.items.filter(rName => rName !== rout.name);
								});
								renderView('routines');
							}
						});
					});

					const headerBtn = header.querySelector('.btn-add-sm');
					headerBtn.addEventListener('click', () => {
						openSelectionDialog(`Add exercise to "${rout.name}"`, data.exercises.map(e => e.name), (selection) => {
							const names = Array.isArray(selection) ? selection : [selection];
							names.forEach(name => {
								if (name) {
									rout.items.push(name);
									if (!data.exercises.find(e => e.name === name)) {
										getExerciseObj(name);
									}
								}
							});
							saveData();
							renderView('routines');
						});
					});

					const itemsContainer = document.createElement('div');
					if (isCollapsed) itemsContainer.style.display = 'none';
					rout.items.forEach((item, index) => {
						const itemName = getRoutineItemName(item);
						const itemNote = getRoutineItemNote(rout, index);
						const div = document.createElement('div');
						div.className = 'list-item';
						div.style.display = 'flex';
						div.style.alignItems = 'center';

						renderExerciseNameWithNote(div, itemName, itemNote, 'right');

						if (data.settings?.showRoutineNoteIcons !== false) {
							const noteBtn = document.createElement('button');
							noteBtn.className = 'btn-remove-sm material-icons-outlined';
							noteBtn.textContent = itemNote ? 'edit_note' : 'note_add';
							noteBtn.title = itemNote ? 'Edit routine note' : 'Add routine note';
							noteBtn.addEventListener('click', (e) => {
								e.stopPropagation();
								showPrompt(`Routine note for "${itemName}" (e.g. 5 sets x 10 reps):`, itemNote).then(note => {
									if (note !== null) {
										setRoutineItemNote(rout, index, note);
										saveData();
										renderView('routines');
									}
								});
							});
							div.appendChild(noteBtn);
						}

						const rmBtn = document.createElement('button');
						rmBtn.className = 'btn-remove-sm material-icons-outlined';
						rmBtn.textContent = 'close';
						rmBtn.addEventListener('click', (e) => {
							e.stopPropagation();
							showConfirm(`Remove exercise "${itemName}" from routine?`).then(confirmed => {
								if (confirmed) {
									removeRoutineItem(rout, index);
									renderView('routines');
								}
							});
						});
						div.appendChild(rmBtn);

						div.dataset.index = index;
						div.addEventListener('click', () => {
							currentExercise = itemName;
							renderView('exercise-detail');
						});
						itemsContainer.appendChild(div);
					});

					setupReorderable(itemsContainer, rout.items, (newArr, oldIndexes) => {
						reorderRoutineItemNotes(rout, oldIndexes);
						rout.items = newArr;
						renderView('routines');
					});

					routContainer.appendChild(itemsContainer);
					listContainer.appendChild(routContainer);
				});
				emptyState.style.display = 'none';
			} else {
				emptyState.style.display = 'block';
			}
		} else if (viewName === 'exercises') {
			const listContainer = content.getElementById('exercises-list');
			const searchInput = content.getElementById('exercises-search');
			const emptyState = content.getElementById('exercises-empty');

			const mainAddBtn = content.querySelector('.main-add-row .btn-add');
			if (mainAddBtn) {
				mainAddBtn.addEventListener('click', () => {
					emptyState.style.display = 'none';
					renderInlineAdd(listContainer, (name) => {
						if (!data.exercises.find(e => e.name === name)) {
							getExerciseObj(name);
						}
						renderView('exercises');
					}, () => renderView('exercises'));
				});
			}

			const renderExercisesList = () => {
				listContainer.innerHTML = '';

				if (data.exercises.length > 0) {
					const searchTerm = exerciseSearchTerm;
					const sorted = [...data.exercises]
						.filter(item => searchMatches(item.name, searchTerm))
						.sort((a, b) => a.name.localeCompare(b.name));

					if (sorted.length === 0) {
						emptyState.textContent = 'no matching exercises';
						emptyState.style.display = 'block';
						return;
					}

					sorted.forEach(item => {
						const div = document.createElement('div');
						div.className = 'list-item';
						div.style.display = 'flex';
						div.style.alignItems = 'center';

						const textSpan = document.createElement('span');
						textSpan.style.flex = '1';
						textSpan.textContent = item.name;
						textSpan.style.cursor = 'pointer';
						div.appendChild(textSpan);

						addLongPressListener(textSpan, () => {
							renderInlineRename(textSpan, item.name, (newName) => {
								renameExercise(item.name, newName);
								renderView('exercises');
							});
						});

						const rmBtn = document.createElement('button');
						rmBtn.className = 'btn-remove-sm material-icons-outlined';
						rmBtn.textContent = 'close';
						rmBtn.addEventListener('click', (e) => {
							e.stopPropagation();
							showConfirm(`Delete exercise "${item.name}" completely?`).then(confirmed => {
								if (confirmed) {
									data.exercises = data.exercises.filter(ex => ex.name !== item.name);
									data.routines.forEach(r => {
										r.items = r.items.filter(exItem => getRoutineItemName(exItem) !== item.name);
									});
									renderView('exercises');
								}
							});
						});
						div.appendChild(rmBtn);

						div.addEventListener('click', () => {
							currentExercise = item.name;
							renderView('exercise-detail');
						});
						listContainer.appendChild(div);
					});
					emptyState.style.display = 'none';
				} else {
					emptyState.textContent = 'add exercise to begin';
					emptyState.style.display = 'block';
				}
			};

			searchInput.value = exerciseSearchTerm;
			searchInput.addEventListener('input', () => {
				exerciseSearchTerm = searchInput.value;
				renderExercisesList();
			});
			renderExercisesList();
		} else if (viewName === 'exercise-detail') {
			// No detail header to update here anymore, handled globally
			const exObj = getExerciseObj(currentExercise);
			let dataTagFilters = {}; // tag -> 'include' | 'exclude'

			// Tab switching logic
			const tabLinks = content.querySelectorAll('.d-nav-link');
			const tabLogs = content.getElementById('tab-logs');
			const tabNotes = content.getElementById('tab-notes');
			const tabData = content.getElementById('tab-data');

			tabLinks.forEach(link => {
				link.addEventListener('click', (e) => {
					e.preventDefault();
					tabLinks.forEach(l => l.classList.remove('active'));
					link.classList.add('active');

					if (link.dataset.tab === 'logs') {
						tabLogs.style.display = 'block';
						tabNotes.style.display = 'none';
						tabData.style.display = 'none';
					} else if (link.dataset.tab === 'notes') {
						tabLogs.style.display = 'none';
						tabNotes.style.display = 'block';
						tabData.style.display = 'none';
						resizeNotesTextareas(tabNotes);
					} else if (link.dataset.tab === 'data') {
						tabLogs.style.display = 'none';
						tabNotes.style.display = 'none';
						tabData.style.display = 'block';
						renderDataTab();
					} else {
						tabLogs.style.display = 'none';
						tabNotes.style.display = 'none';
						tabData.style.display = 'none';
					}
				});
			});

			function renderDataTab() {
				const recordsList = document.getElementById('exercise-records-list');
				const statsList = document.getElementById('exercise-stats-list');
				const strengthStandardsSection = document.getElementById('exercise-strength-standards');
				const filterContainer = document.getElementById('exercise-data-filters');
				const copyLogsContainer = document.getElementById('exercise-copy-logs');
				if (!recordsList || !statsList || !strengthStandardsSection) return;

				recordsList.innerHTML = '';
				strengthStandardsSection.innerHTML = '';
				statsList.innerHTML = '';
				if (copyLogsContainer) copyLogsContainer.innerHTML = '';

				// Tag filtering UI
				if (filterContainer) {
					filterContainer.innerHTML = '';
					const allTags = new Set();
					exObj.logs.forEach(log => {
						getSetTags(log).forEach(t => allTags.add(t));
					});

					if (allTags.size > 0) {
						filterContainer.style.display = 'flex';
						filterContainer.style.flexWrap = 'wrap';
						filterContainer.style.gap = '6px';
						filterContainer.style.marginBottom = '16px';
						filterContainer.style.paddingBottom = '8px';
						filterContainer.style.borderBottom = '1px solid var(--border-color)';

						const sortedTags = Array.from(allTags).sort();
						sortedTags.forEach(tag => {
							const tagEl = document.createElement('span');
							const state = dataTagFilters[tag]; // 'include', 'exclude' or undefined
							tagEl.textContent = state === 'exclude' ? `-${tag}` : `#${tag}`;
							tagEl.style.fontSize = '12px';
							tagEl.style.padding = '2px 8px';
							tagEl.style.borderRadius = '12px';
							tagEl.style.border = '1px solid var(--border-color)';
							tagEl.style.cursor = 'pointer';
							tagEl.style.userSelect = 'none';

							if (state === 'include') {
								tagEl.style.backgroundColor = 'var(--primary-color)';
								tagEl.style.borderColor = 'var(--primary-color)';
								tagEl.style.fontWeight = '600';
							} else if (state === 'exclude') {
								tagEl.style.backgroundColor = 'var(--btn-secondary-bg)';
								tagEl.style.borderColor = 'var(--btn-secondary-bg)';
								tagEl.style.fontWeight = '600';
							}

							tagEl.addEventListener('click', () => {
								if (!state) {
									dataTagFilters[tag] = 'include';
								} else if (state === 'include') {
									dataTagFilters[tag] = 'exclude';
								} else {
									delete dataTagFilters[tag];
								}
								renderDataTab();
							});
							filterContainer.appendChild(tagEl);
						});

						if (Object.keys(dataTagFilters).length > 0) {
							const clearBtn = document.createElement('span');
							clearBtn.textContent = 'clear';
							clearBtn.style.fontSize = '12px';
							clearBtn.style.color = 'var(--text-light)';
							clearBtn.style.cursor = 'pointer';
							clearBtn.style.padding = '2px 4px';
							clearBtn.style.textDecoration = 'underline';
							clearBtn.addEventListener('click', () => {
								dataTagFilters = {};
								renderDataTab();
							});
							filterContainer.appendChild(clearBtn);
						}
					} else {
						filterContainer.style.display = 'none';
					}
				}

				// Copy exercise logs button
				if (copyLogsContainer) {
					const copyBtn = document.createElement('div');
					copyBtn.className = 'list-item';
					copyBtn.style.display = 'flex';
					copyBtn.style.justifyContent = 'space-between';
					copyBtn.style.alignItems = 'center';
					copyBtn.style.cursor = 'pointer';

					const label = document.createElement('span');
					label.textContent = 'copy exercise logs';
					copyBtn.appendChild(label);

					const icon = document.createElement('span');
					icon.className = 'material-icons-outlined';
					icon.textContent = 'content_copy';
					icon.style.fontSize = '20px';
					copyBtn.appendChild(icon);

					copyBtn.addEventListener('click', () => {
						let text = `${currentExercise}\n`;
						const exerciseLogs = [...exObj.logs].sort((a, b) => {
							const da = a.date.split('-').reverse().join('');
							const db = b.date.split('-').reverse().join('');
							return da.localeCompare(db) || a.order - b.order;
						});

						let currentDate = '';
						let workSetCount = 0;
						exerciseLogs.forEach(set => {
							if (set.date !== currentDate) {
								currentDate = set.date;
								text += `\n${currentDate}\n`;
								workSetCount = 0;
							}
							const setType = set.type || 's';
							let setLabel;
							if (setType === 'w') setLabel = 'W';
							else if (setType === 'p') setLabel = 'P';
							else { workSetCount++; setLabel = workSetCount.toString(); }

							let metrics = Object.entries(set.data).map(([k, v]) => `${v}${k}`).join(' ');
							if (set.data.kg !== undefined && set.data.reps !== undefined) {
								metrics = `${set.data.kg}kg x ${set.data.reps}`;
								const others = Object.entries(set.data).filter(([k]) => k !== 'kg' && k !== 'reps');
								if (others.length > 0) {
									metrics += ' ' + others.map(([k, v]) => `${v}${k}`).join(' ');
								}
							}

							const setTags = getSetTags(set);
							const tagsStr = setTags.length > 0 ? ' ' + setTags.map(t => `#${t}`).join(' ') : '';

							text += `${setLabel}. ${metrics}${tagsStr}\n`;
						});

						navigator.clipboard.writeText(text.trim()).then(() => {
							const originalIcon = icon.textContent;
							icon.textContent = 'done';
							setTimeout(() => {
								icon.textContent = originalIcon;
							}, 1500);
						});
					});

					copyLogsContainer.appendChild(copyBtn);
				}

				let workingLogs = exObj.logs.filter(log => log.type !== 'w' && log.type !== 'p');
				
				const includeTags = Object.entries(dataTagFilters).filter(([t, state]) => state === 'include').map(([t]) => t);
				const excludeTags = Object.entries(dataTagFilters).filter(([t, state]) => state === 'exclude').map(([t]) => t);

				if (includeTags.length > 0) {
					workingLogs = workingLogs.filter(log => {
						const logTags = getSetTags(log);
						return includeTags.every(t => logTags.includes(t));
					});
				}
				if (excludeTags.length > 0) {
					workingLogs = workingLogs.filter(log => {
						const logTags = getSetTags(log);
						return !excludeTags.some(t => logTags.includes(t));
					});
				}

				if (workingLogs.length === 0) {
					const hasFilters = Object.keys(dataTagFilters).length > 0;
					recordsList.innerHTML = `<div class="empty-state-row" style="border:none">${hasFilters ? 'no data matching filters' : 'no working sets recorded'}</div>`;
				}

				let heaviestWeight = 0;
				let heaviestWeightLog = null;
				let heaviestWeightReps = 1;
				let best1RM = 0;
				let best1RMLog = null;
				let bestSetVolume = 0;
				let bestSetVolumeLog = null;
				let bestSessionVolume = 0;
				let bestSessionVolumeDate = null;

				let totalVolume = 0;
				let totalSets = workingLogs.length;

				const sessionVolumes = {}; // date -> total volume

				workingLogs.forEach(log => {
					const w = parseFloat(log.data.kg);
					const r = parseInt(log.data.reps, 10);

					if (!isNaN(w)) {
						if (w > heaviestWeight) {
							heaviestWeight = w;
							heaviestWeightLog = log;
							heaviestWeightReps = !isNaN(r) ? r : 1;
						}

						if (!isNaN(r) && r > 0) {
							const vol = w * r;
							totalVolume += vol;
							if (vol > bestSetVolume) {
								bestSetVolume = vol;
								bestSetVolumeLog = log;
							}

							const oneRM = calculateOneRM(w, r);
							if (oneRM > best1RM) {
								best1RM = oneRM;
								best1RMLog = log;
							}

							sessionVolumes[log.date] = (sessionVolumes[log.date] || 0) + vol;
						}
					}
				});

				Object.entries(sessionVolumes).forEach(([date, v]) => {
					if (v > bestSessionVolume) {
						bestSessionVolume = v;
						bestSessionVolumeDate = date;
					}
				});

				const createRecordItem = (label, value, log, date) => {
					const div = document.createElement('div');
					div.className = 'list-item';
					div.style.display = 'flex';
					div.style.flexDirection = 'column';
					div.style.alignItems = 'stretch';
					div.style.cursor = 'default';

					let subText = '';
					if (log) {
						const details = Object.entries(log.data).map(([k, v]) => `${v}${k}`).join(' ');
						subText = `<div style="font-size:11px; color:var(--text-light); text-align:left; margin-top:2px;">${details} on ${log.date}</div>`;
					} else if (date) {
						subText = `<div style="font-size:11px; color:var(--text-light); text-align:left; margin-top:2px;">on ${date}</div>`;
					}

					div.innerHTML = `
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span>${label}</span>
                    <span style="font-weight:600">${value}</span>
                </div>
                ${subText}
              `;
					return div;
				};

				const createStatItem = (label, value) => {
					const div = document.createElement('div');
					div.className = 'list-item';
					div.style.display = 'flex';
					div.style.justifyContent = 'space-between';
					div.style.cursor = 'default';
					div.innerHTML = `<span>${label}</span><span style="font-weight:600">${value}</span>`;
					return div;
				};

				recordsList.appendChild(createRecordItem('heaviest weight', heaviestWeight > 0 ? `${heaviestWeight} kg` : '-', heaviestWeightLog));
				recordsList.appendChild(createRecordItem('best 1rm', best1RM > 0 ? `${Math.round(best1RM)} kg` : '-', best1RMLog));
				recordsList.appendChild(createRecordItem('best set volume', bestSetVolume > 0 ? `${Math.round(bestSetVolume)} kg` : '-', bestSetVolumeLog));
				recordsList.appendChild(createRecordItem('best session volume', bestSessionVolume > 0 ? `${Math.round(bestSessionVolume)} kg` : '-', null, bestSessionVolumeDate));

				const renderStrengthStandards = () => {
					const standards = exObj.strengthStandards || {};
					const levels = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'];

					const header = document.createElement('div');
					header.className = 'settings-subheading';
					header.style.display = 'flex';
					header.style.alignItems = 'center';
					header.style.justifyContent = 'space-between';
					header.style.cursor = 'pointer';
					header.textContent = 'strength standards';

					const icon = document.createElement('span');
					icon.className = 'material-icons-outlined settings-collapse-icon';
					icon.textContent = 'chevron_right';
					header.appendChild(icon);

					const graphWrapper = document.createElement('div');
					graphWrapper.className = 'strength-standard-graph-wrapper';
					strengthStandardsSection.appendChild(header);
					strengthStandardsSection.appendChild(graphWrapper);

					const body = document.createElement('div');
					body.className = 'strength-standards-body';
					body.style.display = 'none';

					header.addEventListener('click', () => {
						const expanded = body.style.display !== 'none';
						body.style.display = expanded ? 'none' : '';
						icon.textContent = expanded ? 'chevron_right' : 'expand_more';
					});

					const bestRow = document.createElement('div');
					bestRow.className = 'list-item';
					bestRow.style.display = 'flex';
					bestRow.style.justifyContent = 'space-between';
					bestRow.style.alignItems = 'center';
					bestRow.innerHTML = `
						<span style="font-weight:600">best 1rm</span>
						<span style="font-weight:600">${best1RM > 0 ? `${Math.round(best1RM)} kg` : '-'}</span>
					`;
					body.appendChild(bestRow);

					levels.forEach(level => {
						const row = document.createElement('div');
						row.className = 'list-item';
						row.style.display = 'flex';
						row.style.justifyContent = 'space-between';
						row.style.alignItems = 'center';
						row.style.gap = '12px';

						const label = document.createElement('span');
						label.textContent = level;
						
						const input = document.createElement('input');
						input.type = 'number';
						input.className = 'val-input';
						input.style.width = '80px';
						input.style.textAlign = 'right';
						input.placeholder = 'kg';
						input.value = standards[level] !== undefined ? standards[level] : '';
						input.addEventListener('input', () => {
							const value = input.value.trim();
							if (value === '') {
								delete exObj.strengthStandards[level];
							} else {
								exObj.strengthStandards[level] = parseFloat(value);
							}
							renderStandardGraph(graphWrapper, best1RM, levels, exObj.strengthStandards || {});
							saveData();
						});

						const suffix = document.createElement('span');
						suffix.className = 'unit';
						suffix.textContent = 'kg';

						const rightWrap = document.createElement('div');
						rightWrap.style.display = 'flex';
						rightWrap.style.alignItems = 'center';
						rightWrap.style.gap = '8px';
						rightWrap.appendChild(input);
						rightWrap.appendChild(suffix);

						row.appendChild(label);
						row.appendChild(rightWrap);
						body.appendChild(row);
					});

					strengthStandardsSection.appendChild(body);
					renderStandardGraph(graphWrapper, best1RM, levels, standards);
				};

				function renderStandardGraph(wrapper, best1RMValue, levels, standards) {
					wrapper.innerHTML = '';

					const entries = levels
						.map(level => ({ level, value: parseFloat(standards[level]) }))
						.filter(entry => !isNaN(entry.value))
						.sort((a, b) => a.value - b.value);

					const graph = document.createElement('div');
					graph.className = 'strength-standard-graph';

					const line = document.createElement('div');
					line.className = 'strength-standard-line';
					graph.appendChild(line);

					if (entries.length === 0) {
						const placeholder = document.createElement('div');
						placeholder.className = 'strength-standard-placeholder';
						placeholder.textContent = 'enter strength standards to display the 1d graph.';
						wrapper.appendChild(placeholder);
						return;
					}

					const minValue = entries[0].value;
					const maxValue = entries[entries.length - 1].value;
					const range = Math.max(1, maxValue - minValue);

					const markers = [];
					entries.forEach(entry => {
						const marker = document.createElement('div');
						marker.className = 'strength-standard-marker';
						marker.style.left = `${((entry.value - minValue) / range) * 100}%`;
						marker.title = `${entry.level}: ${entry.value} kg`;

						const label = document.createElement('span');
						label.className = 'strength-standard-label';
						label.textContent = entry.level;

						const weightLabel = document.createElement('span');
						weightLabel.className = 'strength-standard-weight';
						weightLabel.textContent = `${Math.round(entry.value)} kg`;

						marker.appendChild(label);
						marker.appendChild(weightLabel);
						line.appendChild(marker);
						markers.push(marker);
					});

					let bestPosition = null;
					if (best1RMValue > 0) {
						const bestMarker = document.createElement('div');
						bestMarker.className = 'strength-standard-best-marker';
						bestPosition = Math.min(100, Math.max(0, ((best1RMValue - minValue) / range) * 100));
						bestMarker.style.left = `${bestPosition}%`;
						bestMarker.title = `best 1rm: ${Math.round(best1RMValue)} kg`;
						line.appendChild(bestMarker);
					}

					if (bestPosition !== null) {
						markers.forEach(marker => {
							const pos = parseFloat(marker.style.left);
							if (Math.abs(pos - bestPosition) < 6) {
								marker.classList.add('strength-standard-hide-text');
							}
						});
					}

					wrapper.appendChild(graph);
				}

				renderStrengthStandards();


				statsList.appendChild(createStatItem('total volume', `${Math.round(totalVolume)} kg`));
				statsList.appendChild(createStatItem('total sets', totalSets));
				statsList.appendChild(createStatItem('total sessions', Object.keys(sessionVolumes).length));

				// Additional metrics
				let totalWeightSum = 0;
				let totalRepsSum = 0;
				let setsWithWeights = 0;
				let setsWithReps = 0;
				let lastDate = null;

				workingLogs.forEach(log => {
					const w = parseFloat(log.data.kg);
					const r = parseInt(log.data.reps, 10);
					if (!isNaN(w)) {
						totalWeightSum += w;
						setsWithWeights++;
					}
					if (!isNaN(r)) {
						totalRepsSum += r;
						setsWithReps++;
					}
				});

				if (workingLogs.length > 0) {
					const sortedLogs = [...workingLogs].sort((a, b) => {
						const da = a.date.split('-').reverse().join('');
						const db = b.date.split('-').reverse().join('');
						return db.localeCompare(da);
					});
					lastDate = sortedLogs[0].date;
				}

				if (setsWithWeights > 0) {
					statsList.appendChild(createStatItem('average weight', `${(totalWeightSum / setsWithWeights).toFixed(1)} kg`));
				}
				if (setsWithReps > 0) {
					statsList.appendChild(createStatItem('average reps', (totalRepsSum / setsWithReps).toFixed(1)));
				}
				if (lastDate) {
					statsList.appendChild(createStatItem('last workout', lastDate));
				}

				// 1RM Table Section
				const oneRMSection = document.getElementById('exercise-1rm-section');
				if (oneRMSection) {
					oneRMSection.innerHTML = '';

					// Determine the best 1RM log entry to prefill the table
					let baseWeight = heaviestWeight;
					let baseReps = heaviestWeightReps;
					if (best1RMLog) {
						const bw = parseFloat(best1RMLog.data.kg);
						const br = parseInt(best1RMLog.data.reps, 10);
						if (!isNaN(bw) && !isNaN(br) && br > 0) {
							baseWeight = bw;
							baseReps = br;
						}
					}

					const inputRow = document.createElement('div');
					inputRow.className = 'set-row'; // Use set-row instead of list-item to avoid user-select: none
					inputRow.style.display = 'flex';
					inputRow.style.justifyContent = 'space-between';
					inputRow.style.alignItems = 'center';
					inputRow.style.cursor = 'default';
					inputRow.style.padding = '10px 0';
					inputRow.style.borderBottom = '1px solid var(--border-color)';
					inputRow.innerHTML = `
						<div style="display:flex; flex-direction:column; gap:2px;">
							<span>input base</span>
							<span style="font-size:10px; color:var(--text-light)">weight & reps</span>
						</div>
						<div style="display:flex; align-items:center; gap:8px;">
							<input type="number" id="base-weight-input" class="val-input is-prefilled" style="width: 50px; text-align: right;" value="${Math.round(baseWeight)}" placeholder="${Math.round(baseWeight)}" inputmode="decimal">
							<span class="unit">kg</span>
							<span style="color:var(--text-light); font-size:12px;">x</span>
							<input type="number" id="base-reps-input" class="val-input is-prefilled" style="width: 40px; text-align: right;" value="${baseReps}" placeholder="${baseReps}" inputmode="numeric">
							<span class="unit">reps</span>
						</div>
					`;
					oneRMSection.appendChild(inputRow);

					const tableContainer = document.createElement('div');
					tableContainer.style.marginTop = '8px';
				tableContainer.style.maxHeight = '300px';
				tableContainer.style.overflowY = 'auto';
				oneRMSection.appendChild(tableContainer);

				const renderTable = (baseWeight) => {
					tableContainer.innerHTML = '';
					const table = document.createElement('table');
					table.style.width = '100%';
					table.style.borderCollapse = 'collapse';
					table.style.fontSize = '14px';

					const tbody = document.createElement('tbody');
					for (let i = 1; i <= 25; i++) {
						const row = document.createElement('tr');
						row.style.borderBottom = '1px solid var(--border-color)';

						const cellRM = document.createElement('td');
						cellRM.style.padding = '8px 0';
						cellRM.style.width = '33.33%';
						cellRM.style.textAlign = 'left';
						cellRM.style.color = 'var(--text-light)';
						cellRM.textContent = `${i}`;

						const weight = calculateWeightForReps(baseWeight, i);
						const cellWeight = document.createElement('td');
						cellWeight.style.padding = '8px 0';
						cellWeight.style.width = '33.33%';
						cellWeight.style.textAlign = 'center';
						cellWeight.textContent = `${Math.round(weight)} kg`;
						
						const percentage = (weight / baseWeight) * 100;
						const cellPercentage = document.createElement('td');
						cellPercentage.style.padding = '8px 0';
						cellPercentage.style.width = '33.34%';
						cellPercentage.style.textAlign = 'right';
						cellPercentage.textContent = `${Math.round(percentage)}%`;
						
						row.appendChild(cellRM);
						row.appendChild(cellWeight);
						row.appendChild(cellPercentage);
						tbody.appendChild(row);
					}
					table.appendChild(tbody);
					tableContainer.appendChild(table);
				};

					const current1RM = calculateOneRM(baseWeight, baseReps);
					renderTable(current1RM);

					const weightInput = inputRow.querySelector('#base-weight-input');
					const repsInput = inputRow.querySelector('#base-reps-input');
					
					[weightInput, repsInput].forEach(inp => {
						inp.addEventListener('input', () => {
							inp.classList.remove('is-prefilled');
							updateTable();
						});
						inp.addEventListener('focus', () => inp.select());
					});
					
					const updateTable = () => {
						const w = parseFloat(weightInput.value);
						const r = parseInt(repsInput.value, 10);
						if (!isNaN(w) && w >= 0 && !isNaN(r) && r > 0) {
							const calculated1RM = calculateOneRM(w, r);
							renderTable(calculated1RM);
						} else {
							tableContainer.innerHTML = '';
						}
					};

					weightInput.addEventListener('input', updateTable);
					repsInput.addEventListener('input', updateTable);
				}
			}

			function resizeNotesTextareas(scope) {
				scope.querySelectorAll('textarea').forEach(area => {
					area.style.height = '24px';
					area.style.height = Math.max(24, area.scrollHeight) + 'px';
				});
			}

			function renderVisibleRoutineNotes() {
				const entries = getRoutineEntriesForExercise(currentExercise);
				const notesArea = tabNotes.querySelector('.notes-textarea');
				if (!notesArea) return;

				const existing = tabNotes.querySelector('.visible-routine-notes');
				if (existing) existing.remove();

				if (entries.length === 0) return;

				const section = document.createElement('div');
				section.className = 'visible-routine-notes';

				const heading = document.createElement('div');
				heading.className = 'settings-subheading';
				heading.style.marginTop = '0';
				heading.textContent = 'visible notes';
				section.appendChild(heading);

				entries.forEach(({ routine, index }) => {
					const row = document.createElement('div');
					row.className = 'visible-note-row';

					const label = document.createElement('div');
					label.className = 'visible-note-routine';
					const duplicateCount = routine.items.filter(item => getRoutineItemName(item) === currentExercise).length;
					label.textContent = duplicateCount > 1 ? `${routine.name} #${index + 1}` : routine.name;
					row.appendChild(label);

					const input = document.createElement('textarea');
					input.className = 'visible-note-input';
					input.placeholder = 'visible note...';
					input.value = getRoutineItemNote(routine, index);
					input.rows = 1;
					input.addEventListener('input', () => {
						setRoutineItemNote(routine, index, input.value);
						saveData();
						resizeNotesTextareas(row);
					});
					row.appendChild(input);

					section.appendChild(row);
				});

				tabNotes.insertBefore(section, notesArea);
				resizeNotesTextareas(section);
			}

			renderVisibleRoutineNotes();

			// Notes textarea persistence
			const notesArea = content.querySelector('.notes-textarea');
			if (notesArea) {
				const notesHeading = document.createElement('div');
				notesHeading.className = 'settings-subheading';
				notesHeading.textContent = 'notes';
				notesArea.parentNode.insertBefore(notesHeading, notesArea);

				notesArea.value = exObj.notes || '';

				const autoResize = () => {
					notesArea.style.height = '24px';
					notesArea.style.height = Math.max(24, notesArea.scrollHeight) + 'px';
				};

				notesArea.addEventListener('input', (e) => {
					exObj.notes = e.target.value;
					autoResize();
					saveData(); // auto-save on type
				});

				setTimeout(autoResize, 0);
			}

			const logSection = content.querySelector('.log-input-section');
			logSection.innerHTML = '';

			if (exObj.types.length > 0) {
				const grid = document.createElement('div');
				grid.style.display = 'grid';
				grid.style.gridTemplateColumns = '20px 100px 100px 1fr';
				grid.style.gap = '12px';
				grid.style.alignItems = 'center';
				grid.style.marginBottom = '16px';

				const referenceSessionLogs = (() => {
					const today = getCurrentDate();
					const pastLogs = exObj.logs.filter(l => l.date !== today);
					if (pastLogs.length === 0) return [];
					const sortedPast = [...pastLogs].sort((a, b) => {
						const da = a.date.split('-').reverse().join('');
						const db = b.date.split('-').reverse().join('');
						return db.localeCompare(da);
					});
					const lastDate = sortedPast[0].date;
					return exObj.logs.filter(l => l.date === lastDate).sort((a, b) => (a.ts || 0) - (b.ts || 0));
				})();

				const today = getCurrentDate();
				const todayLogs = exObj.logs.filter(l => l.date === today).sort((a, b) => (a.ts || 0) - (b.ts || 0));

				const prefillSet = (() => {
					if (referenceSessionLogs.length > 0) {
						const currentSetIdx = todayLogs.length;
						if (currentSetIdx < referenceSessionLogs.length) {
							return referenceSessionLogs[currentSetIdx];
						} else {
							// Exceeded previous session sets, use its last set
							return referenceSessionLogs[referenceSessionLogs.length - 1];
						}
					} else if (todayLogs.length > 0) {
						return todayLogs[todayLogs.length - 1];
					}
					return null;
				})();

				let currentSetType = prefillSet ? (prefillSet.type || 's') : 's';
				const hasWarmupToday = todayLogs.some(l => l.type === 'w');
				if (referenceSessionLogs.length === 0 && hasWarmupToday) {
					currentSetType = 's';
				}

				let sLabelEl = null;

				exObj.types.forEach((t, i) => {
					const row = Math.floor(i / 2) + 1;
					const col = (i % 2) + 2;

					if (i === 0) {
						const sLabel = document.createElement('span');
						sLabel.className = 'input-label';
						sLabel.textContent = currentSetType;
						sLabel.style.gridColumn = '1';
						sLabel.style.gridRow = '1';
						sLabel.style.textAlign = 'right';
						sLabel.style.cursor = 'pointer';
						sLabel.style.userSelect = 'none';
						sLabel.addEventListener('click', () => {
							if (currentSetType === 's') {
								currentSetType = 'w';
							} else if (currentSetType === 'w') {
								currentSetType = 'p';
							} else {
								currentSetType = 's';
							}
							sLabel.textContent = currentSetType;
						});
						sLabelEl = sLabel;
						grid.appendChild(sLabel);
					}

					const wrapper = document.createElement('div');
					wrapper.style.display = 'flex';
					wrapper.style.alignItems = 'center';
					wrapper.style.gap = '8px';
					wrapper.style.gridColumn = col.toString();
					wrapper.style.gridRow = row.toString();

					const inp = document.createElement('input');
					inp.type = 'number';
					inp.className = 'val-input dyn-val';
					inp.dataset.type = t;
					inp.inputMode = 'decimal';
					if (prefillSet && prefillSet.data[t]) {
						inp.value = prefillSet.data[t];
						inp.placeholder = prefillSet.data[t];
						inp.classList.add('is-prefilled');
					}
					inp.addEventListener('input', () => inp.classList.remove('is-prefilled'));
					inp.addEventListener('focus', () => inp.select());

					const unit = document.createElement('span');
					unit.className = 'unit';
					unit.textContent = t;

					wrapper.appendChild(inp);
					wrapper.appendChild(unit);
					grid.appendChild(wrapper);
				});

				const numRows = Math.ceil(exObj.types.length / 2);
				const tagSpan = document.createElement('span');
				tagSpan.className = 'add-tag-inline';
				tagSpan.textContent = '<add tag>';
				tagSpan.style.gridColumn = '4';
				tagSpan.style.gridRow = numRows.toString();
				tagSpan.style.textAlign = 'right';
				tagSpan.style.cursor = 'pointer';
				grid.appendChild(tagSpan);

				let currentTags = prefillSet ? [...getSetTags(prefillSet)] : [];

				const renderTagSpan = () => {
					tagSpan.innerHTML = '';
					if (currentTags.length > 0) {
						currentTags.forEach(t => {
							const s = document.createElement('span');
							s.textContent = `#${t} `;
							s.style.color = 'var(--text-dark)';
							s.style.fontWeight = '600';
							s.style.cursor = 'pointer';
							s.addEventListener('click', (e) => {
								e.stopPropagation();
								currentTags = currentTags.filter(x => x !== t);
								renderTagSpan();
							});
							tagSpan.appendChild(s);
						});
					}
					const addS = document.createElement('span');
					addS.textContent = '<add tag>';
					addS.style.cursor = 'pointer';
					addS.addEventListener('click', (e) => {
						e.stopPropagation();
						const allTags = getAllTags().map(t => ({ label: `#${t}`, value: t }));
						openSelectionDialog('Select a tag', allTags, (selection) => {
							const selections = Array.isArray(selection) ? selection : [selection];
							selections.forEach(sel => {
								let val = typeof sel === 'string' ? sel : sel.value;
								if (val) {
									val = val.replace(/^#/, '').trim();
									if (!currentTags.includes(val)) {
										currentTags.push(val);
									}
								}
							});
							renderTagSpan();
						}, 'add new tag');
					});
					tagSpan.appendChild(addS);
				};
				renderTagSpan();

				logSection.appendChild(grid);

				const addBtn = document.createElement('button');
				addBtn.className = 'btn-large-add';
				addBtn.textContent = '+';
				addBtn.addEventListener('click', () => {
					const newLog = {};
					let hasData = false;
					grid.querySelectorAll('.dyn-val').forEach(inp => {
						const val = inp.value || inp.placeholder;
						if (val) {
							newLog[inp.dataset.type] = val;
							hasData = true;
						}
					});
					if (hasData) {
						const today = getCurrentDate();
						const logEntry = { date: today, ts: Date.now(), data: newLog, type: currentSetType };

						let finalTags = new Set();
						if (data.home && data.home.tags && data.home.tags[today]) {
							data.home.tags[today].forEach(t => finalTags.add(t));
						}
						currentTags.forEach(t => finalTags.add(t));

						if (finalTags.size > 0) {
							logEntry.tags = Array.from(finalTags);
						}

						exObj.logs.push(logEntry);
						// Auto-start rest timer if enabled and exercise has a rest timer set
						const restTimerSecs = parseInt(exObj.restTimer, 10);
						if (data.settings?.enableRestTimer !== false && restTimerSecs > 0) {
							// Pass the timer via a small delay so renderView doesn't interrupt it
							setTimeout(() => startCountDown(restTimerSecs), 50);
						}
						renderView('exercise-detail');
					}
				});
				logSection.appendChild(addBtn);

				// --- Rest Timer Row ---
				const restRow = document.createElement('div');
				restRow.style.display = 'flex';
				restRow.style.alignItems = 'center';
				restRow.style.justifyContent = 'space-between';
				restRow.style.padding = '10px 0';
				restRow.style.marginBottom = '8px';
				restRow.style.borderTop = '1px solid var(--border-color)';
				restRow.style.cursor = 'default';

				const restLabel = document.createElement('span');
				restLabel.textContent = 'rest';
				restLabel.style.fontSize = '14px';
				restRow.appendChild(restLabel);

				const restValueRow = document.createElement('div');
				restValueRow.style.display = 'flex';
				restValueRow.style.alignItems = 'center';
				restValueRow.style.gap = '6px';

				const currentRest = parseInt(exObj.restTimer, 10) || 0;
				const restMinutes = Math.floor(currentRest / 60);
				const restSeconds = currentRest % 60;

				const restMinInput = document.createElement('input');
				restMinInput.type = 'number';
				restMinInput.className = 'val-input';
				restMinInput.placeholder = 'min';
				restMinInput.value = restMinutes || '';
				restMinInput.style.width = '40px';
				restMinInput.inputMode = 'numeric';
				restMinInput.min = '0';

				const restMinLabel = document.createElement('span');
				restMinLabel.className = 'unit';
				restMinLabel.textContent = 'min';

				const restSecInput = document.createElement('input');
				restSecInput.type = 'number';
				restSecInput.className = 'val-input';
				restSecInput.placeholder = 'sec';
				restSecInput.value = restSeconds || '';
				restSecInput.style.width = '40px';
				restSecInput.inputMode = 'numeric';
				restSecInput.min = '0';
				restSecInput.max = '59';

				const restSecLabel = document.createElement('span');
				restSecLabel.className = 'unit';
				restSecLabel.textContent = 'sec';

				function saveRestTimer() {
					const mins = parseInt(restMinInput.value, 10) || 0;
					const secs = parseInt(restSecInput.value, 10) || 0;
					const total = mins * 60 + secs;
					exObj.restTimer = total > 0 ? total : 0;
					saveData();
				}

				restMinInput.addEventListener('input', saveRestTimer);
				restSecInput.addEventListener('input', saveRestTimer);

				restMinInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.stopPropagation();
						restSecInput.focus();
						restSecInput.select();
					}
				});

				restSecInput.addEventListener('keydown', (e) => {
					if (e.key === 'Enter') {
						e.stopPropagation();
						restSecInput.blur();
					}
				});

				restValueRow.appendChild(restMinInput);
				restValueRow.appendChild(restMinLabel);
				restValueRow.appendChild(restSecInput);
				restValueRow.appendChild(restSecLabel);

				restRow.appendChild(restValueRow);
				logSection.appendChild(restRow);
			}

			const historyList = content.querySelector('.history-list');
			historyList.innerHTML = '';
			if (exObj.logs && exObj.logs.length > 0) {
				const grouped = {};
				const logIndexMap = {};
				exObj.logs.forEach((log, globalIdx) => {
					if (!grouped[log.date]) grouped[log.date] = [];
					logIndexMap[log.date + '_' + grouped[log.date].length] = globalIdx;
					grouped[log.date].push(log);
				});

				const parseDateKey = (d) => {
					const [dd, mm, yyyy] = d.split('-');
					return new Date(`${yyyy}-${mm}-${dd}`).getTime();
				};
				const sortedDates = Object.keys(grouped).sort((a, b) => parseDateKey(b) - parseDateKey(a));
				sortedDates.forEach(dateStr => {
					const dayDiv = document.createElement('div');
					dayDiv.className = 'history-day';

					// Compute common tags for this day
					const daySets = grouped[dateStr];
					let commonTags = [];
					if (daySets.length > 0) {
						const firstTags = getSetTags(daySets[0]);
						commonTags = firstTags.filter(tag =>
							daySets.every(s => getSetTags(s).includes(tag))
						);
					}

					const header = document.createElement('div');
					header.className = 'day-header';
					const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
					let headerText = dateStr === todayStr ? 'today' : dateStr;
					if (commonTags.length > 0) {
						headerText += '  ' + commonTags.map(t => `#${t}`).join(' ');
					}
					header.innerHTML = `<span>${headerText}</span>`;
					const showVolExercises = data.settings?.showVolumeExercises !== false;
					if (showVolExercises) {
						const dayVol = calculateLogsVolume(daySets);
						if (dayVol > 0) {
							const volSpan = document.createElement('span');
							volSpan.style.fontSize = '12px';
							volSpan.style.fontWeight = '400';
							volSpan.style.color = 'var(--text-light)';
							volSpan.textContent = `${Math.round(dayVol)} kg`;
							header.appendChild(volSpan);
						}
					}
					dayDiv.appendChild(header);

					let workSetCount = 0;
					grouped[dateStr].forEach((set, localIdx) => {
						const globalIdx = logIndexMap[dateStr + '_' + localIdx];
						const setType = set.type || 's';
						let setLabel;
						if (setType === 'w') {
							setLabel = 'W';
						} else if (setType === 'p') {
							setLabel = 'P';
						} else {
							workSetCount++;
							setLabel = workSetCount.toString();
						}

						const setRow = document.createElement('div');
						setRow.className = 'set-row';
						setRow.style.cursor = 'pointer';

						const numSpan = document.createElement('span');
						numSpan.className = 'set-num';
						numSpan.textContent = setLabel;
						setRow.appendChild(numSpan);

						const metricsGrid = document.createElement('div');
						metricsGrid.style.display = 'grid';
						metricsGrid.style.gridTemplateColumns = '100px 100px 1fr';
						metricsGrid.style.gap = '4px 12px';
						metricsGrid.style.flex = '1';

						exObj.types.forEach(t => {
							const mSpan = document.createElement('span');
							if (set.data[t]) {
								mSpan.textContent = `${set.data[t]} ${t}`;
							}
							metricsGrid.appendChild(mSpan);
						});

						// For legacy logs with removed types
						Object.keys(set.data).forEach(k => {
							if (!exObj.types.includes(k)) {
								const mSpan = document.createElement('span');
								mSpan.textContent = `${set.data[k]} ${k}`;
								metricsGrid.appendChild(mSpan);
							}
						});

						// Add 1RM if only kg and reps (only for regular sets)
						const dataKeys = Object.keys(set.data);
						if (setType === 's' && dataKeys.length === 2 && dataKeys.includes('kg') && dataKeys.includes('reps')) {
							const w = parseFloat(set.data.kg);
							const r = parseInt(set.data.reps, 10);
							if (!isNaN(w) && !isNaN(r) && r > 0) {
								const oneRm = Math.round(calculateOneRM(w, r));
								const rmSpan = document.createElement('span');
								rmSpan.className = 'set-rm';
								rmSpan.textContent = `1rm ${oneRm}kg`;
								rmSpan.style.gridColumn = '3';
								rmSpan.style.gridRow = '1';
								rmSpan.style.textAlign = 'right';
								metricsGrid.appendChild(rmSpan);
							}
						}
						// Show only tags unique to this set (not the common day tags)
						const allSetTags = getSetTags(set);
						const uniqueTags = allSetTags.filter(t => !commonTags.includes(t));

						if (uniqueTags.length > 0) {
							const tagDisplay = document.createElement('span');
							tagDisplay.className = 'set-tag';
							tagDisplay.style.color = 'var(--text-dark)';
							tagDisplay.style.fontSize = '12px';
							tagDisplay.style.fontWeight = '600';
							tagDisplay.textContent = uniqueTags.map(t => `#${t}`).join(' ');
							metricsGrid.appendChild(tagDisplay);
						}
						setRow.appendChild(metricsGrid);

						// Click to edit
						setRow.addEventListener('click', (e) => {
							if (setRow.classList.contains('editing')) return;
							if (e.target.tagName === 'INPUT' || e.target.closest('.inline-btn')) return;

							setRow.classList.add('editing');
							setRow.innerHTML = '';
							setRow.style.cursor = 'default';
							setRow.style.flexWrap = 'wrap';
							setRow.style.gap = '8px';

							// Type toggle
							let editType = set.type || 's';
							const typeBtn = document.createElement('span');
							typeBtn.className = 'set-num';
							typeBtn.textContent = editType === 's' ? setLabel : editType.toUpperCase();
							typeBtn.style.cursor = 'pointer';
							typeBtn.style.userSelect = 'none';
							typeBtn.addEventListener('click', (e) => {
								e.stopPropagation();
								if (editType === 's') editType = 'w';
								else if (editType === 'w') editType = 'p';
								else editType = 's';
								typeBtn.textContent = editType;
							});
							setRow.appendChild(typeBtn);

							// Editable inputs for each data key
							const editInputs = {};
							const allKeys = [...new Set([...exObj.types, ...Object.keys(set.data)])];
							const inputsWrap = document.createElement('div');
							inputsWrap.style.display = 'flex';
							inputsWrap.style.gap = '8px';
							inputsWrap.style.alignItems = 'center';
							inputsWrap.style.flex = '1';
							inputsWrap.style.flexWrap = 'wrap';

							allKeys.forEach(k => {
								const inp = document.createElement('input');
								inp.type = 'number';
								inp.className = 'val-input';
								inp.value = set.data[k] || '';
								inp.style.width = '45px';
								inp.inputMode = 'decimal';
								// Prevent tap from bubbling up and potentially re-triggering the edit mode logic
								inp.addEventListener('click', (e) => e.stopPropagation());
								const unit = document.createElement('span');
								unit.className = 'unit';
								unit.textContent = k;
								unit.style.fontSize = '12px';
								inputsWrap.appendChild(inp);
								inputsWrap.appendChild(unit);
								editInputs[k] = inp;
							});
							setRow.appendChild(inputsWrap);

							// Tag editor
							let editTagsList = [...getSetTags(set)];
							const tagEditSpan = document.createElement('div');
							tagEditSpan.style.width = '100%';
							tagEditSpan.style.fontSize = '12px';
							tagEditSpan.style.display = 'flex';
							tagEditSpan.style.flexWrap = 'wrap';
							tagEditSpan.style.gap = '4px';
							tagEditSpan.style.alignItems = 'center';

							const renderEditTags = () => {
								tagEditSpan.innerHTML = '';
								editTagsList.forEach(t => {
									const ts = document.createElement('span');
									ts.textContent = `#${t}`;
									ts.style.color = 'var(--text-dark)';
									ts.style.fontWeight = '600';
									ts.style.cursor = 'pointer';
									ts.addEventListener('click', (e) => {
										e.stopPropagation();
										editTagsList = editTagsList.filter(x => x !== t);
										renderEditTags();
									});
									tagEditSpan.appendChild(ts);
								});
								const addTagBtn = document.createElement('span');
								addTagBtn.textContent = '<add tag>';
								addTagBtn.style.cursor = 'pointer';
								addTagBtn.style.fontSize = '12px';
								addTagBtn.addEventListener('click', (e) => {
									e.stopPropagation();
									const tagOptions = getAllTags().map(t => ({ label: `#${t}`, value: t }));
									openSelectionDialog('Select a tag', tagOptions, (selection) => {
										const selections = Array.isArray(selection) ? selection : [selection];
										selections.forEach(sel => {
											let val = typeof sel === 'string' ? sel : sel.value;
											if (val) {
												val = val.replace(/^#/, '').trim();
												if (!editTagsList.includes(val)) {
													editTagsList.push(val);
												}
											}
										});
										renderEditTags();
									}, 'add new tag');
								});
								tagEditSpan.appendChild(addTagBtn);
							};
							renderEditTags();
							setRow.appendChild(tagEditSpan);

							// Action buttons
							const actionsWrap = document.createElement('div');
							actionsWrap.style.display = 'flex';
							actionsWrap.style.gap = '4px';

							const saveBtn = document.createElement('span');
							saveBtn.className = 'material-icons-outlined inline-btn inline-save';
							saveBtn.textContent = 'check';
							saveBtn.style.cursor = 'pointer';
							saveBtn.style.fontSize = '18px';
							saveBtn.addEventListener('click', (e) => {
								e.stopPropagation();
								const newData = {};
								allKeys.forEach(k => {
									if (editInputs[k].value) {
										newData[k] = editInputs[k].value;
									}
								});
								exObj.logs[globalIdx].data = newData;
								exObj.logs[globalIdx].type = editType;
								if (editTagsList.length > 0) {
									exObj.logs[globalIdx].tags = editTagsList;
								} else {
									delete exObj.logs[globalIdx].tags;
									delete exObj.logs[globalIdx].tag;
								}
								saveData();
								renderView('exercise-detail');
							});

							const deleteBtn = document.createElement('span');
							deleteBtn.className = 'material-icons-outlined inline-btn inline-cancel';
							deleteBtn.textContent = 'delete';
							deleteBtn.style.cursor = 'pointer';
							deleteBtn.style.fontSize = '18px';
							deleteBtn.style.color = 'var(--danger-color)';
							deleteBtn.addEventListener('click', (e) => {
								e.stopPropagation();
								showConfirm('Delete this set?').then(confirmed => {
									if (confirmed) {
										exObj.logs.splice(globalIdx, 1);
										saveData();
										renderView('exercise-detail');
									}
								});
							});

							const cancelBtn = document.createElement('span');
							cancelBtn.className = 'material-icons-outlined inline-btn';
							cancelBtn.textContent = 'close';
							cancelBtn.style.cursor = 'pointer';
							cancelBtn.style.fontSize = '18px';
							cancelBtn.addEventListener('click', (e) => {
								e.stopPropagation();
								renderView('exercise-detail');
							});

							actionsWrap.appendChild(saveBtn);
							actionsWrap.appendChild(deleteBtn);
							actionsWrap.appendChild(cancelBtn);
							setRow.appendChild(actionsWrap);
						});

						dayDiv.appendChild(setRow);
					});

					historyList.appendChild(dayDiv);
				});
			}

		} else if (viewName === 'exercise-edit') {
			// Handled globally
			const exObj = getExerciseObj(currentExercise);
			const editOptions = content.querySelector('.edit-options');

			const defaultTypes = ['kg', 'reps', 'km', 'm', 'laps', 'time'];
			const customTypes = data.settings.customTypes || [];
			let allTypes = [...new Set([...defaultTypes, ...customTypes, ...exObj.types])];

			function renderCheckboxes() {
				editOptions.innerHTML = '';
				for (let i = 0; i < allTypes.length; i += 2) {
					const row = document.createElement('div');
					row.className = 'edit-row';

					[allTypes[i], allTypes[i + 1]].forEach(type => {
						if (!type) return;
						const label = document.createElement('label');
						label.className = 'custom-checkbox';

						const isChecked = exObj.types.includes(type);
						label.innerHTML = `
                      <input type="checkbox" ${isChecked ? 'checked' : ''} data-type="${type}">
                      <span class="checkmark material-icons-outlined">${isChecked ? 'check_box' : 'check_box_outline_blank'}</span>
                      <span class="line-placeholder"></span>
                      ${type}
                  `;

						const cb = label.querySelector('input');
						const icon = label.querySelector('.checkmark');
						cb.addEventListener('change', (e) => {
							icon.textContent = e.target.checked ? 'check_box' : 'check_box_outline_blank';
						});

						if (!defaultTypes.includes(type)) {
							const delBtn = document.createElement('span');
							delBtn.className = 'material-icons-outlined';
							delBtn.style.fontSize = '14px';
							delBtn.style.marginLeft = 'auto';
							delBtn.style.cursor = 'pointer';
							delBtn.style.color = 'var(--text-light)';
							delBtn.textContent = 'close';
							delBtn.addEventListener('click', (e) => {
								e.preventDefault();
								e.stopPropagation();
								showConfirm(`Delete custom metric "${type}" from settings?`).then(confirmed => {
									if (confirmed) {
										data.settings.customTypes = data.settings.customTypes.filter(t => t !== type);
										allTypes = allTypes.filter(t => t !== type);
										// Remove it from all exercises
										data.exercises.forEach(ex => {
											if (ex.types) ex.types = ex.types.filter(t => t !== type);
										});
										saveData();
										renderCheckboxes();
									}
								});
							});
							label.appendChild(delBtn);
						}

						row.appendChild(label);
					});
					editOptions.appendChild(row);
				}
			}

			renderCheckboxes();

			const addBtn = content.querySelector('#btn-add-custom-type');
			if (addBtn) {
				addBtn.addEventListener('click', () => {
					showPrompt('Enter custom metric name (e.g. sets, seconds):').then(newType => {
						if (newType) {
							const normalized = newType.trim().toLowerCase();
							if (normalized && !allTypes.includes(normalized)) {
								if (!data.settings.customTypes) data.settings.customTypes = [];
								data.settings.customTypes.push(normalized);
								allTypes.push(normalized);
								exObj.types.push(normalized); // Auto-check it
								saveData();
								renderCheckboxes();
							}
						}
					});
				});
			}

			const saveBtn = content.querySelector('.btn-large-add');
			saveBtn.addEventListener('click', () => {
				const newTypes = [];
				editOptions.querySelectorAll('.custom-checkbox input').forEach(cb => {
					if (cb.checked) {
						newTypes.push(cb.dataset.type);
					}
				});
				exObj.types = newTypes;
				renderView('exercise-detail');
			});
		} else if (viewName === 'settings') {
			const backBtn = content.querySelector('.back-btn');
			if (backBtn) {
				backBtn.addEventListener('click', () => history.back());
			}

			const versionEl = content.querySelector('#app-version');
			if (versionEl) {
				versionEl.textContent = `v${APP_VERSION}`;
			}

			content.querySelectorAll('.settings-subheading').forEach(heading => {
				const icon = document.createElement('span');
				icon.className = 'material-icons-outlined settings-collapse-icon';
				icon.textContent = 'expand_more';
				heading.appendChild(icon);

				heading.addEventListener('click', () => {
					const isCollapsed = icon.textContent === 'chevron_right';
					icon.textContent = isCollapsed ? 'expand_more' : 'chevron_right';

					let el = heading.nextElementSibling;
					while (el && !el.classList.contains('settings-subheading')) {
						el.style.display = isCollapsed ? '' : 'none';
						el = el.nextElementSibling;
					}
				});
			});

			const homeLogsToggle = content.querySelector('#toggle-home-logs');
			if (homeLogsToggle) {
				const isOn = () => data.settings?.showHomeLogs !== false;
				const updateToggle = () => {
					homeLogsToggle.textContent = isOn() ? 'check_box' : 'check_box_outline_blank';
				};
				updateToggle();
				const homeLogsRow = homeLogsToggle.closest('.list-item');
				(homeLogsRow || homeLogsToggle).addEventListener('click', () => {
					if (!data.settings) data.settings = {};
					data.settings.showHomeLogs = !isOn();
					saveData();
					updateToggle();
				});
			}

			const volumeHomeToggle = content.querySelector('#toggle-volume-home');
			if (volumeHomeToggle) {
				const isOn = () => data.settings?.showVolumeHome !== false;
				const updateToggle = () => {
					volumeHomeToggle.textContent = isOn() ? 'check_box' : 'check_box_outline_blank';
				};
				updateToggle();
				const row = volumeHomeToggle.closest('.list-item');
				(row || volumeHomeToggle).addEventListener('click', () => {
					if (!data.settings) data.settings = {};
					data.settings.showVolumeHome = !isOn();
					saveData();
					updateToggle();
				});
			}

			const volumeExercisesToggle = content.querySelector('#toggle-volume-exercises');
			if (volumeExercisesToggle) {
				const isOn = () => data.settings?.showVolumeExercises !== false;
				const updateToggle = () => {
					volumeExercisesToggle.textContent = isOn() ? 'check_box' : 'check_box_outline_blank';
				};
				updateToggle();
				const row = volumeExercisesToggle.closest('.list-item');
				(row || volumeExercisesToggle).addEventListener('click', () => {
					if (!data.settings) data.settings = {};
					data.settings.showVolumeExercises = !isOn();
					saveData();
					updateToggle();
				});
			}

			const routineNoteIconsToggle = content.querySelector('#toggle-routine-note-icons');
			if (routineNoteIconsToggle) {
				const isOn = () => data.settings?.showRoutineNoteIcons !== false;
				const updateToggle = () => {
					routineNoteIconsToggle.textContent = isOn() ? 'check_box' : 'check_box_outline_blank';
				};
				updateToggle();
				const routineIconsRow = routineNoteIconsToggle.closest('.list-item');
				(routineIconsRow || routineNoteIconsToggle).addEventListener('click', () => {
					if (!data.settings) data.settings = {};
					data.settings.showRoutineNoteIcons = !isOn();
					saveData();
					updateToggle();
				});
			}

			const searchTypeBtn = content.querySelector('#btn-select-search-type');
			const searchTypeLabel = content.querySelector('#label-search-type');
			if (searchTypeBtn && searchTypeLabel) {
				const currentSearchType = data.settings?.searchType || 'contains';
				searchTypeLabel.textContent = currentSearchType;

				searchTypeBtn.addEventListener('click', () => {
					const options = [
						{ label: 'Contains', value: 'contains' },
						{ label: 'Prefix', value: 'prefix' }
					];
					openSelectionDialog('Select Search Type', options, (selection) => {
						const sel = Array.isArray(selection) ? selection[0] : selection;
						if (!sel) return;
						if (!data.settings) data.settings = {};
						data.settings.searchType = sel;
						saveData();
						renderView('settings');
					}, 'add new', false);
				});
			}

			const restTimerToggle = content.querySelector('#toggle-rest-timer');
			if (restTimerToggle) {
				const isOn = () => data.settings?.enableRestTimer !== false;
				const updateToggle = () => {
					restTimerToggle.textContent = isOn() ? 'check_box' : 'check_box_outline_blank';
				};
				updateToggle();
				const restTimerRow = restTimerToggle.closest('.list-item');
				(restTimerRow || restTimerToggle).addEventListener('click', () => {
					if (!data.settings) data.settings = {};
					data.settings.enableRestTimer = !isOn();
					saveData();
					updateToggle();
				});
			}

			const timerAlertSoundBtn = content.querySelector('#btn-select-timer-alert-sound');
			const timerAlertSoundLabel = content.querySelector('#label-timer-alert-sound');
			if (timerAlertSoundBtn && timerAlertSoundLabel) {
				const currentSound = data.settings?.timerAlertSound || 'single';
				const soundLabels = {
					single: 'beep',
					low: 'low tone',
					high: 'high tone'
				};
				timerAlertSoundLabel.textContent = soundLabels[currentSound] || 'beep';

				timerAlertSoundBtn.addEventListener('click', () => {
					const options = [
						{ label: 'beep', value: 'single' },
						{ label: 'low tone', value: 'low' },
						{ label: 'high tone', value: 'high' }
					];
					openSelectionDialog('Select Timer Alert Sound', options, (selection) => {
						const sel = Array.isArray(selection) ? selection[0] : selection;
						if (!sel) return;
						if (!data.settings) data.settings = {};
						data.settings.timerAlertSound = sel;
						saveData();
						renderView('settings');
					}, 'add new', false);
				});
			}

			const timerBeepCountInput = content.querySelector('#timer-beep-count-input');
			if (timerBeepCountInput) {
				const currentBeepCount = data.settings?.timerBeepCount ?? 2;
				timerBeepCountInput.value = currentBeepCount;
				timerBeepCountInput.addEventListener('change', (e) => {
					let value = parseInt(e.target.value, 10);
					if (isNaN(value) || value < 1) {
						value = 2; // fallback/default
						timerBeepCountInput.value = 2;
					}
					if (!data.settings) data.settings = {};
					data.settings.timerBeepCount = value;
					saveData();
				});
				const beepCountRow = timerBeepCountInput.closest('.list-item');
				if (beepCountRow) {
					beepCountRow.addEventListener('click', (e) => {
						if (e.target === beepCountRow || e.target.tagName === 'SPAN') {
							timerBeepCountInput.focus();
							timerBeepCountInput.select();
						}
					});
				}
			}

			const timerAlertVolumeSlider = content.querySelector('#timer-alert-volume-slider');
			const timerAlertVolumeLabel = content.querySelector('#label-timer-alert-volume');
			if (timerAlertVolumeSlider && timerAlertVolumeLabel) {
				const currentVolume = data.settings?.timerAlertVolume ?? 80;
				timerAlertVolumeSlider.value = currentVolume;
				timerAlertVolumeLabel.textContent = `${currentVolume}%`;
				timerAlertVolumeSlider.addEventListener('input', (e) => {
					const value = parseInt(e.target.value, 10);
					if (!data.settings) data.settings = {};
					data.settings.timerAlertVolume = isNaN(value) ? 80 : value;
					timerAlertVolumeLabel.textContent = `${data.settings.timerAlertVolume}%`;
					saveData();
				});
			}

			const timerAlertPreviewBtn = content.querySelector('#btn-play-timer-alert-preview');
			if (timerAlertPreviewBtn) {
				timerAlertPreviewBtn.addEventListener('click', () => {
					playTimerBeep();
				});
			}

			const formulaBtn = content.querySelector('#btn-select-1rm-formula');
			const formulaLabel = content.querySelector('#label-1rm-formula');
			if (formulaBtn && formulaLabel) {
				const currentFormula = data.settings?.oneRMFormula || 'epley';
				formulaLabel.textContent = currentFormula;

				formulaBtn.addEventListener('click', () => {
					const options = [
						{ label: 'Epley (Default)', value: 'epley' },
						{ label: 'Brzycki', value: 'brzycki' },
						{ label: 'Lander', value: 'lander' },
						{ label: 'Lombardi', value: 'lombardi' }
					];
					openSelectionDialog('Select 1RM Formula', options, (selection) => {
						const sel = Array.isArray(selection) ? selection[0] : selection;
						if (!sel) return;
						if (!data.settings) data.settings = {};
						data.settings.oneRMFormula = sel;
						saveData();
						renderView('settings');
					}, 'add new', false);
				});
			}

			const presetBtn = content.querySelector('#btn-select-preset');
			if (presetBtn) {
				presetBtn.addEventListener('click', () => {
					const options = Object.keys(COLOR_PRESETS).map(key => ({ label: key, value: key }));
					openSelectionDialog('Select Preset', options, (selection) => {
						const sel = Array.isArray(selection) ? selection[0] : selection;
						if (!sel) return;
						if (!data.settings) data.settings = {};
						data.settings.colors = { ...COLOR_PRESETS[sel] };
						applyColors();
						saveData();
						renderView('settings');
					}, 'add new', false);
				});
			}

			const hueSlider = content.querySelector('#hue-slider');
			const hueValue = content.querySelector('#hue-value');
			if (hueSlider && hueValue) {
				const currentHue = data.settings?.hueRotation || 0;
				hueSlider.value = currentHue;
				hueValue.textContent = `${currentHue}°`;

				hueSlider.addEventListener('input', (e) => {
					const val = e.target.value;
					hueValue.textContent = `${val}°`;
					if (!data.settings) data.settings = {};
					data.settings.hueRotation = parseInt(val, 10);
					applyColors();
				});

				hueSlider.addEventListener('change', () => {
					saveData();
				});
			}

			const debugInput = content.querySelector('#debug-date-input');
			if (debugInput) {
				debugInput.value = data.settings?.debugDate || '';
				debugInput.addEventListener('change', (e) => {
					if (!data.settings) data.settings = {};
					data.settings.debugDate = e.target.value.trim();
					saveData();
				});
				const debugRow = debugInput.closest('.list-item');
				if (debugRow) {
					debugRow.addEventListener('click', (e) => {
						if (e.target === debugRow || e.target.tagName === 'SPAN') {
							debugInput.focus();
						}
					});
				}
			}

			const colorPrimary = content.querySelector('#color-primary');
			const colorBg = content.querySelector('#color-bg');
			const colorTextDark = content.querySelector('#color-text-dark');
			const colorTextLight = content.querySelector('#color-text-light');
			const colorTextDisabled = content.querySelector('#color-text-disabled');
			const colorBorder = content.querySelector('#color-border');
			const colorBtnSecondary = content.querySelector('#color-btn-secondary');
			const colorBtnRemove = content.querySelector('#color-btn-remove');
			const colorDanger = content.querySelector('#color-danger');

			// Clicking the row opens the color picker
			[colorPrimary, colorBg, colorTextDark, colorTextLight, colorTextDisabled,
			 colorBorder, colorBtnSecondary, colorBtnRemove, colorDanger].forEach(input => {
				if (input) {
					const row = input.closest('.list-item');
					if (row) {
						row.addEventListener('click', (e) => {
							if (e.target === row || e.target.tagName === 'SPAN') {
								input.click();
							}
						});
					}
				}
			});

			if (colorPrimary && colorBg && colorTextDark) {
				const currentColors = (data.settings && data.settings.colors) ? data.settings.colors : DEFAULT_COLORS;
				const rotation = data.settings?.hueRotation || 0;
				colorPrimary.value = rotateHue(currentColors.primary || DEFAULT_COLORS.primary, rotation);
				colorBg.value = rotateHue(currentColors.bg || DEFAULT_COLORS.bg, rotation);
				colorTextDark.value = rotateHue(currentColors.textDark || DEFAULT_COLORS.textDark, rotation);
				colorTextLight.value = rotateHue(currentColors.textLight || DEFAULT_COLORS.textLight, rotation);
				colorTextDisabled.value = rotateHue(currentColors.textDisabled || DEFAULT_COLORS.textDisabled, rotation);
				colorBorder.value = rotateHue(currentColors.border || DEFAULT_COLORS.border, rotation);
				colorBtnSecondary.value = rotateHue(currentColors.btnSecondaryBg || DEFAULT_COLORS.btnSecondaryBg, rotation);
				colorBtnRemove.value = rotateHue(currentColors.btnRemoveColor || DEFAULT_COLORS.btnRemoveColor, rotation);
				colorDanger.value = currentColors.danger || DEFAULT_COLORS.danger; // Danger never rotates

				const updateColor = () => {
					if (!data.settings) data.settings = {};
					if (!data.settings.colors) data.settings.colors = {};
					const rotation = data.settings?.hueRotation || 0;
					const unRotate = (hex) => rotateHue(hex, -rotation);

					data.settings.colors.primary = unRotate(colorPrimary.value);
					data.settings.colors.bg = unRotate(colorBg.value);
					data.settings.colors.textDark = unRotate(colorTextDark.value);
					data.settings.colors.textLight = unRotate(colorTextLight.value);
					data.settings.colors.textDisabled = unRotate(colorTextDisabled.value);
					data.settings.colors.border = unRotate(colorBorder.value);
					data.settings.colors.btnSecondaryBg = unRotate(colorBtnSecondary.value);
					data.settings.colors.btnRemoveColor = unRotate(colorBtnRemove.value);
					data.settings.colors.danger = colorDanger.value; // No rotation for danger
					applyColors();
					saveData();
				};

				colorPrimary.addEventListener('input', updateColor);
				colorBg.addEventListener('input', updateColor);
				colorTextDark.addEventListener('input', updateColor);
				colorTextLight.addEventListener('input', updateColor);
				colorTextDisabled.addEventListener('input', updateColor);
				colorBorder.addEventListener('input', updateColor);
				colorBtnSecondary.addEventListener('input', updateColor);
				colorBtnRemove.addEventListener('input', updateColor);
				colorDanger.addEventListener('input', updateColor);
			}

			const exportBtn = content.querySelector('#btn-export-data');
			if (exportBtn) {
				exportBtn.addEventListener('click', () => {
					const fileName = `grenelle_fitness_data_${getCurrentDate()}.json`;
					const jsonData = JSON.stringify(data, null, 2);

					if (window.AndroidInterface && window.AndroidInterface.export) {
						window.AndroidInterface.export(jsonData, fileName);
					} else {
						const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);
						const downloadAnchorNode = document.createElement('a');
						downloadAnchorNode.setAttribute("href", dataStr);
						downloadAnchorNode.setAttribute("download", fileName);
						document.body.appendChild(downloadAnchorNode);
						downloadAnchorNode.click();
						downloadAnchorNode.remove();
					}
				});
			}

			const importInput = content.querySelector('#import-file-input');
			if (importInput) {
				importInput.addEventListener('change', (e) => {
					const file = e.target.files[0];
					if (!file) return;

					const reader = new FileReader();
					reader.onload = (event) => {
						try {
							const importedData = JSON.parse(event.target.result);
							if (importedData && typeof importedData.version !== 'undefined') {
								showConfirm('Are you sure you want to overwrite your current data with this backup?').then(confirmed => {
									if (confirmed) {
										data = importedData;
										saveData();
										applyColors();
										renderView('home');
									}
								});
							} else {
								showAlert('Invalid backup file format.');
							}
						} catch (err) {
							showAlert('Failed to parse backup file.');
						}
						// Reset input so the same file can be selected again if needed
						e.target.value = '';
					};
					reader.readAsText(file);
				});
			}

			const clearBtn = content.querySelector('#btn-clear-data');
			if (clearBtn) {
				clearBtn.addEventListener('click', () => {
					showConfirm('Are you sure you want to clear all data? This cannot be undone.').then(confirmed => {
						if (confirmed) {
							localStorage.removeItem('grenelle_fitness_data');
							data = JSON.parse(JSON.stringify(DEFAULT_DATA));
							renderView('home');
						}
					});
				});
			}
		} else if (viewName === 'data-page') {
			initializeDataPageView(content);
		}

		mainContent.appendChild(content);
		saveData();
	}

	function initializeDataPageView(content) {
		const startDateBox = content.querySelector('#btn-start-date');
		const startDateLabel = content.querySelector('#start-date-label');
		const endDateBox = content.querySelector('#btn-end-date');
		const endDateLabel = content.querySelector('#end-date-label');
		const previewEl = content.querySelector('#data-preview');
		const copyBtn = content.querySelector('#btn-copy-data');
		const shareBtn = content.querySelector('#btn-share-data');
		const presetBtns = content.querySelectorAll('.preset-btn');

		// State
		let startDate = getTodayDateObject();
		let endDate = getTodayDateObject();

		function getTodayDateObject() {
			const todayStr = getCurrentDate();
			return parseDateStr(todayStr);
		}

		function parseDateStr(str) {
			const [d, m, y] = str.split('-').map(Number);
			return new Date(y, m - 1, d);
		}

		function formatDateStr(date) {
			const d = date.getDate().toString().padStart(2, '0');
			const m = (date.getMonth() + 1).toString().padStart(2, '0');
			const y = date.getFullYear();
			return `${d}-${m}-${y}`;
		}

		function updateLabels() {
			if (startDateLabel) startDateLabel.textContent = formatDateStr(startDate);
			if (endDateLabel) endDateLabel.textContent = formatDateStr(endDate);
			updatePreview();
		}

		function updatePreview() {
			if (!previewEl) return;
			const text = generateLogsText(startDate, endDate);
			previewEl.textContent = text || 'no logs found for this period';
			if (copyBtn) {
				if (!text) {
					copyBtn.setAttribute('disabled', 'true');
					copyBtn.style.opacity = '0.5';
				} else {
					copyBtn.removeAttribute('disabled');
					copyBtn.style.opacity = '1';
				}
			}
			if (shareBtn) {
				if (!text) {
					shareBtn.setAttribute('disabled', 'true');
					shareBtn.style.opacity = '0.5';
				} else {
					shareBtn.removeAttribute('disabled');
					shareBtn.style.opacity = '1';
				}
			}
		}

		// Click handlers for Custom Pickers
		if (startDateBox) {
			startDateBox.addEventListener('click', () => {
				const dateStr = formatDateStr(startDate);
				openCalendarDialog(dateStr, (selected) => {
					startDate = parseDateStr(selected);
					// Deactivate preset buttons
					presetBtns.forEach(b => b.classList.remove('active'));
					// If start date > end date, push end date forward
					if (startDate > endDate) {
						endDate = new Date(startDate);
					}
					updateLabels();
				}, dateStr);
			});
		}

		if (endDateBox) {
			endDateBox.addEventListener('click', () => {
				const dateStr = formatDateStr(endDate);
				openCalendarDialog(dateStr, (selected) => {
					endDate = parseDateStr(selected);
					// Deactivate preset buttons
					presetBtns.forEach(b => b.classList.remove('active'));
					// If end date < start date, push start date backward
					if (endDate < startDate) {
						startDate = new Date(endDate);
					}
					updateLabels();
				}, dateStr);
			});
		}

		// Preset Selection
		presetBtns.forEach(btn => {
			btn.addEventListener('click', (e) => {
				presetBtns.forEach(b => b.classList.remove('active'));
				btn.classList.add('active');

				const preset = btn.dataset.preset;
				const todayObj = getTodayDateObject();

				if (preset === 'today') {
					startDate = todayObj;
					endDate = todayObj;
				} else if (preset === 'this-week') {
					const mon = new Date(todayObj);
					const day = mon.getDay();
					const offset = (day === 0) ? 6 : day - 1;
					mon.setDate(mon.getDate() - offset);
					startDate = mon;
					endDate = todayObj;
				} else if (preset === 'this-month') {
					const start = new Date(todayObj.getFullYear(), todayObj.getMonth(), 1);
					startDate = start;
					endDate = todayObj;
				}
				updateLabels();
			});
		});

		// Actions
		if (copyBtn) {
			copyBtn.addEventListener('click', () => {
				const text = generateLogsText(startDate, endDate);
				if (!text) return;
				const icon = copyBtn.querySelector('.material-icons-outlined');
				navigator.clipboard.writeText(text).then(() => {
					if (icon) {
						const originalIcon = icon.textContent;
						icon.textContent = 'done';
						setTimeout(() => {
							icon.textContent = originalIcon;
						}, 1500);
					}
				});
			});
		}

		if (shareBtn) {
			const shareIcon = shareBtn.querySelector('.material-icons-outlined');
			const fallbackShare = (text) => {
				if (!navigator.clipboard) return;
				navigator.clipboard.writeText(text).then(() => {
					if (shareIcon) {
						const originalIcon = shareIcon.textContent;
						shareIcon.textContent = 'done';
						setTimeout(() => {
							shareIcon.textContent = originalIcon;
						}, 1500);
					}
				});
			};

			shareBtn.addEventListener('click', () => {
				const text = generateLogsText(startDate, endDate);
				if (!text) return;

				if (navigator.share) {
					navigator.share({
						title: 'Workout Data',
						text: text
					}).catch(err => {
						console.log('Share failed or cancelled', err);
						if (err && err.name !== 'AbortError') {
							fallbackShare(text);
						}
					});
				} else {
					fallbackShare(text);
				}
			});
		}

		// Custom copy text toggle & input
		const customCopyToggle = content.querySelector('#toggle-custom-copy-text');
		const customCopyContainer = content.querySelector('#custom-copy-text-container');
		const customCopyInput = content.querySelector('#custom-copy-text-input');
		if (customCopyToggle && customCopyContainer && customCopyInput) {
			const isOn = () => data.settings?.enableCustomCopyText === true;
			const updateToggle = () => {
				customCopyToggle.textContent = isOn() ? 'check_box' : 'check_box_outline_blank';
				customCopyContainer.style.display = isOn() ? '' : 'none';
			};
			// Set current value from settings
			if (data.settings?.customCopyText) {
				customCopyInput.value = data.settings.customCopyText;
			}
			updateToggle();
			const customCopyRow = customCopyToggle.closest('.list-item');
			(customCopyRow || customCopyToggle).addEventListener('click', () => {
				if (!data.settings) data.settings = {};
				data.settings.enableCustomCopyText = !isOn();
				saveData();
				updateToggle();
				updatePreview();
			});
			customCopyInput.addEventListener('input', () => {
				if (!data.settings) data.settings = {};
				data.settings.customCopyText = customCopyInput.value;
				saveData();
				updatePreview();
			});
		}

		// Initial display
		// Start with "today" preset active
		const todayBtn = content.querySelector('.preset-btn[data-preset="today"]');
		if (todayBtn) {
			todayBtn.classList.add('active');
		}
		updateLabels();

		// Render the strength standards list for data page
		function renderDataStrengthStandards() {
			const container = content.querySelector('#data-strength-standards');
			if (!container) return;
			container.innerHTML = '';
			const levels = ['beginner', 'novice', 'intermediate', 'advanced', 'elite'];
			data.exercises.forEach(ex => {
				if (!ex || !ex.strengthStandards) return;
				const entries = levels.map(l => ex.strengthStandards[l]).filter(v => v !== undefined && v !== null && !isNaN(v));
				if (entries.length === 0) return;
				// compute best 1RM for this exercise from its logs
				let best1RM = 0;
				if (Array.isArray(ex.logs)) {
					ex.logs.forEach(log => {
						const w = parseFloat(log.data?.kg);
						const r = parseInt(log.data?.reps, 10);
						if (!isNaN(w) && !isNaN(r) && r > 0) {
							const oneRM = calculateOneRM(w, r);
							if (oneRM > best1RM) best1RM = oneRM;
						}
					});
				}
				const wrapperRow = document.createElement('div');
				wrapperRow.className = 'strength-standards-body';
				wrapperRow.style.marginBottom = '12px';
				const titleRow = document.createElement('div');
				titleRow.className = 'list-item';
				titleRow.style.display = 'flex';
				titleRow.style.justifyContent = 'space-between';
				titleRow.style.alignItems = 'center';
				titleRow.innerHTML = `<span style="font-weight:600">${ex.name}</span><span style="font-weight:600">${best1RM > 0 ? Math.round(best1RM) + ' kg' : ''}</span>`;
				wrapperRow.appendChild(titleRow);
				const graphWrapper = document.createElement('div');
				graphWrapper.className = 'strength-standard-graph-wrapper';
				wrapperRow.appendChild(graphWrapper);
				container.appendChild(wrapperRow);
				// render the standard graph using existing renderer
				renderStandardGraphGlobal(graphWrapper, best1RM, levels, ex.strengthStandards || {});
			});
		}

		// ensure standards render initially
		renderDataStrengthStandards();

		// Make data page subheadings collapsible
		const dataHeadings = content.querySelectorAll('.settings-subheading');
		dataHeadings.forEach(h => {
			h.style.cursor = 'pointer';
			// ensure heading uses flex layout so title and icon sit at ends
			h.style.display = 'flex';
			h.style.alignItems = 'center';
			h.style.justifyContent = 'space-between';

			// wrap existing text content into a title span so flex works consistently
			const existingText = (h.textContent || '').trim();
			h.innerHTML = '';
			const titleSpan = document.createElement('span');
			titleSpan.className = 'settings-subheading-title';
			titleSpan.textContent = existingText;
			h.appendChild(titleSpan);

			let icon = h.querySelector('.settings-collapse-icon');
			if (!icon) {
				icon = document.createElement('span');
				icon.className = 'material-icons-outlined settings-collapse-icon';
				icon.textContent = 'expand_more';
				h.appendChild(icon);
			}

			// initial expanded state
			let expanded = true;
			h.addEventListener('click', () => {
				expanded = !expanded;
				icon.textContent = expanded ? 'expand_more' : 'chevron_right';
				// toggle all siblings until next subheading
				let el = h.nextElementSibling;
				while (el && !el.classList.contains('settings-subheading')) {
					el.style.display = expanded ? '' : 'none';
					el = el.nextElementSibling;
				}
			});
		});
	}

	function generateLogsText(start, end) {
		const startCopy = new Date(start);
		const endCopy = new Date(end);
		
		// Sort just in case
		const s = startCopy < endCopy ? startCopy : endCopy;
		const e = startCopy < endCopy ? endCopy : startCopy;

		// Prepend custom text if enabled
		let prefix = '';
		if (data.settings?.enableCustomCopyText && data.settings?.customCopyText) {
			prefix = data.settings.customCopyText.trim() + '\n\n---\n\n';
		}

		const dateStrings = [];
		let current = new Date(s);
		while (current <= e) {
			const d = current.getDate().toString().padStart(2, '0');
			const m = (current.getMonth() + 1).toString().padStart(2, '0');
			const y = current.getFullYear();
			dateStrings.push(`${d}-${m}-${y}`);
			current.setDate(current.getDate() + 1);
		}

		let fullText = '';

		dateStrings.forEach(dateStr => {
			const dayTags = data.home && data.home.tags ? (data.home.tags[dateStr] || []) : [];
			const dayLogs = [];
			data.exercises.forEach(ex => {
				if (ex.logs) {
					ex.logs.forEach(log => {
						if (log.date === dateStr) {
							dayLogs.push({ ex, log });
						}
					});
				}
			});

			if (dayTags.length === 0 && dayLogs.length === 0) {
				return;
			}

			let dayText = `${dateStr}\n`;
			if (dayTags.length > 0) {
				dayText += dayTags.map(t => `#${t}`).join(' ') + '\n';
			}
			dayText += '\n';

			if (dayLogs.length > 0) {
				const byExercise = {};
				dayLogs.forEach(({ ex, log }) => {
					if (!byExercise[ex.name]) byExercise[ex.name] = { ex, logs: [], firstTs: Infinity };
					byExercise[ex.name].logs.push(log);
					const ts = log.ts || 0;
					if (ts < byExercise[ex.name].firstTs) byExercise[ex.name].firstTs = ts;
				});

				const sortedExercises = Object.entries(byExercise)
					.sort(([, a], [, b]) => a.firstTs - b.firstTs);

				sortedExercises.forEach(([exName, { ex, logs }]) => {
					dayText += `${exName}\n`;
					let workSetCount = 0;
					logs.forEach(set => {
						const setType = set.type || 's';
						let setLabel;
						if (setType === 'w') setLabel = 'W';
						else if (setType === 'p') setLabel = 'P';
						else { workSetCount++; setLabel = workSetCount.toString(); }

						let metrics = Object.entries(set.data).map(([k, v]) => `${v}${k}`).join(' ');
						if (set.data.kg !== undefined && set.data.reps !== undefined) {
							metrics = `${set.data.kg}kg x ${set.data.reps}`;
							const others = Object.entries(set.data).filter(([k]) => k !== 'kg' && k !== 'reps');
							if (others.length > 0) {
								metrics += ' ' + others.map(([k, v]) => `${v}${k}`).join(' ');
							}
						}
						
						const setTags = getSetTags(set);
						const tagsStr = setTags.length > 0 ? ' ' + setTags.map(t => `#${t}`).join(' ') : '';
						
						dayText += `${setLabel}. ${metrics}${tagsStr}\n`;
					});
					dayText += '\n';
				});
			}

			fullText += dayText + '---\n\n';
		});

		if (fullText.endsWith('---\n\n')) {
			fullText = fullText.slice(0, -6);
		}

		if (prefix && fullText) {
			return prefix + fullText.trim();
		}
		return fullText.trim();
	}

	navLinks.forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			renderView(e.target.dataset.target);
		});
	});

	const floatingTimer = document.getElementById('floating-timer');
	let timerInterval = null;
	let timerSeconds = 0;
	let timerStartTime = null;
	let timerEndTime = null;
	let timerMode = null; // 'up', 'down', or null
	let timerWakeLock = null;

	function updateTimerDisplay() {
		const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
		const s = (timerSeconds % 60).toString().padStart(2, '0');
		if (floatingTimer) {
			floatingTimer.textContent = `${m}:${s}`;
		}
	}

	let timerDragStartY = null;
	let timerDragSeconds = 0;
	let timerDragged = false;

	let timerAudioContext = null;

	// --- Wake Lock (keeps screen/CPU awake on Android) ---
	async function acquireWakeLock() {
		try {
			if (navigator.wakeLock) {
				timerWakeLock = await navigator.wakeLock.request('screen');
				timerWakeLock.addEventListener('release', () => {
					// Auto-reacquire if timer is still active
					if (timerMode) {
						acquireWakeLock().catch(() => {});
					}
				});
			}
		} catch (e) {
			// Wake lock not supported or denied — fall back to keepalive below
		}
	}

	function releaseWakeLock() {
		if (timerWakeLock) {
			try { timerWakeLock.release(); } catch (e) {}
			timerWakeLock = null;
		}
	}

	// --- AudioContext keepalive (prevents browser from suspending the tab) ---
	function startKeepAliveAudio() {
		stopKeepAliveAudio();
		try {
			if (!window.AudioContext && !window.webkitAudioContext) return;
			if (!timerAudioContext) {
				timerAudioContext = new (window.AudioContext || window.webkitAudioContext)();
			}
			if (timerAudioContext.state === 'suspended') {
				void timerAudioContext.resume();
			}
			// Play a very quiet, inaudible tone to keep the AudioContext alive
			const oscillator = timerAudioContext.createOscillator();
			const gain = timerAudioContext.createGain();
			const keepAliveGain = 0.001; // Nearly silent
			gain.gain.setValueAtTime(keepAliveGain, timerAudioContext.currentTime);
			oscillator.frequency.value = 20; // Sub-bass, mostly inaudible
			oscillator.connect(gain);
			gain.connect(timerAudioContext.destination);
			oscillator.start();
			// Keep a reference to stop it later
			timerKeepAliveOsc = oscillator;
			timerKeepAliveGain = gain;
		} catch (e) {
			// Keepalive not available
		}
	}

	function stopKeepAliveAudio() {
		if (timerKeepAliveOsc) {
			try { timerKeepAliveOsc.stop(); } catch (e) {}
			timerKeepAliveOsc = null;
		}
		timerKeepAliveGain = null;
	}

	let timerKeepAliveOsc = null;
	let timerKeepAliveGain = null;

	function playTimerBeep() {
		const beepCount = data.settings?.timerBeepCount ?? 2;
		const volume = data.settings?.timerAlertVolume ?? 80;
		const soundType = data.settings?.timerAlertSound || 'single';

		if (window.AndroidInterface && window.AndroidInterface.playBeep) {
			window.AndroidInterface.playBeep(soundType, beepCount, volume);
			return;
		}

		try {
			if (!window.AudioContext && !window.webkitAudioContext) return;
			if (!timerAudioContext) {
				timerAudioContext = new (window.AudioContext || window.webkitAudioContext)();
			}
			if (timerAudioContext.state === 'suspended') {
				void timerAudioContext.resume();
			}
			const audioVolume = Math.max(0, Math.min(1, volume / 100));
			const playBeep = (frequency, duration, offset = 0) => {
				const oscillator = timerAudioContext.createOscillator();
				const gain = timerAudioContext.createGain();
				oscillator.frequency.value = frequency;
				const gainValue = Math.max(0.01, audioVolume * 0.45);
				gain.gain.setValueAtTime(gainValue, timerAudioContext.currentTime + offset);
				gain.gain.exponentialRampToValueAtTime(0.001, timerAudioContext.currentTime + offset + duration);
				oscillator.connect(gain);
				gain.connect(timerAudioContext.destination);
				oscillator.start(timerAudioContext.currentTime + offset);
				oscillator.stop(timerAudioContext.currentTime + offset + duration + 0.02);
			};

			const frequency = soundType === 'low' ? 440 : (soundType === 'high' ? 1320 : 880);
			const duration = soundType === 'low' ? 0.2 : (soundType === 'high' ? 0.12 : 0.15);
			const spacing = duration + 0.08;

			for (let i = 0; i < beepCount; i++) {
				playBeep(frequency, duration, i * spacing);
			}
		} catch (e) {
			console.warn('Timer beep failed', e);
		}
	}

	function stopTimer(reset = false) {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (reset) {
			timerSeconds = 0;
			timerStartTime = null;
			timerEndTime = null;
			timerMode = null;
		}
		releaseWakeLock();
		stopKeepAliveAudio();
		if (window.AndroidInterface && window.AndroidInterface.stopTimer) {
			window.AndroidInterface.stopTimer();
		}
		updateTimerDisplay();
		floatingTimer.style.opacity = '1';
	}

	function tickTimer() {
		if (timerMode === 'up') {
			const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
			timerSeconds = elapsed;
			updateTimerDisplay();
		} else if (timerMode === 'down') {
			const remaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
			if (remaining <= 0) {
				stopTimer(true);
				playTimerBeep();
			} else {
				timerSeconds = remaining;
				updateTimerDisplay();
			}
		}
	}

	function startCountUp() {
		stopTimer(true);
		timerMode = 'up';
		timerStartTime = Date.now();
		timerInterval = setInterval(tickTimer, 1000);
		acquireWakeLock();
		startKeepAliveAudio();
		if (window.AndroidInterface && window.AndroidInterface.startTimer) {
			window.AndroidInterface.startTimer();
		}
		floatingTimer.style.opacity = '0.9';
		tickTimer();
	}

	function startCountDown(seconds) {
		stopTimer(true);
		timerMode = 'down';
		timerEndTime = Date.now() + seconds * 1000;
		timerInterval = setInterval(tickTimer, 1000);
		acquireWakeLock();
		startKeepAliveAudio();
		if (window.AndroidInterface && window.AndroidInterface.startTimer) {
			window.AndroidInterface.startTimer();
		}
		floatingTimer.style.opacity = '0.9';
		tickTimer();
	}

	function syncTimerOnWake() {
		if (timerMode) {
			tickTimer();
			// Re-acquire wake lock if it was lost during sleep
			if (timerMode && !timerWakeLock) {
				acquireWakeLock();
			}
			// Resume keepalive audio if needed
			if (timerMode && !timerKeepAliveOsc) {
				startKeepAliveAudio();
			}
		}
	}

	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			syncTimerOnWake();
		}
	});

	window.addEventListener('focus', syncTimerOnWake);

	// Handle WebView/Cordova resume events
	document.addEventListener('resume', syncTimerOnWake);
	window.addEventListener('pageshow', syncTimerOnWake);

	if (floatingTimer) {
		floatingTimer.style.touchAction = 'none';

		floatingTimer.addEventListener('pointerdown', (e) => {
			timerDragStartY = e.clientY;
			timerDragSeconds = 0;
			timerDragged = false;
			floatingTimer.setPointerCapture(e.pointerId);
		});

		floatingTimer.addEventListener('pointermove', (e) => {
			if (timerDragStartY === null) return;
			const deltaY = timerDragStartY - e.clientY;
			if (deltaY < 30) {
				return;
			}
			const increments = Math.floor(deltaY / 30);
			const newSeconds = increments * 30;
			if (newSeconds !== timerDragSeconds) {
				timerDragged = true;
				timerDragSeconds = newSeconds;
				timerSeconds = timerDragSeconds;
				updateTimerDisplay();
				floatingTimer.style.opacity = '0.9';
			}
		});

		floatingTimer.addEventListener('pointerup', (e) => {
			floatingTimer.releasePointerCapture(e.pointerId);
			if (timerDragged && timerDragSeconds > 0) {
				startCountDown(timerDragSeconds);
			} else {
				if (timerInterval) {
					stopTimer(true);
				} else {
					startCountUp();
				}
			}
			timerDragStartY = null;
			timerDragSeconds = 0;
			timerDragged = false;
		});

		floatingTimer.addEventListener('pointercancel', (e) => {
			floatingTimer.releasePointerCapture(e.pointerId);
			timerDragStartY = null;
			timerDragSeconds = 0;
			timerDragged = false;
		});
	}

	// --- Swipe Navigation ---
	let touchStartX = 0;
	let touchStartY = 0;
	let touchEndX = 0;
	let touchEndY = 0;

	const mainViews = ['home', 'programs', 'routines', 'exercises'];

	document.addEventListener('touchstart', (e) => {
		touchStartX = e.changedTouches[0].screenX;
		touchStartY = e.changedTouches[0].screenY;
	}, { passive: true });

	document.addEventListener('touchend', (e) => {
		touchEndX = e.changedTouches[0].screenX;
		touchEndY = e.changedTouches[0].screenY;
		handleSwipe();
	}, { passive: true });

	function handleSwipe() {
		// Don't swipe if a dialog is open or if we are reordering
		if (document.querySelector('dialog[open]') || globalIsReordering) return;

		const xDiff = touchStartX - touchEndX;
		const yDiff = touchStartY - touchEndY;

		if (Math.abs(xDiff) < Math.abs(yDiff)) {
			return; // Mostly vertical swipe, likely scrolling
		}

		if (Math.abs(xDiff) < 50) {
			return; // Swipe too short
		}

		const currentIndex = mainViews.indexOf(currentViewName);
		if (currentIndex === -1) return; // Only swipe on main views

		if (xDiff > 0) {
			// Swipe left -> go to next view
			if (currentIndex < mainViews.length - 1) {
				renderView(mainViews[currentIndex + 1]);
			}
		} else {
			// Swipe right -> go to prev view
			if (currentIndex > 0) {
				renderView(mainViews[currentIndex - 1]);
			}
		}
	}

	window.addEventListener('popstate', (e) => {
		if (e.state && e.state.view) {
			currentDepth = e.state.depth || 0;
			if (e.state.exercise) currentExercise = e.state.exercise;
			renderView(e.state.view, false);
		} else {
			currentDepth = 0;
			renderView('home', false);
		}
	});

	// Initial state
	currentDepth = 0;
	history.replaceState({ view: 'home', exercise: currentExercise, depth: 0 }, '', '');
	renderView('home', false);
});
