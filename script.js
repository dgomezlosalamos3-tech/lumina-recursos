const supabaseClient = window.supabase.createClient(
  'https://lnblooccrqjmkkibqspj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYmxvb2NjcnFqbWtraWJxc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyMTgwMjIsImV4cCI6MjA5OTc5NDAyMn0.sf6aBWWzXZ6GvOwwZ6yJg857gxU-OfHlwr4776RF918'
);

const signupForm = document.querySelector('#signup-form');
const signupMessage = document.querySelector('#form-message');
const loginForm = document.querySelector('#login-form');
const loginMessage = document.querySelector('#login-message');
const library = document.querySelector('#biblioteca');
const logout = document.querySelector('#logout');
const downloadMessage = document.querySelector('#download-message');
const diplomaToggle = document.querySelector('#diploma-toggle');
const diplomaTag = document.querySelector('#diploma-tag');
const diplomaDescription = document.querySelector('#diploma-description');
const requiredSections = ['guia-lectura', 'juegos-de-palabras', 'planificador-semanal', 'acompanar-con-calma', 'clase-inclusiva'];
// El progreso solo cuenta durante la visita actual: el Diploma siempre inicia bloqueado al abrir el enlace.
const completedSections = new Set();

function updateDiploma() {
  const progress = requiredSections.filter((section) => completedSections.has(section)).length;
  const unlocked = progress === requiredSections.length;

  diplomaToggle.disabled = !unlocked;
  diplomaToggle.textContent = unlocked ? 'Ver mi diploma ↓' : `Completa ${progress} de ${requiredSections.length} secciones`;
  diplomaToggle.setAttribute('aria-expanded', 'false');
  diplomaTag.textContent = unlocked ? 'DIPLOMA · DESBLOQUEADO' : 'DIPLOMA · BLOQUEADO';
  diplomaDescription.textContent = unlocked
    ? '¡Lo lograste! Tu diploma ya está disponible.'
    : 'Explora las 5 secciones de recursos para desbloquear tu diploma.';
}

function showLibrary() {
  library.hidden = false;
  updateDiploma();
  library.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Al volver de una descarga o recargar la página, conserva la sesión iniciada.
supabaseClient.auth.getSession().then(({ data: { session } }) => {
  if (session) showLibrary();
});

signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.querySelector('#name').value.trim();
  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#signup-password').value;
  signupMessage.textContent = 'Creando tu cuenta…';

  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });

  if (error) {
    signupMessage.textContent = error.message;
    return;
  }

  // La creación de cuenta no da acceso directo: la persona debe iniciar sesión.
  await supabaseClient.auth.signOut({ scope: 'local' });
  signupForm.reset();
  signupMessage.textContent = '¡Cuenta creada! Ahora inicia sesión con tu correo y contraseña.';
  window.setTimeout(() => {
    window.location.hash = 'iniciar-sesion';
    window.location.reload();
  }, 900);
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.querySelector('#login-email').value.trim();
  const password = document.querySelector('#password').value;
  loginMessage.textContent = 'Comprobando tu cuenta…';

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    loginMessage.textContent = 'No pudimos iniciar sesión. Revisa que el correo y la contraseña sean los mismos que usaste al crear tu cuenta.';
    return;
  }

  loginForm.reset();
  loginMessage.textContent = '¡Bienvenido/a!';
  showLibrary();
});

logout.addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
  library.hidden = true;
  document.querySelector('#registro').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.querySelectorAll('.download').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.classList.contains('resource-toggle')) return;
    downloadMessage.textContent = 'Tu descarga se abrirá en una nueva pestaña.';
  });
});

document.querySelectorAll('.resource-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const section = document.querySelector(`#${button.dataset.target}`);
    const isOpen = !section.hidden;
    section.hidden = isOpen;
    button.setAttribute('aria-expanded', String(!isOpen));
    button.innerHTML = isOpen
      ? 'Ver todos <span aria-hidden="true">↓</span>'
      : 'Ocultar <span aria-hidden="true">↑</span>';

    if (!isOpen) {
      if (requiredSections.includes(button.dataset.target)) {
        completedSections.add(button.dataset.target);
        updateDiploma();
      }
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
