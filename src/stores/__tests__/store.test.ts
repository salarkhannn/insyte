import { describe, it, expect } from 'vitest';
import { create } from 'zustand';

describe('Store Tests', () => {
  it('should initialize with default state', () => {
    interface TestState {
      count: number;
      increment: () => void;
    }

    const useTestStore = create<TestState>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    const { count } = useTestStore.getState();
    expect(count).toBe(0);
  });

  it('should update state correctly', () => {
    interface TestState {
      value: string;
      setValue: (val: string) => void;
    }

    const useTestStore = create<TestState>((set) => ({
      value: '',
      setValue: (val) => set({ value: val }),
    }));

    const { setValue } = useTestStore.getState();
    setValue('test');

    const { value } = useTestStore.getState();
    expect(value).toBe('test');
  });
});
