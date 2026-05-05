document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const navLinks = document.querySelectorAll('.nav-link');

  let currentExercise = '';
  let currentViewName = 'home';
  let exerciseReturnView = 'exercises';

  const DEFAULT_COLORS = {
      primary: '#beff5c',
      bg: '#ffffff',
      textDark: '#111111',
      textLight: '#666666',
      textDisabled: '#bbbbbb',
      border: '#e0e0e0'
  };

  const DEFAULT_DATA = {
    version: 1,
    settings: { debugDate: '', colors: { ...DEFAULT_COLORS } },
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
              settings: parsed.settings || { debugDate: '', colors: { ...DEFAULT_COLORS } },
              home: parsed.home || DEFAULT_DATA.home,
              programs: parsed.programs || [],
              routines: parsed.routines || [],
              exercises: parsed.exercises || []
          };
      }
  } catch(e) {
      console.error('Failed to parse saved data', e);
  }

  function applyColors() {
      const colors = (data.settings && data.settings.colors) ? data.settings.colors : DEFAULT_COLORS;
      document.documentElement.style.setProperty('--primary-color', colors.primary || DEFAULT_COLORS.primary);
      document.documentElement.style.setProperty('--bg-color', colors.bg || DEFAULT_COLORS.bg);
      document.documentElement.style.setProperty('--text-dark', colors.textDark || DEFAULT_COLORS.textDark);
      document.documentElement.style.setProperty('--text-light', colors.textLight || DEFAULT_COLORS.textLight);
      document.documentElement.style.setProperty('--text-disabled', colors.textDisabled || DEFAULT_COLORS.textDisabled);
      document.documentElement.style.setProperty('--border-color', colors.border || DEFAULT_COLORS.border);
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

  function saveData() {
      localStorage.setItem('grenelle_fitness_data', JSON.stringify(data, null, 2));
  }

  const settingsIcon = document.querySelector('.settings-icon');
  if (settingsIcon) {
      settingsIcon.addEventListener('click', () => {
          renderView('settings');
      });
  }
  
  const sdDialog = document.getElementById('selection-dialog');
  const sdTitle = document.getElementById('sd-title');
  const sdList = document.getElementById('sd-list');
  const sdNewContainer = document.getElementById('sd-new-container');
  const sdInput = document.getElementById('sd-input');
  const sdCancel = document.getElementById('sd-cancel');
  const sdAddNewBtn = document.getElementById('sd-add-new-btn');
  const sdSaveBtn = document.getElementById('sd-save-btn');
  
  let currentSelectionCallback = null;
  
  function openSelectionDialog(title, optionsList, onSelect, addNewText = 'add new') {
      sdTitle.textContent = title;
      currentSelectionCallback = onSelect;
      sdAddNewBtn.textContent = addNewText;
      
      sdList.style.display = 'block';
      sdNewContainer.style.display = 'none';
      sdAddNewBtn.style.display = 'block';
      sdSaveBtn.style.display = 'none';
      sdInput.value = '';
      
      sdList.innerHTML = '';
      if (optionsList.length === 0) {
          sdList.innerHTML = '<div style="color: gray; font-size: 14px; text-align: center; padding: 12px;">No existing entries</div>';
      } else {
          let options = optionsList.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
          if (typeof optionsList[0] === 'string') {
              options.sort((a, b) => a.label.localeCompare(b.label));
          }
          options.forEach(opt => {
              const div = document.createElement('div');
              div.className = 'list-item';
              div.textContent = opt.label;
              div.addEventListener('click', () => {
                  sdDialog.close();
                  if(currentSelectionCallback) currentSelectionCallback(opt.value);
              });
              sdList.appendChild(div);
          });
      }
      
      sdDialog.showModal();
  }
  
  sdCancel.addEventListener('click', () => sdDialog.close());
  
  sdAddNewBtn.addEventListener('click', () => {
      sdList.style.display = 'none';
      sdAddNewBtn.style.display = 'none';
      sdNewContainer.style.display = 'block';
      sdSaveBtn.style.display = 'block';
      sdInput.focus();
  });
  
  sdSaveBtn.addEventListener('click', () => {
      const val = sdInput.value.trim();
      if (val) {
          sdDialog.close();
          if(currentSelectionCallback) currentSelectionCallback(val);
      }
  });

  function renderInlineAdd(listContainer, onSave, onCancel) {
      if (listContainer.querySelector('.inline-add-row')) return;
      
      const row = document.createElement('div');
      row.className = 'list-item inline-add-row';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'inline-input';
      input.placeholder = 'Name...';
      
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
              Array.from(container.children).forEach(c => {
                  const idx = parseInt(c.dataset.index, 10);
                  if (!isNaN(idx)) {
                      newArray.push(array[idx]);
                  }
              });
              onReorder(newArray);
          });

          // --- Mobile Touch Drag & Drop ---
          let pressTimer = null;
          let isDragging = false;
          let wasDragging = false;

          child.addEventListener('touchstart', (e) => {
              if (e.touches.length !== 1) return;
              pressTimer = setTimeout(() => {
                  isDragging = true;
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
                  wasDragging = true;
                  setTimeout(() => wasDragging = false, 50);
                  
                  if (draggedItem) draggedItem.style.opacity = '1';
                  draggedItem = null;
                  
                  const newArray = [];
                  Array.from(container.children).forEach(c => {
                      const idx = parseInt(c.dataset.index, 10);
                      if (!isNaN(idx)) newArray.push(array[idx]);
                  });
                  onReorder(newArray);
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

  function getExerciseObj(name) {
      let ex = data.exercises.find(e => e.name === name);
      if (!ex) {
          ex = { name: name, types: ['kg', 'reps'], logs: [], notes: '' };
          data.exercises.push(ex);
      }
      return ex;
  }

  function renderView(viewName) {
    if (viewName === 'exercise-detail' && ['home', 'programs', 'routines', 'exercises'].includes(currentViewName)) {
        exerciseReturnView = currentViewName;
    }
    currentViewName = viewName;

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
    if (['home', 'programs', 'routines', 'exercises'].includes(viewName)) {
      topNav.style.display = 'flex';
    } else {
      topNav.style.display = 'none';
    }

    mainContent.innerHTML = '';
    const content = template.content.cloneNode(true);

    if (viewName === 'home') {
      const listContainer = content.getElementById('home-list');
      const emptyState = content.getElementById('home-empty');
      const dateDisplay = content.getElementById('home-date-display');
      
      const todayStr = getCurrentDate();
      const itemsToday = getHomeItemsForDate(todayStr);

      if (dateDisplay) {
          dateDisplay.textContent = todayStr;
      }
      
      const mainAddBtn = content.querySelector('.btn-add');
      if (mainAddBtn) {
        mainAddBtn.addEventListener('click', () => {
          const routines = data.routines.map(r => ({ label: `[routine] ${r.name}`, value: { type: 'routine', items: r.items } })).sort((a,b) => a.label.localeCompare(b.label));
          const exercises = data.exercises.map(e => ({ label: e.name, value: { type: 'exercise', name: e.name } })).sort((a,b) => a.label.localeCompare(b.label));
          const allOptions = [...routines, ...exercises];

          openSelectionDialog('Add routine or exercise', allOptions, (selection) => {
            if (typeof selection === 'string') {
                itemsToday.push(selection);
                getExerciseObj(selection);
            } else if (selection.type === 'routine') {
                selection.items.forEach(exName => {
                    itemsToday.push(exName);
                });
            } else {
                itemsToday.push(selection.name);
            }
            renderView('home');
          }, 'add new exercise');
        });
      }

      if (itemsToday.length > 0) {
        const homeContainer = document.createElement('div');
        itemsToday.forEach((item, index) => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          
          const textSpan = document.createElement('span');
          textSpan.style.flex = '1';
          textSpan.textContent = item;
          div.appendChild(textSpan);
          
          const rmBtn = document.createElement('button');
          rmBtn.className = 'btn-remove-sm material-icons-outlined';
          rmBtn.textContent = 'close';
          rmBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              itemsToday.splice(index, 1);
              renderView('home');
          });
          div.appendChild(rmBtn);

          div.dataset.index = index;
          div.addEventListener('click', () => {
             currentExercise = item;
             renderView('exercise-detail');
          });
          homeContainer.appendChild(div);
        });
        setupReorderable(homeContainer, itemsToday, (newArr) => {
           data.home.history[todayStr] = newArr;
           renderView('home');
        });
        listContainer.appendChild(homeContainer);
        emptyState.style.display = 'none';
      } else {
        emptyState.style.display = 'block';
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
        const sortedProgs = [...data.programs].sort((a,b) => a.name.localeCompare(b.name));
        sortedProgs.forEach(prog => {
          const progContainer = document.createElement('div');
          
          const header = document.createElement('div');
          header.className = 'list-header';
          header.innerHTML = `<span class="list-header-title">${prog.name}</span> <div style="display:flex"><button class="btn-add-sm">+</button><button class="btn-remove-sm material-icons-outlined">close</button></div>`;
          progContainer.appendChild(header);

          const headerRmBtn = header.querySelector('.btn-remove-sm');
          headerRmBtn.addEventListener('click', () => {
              if (confirm(`Delete program "${prog.name}"?`)) {
                  data.programs = data.programs.filter(p => p.name !== prog.name);
                  renderView('programs');
              }
          });

          const headerBtn = header.querySelector('.btn-add-sm');
          headerBtn.addEventListener('click', () => {
            openSelectionDialog(`Add routine to "${prog.name}"`, data.routines.map(r=>r.name), (name) => {
              prog.items.push(name);
              if (!data.routines.find(r => r.name === name)) {
                 data.routines.push({ name: name, items: [] });
              }
              renderView('programs');
            });
          });

          const routinesContainer = document.createElement('div');
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
            rHeader.innerHTML = `<span class="list-header-title">${routineName}</span> <div style="display:flex"><button class="btn-add-sm">+</button><button class="btn-remove-sm material-icons-outlined">close</button></div>`;
            rWrapper.appendChild(rHeader);

            const rRmBtn = rHeader.querySelector('.btn-remove-sm');
            rRmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Remove routine "${routineName}" from program?`)) {
                    prog.items.splice(index, 1);
                    renderView('programs');
                }
            });

            const rHeaderBtn = rHeader.querySelector('.btn-add-sm');
            rHeaderBtn.addEventListener('click', () => {
              openSelectionDialog(`Add exercise to "${routineName}"`, data.exercises.map(e=>e.name), (name) => {
                rout.items.push(name);
                if (!data.exercises.find(e=>e.name === name)) {
                  getExerciseObj(name);
                }
                renderView('programs');
              });
            });

            rout.items.forEach((exName, exIndex) => {
              const div = document.createElement('div');
              div.className = 'list-item';
              div.style.display = 'flex';
              div.style.alignItems = 'center';
              
              const textSpan = document.createElement('span');
              textSpan.style.flex = '1';
              textSpan.style.textAlign = 'right';
              textSpan.textContent = exName;
              div.appendChild(textSpan);
              
              const rmBtn = document.createElement('button');
              rmBtn.className = 'btn-remove-sm material-icons-outlined';
              rmBtn.textContent = 'close';
              rmBtn.addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (confirm(`Remove exercise "${exName}" from routine?`)) {
                      rout.items.splice(exIndex, 1);
                      renderView('programs');
                  }
              });
              div.appendChild(rmBtn);

              div.addEventListener('click', () => {
                  currentExercise = exName;
                  renderView('exercise-detail');
              });
              rWrapper.appendChild(div);
            });
            
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
        const sortedRouts = [...data.routines].sort((a,b) => a.name.localeCompare(b.name));
        sortedRouts.forEach(rout => {
          const routContainer = document.createElement('div');
          
          const header = document.createElement('div');
          header.className = 'list-header';
          header.innerHTML = `<span class="list-header-title">${rout.name}</span> <div style="display:flex"><button class="btn-add-sm">+</button><button class="btn-remove-sm material-icons-outlined">close</button></div>`;
          routContainer.appendChild(header);

          const headerRmBtn = header.querySelector('.btn-remove-sm');
          headerRmBtn.addEventListener('click', () => {
              if (confirm(`Delete routine "${rout.name}" completely?`)) {
                  data.routines = data.routines.filter(r => r.name !== rout.name);
                  data.programs.forEach(p => {
                      p.items = p.items.filter(rName => rName !== rout.name);
                  });
                  renderView('routines');
              }
          });

          const headerBtn = header.querySelector('.btn-add-sm');
          headerBtn.addEventListener('click', () => {
            openSelectionDialog(`Add exercise to "${rout.name}"`, data.exercises.map(e=>e.name), (name) => {
              rout.items.push(name);
              if (!data.exercises.find(e=>e.name === name)) {
                getExerciseObj(name);
              }
              renderView('routines');
            });
          });

          const itemsContainer = document.createElement('div');
          rout.items.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            
            const textSpan = document.createElement('span');
            textSpan.style.flex = '1';
            textSpan.style.textAlign = 'right';
            textSpan.textContent = item;
            div.appendChild(textSpan);
            
            const rmBtn = document.createElement('button');
            rmBtn.className = 'btn-remove-sm material-icons-outlined';
            rmBtn.textContent = 'close';
            rmBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Remove exercise "${item}" from routine?`)) {
                    rout.items.splice(index, 1);
                    renderView('routines');
                }
            });
            div.appendChild(rmBtn);

            div.dataset.index = index;
            div.addEventListener('click', () => {
                currentExercise = item;
                renderView('exercise-detail');
            });
            itemsContainer.appendChild(div);
          });
          
          setupReorderable(itemsContainer, rout.items, (newArr) => {
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
      const emptyState = content.getElementById('exercises-empty');
      
      const mainAddBtn = content.querySelector('.main-add-row .btn-add');
      if (mainAddBtn) {
        mainAddBtn.addEventListener('click', () => {
          emptyState.style.display = 'none';
          renderInlineAdd(listContainer, (name) => {
             if (!data.exercises.find(e=>e.name === name)) {
               getExerciseObj(name);
             }
             renderView('exercises');
          }, () => renderView('exercises'));
        });
      }

      if (data.exercises.length > 0) {
        const sorted = [...data.exercises].sort((a,b) => a.name.localeCompare(b.name));
        sorted.forEach(item => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          
          const textSpan = document.createElement('span');
          textSpan.style.flex = '1';
          textSpan.textContent = item.name;
          div.appendChild(textSpan);
          
          const rmBtn = document.createElement('button');
          rmBtn.className = 'btn-remove-sm material-icons-outlined';
          rmBtn.textContent = 'close';
          rmBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (confirm(`Delete exercise "${item.name}" completely?`)) {
                  data.exercises = data.exercises.filter(ex => ex.name !== item.name);
                  data.routines.forEach(r => {
                      r.items = r.items.filter(exName => exName !== item.name);
                  });
                  renderView('exercises');
              }
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
        emptyState.style.display = 'block';
      }
    } else if (viewName === 'exercise-detail') {
      const titleSpan = content.querySelector('.ex-name');
      if (titleSpan) titleSpan.textContent = currentExercise;
      
      const backBtn = content.querySelector('.back-btn');
      backBtn.addEventListener('click', () => renderView(exerciseReturnView));
      
      const editIcon = content.querySelector('.edit-icon');
      if (editIcon) {
          editIcon.addEventListener('click', () => renderView('exercise-edit'));
      }

      const exObj = getExerciseObj(currentExercise);

      // Tab switching logic
      const tabLinks = content.querySelectorAll('.d-nav-link');
      const tabLogs = content.getElementById('tab-logs');
      const tabNotes = content.getElementById('tab-notes');
      
      tabLinks.forEach(link => {
          link.addEventListener('click', (e) => {
              e.preventDefault();
              tabLinks.forEach(l => l.classList.remove('active'));
              link.classList.add('active');
              
              if (link.dataset.tab === 'logs') {
                  tabLogs.style.display = 'block';
                  tabNotes.style.display = 'none';
              } else if (link.dataset.tab === 'notes') {
                  tabLogs.style.display = 'none';
                  tabNotes.style.display = 'block';
              } else {
                  tabLogs.style.display = 'none';
                  tabNotes.style.display = 'none';
              }
          });
      });

      // Notes textarea persistence
      const notesArea = content.querySelector('.notes-textarea');
      if (notesArea) {
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
          
          exObj.types.forEach((t, i) => {
              const row = Math.floor(i / 2) + 1;
              const col = (i % 2) + 2;
              
              if (i === 0) {
                  const sLabel = document.createElement('span');
                  sLabel.className = 'input-label';
                  sLabel.textContent = 's';
                  sLabel.style.gridColumn = '1';
                  sLabel.style.gridRow = '1';
                  sLabel.style.textAlign = 'right';
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
          grid.appendChild(tagSpan);
          
          logSection.appendChild(grid);
          
          const addBtn = document.createElement('button');
          addBtn.className = 'btn-large-add';
          addBtn.textContent = '+';
          addBtn.addEventListener('click', () => {
             const newLog = {};
             let hasData = false;
             grid.querySelectorAll('.dyn-val').forEach(inp => {
                 if(inp.value) {
                     newLog[inp.dataset.type] = inp.value;
                     hasData = true;
                 }
             });
             if (hasData) {
                 const today = getCurrentDate();
                 exObj.logs.push({ date: today, data: newLog });
                 renderView('exercise-detail');
             }
          });
          logSection.appendChild(addBtn);
      }

      const historyList = content.querySelector('.history-list');
      historyList.innerHTML = '';
      if (exObj.logs && exObj.logs.length > 0) {
          const grouped = {};
          exObj.logs.forEach(log => {
              if(!grouped[log.date]) grouped[log.date] = [];
              grouped[log.date].push({ ...log, index: grouped[log.date].length + 1 });
          });
          
          const sortedDates = Object.keys(grouped).reverse();
          sortedDates.forEach(dateStr => {
              const dayDiv = document.createElement('div');
              dayDiv.className = 'history-day';
              
              const header = document.createElement('div');
              header.className = 'day-header';
              const todayStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
              header.innerHTML = `<span>${dateStr === todayStr ? 'today' : dateStr}</span>`;
              dayDiv.appendChild(header);
              
              grouped[dateStr].forEach(set => {
                  const setRow = document.createElement('div');
                  setRow.className = 'set-row';
                  
                  const numSpan = document.createElement('span');
                  numSpan.className = 'set-num';
                  numSpan.textContent = set.index;
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
                  
                  // Add 1RM if only kg and reps
                  const dataKeys = Object.keys(set.data);
                  if (dataKeys.length === 2 && dataKeys.includes('kg') && dataKeys.includes('reps')) {
                      const w = parseFloat(set.data.kg);
                      const r = parseInt(set.data.reps, 10);
                      if (!isNaN(w) && !isNaN(r) && r > 0) {
                          const oneRm = Math.round(w * (1 + r / 30));
                          const rmSpan = document.createElement('span');
                          rmSpan.className = 'set-rm';
                          rmSpan.textContent = `1rm ${oneRm}kg`;
                          rmSpan.style.gridColumn = '3';
                          rmSpan.style.gridRow = '1';
                          rmSpan.style.textAlign = 'right';
                          metricsGrid.appendChild(rmSpan);
                      }
                  }
                  
                  setRow.appendChild(metricsGrid);
                  dayDiv.appendChild(setRow);
              });
              
              historyList.appendChild(dayDiv);
          });
      }

    } else if (viewName === 'exercise-edit') {
      const titleSpan = content.querySelector('.ex-name');
      if (titleSpan) titleSpan.textContent = currentExercise;

      const backBtn = content.querySelector('.back-btn');
      backBtn.addEventListener('click', () => renderView('exercise-detail'));
      
      const exObj = getExerciseObj(currentExercise);

      const checkboxes = content.querySelectorAll('.custom-checkbox input');
      checkboxes.forEach(cb => {
          const type = cb.dataset.type;
          const icon = cb.nextElementSibling;
          if (exObj.types.includes(type)) {
              cb.checked = true;
              icon.textContent = 'check_box';
          } else {
              cb.checked = false;
              icon.textContent = 'check_box_outline_blank';
          }

          cb.addEventListener('change', (e) => {
              if (e.target.checked) {
                  icon.textContent = 'check_box';
              } else {
                  icon.textContent = 'check_box_outline_blank';
              }
          });
      });

      const saveBtn = content.querySelector('.btn-large-add');
      saveBtn.addEventListener('click', () => {
          const newTypes = [];
          checkboxes.forEach(cb => {
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
          backBtn.addEventListener('click', () => renderView('home'));
      }
      
      const debugInput = content.querySelector('#debug-date-input');
      if (debugInput) {
          debugInput.value = data.settings?.debugDate || '';
          debugInput.addEventListener('change', (e) => {
              if (!data.settings) data.settings = {};
              data.settings.debugDate = e.target.value.trim();
              saveData();
          });
      }

      const colorPrimary = content.querySelector('#color-primary');
      const colorBg = content.querySelector('#color-bg');
      const colorTextDark = content.querySelector('#color-text-dark');
      const colorTextLight = content.querySelector('#color-text-light');
      const colorTextDisabled = content.querySelector('#color-text-disabled');
      const colorBorder = content.querySelector('#color-border');
      
      if (colorPrimary && colorBg && colorTextDark) {
          const currentColors = (data.settings && data.settings.colors) ? data.settings.colors : DEFAULT_COLORS;
          colorPrimary.value = currentColors.primary || DEFAULT_COLORS.primary;
          colorBg.value = currentColors.bg || DEFAULT_COLORS.bg;
          colorTextDark.value = currentColors.textDark || DEFAULT_COLORS.textDark;
          colorTextLight.value = currentColors.textLight || DEFAULT_COLORS.textLight;
          colorTextDisabled.value = currentColors.textDisabled || DEFAULT_COLORS.textDisabled;
          colorBorder.value = currentColors.border || DEFAULT_COLORS.border;
          
          const updateColor = () => {
              if (!data.settings) data.settings = {};
              if (!data.settings.colors) data.settings.colors = {};
              data.settings.colors.primary = colorPrimary.value;
              data.settings.colors.bg = colorBg.value;
              data.settings.colors.textDark = colorTextDark.value;
              data.settings.colors.textLight = colorTextLight.value;
              data.settings.colors.textDisabled = colorTextDisabled.value;
              data.settings.colors.border = colorBorder.value;
              applyColors();
              saveData();
          };
          
          colorPrimary.addEventListener('input', updateColor);
          colorBg.addEventListener('input', updateColor);
          colorTextDark.addEventListener('input', updateColor);
          colorTextLight.addEventListener('input', updateColor);
          colorTextDisabled.addEventListener('input', updateColor);
          colorBorder.addEventListener('input', updateColor);
      }
      
      const resetBtn = content.querySelector('#btn-reset-colors');
      if (resetBtn) {
          resetBtn.addEventListener('click', () => {
              if (!data.settings) data.settings = {};
              data.settings.colors = { ...DEFAULT_COLORS };
              applyColors();
              saveData();
              renderView('settings');
          });
      }
      const exportBtn = content.querySelector('#btn-export-data');
      if (exportBtn) {
          exportBtn.addEventListener('click', () => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `grenelle_fitness_data_${getCurrentDate()}.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
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
                          if (confirm('Are you sure you want to overwrite your current data with this backup?')) {
                              data = importedData;
                              saveData();
                              applyColors();
                              renderView('home');
                          }
                      } else {
                          alert('Invalid backup file format.');
                      }
                  } catch (err) {
                      alert('Failed to parse backup file.');
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
              if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                  localStorage.removeItem('grenelle_fitness_data');
                  data = JSON.parse(JSON.stringify(DEFAULT_DATA));
                  renderView('home');
              }
          });
      }
    }

    mainContent.appendChild(content);
    saveData();
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

  function updateTimerDisplay() {
      const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
      const s = (timerSeconds % 60).toString().padStart(2, '0');
      if (floatingTimer) {
          floatingTimer.textContent = `${m}:${s}`;
      }
  }

  if (floatingTimer) {
      floatingTimer.addEventListener('click', () => {
          if (timerInterval) {
              clearInterval(timerInterval);
              timerInterval = null;
              timerSeconds = 0;
              updateTimerDisplay();
              floatingTimer.style.opacity = '1';
          } else {
              timerInterval = setInterval(() => {
                  timerSeconds++;
                  updateTimerDisplay();
              }, 1000);
              floatingTimer.style.opacity = '0.9';
          }
      });
  }

  // --- Swipe Navigation ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;

  const mainViews = ['home', 'programs', 'routines', 'exercises'];

  mainContent.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
  }, { passive: true });

  mainContent.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
  }, { passive: true });

  function handleSwipe() {
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

  renderView('home');
});
