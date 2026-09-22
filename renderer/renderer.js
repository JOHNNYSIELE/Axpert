/**
 * @file renderer/renderer.js
 * Vanilla renderer entry point utilizing window.electronAPI.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const navConverter = document.getElementById('nav-btn-converter');
  const navMetadata = document.getElementById('nav-btn-metadata');
  const sectionConverter = document.getElementById('section-converter');
  const sectionMetadata = document.getElementById('section-metadata');

  const converterDropzone = document.getElementById('converter-dropzone');
  const queueContainer = document.getElementById('queue-container');
  const queueCounter = document.getElementById('queue-counter');
  const formatSelect = document.getElementById('format-select');
  const btnExecute = document.getElementById('btn-execute');

  const toggleOcr = document.getElementById('toggle-ocr');
  const toggleTable = document.getElementById('toggle-table');
  const toggleMetadata = document.getElementById('toggle-metadata');

  const metadataDropzone = document.getElementById('metadata-dropzone');
  const metadataDetails = document.getElementById('metadata-details');
  const metadataTbody = document.getElementById('metadata-tbody');
  const btnStripMeta = document.getElementById('btn-strip-meta');

  let queue = [];
  let metadataTargetFile = null;

  // Navigation
  navConverter.addEventListener('click', () => {
    navConverter.classList.add('active');
    navMetadata.classList.remove('active');
    sectionConverter.style.display = 'block';
    sectionMetadata.style.display = 'none';
  });

  navMetadata.addEventListener('click', () => {
    navMetadata.classList.add('active');
    navConverter.classList.remove('active');
    sectionConverter.style.display = 'none';
    sectionMetadata.style.display = 'block';
  });

  // Render queue items
  function renderQueue() {
    queueCounter.textContent = queue.length;
    if (queue.length === 0) {
      queueContainer.innerHTML = '<div style="font-size: 12px; color: var(--text-muted); font-family: monospace;">No files currently queued.</div>';
      return;
    }

    queueContainer.innerHTML = '';
    queue.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'queue-card';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 13px;">${item.name}</div>
            <div style="font-size: 11px; color: var(--text-muted); font-family: monospace;">
              ${item.type.toUpperCase()} • ${(item.size / 1024).toFixed(1)} KB
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 11px; font-family: monospace; color: var(--accent-cyan);">${item.status}</span>
            <button class="btn-remove" data-id="${item.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">✕</button>
          </div>
        </div>
        ${item.status === 'PROCESSING' ? `
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${item.progress}%;"></div>
          </div>
          <div style="font-size: 10px; color: var(--text-muted); font-family: monospace; margin-top: 4px;">
            ${item.stage || ''}
          </div>
        ` : ''}
      `;
      queueContainer.appendChild(card);
    });

    // Wire remove buttons
    document.querySelectorAll('.btn-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        queue = queue.filter((i) => i.id !== id);
        renderQueue();
      });
    });
  }

  // File selection
  converterDropzone.addEventListener('click', async () => {
    if (window.electronAPI) {
      const files = await window.electronAPI.selectFiles();
      if (files && files.length > 0) {
        files.forEach((f) => {
          queue.push({
            id: 'file_' + Date.now() + Math.random().toString(36).substring(2, 6),
            name: f.name,
            size: f.size,
            type: f.name.split('.').pop() || 'FILE',
            status: 'QUEUED',
            progress: 0
          });
        });
        renderQueue();
      }
    }
  });

  // Execute Converter
  btnExecute.addEventListener('click', async () => {
    const queued = queue.filter((i) => i.status === 'QUEUED');
    if (queued.length === 0) {
      alert('No queued files ready for conversion.');
      return;
    }

    const payload = {
      outputFormat: formatSelect.value,
      options: {
        ocr: toggleOcr.checked,
        tableExtraction: toggleTable.checked,
        metadataStripper: toggleMetadata.checked
      }
    };

    if (window.electronAPI) {
      for (const item of queued) {
        item.status = 'PROCESSING';
        item.progress = 10;
        renderQueue();

        await window.electronAPI.startConversion({
          jobId: 'job_' + item.id,
          fileId: item.id,
          fileName: item.name,
          fileSize: item.size,
          inputFormat: item.type,
          outputFormat: payload.outputFormat,
          options: payload.options
        });
      }
    }
  });

  // Listen to IPC events if electronAPI is present
  if (window.electronAPI) {
    window.electronAPI.onConversionProgress((data) => {
      const target = queue.find((q) => q.id === data.fileId);
      if (target) {
        target.progress = data.progress;
        target.stage = data.stage;
        renderQueue();
      }
    });

    window.electronAPI.onConversionComplete((data) => {
      const target = queue.find((q) => q.id === data.fileId);
      if (target) {
        target.status = data.success ? 'COMPLETED' : 'FAILED';
        target.progress = 100;
        renderQueue();
      }
    });
  }

  // Metadata Tool File Select
  metadataDropzone.addEventListener('click', async () => {
    if (window.electronAPI) {
      const file = await window.electronAPI.selectMetadataFile();
      if (file) {
        metadataTargetFile = file;
        const inspection = await window.electronAPI.inspectMetadata(file);

        metadataTbody.innerHTML = '';
        inspection.properties.forEach((p) => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${p.label}</td>
            <td style="color: var(--accent-cyan);">${p.value}</td>
            <td>${p.category}</td>
            <td>${p.canBeStripped ? '<span style="color:var(--color-warning);">Strippable</span>' : '<span style="color:var(--text-muted);">Preserved</span>'}</td>
          `;
          metadataTbody.appendChild(row);
        });

        metadataDetails.style.display = 'block';
      }
    }
  });

  btnStripMeta.addEventListener('click', async () => {
    if (window.electronAPI && metadataTargetFile) {
      const result = await window.electronAPI.stripMetadata(metadataTargetFile);
      alert(`Clean document copy generated: ${result.cleanFileName}\nStripped fields: ${result.strippedFields.join(', ')}`);
    }
  });
});
