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

  function renderView(viewName) {
    const template = document.getElementById(`view-${viewName}`);
    if (!template) return;

    // Update active nav link (top nav)
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

    // Populate data
    if (viewName === 'home') {
      const listContainer = content.getElementById('home-list');
      const emptyState = content.getElementById('home-empty');
      
      const mainAddBtn = content.querySelector('.btn-add');
      if (mainAddBtn) {
        mainAddBtn.addEventListener('click', () => {
          const name = prompt('Add routine/exercise to today:');
          if (name && name.trim() !== '') {
            data.home.items.push(name.trim());
            renderView('home');
          }
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
          const name = prompt('Add new program:');
          if (name && name.trim() !== '') {
            data.programs.push({ name: name.trim(), items: [] });
            renderView('programs');
          }
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
            const name = prompt(`Add routine to program "${prog.name}":`);
            if (name && name.trim() !== '') {
              prog.items.push(name.trim());
              renderView('programs');
            }
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
          const name = prompt('Add new routine:');
          if (name && name.trim() !== '') {
            data.routines.push({ name: name.trim(), items: [] });
            renderView('routines');
          }
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
            const name = prompt(`Add exercise to routine "${rout.name}":`);
            if (name && name.trim() !== '') {
              rout.items.push(name.trim());
              renderView('routines');
            }
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
          const name = prompt('Add new exercise:');
          if (name && name.trim() !== '') {
            data.exercises.push(name.trim());
            renderView('exercises');
          }
        });
      }

      if (data.exercises.length > 0) {
        data.exercises.forEach(item => {
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
    } else if (viewName === 'exercise-detail') {
      const titleSpan = content.querySelector('.ex-name');
      if (titleSpan) titleSpan.textContent = currentExercise;
      
      const backBtn = content.querySelector('.back-btn');
      backBtn.addEventListener('click', () => renderView('exercises'));
      
      const editIcon = content.querySelector('.edit-icon');
      if (editIcon) {
          editIcon.addEventListener('click', () => renderView('exercise-edit'));
      }
    } else if (viewName === 'exercise-edit') {
      const titleSpan = content.querySelector('.ex-name');
      if (titleSpan) titleSpan.textContent = currentExercise;

      const backBtn = content.querySelector('.back-btn');
      backBtn.addEventListener('click', () => renderView('exercise-detail'));
      
      const saveBtn = content.querySelector('.btn-large-add');
      saveBtn.addEventListener('click', () => renderView('exercise-detail'));
      
      // Handle custom checkboxes toggling
      const checkboxes = content.querySelectorAll('.custom-checkbox input');
      checkboxes.forEach(cb => {
          cb.addEventListener('change', (e) => {
              const icon = e.target.nextElementSibling;
              if (e.target.checked) {
                  icon.textContent = 'check_box';
              } else {
                  icon.textContent = 'check_box_outline_blank';
              }
          });
      });
    }

    mainContent.appendChild(content);
  }

  // Setup nav listeners
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      renderView(e.target.dataset.target);
    });
  });

  // Initial render
  renderView('home');
});
