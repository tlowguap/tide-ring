(() => {
  const THEME_KEY = 'tide-ring-theme';
  const TUNING_KEY = 'tide-ring-tuning';
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const read = key => {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  };
  const write = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch (error) {}
  };

  const savedTheme = read(THEME_KEY);
  const savedPitch = Number(read(TUNING_KEY));
  const state = {
    themeOverride: ['light', 'dark'].includes(savedTheme) ? savedTheme : null,
    theme: ['light', 'dark'].includes(savedTheme) ? savedTheme : media.matches ? 'dark' : 'light',
    referencePitch: [432, 528].includes(savedPitch) ? savedPitch : 432,
  };
  const listeners = new Set();

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      state.theme === 'dark' ? '#071C24' : '#E6F3F8'
    );
  }
  function notify(change) {
    listeners.forEach(listener => listener(change, state));
  }

  const api = {
    state,
    toggleTheme() {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      state.themeOverride = state.theme;
      write(THEME_KEY, state.theme);
      applyTheme();
      notify('theme');
    },
    setReferencePitch(value) {
      const pitch = Number(value);
      if (![432, 528].includes(pitch) || pitch === state.referencePitch) return;
      state.referencePitch = pitch;
      write(TUNING_KEY, String(pitch));
      notify('tuning');
    },
    noteFrequency(semitones, referencePitch = state.referencePitch) {
      return referencePitch * Math.pow(2, semitones / 12);
    },
    sampleRate(referencePitch = state.referencePitch) {
      return referencePitch / 432;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };

  media.addEventListener?.('change', event => {
    if (state.themeOverride) return;
    state.theme = event.matches ? 'dark' : 'light';
    applyTheme();
    notify('theme');
  });

  window.TideRingSettings = api;
  applyTheme();
})();
