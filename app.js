document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const navLinks = document.querySelectorAll('.nav-link');

  let currentExercise = '';

  // Mock data mimicking the provided designs
  const data = {
    home: {
      date: '18 october 2026',
      items: []
    },
    programs: [],
    routines: [],
    exercises: []
  };

  const sdDialog = document.getElementById('selection-dialog');
  const sdTitle = document.getElementById('sd-title');
  const sdList = document.getElementById('sd-list');
  const sdNewContainer = document.getElementById('sd-new-container');
  const sdInput = document.getElementById('sd-input');
  const sdCancel = document.getElementById('sd-cancel');
  const sdAddNewBtn = document.getElementById('sd-add-new-btn');
  const sdSaveBtn = document.getElementById('sd-save-btn');
  
  let currentSelectionCallback = null;
  
  function openSelectionDialog(title, optionsList, onSelect) {
      sdTitle.textContent = title;
      currentSelectionCallback = onSelect;
      
      sdList.style.display = 'block';
      sdNewContainer.style.display = 'none';
      sdAddNewBtn.style.display = 'block';
      sdSaveBtn.style.display = 'none';
      sdInput.value = '';
      
      sdList.innerHTML = '';
      if (optionsList.length === 0) {
          sdList.innerHTML = '<div style="color: gray; font-size: 14px; text-align: center; padding: 12px;">No existing entries</div>';
      } else {
          const sortedOptions = [...optionsList].sort((a, b) => a.localeCompare(b));
          sortedOptions.forEach(opt => {
              const div = document.createElement('div');
              div.className = 'list-item';
              div.textContent = opt;
              div.addEventListener('click', () => {
                  sdDialog.close();
                  if(currentSelectionCallback) currentSelectionCallback(opt);
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

  function getExerciseObj(name) {
      let ex = data.exercises.find(e => e.name === name);
      if (!ex) {
          ex = { name: name, types: ['kg', 'reps'], logs: [] };
          data.exercises.push(ex);
      }
      return ex;
  }

  function renderView(viewName) {
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
      
      const mainAddBtn = content.querySelector('.btn-add');
      if (mainAddBtn) {
        mainAddBtn.addEventListener('click', () => {
          emptyState.style.display = 'none';
          renderInlineAdd(listContainer, (name) => {
            data.home.items.push(name);
            const allOptions = [...data.routines.map(r=>r.name), ...data.exercises.map(e=>e.name)];
            if (!allOptions.includes(name)) {
              getExerciseObj(name);
            }
            renderView('home');
          }, () => renderView('home'));
        });
      }

      if (data.home.items.length > 0) {
        data.home.items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.textContent = item;
          div.addEventListener('click', () => {
             currentExercise = item;
             renderView('exercise-detail');
          });
          listContainer.appendChild(div);
        });
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
        data.programs.forEach(prog => {
          const header = document.createElement('div');
          header.className = 'list-header';
          header.innerHTML = `<span class="list-header-title">${prog.name}</span> <button class="btn-add-sm">+</button>`;
          listContainer.appendChild(header);

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

          prog.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.textContent = item;
            listContainer.appendChild(div);
          });
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
        data.routines.forEach(rout => {
          const header = document.createElement('div');
          header.className = 'list-header';
          header.innerHTML = `<span class="list-header-title">${rout.name}</span> <button class="btn-add-sm">+</button>`;
          listContainer.appendChild(header);

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

          rout.items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.textContent = item;
            listContainer.appendChild(div);
          });
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
          div.textContent = item.name;
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
      backBtn.addEventListener('click', () => renderView('exercises'));
      
      const editIcon = content.querySelector('.edit-icon');
      if (editIcon) {
          editIcon.addEventListener('click', () => renderView('exercise-edit'));
      }

      const exObj = getExerciseObj(currentExercise);
      const logSection = content.querySelector('.log-input-section');
      logSection.innerHTML = '';
      
      if (exObj.types.length > 0) {
          const inputRow = document.createElement('div');
          inputRow.className = 'input-row';
          
          const sLabel = document.createElement('span');
          sLabel.className = 'input-label';
          sLabel.textContent = 's';
          inputRow.appendChild(sLabel);
          
          exObj.types.forEach(t => {
              const inp = document.createElement('input');
              inp.type = 'number';
              inp.className = 'val-input dyn-val';
              inp.dataset.type = t;
              
              const unit = document.createElement('span');
              unit.className = 'unit';
              unit.textContent = t;
              
              inputRow.appendChild(inp);
              inputRow.appendChild(unit);
          });
          
          const tagSpan = document.createElement('span');
          tagSpan.className = 'add-tag-inline';
          tagSpan.textContent = '<add tag>';
          inputRow.appendChild(tagSpan);
          
          logSection.appendChild(inputRow);
          
          const addBtn = document.createElement('button');
          addBtn.className = 'btn-large-add';
          addBtn.textContent = '+';
          addBtn.addEventListener('click', () => {
             const newLog = {};
             let hasData = false;
             inputRow.querySelectorAll('.dyn-val').forEach(inp => {
                 if(inp.value) {
                     newLog[inp.dataset.type] = inp.value;
                     hasData = true;
                 }
             });
             if (hasData) {
                 const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
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
                  
                  let html = `<span class="set-num">${set.index}</span>`;
                  Object.keys(set.data).forEach(k => {
                      html += `<span style="margin-right: 12px;">${set.data[k]} ${k}</span>`;
                  });
                  
                  setRow.innerHTML = html;
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
    }

    mainContent.appendChild(content);
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderView(e.target.dataset.target);
    });
  });

  renderView('home');
});
