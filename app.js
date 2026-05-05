document.addEventListener('DOMContentLoaded', () => {
  const mainContent = document.getElementById('main-content');
  const navLinks = document.querySelectorAll('.nav-link');

  // Mock data mimicking the provided designs
  const data = {
    home: {
      date: '18 october 2026',
      items: [
        'shoulder press barbell',
        'incline bench press dumbell',
        'flat bench press barbell'
      ]
    },
    programs: [
      { name: '5x5', items: [] },
      { name: 'workout a', items: ['barbell back squat', 'barbell bench press', 'barbell row'] },
      { name: 'workout b', items: ['barbell back squat', 'barbell bench press', 'barbell row'] }
    ],
    routines: [
      { name: 'legs', items: ['leg press', 'leg press single leg', 'squat barbell', 'hamstring curl', 'leg extension'] },
      { name: 'chest and triceps', items: ['stretch hamstring'] },
      { name: 'workout a', items: ['barbell back squat', 'barbell bench press', 'barbell row'] },
      { name: 'workout b', items: ['barbell back squat', 'barbell bench press', 'barbell row'] }
    ],
    exercises: [
      'cable rear delt single arm',
      'leg press',
      'leg press single leg',
      'shoulder press barbell',
      'stretch groin wall',
      'stretch hamstring'
    ]
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
      
      if (data.home.items.length > 0) {
        data.home.items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.textContent = item;
          div.addEventListener('click', () => renderView('exercise-detail'));
          listContainer.appendChild(div);
        });
        emptyState.style.display = 'none';
      } else {
        emptyState.style.display = 'block';
      }
    } else if (viewName === 'programs') {
      const listContainer = content.getElementById('programs-list');
      data.programs.forEach(prog => {
        const header = document.createElement('div');
        header.className = 'list-header';
        header.innerHTML = `<span class="list-header-title">${prog.name}</span> <button class="btn-add-sm">+</button>`;
        listContainer.appendChild(header);

        prog.items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.textContent = item;
          listContainer.appendChild(div);
        });
      });
    } else if (viewName === 'routines') {
      const listContainer = content.getElementById('routines-list');
      data.routines.forEach(rout => {
        const header = document.createElement('div');
        header.className = 'list-header';
        header.innerHTML = `<span class="list-header-title">${rout.name}</span> <button class="btn-add-sm">+</button>`;
        listContainer.appendChild(header);

        rout.items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.textContent = item;
          listContainer.appendChild(div);
        });
      });
    } else if (viewName === 'exercises') {
      const listContainer = content.getElementById('exercises-list');
      data.exercises.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-item';
        div.textContent = item;
        div.addEventListener('click', () => renderView('exercise-detail'));
        listContainer.appendChild(div);
      });
    } else if (viewName === 'exercise-detail') {
      const backBtn = content.querySelector('.back-btn');
      backBtn.addEventListener('click', () => renderView('exercises'));
      
      const editIcon = content.querySelector('.edit-icon');
      if (editIcon) {
          editIcon.addEventListener('click', () => renderView('exercise-edit'));
      }
    } else if (viewName === 'exercise-edit') {
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
