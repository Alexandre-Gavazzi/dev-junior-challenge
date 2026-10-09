import { AppController } from './app.controller.js';

describe('AppController', () => {
  it('responde o health', () => {
    expect(new AppController().health()).toEqual({ status: 'ok' });
  });
});
