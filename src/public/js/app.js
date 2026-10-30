/**
 * @file app.js
 * @description Client-side application bootstrapper.
 * Instantiates the EventBus, ApiClient, SoundManager, AuthManager, GameEngine, and UIController.
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('🍌 Initializing Banana Quest Enterprise...');

  // 1. Core Event-Driven Bus
  const bus = window.eventBus;

  // 2. HTTP Interoperability Client
  const api = new window.ApiClient(bus);

  // 3. Web Audio Engine
  const sound = new window.SoundManager(bus);

  // 4. Virtual Identity Auth Manager
  const auth = new window.AuthManager(bus, api);

  // 5. Game Loop & State Machine
  const engine = new window.GameEngine(bus, api);

  // 6. View Controller
  const ui = new window.UIController(bus, api, auth, engine, sound);

  // Expose for browser debugging & demonstration in video
  window.app = { bus, api, sound, auth, engine, ui };

  bus.emit(window.EVENTS.APP_INIT, { version: '1.0.0', environment: 'production-ready' });
  console.log('✨ Banana Quest Enterprise Ready!');
});
