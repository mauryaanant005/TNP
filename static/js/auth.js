/**
 * TCET Training & Placement Cell - Authentication & Password Toggle Helpers
 */

function togglePasswordVisibility(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const passwordInput = document.getElementById('password');
  const eyeOpen = document.getElementById('eyeOpenIcon');
  const eyeClosed = document.getElementById('eyeClosedIcon');

  if (!passwordInput) return false;

  const isCurrentPassword =
    passwordInput.getAttribute('type') === 'password' ||
    passwordInput.type === 'password';

  if (isCurrentPassword) {
    passwordInput.setAttribute('type', 'text');
    passwordInput.type = 'text';
    if (eyeOpen) eyeOpen.style.display = 'none';
    if (eyeClosed) eyeClosed.style.display = 'block';
  } else {
    passwordInput.setAttribute('type', 'password');
    passwordInput.type = 'password';
    if (eyeOpen) eyeOpen.style.display = 'block';
    if (eyeClosed) eyeClosed.style.display = 'none';
  }
  return false;
}

// Alias for backwards compatibility
window.togglePassword = togglePasswordVisibility;
window.togglePasswordVisibility = togglePasswordVisibility;

function toggleNamedPassword(inputId, openIconId, closedIconId, e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const input = document.getElementById(inputId);
  const openIcon = document.getElementById(openIconId);
  const closedIcon = document.getElementById(closedIconId);
  if (!input) return false;

  const isCurrent =
    input.getAttribute('type') === 'password' || input.type === 'password';

  input.setAttribute('type', isCurrent ? 'text' : 'password');
  input.type = isCurrent ? 'text' : 'password';

  if (openIcon) openIcon.style.display = isCurrent ? 'none' : 'block';
  if (closedIcon) closedIcon.style.display = isCurrent ? 'block' : 'none';
  return false;
}

window.togglePassword1 = function (e) {
  return toggleNamedPassword('password', 'eyeOpenIcon1', 'eyeClosedIcon1', e);
};

window.togglePassword2 = function (e) {
  return toggleNamedPassword('confirm_password', 'eyeOpenIcon2', 'eyeClosedIcon2', e);
};

// Auto-attach event listeners on DOM load
document.addEventListener('DOMContentLoaded', function () {
  const loginToggleBtn = document.getElementById('togglePasswordBtn');
  if (loginToggleBtn) {
    loginToggleBtn.addEventListener('click', togglePasswordVisibility);
  }

  const resetBtn1 = document.getElementById('togglePasswordBtn1');
  if (resetBtn1) {
    resetBtn1.addEventListener('click', window.togglePassword1);
  }

  const resetBtn2 = document.getElementById('togglePasswordBtn2');
  if (resetBtn2) {
    resetBtn2.addEventListener('click', window.togglePassword2);
  }
});
