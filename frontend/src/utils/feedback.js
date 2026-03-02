function getBootstrap() {
  if (typeof window === 'undefined') return null;
  return window.bootstrap || null;
}

function getContainer() {
  const id = 'sistra-toast-container';
  let container = document.getElementById(id);
  if (!container) {
    container = document.createElement('div');
    container.id = id;
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1100';
    document.body.appendChild(container);
  }
  return container;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function showToast(message, type = 'info', title = 'SISTRA') {
  const bs = getBootstrap();
  if (!bs) {
    window.alert(message);
    return;
  }

  const variantByType = {
    success: 'text-bg-success',
    error: 'text-bg-danger',
    warning: 'text-bg-warning',
    info: 'text-bg-primary'
  };

  const variant = variantByType[type] || variantByType.info;
  const container = getContainer();
  const wrapper = document.createElement('div');

  wrapper.innerHTML = `
    <div class="toast ${variant} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-header">
        <strong class="me-auto">${escapeHtml(title)}</strong>
        <small>ahora</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">${escapeHtml(message)}</div>
    </div>
  `;

  const toastElement = wrapper.firstElementChild;
  container.appendChild(toastElement);

  const toast = new bs.Toast(toastElement, {
    delay: 3500,
    autohide: true
  });

  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });

  toast.show();
}

export function confirmAction(message, title = 'Confirmar acción') {
  const bs = getBootstrap();
  if (!bs) {
    return Promise.resolve(window.confirm(message));
  }

  return new Promise((resolve) => {
    const modalId = `confirm-modal-${Date.now()}`;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${escapeHtml(title)}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">${escapeHtml(message)}</div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-action="cancel">Cancelar</button>
              <button type="button" class="btn btn-danger" data-action="confirm">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    const modalElement = wrapper.firstElementChild;
    document.body.appendChild(modalElement);

    const modal = new bs.Modal(modalElement);
    let resolved = false;

    const cleanup = (result) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
      modal.hide();
    };

    modalElement.querySelector('[data-action="confirm"]').addEventListener('click', () => cleanup(true));
    modalElement.querySelector('[data-action="cancel"]').addEventListener('click', () => cleanup(false));
    modalElement.addEventListener('hidden.bs.modal', () => {
      modalElement.remove();
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    }, { once: true });

    modal.show();
  });
}