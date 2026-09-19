import { useEffect, useState } from 'react';
import { Keyboard, Platform, KeyboardEvent, KeyboardEventName } from 'react-native';

export interface KeyboardState {
  visible: boolean;
  height: number;
  shownAt?: number;
}

const useKeyboard = (): KeyboardState => {
  const [state, setState] = useState<KeyboardState>({
    visible: false,
    height: 0,
  });

  useEffect(() => {
    const showEvents: KeyboardEventName[] =
      Platform.OS === 'ios'
        ? ['keyboardWillShow', 'keyboardDidShow']
        : ['keyboardDidShow'];

    const hideEvents: KeyboardEventName[] =
      Platform.OS === 'ios'
        ? ['keyboardWillHide', 'keyboardDidHide']
        : ['keyboardDidHide'];

    const listeners: Array<() => void> = [];

    showEvents.forEach((eventName) => {
      const sub = Keyboard.addListener(
        eventName,
        (event: KeyboardEvent) => {
          setState({
            visible: true,
            height: event?.endCoordinates?.height ?? 0,
            shownAt: Date.now(),
          });
        }
      );
      listeners.push(() => sub.remove());
    });

    hideEvents.forEach((eventName) => {
      const sub = Keyboard.addListener(eventName, () => {
        setState({ visible: false, height: 0 });
      });
      listeners.push(() => sub.remove());
    });

    return () => {
      listeners.forEach((remove) => remove());
    };
  }, []);

  return state;
};

export { useKeyboard };