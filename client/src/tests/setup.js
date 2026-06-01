import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

beforeAll(() => {
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);

    class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    }

    window.ResizeObserver = ResizeObserver;
    global.ResizeObserver = ResizeObserver;
});

afterEach(() => {
    localStorage.clear();
    cleanup();
});
