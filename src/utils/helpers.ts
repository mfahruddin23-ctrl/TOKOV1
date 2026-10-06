/**
 * Helper utilitas umum untuk TokoApp
 */

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatTanggal(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Play synthesizer beep sound for barcode scanner
 */
export function playBeepSound(type: 'beep' | 'success' | 'cash' = 'beep') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'beep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'cash') {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(987.77, now); // B5
      osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.12);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    }
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}

/**
 * Generate a visual Code-128 style Barcode as SVG
 */
export function generateBarcodeSvg(text: string, height = 48): string {
  if (!text) return '';
  // Generate deterministic bar widths from characters
  const safeText = String(text).toUpperCase();
  const bars: number[] = [2, 1, 1, 2]; // Start guard

  for (let i = 0; i < safeText.length; i++) {
    const code = safeText.charCodeAt(i);
    // 4 alternating bar/space values based on char code
    bars.push((code % 3) + 1);
    bars.push(((code >> 2) % 3) + 1);
    bars.push(((code >> 4) % 2) + 1);
    bars.push(((code >> 1) % 2) + 1);
  }
  bars.push(2, 1, 2); // Stop guard

  let x = 10;
  const rects: string[] = [];
  let isBar = true;

  bars.forEach((width) => {
    const w = width * 2;
    if (isBar) {
      rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#0f172a" />`);
    }
    x += w;
    isBar = !isBar;
  });

  const totalWidth = x + 10;
  return `<svg viewBox="0 0 ${totalWidth} ${height + 18}" xmlns="http://www.w3.org/2000/svg" class="w-full max-w-[240px] h-auto">
    ${rects.join('')}
    <text x="${totalWidth / 2}" y="${height + 14}" text-anchor="middle" font-family="monospace" font-size="11" font-weight="600" fill="#334155">${text}</text>
  </svg>`;
}
