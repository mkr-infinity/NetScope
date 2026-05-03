export async function measureDownload(fileSizeMB: number = 5): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const bytes = fileSizeMB * 1_000_000;
    const url = `https://speed.cloudflare.com/__down?bytes=${bytes}`;
    const start = Date.now();
    const res = await fetch(url, { signal: controller.signal });
    await res.arrayBuffer();
    const seconds = (Date.now() - start) / 1000;
    if (seconds === 0) return 0;
    return Math.round((bytes * 8) / seconds / 1_000_000);
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

export async function measurePing(samples: number = 5): Promise<{ avg: number; jitter: number }> {
  const times: number[] = [];
  for (let i = 0; i < samples; i++) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    try {
      const start = Date.now();
      await fetch('https://www.gstatic.com/generate_204', { cache: 'no-store', signal: controller.signal });
      times.push(Date.now() - start);
    } catch {
      times.push(999);
    }
    if (i < samples - 1) await new Promise(r => setTimeout(r, 200));
  }
  if (times.length === 0) return { avg: 0, jitter: 0 };
  const avg = Math.round(times.reduce((a, b) => a + b) / times.length);
  const jitter = Math.round(Math.max(...times) - Math.min(...times));
  return { avg, jitter };
}

export async function measureUpload(): Promise<number> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const blob = new Blob([new ArrayBuffer(2_000_000)]);
    const start = Date.now();
    await fetch('https://httpbin.org/post', { method: 'POST', body: blob, signal: controller.signal });
    const seconds = (Date.now() - start) / 1000;
    if (seconds === 0) return 0;
    return Math.round((2_000_000 * 8) / seconds / 1_000_000);
  } catch {
    return 0;
  } finally {
    clearTimeout(timer);
  }
}
